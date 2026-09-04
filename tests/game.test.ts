import { describe, it, expect } from 'vitest';
import { createNewGame, findCity } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { developCity, farmCity } from '../assets/scripts/core/systems/domestic';
import { recruitTroops } from '../assets/scripts/core/systems/recruit';
import { canAttack, estimateBattle } from '../assets/scripts/core/systems/battle';
import { monthlySettlement, calcGoldIncome, calcTroopUpkeep } from '../assets/scripts/core/systems/income';
import { proposeTruce, getRelation } from '../assets/scripts/core/systems/diplomacy';
import { useFireAttack, useSowDiscord, useDisrupt, useFakeReport, useInspire } from '../assets/scripts/core/systems/stratagem';
import { searchTalent, recruitWildGeneral, processDefections } from '../assets/scripts/core/systems/personnel';
import { SCENARIO_002 } from '../assets/scripts/core/data/scenario_002';
import { SCENARIO_003 } from '../assets/scripts/core/data/scenario_003';
import { getCityStateView, formatCityStateReport } from '../assets/scripts/core/utils/cityState';
import { formatFactionStatsReport } from '../assets/scripts/core/systems/saveSummary';
import { GameEngine } from '../assets/scripts/core/game/GameEngine';
import type { GameState } from '../assets/scripts/core/models/types';

function newState(factionId = 'wei'): GameState {
  return createNewGame(SCENARIO_001, factionId);
}

function generalInCity(s: GameState, cityId: string, index = 0): string {
  const ids = s.generals.filter((g) => g.cityId === cityId && g.factionId === s.playerFactionId);
  return ids[index].id;
}

describe('official domestic', () => {
  it('develop increases commerce not direct gold spam', () => {
    const s = newState('wei');
    const city = findCity(s, 'luoyang');
    const commerce = city.commerce;
    const gid = generalInCity(s, 'luoyang');
    const r = developCity(s, 'luoyang', gid);
    expect(r.success).toBe(true);
    expect(city.commerce).toBeGreaterThan(commerce);
    expect(s.generals.find((g) => g.id === gid)!.actionUsed).toBe(true);
  });

  it('each general can only act once per month', () => {
    const s = newState('wei');
    const gid = generalInCity(s, 'luoyang');
    developCity(s, 'luoyang', gid);
    const r = farmCity(s, 'luoyang', gid);
    expect(r.success).toBe(false);
    expect(r.message).toContain('本月已行动');
  });

  it('different generals can each act once per month', () => {
    const s = newState('wei');
    const g0 = generalInCity(s, 'luoyang', 0);
    const g1 = generalInCity(s, 'luoyang', 1);
    developCity(s, 'luoyang', g0);
    const r = farmCity(s, 'luoyang', g1);
    expect(r.success).toBe(true);
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

function resetGeneralAction(s: GameState, generalId: string): void {
  const g = s.generals.find((x) => x.id === generalId);
  if (g) g.actionUsed = false;
}

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
    findCity(s, 'huaibei').gold = 500;
    findCity(s, 'huaibei').food = 500;
    findCity(s, 'shouchun').troops = 2000;
    let reduced = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'huaibei').gold = 500;
      findCity(s, 'huaibei').food = 500;
      findCity(s, 'shouchun').troops = 2000;
      resetGeneralAction(s, 'g_guojia');
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
    findCity(s, 'huaibei').gold = 500;
    findCity(s, 'shouchun').loyalty = 80;
    let ok = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'huaibei').gold = 500;
      findCity(s, 'shouchun').loyalty = 80;
      resetGeneralAction(s, 'g_guojia');
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
    findCity(s, 'huaibei').gold = 500;
    const target = findCity(s, 'shouchun');
    let ok = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'huaibei').gold = 500;
      target.order = 80;
      resetGeneralAction(s, 'g_xunyu');
      const r = useDisrupt(s, 'huaibei', 'g_xunyu', 'shouchun');
      if (r.success) {
        expect(target.order).toBeLessThan(80);
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  });

  it('fake report can reduce enemy order', () => {
    const s = newState('wei');
    findCity(s, 'huaibei').gold = 500;
    const target = findCity(s, 'shouchun');
    let ok = false;
    for (let i = 0; i < 25; i++) {
      findCity(s, 'huaibei').gold = 500;
      target.order = 80;
      resetGeneralAction(s, 'g_guojia');
      const r = useFakeReport(s, 'huaibei', 'g_guojia', 'shouchun');
      if (r.success) {
        expect(target.order).toBeLessThan(80);
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  });

  it('inspire can raise city loyalty', () => {
    const s = newState('wei');
    const city = findCity(s, 'luoyang');
    city.loyalty = 50;
    const r = useInspire(s, 'luoyang', 'g_caocao');
    expect(r.success).toBe(true);
    expect(city.loyalty).toBeGreaterThan(50);
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
    engine.develop('luoyang', generalInCity(engine.state!, 'luoyang'));
    engine.endTurn();
    expect(engine.state?.turn).toBe(2);
    expect(findCity(engine.state!, 'luoyang').gold).toBeGreaterThanOrEqual(goldBefore);
  });

  it('turn end summary includes faction stats', () => {
    const engine = new GameEngine();
    engine.newGame(SCENARIO_001, 'wei');
    const summary = engine.getTurnEndSummary();
    expect(summary).toContain('城');
    expect(summary).toContain('金');
    const report = engine.getFactionStatsReport();
    expect(report).toContain('势力概况');
  });
});

describe('personnel defection', () => {
  it('low loyalty general may defect to wild', () => {
    const s = newState('wei');
    const g = s.generals.find((x) => x.factionId === 'wei')!;
    g.loyalty = 5;
    const before = s.generals.length;
    let defected = false;
    for (let i = 0; i < 40; i++) {
      g.loyalty = 5;
      if (!s.generals.some((x) => x.id === g.id)) {
        s.generals.push({ ...g, loyalty: 5 });
      }
      processDefections(s);
      if (!s.generals.some((x) => x.id === g.id)) {
        defected = true;
        break;
      }
    }
    expect(defected).toBe(true);
    expect(s.generals.length).toBeLessThan(before);
    expect(s.wildGenerals.some((w) => w.id === g.id)).toBe(true);
  });
});

describe('faction stats report', () => {
  it('lists all active factions', () => {
    const s = newState('wei');
    const text = formatFactionStatsReport(s);
    expect(text).toContain('魏');
    expect(text).toContain('吴');
    expect(text).toContain('★');
  });
});

describe('personnel and battle v0.3', () => {
  it('search talent can add general', () => {
    const s = newState('wei');
    let found = false;
    for (let i = 0; i < 30; i++) {
      findCity(s, 'luoyang').gold = 500;
      s.generals.filter((g) => g.cityId === 'luoyang').forEach((g) => { g.actionUsed = false; });
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

  it('scenario 003 is caocao vs yuanshao duel', () => {
    const s = createNewGame(SCENARIO_003, 'wei');
    expect(s.factions.map((f) => f.id).sort()).toEqual(['wei', 'yuan']);
    expect(findCity(s, 'ye').factionId).toBe('yuan');
    expect(findCity(s, 'xuchang').factionId).toBe('wei');
    expect(s.generals.some((g) => g.id === 'g_yuanshao')).toBe(true);
    expect(s.wildGenerals.some((w) => w.name === '刘备')).toBe(true);
    const yuanCities = s.cities.filter((c) => c.factionId === 'yuan');
    const weiCities = s.cities.filter((c) => c.factionId === 'wei');
    const yuanTroops = yuanCities.reduce((n, c) => n + c.troops, 0);
    const weiTroops = weiCities.reduce((n, c) => n + c.troops, 0);
    expect(yuanTroops).toBeGreaterThan(weiTroops);
    expect(weiCities.length).toBeGreaterThan(yuanCities.length);
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

  it('recruit uses city resources and consumes general action', () => {
    const s = newState('wei');
    const gid = generalInCity(s, 'luoyang');
    const r = recruitTroops(s, 'luoyang', 50, gid);
    expect(r.success).toBe(true);
    expect(s.generals.find((g) => g.id === gid)!.actionUsed).toBe(true);
  });
});
