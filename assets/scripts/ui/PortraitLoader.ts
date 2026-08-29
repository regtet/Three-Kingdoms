import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { PORTRAIT_ID_ALIASES } from '../core/data/portraitMap';

const cache = new Map<string, SpriteFrame>();
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

/** 预加载 assets/resources/portraits/ 下全部立绘（支持 PNG / WebP） */
export function preloadPortraits(onDone?: () => void): void {
  if (onDone) listeners.push(onDone);
  if (preloadDone) {
    onDone?.();
    return;
  }
  if (preloadStarted) return;
  preloadStarted = true;

  resources.loadDir('portraits', SpriteFrame, (err, assets) => {
    if (!err && assets) {
      for (const sf of assets) {
        cache.set(sf.name, sf);
      }
    }
    preloadDone = true;
    const pending = listeners.splice(0);
    pending.forEach((fn) => fn());
  });
}

export function isPortraitsReady(): boolean {
  return preloadDone;
}

export function getPortraitFrame(generalId: string): SpriteFrame | null {
  const alias = PORTRAIT_ID_ALIASES[generalId];
  return cache.get(generalId) ?? (alias ? cache.get(alias) ?? null : null);
}

/** 在头像节点上叠加立绘 Sprite（若有资源） */
export function attachPortraitImage(parent: Node, generalId: string, w: number, h: number, faceY = 8): boolean {
  const sf = getPortraitFrame(generalId);
  if (!sf) return false;

  let img = parent.getChildByName('PortraitImg');
  if (!img) {
    img = new Node('PortraitImg');
    parent.addChild(img);
  }
  const padX = Math.max(4, Math.floor(w * 0.06));
  const padBottom = Math.max(8, Math.floor(h * 0.24));
  img.setPosition(0, faceY, 0);
  const tf = img.getComponent(UITransform) ?? img.addComponent(UITransform);
  tf.setContentSize(w - padX * 2, h - padBottom);
  const sp = img.getComponent(Sprite) ?? img.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  return true;
}
