import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { resolvePortraitFrameKeys } from '../core/data/portraitMap';
import { applySpriteContain, applySpriteContainTop, applySpriteCover, applySpriteFitWidthTop } from './SpriteFit';

export type PortraitFitMode = 'cover' | 'contain' | 'containTop' | 'widthTop';

const cache = new Map<string, SpriteFrame>();
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

function cacheFrames(assets: SpriteFrame[] | null | undefined): void {
  if (!assets) return;
  for (const sf of assets) cache.set(sf.name, sf);
}

/** 预加载 assets/resources/portraits/ 下全部立绘（含 pool 子目录） */
export function preloadPortraits(onDone?: () => void): void {
  if (onDone) listeners.push(onDone);
  if (preloadDone) {
    onDone?.();
    return;
  }
  if (preloadStarted) return;
  preloadStarted = true;

  let pending = 2;
  const finish = () => {
    if (--pending > 0) return;
    preloadDone = true;
    listeners.splice(0).forEach((fn) => fn());
  };

  resources.loadDir('portraits', SpriteFrame, (err, assets) => {
    if (!err) cacheFrames(assets);
    finish();
  });
  resources.loadDir('portraits/pool', SpriteFrame, (err, assets) => {
    if (!err) cacheFrames(assets);
    finish();
  });
}

export function isPortraitsReady(): boolean {
  return preloadDone;
}

export function getPortraitFrame(generalId: string): SpriteFrame | null {
  for (const key of resolvePortraitFrameKeys(generalId)) {
    const sf = cache.get(key);
    if (sf) return sf;
  }
  return null;
}

/** 在限定框内叠加立绘（等比 cover/contain，不变形） */
export function attachPortraitToBox(
  parent: Node,
  generalId: string,
  boxW: number,
  boxH: number,
  mode: PortraitFitMode = 'cover',
  centerY = 0,
): boolean {
  const sf = getPortraitFrame(generalId);
  if (!sf) return false;

  let img = parent.getChildByName('PortraitImg');
  if (!img) {
    img = new Node('PortraitImg');
    parent.addChild(img);
  }
  if (mode === 'cover') {
    applySpriteCover(img, sf, boxW, boxH, 0, centerY);
  } else if (mode === 'widthTop') {
    applySpriteFitWidthTop(img, sf, boxW, boxH, 0);
  } else if (mode === 'containTop') {
    applySpriteContainTop(img, sf, boxW, boxH, 0);
  } else {
    applySpriteContain(img, sf, boxW, boxH, 0, centerY);
  }
  return true;
}

/** 在头像节点上叠加立绘 Sprite（若有资源，等比 contain，兼容旧 UI） */
export function attachPortraitImage(parent: Node, generalId: string, w: number, h: number, faceY = 8): boolean {
  const padX = Math.max(4, Math.floor(w * 0.06));
  const padBottom = Math.max(8, Math.floor(h * 0.24));
  const boxW = w - padX * 2;
  const boxH = h - padBottom;
  return attachPortraitToBox(parent, generalId, boxW, boxH, 'contain', faceY);
}
