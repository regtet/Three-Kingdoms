export function spriteFramePixelSize(rect: { width: number; height: number }, original?: { width: number; height: number }) {
  const w = rect.width > 0 ? rect.width : (original?.width ?? 1);
  const h = rect.height > 0 ? rect.height : (original?.height ?? 1);
  return { w: Math.max(1, w), h: Math.max(1, h) };
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
