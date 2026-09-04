import type { ActionResult, GameState, EnvoyMission, EnvoyPurpose } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, findCity, findGeneral } from '../utils/helpers';
import { canGeneralAct, canAiGeneralAct, markGeneralActed } from './actionGuard';
import {
  applyGiftAtArrival,
  applyAllianceAtArrival,
  applyTruceAtArrival,
  getFactionDisplayName,
  getRelation,
} from './diplomacy';

let envoySeq = 0;

function nextEnvoyId(state: GameState): string {
  envoySeq += 1;
  return `ev_${state.turn}_${envoySeq}`;
}

/** 使者是否在途 */
export function isGeneralOnEnvoy(state: GameState, generalId: string): boolean {
  return state.envoyMissions.some((m) => m.generalId === generalId && m.status === 'traveling');
}

export function getEnvoysForFaction(state: GameState, factionId: string): EnvoyMission[] {
  return state.envoyMissions.filter((m) => m.factionId === factionId && m.status === 'traveling');
}

export type EnvoyRoute = { path: string[]; toCityId: string; hops: number };

/** BFS：到目标势力任一城池的最短路径（含出发城） */
export function findPathToFaction(
  state: GameState,
  fromCityId: string,
  targetFactionId: string,
): EnvoyRoute | null {
  if (findCity(state, fromCityId).factionId === targetFactionId) {
    return { path: [fromCityId], toCityId: fromCityId, hops: 0 };
  }
  const queue: string[] = [fromCityId];
  const visited = new Set<string>([fromCityId]);
  const parent = new Map<string, string>();

  while (queue.length) {
    const id = queue.shift()!;
    const city = findCity(state, id);
    for (const nid of city.neighbors) {
      if (visited.has(nid)) continue;
      visited.add(nid);
      parent.set(nid, id);
      const next = findCity(state, nid);
      if (next.factionId === targetFactionId) {
        const path: string[] = [nid];
        let cur = nid;
        while (cur !== fromCityId) {
          cur = parent.get(cur)!;
          path.push(cur);
        }
        path.reverse();
        return { path, toCityId: nid, hops: path.length - 1 };
      }
      queue.push(nid);
    }
  }
  return null;
}

/** 到目标势力的最短步数（兼容旧调用） */
export function distanceToFaction(
  state: GameState,
  fromCityId: string,
  targetFactionId: string,
): { toCityId: string; hops: number } | null {
  const route = findPathToFaction(state, fromCityId, targetFactionId);
  if (!route) return null;
  return { toCityId: route.toCityId, hops: route.hops };
}

function executeEnvoyPurpose(state: GameState, mission: EnvoyMission): ActionResult {
  switch (mission.purpose) {
    case 'gift':
      return applyGiftAtArrival(state, mission.factionId, mission.targetFactionId, mission.fromCityId);
    case 'alliance':
      return applyAllianceAtArrival(state, mission.factionId, mission.targetFactionId);
    case 'truce':
      return applyTruceAtArrival(state, mission.factionId, mission.targetFactionId);
    default:
      return { success: false, message: '未知使命' };
  }
}

function failEnvoy(state: GameState, mission: EnvoyMission, reason: string): void {
  mission.status = 'failed';
  const general = state.generals.find((g) => g.id === mission.generalId);
  if (general) {
    general.status = 'idle';
    general.cityId = mission.fromCityId;
  }
  addLog(state, reason, 'diplomacy');
}

/** 途经第三方敌对城时判定拦截（出发城与目标城不拦截） */
export function shouldInterceptEnvoy(
  state: GameState,
  mission: EnvoyMission,
  cityId: string,
  rng: () => number = Math.random,
): boolean {
  const path = mission.path ?? [];
  const destId = path[path.length - 1] ?? mission.toCityId;
  if (cityId === mission.fromCityId || cityId === destId) return false;
  const city = findCity(state, cityId);
  if (city.factionId === mission.factionId || city.factionId === mission.targetFactionId) return false;
  if (getRelation(state, mission.factionId, city.factionId) !== 'hostile') return false;
  return rng() < FORMULAS.diplomacy.envoyInterceptChance;
}

function stubMission(
  factionId: string,
  generalId: string,
  fromCityId: string,
  route: EnvoyRoute,
  targetFactionId: string,
  purpose: EnvoyPurpose,
): EnvoyMission {
  return {
    id: 'instant',
    factionId,
    generalId,
    fromCityId,
    toCityId: route.toCityId,
    targetFactionId,
    purpose,
    turnsRemaining: 0,
    status: 'arrived',
    path: route.path,
    pathIndex: 0,
  };
}

/** 派遣使者（相邻势力至少 1 月，远距按路径步数） */
export function dispatchEnvoy(
  state: GameState,
  fromCityId: string,
  generalId: string,
  targetFactionId: string,
  purpose: EnvoyPurpose,
  actingFactionId?: string,
): ActionResult {
  const factionId = actingFactionId ?? state.playerFactionId;
  const isPlayer = factionId === state.playerFactionId;

  if (isPlayer && state.phase !== 'player') {
    return { success: false, message: '当前不是玩家回合' };
  }
  if (targetFactionId === factionId) {
    return { success: false, message: '不能对本势力外交' };
  }

  const general = findGeneral(state, generalId);
  if (general.factionId !== factionId) return { success: false, message: '无效武将' };
  if (general.cityId !== fromCityId) return { success: false, message: '武将须在出发城' };

  const act = isPlayer
    ? canGeneralAct(state, generalId)
    : (canAiGeneralAct(state, generalId) ? { ok: true, message: '' } : { ok: false, message: '武将无法行动' });
  if (!act.ok) return { success: false, message: act.message };

  const route = findPathToFaction(state, fromCityId, targetFactionId);
  if (!route) {
    return { success: false, message: `无法抵达 ${getFactionDisplayName(state, targetFactionId)} 领地` };
  }

  if (purpose === 'gift') {
    const city = findCity(state, fromCityId);
    const cost = FORMULAS.diplomacy.giftGoldCost;
    if (city.gold < cost) return { success: false, message: `本城金钱不足（需要 ${cost}）` };
    city.gold -= cost;
  }

  const hops = Math.max(1, route.hops);
  const toName = getFactionDisplayName(state, targetFactionId);
  const purposeLabel = purpose === 'gift' ? '赠礼' : purpose === 'alliance' ? '结盟' : '停战';

  if (route.hops === 0) {
    markGeneralActed(general);
    const r = executeEnvoyPurpose(state, stubMission(factionId, generalId, fromCityId, route, targetFactionId, purpose));
    addLog(state, `${general.name} 在 ${findCity(state, fromCityId).name} 完成${purposeLabel}（${toName}）`, 'diplomacy');
    return r;
  }

  general.status = 'marching';
  markGeneralActed(general);

  const mission: EnvoyMission = {
    id: nextEnvoyId(state),
    factionId,
    generalId,
    fromCityId,
    toCityId: route.toCityId,
    targetFactionId,
    purpose,
    turnsRemaining: hops,
    status: 'traveling',
    path: route.path,
    pathIndex: 0,
  };
  state.envoyMissions.push(mission);

  const tag = isPlayer ? '' : '[AI] ';
  addLog(
    state,
    `${tag}${general.name} 自 ${findCity(state, fromCityId).name} 出使 ${toName}（${purposeLabel}，${hops} 月后抵达）`,
    'diplomacy',
  );
  return { success: true, message: `${general.name} 出使 ${toName}，预计 ${hops} 月后抵达` };
}

/** 月结：沿路径前进；途经敌城可能被拦截；抵达后执行使命 */
export function resolveEnvoyMissions(state: GameState, rng: () => number = Math.random): void {
  const active: EnvoyMission[] = [];

  for (const m of state.envoyMissions) {
    if (m.status !== 'traveling') continue;
    const path = m.path && m.path.length >= 2 ? m.path : [m.fromCityId, m.toCityId];
    m.path = path;

    m.turnsRemaining -= 1;
    m.pathIndex = Math.min((m.pathIndex ?? 0) + 1, path.length - 1);
    const cityId = path[m.pathIndex];
    const cityName = findCity(state, cityId).name;
    const general = state.generals.find((g) => g.id === m.generalId);

    if (shouldInterceptEnvoy(state, m, cityId, rng)) {
      failEnvoy(
        state,
        m,
        `${general?.name ?? '使者'} 途经 ${cityName} 时被截获，出使失败`,
      );
      continue;
    }

    if (m.turnsRemaining > 0) {
      active.push(m);
      continue;
    }

    executeEnvoyPurpose(state, m);
    m.status = 'arrived';
    if (general) {
      general.status = 'idle';
      addLog(state, `${general.name} 自 ${getFactionDisplayName(state, m.targetFactionId)} 返回`, 'diplomacy');
    }
  }

  state.envoyMissions = active;
}
