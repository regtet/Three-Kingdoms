import type { GameState, General } from '../models/types';
import { findGeneral, getCityGenerals } from '../utils/helpers';

/** 武将是否处于可派遣状态（非出征/负伤） */
export function isGeneralAvailable(general: General): boolean {
  return general.status !== 'marching' && general.status !== 'injured';
}

/** 玩家回合：武将是否还能执行本月命令 */
export function canGeneralAct(state: GameState, generalId: string): { ok: boolean; message: string } {
  if (state.phase !== 'player') return { ok: false, message: '当前不是玩家回合' };
  const g = findGeneral(state, generalId);
  if (!isGeneralAvailable(g)) return { ok: false, message: `${g.name} 当前无法行动` };
  if (g.actionUsed) return { ok: false, message: `${g.name} 本月已行动` };
  return { ok: true, message: '' };
}

/** AI 回合：武将是否还能行动 */
export function canAiGeneralAct(state: GameState, generalId: string): boolean {
  const g = findGeneral(state, generalId);
  return isGeneralAvailable(g) && !g.actionUsed;
}

export function markGeneralActed(general: General): void {
  general.actionUsed = true;
}

/** 月初恢复所有武将行动资格 */
export function resetGeneralActions(state: GameState): void {
  for (const g of state.generals) g.actionUsed = false;
}

/** 本城可行动武将（玩家势力） */
export function getActableGeneralsInCity(
  state: GameState,
  cityId: string,
  factionId?: string,
): General[] {
  const fid = factionId ?? state.playerFactionId;
  return getCityGenerals(state, cityId).filter(
    (g) => g.factionId === fid && isGeneralAvailable(g) && !g.actionUsed,
  );
}
