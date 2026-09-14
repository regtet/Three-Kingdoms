/**
 * 主菜单分辨率适配纯函数（无 cc）。
 *
 * 契约：
 * - FIXED_WIDTH 保宽 1080
 * - 背景 Cover 可见区，居中，不变形
 * - UI 固定在 1080×1920 设计坐标；仅整体等比缩放（短屏），不拉扁
 */

export function sizeCoverMath(
  frameW: number,
  frameH: number,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  const scale = Math.max(boxW / Math.max(1, frameW), boxH / Math.max(1, frameH));
  return {
    width: Math.ceil(frameW * scale),
    height: Math.ceil(frameH * scale),
  };
}

export function sizeContainMath(
  frameW: number,
  frameH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  const scale = Math.min(maxW / Math.max(1, frameW), maxH / Math.max(1, frameH));
  return {
    width: Math.round(frameW * scale),
    height: Math.round(frameH * scale),
  };
}

export function visibleDesignSizeMath(
  designW: number,
  _designH: number,
  screenW: number,
  screenH: number,
): { width: number; height: number } {
  const sw = Math.max(1, screenW);
  const sh = Math.max(1, screenH);
  return { width: designW, height: designW * (sh / sw) };
}

/** UI 整体等比缩放：仅当可见高 < 设计高时缩小，永不非等比拉伸 */
export function uiUniformScale(visibleH: number, designH: number): number {
  if (designH <= 0) return 1;
  return Math.min(1, visibleH / designH);
}

/**
 * 校验某一分辨率下：背景 Cover 不变形、UI 缩放为等比、按钮设计尺寸不变。
 */
export function assertTitleAdapt(opts: {
  designW: number;
  designH: number;
  screenW: number;
  screenH: number;
  bgFrameW: number;
  bgFrameH: number;
  btnW: number;
  btnH: number;
}): {
  visible: { width: number; height: number };
  bg: { width: number; height: number };
  uiScale: number;
  btnW: number;
  btnH: number;
} {
  const visible = visibleDesignSizeMath(
    opts.designW,
    opts.designH,
    opts.screenW,
    opts.screenH,
  );
  const bg = sizeCoverMath(opts.bgFrameW, opts.bgFrameH, visible.width, visible.height);
  const uiScale = uiUniformScale(visible.height, opts.designH);
  const bgAspect = bg.width / bg.height;
  const frameAspect = opts.bgFrameW / opts.bgFrameH;
  if (Math.abs(bgAspect - frameAspect) > 0.01) {
    throw new Error(`bg stretched: ${bgAspect} vs ${frameAspect}`);
  }
  if (bg.width < visible.width - 1 || bg.height < visible.height - 1) {
    throw new Error('bg does not cover visible');
  }
  return {
    visible,
    bg,
    uiScale,
    btnW: opts.btnW,
    btnH: opts.btnH,
  };
}
