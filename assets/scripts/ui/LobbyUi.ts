import {
  Button,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import { COL, L } from './OfficialLayout';
import { audioManager } from './AudioManager';

export type ColorLike = { r: number; g: number; b: number; a: number };

/** 宋体 / 碑刻感：系统宋体 + 轻微描边（无自定义字体文件时） */
export const LOBBY_FONT_FAMILY = 'STSong, SimSun, "Songti SC", "Noto Serif SC", serif';

export function toCcColor(col: ColorLike): Color {
  return new Color(col.r, col.g, col.b, col.a);
}

function countChars(text: string): number {
  return [...text.replace(/\s/g, '')].length;
}

/** 主菜单 / 大厅文字排版 */
export function applyLobbyTypography(lb: Label, kind: 'menu' | 'title' | 'body' | 'back' = 'menu'): void {
  lb.useSystemFont = true;
  lb.fontFamily = LOBBY_FONT_FAMILY;
  lb.enableOutline = true;
  lb.outlineWidth = 2;
  lb.outlineColor = new Color(18, 14, 8, 210);

  if (kind === 'title') {
    lb.fontSize = 38;
    lb.lineHeight = 46;
    lb.spacingX = 4;
    lb.color = toCcColor(COL.menuGold);
    return;
  }
  if (kind === 'body') {
    lb.fontSize = 18;
    lb.lineHeight = 28;
    lb.spacingX = 1;
    lb.color = toCcColor(COL.menuText);
    return;
  }
  if (kind === 'back') {
    lb.fontSize = 28;
    lb.lineHeight = 36;
    lb.spacingX = 3;
    lb.color = toCcColor(COL.menuText);
    return;
  }
  lb.fontSize = L.MENU_ITEM_FONT;
  lb.lineHeight = L.MENU_ITEM_FONT + 10;
  const n = countChars(lb.string);
  lb.spacingX = n <= 4 ? L.MENU_ITEM_SPACING_X : Math.max(2, L.MENU_ITEM_SPACING_X - 2);
  lb.color = toCcColor(COL.menuText);
}

function styleShadowLabel(shadowLb: Label, text: string, kind: 'menu' | 'title' | 'body' | 'back'): void {
  applyLobbyTypography(shadowLb, kind);
  shadowLb.string = text;
  shadowLb.color = new Color(0, 0, 0, kind === 'title' ? 120 : 90);
  shadowLb.enableOutline = false;
}

/** 主菜单 / 大厅用文字菜单项（无背景框，点击动效） */
export function createTextMenuItem(
  parent: Node,
  name: string,
  text: string,
  y: number,
  onClick: () => void,
  host: Component,
  width = L.MENU_ITEM_W,
  kind: 'menu' | 'back' = 'menu',
): Node {
  const root = new Node(name);
  parent.addChild(root);
  root.setPosition(0, y, 0);
  root.addComponent(UITransform).setContentSize(width, L.MENU_ITEM_H);

  const shadow = new Node('Shadow');
  root.addChild(shadow);
  shadow.setPosition(1, -2, 0);
  const shadowLb = shadow.addComponent(Label);
  shadowLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  styleShadowLabel(shadowLb, text, kind);

  const labelNode = new Node('Label');
  root.addChild(labelNode);
  const lb = labelNode.addComponent(Label);
  lb.string = text;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  applyLobbyTypography(lb, kind);

  const line = new Node('AccentLine');
  root.addChild(line);
  line.setPosition(0, -L.MENU_ITEM_H / 2 + 4, 0);
  line.addComponent(UITransform).setContentSize(L.MENU_LINE_W, 2);
  const lg = line.addComponent(Graphics);
  lg.lineWidth = 1;
  lg.strokeColor = toCcColor(COL.menuGold);
  lg.moveTo(-L.MENU_LINE_W / 2, 0);
  lg.lineTo(L.MENU_LINE_W / 2, 0);
  lg.stroke();
  line.active = false;

  root.addComponent(Button);
  root.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    line.active = true;

    tween(root)
      .to(0.06, { scale: new Vec3(0.97, 0.97, 1) })
      .call(() => {
        lb.color = toCcColor(COL.menuGold);
        shadowLb.color = new Color(0, 0, 0, 110);
        lg.clear();
        lg.lineWidth = 1;
        lg.strokeColor = toCcColor(COL.menuGold);
        const half = L.MENU_LINE_W / 2;
        lg.moveTo(-half, 0);
        lg.lineTo(half, 0);
        lg.stroke();
      })
      .to(0.06, { scale: new Vec3(1, 1, 1) })
      .delay(0.08)
      .call(() => onClick())
      .start();
  }, host);

  return root;
}

/** 大厅二级页标题 */
export function createLobbyTitle(parent: Node, text: string, y = L.LOBBY_TITLE_Y): Label {
  const n = new Node('LobbyTitle');
  parent.addChild(n);
  n.setPosition(0, y, 0);
  const lb = n.addComponent(Label);
  lb.string = text;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  applyLobbyTypography(lb, 'title');
  return lb;
}

/** 大厅返回（文字链） */
export function createLobbyBack(
  parent: Node,
  onBack: () => void,
  host: Component,
  label = '返回',
): Node {
  return createTextMenuItem(parent, 'LobbyBack', label, L.LOBBY_BACK_Y, onBack, host, 200, 'back');
}
