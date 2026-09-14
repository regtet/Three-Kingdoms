/**
 * 二级页展现（与标题屏刻意区分）：
 * 水墨底 → 半透明墨罩 → 顶栏墨匾（亮金字标题）→ 中央宣纸正文卡（浓墨字）→ 底栏返回。
 */
import { Color, Node, Sprite, UITransform } from 'cc';
import {
  BANNER_LABEL_COLOR,
  BODY_TEXT_COLOR,
  MENU_BG_PATH,
  MENU_TEX,
  RL,
} from './RemakeLayout';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  setOpacity,
} from './MenuChrome';
import {
  applyDesignUiTransform,
  applySpriteContain,
  applySpriteCover,
  getVisibleDesignSize,
  matchVisibleSize,
  safeClearChildren,
} from './ScreenAdapt';

export type MenuShell = {
  root: Node;
  body: Node;
  vis: { width: number; height: number };
};

export async function createMenuShell(
  layer: Node,
  title: string,
  onBack?: () => void,
): Promise<MenuShell> {
  safeClearChildren(layer);
  const vis = getVisibleDesignSize();
  const root = new Node('MenuShell');
  layer.addChild(root);
  matchVisibleSize(root, vis);
  setOpacity(root, 255);

  const bg = new Node('Bg');
  root.addChild(bg);
  const bgSp = bg.addComponent(Sprite);
  const bgFrame = await loadSpriteFrame(MENU_BG_PATH);
  if (bgFrame) applySpriteCover(bg, bgSp, bgFrame, vis.width, vis.height);

  // 墨罩：压暗背景，突出卡片（不是整屏宣纸）
  const wash = new Node('InkWash');
  root.addChild(wash);
  matchVisibleSize(wash, vis);
  const washSp = wash.addComponent(Sprite);
  washSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const ink = await loadSpriteFrame(MENU_TEX.inkWash);
  if (ink) washSp.spriteFrame = ink;
  washSp.color = new Color(20, 18, 14, 165);

  // 顶栏墨匾
  const bannerHost = new Node('BannerHost');
  root.addChild(bannerHost);
  applyDesignUiTransform(bannerHost, 0, 760 - RL.safeTop, vis.height);
  const banner = new Node('Banner');
  bannerHost.addChild(banner);
  const bannerSp = banner.addComponent(Sprite);
  const bannerFrame = await loadSpriteFrame(MENU_TEX.titleBanner);
  if (bannerFrame) applySpriteContain(banner, bannerSp, bannerFrame, 900, 110);

  const titleLabel = makeLabel(bannerHost, 'Title', title, {
    fontSize: 40,
    color: new Color(BANNER_LABEL_COLOR.r, BANNER_LABEL_COLOR.g, BANNER_LABEL_COLOR.b, 255),
    y: 0,
    bold: true,
  });
  titleLabel.node.setPosition(0, 0, 0);

  // 中央宣纸正文区
  const sheetHost = new Node('SheetHost');
  root.addChild(sheetHost);
  applyDesignUiTransform(sheetHost, 0, -40, vis.height);
  const sheet = new Node('Sheet');
  sheetHost.addChild(sheet);
  const sheetSp = sheet.addComponent(Sprite);
  const sheetFrame = await loadSpriteFrame(MENU_TEX.pageSheet);
  if (sheetFrame) applySpriteContain(sheet, sheetSp, sheetFrame, 900, 1120);

  const body = new Node('Body');
  root.addChild(body);
  applyDesignUiTransform(body, 0, -20, vis.height);

  if (onBack) {
    const backWrap = new Node('BtnBackWrap');
    root.addChild(backWrap);
    applyDesignUiTransform(backWrap, 0, -820 + RL.safeBottom, vis.height);
    await createClassicButton(backWrap, {
      name: 'BtnBack',
      label: '返回',
      style: 'quaternary',
      width: RL.btnQuaternaryW,
      height: RL.btnQuaternaryH,
      y: 0,
      onClick: onBack,
    });
  }

  return { root, body, vis };
}

export function makeRowLabel(
  parent: Node,
  name: string,
  text: string,
  y: number,
  opts?: { fontSize?: number; color?: Color; bold?: boolean; x?: number; width?: number },
) {
  const label = makeLabel(parent, name, text, {
    fontSize: opts?.fontSize ?? 28,
    color:
      opts?.color ??
      new Color(BODY_TEXT_COLOR.r, BODY_TEXT_COLOR.g, BODY_TEXT_COLOR.b, BODY_TEXT_COLOR.a),
    y,
    x: opts?.x ?? 0,
    bold: opts?.bold,
  });
  if (opts?.width) {
    label.node
      .getComponent(UITransform)!
      .setContentSize(opts.width, opts.fontSize ? opts.fontSize * 2.4 : 56);
  }
  return label;
}

/** 二级页列表行底板 */
export async function addRowSlip(parent: Node, y: number, width = 820): Promise<Node> {
  const n = new Node('RowSlip');
  parent.addChild(n);
  n.setPosition(0, y, 0);
  const sp = n.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  const frame = await loadSpriteFrame(MENU_TEX.rowSlip);
  const ui = n.addComponent(UITransform);
  ui.setContentSize(width, 96);
  if (frame) {
    sp.spriteFrame = frame;
  }
  return n;
}
