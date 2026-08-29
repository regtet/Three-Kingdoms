import type { ActionResult, GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, clampStat, findCity } from '../utils/helpers';

function checkDomestic(state: GameState, cityId: string): ActionResult | null {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能对自己的城池内政' };
  if (city.domesticDone) return { success: false, message: '本城本月已执行内政' };
  return null;
}

/** 开发：提升商业（官方核心） */
export function developCity(state: GameState, cityId: string): ActionResult {
  const err = checkDomestic(state, cityId);
  if (err) return err;
  const city = findCity(state, cityId);
  const { goldCost, commerceGain, populationGain } = FORMULAS.develop;
  if (city.gold < goldCost) {
    return { success: false, message: `金钱不足（需要 ${goldCost}，本城 ${city.gold}）` };
  }
  city.gold -= goldCost;
  city.commerce = clampStat(city.commerce + commerceGain, 0, 999);
  city.population += populationGain;
  city.domesticDone = true;
  addLog(state, `${city.name} 开发：商业+${commerceGain}（现${city.commerce}）`, 'domestic');
  return { success: true, message: `开发完成，商业 ${city.commerce}` };
}

/** 开垦：提升农业 */
export function farmCity(state: GameState, cityId: string): ActionResult {
  const err = checkDomestic(state, cityId);
  if (err) return err;
  const city = findCity(state, cityId);
  const { goldCost, agricultureGain } = FORMULAS.farm;
  if (city.gold < goldCost) {
    return { success: false, message: `金钱不足（需要 ${goldCost}，本城 ${city.gold}）` };
  }
  city.gold -= goldCost;
  city.agriculture = clampStat(city.agriculture + agricultureGain, 0, 999);
  city.domesticDone = true;
  addLog(state, `${city.name} 开垦：农业+${agricultureGain}（现${city.agriculture}）`, 'domestic');
  return { success: true, message: `开垦完成，农业 ${city.agriculture}` };
}

/** 治理：提升民忠/治安，概率消除灾难 */
export function governCity(state: GameState, cityId: string): ActionResult {
  const err = checkDomestic(state, cityId);
  if (err) return err;
  const city = findCity(state, cityId);
  const f = FORMULAS.govern;
  if (city.gold < f.goldCost) {
    return { success: false, message: `金钱不足（需要 ${f.goldCost}，本城 ${city.gold}）` };
  }
  city.gold -= f.goldCost;
  city.loyalty = clampStat(city.loyalty + f.loyaltyGain, 0, 100);
  city.order = clampStat(city.order + f.orderGain, 0, 100);
  if (city.disaster !== 'none' && Math.random() < f.disasterHealChance) {
    city.disaster = 'none';
    addLog(state, `${city.name} 治理：灾难已平息`, 'domestic');
  }
  city.domesticDone = true;
  addLog(state, `${city.name} 治理：民忠${city.loyalty} 治安${city.order}`, 'domestic');
  return { success: true, message: '治理完成' };
}

export function aiDevelopCity(state: GameState, cityId: string): boolean {
  const city = findCity(state, cityId);
  if (city.domesticDone || city.commerce >= FORMULAS.ai.developThresholdCommerce) return false;
  if (city.gold < FORMULAS.develop.goldCost) return false;
  city.gold -= FORMULAS.develop.goldCost;
  city.commerce = clampStat(city.commerce + FORMULAS.develop.commerceGain, 0, 999);
  city.domesticDone = true;
  return true;
}

export function aiFarmCity(state: GameState, cityId: string): boolean {
  const city = findCity(state, cityId);
  if (city.domesticDone || city.agriculture >= FORMULAS.ai.farmThresholdAgriculture) return false;
  if (city.gold < FORMULAS.farm.goldCost) return false;
  city.gold -= FORMULAS.farm.goldCost;
  city.agriculture = clampStat(city.agriculture + FORMULAS.farm.agricultureGain, 0, 999);
  city.domesticDone = true;
  return true;
}

/** AI 治理（不限每城一次内政标记，低消耗简化） */
export function aiGovernCity(state: GameState, cityId: string): boolean {
  const city = findCity(state, cityId);
  const f = FORMULAS.govern;
  if (city.gold < f.goldCost) return false;
  city.gold -= f.goldCost;
  city.loyalty = clampStat(city.loyalty + f.loyaltyGain, 0, 100);
  city.order = clampStat(city.order + f.orderGain, 0, 100);
  if (city.disaster !== 'none' && Math.random() < f.disasterHealChance) {
    city.disaster = 'none';
  }
  return true;
}
