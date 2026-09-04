import { describe, it, expect } from 'vitest';
import { createNewGame, findCity } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { resolveBattle, canAttack } from '../assets/scripts/core/systems/battle';
import { FORMULAS } from '../assets/scripts/core/data/formulas';
import { getRelation, proposeTruce } from '../assets/scripts/core/systems/diplomacy';
import { appointGovernor, moveGeneral } from '../assets/scripts/core/systems/personnel';
import { formatDiplomacyReport } from '../assets/scripts/core/systems/diplomacyReport';
import { dispatchEnvoy } from '../assets/scripts/core/systems/envoy';

function newState() {
  return createNewGame(SCENARIO_001, 'wei');
}

describe('battle ambush and duel', () => {
  it('ambush can appear in battle log when resources allow', () => {
    const s = newState();
    findCity(s, 'xuchang').gold = 500;
    findCity(s, 'xuchang').food = 500;
    findCity(s, 'shouchun').troops = 2500;
    const guojia = s.generals.find((g) => g.id === 'g_guojia')!;
    guojia.cityId = 'xuchang';
    findCity(s, 'xuchang').generalIds.push('g_guojia');
    guojia.actionUsed = false;

    let sawAmbush = false;
    for (let i = 0; i < 20; i++) {
      findCity(s, 'xuchang').gold = 500;
      findCity(s, 'xuchang').food = 500;
      findCity(s, 'shouchun').troops = 2500;
      guojia.actionUsed = false;
      guojia.status = 'idle';
      const r = resolveBattle(s, {
        attackerGeneralId: 'g_guojia',
        attackerTroops: 1200,
        fromCityId: 'xuchang',
        targetCityId: 'shouchun',
        stratagemId: 'ambush',
      });
      if (r.log.some((l) => l.includes('伏兵'))) {
        sawAmbush = true;
        break;
      }
    }
    expect(sawAmbush).toBe(true);
    expect(FORMULAS.stratagem.ambush.minIntelligence).toBeLessThanOrEqual(98);
  });

  it('rejects ambush when intelligence too low and still logs', () => {
    const s = newState();
    findCity(s, 'xuchang').gold = 500;
    findCity(s, 'xuchang').food = 500;
    const r = resolveBattle(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1000,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
      stratagemId: 'ambush',
    });
    expect(r.log.some((l) => l.includes('智力') || l.includes('伏兵'))).toBe(true);
  });

  it('duel line appears when both sides have high force', () => {
    const s = newState();
    findCity(s, 'xuchang').troops = 3000;
    findCity(s, 'shouchun').troops = 2000;
    const check = canAttack(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1500,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
      tryDuel: true,
    });
    expect(check.ok).toBe(true);
    const r = resolveBattle(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 1500,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
      tryDuel: true,
    });
    expect(r.log.some((l) => l.includes('一骑讨'))).toBe(true);
  });

  it('attacking ally breaks pact', () => {
    const s = newState();
    proposeTruce(s, 'wei', 'wu');
    expect(getRelation(s, 'wei', 'wu')).toBe('truce');
    expect(canAttack(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 800,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    }).ok).toBe(true);
    resolveBattle(s, {
      attackerGeneralId: 'g_xuchu',
      attackerTroops: 800,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    });
    expect(getRelation(s, 'wei', 'wu')).toBe('hostile');
  });
});

describe('personnel governor status', () => {
  it('replacing governor clears previous governor status', () => {
    const s = newState();
    appointGovernor(s, 'luoyang', 'g_caocao');
    expect(s.generals.find((g) => g.id === 'g_caocao')!.status).toBe('governor');
    appointGovernor(s, 'luoyang', 'g_xiahoudun');
    expect(s.generals.find((g) => g.id === 'g_caocao')!.status).toBe('idle');
    expect(s.generals.find((g) => g.id === 'g_xiahoudun')!.status).toBe('governor');
  });

  it('moving governor clears governor status', () => {
    const s = newState();
    appointGovernor(s, 'luoyang', 'g_caocao');
    const cao = s.generals.find((g) => g.id === 'g_caocao')!;
    cao.actionUsed = false;
    const r = moveGeneral(s, 'g_caocao', 'xuchang');
    expect(r.success).toBe(true);
    expect(findCity(s, 'luoyang').governorId).toBeNull();
    expect(cao.status).toBe('idle');
  });
});

describe('diplomacy report envoys', () => {
  it('lists traveling envoys', () => {
    const s = newState();
    findCity(s, 'xuchang').gold = 500;
    dispatchEnvoy(s, 'xuchang', 'g_dianwei', 'wu', 'gift');
    const report = formatDiplomacyReport(s);
    expect(report).toContain('使者在途');
    expect(report).toContain('典韦');
  });
});
