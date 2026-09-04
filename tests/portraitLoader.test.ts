import { describe, it, expect } from 'vitest';
import { resolvePortraitFrameKeys, PORTRAIT_ID_ALIASES } from '../assets/scripts/core/data/portraitMap';
import { resolveGeneralRoster } from '../assets/scripts/core/data/generalRoster';
import { categoryUsesGeneralPicker } from '../assets/scripts/ui/OfficialLayout';

describe('resolvePortraitFrameKeys', () => {
  it('resolves game general id directly', () => {
    expect(resolvePortraitFrameKeys('g_caocao')).toContain('g_caocao');
  });

  it('resolves pool id with pool_ prefix', () => {
    const keys = resolvePortraitFrameKeys('lu_bu');
    expect(keys).toContain('lu_bu');
    expect(keys).toContain('pool_lu_bu');
  });

  it('includes wild alias', () => {
    expect(resolvePortraitFrameKeys('wild_taishici')).toContain('g_taishici');
  });

  it('maps guandu generals to pool frames', () => {
    expect(PORTRAIT_ID_ALIASES.g_yuanshao).toBe('yuan_shao');
    const keys = resolvePortraitFrameKeys('g_yuanshao');
    expect(keys).toContain('yuan_shao');
    expect(keys).toContain('pool_yuan_shao');
  });

  it('maps wild liubei to g_liubei', () => {
    expect(resolvePortraitFrameKeys('wild_liubei')).toContain('g_liubei');
  });
});

describe('resolveGeneralRoster aliases', () => {
  it('resolves guandu ids to named roster stats', () => {
    const r = resolveGeneralRoster('g_yuanshao', '袁绍');
    expect(r.name).toBe('袁绍');
    expect(r.force).toBe(62);
  });
});

describe('MapSubPanelCommands helpers', () => {
  it('diplomacy uses general picker', () => {
    expect(categoryUsesGeneralPicker('外交')).toBe(true);
    expect(categoryUsesGeneralPicker('内政')).toBe(true);
  });
});
