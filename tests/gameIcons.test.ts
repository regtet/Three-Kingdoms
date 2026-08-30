import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GAME_ICON_ID,
  GAME_ICONS,
  getGameIconLabel,
  nextGameIconId,
  normalizeGameIconId,
} from '../assets/scripts/core/data/gameIcons';

describe('gameIcons', () => {
  it('has 7 unique icon ids', () => {
    const ids = GAME_ICONS.map((i) => i.id);
    expect(ids.length).toBe(7);
    expect(new Set(ids).size).toBe(7);
  });

  it('cycles through icons', () => {
    let id = DEFAULT_GAME_ICON_ID;
    for (let i = 0; i < GAME_ICONS.length; i++) id = nextGameIconId(id);
    expect(id).toBe(DEFAULT_GAME_ICON_ID);
  });

  it('normalizes unknown id', () => {
    expect(normalizeGameIconId('bad')).toBe(DEFAULT_GAME_ICON_ID);
    expect(getGameIconLabel('icon_07')).toBe('寒夜围营');
  });
});
