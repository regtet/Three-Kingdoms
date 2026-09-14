/**
 * 二级页：透出水墨底，去掉大白卡。
 * 标题浮于画面；列表用轻量行条，主操作才用墨匾按钮。
 */
import { Color, EventTouch, Node, Sprite, UIOpacity, UITransform } from 'cc';
import {
  BANNER_LABEL_COLOR,
  MENU_BG_PATH,
  MENU_TEX,
  RL,
} from './RemakeLayout';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  playClickSfx,
  setOpacity,
} from './MenuChrome';
import {
  applyDesignUiTransform,
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

/** 浮于水墨上的浅色字 */
export const INK_UI_TEXT = { r: 245, g: 236, b: 214, a: 255 } as const;
export const INK_UI_MUTED = { r: 210, g: 198, b: 170, a: 230 } as const;

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
  if (bgFrame) {
    applySpriteCover(bg, bgSp, bgFrame, vis.width, vis.height);
  }

  // 轻墨罩：只压对比，不盖死山水、不要大白卡
  const wash = new Node('InkWash');
  root.addChild(wash);
  matchVisibleSize(wash, vis);
  const washSp = wash.addComponent(Sprite);
  washSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const ink = await loadSpriteFrame(MENU_TEX.inkWash);
  if (ink) washSp.spriteFrame = ink;
  washSp.color = new Color(12, 10, 8, 110);

  const titleLabel = makeLabel(root, 'Title', title, {
    fontSize: 44,
    color: new Color(BANNER_LABEL_COLOR.r, BANNER_LABEL_COLOR.g, BANNER_LABEL_COLOR.b, 255),
    y: 0,
    bold: true,
  });
  applyDesignUiTransform(titleLabel.node, 0, 780 - RL.safeTop, vis.height);

  const rule = makeLabel(root, 'TitleRule', '—　·　—', {
    fontSize: 20,
    color: new Color(201, 168, 88, 160),
    y: 0,
  });
  applyDesignUiTransform(rule.node, 0, 730 - RL.safeTop, vis.height);

  const body = new Node('Body');
  root.addChild(body);
  applyDesignUiTransform(body, 0, -40, vis.height);

  if (onBack) {
    const backWrap = new Node('BtnBackWrap');
    root.addChild(backWrap);
    applyDesignUiTransform(backWrap, 0, -820 + RL.safeBottom, vis.height);
    await createClassicButton(backWrap, {
      name: 'BtnBack',
      label: '返回',
      style: 'quaternary',
      width: RL.btnPrimaryW,
      height: RL.btnPrimaryH,
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
      new Color(INK_UI_TEXT.r, INK_UI_TEXT.g, INK_UI_TEXT.b, INK_UI_TEXT.a),
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

export type InkOption = {
  node: Node;
  setSelected: (on: boolean) => void;
};

/**
 * 轻量选项行：半透明墨条 + 金字，不是整页大白底上的重按钮堆。
 */
export async function createInkOption(
  parent: Node,
  opts: {
    name: string;
    label: string;
    y: number;
    width?: number;
    height?: number;
    onClick: () => void;
  },
): Promise<InkOption> {
  const w = opts.width ?? 640;
  const h = opts.height ?? 78;
  const node = new Node(opts.name);
  parent.addChild(node);
  node.setPosition(0, opts.y, 0);
  node.addComponent(UITransform).setContentSize(w, h);

  const bg = new Node('Bg');
  node.addChild(bg);
  bg.addComponent(UITransform).setContentSize(w, h);
  const sp = bg.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  sp.type = Sprite.Type.SIMPLE;
  const frame = await loadSpriteFrame(MENU_TEX.inkMain);
  if (frame) {
    sp.spriteFrame = frame;
  } else {
    const px = await loadSpriteFrame(MENU_TEX.pixel);
    if (px) sp.spriteFrame = px;
    sp.color = new Color(28, 24, 18, 220);
  }
  const op = bg.addComponent(UIOpacity);
  op.opacity = 200;

  const rim = new Node('Rim');
  node.addChild(rim);
  rim.addComponent(UITransform).setContentSize(w + 8, h + 8);
  const rimSp = rim.addComponent(Sprite);
  rimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const rimFrame = await loadSpriteFrame(MENU_TEX.rim);
  if (rimFrame) rimSp.spriteFrame = rimFrame;
  const rimOp = rim.addComponent(UIOpacity);
  rimOp.opacity = 0;

  makeLabel(node, 'Label', opts.label, {
    fontSize: 32,
    color: new Color(BANNER_LABEL_COLOR.r, BANNER_LABEL_COLOR.g, BANNER_LABEL_COLOR.b, 255),
    y: 0,
    bold: true,
  });

  let busy = false;
  node.on(Node.EventType.TOUCH_END, (_e: EventTouch) => {
    if (busy) return;
    busy = true;
    playClickSfx(parent);
    opts.onClick();
    busy = false;
  });

  return {
    node,
    setSelected: (on: boolean) => {
      rimOp.opacity = on ? 220 : 0;
      op.opacity = on ? 255 : 200;
    },
  };
}
