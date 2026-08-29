import { Button, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import type { City, GameState, General } from '../core/models/types';
import { getCityStateView } from '../core/utils/cityState';
import { findCity } from '../core/utils/helpers';
import { COL, L } from './OfficialLayout';
import { createPortraitDisplay } from './GeneralPortrait';
import { drawListRow, drawPanel, drawStatField, drawSidebarButton, toColor } from './UiDraw';

const DISASTER: Record<string, string> = {
  none: '无', flood: '水灾', plague: '瘟疫', locusts: '蝗灾',
};

/** 官方风格属性格：标签 + 值 */
function statField(parent: Node, label: string, value: string, x: number, y: number, w: number, h: number) {
  const n = new Node(`F_${label}`);
  parent.addChild(n);
  n.setPosition(x, y, 0);
  n.addComponent(UITransform).setContentSize(w, h);
  drawStatField(n.addComponent(Graphics), w, h);
  const lb = new Node('Val');
  n.addChild(lb);
  lb.setPosition(0, 0, 0);
  lb.addComponent(UITransform).setContentSize(w - 8, h);
  const l = lb.addComponent(Label);
  l.string = `${label} ${value}`;
  l.fontSize = 12;
  l.lineHeight = 16;
  l.horizontalAlign = Label.HorizontalAlign.CENTER;
  l.color = toColor(COL.fieldValue);
}

/** 构建官方城池状态面板（顶栏下方） */
export function buildCityStatusPanel(parent: Node, localY: number = L.CITY_PANEL_Y): Node {
  const panel = new Node('CityStatusPanel');
  parent.addChild(panel);
  panel.setPosition(0, localY, 0);
  panel.addComponent(UITransform).setContentSize(L.W - 20, L.CITY_PANEL_H);
  const bg = panel.addComponent(Graphics);
  drawPanel(bg, L.W - 20, L.CITY_PANEL_H, toColor(COL.cityPanel), toColor(COL.borderGoldDim), 6);

  const portraitSlot = new Node('GovPortrait');
  panel.addChild(portraitSlot);
  portraitSlot.setPosition(-280, 0, 0);

  const fields = new Node('StatFields');
  panel.addChild(fields);
  fields.setPosition(30, 0, 0);
  fields.name = 'StatFields';

  return panel;
}

/** 刷新城池状态面板 */
export function refreshCityStatusPanel(panel: Node, state: GameState, cityId: string | null) {
  const portraitSlot = panel.getChildByName('GovPortrait');
  const fields = panel.getChildByName('StatFields');
  if (!portraitSlot || !fields) return;
  portraitSlot.destroyAllChildren();
  fields.destroyAllChildren();

  if (!cityId) {
    statField(fields, '提示', '请点击地图上的城池', 0, 20, 420, 36);
    return;
  }

  const view = getCityStateView(state, cityId);
  const c = view.city;
  const gov = view.governor ?? view.generals[0] ?? null;
  const faction = state.factions.find((f) => f.id === c.factionId);

  if (gov && portraitSlot) {
    const node = createPortraitDisplay(portraitSlot, gov, '', faction?.color ?? '#888', 'embed', 72, 88);
    node.setPosition(0, 0, 0);
  }

  const fw = 128;
  const fh = 24;
  const rows: [string, string][] = [
    ['势力', view.factionName],
    ['太守', view.governor?.name ?? '无'],
    ['现役', `${view.generals.length}人`],
    ['金', `${c.gold}`],
    ['兵粮', `${c.food}`],
    ['兵士', `${c.troops}/${view.maxTroops}`],
    ['月金', `+${view.projectedGoldIncome}`],
    ['月粮', `+${view.projectedFoodIncome}`],
    ['兵饷', `-${view.projectedTroopUpkeep}`],
    ['民忠', `${c.loyalty}`],
    ['治安', `${c.order}`],
    ['灾难', DISASTER[c.disaster] ?? c.disaster],
  ];

  rows.forEach(([label, val], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = -138 + col * (fw + 6);
    const y = 28 - row * (fh + 4);
    statField(fields, label, val, x, y, fw, fh);
  });
}

/** 构建官方武将情報面板内容 */
export function buildGeneralInfoContent(parent: Node, state: GameState, general: General) {
  parent.destroyAllChildren();
  const faction = state.factions.find((f) => f.id === general.factionId);
  const city = findCity(state, general.cityId);

  const portraitRoot = new Node('GenPortrait');
  parent.addChild(portraitRoot);
  portraitRoot.setPosition(-240, 120, 0);
  const pNode = createPortraitDisplay(portraitRoot, general, '', faction?.color ?? '#888', 'left', 120, 150);
  pNode.setPosition(0, 0, 0);

  const nameLb = new Node('GenName');
  parent.addChild(nameLb);
  nameLb.setPosition(-80, 180, 0);
  nameLb.addComponent(UITransform).setContentSize(200, 40);
  const nl = nameLb.addComponent(Label);
  nl.string = general.name;
  nl.fontSize = 28;
  nl.color = toColor(COL.textGold);

  const stats = new Node('GenStats');
  parent.addChild(stats);
  stats.setPosition(40, 100, 0);

  const statusLabel = general.status === 'governor' ? '太守'
    : general.status === 'marching' ? '出征'
      : general.status === 'injured' ? '负伤' : '一般';

  const rows: [string, string][] = [
    ['武力', `${general.force}`],
    ['智力', `${general.intelligence}`],
    ['魅力', `${general.charm}`],
    ['忠诚', `${general.loyalty}`],
    ['统率', `${general.leadership}`],
    ['政治', `${general.politics}`],
    ['年龄', `${general.age ?? '—'}`],
    ['势力', faction?.name ?? ''],
    ['所属', city.name],
    ['身分', statusLabel],
  ];

  rows.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    statField(stats, label, val, col * 150, 60 - row * 34, 140, 28);
  });

  const bio = new Node('Bio');
  parent.addChild(bio);
  bio.setPosition(0, -80, 0);
  bio.addComponent(UITransform).setContentSize(580, 120);
  const bg = bio.addComponent(Graphics);
  drawPanel(bg, 580, 120, toColor(COL.fieldBg), toColor({ r: 140, g: 145, b: 155, a: 255 }), 4);
  const bioTitle = new Node('BioTitle');
  bio.addChild(bioTitle);
  bioTitle.setPosition(0, 48, 0);
  bioTitle.addComponent(UITransform).setContentSize(560, 24);
  const bt = bioTitle.addComponent(Label);
  bt.string = '— 列传 —';
  bt.fontSize = 16;
  bt.color = toColor({ r: 40, g: 100, b: 180, a: 255 });
  bt.horizontalAlign = Label.HorizontalAlign.CENTER;
  const bioBody = new Node('BioBody');
  bio.addChild(bioBody);
  bioBody.setPosition(0, -10, 0);
  bioBody.addComponent(UITransform).setContentSize(540, 70);
  const bb = bioBody.addComponent(Label);
  bb.string = `${general.name}，${faction?.name ?? ''}军武将。武${general.force} 智${general.intelligence}，${statusLabel}。`;
  bb.fontSize = 14;
  bb.lineHeight = 20;
  bb.color = toColor(COL.textDark);
  bb.overflow = Label.Overflow.CLAMP;
}

/** 官方武将列表行：肖像 + 姓名 + 四维 */
export function buildGeneralListRow(
  parent: Node,
  general: General,
  factionColor: string,
  selected: boolean,
  y: number,
  onSelect: () => void,
  onInfo?: () => void,
): Node {
  const row = new Node(`GenRow_${general.id}`);
  parent.addChild(row);
  row.setPosition(0, y, 0);
  row.addComponent(UITransform).setContentSize(L.GEN_LIST_W, L.GEN_LIST_ROW_H);
  drawListRow(row.addComponent(Graphics), L.GEN_LIST_W, L.GEN_LIST_ROW_H, selected);

  const portraitSlot = new Node('Portrait');
  row.addChild(portraitSlot);
  portraitSlot.setPosition(-L.GEN_LIST_W / 2 + 36, 0, 0);
  portraitSlot.addComponent(UITransform).setContentSize(44, 52);
  createPortraitDisplay(portraitSlot, general, '', factionColor, 'embed', 44, 52);

  const nameLb = new Node('Name');
  row.addChild(nameLb);
  nameLb.setPosition(-L.GEN_LIST_W / 2 + 88, 10, 0);
  nameLb.addComponent(UITransform).setContentSize(80, 22);
  const nl = nameLb.addComponent(Label);
  nl.string = general.name;
  nl.fontSize = 16;
  nl.horizontalAlign = Label.HorizontalAlign.LEFT;
  nl.color = toColor(COL.textGold);

  const stats = [
    `武${general.force}`,
    `智${general.intelligence}`,
    `魅${general.charm}`,
    `忠${general.loyalty}`,
  ];
  stats.forEach((s, i) => {
    const col = i % 2;
    const r = Math.floor(i / 2);
    const sn = new Node(`Stat_${i}`);
    row.addChild(sn);
    sn.setPosition(-L.GEN_LIST_W / 2 + 88 + col * 70, -6 - r * 16, 0);
    sn.addComponent(UITransform).setContentSize(66, 16);
    const sl = sn.addComponent(Label);
    sl.string = s;
    sl.fontSize = 12;
    sl.horizontalAlign = Label.HorizontalAlign.LEFT;
    sl.color = toColor(COL.textDim);
  });

  const status = general.status === 'governor' ? '太守'
    : general.status === 'marching' ? '出征'
      : general.status === 'injured' ? '负伤' : '一般';
  const stLb = new Node('Status');
  row.addChild(stLb);
  stLb.setPosition(L.GEN_LIST_W / 2 - 100, 0, 0);
  stLb.addComponent(UITransform).setContentSize(60, 20);
  const stl = stLb.addComponent(Label);
  stl.string = status;
  stl.fontSize = 12;
  stl.horizontalAlign = Label.HorizontalAlign.CENTER;
  stl.color = toColor(COL.textDim);

  if (onInfo) {
    const infoBtn = new Node('InfoBtn');
    row.addChild(infoBtn);
    infoBtn.setPosition(L.GEN_LIST_W / 2 - 36, 0, 0);
    infoBtn.addComponent(UITransform).setContentSize(36, 28);
    const ig = infoBtn.addComponent(Graphics);
    ig.fillColor = toColor(COL.btn);
    ig.roundRect(-18, -14, 36, 28, 4);
    ig.fill();
    const il = new Node('Label');
    infoBtn.addChild(il);
    il.addComponent(UITransform).setContentSize(36, 28);
    const ilb = il.addComponent(Label);
    ilb.string = '详';
    ilb.fontSize = 14;
    ilb.horizontalAlign = Label.HorizontalAlign.CENTER;
    ilb.color = toColor(COL.text);
    infoBtn.addComponent(Button);
    infoBtn.on(Button.EventType.CLICK, onInfo);
  }

  row.addComponent(Button);
  row.on(Button.EventType.CLICK, onSelect);
  return row;
}

/** 官方底部导航：戻る / 中止 / 決定 */
export function buildOfficialFooter(
  parent: Node,
  y: number,
  handlers: { back?: () => void; cancel?: () => void; confirm?: () => void; confirmEnabled?: boolean },
): void {
  const mk = (text: string, x: number, cb?: () => void, enabled = true) => {
    const n = new Node(`Footer_${text}`);
    parent.addChild(n);
    n.setPosition(x, y, 0);
    n.addComponent(UITransform).setContentSize(100, 44);
    drawSidebarButton(n.addComponent(Graphics), 100, 44, enabled && text === '确定');
    const lb = new Node('Label');
    n.addChild(lb);
    lb.addComponent(UITransform).setContentSize(100, 44);
    const l = lb.addComponent(Label);
    l.string = text;
    l.fontSize = 18;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.color = toColor(enabled ? COL.text : COL.textDim);
    if (cb && enabled) {
      n.addComponent(Button);
      n.on(Button.EventType.CLICK, cb);
    }
  };
  mk('返回', -140, handlers.back);
  mk('取消', 0, handlers.cancel);
  mk('确定', 140, handlers.confirm, handlers.confirmEnabled !== false);
}

/** 右侧竖栏按钮（官方：情報/機能/進行） */
export function createSidebarButton(
  parent: Node,
  text: string,
  sub: string,
  y: number,
  onClick: () => void,
): Node {
  const node = new Node(`Side_${text}`);
  parent.addChild(node);
  node.setPosition(L.SIDEBAR_X, y, 0);
  node.addComponent(UITransform).setContentSize(L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H);
  const g = node.addComponent(Graphics);
  g.fillColor = toColor(COL.sidebarBtn);
  g.roundRect(-L.SIDEBAR_BTN_W / 2, -L.SIDEBAR_BTN_H / 2, L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, 6);
  g.fill();
  g.strokeColor = toColor({ r: 120, g: 130, b: 145, a: 255 });
  g.lineWidth = 2;
  g.roundRect(-L.SIDEBAR_BTN_W / 2, -L.SIDEBAR_BTN_H / 2, L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, 6);
  g.stroke();
  const t1 = new Node('T1');
  node.addChild(t1);
  t1.setPosition(0, 8, 0);
  t1.addComponent(UITransform).setContentSize(L.SIDEBAR_BTN_W, 28);
  const l1 = t1.addComponent(Label);
  l1.string = text;
  l1.fontSize = 20;
  l1.horizontalAlign = Label.HorizontalAlign.CENTER;
  l1.color = toColor(COL.text);
  const t2 = new Node('T2');
  node.addChild(t2);
  t2.setPosition(0, -16, 0);
  t2.addComponent(UITransform).setContentSize(L.SIDEBAR_BTN_W, 20);
  const l2 = t2.addComponent(Label);
  l2.string = sub;
  l2.fontSize = 11;
  l2.horizontalAlign = Label.HorizontalAlign.CENTER;
  l2.color = toColor(COL.textDim);
  node.on(Node.EventType.TOUCH_END, onClick);
  return node;
}
