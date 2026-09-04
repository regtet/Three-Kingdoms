import type {
  City,
  DiplomaticRelation,
  Faction,
  GameState,
  General,
  LogEntry,
  ScenarioData,
} from '../models/types';
import { SAVE_VERSION } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { applyCustomGeneralsToScenario } from './customGenerals';
import { resetGeneralActions } from '../systems/actionGuard';

export function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function findCity(state: GameState, cityId: string): City {
  const city = state.cities.find((c) => c.id === cityId);
  if (!city) throw new Error(`City not found: ${cityId}`);
  return city;
}

export function findGeneral(state: GameState, generalId: string): General {
  const general = state.generals.find((g) => g.id === generalId);
  if (!general) throw new Error(`General not found: ${generalId}`);
  return general;
}

export function findFaction(state: GameState, factionId: string): Faction {
  const faction = state.factions.find((f) => f.id === factionId);
  if (!faction) throw new Error(`Faction not found: ${factionId}`);
  return faction;
}

export function getCityGenerals(state: GameState, cityId: string): General[] {
  const city = findCity(state, cityId);
  return city.generalIds.map((id) => findGeneral(state, id));
}

export function getDefendingGeneral(state: GameState, cityId: string): General | null {
  const city = findCity(state, cityId);
  if (city.governorId) {
    const gov = state.generals.find((g) => g.id === city.governorId);
    if (gov && gov.status !== 'marching') return gov;
  }
  const generals = getCityGenerals(state, cityId).filter((g) => g.status !== 'marching');
  if (generals.length === 0) return null;
  return generals.reduce((best, g) => (g.leadership > best.leadership ? g : best));
}

export function getFactionCities(state: GameState, factionId: string): City[] {
  return state.cities.filter((c) => c.factionId === factionId);
}

export function areNeighbors(state: GameState, fromId: string, toId: string): boolean {
  return findCity(state, fromId).neighbors.includes(toId);
}

export function addLog(
  state: GameState,
  message: string,
  type: LogEntry['type'] = 'info',
): void {
  state.actionLog.unshift({ turn: state.turn, message, type });
  if (state.actionLog.length > 40) state.actionLog.length = 40;
}

export function advanceMonth(state: GameState): void {
  state.month += 1;
  if (state.month > 12) {
    state.month = 1;
    state.year += 1;
  }
}

export function getMaxTroops(city: City): number {
  return Math.floor(city.population * FORMULAS.recruit.troopsPerPopulation);
}

export function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function initRelations(factionIds: string[]): DiplomaticRelation[] {
  const relations: DiplomaticRelation[] = [];
  for (let i = 0; i < factionIds.length; i++) {
    for (let j = i + 1; j < factionIds.length; j++) {
      relations.push({
        factionA: factionIds[i],
        factionB: factionIds[j],
        status: 'hostile',
        duration: 0,
        relationScore: 0,
      });
    }
  }
  return relations;
}

export function createNewGame(scenario: ScenarioData, playerFactionId: string): GameState {
  const factions: Faction[] = scenario.factions.map((f) => ({
    ...f,
    isPlayer: f.id === playerFactionId,
    isEliminated: false,
  }));

  const generalDefs = applyCustomGeneralsToScenario(scenario.generals);
  const generals: General[] = generalDefs.map((g) => ({
    ...g,
    age: g.age ?? 30 + (g.name.charCodeAt(0) % 25),
    status: 'idle' as const,
    actionUsed: false,
  }));

  const cities: City[] = scenario.cities.map((c) => {
    const generalIds = generalDefs.filter((g) => g.cityId === c.id).map((g) => g.id);
    const governor =
      generalDefs
        .filter((g) => g.cityId === c.id)
        .sort((a, b) => b.leadership - a.leadership)[0]?.id ?? null;
    return {
      id: c.id,
      name: c.name,
      factionId: c.initialFactionId,
      x: c.x,
      y: c.y,
      population: c.population,
      gold: c.gold,
      food: c.food,
      troops: c.troops,
      commerce: c.commerce,
      agriculture: c.agriculture,
      loyalty: c.loyalty,
      order: 80,
      disaster: 'none',
      governorId: governor,
      generalIds,
      neighbors: [...c.neighbors],
      domesticDone: false,
    };
  });

  return {
    saveVersion: SAVE_VERSION,
    scenarioId: scenario.id,
    turn: 1,
    year: scenario.startYear,
    month: scenario.startMonth,
    phase: 'player',
    factions,
    cities,
    generals,
    relations: initRelations(scenario.factions.map((f) => f.id)),
    playerFactionId,
    actionLog: [{ turn: 1, message: `游戏开始：${scenario.name}`, type: 'info' }],
    wildGenerals: (scenario.wildGenerals ?? []).map((w) => ({ ...w })),
    transportMissions: [],
    strategyEffects: [],
    envoyMissions: [],
  };
}

export function randomVariance(variance: number): number {
  return 1 + (Math.random() * 2 - 1) * variance;
}

export function resetDomesticFlags(state: GameState): void {
  for (const city of state.cities) city.domesticDone = false;
  resetGeneralActions(state);
}
