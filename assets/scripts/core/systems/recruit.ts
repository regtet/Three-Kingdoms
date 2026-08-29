import type { ActionResult, GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, findCity, getMaxTroops } from '../utils/helpers';

function recruitEfficiency(city: ReturnType<typeof findCity>): number {
  const f = FORMULAS.recruitEfficiency;
  if (city.order < f.minOrder || city.loyalty < f.minLoyalty) {
    return Math.max(0.3, (city.order / 100) * (city.loyalty / 100));
  }
  return 1;
}

export function recruitTroops(state: GameState, cityId: string, amount: number): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  if (amount <= 0) return { success: false, message: '征兵数量须大于 0' };

  const city = findCity(state, cityId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能在自己的城池征兵' };

  const eff = recruitEfficiency(city);
  const actual = Math.max(1, Math.floor(amount * eff));
  if (eff < 0.5) {
    return { success: false, message: `治安或民忠过低（${Math.floor(eff * 100)}%效率），无法征兵` };
  }

  const maxTroops = getMaxTroops(city);
  if (city.troops + actual > maxTroops) {
    return { success: false, message: `兵力上限 ${maxTroops}（人口 ${city.population}）` };
  }

  const goldCost = actual * FORMULAS.recruit.goldPerTroop;
  const foodCost = actual * FORMULAS.recruit.foodPerTroop;
  if (city.gold < goldCost) return { success: false, message: `金钱不足（需要 ${goldCost}，本城 ${city.gold}）` };
  if (city.food < foodCost) return { success: false, message: `粮食不足（需要 ${foodCost}，本城 ${city.food}）` };

  city.gold -= goldCost;
  city.food -= foodCost;
  city.troops += actual;
  const effNote = eff < 1 ? `（效率${Math.floor(eff * 100)}%）` : '';
  addLog(state, `${city.name} 征兵 ${actual}${effNote}（耗金${goldCost} 粮${foodCost}）`, 'military');
  return { success: true, message: `征兵 ${actual} 完成${effNote}` };
}

export function aiRecruit(state: GameState, cityId: string, amount: number): boolean {
  if (amount <= 0) return false;
  const city = findCity(state, cityId);
  const eff = recruitEfficiency(city);
  const actual = Math.min(Math.floor(amount * eff), getMaxTroops(city) - city.troops);
  if (actual <= 0) return false;
  const goldCost = actual * FORMULAS.recruit.goldPerTroop;
  const foodCost = actual * FORMULAS.recruit.foodPerTroop;
  if (city.gold < goldCost || city.food < foodCost) return false;
  city.gold -= goldCost;
  city.food -= foodCost;
  city.troops += actual;
  return true;
}

export function getMaxRecruitAmount(state: GameState, cityId: string): number {
  const city = findCity(state, cityId);
  const { goldPerTroop, foodPerTroop } = FORMULAS.recruit;
  const eff = recruitEfficiency(city);
  const room = getMaxTroops(city) - city.troops;
  if (room <= 0) return 0;
  const byGold = Math.floor(city.gold / goldPerTroop);
  const byFood = Math.floor(city.food / foodPerTroop);
  return Math.max(0, Math.floor(Math.min(room, byGold, byFood) * eff));
}

export function getRecruitEfficiency(state: GameState, cityId: string): number {
  return recruitEfficiency(findCity(state, cityId));
}
