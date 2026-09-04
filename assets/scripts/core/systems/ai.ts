import type { GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, findCity, findGeneral, getCityGenerals, getFactionCities } from '../utils/helpers';
import { getActableGeneralsInCity } from './actionGuard';
import { executeTransport } from './transport';
import { aiDevelopCity, aiFarmCity } from './domestic';
import { aiRecruit } from './recruit';
import { aiExecuteAttack } from './battle';
import { runAiDiplomacy } from './aiDiplomacy';
import type { BattleInput } from '../models/types';
import { canAttackFaction } from './diplomacy';
import { runAiStratagem, runAiGovern, pickAiSecondaryGeneral } from './aiStratagem';

type ScoredAttack = BattleInput & { _score: number };

function pickAttackTargets(state: GameState, factionId: string): BattleInput[] {
  const results: ScoredAttack[] = [];
  const cities = getFactionCities(state, factionId);

  for (const city of cities) {
    if (city.troops < FORMULAS.ai.minTroopsToAttack) continue;
    const generals = getCityGenerals(state, city.id).filter(
      (g) => g.status !== 'marching' && g.status !== 'injured' && !g.actionUsed,
    );
    if (generals.length === 0) continue;
    const general = generals.reduce((a, b) => (a.leadership > b.leadership ? a : b));

    for (const neighborId of city.neighbors) {
      const neighbor = findCity(state, neighborId);
      if (neighbor.factionId === factionId) continue;
      if (!canAttackFaction(state, factionId, neighbor.factionId)) continue;
      const score = city.troops / Math.max(neighbor.troops, 1);
      const troops = Math.floor(city.troops * 0.65);
      results.push({
        attackerGeneralId: general.id,
        attackerTroops: Math.max(troops, FORMULAS.ai.minTroopsToAttack),
        fromCityId: city.id,
        targetCityId: neighborId,
        secondaryGeneralId: pickAiSecondaryGeneral(state, city.id, general.id),
        tryDuel: general.force >= FORMULAS.battle.duelMinForce,
        _score: score,
      });
    }
  }

  return results
    .sort((a, b) => b._score - a._score)
    .slice(0, 2)
    .map(({ _score, ...rest }) => rest);
}

function aiTransportResources(state: GameState, factionId: string): void {
  const cities = getFactionCities(state, factionId);
  const rich = cities.filter((c) => c.gold > 300 || c.food > 400).sort((a, b) => b.gold + b.food - (a.gold + a.food));
  const poor = cities.filter((c) => c.troops > 500 && (c.gold < 100 || c.food < 150));
  if (!rich.length || !poor.length) return;
  const from = rich[0];
  const to = poor.find((p) => from.neighbors.includes(p.id));
  if (!to) return;
  const gold = Math.min(80, Math.floor(from.gold * 0.2));
  const food = Math.min(80, Math.floor(from.food * 0.2));
  if (gold + food < 20) return;
  const actable = getActableGeneralsInCity(state, from.id, factionId);
  const general = actable.sort((a, b) => b.leadership - a.leadership)[0];
  if (!general) return;
  executeTransport(state, {
    fromCityId: from.id,
    toCityId: to.id,
    generalId: general.id,
    gold,
    food,
    troops: 0,
  }, factionId);
}

export function runAiTurn(state: GameState): void {
  runAiDiplomacy(state);

  const aiFactions = state.factions.filter((f) => !f.isPlayer && !f.isEliminated);

  for (const faction of aiFactions) {
    runAiStratagem(state, faction.id);
    aiTransportResources(state, faction.id);

    const cities = getFactionCities(state, faction.id);
    for (const city of cities) {
      aiDevelopCity(state, city.id);
      aiFarmCity(state, city.id);
      runAiGovern(state, faction.id);
      const need = FORMULAS.ai.recruitTargetTroops - city.troops;
      if (need > 0) aiRecruit(state, city.id, Math.min(need, 300));
    }

    const attacks = pickAttackTargets(state, faction.id);
    for (const attack of attacks) {
      const from = findCity(state, attack.fromCityId);
      attack.attackerTroops = Math.min(attack.attackerTroops, from.troops);
      const atkGen = findGeneral(state, attack.attackerGeneralId);
      const ambush = FORMULAS.stratagem.ambush;
      if (
        atkGen.intelligence >= ambush.minIntelligence
        && from.gold >= ambush.goldCost
        && from.food >= ambush.foodCost
        && Math.random() < 0.35
      ) {
        attack.stratagemId = 'ambush';
      }
      if (attack.attackerTroops >= FORMULAS.ai.minTroopsToAttack) {
        aiExecuteAttack(state, attack);
      }
    }
  }

  addLog(state, 'AI 回合结束', 'ai');
}
