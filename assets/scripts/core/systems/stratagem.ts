import type { ActionResult, GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, findCity, findGeneral, getCityGenerals } from '../utils/helpers';
import { canGeneralAct, canAiGeneralAct, markGeneralActed, getActableGeneralsInCity } from './actionGuard';
import { addStrategyEffect, pickStratagemTargetGeneral } from './strategyEffects';

function validateStratagemBase(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
  minIntelligence: number,
  playerOnly = true,
): ActionResult | null {
  if (playerOnly && state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);

  if (city.factionId !== factionId) return { success: false, message: '只能在本城施计' };
  if (general.cityId !== cityId) return { success: false, message: '武将须在本城' };
  if (general.intelligence < minIntelligence) {
    return { success: false, message: `智力不足（需要 ${minIntelligence}）` };
  }
  if (!city.neighbors.includes(targetCityId)) return { success: false, message: '只能对相邻城施计' };
  if (target.factionId === city.factionId) return { success: false, message: '不能对本城施计' };
  const act = playerOnly
    ? canGeneralAct(state, generalId)
    : (canAiGeneralAct(state, generalId) ? { ok: true, message: '' } : { ok: false, message: '武将无法行动' });
  if (!act.ok) return { success: false, message: act.message };
  return null;
}

/** 计略成功率（智力对抗） */
export function calcStratagemSuccessRate(attackerInt: number, defenderInt: number): number {
  const f = FORMULAS.stratagem;
  const rate = f.baseSuccessRate + (attackerInt - defenderInt) * f.intelligenceFactor;
  return Math.max(0.15, Math.min(0.92, rate));
}

function rollStratagemSuccess(state: GameState, generalId: string, targetCityId: string): boolean {
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  const defenders = getCityGenerals(state, targetCityId);
  const defInt = defenders.length
    ? Math.max(...defenders.map((g) => g.intelligence))
    : 50;
  const rate = calcStratagemSuccessRate(general.intelligence, defInt);
  return Math.random() < rate;
}

function doFireAttack(state: GameState, cityId: string, generalId: string, targetCityId: string, aiTag = ''): ActionResult | null {
  const f = FORMULAS.stratagem.fireAttack;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };
  if (city.food < f.foodCost) return { success: false, message: '粮食不足' };

  city.gold -= f.goldCost;
  city.food -= f.foodCost;
  markGeneralActed(general);

  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${aiTag}${general.name} 火计 ${target.name} 失败`, 'stratagem');
    return { success: false, message: '火计被识破，未能生效' };
  }

  const damage = Math.floor(target.troops * f.troopDamageRatio);
  target.troops = Math.max(0, target.troops - damage);

  addLog(state, `${aiTag}${general.name} 对 ${target.name} 火计，敌损 ${damage} 兵`, 'stratagem');
  return { success: true, message: `火计成功，敌损 ${damage} 兵` };
}

/** 火计：消耗敌兵力 */
export function useFireAttack(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  const f = FORMULAS.stratagem.fireAttack;
  const err = validateStratagemBase(state, state.playerFactionId, cityId, generalId, targetCityId, f.minIntelligence);
  if (err) return err;
  return doFireAttack(state, cityId, generalId, targetCityId)!;
}

export function aiFireAttack(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  const f = FORMULAS.stratagem.fireAttack;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, false);
  if (err) return false;
  const r = doFireAttack(state, cityId, generalId, targetCityId, '[AI] ');
  return r?.success ?? false;
}

/** 离间：降低敌城民忠 */
export function useSowDiscord(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  const f = FORMULAS.stratagem.sowDiscord;
  const err = validateStratagemBase(state, state.playerFactionId, cityId, generalId, targetCityId, f.minIntelligence);
  if (err) return err;

  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };

  city.gold -= f.goldCost;
  markGeneralActed(general);

  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${general.name} 离间 ${target.name} 失败`, 'stratagem');
    return { success: false, message: '离间失败' };
  }

  target.loyalty = Math.max(0, target.loyalty - f.loyaltyLoss);

  addLog(state, `${general.name} 离间 ${target.name}，民忠 ${target.loyalty}`, 'stratagem');
  return { success: true, message: `离间成功，${target.name} 民忠 ${target.loyalty}` };
}

export function aiSowDiscord(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  const f = FORMULAS.stratagem.sowDiscord;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, false);
  if (err) return false;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return false;
  city.gold -= f.goldCost;
  markGeneralActed(general);
  if (!rollStratagemSuccess(state, generalId, targetCityId)) return false;
  target.loyalty = Math.max(0, target.loyalty - f.loyaltyLoss);
  addLog(state, `[AI] ${general.name} 离间 ${target.name}`, 'stratagem');
  return true;
}

/** 扰乱：降低敌城治安 */
export function useDisrupt(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  const f = FORMULAS.stratagem.disrupt;
  const err = validateStratagemBase(state, state.playerFactionId, cityId, generalId, targetCityId, f.minIntelligence);
  if (err) return err;

  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };

  city.gold -= f.goldCost;
  markGeneralActed(general);

  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${general.name} 扰乱 ${target.name} 失败`, 'stratagem');
    return { success: false, message: '扰乱失败' };
  }

  target.order = Math.max(0, target.order - f.orderLoss);

  addLog(state, `${general.name} 扰乱 ${target.name}，治安 ${target.order}`, 'stratagem');
  return { success: true, message: `扰乱成功，${target.name} 治安 ${target.order}` };
}

export function aiDisrupt(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  const f = FORMULAS.stratagem.disrupt;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, false);
  if (err) return false;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return false;
  city.gold -= f.goldCost;
  markGeneralActed(general);
  if (!rollStratagemSuccess(state, generalId, targetCityId)) return false;
  target.order = Math.max(0, target.order - f.orderLoss);
  addLog(state, `[AI] ${general.name} 扰乱 ${target.name}`, 'stratagem');
  return true;
}

/** 伏兵：出征时附带，开战前突袭 */
export function canUseAmbush(
  state: GameState,
  cityId: string,
  generalId: string,
): ActionResult {
  const f = FORMULAS.stratagem.ambush;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  if (general.cityId !== cityId) return { success: false, message: '武将须在本城' };
  if (general.intelligence < f.minIntelligence) {
    return { success: false, message: `智力不足（需要 ${f.minIntelligence}）` };
  }
  if (city.gold < f.goldCost) return { success: false, message: '伏兵金钱不足' };
  if (city.food < f.foodCost) return { success: false, message: '伏兵粮食不足' };
  return { success: true, message: '可施伏兵' };
}

export function applyAmbush(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): { damage: number; log: string } | null {
  const check = canUseAmbush(state, cityId, generalId);
  if (!check.success) return null;

  const f = FORMULAS.stratagem.ambush;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);

  city.gold -= f.goldCost;
  city.food -= f.foodCost;

  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${general.name} 伏兵 ${target.name} 失败`, 'stratagem');
    return null;
  }

  const damage = Math.floor(target.troops * f.troopDamageRatio);
  target.troops = Math.max(0, target.troops - damage);

  const log = `${general.name} 伏兵突袭 ${target.name}，敌损 ${damage} 兵`;
  addLog(state, log, 'stratagem');
  return { damage, log };
}

/** 获取可施计武将（按智力排序，未行动） */
export function getStratagemGenerals(state: GameState, cityId: string, minIntelligence: number) {
  return getActableGeneralsInCity(state, cityId)
    .filter((g) => g.intelligence >= minIntelligence)
    .sort((a, b) => b.intelligence - a.intelligence);
}

/** 伪报：大幅降低敌城治安 */
export function useFakeReport(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  const f = FORMULAS.stratagem.fakeReport;
  const err = validateStratagemBase(state, state.playerFactionId, cityId, generalId, targetCityId, f.minIntelligence);
  if (err) return err;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };
  city.gold -= f.goldCost;
  markGeneralActed(general);
  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${general.name} 伪报 ${target.name} 失败`, 'stratagem');
    return { success: false, message: '伪报失败' };
  }
  target.order = Math.max(0, target.order - f.orderLoss);
  addLog(state, `${general.name} 伪报 ${target.name}，治安 ${target.order}`, 'stratagem');
  return { success: true, message: `伪报成功，${target.name} 治安 ${target.order}` };
}

/** 鼓舞：提升本城民忠 */
export function useInspire(state: GameState, cityId: string, generalId: string): ActionResult {
  const f = FORMULAS.stratagem.inspire;
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能在本城施计' };
  if (general.cityId !== cityId) return { success: false, message: '武将须在本城' };
  if (general.intelligence < f.minIntelligence) return { success: false, message: `智力不足（需要 ${f.minIntelligence}）` };
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };
  const act = canGeneralAct(state, generalId);
  if (!act.ok) return { success: false, message: act.message };
  city.gold -= f.goldCost;
  markGeneralActed(general);
  city.loyalty = Math.min(100, city.loyalty + f.loyaltyGain);
  addLog(state, `${general.name} 鼓舞 ${city.name}，民忠 ${city.loyalty}`, 'stratagem');
  return { success: true, message: `鼓舞成功，民忠 ${city.loyalty}` };
}

export function aiFakeReport(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  const f = FORMULAS.stratagem.fakeReport;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, false);
  if (err) return false;
  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  const target = findCity(state, targetCityId);
  if (city.gold < f.goldCost) return false;
  city.gold -= f.goldCost;
  markGeneralActed(general);
  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `[AI] ${general.name} 伪报 ${target.name} 失败`, 'stratagem');
    return false;
  }
  target.order = Math.max(0, target.order - f.orderLoss);
  addLog(state, `[AI] ${general.name} 伪报 ${target.name}，治安 ${target.order}`, 'stratagem');
  return true;
}

/** 伪书疑心：降低敌将忠诚并挂延迟侵蚀 */
function doUndermineLoyalty(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
  factionId: string,
  playerOnly: boolean,
): ActionResult {
  const f = FORMULAS.stratagem.undermineLoyalty;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, playerOnly);
  if (err) return err;

  const targetGen = pickStratagemTargetGeneral(state, targetCityId);
  if (!targetGen) return { success: false, message: '敌城无守将' };

  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };

  city.gold -= f.goldCost;
  markGeneralActed(general);

  const aiTag = playerOnly ? '' : '[AI] ';
  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${aiTag}${general.name} 伪书 ${targetGen.name} 失败`, 'stratagem');
    return { success: false, message: '伪书疑心失败' };
  }

  targetGen.loyalty = Math.max(0, targetGen.loyalty - f.loyaltyLoss);
  addStrategyEffect(state, {
    type: 'loyalty_erosion',
    sourceFactionId: factionId,
    sourceGeneralId: generalId,
    targetGeneralId: targetGen.id,
    magnitude: Math.max(4, Math.floor(f.loyaltyLoss * 0.6)),
    turnsRemaining: f.durationMonths,
  });

  addLog(state, `${aiTag}${general.name} 伪书疑心 ${targetGen.name}，忠诚 ${targetGen.loyalty}`, 'stratagem');
  return {
    success: true,
    message: `${targetGen.name} 忠诚 ${targetGen.loyalty}，流言持续 ${f.durationMonths} 月`,
  };
}

export function useUndermineLoyalty(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  return doUndermineLoyalty(state, cityId, generalId, targetCityId, state.playerFactionId, true);
}

/** 敌中作敌：对敌将施加寝返标记，战时可能倒戈 */
function doSleeper(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
  factionId: string,
  playerOnly: boolean,
): ActionResult {
  const f = FORMULAS.stratagem.sleeper;
  const err = validateStratagemBase(state, factionId, cityId, generalId, targetCityId, f.minIntelligence, playerOnly);
  if (err) return err;

  const targetGen = pickStratagemTargetGeneral(state, targetCityId);
  if (!targetGen) return { success: false, message: '敌城无守将' };

  const city = findCity(state, cityId);
  const general = findGeneral(state, generalId);
  if (city.gold < f.goldCost) return { success: false, message: '金钱不足' };

  city.gold -= f.goldCost;
  markGeneralActed(general);

  const aiTag = playerOnly ? '' : '[AI] ';
  if (!rollStratagemSuccess(state, generalId, targetCityId)) {
    addLog(state, `${aiTag}${general.name} 对 ${targetGen.name} 策反失败`, 'stratagem');
    return { success: false, message: '敌中作敌失败' };
  }

  addStrategyEffect(state, {
    type: 'sleeper',
    sourceFactionId: factionId,
    sourceGeneralId: generalId,
    targetGeneralId: targetGen.id,
    magnitude: 0,
    turnsRemaining: f.durationMonths,
  });

  addLog(state, `${aiTag}${general.name} 策反 ${targetGen.name}，战时或生变`, 'stratagem');
  return { success: true, message: `${targetGen.name} 已中寝返之计（${f.durationMonths} 月内有效）` };
}

export function useSleeper(
  state: GameState,
  cityId: string,
  generalId: string,
  targetCityId: string,
): ActionResult {
  return doSleeper(state, cityId, generalId, targetCityId, state.playerFactionId, true);
}

export function aiUndermineLoyalty(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  return doUndermineLoyalty(state, cityId, generalId, targetCityId, factionId, false).success;
}

export function aiSleeper(
  state: GameState,
  factionId: string,
  cityId: string,
  generalId: string,
  targetCityId: string,
): boolean {
  return doSleeper(state, cityId, generalId, targetCityId, factionId, false).success;
}
