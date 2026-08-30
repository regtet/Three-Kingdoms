import { Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { GAME_LOGO_ID, normalizeGameIconId } from '../core/data/gameIcons';
import { L } from './OfficialLayout';
import { applySpriteContain, fitWidth, spriteFramePixelSize } from './SpriteFit';

const iconCache = new Map<string, SpriteFrame>();
let logoFrame: SpriteFrame | null = null;
let preloadStarted = false;
let preloadDone = false;
const listeners: Array<() => void> = [];

function logoResourcePaths(): string[] {
  return [`brand/${GAME_LOGO_ID}/spriteFrame`, `brand/${GAME_LOGO_ID}`, 'brand/logo2/spriteFrame', 'brand/logo/spriteFrame'];
}

function pickLogoFrame(assets: SpriteFrame[]): SpriteFrame | null {
  return assets.find((a) => a.name === GAME_LOGO_ID)
    ?? assets.find((a) => a.name.includes('logo2'))
    ?? assets[0]
    ?? null;
}

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

  const tryLoadLogo = (paths: string[], idx = 0) => {
    if (idx >= paths.length) {
      resources.loadDir('brand', SpriteFrame, (err, assets) => {
        if (!err && assets?.length) logoFrame = pickLogoFrame(assets);
        finish();
      });
      return;
    }
    resources.load(paths[idx], SpriteFrame, (err, sf) => {
      if (!err && sf) {
        logoFrame = sf;
        finish();
        return;
      }
      tryLoadLogo(paths, idx + 1);
    });
  };
  tryLoadLogo(logoResourcePaths());

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

/** Logo 置于背景之上、菜单文字之下 */
function stackMenuLogo(parent: Node, img: Node): void {
  const items = parent.getChildByName('MenuItems');
  const tag = parent.getChildByName('BuildTag');
  const insertBefore = items ?? tag;
  const idx = insertBefore ? insertBefore.getSiblingIndex() : parent.children.length;
  parent.insertChild(img, idx);
}

function attachLogoSprite(parent: Node, nodeName: string, sf: SpriteFrame, y: number): Node {
  let img = parent.getChildByName(nodeName);
  if (!img) {
    img = new Node(nodeName);
    parent.addChild(img);
  }
  const { w: mw, h: mh } = spriteFramePixelSize(sf);
  const { w, h } = fitWidth(mw, mh, L.MENU_LOGO_W);
  img.setPosition(0, y, 0);
  img.active = true;
  const tf = img.getComponent(UITransform) ?? img.addComponent(UITransform);
  tf.setContentSize(w, h);
  tf.setAnchorPoint(0.5, 0.5);
  const sp = img.getComponent(Sprite) ?? img.addComponent(Sprite);
  sp.spriteFrame = sf;
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  return img;
}

/** 主菜单 Logo（固定 logo2，等比缩放） */
export function applyMenuLogo(parent: Node): boolean {
  const sf = getLogoFrame();
  if (!sf) return false;
  const img = attachLogoSprite(parent, 'MenuLogoImg', sf, L.MENU_LOGO_Y);
  stackMenuLogo(parent, img);
  return true;
}

/** 主菜单游戏图标（可切换） */
export function applyMenuGameIcon(parent: Node, iconId: string): boolean {
  const sf = getGameIconFrame(iconId);
  if (!sf) return false;
  let img = parent.getChildByName('MenuGameIconImg');
  if (!img) {
    img = new Node('MenuGameIconImg');
    parent.addChild(img);
  }
  img.setPosition(0, L.MENU_ICON_Y, 0);
  applySpriteContain(img, sf, L.MENU_ICON_SIZE, L.MENU_ICON_SIZE);
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
