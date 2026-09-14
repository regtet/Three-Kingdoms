import { Node, UITransform, view, ResolutionPolicy, screen, Vec3, Widget } from 'cc';
import { RL } from './RemakeLayout';
import { sizeContainMath, sizeCoverMath, uiUniformScale } from './ScreenFitMath';

/**
 * ============================================================================
 * 唯一适配入口（禁止再手改 Camera.orthoHeight / 抢 Canvas 尺寸）
 * ============================================================================
 *
 * - 设计：1080×1920，FIXED_WIDTH（项目设置 fitWidth）
 * - Canvas：场景里 alignCanvasWithScreen + Widget，由引擎对齐屏幕
 * - 背景：原图像素尺寸 + **节点等比 scale** 做 Cover（绝不改宽高比）
 * - UI：1080×1920 设计坐标；仅短屏整体等比缩小
 */

export type DesignSize = { width: number; height: number };

/** 只设设计分辨率；不碰 Camera / Canvas contentSize */
export function applyDesignResolution(): void {
  view.setDesignResolutionSize(RL.W, RL.H, ResolutionPolicy.FIXED_WIDTH);
}

export function getVisibleDesignSize(): DesignSize {
  const vis = view.getVisibleSize();
  if (vis.width > 1 && vis.height > 1) {
    return { width: vis.width, height: vis.height };
  }
  return { width: RL.W, height: RL.H };
}

export function framePixelSize(frame: {
  originalSize?: { width: number; height: number };
  rect: { width: number; height: number };
}): { w: number; h: number } {
  // 优先 originalSize（未裁切），避免 trim 导致宽高比算错 → 看起来像拉伸
  const ow = frame.originalSize?.width ?? 0;
  const oh = frame.originalSize?.height ?? 0;
  if (ow > 1 && oh > 1) return { w: ow, h: oh };
  return {
    w: Math.max(1, frame.rect.width),
    h: Math.max(1, frame.rect.height),
  };
}

/**
 * Cover：contentSize = 原图比例尺寸，再用统一 scale 铺满 box。
 * 禁止用「强行改成 box 宽高」的方式（易踩 Sprite 内部再缩放）。
 */
export function applyCover(
  node: Node,
  frameW: number,
  frameH: number,
  boxW: number,
  boxH: number,
): number {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  ui.setContentSize(frameW, frameH);
  const s = Math.max(boxW / frameW, boxH / frameH);
  node.setScale(s, s, 1);
  node.setPosition(0, 0, 0);
  return s;
}

/** Contain：原图比例 + 统一 scale 放入 box */
export function applyContain(
  node: Node,
  frameW: number,
  frameH: number,
  maxW: number,
  maxH: number,
): number {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  ui.setContentSize(frameW, frameH);
  const s = Math.min(maxW / frameW, maxH / frameH);
  node.setScale(s, s, 1);
  return s;
}

/** @deprecated 保留给测试数学；运行时用 applyCover */
export function sizeCover(
  ui: UITransform,
  frameW: number,
  frameH: number,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  const size = sizeCoverMath(frameW, frameH, boxW, boxH);
  ui.setContentSize(size.width, size.height);
  return size;
}

export function sizeContain(
  ui: UITransform,
  frameW: number,
  frameH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  const size = sizeContainMath(frameW, frameH, maxW, maxH);
  ui.setContentSize(size.width, size.height);
  return size;
}

/** 层跟可见区：只设 size，可用 Widget 贴满父节点（父=Canvas） */
export function matchVisibleSize(node: Node, size: DesignSize = getVisibleDesignSize()): void {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setContentSize(size.width, size.height);
  ui.setAnchorPoint(0.5, 0.5);
}

export function setVisibleLayerSize(node: Node, size?: DesignSize): void {
  matchVisibleSize(node, size);
}

/** 子节点贴满父节点（用于 TitleRoot / Dim），不拉 Sprite 比例——纯色/容器用 */
export function pinFullInParent(node: Node): void {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  const w = node.getComponent(Widget) ?? node.addComponent(Widget);
  w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
  w.top = w.bottom = w.left = w.right = 0;
  w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  w.updateAlignment();
}

/** UI：设计坐标 + 短屏等比缩小（scale 一致，不压扁） */
export function applyDesignUiTransform(
  node: Node,
  designX: number,
  designY: number,
  visibleH: number = getVisibleDesignSize().height,
): number {
  const s = uiUniformScale(visibleH, RL.H);
  node.setPosition(designX * s, designY * s, 0);
  node.setScale(new Vec3(s, s, 1));
  return s;
}

export function getUiUniformScale(visibleH?: number): number {
  return uiUniformScale(visibleH ?? getVisibleDesignSize().height, RL.H);
}

export function debugAdaptInfo(): string {
  const size = getVisibleDesignSize();
  const frame = view.getFrameSize();
  const win = screen.windowSize;
  return `FIXED_WIDTH visible=${size.width.toFixed(0)}x${size.height.toFixed(0)} uiScale=${getUiUniformScale(size.height).toFixed(3)} frame=${frame.width}x${frame.height} win=${win.width}x${win.height}`;
}
