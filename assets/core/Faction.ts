/** 势力（魏蜀吴等）。纯数据，无引擎依赖。 */

export type FactionId = 'wei' | 'shu' | 'wu' | (string & {});

export interface Faction {
  id: FactionId;
  name: string;
  /** 代表色，如 #3a5fcd */
  color: string;
  rulerName: string;
  isPlayer: boolean;
  isDestroyed: boolean;
}

/** 默认三方：魏蜀吴 */
export const DEFAULT_FACTIONS: readonly Faction[] = [
  {
    id: 'wei',
    name: '魏',
    color: '#3a5fcd',
    rulerName: '曹操',
    isPlayer: false,
    isDestroyed: false,
  },
  {
    id: 'shu',
    name: '蜀',
    color: '#2e8b57',
    rulerName: '刘备',
    isPlayer: false,
    isDestroyed: false,
  },
  {
    id: 'wu',
    name: '吴',
    color: '#c0392b',
    rulerName: '孙权',
    isPlayer: false,
    isDestroyed: false,
  },
];

export function createDefaultFactions(): Faction[] {
  return DEFAULT_FACTIONS.map((f) => ({ ...f }));
}

export function findFaction(factions: readonly Faction[], id: FactionId): Faction | undefined {
  return factions.find((f) => f.id === id);
}
