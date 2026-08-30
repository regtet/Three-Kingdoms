import { describe, it, expect } from 'vitest';
import { buildGalleryCatalog } from '../assets/scripts/core/data/generalCatalog';
import { getScenarioMeta } from '../assets/scripts/core/data/scenarioMeta';
import { hasAnySave, MAX_SAVE_SLOTS } from '../assets/scripts/core/systems/save';

describe('generalCatalog', () => {
  it('has unique gallery ids', () => {
    const list = buildGalleryCatalog();
    const ids = list.map((g) => g.id);
    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entries include skill and bio', () => {
    const g = buildGalleryCatalog()[0];
    expect(g.skill.length).toBeGreaterThan(0);
    expect(g.bio.length).toBeGreaterThan(4);
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
