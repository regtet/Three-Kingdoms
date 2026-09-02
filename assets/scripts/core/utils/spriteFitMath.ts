/** 立绘缩放用逻辑尺寸：优先 originalSize，避免 auto-trim 后 rect 过小导致局部放大 */
export function spriteFrameLogicalSize(
  rect: { width: number; height: number },
  original?: { width: number; height: number },
  texture?: { width: number; height: number },
) {
  if (original && original.width > 0 && original.height > 0) {
    return { w: original.width, h: original.height };
  }
  if (texture && texture.width > 0 && texture.height > 0) {
    return { w: texture.width, h: texture.height };
  }
  const w = rect.width > 0 ? rect.width : 1;
  const h = rect.height > 0 ? rect.height : 1;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

/** 一般 UI（Logo/背景）：优先 rect，保持 trim 后真实宽高比 */
export function spriteFrameDisplaySize(
  rect: { width: number; height: number },
  original?: { width: number; height: number },
  texture?: { width: number; height: number },
) {
  if (rect.width > 0 && rect.height > 0) {
    return { w: rect.width, h: rect.height };
  }
  return spriteFrameLogicalSize(rect, original, texture);
}

/** 立绘专用尺寸 */
export function spriteFramePortraitSize(
  rect: { width: number; height: number },
  original?: { width: number; height: number },
  texture?: { width: number; height: number },
) {
  return spriteFrameLogicalSize(rect, original, texture);
}

/** @deprecated 使用 spriteFrameDisplaySize 或 spriteFramePortraitSize */
export function spriteFramePixelSize(rect: { width: number; height: number }, original?: { width: number; height: number }) {
  return spriteFrameDisplaySize(rect, original);
}

/** 等比放大铺满容器（可裁切） */
export function fitCover(boxW: number, boxH: number, mediaW: number, mediaH: number) {
  const scale = Math.max(boxW / mediaW, boxH / mediaH);
  return {
    w: Math.round(mediaW * scale),
    h: Math.round(mediaH * scale),
  };
}

/** 等比缩小完整显示（可留边） */
export function fitContain(boxW: number, boxH: number, mediaW: number, mediaH: number) {
  const scale = Math.min(boxW / mediaW, boxH / mediaH);
  return {
    w: Math.round(mediaW * scale),
    h: Math.round(mediaH * scale),
  };
}

/** 按宽度等比缩放 */
export function fitWidth(mediaW: number, mediaH: number, targetW: number) {
  const aspect = mediaW / Math.max(1, mediaH);
  return { w: targetW, h: Math.round(targetW / aspect) };
}

/** 按容器宽度铺满，高度等比（顶对齐时可裁切底部） */
export function fitWidthInBox(boxW: number, mediaW: number, mediaH: number) {
  const scale = boxW / Math.max(1, mediaW);
  return { w: boxW, h: Math.round(mediaH * scale) };
}

/** SpriteFrame 在 UI 设计坐标下的尺寸 */
export function portraitDesignSize(originalW: number, originalH: number, pixelsToUnit = 100) {
  const ptu = pixelsToUnit > 0 ? pixelsToUnit : 100;
  return { w: originalW / ptu, h: originalH / ptu };
}
