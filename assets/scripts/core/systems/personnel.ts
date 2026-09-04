import type { ActionResult, GameState, General, TransportInput } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { addLog, areNeighbors, findCity, findGeneral, getCityGenerals } from '../utils/helpers';
import { canGeneralAct, markGeneralActed, getActableGeneralsInCity } from './actionGuard';
import { executeTransport } from './transport';

/** 武将移动（人才） */
export function moveGeneral(state: GameState, generalId: string, toCityId: string): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const general = state.generals.find((g) => g.id === generalId);
  if (!general) return { success: false, message: '武将不存在' };
  if (general.factionId !== state.playerFactionId) return { success: false, message: '不能调动敌将' };
  if (general.status === 'marching') return { success: false, message: '武将在外，无法移动' };
  const act = canGeneralAct(state, generalId);
  if (!act.ok) return { success: false, message: act.message };

  const to = findCity(state, toCityId);
  if (to.factionId !== state.playerFactionId) return { success: false, message: '只能移动到己方城池' };

  const from = findCity(state, general.cityId);
  from.generalIds = from.generalIds.filter((id) => id !== generalId);
  if (from.governorId === generalId) from.governorId = null;

  general.cityId = toCityId;
  if (!to.generalIds.includes(generalId)) to.generalIds.push(generalId);
  markGeneralActed(general);

  addLog(state, `${general.name} 移至 ${to.name}`, 'personnel');
  return { success: true, message: `${general.name} 已至 ${to.name}` };
}

/** 赏赐（提升忠诚） */
export function rewardGeneral(state: GameState, generalId: string, cityId: string): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const general = state.generals.find((g) => g.id === generalId);
  if (!general || general.factionId !== state.playerFactionId) return { success: false, message: '无效武将' };
  const act = canGeneralAct(state, generalId);
  if (!act.ok) return { success: false, message: act.message };

  const city = findCity(state, cityId);
  const cost = FORMULAS.loyalty.rewardGoldCost;
  const gain = FORMULAS.loyalty.rewardLoyaltyGain;
  if (city.gold < cost) return { success: false, message: `本城金钱不足（需要 ${cost}）` };

  city.gold -= cost;
  general.loyalty = Math.min(100, general.loyalty + gain);
  markGeneralActed(general);
  addLog(state, `赏赐 ${general.name}，忠诚 ${general.loyalty}`, 'personnel');
  return { success: true, message: `${general.name} 忠诚 ${general.loyalty}` };
}

/** 任命太守 */
export function appointGovernor(state: GameState, cityId: string, generalId: string): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能任命己方城池' };
  const general = state.generals.find((g) => g.id === generalId);
  if (!general || general.cityId !== cityId) return { success: false, message: '武将须在本城' };
  const act = canGeneralAct(state, generalId);
  if (!act.ok) return { success: false, message: act.message };

  city.governorId = generalId;
  general.status = 'governor';
  markGeneralActed(general);
  addLog(state, `${general.name} 出任 ${city.name} 太守`, 'personnel');
  return { success: true, message: `${general.name} 为 ${city.name} 太守` };
}

/** 运输（军事）：相邻城之间运送金/粮/兵，下月送达 */
export function transport(state: GameState, input: TransportInput): ActionResult {
  return executeTransport(state, input);
}

/** 在野武将池（搜索成功时登用） */
const TALENT_POOL: Omit<General, 'factionId' | 'cityId' | 'status'>[] = [
  { id: 'g_taishi', name: '太史慈', force: 92, intelligence: 68, leadership: 82, politics: 55, charm: 75, loyalty: 85 },
  { id: 'g_madai', name: '马岱', force: 82, intelligence: 58, leadership: 76, politics: 50, charm: 65, loyalty: 88 },
  { id: 'g_wenchou', name: '文丑', force: 90, intelligence: 45, leadership: 70, politics: 40, charm: 50, loyalty: 80 },
  { id: 'g_yanliang', name: '颜良', force: 91, intelligence: 44, leadership: 72, politics: 42, charm: 52, loyalty: 82 },
  { id: 'g_chengyu', name: '程昱', force: 48, intelligence: 90, leadership: 78, politics: 85, charm: 70, loyalty: 90 },
];

/** 搜索人才（官方人才系统简化版） */
export function searchTalent(state: GameState, cityId: string): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能在本城搜索' };

  const actable = getActableGeneralsInCity(state, cityId);
  const searcher = actable.sort((a, b) => b.charm - a.charm)[0];
  if (!searcher) return { success: false, message: '本城无可用武将（均已行动或在外）' };

  const f = FORMULAS.search;
  if (city.gold < f.goldCost) return { success: false, message: `金钱不足（需要 ${f.goldCost}）` };

  const charm = searcher.charm;
  const rate = f.baseSuccessRate + charm * f.charmFactor;

  city.gold -= f.goldCost;
  markGeneralActed(searcher);

  if (Math.random() > rate) {
    addLog(state, `${searcher.name} 在 ${city.name} 搜索人才未果`, 'personnel');
    return { success: false, message: '搜索未果，消耗金钱' };
  }

  const pool = TALENT_POOL.filter(
    (t) => !state.generals.some((g) => g.id === t.id || g.name === t.name) &&
      !state.wildGenerals.some((w) => w.id === t.id || w.name === t.name),
  );
  if (pool.length === 0) {
    return { success: false, message: '当世已无名将可寻' };
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const general: General = {
    ...pick,
    factionId: state.playerFactionId,
    cityId,
    status: 'idle',
    actionUsed: false,
  };
  state.generals.push(general);
  if (!city.generalIds.includes(general.id)) city.generalIds.push(general.id);

  addLog(state, `${city.name} 搜索到 ${general.name}！`, 'personnel');
  return { success: true, message: `发现武将 ${general.name}（武${general.force} 智${general.intelligence}）` };
}

/** 登用在野武将（地图预设） */
export function recruitWildGeneral(state: GameState, cityId: string, wildId: string): ActionResult {
  if (state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
  const city = findCity(state, cityId);
  if (city.factionId !== state.playerFactionId) return { success: false, message: '只能在本城登用' };

  const actable = getActableGeneralsInCity(state, cityId);
  const officer = actable.sort((a, b) => b.charm - a.charm)[0];
  if (!officer) return { success: false, message: '本城无可用武将执行登用' };

  const idx = state.wildGenerals.findIndex((w) => w.id === wildId && w.cityId === cityId);
  if (idx < 0) return { success: false, message: '该城无此在野武将' };

  const wild = state.wildGenerals[idx];
  const cost = Math.max(wild.recruitGold, FORMULAS.wildRecruit.minGold);
  if (city.gold < cost) return { success: false, message: `金钱不足（需要 ${cost}）` };

  if (state.generals.some((g) => g.id === wild.id)) {
    state.wildGenerals.splice(idx, 1);
    return { success: false, message: '该武将已被登用' };
  }

  city.gold -= cost;
  markGeneralActed(officer);
  const general: General = {
    id: wild.id,
    name: wild.name,
    force: wild.force,
    intelligence: wild.intelligence,
    leadership: wild.leadership,
    politics: wild.politics,
    charm: wild.charm,
    loyalty: 75,
    factionId: state.playerFactionId,
    cityId,
    status: 'idle',
    actionUsed: false,
  };
  state.generals.push(general);
  if (!city.generalIds.includes(general.id)) city.generalIds.push(general.id);
  state.wildGenerals.splice(idx, 1);

  addLog(state, `${officer.name} 登用 ${general.name}（${city.name}）`, 'personnel');
  return { success: true, message: `登用 ${general.name}（武${general.force} 智${general.intelligence}）` };
}

export function getWildGeneralsAtCity(state: GameState, cityId: string) {
  return state.wildGenerals.filter((w) => w.cityId === cityId);
}

/** 低忠诚武将叛逃 → 在野 */
export function processDefections(state: GameState): void {
  const threshold = FORMULAS.loyalty.defectionThreshold;
  for (const g of [...state.generals]) {
    if (g.loyalty >= threshold) continue;
    if (Math.random() > 0.25) continue;
    const city = findCity(state, g.cityId);
    city.generalIds = city.generalIds.filter((id) => id !== g.id);
    if (city.governorId === g.id) city.governorId = null;
    state.generals = state.generals.filter((x) => x.id !== g.id);
    state.wildGenerals.push({
      id: g.id,
      name: g.name,
      force: g.force,
      intelligence: g.intelligence,
      leadership: g.leadership,
      politics: g.politics,
      charm: g.charm,
      cityId: g.cityId,
      recruitGold: Math.max(FORMULAS.wildRecruit.minGold, 100 + g.charm),
    });
    addLog(state, `${g.name} 因忠诚过低叛逃，流落 ${city.name} 附近`, 'personnel');
  }
}
