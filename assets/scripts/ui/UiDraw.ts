import { Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import { COL } from './OfficialLayout';

export function toColor(c: { r: number; g: number; b: number; a: number }) {
  return new Color(c.r, c.g, c.b, c.a);
}

/** 带边框的面板 */
export function drawPanel(g: Graphics, w: number, h: number, fill: Color, border: Color, radius = 4) {
  g.fillColor = fill;
  g.roundRect(-w / 2, -h / 2, w, h, radius);
  g.fill();
  g.strokeColor = border;
  g.lineWidth = 2;
  g.roundRect(-w / 2, -h / 2, w, h, radius);
  g.stroke();
}

/** 官方风格按钮 */
export function drawButton(g: Graphics, w: number, h: number, highlight: boolean, danger = false) {
  const base = danger ? COL.btnDanger : highlight ? COL.btnHighlight : COL.btn;
  const top = highlight
    ? { r: 110, g: 140, b: 190, a: 255 }
    : { r: 70, g: 95, b: 140, a: 255 };
  g.fillColor = toColor(top);
  g.roundRect(-w / 2, -h / 2 + 1, w, h - 2, 8);
  g.fill();
  g.fillColor = toColor(base);
  g.roundRect(-w / 2, -h / 2, w, h - 3, 8);
  g.fill();
  g.strokeColor = toColor(COL.borderGold);
  g.lineWidth = 1;
  g.roundRect(-w / 2, -h / 2, w, h - 3, 8);
  g.stroke();
}

/** 城池标记（方城 + 选中光环） */
export function drawCityMarker(
  g: Graphics,
  fill: Color,
  stroke: Color,
  selected: boolean,
  isPlayer: boolean,
) {
  const s = selected ? 24 : 21;
  if (selected) {
    g.strokeColor = toColor({ r: 255, g: 230, b: 80, a: 200 });
    g.lineWidth = 3;
    g.roundRect(-s - 3, -s - 3, (s + 3) * 2, (s + 3) * 2, 6);
    g.stroke();
  }
  g.fillColor = fill;
  g.roundRect(-s, -s, s * 2, s * 2, 5);
  g.fill();
  g.strokeColor = stroke;
  g.lineWidth = isPlayer ? 2.5 : 2;
  g.roundRect(-s, -s, s * 2, s * 2, 5);
  g.stroke();
  g.fillColor = toColor({ r: 0, g: 0, b: 0, a: 60 });
  g.rect(-s + 4, s - 8, s * 2 - 8, 6);
  g.fill();
}

/** 地图网格 */
export function drawMapGrid(g: Graphics, w: number, h: number) {
  g.strokeColor = toColor({ r: 35, g: 48, b: 72, a: 90 });
  g.lineWidth = 1;
  const step = 40;
  for (let x = -w / 2; x <= w / 2; x += step) {
    g.moveTo(x, -h / 2);
    g.lineTo(x, h / 2);
    g.stroke();
  }
  for (let y = -h / 2; y <= h / 2; y += step) {
    g.moveTo(-w / 2, y);
    g.lineTo(w / 2, y);
    g.stroke();
  }
}

/** 标题装饰条 */
export function drawTitleBar(g: Graphics, w: number, y: number) {
  g.fillColor = toColor(COL.accent);
  g.rect(-w / 2, y - 2, w, 4);
  g.fill();
  g.fillColor = toColor({ r: 255, g: 220, b: 100, a: 180 });
  g.rect(-w / 4, y - 1, w / 2, 2);
  g.fill();
}

/** Toast 背景条 */
export function ensureToastBg(parent: Node, text: Label): Node {
  let bg = parent.getChildByName('ToastBg');
  if (!bg) {
    bg = new Node('ToastBg');
    parent.insertChild(bg, parent.children.indexOf(text.node));
    bg.addComponent(UITransform).setContentSize(680, 44);
  }
  const g = bg.getComponent(Graphics) ?? bg.addComponent(Graphics);
  g.clear();
  const w = Math.min(680, Math.max(200, text.string.length * 18 + 48));
  drawPanel(g, w, 44, toColor({ r: 10, g: 16, b: 32, a: 230 }), toColor(COL.borderGold), 10);
  bg.setPosition(text.node.position);
  bg.active = text.string.length > 0;
  return bg;
}

/** 模态框内容区 */
export function drawModalFrame(g: Graphics, w: number, h: number) {
  drawPanel(g, w, h, toColor({ r: 16, g: 24, b: 42, a: 248 }), toColor(COL.borderGold), 12);
  g.strokeColor = toColor({ r: 80, g: 100, b: 140, a: 120 });
  g.lineWidth = 1;
  g.roundRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 8);
  g.stroke();
}

export function hexToColor(hex: string): Color {
  const h = hex.replace('#', '');
  return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255);
}
