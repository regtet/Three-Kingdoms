import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';

const cache = new Map<string, SpriteFrame>();
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

/** 预加载 assets/resources/portraits/ 下全部立绘 */
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
  return cache.get(generalId) ?? null;
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
  img.setPosition(0, faceY, 0);
  const tf = img.getComponent(UITransform) ?? img.addComponent(UITransform);
  tf.setContentSize(w - 12, h - 42);
  const sp = img.getComponent(Sprite) ?? img.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  return true;
}
