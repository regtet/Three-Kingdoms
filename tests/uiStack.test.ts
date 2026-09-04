import { describe, it, expect, vi } from 'vitest';
import { UIStack } from '../assets/scripts/ui/UIStack';
import { ScreenNavigator, type GameScreen } from '../assets/scripts/ui/ScreenNavigator';
import { getMapLayout, getScenario } from '../assets/scripts/core/data/scenarios/index';

describe('UIStack', () => {
  it('push pop closes in LIFO order', () => {
    const stack = new UIStack();
    const order: string[] = [];
    stack.push({ id: 'a', close: () => order.push('a') });
    stack.push({ id: 'b', close: () => order.push('b') });
    stack.popAndClose();
    expect(order).toEqual(['b']);
    stack.popAndClose();
    expect(order).toEqual(['b', 'a']);
  });

  it('close(id) invokes matching entry only', () => {
    const stack = new UIStack();
    const a = vi.fn();
    const b = vi.fn();
    stack.push({ id: 'a', close: a });
    stack.push({ id: 'b', close: b });
    stack.close('a');
    expect(a).toHaveBeenCalledOnce();
    expect(b).not.toHaveBeenCalled();
    expect(stack.has('b')).toBe(true);
  });

  it('push same id replaces previous without duplicate', () => {
    const stack = new UIStack();
    stack.push({ id: 'panel', close: () => {} });
    stack.push({ id: 'panel', close: () => {} });
    expect(stack.size).toBe(1);
  });
});

describe('ScreenNavigator', () => {
  it('activates only the target layer', () => {
    const layers = {
      menu: { active: false },
      saveList: { active: false },
      scenario: { active: false },
      scenarioDetail: { active: false },
      faction: { active: false },
      generalGallery: { active: false },
      backgroundGallery: { active: false },
      settings: { active: false },
      map: { active: false },
      end: { active: false },
    } as Record<GameScreen, { active: boolean }>;
    const nav = new ScreenNavigator(layers as never, () => {});
    nav.show('map');
    expect(layers.map.active).toBe(true);
    expect(layers.menu.active).toBe(false);
    expect(nav.current).toBe('map');
  });
});

describe('getMapLayout', () => {
  it('returns cities for scenario id', () => {
    const layout = getMapLayout('scenario_002');
    expect(layout.length).toBeGreaterThan(0);
    expect(layout.some((c) => c.id === 'shouchun')).toBe(true);
  });

  it('matches getScenario cities reference', () => {
    const s = getScenario('scenario_001');
    expect(getMapLayout(s)).toBe(s.cities);
  });
});
