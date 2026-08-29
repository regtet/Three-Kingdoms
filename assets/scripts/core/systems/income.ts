import type { City, GameState, General } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, clampStat, findCity, findGeneral, resetDomesticFlags } from '../utils/helpers';
import { processDefections } from './personnel';

/** 太守政治加成 */
function governorBonus(governor: General | null | undefined, politicsWeight = 0.002): number {
  if (!governor) return 1;
  return 1 + governor.politics * politicsWeight;
}

/** 计算城池月度金钱收入 */
export function calcGoldIncome(city: City, governor?: General | null): number {
  const f = FORMULAS.income;
  const base = city.commerce * f.goldPerCommerce * city.population * f.populationFactor / 1000;
  return Math.floor(base * governorBonus(governor));
}

/** 计算城池月度粮食收入 */
export function calcFoodIncome(city: City, governor?: General | null): number {
  const f = FORMULAS.income;
  const base = city.agriculture * f.foodPerAgriculture * city.population * f.populationFactor / 1000;
  return Math.floor(base * governorBonus(governor, 0.0015));
}

/** 计算城池月度兵粮消耗 */
export function calcTroopUpkeep(city: City): number {
  return Math.ceil(city.troops * FORMULAS.upkeep.foodPerTroop);
}

function rollDisaster(city: City): void {
  if (city.disaster !== 'none') return;
  if (city.order < 40 && Math.random() < 0.08) city.disaster = 'flood';
  else if (city.loyalty < 30 && Math.random() < 0.06) city.disaster = 'plague';
  else if (city.agriculture > 130 && Math.random() < 0.05) city.disaster = 'locusts';
}

function applyDisasterEffects(city: City): void {
  if (city.disaster === 'none') return;
  city.population = Math.max(1000, city.population - Math.floor(city.population * 0.02));
  city.food = Math.max(0, city.food - 50);
  city.loyalty = clampStat(city.loyalty - 2, 0, 100);
}

function applyGeneralLoyalty(state: GameState): void {
  const decay = FORMULAS.loyalty.generalMonthlyDecay;
  const threshold = FORMULAS.loyalty.defectionThreshold;
  for (const g of state.generals) {
    if (g.status === 'governor') continue;
    g.loyalty = clampStat(g.loyalty - decay, 0, 100);
    if (g.loyalty < threshold && g.factionId === state.playerFactionId) {
      addLog(state, `${g.name} 忠诚过低（${g.loyalty}），有叛逃风险`, 'personnel');
    }
  }
}

function applyTroopUpkeep(state: GameState): void {
  for (const city of state.cities) {
    if (!city.factionId || state.factions.find((f) => f.id === city.factionId)?.isEliminated) continue;
    const cost = calcTroopUpkeep(city);
    if (cost <= 0) continue;
    city.food -= cost;
    if (city.food < 0) {
      const deficit = -city.food;
      city.food = 0;
      const desert = Math.floor(city.troops * FORMULAS.upkeep.desertionRatio * (deficit / Math.max(cost, 1)));
      if (desert > 0) {
        city.troops = Math.max(0, city.troops - desert);
        addLog(state, `${city.name} 粮尽，逃兵 ${desert}`, 'military');
      }
    } else if (cost > 0) {
      addLog(state, `${city.name} 兵饷 粮-${cost}`, 'military');
    }
  }
}

/** 官方流程：每月结算 */
export function monthlySettlement(state: GameState): void {
  for (const city of state.cities) {
    if (city.factionId && !state.factions.find((f) => f.id === city.factionId)?.isEliminated) {
      const gov = city.governorId ? findGeneral(state, city.governorId) : null;
      const goldIn = calcGoldIncome(city, gov);
      const foodIn = calcFoodIncome(city, gov);
      city.gold += goldIn;
      city.food += foodIn;
      if (goldIn + foodIn > 0) {
        addLog(state, `${city.name} 月收入：金+${goldIn} 粮+${foodIn}`, 'domestic');
      }
    }
    city.loyalty = clampStat(city.loyalty - FORMULAS.loyalty.monthlyDecay, 0, 100);
    rollDisaster(city);
    applyDisasterEffects(city);
  }

  applyTroopUpkeep(state);
  applyGeneralLoyalty(state);
  processDefections(state);

  for (const rel of state.relations) {
    if (rel.duration > 0) {
      rel.duration -= 1;
      if (rel.duration === 0 && (rel.status === 'truce' || rel.status === 'allied')) {
        rel.status = 'hostile';
        rel.relationScore = Math.min(rel.relationScore ?? 0, 29);
        addLog(state, `${rel.factionA} 与 ${rel.factionB} 外交状态恢复为敌对`, 'diplomacy');
      }
    }
  }

  resetDomesticFlags(state);
  for (const g of state.generals) {
    if (g.status === 'injured') g.status = 'idle';
    if (g.status === 'marching') g.status = 'idle';
  }
}
