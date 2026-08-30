import { Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { fitContain, fitCover, fitWidth, spriteFramePixelSize as pixelSize } from '../core/utils/spriteFitMath';

export { fitContain, fitCover, fitWidth } from '../core/utils/spriteFitMath';

export function spriteFramePixelSize(sf: SpriteFrame): { w: number; h: number } {
  return pixelSize(sf.rect, sf.originalSize);
}

/** Sprite 等比 cover，不变形 */
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
  node.setPosition(centerX, centerY, 0);
  const tf = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  tf.setContentSize(w, h);
  tf.setAnchorPoint(0.5, 0.5);
  const sp = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
}

/** Sprite 等比 contain，不变形 */
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
  node.setPosition(centerX, centerY, 0);
  const tf = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  tf.setContentSize(w, h);
  tf.setAnchorPoint(0.5, 0.5);
  const sp = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
}
