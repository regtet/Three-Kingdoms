import type { FactionId } from './Faction';
import type { OfficerId } from './Officer';

/** 城池数据。纯数据，无引擎依赖。 */

export type CityId = string;

export interface City {
  id: CityId;
  name: string;
  /** 归属势力；中立可为 null */
  ownerFactionId: FactionId | null;
  population: number;
  gold: number;
  food: number;
  /** 兵士（战略层单一兵力池） */
  troops: number;
  commerce: number;
  agriculture: number;
  loyalty: number;
  publicOrder: number;
  governorId: OfficerId | null;
  /** 邻接城 id */
  neighbors: CityId[];
}

export function createEmptyCity(partial: Pick<City, 'id' | 'name'> & Partial<City>): City {
  return {
    ownerFactionId: null,
    population: 0,
    gold: 0,
    food: 0,
    troops: 0,
    commerce: 0,
    agriculture: 0,
    loyalty: 50,
    publicOrder: 50,
    governorId: null,
    neighbors: [],
    ...partial,
  };
}
