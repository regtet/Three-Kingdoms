import { describe, it, expect } from 'vitest';
import {
  buildGalleryCatalog,
  filterGalleryByTroop,
  formatTroopAdaptLine,
} from '../assets/scripts/core/data/generalCatalog';
import { getScenarioMeta } from '../assets/scripts/core/data/scenarioMeta';
import { hasAnySave, MAX_SAVE_SLOTS } from '../assets/scripts/core/systems/save';
import { L } from '../assets/scripts/ui/OfficialLayout';

describe('generalCatalog', () => {
  it('has unique gallery ids', () => {
    const list = buildGalleryCatalog();
    const ids = list.map((g) => g.id);
    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entries use roster stats and strategic troop adapt', () => {
    const g = buildGalleryCatalog().find((x) => x.id === 'g_caocao');
    expect(g).toBeTruthy();
    expect(g!.name).toBe('曹操');
    expect(g!.adapt.cavalry).toBe('S');
    expect(g!.adapt.siege).toBe('C');
    expect(g!.bio).toContain('官渡');
    expect(formatTroopAdaptLine(g!.adapt)).toContain('骑兵S');
  });

  it('zhou tai is shield specialist not generic cavalry', () => {
    const g = buildGalleryCatalog().find((x) => x.id === 'zhou_tai');
    expect(g!.troop).toBe('shield');
    expect(g!.adapt.shield).toBe('S');
  });

  it('filters by strategic troop type', () => {
    const all = buildGalleryCatalog();
    const shields = filterGalleryByTroop(all, 'shield');
    expect(shields.length).toBeGreaterThan(0);
    expect(shields.some((g) => g.adapt.shield === 'S' || g.troop === 'shield')).toBe(true);
  });

  it('gallery table columns fit within table width', () => {
    const pad = 12;
    const used = 96 + 56 * 6 + pad * 2;
    expect(used).toBeLessThanOrEqual(L.LOBBY_GALLERY_TABLE_W);
  });
});

describe('scenarioMeta', () => {
  it('covers both scenarios', () => {
    expect(getScenarioMeta('scenario_001').detail.length).toBeGreaterThan(10);
    expect(getScenarioMeta('scenario_002').summary).toContain('208');
  });
});

describe('save hasAnySave', () => {
  it('exports hasAnySave and MAX_SAVE_SLOTS', () => {
    expect(typeof hasAnySave()).toBe('boolean');
    expect(MAX_SAVE_SLOTS).toBe(3);
  });
});
