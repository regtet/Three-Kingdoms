import { describe, it, expect } from 'vitest';
import { RL, RC } from '../assets/scripts/remake/shared/RemakeLayout';
import { RemakeNav } from '../assets/scripts/remake/shared/RemakeNav';
import { ACTIVE_REMAKE_PHASE, REMAKE_BUILD_TAG } from '../assets/scripts/remake/version';

describe('remake framework', () => {
  it('design resolution stays 720x1280', () => {
    expect(RL.W).toBe(720);
    expect(RL.H).toBe(1280);
    expect(RC.bg.a).toBe(255);
  });

  it('title menu items have vertical gap', () => {
    const gap = RL.TITLE_ITEM_GAP - RL.TITLE_ITEM_H;
    expect(gap).toBeGreaterThanOrEqual(8);
  });

  it('page list stays above back button', () => {
    const listBottom = RL.PAGE_LIST_START_Y - 4 * RL.PAGE_LIST_GAP - RL.TITLE_ITEM_H / 2;
    const backTop = RL.PAGE_BACK_Y + 24;
    expect(listBottom).toBeGreaterThan(backTop);
  });

  it('phase gate is menu', () => {
    expect(ACTIVE_REMAKE_PHASE).toBe('menu');
    expect(REMAKE_BUILD_TAG.startsWith('REMAKE-')).toBe(true);
  });

  it('RemakeNav shows one layer', () => {
    const nav = new RemakeNav();
    const a = { active: false } as any;
    const b = { active: false } as any;
    nav.register('a', a);
    nav.register('b', b);
    nav.show('a');
    expect(a.active).toBe(true);
    expect(b.active).toBe(false);
    nav.show('b');
    expect(a.active).toBe(false);
    expect(b.active).toBe(true);
  });
});
