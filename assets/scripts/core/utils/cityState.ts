import type { CityStateView, DiplomaticStatus, GameState } from '../models/types';
import { calcFoodIncome, calcGoldIncome, calcTroopUpkeep } from '../systems/income';
import { getRelation, getFactionDisplayName } from '../systems/diplomacy';
import { formatRelationLabel } from '../systems/diplomacyReport';
import { findCity, findGeneral, getCityGenerals, getMaxTroops } from './helpers';

const DISASTER_NAMES: Record<string, string> = {
  none: '无',
  flood: '水灾',
  plague: '瘟疫',
  locusts: '蝗灾',
};

/** 城池完整状态视图（UI/CLI 共用） */
export function getCityStateView(state: GameState, cityId: string): CityStateView {
  const city = findCity(state, cityId);
  const factionName = getFactionDisplayName(state, city.factionId);
  const generals = getCityGenerals(state, cityId);
  const governor = city.governorId ? findGeneral(state, city.governorId) : null;

  const neighborSummary = city.neighbors.map((nid) => {
    const n = findCity(state, nid);
    return {
      id: n.id,
      name: n.name,
      factionName: getFactionDisplayName(state, n.factionId),
      troops: n.troops,
      relation: getRelation(state, city.factionId, n.factionId),
    };
  });

  return {
    city,
    factionName,
    governor,
    generals,
    projectedGoldIncome: calcGoldIncome(city, governor),
    projectedFoodIncome: calcFoodIncome(city, governor),
    projectedTroopUpkeep: calcTroopUpkeep(city),
    maxTroops: getMaxTroops(city),
    canDomestic: !city.domesticDone && state.phase === 'player',
    neighborSummary,
  };
}

/** 格式化为官方风格文本（CLI / 简易 UI） */
export function formatCityStateReport(view: CityStateView): string {
  const c = view.city;
  const lines = [
    `━━ ${c.name}（${view.factionName}）━━`,
    `人口 ${c.population} | 金 ${c.gold} | 粮 ${c.food} | 兵 ${c.troops}/${view.maxTroops}`,
    `商业 ${c.commerce} | 农业 ${c.agriculture} | 民忠 ${c.loyalty} | 治安 ${c.order}`,
    `灾难 ${DISASTER_NAMES[c.disaster] ?? c.disaster} | 太守 ${view.governor?.name ?? '无'}`,
    `预计下月收入：金 +${view.projectedGoldIncome} | 粮 +${view.projectedFoodIncome} | 兵饷 -${view.projectedTroopUpkeep}`,
    `本月内政：${view.canDomestic ? '可执行' : '已完成'}`,
    '--- 武将 ---',
    ...view.generals.map((g) =>
      `  ${g.name} 武${g.force} 智${g.intelligence} 统${g.leadership} 忠${g.loyalty} [${g.status}]`,
    ),
    '--- 邻接 ---',
    ...view.neighborSummary.map((n) =>
      `  ${n.name}（${n.factionName}）兵${n.troops} [${formatRelationLabel(n.relation as DiplomaticStatus)}]`,
    ),
  ];
  return lines.join('\n');
}

/** 子面板用精简信息（单行，避免与子按钮重叠） */
export function formatCityStateBrief(view: CityStateView): string {
  const c = view.city;
  return `金${c.gold} 粮${c.food} 兵${c.troops}/${view.maxTroops}  商${c.commerce} 农${c.agriculture}  民忠${c.loyalty}  太守 ${view.governor?.name ?? '无'}`;
}
