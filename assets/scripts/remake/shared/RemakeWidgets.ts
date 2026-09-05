import {
  BlockInputEvents,
  Button,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  UITransform,
  Vec3,
} from 'cc';
import { audioManager } from '../../ui/AudioManager';
import { drawPanel, drawButton, toColor } from '../../ui/UiDraw';
import { applyLobbyTypography, createTextMenuItem } from '../../ui/LobbyUi';
import { RC, RL, type RemakeColor } from './RemakeLayout';

export function remakeColor(c: RemakeColor): Color {
  return new Color(c.r, c.g, c.b, c.a);
}

/** 全屏层 */
export function createScreenLayer(parent: Node, name: string): Node {
  const n = new Node(name);
  parent.addChild(n);
  n.addComponent(UITransform).setContentSize(RL.W, RL.H);
  n.addComponent(BlockInputEvents);
  n.active = false;
  return n;
}

export function fillScreenBg(parent: Node, name = 'Bg'): Node {
  const n = new Node(name);
  parent.addChild(n);
  n.setPosition(0, 0, 0);
  n.addComponent(UITransform).setContentSize(RL.W, RL.H);
  const g = n.addComponent(Graphics);
  drawPanel(g, RL.W, RL.H, toColor(RC.bg), toColor({ r: 0, g: 0, b: 0, a: 0 }), 0);
  return n;
}

export function remakeLabel(
  parent: Node,
  name: string,
  text: string,
  fontSize: number,
  pos: Vec3,
  width = RL.PAGE_BODY_W,
  clip = false,
): Label {
  const node = new Node(name);
  parent.addChild(node);
  node.setPosition(pos);
  const h = clip ? fontSize * 6 + 8 : fontSize + 16;
  node.addComponent(UITransform).setContentSize(width, h);
  const lb = node.addComponent(Label);
  lb.string = text;
  lb.fontSize = fontSize;
  lb.lineHeight = fontSize + 4;
  lb.overflow = clip ? Label.Overflow.CLAMP : Label.Overflow.RESIZE_HEIGHT;
  lb.color = remakeColor(RC.text);
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  return lb;
}

export function remakeButton(
  parent: Node,
  name: string,
  text: string,
  pos: Vec3,
  host: Component,
  onClick: () => void,
  w = 200,
  h = 48,
  highlight = false,
): Node {
  const node = new Node(name);
  parent.addChild(node);
  node.setPosition(pos);
  node.addComponent(UITransform).setContentSize(w, h);
  const g = node.addComponent(Graphics);
  drawButton(g, w, h, highlight, false);
  const lb = remakeLabel(node, 'Label', text, text.length > 8 ? 16 : 18, new Vec3(0, 0, 0), w - 12);
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.overflow = Label.Overflow.SHRINK;
  node.addComponent(Button);
  node.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    onClick();
  }, host);
  return node;
}

export function remakeTextItem(
  parent: Node,
  name: string,
  text: string,
  y: number,
  host: Component,
  onClick: () => void,
): Node {
  return createTextMenuItem(parent, name, text, y, onClick, host, RL.TITLE_ITEM_W, 'menu');
}

export function remakePageTitle(parent: Node, title: string, subtitle = ''): void {
  const t = remakeLabel(parent, 'PageTitle', title, 34, new Vec3(0, RL.PAGE_TITLE_Y, 0));
  applyLobbyTypography(t, 'title');
  t.string = title;
  if (subtitle) {
    const s = remakeLabel(parent, 'PageSub', subtitle, 18, new Vec3(0, RL.PAGE_SUB_Y, 0));
    applyLobbyTypography(s, 'body');
    s.string = subtitle;
  }
}

export function clearChildren(node: Node): void {
  node.destroyAllChildren();
}
