import { describe, it, expect } from 'vitest';
import { createNewGame, findCity, getCityGenerals } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { useUndermineLoyalty, useSleeper } from '../assets/scripts/core/systems/stratagem';
import { resolveStrategyEffects, getActiveEffectsOnGeneral } from '../assets/scripts/core/systems/strategyEffects';
import { resolveBattle } from '../assets/scripts/core/systems/battle';
import { monthlySettlement } from '../assets/scripts/core/systems/income';
import { getActableGeneralsInCity } from '../assets/scripts/core/systems/actionGuard';

function newState() {
  return createNewGame(SCENARIO_001, 'wei');
}

describe('strategy effects', () => {
  it('undermine reduces loyalty and adds erosion effect', () => {
    const s = newState();
    findCity(s, 'huaibei').gold = 500;
    const targetCity = 'shouchun';
    const defender = getCityGenerals(s, targetCity)[0];
    const before = defender.loyalty;

    let ok = false;
    for (let i = 0; i < 30; i++) {
      defender.loyalty = before;
      s.strategyEffects = [];
      findCity(s, 'huaibei').gold = 500;
      s.generals.filter((g) => g.cityId === 'huaibei').forEach((g) => { g.actionUsed = false; });
      const r = useUndermineLoyalty(s, 'huaibei', 'g_guojia', targetCity);
      if (r.success) {
        ok = true;
        expect(defender.loyalty).toBeLessThan(before);
        expect(getActiveEffectsOnGeneral(s, defender.id, 'loyalty_erosion').length).toBe(1);
        break;
      }
    }
    expect(ok).toBe(true);
  });

  it('sleeper can trigger defection in battle', () => {
    const s = newState();
    findCity(s, 'huaibei').gold = 500;
    const targetCity = 'shouchun';
    const defender = getCityGenerals(s, targetCity)[0];
    defender.loyalty = 30;

    let sleeperOk = false;
    for (let i = 0; i < 30; i++) {
      s.strategyEffects = [];
      findCity(s, 'huaibei').gold = 500;
      s.generals.filter((g) => g.cityId === 'huaibei').forEach((g) => { g.actionUsed = false; });
      defender.loyalty = 30;
      const r = useSleeper(s, 'huaibei', 'g_guojia', targetCity);
      if (r.success) {
        sleeperOk = true;
        expect(getActiveEffectsOnGeneral(s, defender.id, 'sleeper').length).toBe(1);
        break;
      }
    }
    expect(sleeperOk).toBe(true);

    let defected = false;
    for (let i = 0; i < 40; i++) {
      defender.factionId = findCity(s, targetCity).factionId;
      defender.cityId = targetCity;
      if (!s.cities.find((c) => c.id === targetCity)!.generalIds.includes(defender.id)) {
        findCity(s, targetCity).generalIds.push(defender.id);
      }
      s.strategyEffects.forEach((e) => { if (e.type === 'sleeper') e.status = 'active'; });
      const result = resolveBattle(s, {
        attackerGeneralId: 'g_xuchu',
        attackerTroops: 800,
        fromCityId: 'xuchang',
        targetCityId: targetCity,
      });
      if (result.log.some((l) => l.includes('寝返'))) {
        defected = true;
        break;
      }
    }
    expect(defected).toBe(true);
  });

  it('monthly settlement resolves loyalty erosion', () => {
    const s = newState();
    const g = s.generals.find((x) => x.id === 'g_guojia')!;
    s.strategyEffects.push({
      id: 'test',
      type: 'loyalty_erosion',
      sourceFactionId: 'wei',
      sourceGeneralId: 'g_caocao',
      targetGeneralId: g.id,
      magnitude: 5,
      turnsRemaining: 1,
      status: 'active',
    });
    g.loyalty = 80;
    monthlySettlement(s);
    expect(g.loyalty).toBeLessThan(80);
    expect(s.strategyEffects.length).toBe(0);
  });
});
