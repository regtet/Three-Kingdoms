import { Color, Component, Label, Node, UITransform } from 'cc';
import { COL, L } from './OfficialLayout';
import {
  applyLobbyTypography,
  createLobbyBack,
  createLobbyTitle,
  createTextMenuItem,
  toCcColor,
} from './LobbyUi';

/** 二级页统一背景兜底节点 */
export function createLobbyBgFallback(parent: Node): Node {
  const n = new Node('BgFallback');
  parent.insertChild(n, 0);
  n.addComponent(UITransform).setContentSize(L.W, L.H);
  return n;
}

/** 副标题（标题下方一行） */
export function createLobbySubtitle(parent: Node, text: string, y = L.LOBBY_SUBTITLE_Y): Label {
  const n = new Node('LobbySubtitle');
  parent.addChild(n);
  n.setPosition(0, y, 0);
  const lb = n.addComponent(Label);
  lb.string = text;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  applyLobbyTypography(lb, 'body');
  lb.fontSize = 20;
  lb.lineHeight = 28;
  lb.color = toCcColor(COL.menuGold);
  return lb;
}

/** 正文区 Label */
export function createLobbyBody(
  parent: Node,
  name: string,
  y: number,
  width = L.LOBBY_BODY_W,
  fontSize = 18,
): Label {
  const n = new Node(name);
  parent.addChild(n);
  n.setPosition(0, y, 0);
  const tf = n.addComponent(UITransform);
  tf.setContentSize(width, 320);
  const lb = n.addComponent(Label);
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.overflow = Label.Overflow.RESIZE_HEIGHT;
  applyLobbyTypography(lb, 'body');
  lb.fontSize = fontSize;
  lb.lineHeight = fontSize + 10;
  return lb;
}

/** 页码指示 */
export function createLobbyPageHint(parent: Node, y: number): Label {
  const lb = createLobbyBody(parent, 'PageHint', y, L.LOBBY_BODY_W, 16);
  lb.fontSize = 16;
  lb.lineHeight = 22;
  lb.color = toCcColor(COL.textDim);
  return lb;
}

/** 左右导航 */
export function createLobbyNavPair(
  parent: Node,
  y: number,
  onPrev: () => void,
  onNext: () => void,
  host: Component,
  prevLabel = '◀ 上一项',
  nextLabel = '下一项 ▶',
): void {
  createTextMenuItem(parent, 'NavPrev', prevLabel, y, onPrev, host, 200, 'back').setPosition(-168, y, 0);
  createTextMenuItem(parent, 'NavNext', nextLabel, y, onNext, host, 200, 'back').setPosition(168, y, 0);
}

/** 更新文字菜单项文案 */
export function updateTextMenuLabel(itemNode: Node, text: string, kind: 'menu' | 'back' = 'menu'): void {
  const lb = itemNode.getChildByName('Label')?.getComponent(Label);
  const shadow = itemNode.getChildByName('Shadow')?.getComponent(Label);
  if (lb) {
    lb.string = text;
    applyLobbyTypography(lb, kind);
  }
  if (shadow) {
    shadow.string = text;
    shadow.color = new Color(0, 0, 0, 90);
  }
}

/** 标准二级页骨架：标题 + 副标题 + 内容区 + 返回 */
export function buildLobbyPageShell(
  layer: Node,
  title: string,
  subtitle: string,
  onBack: () => void,
  host: Component,
): {
  titleLabel: Label;
  subtitleLabel: Label;
  contentRoot: Node;
} {
  createLobbyBgFallback(layer);
  const titleLabel = createLobbyTitle(layer, title);
  const subtitleLabel = createLobbySubtitle(layer, subtitle);
  const contentRoot = new Node('LobbyContent');
  layer.addChild(contentRoot);
  createLobbyBack(layer, onBack, host);
  return { titleLabel, subtitleLabel, contentRoot };
}

/** 设置页一行（文字菜单风格） */
export function createLobbySettingRow(
  parent: Node,
  name: string,
  text: string,
  y: number,
  onClick: () => void,
  host: Component,
): Node {
  return createTextMenuItem(parent, name, text, y, onClick, host, L.LOBBY_BODY_W, 'menu');
}
