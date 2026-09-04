import type { ActionResult, GameState, TransportInput, TransportMission } from '../models/types';
import { addLog, areNeighbors, findCity, findGeneral } from '../utils/helpers';
import { canGeneralAct, canAiGeneralAct, markGeneralActed } from './actionGuard';

let missionSeq = 0;

function nextMissionId(state: GameState): string {
  missionSeq += 1;
  return `tm_${state.turn}_${missionSeq}`;
}

/** 是否正在押运途中 */
export function isGeneralTransporting(state: GameState, generalId: string): boolean {
  return state.transportMissions.some((m) => m.generalId === generalId && m.status === 'in_transit');
}

export function getTransportsForFaction(state: GameState, factionId: string): TransportMission[] {
  return state.transportMissions.filter((m) => m.factionId === factionId && m.status === 'in_transit');
}

/**
 * 创建运输任务：资源从出发城扣除，武将进入 marching，下月月结送达。
 */
export function executeTransport(
  state: GameState,
  input: TransportInput,
  actingFactionId?: string,
): ActionResult {
  const factionId = actingFactionId ?? state.playerFactionId;
  const isPlayer = factionId === state.playerFactionId;

  if (isPlayer && state.phase !== 'player') {
    return { success: false, message: '当前不是玩家回合' };
  }

  const general = findGeneral(state, input.generalId);
  if (general.factionId !== factionId) return { success: false, message: '无效武将' };
  if (general.cityId !== input.fromCityId) return { success: false, message: '武将须在出发城' };

  const act = isPlayer
    ? canGeneralAct(state, input.generalId)
    : (canAiGeneralAct(state, input.generalId) ? { ok: true, message: '' } : { ok: false, message: '武将无法行动' });
  if (!act.ok) return { success: false, message: act.message };

  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.toCityId);
  if (from.factionId !== factionId || to.factionId !== factionId) {
    return { success: false, message: '只能在本方城池间运输' };
  }
  if (!areNeighbors(state, input.fromCityId, input.toCityId)) {
    return { success: false, message: '只能运输到相邻城池' };
  }

  const total = input.gold + input.food + input.troops;
  if (total <= 0) return { success: false, message: '须运输至少一项资源' };

  if (from.gold < input.gold || from.food < input.food || from.troops < input.troops) {
    return { success: false, message: '出发城资源不足' };
  }

  from.gold -= input.gold;
  from.food -= input.food;
  from.troops -= input.troops;

  general.status = 'marching';
  markGeneralActed(general);

  const mission: TransportMission = {
    id: nextMissionId(state),
    factionId,
    generalId: input.generalId,
    fromCityId: input.fromCityId,
    toCityId: input.toCityId,
    gold: input.gold,
    food: input.food,
    troops: input.troops,
    turnsRemaining: 1,
    status: 'in_transit',
  };
  state.transportMissions.push(mission);

  const tag = isPlayer ? '' : '[AI] ';
  addLog(
    state,
    `${tag}${general.name} 自 ${from.name} 押运至 ${to.name}（金${input.gold} 粮${input.food} 兵${input.troops}）`,
    'military',
  );
  return {
    success: true,
    message: isPlayer
      ? `${general.name} 已出发，预计下月抵达 ${to.name}`
      : `${general.name} 运输中`,
  };
}

/** 月结：推进在途任务，送达则交付资源并移动武将 */
export function resolveTransportMissions(state: GameState): void {
  const active: TransportMission[] = [];

  for (const m of state.transportMissions) {
    if (m.status !== 'in_transit') continue;
    m.turnsRemaining -= 1;
    if (m.turnsRemaining > 0) {
      active.push(m);
      continue;
    }

    const to = findCity(state, m.toCityId);
    const from = findCity(state, m.fromCityId);
    const general = state.generals.find((g) => g.id === m.generalId);
    if (!general) continue;

    to.gold += m.gold;
    to.food += m.food;
    to.troops += m.troops;

    from.generalIds = from.generalIds.filter((id) => id !== m.generalId);
    general.cityId = m.toCityId;
    general.status = 'idle';
    if (!to.generalIds.includes(m.generalId)) to.generalIds.push(m.generalId);

    const tag = m.factionId === state.playerFactionId ? '' : '[AI] ';
    addLog(
      state,
      `${tag}${general.name} 抵达 ${to.name}，交付 金${m.gold} 粮${m.food} 兵${m.troops}`,
      'military',
    );
    m.status = 'arrived';
  }

  state.transportMissions = active;
}
