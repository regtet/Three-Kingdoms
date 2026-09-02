import {
  BlockInputEvents,
  Button,
  EditBox,
  Graphics,
  Label,
  Node,
  UITransform,
  Vec3,
} from 'cc';
import type { General } from '../core/models/types';
import { ALL_SCENARIOS } from '../core/data/scenarios/index';
import { getGeneralBio } from '../core/data/generalBios';
import { resolveGeneralRoster } from '../core/data/generalRoster';
import {
  loadCustomGenerals,
  saveCustomGenerals,
  CUSTOM_GENERALS_KEY,
  type CustomGeneralDef,
} from '../core/utils/customGenerals';
import { createGalleryDetailPortrait } from './GeneralPortrait';
import { COL, L } from './OfficialLayout';
import { drawModalFrame, drawPanel, toColor } from './UiDraw';

export { loadCustomGenerals, saveCustomGenerals, CUSTOM_GENERALS_KEY, type CustomGeneralDef };
export { applyCustomGeneralsToScenario } from '../core/utils/customGenerals';

type AbilityKey = 'leadership' | 'force' | 'intelligence' | 'politics' | 'charm';

const ABILITY_KEYS: AbilityKey[] = ['leadership', 'force', 'intelligence', 'politics', 'charm'];

const STAT_LABELS: Record<AbilityKey | 'loyalty', string> = {
  leadership: '统率',
  force: '武力',
  intelligence: '智力',
  politics: '政治',
  charm: '魅力',
  loyalty: '忠诚',
};

const LIST_COLS: { label: string; x: number; w: number; key?: AbilityKey | 'name' | 'faction' }[] = [
  { label: '姓名', x: -280, w: 72, key: 'name' },
  { label: '势力', x: -200, w: 44, key: 'faction' },
  { label: '统率', x: -120, w: 44, key: 'leadership' },
  { label: '武力', x: -40, w: 44, key: 'force' },
  { label: '智力', x: 40, w: 44, key: 'intelligence' },
  { label: '政治', x: 120, w: 44, key: 'politics' },
  { label: '魅力', x: 200, w: 44, key: 'charm' },
];

const FACTION_NAMES = new Map<string, string>();
const CITY_NAMES = new Map<string, string>();
for (const scenario of ALL_SCENARIOS) {
  for (const f of scenario.factions) FACTION_NAMES.set(f.id, f.name);
  for (const c of scenario.cities) CITY_NAMES.set(c.id, c.name);
}

function mergeCustomGeneral(stateGeneral: General): General {
  const custom = loadCustomGenerals().find((g) => g.id === stateGeneral.id);
  if (!custom) return { ...stateGeneral };
  return { ...stateGeneral, ...custom };
}

function clampStat(value: number, min = 1, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function factionLabel(factionId: string): string {
  return FACTION_NAMES.get(factionId) ?? factionId;
}

function cityLabel(cityId: string): string {
  return CITY_NAMES.get(cityId) ?? cityId;
}

function listCellText(g: General, key: (typeof LIST_COLS)[number]['key']): string {
  switch (key) {
    case 'name': return g.name;
    case 'faction': {
      const full = factionLabel(g.factionId);
      return full.includes('魏') ? '魏' : full.includes('蜀') ? '蜀' : full.includes('吴') ? '吴' : full.charAt(0);
    }
    case 'leadership':
    case 'force':
    case 'intelligence':
    case 'politics':
    case 'charm':
      return `${g[key]}`;
    default:
      return '';
  }
}

function editorRowY(rowIndex: number): number {
  return L.EDITOR_LIST_FIRST_ROW_Y - rowIndex * L.EDITOR_LIST_ROW_H;
}

/** 构建武将编辑面板：列表 → 详情编辑（+/- 与点击数值输入） */
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
  bgg.fillColor = toColor({ r: 0, g: 0, b: 0, a: 210 });
  bgg.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  bgg.fill();

  const listRoot = new Node('ListView');
  panel.addChild(listRoot);

  const editRoot = new Node('EditView');
  panel.addChild(editRoot);
  editRoot.active = false;

  let workingGenerals: General[] = [];
  let draft: General | null = null;
  const valueLabels = new Map<AbilityKey | 'loyalty', Label>();

  const showList = () => {
    editRoot.active = false;
    listRoot.active = true;
    draft = null;
    renderList();
  };

  const showEdit = (g: General) => {
    draft = { ...g };
    listRoot.active = false;
    editRoot.active = true;
    renderEdit();
  };

  const renderList = () => {
    listRoot.destroyAllChildren();

    const titleN = new Node('Title');
    listRoot.addChild(titleN);
    titleN.setPosition(0, L.EDITOR_TITLE_Y, 0);
    titleN.addComponent(UITransform).setContentSize(600, 40);
    const titleLb = titleN.addComponent(Label);
    titleLb.string = '武将编辑';
    titleLb.fontSize = 28;
    titleLb.color = toColor(COL.textGold);
    titleLb.horizontalAlign = Label.HorizontalAlign.CENTER;

    const header = new Node('TableHeader');
    listRoot.addChild(header);
    header.setPosition(0, L.EDITOR_LIST_HEADER_Y, 0);
    header.addComponent(UITransform).setContentSize(L.EDITOR_LIST_W, L.EDITOR_LIST_ROW_H);
    drawPanel(
      header.addComponent(Graphics),
      L.EDITOR_LIST_W,
      L.EDITOR_LIST_ROW_H,
      toColor({ r: 28, g: 32, b: 44, a: 240 }),
      toColor(COL.borderGold),
      4,
    );
    mkLabel(header, 'H0', '武将', -L.EDITOR_LIST_W / 2 + 36, 0, 15, COL.textGold, 64, Label.HorizontalAlign.LEFT);
    for (const col of LIST_COLS) {
      mkLabel(header, `H_${col.label}`, col.label, col.x, 0, 14, COL.textGold, col.w);
    }

    workingGenerals.slice(0, L.EDITOR_LIST_ROWS).forEach((g, i) => {
      const y = editorRowY(i);
      const row = new Node(`Row_${g.id}`);
      listRoot.addChild(row);
      row.setPosition(0, y, 0);
      row.addComponent(UITransform).setContentSize(L.EDITOR_LIST_W, L.EDITOR_LIST_ROW_H);
      drawPanel(
        row.addComponent(Graphics),
        L.EDITOR_LIST_W,
        L.EDITOR_LIST_ROW_H,
        toColor(i % 2 === 0 ? { r: 20, g: 24, b: 34, a: 220 } : { r: 16, g: 20, b: 30, a: 220 }),
        toColor(COL.borderGoldDim),
        2,
      );
      LIST_COLS.forEach((col, ci) => {
        const align = ci === 0 ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
        mkLabel(row, `C_${ci}`, listCellText(g, col.key), col.x, 0, 14, COL.text, col.w, align);
      });
      row.addComponent(Button);
      row.on(Button.EventType.CLICK, () => showEdit(g));
    });

    mkBtn(listRoot, '关闭', new Vec3(0, L.EDITOR_BACK_LIST_Y, 0), onClose);
  };

  const updateStatLabel = (key: AbilityKey | 'loyalty') => {
    if (!draft) return;
    const lb = valueLabels.get(key);
    if (lb) lb.string = `${draft[key]}`;
  };

  const setStat = (key: AbilityKey | 'loyalty', value: number) => {
    if (!draft) return;
    (draft as Record<string, number>)[key] = clampStat(value);
    updateStatLabel(key);
  };

  const adjustStat = (key: AbilityKey | 'loyalty', delta: number) => {
    if (!draft) return;
    setStat(key, (draft[key] as number) + delta);
  };

  const openNumericDialog = (key: AbilityKey | 'loyalty') => {
    if (!draft) return;
    const overlay = new Node('NumPicker');
    panel.addChild(overlay);
    overlay.addComponent(UITransform).setContentSize(L.W, L.H);
    overlay.addComponent(BlockInputEvents);
    overlay.setSiblingIndex(panel.children.length - 1);

    const dim = overlay.addComponent(Graphics);
    dim.fillColor = toColor({ r: 0, g: 0, b: 0, a: 160 });
    dim.rect(-L.W / 2, -L.H / 2, L.W, L.H);
    dim.fill();

    const frame = new Node('Frame');
    overlay.addChild(frame);
    frame.addComponent(UITransform).setContentSize(320, 220);
    drawModalFrame(frame.addComponent(Graphics), 320, 220);

    mkLabel(frame, 'DlgTitle', STAT_LABELS[key], 0, 70, 22, COL.textGold, 280);

    const inputWrap = new Node('Input');
    frame.addChild(inputWrap);
    inputWrap.setPosition(0, 10, 0);
    inputWrap.addComponent(UITransform).setContentSize(200, 44);
    drawPanel(inputWrap.addComponent(Graphics), 200, 44, toColor(COL.fieldBg), toColor(COL.borderGoldDim), 6);

    const editNode = new Node('EditBox');
    inputWrap.addChild(editNode);
    editNode.addComponent(UITransform).setContentSize(180, 40);
    const editBox = editNode.addComponent(EditBox);
    editBox.inputMode = EditBox.InputMode.NUMERIC;
    editBox.maxLength = 3;
    editBox.string = `${draft[key]}`;
    editBox.textLabel = mkEditLabel(editNode);
    editBox.placeholderLabel = mkEditLabel(editNode, '1-100', COL.textDim);

    const closeDlg = (confirmed: boolean) => {
      if (confirmed) {
        const parsed = parseInt(editBox.string, 10);
        if (!Number.isNaN(parsed)) setStat(key, parsed);
      }
      overlay.destroy();
    };

    mkBtn(frame, '取消', new Vec3(-70, -70, 0), () => closeDlg(false));
    mkBtn(frame, '确定', new Vec3(70, -70, 0), () => closeDlg(true));
  };

  const renderEdit = () => {
    if (!draft) return;
    editRoot.destroyAllChildren();
    valueLabels.clear();

    const roster = resolveGeneralRoster(draft.id, draft.name);
    const bio = getGeneralBio(draft.id, draft.name, draft, roster.skill);

    mkBtn(editRoot, '← 武将编辑', new Vec3(-220, L.EDITOR_TITLE_Y, 0), showList, 180, 40, 16);

    const portraitSlot = new Node('Portrait');
    editRoot.addChild(portraitSlot);
    portraitSlot.setPosition(L.EDITOR_PORTRAIT_X, L.EDITOR_PORTRAIT_Y, 0);
    portraitSlot.addComponent(UITransform).setContentSize(L.EDITOR_PORTRAIT_W, L.EDITOR_PORTRAIT_H);
    createGalleryDetailPortrait(portraitSlot, draft.id, draft.name, L.EDITOR_PORTRAIT_W, L.EDITOR_PORTRAIT_H);

    mkLabel(editRoot, 'Name', draft.name, L.EDITOR_NAME_X, L.EDITOR_NAME_Y, 26, COL.textGold, 260, Label.HorizontalAlign.LEFT);
    mkLabel(editRoot, 'Epithet', bio.epithet, L.EDITOR_NAME_X, L.EDITOR_NAME_Y - 36, 18, COL.textDim, 260, Label.HorizontalAlign.LEFT);

    mkLabel(
      editRoot,
      'Meta1',
      `势力：${factionLabel(draft.factionId)}          所属：${cityLabel(draft.cityId)}`,
      0,
      L.EDITOR_META_Y,
      16,
      COL.text,
      620,
      Label.HorizontalAlign.LEFT,
    );
    mkLabel(
      editRoot,
      'Meta2',
      `年龄：${draft.age ?? 30}            忠诚：${draft.loyalty}`,
      0,
      L.EDITOR_META_Y - 32,
      16,
      COL.text,
      620,
      Label.HorizontalAlign.LEFT,
    );

    mkLabel(editRoot, 'SecAbility', '基础能力', 0, L.EDITOR_STAT_SECTION_Y, 18, COL.textGold, 620, Label.HorizontalAlign.LEFT);

    ABILITY_KEYS.forEach((key, i) => {
      const y = L.EDITOR_STAT_FIRST_Y - i * L.EDITOR_STAT_ROW_H;
      buildStatRow(editRoot, key, y, () => adjustStat(key, -1), () => adjustStat(key, 1), () => openNumericDialog(key));
      valueLabels.set(key, editRoot.getChildByName(`StatRow_${key}`)!.getChildByName('Val')!.getComponent(Label)!);
      updateStatLabel(key);
    });

    const loyaltyRowY = L.EDITOR_STAT_FIRST_Y - ABILITY_KEYS.length * L.EDITOR_STAT_ROW_H - 8;
    buildStatRow(
      editRoot,
      'loyalty',
      loyaltyRowY,
      () => adjustStat('loyalty', -1),
      () => adjustStat('loyalty', 1),
      () => openNumericDialog('loyalty'),
    );
    valueLabels.set('loyalty', editRoot.getChildByName('StatRow_loyalty')!.getChildByName('Val')!.getComponent(Label)!);
    updateStatLabel('loyalty');

    mkLabel(editRoot, 'SecSkill', '特技', 0, L.EDITOR_SKILL_Y + 40, 18, COL.textGold, 620, Label.HorizontalAlign.LEFT);
    const skillLine = new Node('Skills');
    editRoot.addChild(skillLine);
    skillLine.setPosition(0, L.EDITOR_SKILL_Y, 0);
    skillLine.addComponent(UITransform).setContentSize(620, 40);
    const chips = [roster.skill, bio.epithet].filter((s, idx, arr) => s && arr.indexOf(s) === idx);
    chips.forEach((text, i) => mkChip(skillLine, text, -240 + i * 120));
    mkChip(skillLine, '+ 添加特技', 120, true);

    mkBtn(editRoot, '取消', new Vec3(-80, L.EDITOR_ACTION_Y, 0), showList);
    mkBtn(editRoot, '保存', new Vec3(80, L.EDITOR_ACTION_Y, 0), () => {
      if (!draft) return;
      const def: CustomGeneralDef = {
        id: draft.id,
        name: draft.name,
        force: draft.force,
        intelligence: draft.intelligence,
        leadership: draft.leadership,
        politics: draft.politics,
        charm: draft.charm,
        loyalty: draft.loyalty,
        factionId: draft.factionId,
        cityId: draft.cityId,
        age: draft.age,
      };
      const list = loadCustomGenerals().filter((x) => x.id !== draft!.id);
      list.push(def);
      saveCustomGenerals(list);
      const idx = workingGenerals.findIndex((x) => x.id === draft!.id);
      if (idx >= 0) workingGenerals[idx] = { ...workingGenerals[idx], ...def };
      onSave(def);
      showList();
    });
  };

  const buildStatRow = (
    parent: Node,
    key: AbilityKey | 'loyalty',
    y: number,
    onMinus: () => void,
    onPlus: () => void,
    onValClick: () => void,
  ) => {
    const row = new Node(`StatRow_${key}`);
    parent.addChild(row);
    row.setPosition(0, y, 0);
    row.addComponent(UITransform).setContentSize(620, 40);

    mkLabel(row, 'Label', STAT_LABELS[key], -250, 0, 18, COL.text, 80, Label.HorizontalAlign.LEFT);

    mkTinyBtn(row, '-', -60, 0, onMinus);
    const valBtn = new Node('ValBtn');
    row.addChild(valBtn);
    valBtn.setPosition(20, 0, 0);
    valBtn.addComponent(UITransform).setContentSize(72, 36);
    drawPanel(valBtn.addComponent(Graphics), 72, 36, toColor(COL.fieldBg), toColor(COL.borderGoldDim), 4);
    const valN = new Node('Val');
    valBtn.addChild(valN);
    valN.addComponent(UITransform).setContentSize(72, 36);
    const valLb = valN.addComponent(Label);
    valLb.string = '0';
    valLb.fontSize = 20;
    valLb.horizontalAlign = Label.HorizontalAlign.CENTER;
    valLb.color = toColor(COL.textGold);
    valBtn.addComponent(Button);
    valBtn.on(Button.EventType.CLICK, onValClick);
    mkTinyBtn(row, '+', 100, 0, onPlus);
  };

  const refresh = (list: General[]) => {
    workingGenerals = list.map((g) => mergeCustomGeneral({ ...g }));
    showList();
  };

  refresh(generals);
  return { panel, refresh };
}

function mkLabel(
  parent: Node,
  name: string,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: { r: number; g: number; b: number; a: number },
  w: number,
  align = Label.HorizontalAlign.CENTER,
): Label {
  const n = new Node(name);
  parent.addChild(n);
  n.setPosition(x, y, 0);
  n.addComponent(UITransform).setContentSize(w, fontSize + 8);
  const lb = n.addComponent(Label);
  lb.string = text;
  lb.fontSize = fontSize;
  lb.lineHeight = fontSize + 4;
  lb.horizontalAlign = align;
  lb.color = toColor(color);
  return lb;
}

function mkEditLabel(parent: Node, text = '', color = COL.textDark): Label {
  const n = new Node('Text');
  parent.addChild(n);
  n.addComponent(UITransform).setContentSize(180, 40);
  const lb = n.addComponent(Label);
  lb.string = text;
  lb.fontSize = 22;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.color = toColor(color);
  return lb;
}

function mkChip(parent: Node, text: string, x: number, dim = false): void {
  const n = new Node(`Chip_${text}`);
  parent.addChild(n);
  n.setPosition(x, 0, 0);
  n.addComponent(UITransform).setContentSize(110, 32);
  drawPanel(
    n.addComponent(Graphics),
    110,
    32,
    toColor(dim ? { r: 32, g: 34, b: 42, a: 200 } : { r: 48, g: 38, b: 22, a: 230 }),
    toColor(dim ? COL.borderGoldDim : COL.borderGold),
    6,
  );
  mkLabel(n, 'T', text, 0, 0, 14, dim ? COL.textDim : COL.textGold, 104);
}

function mkBtn(
  parent: Node,
  text: string,
  pos: Vec3,
  cb: () => void,
  w = 120,
  h = 44,
  fontSize = 18,
): Node {
  const n = new Node(`Btn_${text}`);
  parent.addChild(n);
  n.setPosition(pos);
  n.addComponent(UITransform).setContentSize(w, h);
  const g = n.addComponent(Graphics);
  g.fillColor = toColor(COL.btn);
  g.roundRect(-w / 2, -h / 2, w, h, 6);
  g.fill();
  const lb = new Node('Label');
  n.addChild(lb);
  lb.addComponent(UITransform).setContentSize(w, h);
  const l = lb.addComponent(Label);
  l.string = text;
  l.fontSize = fontSize;
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
  n.addComponent(UITransform).setContentSize(32, 32);
  const g = n.addComponent(Graphics);
  g.fillColor = toColor(COL.btn);
  g.roundRect(-16, -16, 32, 32, 4);
  g.fill();
  const lb = new Node('L');
  n.addChild(lb);
  lb.addComponent(UITransform).setContentSize(32, 32);
  const l = lb.addComponent(Label);
  l.string = text;
  l.fontSize = 18;
  l.horizontalAlign = Label.HorizontalAlign.CENTER;
  l.color = toColor(COL.text);
  n.addComponent(Button);
  n.on(Button.EventType.CLICK, cb);
  return n;
}
