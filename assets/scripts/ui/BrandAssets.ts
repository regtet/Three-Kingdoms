import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { GAME_LOGO_ID, normalizeGameIconId } from '../core/data/gameIcons';
import { L } from './OfficialLayout';

const iconCache = new Map<string, SpriteFrame>();
let logoFrame: SpriteFrame | null = null;
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

/** 预加载 logo + 游戏图标 */
export function preloadBrandAssets(onDone?: () => void): void {
  if (onDone) listeners.push(onDone);
  if (preloadDone) {
    onDone?.();
    return;
  }
  if (preloadStarted) return;
  preloadStarted = true;

  let pending = 2;
  const finish = () => {
    pending--;
    if (pending > 0) return;
    preloadDone = true;
    listeners.splice(0).forEach((fn) => fn());
  };

  resources.loadDir('brand', SpriteFrame, (err, assets) => {
    if (!err && assets?.length) {
      logoFrame = assets.find((a) => a.name === GAME_LOGO_ID) ?? assets[0];
    }
    finish();
  });

  resources.loadDir('icons', SpriteFrame, (err, assets) => {
    if (!err && assets) {
      for (const sf of assets) iconCache.set(sf.name, sf);
    }
    finish();
  });
}

export function getLogoFrame(): SpriteFrame | null {
  return logoFrame;
}

export function getGameIconFrame(id: string): SpriteFrame | null {
  return iconCache.get(normalizeGameIconId(id)) ?? null;
}

function attachSprite(parent: Node, nodeName: string, sf: SpriteFrame, w: number, h: number, y: number, zIndex = 0): Node {
  let img = parent.getChildByName(nodeName);
  if (!img) {
    img = new Node(nodeName);
    parent.addChild(img);
  }
  parent.insertChild(img, zIndex);
  img.setPosition(0, y, 0);
  const tf = img.getComponent(UITransform) ?? img.addComponent(UITransform);
  tf.setContentSize(w, h);
  const sp = img.getComponent(Sprite) ?? img.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  return img;
}

/** 主菜单 Logo（固定） */
export function applyMenuLogo(parent: Node): boolean {
  const sf = getLogoFrame();
  if (!sf) return false;
  attachSprite(parent, 'MenuLogoImg', sf, L.MENU_LOGO_W, L.MENU_LOGO_H, L.MENU_LOGO_Y);
  return true;
}

/** 主菜单游戏图标（可切换） */
export function applyMenuGameIcon(parent: Node, iconId: string): boolean {
  const sf = getGameIconFrame(iconId);
  if (!sf) return false;
  attachSprite(parent, 'MenuGameIconImg', sf, L.MENU_ICON_SIZE, L.MENU_ICON_SIZE, L.MENU_ICON_Y);
  return true;
}

/** Web 预览：尝试更新 favicon（原生启动图标需在构建配置替换） */
export function applyWebFavicon(iconId: string): void {
  if (typeof document === 'undefined') return;
  const id = normalizeGameIconId(iconId);
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/webp';
  link.href = `resources/icons/${id}.webp?v=${Date.now()}`;
}
