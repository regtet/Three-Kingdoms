/**
 * 子菜单共用壳：暗底 + 标题 + 可选返回。
 */
import { Color, Node, Sprite, UITransform } from 'cc';
import { MENU_TEX, RL } from './RemakeLayout';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  setOpacity,
} from './MenuChrome';
import {
  applyDesignUiTransform,
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

  const dim = new Node('Dim');
  root.addChild(dim);
  matchVisibleSize(dim, vis);
  const dimSp = dim.addComponent(Sprite);
  dimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const white = await loadSpriteFrame(MENU_TEX.pixel);
  if (white) dimSp.spriteFrame = white;
  dimSp.color = new Color(10, 12, 18, 236);

  const titleLabel = makeLabel(root, 'Title', title, {
    fontSize: 46,
    color: new Color(232, 200, 120, 255),
    y: 0,
    bold: true,
  });
  applyDesignUiTransform(titleLabel.node, 0, 780 - RL.safeTop, vis.height);

  const body = new Node('Body');
  root.addChild(body);
  applyDesignUiTransform(body, 0, 0, vis.height);

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
    color: opts?.color ?? new Color(220, 205, 175, 255),
    y,
    x: opts?.x ?? 0,
    bold: opts?.bold,
  });
  if (opts?.width) {
    label.node.getComponent(UITransform)!.setContentSize(opts.width, opts.fontSize ? opts.fontSize * 2 : 56);
  }
  return label;
}
