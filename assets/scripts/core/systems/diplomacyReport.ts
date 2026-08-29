import type { DiplomaticStatus, GameState } from '../models/types';
import { getRelation, getFactionDisplayName } from './diplomacy';

const REL_LABEL: Record<DiplomaticStatus, string> = {
  hostile: '敌对',
  neutral: '中立',
  allied: '同盟',
  truce: '停战',
};

export function formatRelationLabel(status: DiplomaticStatus): string {
  return REL_LABEL[status] ?? status;
}

/** 外交关系一览（UI 用） */
export function formatDiplomacyReport(state: GameState): string {
  const playerId = state.playerFactionId;
  const lines = ['━━ 外交状况 ━━'];
  for (const f of state.factions) {
    if (f.id === playerId || f.isEliminated) continue;
    const rel = getRelation(state, playerId, f.id);
    const relEntry = state.relations.find((r) =>
      (r.factionA === playerId && r.factionB === f.id) ||
      (r.factionA === f.id && r.factionB === playerId),
    );
    const dur = relEntry && rel !== 'hostile' ? `（剩${relEntry.duration}月）` : '';
    const cities = state.cities.filter((c) => c.factionId === f.id).length;
    lines.push(`${getFactionDisplayName(state, f.id)}  ${formatRelationLabel(rel)}${dur}  ·  ${cities}城`);
  }
  return lines.join('\n');
}
