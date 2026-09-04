import { describe, it, expect } from 'vitest';
import { createNewGame, findCity } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { dispatchEnvoy, resolveEnvoyMissions, distanceToFaction, findPathToFaction } from '../assets/scripts/core/systems/envoy';
import { getRelation, getRelationScore } from '../assets/scripts/core/systems/diplomacy';
import { monthlySettlement } from '../assets/scripts/core/systems/income';
import { getActableGeneralsInCity } from '../assets/scripts/core/systems/actionGuard';
import { FORMULAS } from '../assets/scripts/core/data/formulas';

function newState() {
  return createNewGame(SCENARIO_001, 'wei');
}

function pickGeneral(s: ReturnType<typeof newState>, cityId: string): string {
  return getActableGeneralsInCity(s, cityId)[0].id;
}

describe('envoy missions', () => {
  it('distance to adjacent enemy faction is one hop', () => {
    const s = newState();
    const route = distanceToFaction(s, 'xuchang', 'wu');
    expect(route).not.toBeNull();
    expect(route!.toCityId).toBe('shouchun');
    expect(route!.hops).toBe(1);
  });

  it('dispatch gift deducts gold and creates traveling mission', () => {
    const s = newState();
    const from = findCity(s, 'xuchang');
    const gid = pickGeneral(s, 'xuchang');
    const goldBefore = from.gold;
    const scoreBefore = getRelationScore(s, 'wei', 'wu');

    const r = dispatchEnvoy(s, 'xuchang', gid, 'wu', 'gift');
    expect(r.success).toBe(true);
    expect(from.gold).toBe(goldBefore - FORMULAS.diplomacy.giftGoldCost);
    expect(getRelationScore(s, 'wei', 'wu')).toBe(scoreBefore);
    expect(s.envoyMissions.length).toBe(1);
    expect(s.envoyMissions[0].status).toBe('traveling');
    expect(s.envoyMissions[0].path[0]).toBe('xuchang');
    expect(s.envoyMissions[0].path).toContain('shouchun');
    expect(s.generals.find((g) => g.id === gid)!.status).toBe('marching');
  });

  it('resolve applies diplomacy and frees general', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    const scoreBefore = getRelationScore(s, 'wei', 'wu');

    dispatchEnvoy(s, 'xuchang', gid, 'wu', 'gift');
    resolveEnvoyMissions(s);

    expect(s.envoyMissions.length).toBe(0);
    expect(getRelationScore(s, 'wei', 'wu')).toBeGreaterThan(scoreBefore);
    expect(s.generals.find((g) => g.id === gid)!.status).toBe('idle');
  });

  it('monthly settlement resolves pending envoys', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    dispatchEnvoy(s, 'xuchang', gid, 'wu', 'truce');
    monthlySettlement(s);
    expect(s.envoyMissions.length).toBe(0);
    expect(s.generals.find((g) => g.id === gid)!.status).toBe('idle');
  });

  it('path to distant faction goes through a third-party city', () => {
    const s = newState();
    const route = findPathToFaction(s, 'xuchang', 'shu');
    expect(route).not.toBeNull();
    expect(route!.hops).toBeGreaterThan(1);
    expect(route!.path).toContain('shouchun');
    expect(getRelation(s, 'wei', 'wu')).toBe('hostile');
  });

  it('hostile third-party city can intercept envoy', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    dispatchEnvoy(s, 'xuchang', gid, 'shu', 'alliance');
    resolveEnvoyMissions(s, () => 0);
    expect(s.envoyMissions.length).toBe(0);
    expect(getRelation(s, 'wei', 'shu')).not.toBe('allied');
    const g = s.generals.find((x) => x.id === gid)!;
    expect(g.status).toBe('idle');
    expect(g.cityId).toBe('xuchang');
  });

  it('envoy continues when intercept roll fails', () => {
    const s = newState();
    const gid = pickGeneral(s, 'xuchang');
    dispatchEnvoy(s, 'xuchang', gid, 'shu', 'alliance');
    resolveEnvoyMissions(s, () => 0.99);
    expect(s.envoyMissions.length).toBe(1);
    resolveEnvoyMissions(s, () => 0.99);
    expect(s.envoyMissions.length).toBe(0);
    expect(getRelation(s, 'wei', 'shu')).toBe('allied');
  });
});
