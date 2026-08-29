import { Button, Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import type { General } from '../core/models/types';
import { COL } from './OfficialLayout';
import { attachPortraitImage } from './PortraitLoader';
import { drawPanel, hexToColor, toColor } from './UiDraw';

/** HSV → Color（Cocos 3.8 无 Color.fromHSV 静态方法） */
function hsvToColor(h: number, s: number, v: number): Color {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0; let g = 0; let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return new Color(
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255),
    255,
  );
}

/** 根据武将名生成稳定配色 */
export function portraitPalette(name: string): { bg: Color; accent: Color } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const h = hash % 360;
  return { bg: hsvToColor(h, 0.35, 0.45), accent: hsvToColor(h, 0.55, 0.75) };
}

/** 绘制武将头像卡 */
export function drawPortraitCard(
  g: Graphics,
  w: number,
  h: number,
  name: string,
  force: number,
  intelligence: number,
  selected: boolean,
  factionHex?: string,
) {
  g.clear();
  const { bg, accent } = portraitPalette(name);
  const border = selected
    ? toColor(COL.textGold)
    : factionHex
      ? hexToColor(factionHex)
      : toColor(COL.borderGold);
  drawPanel(g, w, h, bg, border, 8);

  g.fillColor = accent;
  g.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 38, 6);
  g.fill();

  g.fillColor = toColor({ r: 0, g: 0, b: 0, a: 40 });
  g.rect(-w / 2 + 6, h / 2 - 32, w - 12, 26);
  g.fill();

  g.fillColor = toColor({ r: 200, g: 80, b: 60, a: 255 });
  g.rect(-w / 2 + 8, h / 2 - 30, (w - 16) * (force / 100), 4);
  g.fill();
  g.fillColor = toColor({ r: 80, g: 140, b: 220, a: 255 });
  g.rect(-w / 2 + 8, h / 2 - 22, (w - 16) * (intelligence / 100), 4);
  g.fill();
}

/** 创建可点击武将头像 */
export function createPortraitButton(
  parent: Node,
  general: General,
  factionColor: string,
  selected: boolean,
  pos: Vec3,
  onClick: () => void,
  w = 76,
  h = 100,
): Node {
  const node = new Node(`Portrait_${general.id}`);
  parent.addChild(node);
  node.setPosition(pos);
  node.addComponent(UITransform).setContentSize(w, h);

  const g = node.addComponent(Graphics);
  drawPortraitCard(g, w, h, general.name, general.force, general.intelligence, selected, factionColor);

  const hasImg = attachPortraitImage(node, general.id, w, h, 8);
  if (!hasImg) {
    const charLb = new Node('Char');
    node.addChild(charLb);
    charLb.setPosition(0, 8, 0);
    charLb.addComponent(UITransform).setContentSize(w - 12, 48);
    const cl = charLb.addComponent(Label);
    cl.string = general.name.length > 1 ? general.name.slice(-1) : general.name;
    cl.fontSize = 36;
    cl.lineHeight = 40;
    cl.horizontalAlign = Label.HorizontalAlign.CENTER;
    cl.color = toColor(COL.text);
  }

  const nameLb = new Node('Name');
  node.addChild(nameLb);
  nameLb.setPosition(0, -h / 2 + 14, 0);
  nameLb.addComponent(UITransform).setContentSize(w, 20);
  const nl = nameLb.addComponent(Label);
  nl.string = general.name;
  nl.fontSize = 13;
  nl.horizontalAlign = Label.HorizontalAlign.CENTER;
  nl.color = toColor(COL.textGold);

  node.addComponent(Button);
  node.on(Button.EventType.CLICK, onClick);
  return node;
}

/** 大尺寸展示用头像（战斗过场 / 嵌入面板） */
export function createPortraitDisplay(
  parent: Node,
  general: General | null,
  placeholder: string,
  factionColor: string,
  layout: 'left' | 'right' | 'embed' = 'left',
  w = 160,
  h = 210,
): Node {
  const node = new Node(`PortraitDisplay_${layout}`);
  parent.addChild(node);
  if (layout === 'embed') {
    node.setPosition(0, 0, 0);
  } else {
    node.setPosition(layout === 'left' ? -180 : 180, 20, 0);
  }
  node.addComponent(UITransform).setContentSize(w, h);

  const g = node.addComponent(Graphics);
  const compact = h <= 60;
  const medium = h <= 110;
  const nameSize = compact ? 11 : medium ? 13 : 22;
  const statSize = compact ? 10 : medium ? 12 : 14;
  const charSize = compact ? 22 : medium ? 32 : 72;

  if (general) {
    drawPortraitCard(g, w, h, general.name, general.force, general.intelligence, true, factionColor);
    const hasImg = attachPortraitImage(node, general.id, w, h, compact ? 4 : medium ? 8 : 20);
    if (!hasImg) {
      const charLb = new Node('Char');
      node.addChild(charLb);
      charLb.setPosition(0, compact ? 2 : medium ? 6 : 20, 0);
      charLb.addComponent(UITransform).setContentSize(w, compact ? 28 : medium ? 40 : 80);
      const cl = charLb.addComponent(Label);
      cl.string = general.name.slice(-1);
      cl.fontSize = charSize;
      cl.horizontalAlign = Label.HorizontalAlign.CENTER;
      cl.color = toColor(COL.text);
    }
    if (!compact) {
      const nameLb = new Node('Name');
      node.addChild(nameLb);
      nameLb.setPosition(0, -h / 2 + (medium ? 16 : 28), 0);
      nameLb.addComponent(UITransform).setContentSize(w, medium ? 18 : 30);
      const nl = nameLb.addComponent(Label);
      nl.string = general.name;
      nl.fontSize = nameSize;
      nl.horizontalAlign = Label.HorizontalAlign.CENTER;
      nl.color = toColor(COL.textGold);
    }
    if (!compact) {
      const statLb = new Node('Stats');
      node.addChild(statLb);
      statLb.setPosition(0, -h / 2 + (medium ? 32 : 58), 0);
      statLb.addComponent(UITransform).setContentSize(w, 20);
      const sl = statLb.addComponent(Label);
      sl.string = `武${general.force} 智${general.intelligence}`;
      sl.fontSize = statSize;
      sl.horizontalAlign = Label.HorizontalAlign.CENTER;
      sl.color = toColor(COL.textDim);
    }
  } else {
    drawPanel(g, w, h, toColor({ r: 40, g: 48, b: 68, a: 255 }), toColor(COL.borderGold), 8);
    const lb = new Node('Placeholder');
    node.addChild(lb);
    lb.addComponent(UITransform).setContentSize(w, 40);
    const l = lb.addComponent(Label);
    l.string = placeholder;
    l.fontSize = 20;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.color = toColor(COL.textDim);
  }
  return node;
}
