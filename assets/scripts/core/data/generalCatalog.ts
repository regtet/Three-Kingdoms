import { ALL_SCENARIOS } from './scenarios/index';
import { PORTRAIT_POOL_LABELS } from './portraitMap';
import {
  filterRosterByTroop,
  formatRosterBio,
  primaryTroopKind,
  resolveGeneralRoster,
  rosterAptitude,
  rosterGrade,
  type GeneralRosterDef,
  type TroopAdapt,
  type TroopFilterId,
  type TroopKind,
  TROOP_BADGE,
  TROOP_FILTER_TABS,
  TROOP_LABELS,
} from './generalRoster';

export type GalleryGrade = 'SS' | 'S' | 'A' | 'B';

const FACTION_BY_GENERAL_ID = (() => {
  const map = new Map<string, string>();
  for (const scenario of ALL_SCENARIOS) {
    const names = Object.fromEntries(scenario.factions.map((f) => [f.id, f.name]));
    for (const g of scenario.generals) {
      map.set(g.id, names[g.factionId] ?? '—');
    }
  }
  return map;
})();

/** 图鉴展示条目 */
export type GalleryGeneral = {
  id: string;
  name: string;
  faction: string;
  force: number;
  intelligence: number;
  politics: number;
  charm: number;
  leadership: number;
  skill: string;
  epithet: string;
  bio: string;
  troop: TroopKind;
  adapt: TroopAdapt;
  grade: GalleryGrade;
  aptitude: number;
  stars: number;
};

export { TROOP_FILTER_TABS, TROOP_LABELS, TROOP_BADGE };
export type { TroopFilterId, TroopKind, TroopAdapt };

function buildGalleryEntry(id: string, fallbackName: string): GalleryGeneral {
  const r = resolveGeneralRoster(id, fallbackName);
  return {
    id,
    name: r.name,
    faction: FACTION_BY_GENERAL_ID.get(id) ?? '—',
    force: r.force,
    intelligence: r.intelligence,
    leadership: r.leadership,
    politics: r.politics,
    charm: r.charm,
    skill: r.skill,
    epithet: r.epithet,
    bio: formatRosterBio(id, r),
    troop: primaryTroopKind(r.adapt),
    adapt: r.adapt,
    grade: rosterGrade(r),
    aptitude: rosterAptitude(r),
    stars: r.star,
  };
}

function addEntry(map: Map<string, GalleryGeneral>, entry: GalleryGeneral): void {
  if (!map.has(entry.id)) map.set(entry.id, entry);
}

/** 合并剧本武将与储备池，供武将图鉴浏览 */
export function buildGalleryCatalog(): GalleryGeneral[] {
  const map = new Map<string, GalleryGeneral>();

  for (const scenario of ALL_SCENARIOS) {
    for (const g of scenario.generals) {
      addEntry(map, buildGalleryEntry(g.id, g.name));
    }
  }

  for (const [id, name] of Object.entries(PORTRAIT_POOL_LABELS)) {
    addEntry(map, buildGalleryEntry(id, name));
  }

  return [...map.values()].sort((a, b) => b.aptitude - a.aptitude || a.name.localeCompare(b.name, 'zh'));
}

export function filterGalleryByTroop(list: GalleryGeneral[], filter: TroopFilterId): GalleryGeneral[] {
  if (filter === 'all') return list;
  return filterRosterByTroop(list, filter) as GalleryGeneral[];
}

export function galleryPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** 格式化兵种适性一行（战略版顺序） */
export function formatTroopAdaptLine(adapt: TroopAdapt): string {
  const order: TroopKind[] = ['cavalry', 'shield', 'archer', 'spear', 'siege'];
  return order.map((k) => `${TROOP_LABELS[k]}${adapt[k]}`).join('　');
}

export function rosterStats(r: GeneralRosterDef) {
  return {
    force: r.force,
    intelligence: r.intelligence,
    leadership: r.leadership,
    politics: r.politics,
    charm: r.charm,
  };
}
