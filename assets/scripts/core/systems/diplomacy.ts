import type { DiplomaticStatus, GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, findCity, getFactionCities } from '../utils/helpers';

function key(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function getRelRecord(state: GameState, fa: string, fb: string) {
  const [a, b] = key(fa, fb);
  return state.relations.find((r) => r.factionA === a && r.factionB === b);
}

function scoreToStatus(score: number): DiplomaticStatus {
  if (score >= 80) return 'allied';
  if (score >= 60) return 'truce';
  if (score >= 30) return 'neutral';
  return 'hostile';
}

export function getRelation(state: GameState, fa: string, fb: string): DiplomaticStatus {
  if (fa === fb) return 'allied';
  const rel = getRelRecord(state, fa, fb);
  if (!rel) return 'hostile';
  if (rel.duration > 0 && (rel.status === 'allied' || rel.status === 'truce')) {
    return rel.status;
  }
  return rel.status ?? scoreToStatus(rel.relationScore ?? 0);
}

function setRelation(state: GameState, fa: string, fb: string, status: DiplomaticStatus, duration: number, score?: number): void {
  const [a, b] = key(fa, fb);
  let rel = getRelRecord(state, fa, fb);
  if (!rel) {
    rel = { factionA: a, factionB: b, status, duration, relationScore: score ?? 0 };
    state.relations.push(rel);
  } else {
    rel.status = status;
    rel.duration = duration;
    if (score !== undefined) rel.relationScore = score;
  }
}

export function breakAllianceOnAttack(state: GameState, attackerId: string, defenderId: string): void {
  const rel = getRelRecord(state, attackerId, defenderId);
  if (rel && (rel.status === 'allied' || rel.status === 'truce')) {
    setRelation(state, attackerId, defenderId, 'hostile', 0, 0);
    addLog(state, `${attackerId} 撕毁与 ${defenderId} 的盟约！`, 'diplomacy');
  }
}

export function canAttackFaction(state: GameState, attackerId: string, defenderId: string): boolean {
  const rel = getRelation(state, attackerId, defenderId);
  return rel === 'hostile';
}

/** 同盟（使者抵达后执行） */
export function applyAllianceAtArrival(
  state: GameState,
  fromFactionId: string,
  toFactionId: string,
): { success: boolean; message: string } {
  const score = 85;
  setRelation(state, fromFactionId, toFactionId, 'allied', FORMULAS.diplomacy.allianceMinDuration, score);
  const toName = getFactionDisplayName(state, toFactionId);
  addLog(state, `${getFactionDisplayName(state, fromFactionId)} 与 ${toName} 结盟（${FORMULAS.diplomacy.allianceMinDuration} 月）`, 'diplomacy');
  return { success: true, message: `与 ${toName} 结盟成功` };
}

/** 停战（使者抵达后执行） */
export function applyTruceAtArrival(
  state: GameState,
  fromFactionId: string,
  toFactionId: string,
): { success: boolean; message: string } {
  setRelation(state, fromFactionId, toFactionId, 'truce', FORMULAS.diplomacy.truceMinDuration, 65);
  addLog(state, `${getFactionDisplayName(state, fromFactionId)} 与 ${getFactionDisplayName(state, toFactionId)} 停战`, 'diplomacy');
  return { success: true, message: '停战成功' };
}

/** 赠礼（使者抵达后执行，出使时已扣金） */
export function applyGiftAtArrival(
  state: GameState,
  fromFactionId: string,
  toFactionId: string,
  _fromCityId: string,
): { success: boolean; message: string } {
  const rel = getRelRecord(state, fromFactionId, toFactionId);
  const prevScore = rel?.relationScore ?? 0;
  const newScore = Math.min(100, prevScore + FORMULAS.diplomacy.giftRelationGain);
  const newStatus = scoreToStatus(newScore);
  const duration = newStatus === 'allied' ? FORMULAS.diplomacy.allianceMinDuration
    : newStatus === 'truce' ? FORMULAS.diplomacy.truceMinDuration : 0;
  setRelation(state, fromFactionId, toFactionId, newStatus, duration, newScore);

  addLog(state, `${getFactionDisplayName(state, fromFactionId)} 向 ${getFactionDisplayName(state, toFactionId)} 赠礼（友好度 ${newScore}）`, 'diplomacy');
  return { success: true, message: `赠礼成功，友好度 ${newScore}` };
}

/** 同盟（玩家即时入口 → 改派使者） */
export function proposeAlliance(state: GameState, fromFactionId: string, toFactionId: string): { success: boolean; message: string } {
  return applyAllianceAtArrival(state, fromFactionId, toFactionId);
}

/** 停战 */
export function proposeTruce(state: GameState, fromFactionId: string, toFactionId: string): { success: boolean; message: string } {
  return applyTruceAtArrival(state, fromFactionId, toFactionId);
}

/** 宣战 */
export function declareWar(state: GameState, fromFactionId: string, toFactionId: string): { success: boolean; message: string } {
  if (state.phase !== 'player' || fromFactionId !== state.playerFactionId) {
    return { success: false, message: '只能在玩家回合外交' };
  }
  setRelation(state, fromFactionId, toFactionId, 'hostile', 0, 0);
  addLog(state, `${getFactionDisplayName(state, fromFactionId)} 向 ${getFactionDisplayName(state, toFactionId)} 宣战`, 'diplomacy');
  return { success: true, message: '宣战' };
}

/** 赠礼（出使时已扣金；保留供旧调用/AI） */
export function sendGift(state: GameState, fromFactionId: string, toFactionId: string, fromCityId: string): { success: boolean; message: string } {
  if (state.phase !== 'player') return { success: false, message: '只能在玩家回合外交' };
  const city = findCity(state, fromCityId);
  const cost = FORMULAS.diplomacy.giftGoldCost;
  if (city.gold < cost) return { success: false, message: `本城金钱不足（需要 ${cost}）` };
  city.gold -= cost;
  return applyGiftAtArrival(state, fromFactionId, toFactionId, fromCityId);
}

export function getFactionDisplayName(state: GameState, factionId: string): string {
  return state.factions.find((f) => f.id === factionId)?.name ?? factionId;
}

export function getFactionGoldTotal(state: GameState, factionId: string): number {
  return getFactionCities(state, factionId).reduce((s, c) => s + c.gold, 0);
}

export function getFactionFoodTotal(state: GameState, factionId: string): number {
  return getFactionCities(state, factionId).reduce((s, c) => s + c.food, 0);
}

export function getRelationScore(state: GameState, fa: string, fb: string): number {
  const rel = getRelRecord(state, fa, fb);
  return rel?.relationScore ?? 0;
}
