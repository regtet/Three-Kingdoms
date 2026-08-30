import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { L } from './OfficialLayout';
import { normalizeMenuBackgroundId } from '../core/data/menuBackgrounds';

const cache = new Map<string, SpriteFrame>();
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

/** 预加载 assets/resources/backgrounds/ */
export function preloadMenuBackgrounds(onDone?: () => void): void {
  if (onDone) listeners.push(onDone);
  if (preloadDone) {
    onDone?.();
    return;
  }
  if (preloadStarted) return;
  preloadStarted = true;

  resources.loadDir('backgrounds', SpriteFrame, (err, assets) => {
    if (!err && assets) {
      for (const sf of assets) cache.set(sf.name, sf);
    }
    preloadDone = true;
    listeners.splice(0).forEach((fn) => fn());
  });
}

export function isMenuBackgroundsReady(): boolean {
  return preloadDone;
}

export function getMenuBackgroundFrame(id: string): SpriteFrame | null {
  return cache.get(normalizeMenuBackgroundId(id)) ?? null;
}

/** 在主菜单层设置全屏背景（cover） */
export function applyMenuBackground(parent: Node, backgroundId: string): boolean {
  const sf = getMenuBackgroundFrame(backgroundId);
  if (!sf) return false;

  let img = parent.getChildByName('MenuBgImg');
  if (!img) {
    img = new Node('MenuBgImg');
    parent.insertChild(img, 0);
  }
  img.setPosition(0, 0, 0);
  const tf = img.getComponent(UITransform) ?? img.addComponent(UITransform);
  tf.setContentSize(L.W, L.H);
  const sp = img.getComponent(Sprite) ?? img.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  return true;
}
