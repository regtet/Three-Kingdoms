import { describe, expect, it } from 'vitest';
import {
  assertTitleAdapt,
  sizeContainMath,
  sizeCoverMath,
  uiUniformScale,
  visibleDesignSizeMath,
} from '../assets/remake/shared/ScreenFitMath';

const BG = { w: 2000, h: 3000 };

describe('主菜单三分辨率适配契约', () => {
  const cases = [
    { name: '1080x1920', sw: 1080, sh: 1920 },
    { name: '1080x2160', sw: 1080, sh: 2160 },
    { name: '1080x2400', sw: 1080, sh: 2400 },
  ];

  for (const c of cases) {
    it(`${c.name}：背景 Cover 不变形、UI 等比、按钮设计尺寸不变`, () => {
      const r = assertTitleAdapt({
        designW: 1080,
        designH: 1920,
        screenW: c.sw,
        screenH: c.sh,
        bgFrameW: BG.w,
        bgFrameH: BG.h,
        btnW: 720,
        btnH: 140,
      });
      expect(r.visible.width).toBe(1080);
      expect(r.visible.height).toBeCloseTo(1080 * (c.sh / c.sw), 0);
      expect(r.bg.width / r.bg.height).toBeCloseTo(BG.w / BG.h, 2);
      expect(r.bg.width).toBeGreaterThanOrEqual(r.visible.width);
      expect(r.bg.height).toBeGreaterThanOrEqual(r.visible.height);
      // 三档均 ≥ 1920 高 → UI scale = 1，按钮保持设计宽高
      expect(r.uiScale).toBe(1);
      expect(r.btnW).toBe(720);
      expect(r.btnH).toBe(140);
    });
  }

  it('短屏时 UI 仅等比缩小', () => {
    expect(uiUniformScale(1440, 1920)).toBeCloseTo(0.75, 5);
    expect(uiUniformScale(1920, 1920)).toBe(1);
    expect(uiUniformScale(2400, 1920)).toBe(1);
  });

  it('Logo Contain 不变形', () => {
    const r = sizeContainMath(1600, 600, 780, 320);
    expect(r.width / r.height).toBeCloseTo(1600 / 600, 2);
    expect(r.width).toBeLessThanOrEqual(780);
    expect(r.height).toBeLessThanOrEqual(320);
  });

  it('可见区保宽', () => {
    const v = visibleDesignSizeMath(1080, 1920, 1080, 2400);
    expect(v).toEqual({ width: 1080, height: 2400 });
  });

  it('Cover 数学不拉伸', () => {
    const r = sizeCoverMath(2000, 1000, 1080, 2400);
    expect(r.width / r.height).toBeCloseTo(2, 2);
  });
});
