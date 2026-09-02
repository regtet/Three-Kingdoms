import { describe, it, expect } from 'vitest';
import {
  fitCover,
  fitContain,
  fitWidth,
  fitWidthInBox,
  portraitDesignSize,
  spriteFrameDisplaySize,
  spriteFrameLogicalSize,
  spriteFramePixelSize,
  spriteFramePortraitSize,
} from '../assets/scripts/core/utils/spriteFitMath';

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

  it('spriteFrameDisplaySize prefers trimmed rect for logo aspect', () => {
    const size = spriteFrameDisplaySize({ width: 879, height: 439 }, { width: 1024, height: 1024 });
    expect(size.w).toBe(879);
    expect(size.h).toBe(439);
  });

  it('spriteFramePortraitSize prefers originalSize for full portrait', () => {
    const size = spriteFramePortraitSize({ width: 571, height: 1024 }, { width: 1024, height: 1024 });
    expect(size.w).toBe(1024);
    expect(size.h).toBe(1024);
  });

  it('spriteFramePixelSize alias uses display size', () => {
    const size = spriteFramePixelSize({ width: 879, height: 439 }, { width: 1024, height: 1024 });
    expect(size.w).toBe(879);
    expect(size.h).toBe(439);
  });

  it('logo fits in menu box without stretch', () => {
    const { w, h } = fitContain(520, 260, 879, 439);
    expect(w / h).toBeCloseTo(879 / 439, 2);
    expect(w).toBeLessThanOrEqual(520);
    expect(h).toBeLessThanOrEqual(260);
  });

  it('fitWidthInBox fills card width', () => {
    const { w, h } = fitWidthInBox(150, 1024, 1024);
    expect(w).toBe(150);
    expect(h).toBe(150);
  });

  it('portraitDesignSize converts pixelsToUnit', () => {
    const { w, h } = portraitDesignSize(1024, 1024, 100);
    expect(w).toBeCloseTo(10.24, 2);
    expect(h).toBeCloseTo(10.24, 2);
  });
});
