import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MENU_BACKGROUND_ID,
  MENU_BACKGROUNDS,
  getMenuBackgroundLabel,
  nextMenuBackgroundId,
  normalizeMenuBackgroundId,
} from '../assets/scripts/core/data/menuBackgrounds';

describe('menuBackgrounds', () => {
  it('has 13 unique background ids', () => {
    const ids = MENU_BACKGROUNDS.map((b) => b.id);
    expect(ids.length).toBe(13);
    expect(new Set(ids).size).toBe(13);
  });

  it('cycles through backgrounds', () => {
    const first = DEFAULT_MENU_BACKGROUND_ID;
    const second = nextMenuBackgroundId(first);
    expect(second).not.toBe(first);
    let id = first;
    for (let i = 0; i < MENU_BACKGROUNDS.length; i++) id = nextMenuBackgroundId(id);
    expect(id).toBe(first);
  });

  it('normalizes unknown id to default', () => {
    expect(normalizeMenuBackgroundId('invalid')).toBe(DEFAULT_MENU_BACKGROUND_ID);
    expect(getMenuBackgroundLabel('bg_hulao_pass')).toBe('虎牢关');
  });
});
