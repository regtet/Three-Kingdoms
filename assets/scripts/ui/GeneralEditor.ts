import { Button, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import type { General } from '../core/models/types';
import { loadCustomGenerals, saveCustomGenerals, CUSTOM_GENERALS_KEY, type CustomGeneralDef } from '../core/utils/customGenerals';
import { COL, L } from './OfficialLayout';
import { drawModalFrame, drawPanel, toColor } from './UiDraw';

export { loadCustomGenerals, saveCustomGenerals, CUSTOM_GENERALS_KEY, type CustomGeneralDef };
export { applyCustomGeneralsToScenario } from '../core/utils/customGenerals';

type StatKey = 'force' | 'intelligence' | 'leadership' | 'politics' | 'charm' | 'loyalty';

function mergeCustomGeneral(stateGeneral: General): General {
  const custom = loadCustomGenerals().find((g) => g.id === stateGeneral.id);
  if (!custom) return stateGeneral;
  return { ...stateGeneral, ...custom };
}

const STAT_LABELS: Record<StatKey, string> = {
  force: '武力',
  intelligence: '智力',
  leadership: '统率',
  politics: '政治',
  charm: '魅力',
  loyalty: '忠诚',
};

/** 构建武将编辑面板 */
export function buildGeneralEditorPanel(
  parent: Node,
  generals: General[],
  onSave: (updated: CustomGeneralDef) => void,
  onClose: () => void,
): { panel: Node; refresh: (list: General[]) => void } {
  const panel = new Node('GeneralEditorPanel');
  parent.addChild(panel);
  panel.addComponent(UITransform).setContentSize(L.W, L.H);

  const bg = new Node('Bg');
  panel.addChild(bg);
  bg.addComponent(UITransform).setContentSize(L.W, L.H);
  const bgg = bg.addComponent(Graphics);
  bgg.fillColor = toColor({ r: 0, g: 0, b: 0, a: 200 });
  bgg.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  bgg.fill();

  const frame = new Node('Frame');
  panel.addChild(frame);
  frame.setPosition(0, 40, 0);
  frame.addComponent(UITransform).setContentSize(660, 900);
  drawModalFrame(frame.addComponent(Graphics), 660, 900);

  const titleN = new Node('Title');
  panel.addChild(titleN);
  titleN.setPosition(0, 420, 0);
  titleN.addComponent(UITransform).setContentSize(600, 40);
  const titleLb = titleN.addComponent(Label);
  titleLb.string = '武将编辑';
  titleLb.fontSize = 28;
  titleLb.color = toColor(COL.textGold);
  titleLb.horizontalAlign = Label.HorizontalAlign.CENTER;

  const listRoot = new Node('GenList');
  panel.addChild(listRoot);
  listRoot.setPosition(0, 200, 0);

  const editRoot = new Node('EditArea');
  panel.addChild(editRoot);
  editRoot.setPosition(0, -80, 0);

  let selectedId: string | null = null;

  const statNodes = new Map<StatKey, Label>();

  const renderEdit = (g: General) => {
    editRoot.destroyAllChildren();
    statNodes.clear();
    selectedId = g.id;

    const nameN = new Node('Name');
    editRoot.addChild(nameN);
    nameN.setPosition(0, 120, 0);
    nameN.addComponent(UITransform).setContentSize(400, 36);
    const nameLb = nameN.addComponent(Label);
    nameLb.string = g.name;
    nameLb.fontSize = 24;
    nameLb.color = toColor(COL.textGold);
    nameLb.horizontalAlign = Label.HorizontalAlign.CENTER;

    (Object.keys(STAT_LABELS) as StatKey[]).forEach((key, i) => {
      const row = i % 3;
      const col = Math.floor(i / 3);
      const x = (row - 1) * 200;
      const y = 60 - col * 50;
      const rowN = new Node(`Stat_${key}`);
      editRoot.addChild(rowN);
      rowN.setPosition(x, y, 0);
      rowN.addComponent(UITransform).setContentSize(180, 40);
      const rg = rowN.addComponent(Graphics);
      drawPanel(rg, 180, 40, toColor(COL.fieldBg), toColor({ r: 120, g: 130, b: 145, a: 255 }), 4);
      const valLb = new Node('Val');
      rowN.addChild(valLb);
      valLb.addComponent(UITransform).setContentSize(100, 40);
      const vl = valLb.addComponent(Label);
      vl.string = `${STAT_LABELS[key]} ${g[key]}`;
      vl.fontSize = 14;
      vl.color = toColor(COL.textDark);
      statNodes.set(key, vl);

      const minus = mkTinyBtn(rowN, '-', -70, 0, () => adjust(key, -1));
      const plus = mkTinyBtn(rowN, '+', 70, 0, () => adjust(key, 1));
      minus; plus;
    });

    const saveBtn = mkBtn(editRoot, '保存', new Vec3(-80, -100, 0), () => {
      const def: CustomGeneralDef = {
        id: g.id,
        name: g.name,
        force: g.force,
        intelligence: g.intelligence,
        leadership: g.leadership,
        politics: g.politics,
        charm: g.charm,
        loyalty: g.loyalty,
        factionId: g.factionId,
        cityId: g.cityId,
      };
      const list = loadCustomGenerals().filter((x) => x.id !== g.id);
      list.push(def);
      saveCustomGenerals(list);
      onSave(def);
    });
    const resetBtn = mkBtn(editRoot, '重置', new Vec3(80, -100, 0), () => {
      const list = loadCustomGenerals().filter((x) => x.id !== g.id);
      saveCustomGenerals(list);
      onSave({ id: g.id, name: g.name, force: g.force, intelligence: g.intelligence, leadership: g.leadership, politics: g.politics, charm: g.charm, loyalty: g.loyalty, factionId: g.factionId, cityId: g.cityId });
    });
    saveBtn; resetBtn;
  };

  const adjust = (key: StatKey, delta: number) => {
    if (!selectedId) return;
    const g = generals.find((x) => x.id === selectedId);
    if (!g) return;
    const max = key === 'loyalty' ? 100 : 100;
    (g as Record<string, number>)[key] = Math.max(1, Math.min(max, (g[key] as number) + delta));
    const lb = statNodes.get(key);
    if (lb) lb.string = `${STAT_LABELS[key]} ${g[key]}`;
  };

  const refresh = (list: General[]) => {
    generals = list.map((g) => mergeCustomGeneral({ ...g }));
    listRoot.destroyAllChildren();
    list.slice(0, 8).forEach((g, i) => {
      const row = new Node(`Pick_${g.id}`);
      listRoot.addChild(row);
      row.setPosition(0, -i * 44, 0);
      row.addComponent(UITransform).setContentSize(580, 40);
      const rg = row.addComponent(Graphics);
      rg.fillColor = toColor(selectedId === g.id ? COL.btnHighlight : COL.sidebarBtn);
      rg.roundRect(-290, -20, 580, 40, 4);
      rg.fill();
      const lb = new Node('Lb');
      row.addChild(lb);
      lb.addComponent(UITransform).setContentSize(560, 40);
      const l = lb.addComponent(Label);
      l.string = `${g.name}  武${g.force} 智${g.intelligence} 统${g.leadership} 忠${g.loyalty}`;
      l.fontSize = 14;
      l.color = toColor(COL.text);
      row.addComponent(Button);
      row.on(Button.EventType.CLICK, () => renderEdit(g));
    });
    if (generals.length && !selectedId) renderEdit(generals[0]);
    else if (selectedId) {
      const g = generals.find((x) => x.id === selectedId);
      if (g) renderEdit(g);
    }
  };

  mkBtn(panel, '关闭', new Vec3(0, -420, 0), onClose);

  return { panel, refresh };
}

function mkBtn(parent: Node, text: string, pos: Vec3, cb: () => void): Node {
  const n = new Node(`Btn_${text}`);
  parent.addChild(n);
  n.setPosition(pos);
  n.addComponent(UITransform).setContentSize(120, 44);
  const g = n.addComponent(Graphics);
  g.fillColor = toColor(COL.btn);
  g.roundRect(-60, -22, 120, 44, 6);
  g.fill();
  const lb = new Node('Label');
  n.addChild(lb);
  lb.addComponent(UITransform).setContentSize(120, 44);
  const l = lb.addComponent(Label);
  l.string = text;
  l.fontSize = 18;
  l.horizontalAlign = Label.HorizontalAlign.CENTER;
  l.color = toColor(COL.text);
  n.addComponent(Button);
  n.on(Button.EventType.CLICK, cb);
  return n;
}

function mkTinyBtn(parent: Node, text: string, x: number, y: number, cb: () => void): Node {
  const n = new Node(`Tiny_${text}`);
  parent.addChild(n);
  n.setPosition(x, y, 0);
  n.addComponent(UITransform).setContentSize(28, 28);
  const g = n.addComponent(Graphics);
  g.fillColor = toColor(COL.btn);
  g.roundRect(-14, -14, 28, 28, 4);
  g.fill();
  const lb = new Node('L');
  n.addChild(lb);
  lb.addComponent(UITransform).setContentSize(28, 28);
  const l = lb.addComponent(Label);
  l.string = text;
  l.fontSize = 16;
  l.horizontalAlign = Label.HorizontalAlign.CENTER;
  l.color = toColor(COL.text);
  n.addComponent(Button);
  n.on(Button.EventType.CLICK, cb);
  return n;
}
