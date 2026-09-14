import type { CityId } from './City';
import type { FactionId } from './Faction';

/** 武将（Officer）数据。纯数据，无引擎依赖。 */

export type OfficerId = string;

export type OfficerStatus = 'idle' | 'governor' | 'campaign' | 'wounded';

export interface Officer {
  id: OfficerId;
  name: string;
  factionId: FactionId | null;
  /** 所在城；在野可为 null */
  cityId: CityId | null;
  force: number;
  intellect: number;
  leadership: number;
  politics: number;
  charm: number;
  loyalty: number;
  age: number;
  status: OfficerStatus;
  /** 本月是否已行动 */
  actionUsed: boolean;
}

export function createOfficer(
  partial: Pick<Officer, 'id' | 'name'> & Partial<Officer>,
): Officer {
  return {
    factionId: null,
    cityId: null,
    force: 50,
    intellect: 50,
    leadership: 50,
    politics: 50,
    charm: 50,
    loyalty: 80,
    age: 30,
    status: 'idle',
    actionUsed: false,
    ...partial,
  };
}
