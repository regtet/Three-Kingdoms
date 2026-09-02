import { describe, it, expect } from 'vitest';
import { resolvePortraitFrameKeys } from '../assets/scripts/core/data/portraitMap';

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
});
