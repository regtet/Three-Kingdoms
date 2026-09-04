import { describe, it, expect } from 'vitest';
import {
  createHexBattle,
  hexAttack,
  hexAdvance,
  hexDistance,
  hexEq,
  hexesInRadius,
  hexMoveTo,
  hexNeighbors,
  hexRetreat,
  hexStepToward,
  hexToPixel,
  hexWait,
  inHexRadius,
} from '../assets/scripts/core/systems/hexBattle';

describe('hex battle', () => {
  it('radius 2 board has 19 cells', () => {
    expect(hexesInRadius(2).length).toBe(19);
  });

  it('each cell has six neighbors; distance is axial', () => {
    expect(hexNeighbors({ q: 0, r: 0 }).length).toBe(6);
    expect(hexDistance({ q: -2, r: 1 }, { q: 2, r: -1 })).toBe(4);
    expect(inHexRadius({ q: 2, r: 0 }, 2)).toBe(true);
    expect(inHexRadius({ q: 3, r: 0 }, 2)).toBe(false);
  });

  it('step toward reduces hex distance', () => {
    const from = { q: -2, r: 1 };
    const to = { q: 2, r: -1 };
    const step = hexStepToward(from, to, 2)!;
    expect(hexDistance(step, to)).toBeLessThan(hexDistance(from, to));
  });

  it('pixel mapping is pointy-top (odd-r stagger on q axis)', () => {
    const a = hexToPixel({ q: 1, r: 0 }, 10);
    const b = hexToPixel({ q: 0, r: 1 }, 10);
    expect(a.x).toBeGreaterThan(0);
    expect(b.y).toBeGreaterThan(0);
  });

  it('advance then attack when adjacent', () => {
    const s = createHexBattle();
    expect(hexDistance(s.player, s.enemy)).toBe(4);
    hexAdvance(s);
    hexAdvance(s);
    expect(s.done).toBe(false);
    expect(hexDistance(s.player, s.enemy)).toBeLessThanOrEqual(1);
    hexAttack(s);
    expect(s.done).toBe(true);
    expect(s.retreated).toBe(false);
    expect(s.modifier).toBe(1.2);
  });

  it('cannot move two hexes in one order', () => {
    const s = createHexBattle();
    const far = { q: 0, r: 0 };
    expect(hexMoveTo(s, far)).toBe(false);
    expect(hexEq(s.player, { q: -2, r: 1 })).toBe(true);
  });

  it('retreat cancels with penalty', () => {
    const s = createHexBattle();
    hexRetreat(s);
    expect(s.done).toBe(true);
    expect(s.retreated).toBe(true);
    expect(s.modifier).toBe(0.8);
  });

  it('wait consumes turns until melee', () => {
    const s = createHexBattle();
    hexWait(s);
    expect(s.turn).toBeGreaterThanOrEqual(1);
    expect(s.logs.some((l) => l.includes('整顿') || l.includes('敌军'))).toBe(true);
  });
});
