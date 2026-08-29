import { describe, it, expect } from 'vitest';
import { createNewGame, findCity } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { developCity, farmCity } from '../assets/scripts/core/systems/domestic';
import { recruitTroops } from '../assets/scripts/core/systems/recruit';
import { canAttack, estimateBattle } from '../assets/scripts/core/systems/battle';
import { monthlySettlement, calcGoldIncome, calcTroopUpkeep } from '../assets/scripts/core/systems/income';
import { proposeTruce, getRelation } from '../assets/scripts/core/systems/diplomacy';
import { useFireAttack, useSowDiscord, useDisrupt } from '../assets/scripts/core/systems/stratagem';
import { searchTalent, recruitWildGeneral } from '../assets/scripts/core/systems/personnel';
import { SCENARIO_002 } from '../assets/scripts/core/data/scenario_002';
import { getCityStateView, formatCityStateReport } from '../assets/scripts/core/utils/cityState';
import { GameEngine } from '../assets/scripts/core/game/GameEngine';
import type { GameState } from '../assets/scripts/core/models/types';

function newState(factionId = 'wei'): GameState {
  return createNewGame(SCENARIO_001, factionId);
}

describe('official domestic', () => {
  it('develop increases commerce not direct gold spam', () => {
    const s = newState('wei');
    const city = findCity(s, 'luoyang');
    const commerce = city.commerce;
    const r = developCity(s, 'luoyang');
    expect(r.success).toBe(true);
    expect(city.commerce).toBeGreaterThan(commerce);
    expect(city.domesticDone).toBe(true);
  });

  it('only one domestic per city per month', () => {
    const s = newState('wei');
    developCity(s, 'luoyang');
    const r = farmCity(s, 'luoyang');
    expect(r.success).toBe(false);
    expect(r.message).toContain('本月已执行内政');
  });

  it('monthly income from commerce/agriculture', () => {
    const s = newState('wei');
    const city = findCity(s, 'luoyang');
    const view = getCityStateView(s, 'luoyang');
    const goldBefore = city.gold;
    expect(view.projectedGoldIncome).toBeGreaterThan(0);
    monthlySettlement(s);
    expect(findCity(s, 'luoyang').gold).toBe(goldBefore + view.projectedGoldIncome);
  });

  it('troop upkeep consumes food or causes desertion', () => {
    const s = newState('wei');
    const city = findCity(s, 'luoyang');
    const upkeep = calcTroopUpkeep(city);
    expect(upkeep).toBeGreaterThan(0);
    city.food = Math.max(0, upkeep - 5);
    const troopsBefore = city.troops;
    monthlySettlement(s);
    const after = findCity(s, 'luoyang');
    expect(after.food === 0 || after.troops <= troopsBefore).toBe(true);
  });
});

describe('battle and diplomacy', () => {
  it('cannot attack truce faction', () => {
    const s = newState('wei');
    proposeTruce(s, 'wei', 'wu');
    const check = canAttack(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1000,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toContain('同盟或停战');
  });

  it('fire attack can reduce enemy troops', () => {
    const s = newState('wei');
    findCity(s, 'shouchun').troops = 2000;
    let reduced = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'shouchun').troops = 2000;
      const r = useFireAttack(s, 'huaibei', 'g_guojia', 'shouchun');
      if (r.success) {
        expect(findCity(s, 'shouchun').troops).toBeLessThan(2000);
        reduced = true;
        break;
      }
    }
    expect(reduced).toBe(true);
  });

  it('sow discord can reduce enemy loyalty', () => {
    const s = newState('wei');
    findCity(s, 'shouchun').loyalty = 80;
    let ok = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'shouchun').loyalty = 80;
      const r = useSowDiscord(s, 'huaibei', 'g_guojia', 'shouchun');
      if (r.success) {
        expect(findCity(s, 'shouchun').loyalty).toBeLessThan(80);
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  });

  it('disrupt can reduce enemy order', () => {
    const s = newState('wei');
    const target = findCity(s, 'shouchun');
    let ok = false;
    for (let i = 0; i < 25; i++) {
      target.order = 80;
      const r = useDisrupt(s, 'huaibei', 'g_xunyu', 'shouchun');
      if (r.success) {
        expect(target.order).toBeLessThan(80);
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  });
});

describe('city state view', () => {
  it('formats official city report', () => {
    const s = newState('wei');
    const view = getCityStateView(s, 'luoyang');
    const text = formatCityStateReport(view);
    expect(text).toContain('商业');
    expect(text).toContain('农业');
    expect(text).toContain('邻接');
  });
});

describe('GameEngine official turn', () => {
  it('end turn runs monthly settlement', () => {
    const engine = new GameEngine();
    engine.newGame(SCENARIO_001, 'wei');
    const goldBefore = findCity(engine.state!, 'luoyang').gold;
    engine.develop('luoyang');
    engine.endTurn();
    expect(engine.state?.turn).toBe(2);
    expect(findCity(engine.state!, 'luoyang').gold).toBeGreaterThanOrEqual(goldBefore);
  });
});

describe('personnel and battle v0.3', () => {
  it('search talent can add general', () => {
    const s = newState('wei');
    findCity(s, 'luoyang').gold = 500;
    let found = false;
    for (let i = 0; i < 30; i++) {
      const r = searchTalent(s, 'luoyang');
      if (r.success) { found = true; break; }
    }
    expect(found).toBe(true);
    expect(s.generals.length).toBeGreaterThan(24);
  });

  it('joint army increases attack power estimate', () => {
    const s = newState('wei');
    const base = {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1500,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    };
    const solo = estimateBattle(s, base)!;
    const joint = estimateBattle(s, { ...base, secondaryGeneralId: 'g_dianwei' })!;
    expect(joint.atkPower).toBeGreaterThan(solo.atkPower);
  });

  it('scenario 002 has wild generals and recruit works', () => {
    const s = createNewGame(SCENARIO_002, 'wei');
    expect(s.wildGenerals.length).toBeGreaterThan(0);
    findCity(s, 'xuchang').gold = 500;
    const wild = s.wildGenerals.find((w) => w.cityId === 'xuchang')!;
    const r = recruitWildGeneral(s, 'xuchang', wild.id);
    expect(r.success).toBe(true);
    expect(s.generals.some((g) => g.id === wild.id)).toBe(true);
  });
});
describe('legacy battle', () => {
  it('can attack adjacent enemy when hostile', () => {
    const s = newState('wei');
    expect(getRelation(s, 'wei', 'wu')).toBe('hostile');
    const check = canAttack(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1000,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    });
    expect(check.ok).toBe(true);
  });

  it('recruit uses city resources', () => {
    const s = newState('wei');
    const r = recruitTroops(s, 'luoyang', 50);
    expect(r.success).toBe(true);
  });
});
