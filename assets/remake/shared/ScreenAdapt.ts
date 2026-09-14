import {
  Node,
  Sprite,
  SpriteFrame,
  UIOpacity,
  UITransform,
  view,
  ResolutionPolicy,
  screen,
  Vec3,
  Widget,
  Tween,
} from 'cc';
import { RL } from './RemakeLayout';
import { sizeContainMath, sizeCoverMath, uiUniformScale } from './ScreenFitMath';

/**
 * ============================================================================
 * 唯一适配入口（禁止再手改 Camera.orthoHeight / 抢 Canvas 尺寸）
 * ============================================================================
 */

export type DesignSize = { width: number; height: number };

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

/**
 * Sprite 实际绘制区域用 rect（不要用 originalSize）。
 * CUSTOM + originalSize 会把裁切后的像素硬拉进未裁切盒子 → Logo 拉伸。
 */
export function framePixelSize(frame: {
  originalSize?: { width: number; height: number };
  rect: { width: number; height: number };
}): { w: number; h: number } {
  return {
    w: Math.max(1, frame.rect.width),
    h: Math.max(1, frame.rect.height),
  };
}

/**
 * Cover：TRIMMED 自然尺寸 + 节点统一 scale。
 */
export function applySpriteCover(
  node: Node,
  sp: Sprite,
  frame: SpriteFrame,
  boxW: number,
  boxH: number,
): number {
  sp.sizeMode = Sprite.SizeMode.TRIMMED;
  sp.spriteFrame = frame;
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  const fw = Math.max(1, ui.contentSize.width);
  const fh = Math.max(1, ui.contentSize.height);
  const s = Math.max(boxW / fw, boxH / fh);
  node.setScale(s, s, 1);
  node.setPosition(0, 0, 0);
  return s;
}

/** Contain：TRIMMED + 统一 scale 放入框内 */
export function applySpriteContain(
  node: Node,
  sp: Sprite,
  frame: SpriteFrame,
  maxW: number,
  maxH: number,
): number {
  sp.sizeMode = Sprite.SizeMode.TRIMMED;
  sp.spriteFrame = frame;
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  const fw = Math.max(1, ui.contentSize.width);
  const fh = Math.max(1, ui.contentSize.height);
  const s = Math.min(maxW / fw, maxH / fh);
  node.setScale(s, s, 1);
  return s;
}

/** @deprecated */
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

/** @deprecated */
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

export function matchVisibleSize(node: Node, size: DesignSize = getVisibleDesignSize()): void {
  if (!node.isValid) return;
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setContentSize(size.width, size.height);
  ui.setAnchorPoint(0.5, 0.5);
}

export function setVisibleLayerSize(node: Node, size?: DesignSize): void {
  matchVisibleSize(node, size);
}

export function pinFullInParent(node: Node): void {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setAnchorPoint(0.5, 0.5);
  const w = node.getComponent(Widget) ?? node.addComponent(Widget);
  w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
  w.top = w.bottom = w.left = w.right = 0;
  w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  w.updateAlignment();
}

export function applyDesignUiTransform(
  node: Node,
  designX: number,
  designY: number,
  visibleH: number = getVisibleDesignSize().height,
): number {
  if (!node.isValid) return 1;
  const s = uiUniformScale(visibleH, RL.H);
  node.setPosition(designX * s, designY * s, 0);
  node.setScale(new Vec3(s, s, 1));
  return s;
}

export function getUiUniformScale(visibleH?: number): number {
  return uiUniformScale(visibleH ?? getVisibleDesignSize().height, RL.H);
}

/** 销毁前停 tween，避免 TypeError: _uiProps of null */
export function safeClearChildren(node: Node): void {
  if (!node.isValid) return;
  const stopDeep = (n: Node) => {
    if (!n.isValid) return;
    Tween.stopAllByTarget(n);
    const op = n.getComponent(UIOpacity);
    if (op) Tween.stopAllByTarget(op);
    for (const c of [...n.children]) stopDeep(c);
  };
  stopDeep(node);
  node.destroyAllChildren();
}

export function debugAdaptInfo(): string {
  const size = getVisibleDesignSize();
  const frame = view.getFrameSize();
  const win = screen.windowSize;
  return `FIXED_WIDTH visible=${size.width.toFixed(0)}x${size.height.toFixed(0)} uiScale=${getUiUniformScale(size.height).toFixed(3)} frame=${frame.width}x${frame.height} win=${win.width}x${win.height}`;
}
