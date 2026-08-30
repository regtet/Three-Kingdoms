import { describe, it, expect } from 'vitest';
import { fitCover, fitContain, fitWidth, spriteFramePixelSize } from '../assets/scripts/core/utils/spriteFitMath';

describe('SpriteFit', () => {
  it('cover fills portrait box without changing aspect', () => {
    const { w, h } = fitCover(720, 1280, 1920, 1080);
    expect(w / h).toBeCloseTo(1920 / 1080, 2);
    expect(w).toBeGreaterThanOrEqual(720);
    expect(h).toBeGreaterThanOrEqual(1280);
  });

  it('contain fits landscape video in portrait box', () => {
    const { w, h } = fitContain(720, 1280, 1920, 1080);
    expect(w / h).toBeCloseTo(1920 / 1080, 2);
    expect(w).toBeLessThanOrEqual(720);
    expect(h).toBeLessThanOrEqual(1280);
  });

  it('fitWidth preserves aspect', () => {
    const { w, h } = fitWidth(879, 439, 520);
    expect(w).toBe(520);
    expect(h).toBe(Math.round(520 / (879 / 439)));
  });

  it('spriteFramePixelSize prefers rect', () => {
    const size = spriteFramePixelSize({ width: 571, height: 1024 }, { width: 1024, height: 1024 });
    expect(size.w).toBe(571);
    expect(size.h).toBe(1024);
  });
});
