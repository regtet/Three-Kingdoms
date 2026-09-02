import { Node, Sprite, SpriteFrame, UITransform } from 'cc';
import {
  fitContain,
  fitCover,
  fitWidth,
  fitWidthInBox,
  portraitDesignSize as designSizeFromPixels,
  spriteFrameDisplaySize,
  spriteFramePortraitSize as portraitSizeFromRect,
} from '../core/utils/spriteFitMath';

export { fitContain, fitCover, fitWidth, fitWidthInBox } from '../core/utils/spriteFitMath';

/** 一般 UI 尺寸（Logo/背景，保持 trim 后宽高比） */
export function spriteFramePixelSize(sf: SpriteFrame): { w: number; h: number } {
  return spriteFrameDisplaySize(sf.rect, sf.originalSize, sf.texture ?? undefined);
}

/** 立绘尺寸（完整纹理，避免 trim 局部放大） */
function spriteFramePortraitSize(sf: SpriteFrame): { w: number; h: number } {
  return portraitSizeFromRect(sf.rect, sf.originalSize, sf.texture ?? undefined);
}

/** SpriteFrame 在 UI 坐标系下的原始尺寸（originalSize / pixelsToUnit） */
export function portraitDesignSize(sf: SpriteFrame): { w: number; h: number } {
  const ptu = sf.pixelsToUnit > 0 ? sf.pixelsToUnit : 100;
  return designSizeFromPixels(sf.originalSize.width, sf.originalSize.height, ptu);
}

/** 绑定 Sprite：必须先 CUSTOM 再赋 spriteFrame，最后 setContentSize */
function bindSpriteCustom(
  node: Node,
  sf: SpriteFrame,
  w: number,
  h: number,
  anchorX: number,
  anchorY: number,
  x: number,
  y: number,
): void {
  node.setScale(1, 1, 1);
  const tf = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  const sp = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  sp.spriteFrame = sf;
  tf.setContentSize(w, h);
  tf.setAnchorPoint(anchorX, anchorY);
  node.setPosition(x, y, 0);
}

/** Sprite 等比 cover，不变形（背景等大图） */
export function applySpriteCover(
  node: Node,
  sf: SpriteFrame,
  boxW: number,
  boxH: number,
  centerX = 0,
  centerY = 0,
): void {
  const { w: mw, h: mh } = spriteFramePixelSize(sf);
  const { w, h } = fitCover(boxW, boxH, mw, mh);
  bindSpriteCustom(node, sf, w, h, 0.5, 0.5, centerX, centerY);
}

/** Sprite 等比 contain，顶对齐（立绘） */
export function applySpriteContainTop(
  node: Node,
  sf: SpriteFrame,
  boxW: number,
  boxH: number,
  centerX = 0,
): void {
  const { w: mw, h: mh } = spriteFramePortraitSize(sf);
  const { w, h } = fitContain(boxW, boxH, mw, mh);
  bindSpriteCustom(node, sf, w, h, 0.5, 1, centerX, boxH / 2);
}

/** 按容器宽度 100% 等比缩放，顶对齐（卡牌立绘） */
export function applySpriteFitWidthTop(
  node: Node,
  sf: SpriteFrame,
  boxW: number,
  boxH: number,
  centerX = 0,
): void {
  const { w: mw, h: mh } = spriteFramePortraitSize(sf);
  const { w, h } = fitWidthInBox(boxW, mw, mh);
  bindSpriteCustom(node, sf, w, h, 0.5, 1, centerX, boxH / 2);
}

/** Sprite 等比 contain，居中 */
export function applySpriteContain(
  node: Node,
  sf: SpriteFrame,
  boxW: number,
  boxH: number,
  centerX = 0,
  centerY = 0,
): void {
  const { w: mw, h: mh } = spriteFramePixelSize(sf);
  const { w, h } = fitContain(boxW, boxH, mw, mh);
  bindSpriteCustom(node, sf, w, h, 0.5, 0.5, centerX, centerY);
}
