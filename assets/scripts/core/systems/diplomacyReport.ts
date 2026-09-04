import type { DiplomaticStatus, GameState } from '../models/types';
import { getRelation, getFactionDisplayName } from './diplomacy';
import { getEnvoysForFaction } from './envoy';
import { findGeneral } from '../utils/helpers';

const REL_LABEL: Record<DiplomaticStatus, string> = {
  hostile: '敌对',
  neutral: '中立',
  allied: '同盟',
  truce: '停战',
};

const PURPOSE_LABEL: Record<string, string> = {
  gift: '赠礼',
  alliance: '结盟',
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
  const envoys = getEnvoysForFaction(state, playerId);
  if (envoys.length) {
    lines.push('--- 使者在途 ---');
    for (const m of envoys) {
      const g = findGeneral(state, m.generalId);
      const purpose = PURPOSE_LABEL[m.purpose] ?? m.purpose;
      const toName = getFactionDisplayName(state, m.targetFactionId);
      lines.push(`${g.name} → ${toName}（${purpose}，剩${m.turnsRemaining}月）`);
    }
  }
  return lines.join('\n');
}
