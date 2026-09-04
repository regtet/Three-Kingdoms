import { describe, it, expect } from 'vitest';
import { createNewGame, findCity } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { executeTransport, resolveTransportMissions } from '../assets/scripts/core/systems/transport';
import { monthlySettlement } from '../assets/scripts/core/systems/income';
import { getActableGeneralsInCity } from '../assets/scripts/core/systems/actionGuard';

function newState() {
  return createNewGame(SCENARIO_001, 'wei');
}

function pickGeneral(s: ReturnType<typeof newState>, cityId: string): string {
  return getActableGeneralsInCity(s, cityId)[0].id;
}

describe('transport missions', () => {
  it('start transport deducts source and creates in-transit mission', () => {
    const s = newState();
    const from = findCity(s, 'xuchang');
    const to = findCity(s, 'luoyang');
    const gid = pickGeneral(s, 'xuchang');
    const goldBefore = from.gold;
    const toGoldBefore = to.gold;

    const r = executeTransport(s, {
      fromCityId: 'xuchang',
      toCityId: 'luoyang',
      generalId: gid,
      gold: 50,
      food: 0,
      troops: 0,
    });
    expect(r.success).toBe(true);
    expect(from.gold).toBe(goldBefore - 50);
    expect(to.gold).toBe(toGoldBefore);
    expect(s.transportMissions.length).toBe(1);
    expect(s.generals.find((g) => g.id === gid)!.status).toBe('marching');
  });

  it('resolve delivers cargo and moves general next month', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    const to = findCity(s, 'luoyang');
    const toGoldBefore = to.gold;

    executeTransport(s, {
      fromCityId: 'xuchang',
      toCityId: 'luoyang',
      generalId: gid,
      gold: 40,
      food: 20,
      troops: 0,
    });

    resolveTransportMissions(s);
    expect(s.transportMissions.length).toBe(0);
    expect(to.gold).toBe(toGoldBefore + 40);
    expect(to.food).toBeGreaterThan(0);
    const g = s.generals.find((x) => x.id === gid)!;
    expect(g.cityId).toBe('luoyang');
    expect(g.status).toBe('idle');
  });

  it('monthly settlement resolves pending transports', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    executeTransport(s, {
      fromCityId: 'xuchang',
      toCityId: 'luoyang',
      generalId: gid,
      gold: 30,
      food: 0,
      troops: 0,
    });
    monthlySettlement(s);
    expect(s.transportMissions.length).toBe(0);
    expect(findCity(s, 'luoyang').gold).toBeGreaterThan(300);
  });
});
