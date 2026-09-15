/**
 * 武将图鉴：居中列对齐；表头排序；列表行复用（避免 Label destroy 触发 push 空引用）。
 */
import {
  Color,
  EventTouch,
  Label,
  Node,
  Sprite,
  UITransform,
} from 'cc';
import {
  GALLERY_OFFICERS,
  galleryAge,
  queryGalleryOfficers,
  type GalleryAttrFilter,
  type GalleryOfficer,
} from '../shared/MenuCatalog';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  playClickSfx,
  setLabelText,
} from '../shared/MenuChrome';
import {
  INK_UI_MUTED,
  INK_UI_TEXT,
  createMenuShell,
  makeRowLabel,
} from '../shared/MenuShell';
import { applySpriteContain } from '../shared/ScreenAdapt';

const PAGE_SIZE = 9;
const ROW_H = 42;
const LIST_W = 960;

const COL_DEFS = [
  { key: 'name', title: '全部', w: 120 },
  { key: 'gender', title: '性别', w: 88 },
  { key: 'age', title: '年龄', w: 88 },
  { key: 'force', title: '武力', w: 100 },
  { key: 'intellect', title: '智力', w: 100 },
  { key: 'leadership', title: '统率', w: 100 },
  { key: 'politics', title: '政治', w: 100 },
  { key: 'charm', title: '魅力', w: 100 },
] as const;

type ColKey = (typeof COL_DEFS)[number]['key'];

const COLS = (() => {
  const total = COL_DEFS.reduce((s, c) => s + c.w, 0);
  let cursor = -total / 2;
  return COL_DEFS.map((c) => {
    const x = cursor + c.w / 2;
    cursor += c.w;
    return { key: c.key as ColKey, title: c.title, x, w: c.w };
  });
})();

const SORTABLE = new Set<string>([
  'all',
  'force',
  'intellect',
  'leadership',
  'politics',
  'charm',
]);

const IDLE = () => new Color(INK_UI_TEXT.r, INK_UI_TEXT.g, INK_UI_TEXT.b, 240);
const HOT = () => new Color(242, 214, 120, 255);
const MUTE = () => new Color(INK_UI_MUTED.r, INK_UI_MUTED.g, INK_UI_MUTED.b, 230);

function cellText(o: GalleryOfficer, key: ColKey): string {
  switch (key) {
    case 'name':
      return o.name ?? '';
    case 'gender':
      return o.gender === 'female' ? '女' : '男';
    case 'age':
      return String(galleryAge(o));
    case 'force':
      return String(o.force ?? 0);
    case 'intellect':
      return String(o.intellect ?? 0);
    case 'leadership':
      return String(o.leadership ?? 0);
    case 'politics':
      return String(o.politics ?? 0);
    case 'charm':
      return String(o.charm ?? 0);
  }
}

function makeCellLabel(parent: Node, name: string, x: number, w: number, fontSize: number): Label {
  const n = new Node(name);
  parent.addChild(n);
  n.setPosition(x, 0, 0);
  n.addComponent(UITransform).setContentSize(w, ROW_H - 4);
  const lab = n.addComponent(Label);
  lab.string = '';
  lab.fontSize = fontSize;
  lab.lineHeight = fontSize + 6;
  lab.horizontalAlign = Label.HorizontalAlign.CENTER;
  lab.verticalAlign = Label.VerticalAlign.CENTER;
  lab.color = IDLE();
  lab.overflow = Label.Overflow.NONE;
  lab.enableWrapText = false;
  // 不用 isBold / shadow：Cocos Label assembler 在高频重建时易对 null 调 push
  return lab;
}

type RowView = {
  node: Node;
  labs: Record<ColKey, Label>;
  bind: (off: GalleryOfficer) => void;
};

function createRow(parent: Node, onPick: (off: GalleryOfficer) => void): RowView {
  const node = new Node('Row');
  parent.addChild(node);
  node.addComponent(UITransform).setContentSize(LIST_W, ROW_H);
  const labs = {} as Record<ColKey, Label>;
  for (const col of COLS) {
    labs[col.key] = makeCellLabel(node, col.key, col.x, col.w, 20);
  }
  let current: GalleryOfficer | null = null;
  node.on(Node.EventType.TOUCH_END, (_e: EventTouch) => {
    if (current) onPick(current);
  });
  return {
    node,
    labs,
    bind: (off: GalleryOfficer) => {
      current = off;
    },
  };
}

function paintRow(row: RowView, off: GalleryOfficer, selected: boolean): void {
  row.bind(off);
  const color = selected ? HOT() : IDLE();
  const size = selected ? 22 : 20;
  for (const col of COLS) {
    const lab = row.labs[col.key];
    if (!lab?.isValid) continue;
    lab.string = cellText(off, col.key);
    lab.color = color;
    lab.fontSize = size;
    lab.lineHeight = size + 6;
  }
}

export async function buildGalleryScreen(layer: Node, onBack: () => void): Promise<void> {
  const shell = await createMenuShell(layer, '武将图鉴', onBack);

  let attrFilter: GalleryAttrFilter = 'all';
  let page = 0;

  const refreshQuery = () => queryGalleryOfficers({ attr: attrFilter });
  let list = refreshQuery();
  let selected: GalleryOfficer = list[0];

  const portrait = new Node('Portrait');
  shell.body.addChild(portrait);
  portrait.setPosition(-320, 560, 0);
  const portraitSp = portrait.addComponent(Sprite);

  const nameL = makeRowLabel(shell.body, 'Name', '', 640, {
    fontSize: 34,
    bold: true,
    x: 80,
    width: 560,
  });
  nameL.horizontalAlign = Label.HorizontalAlign.LEFT;
  nameL.overflow = Label.Overflow.NONE;

  const metaL = makeRowLabel(shell.body, 'Meta', '', 585, {
    fontSize: 22,
    color: MUTE(),
    x: 80,
    width: 560,
  });
  metaL.horizontalAlign = Label.HorizontalAlign.LEFT;
  metaL.overflow = Label.Overflow.NONE;

  const bioL = makeRowLabel(shell.body, 'Bio', '', 520, {
    fontSize: 20,
    color: MUTE(),
    x: 80,
    width: 560,
  });
  bioL.horizontalAlign = Label.HorizontalAlign.LEFT;
  bioL.overflow = Label.Overflow.CLAMP;
  bioL.enableWrapText = false;
  bioL.node.getComponent(UITransform)!.setContentSize(560, 44);

  // 表头（兼排序）
  const headRoot = new Node('ColHead');
  shell.body.addChild(headRoot);
  headRoot.setPosition(0, 420, 0);
  const headLabs: Partial<Record<ColKey, Label>> = {};
  for (const col of COLS) {
    const n = new Node(`Head_${col.key}`);
    headRoot.addChild(n);
    n.setPosition(col.x, 0, 0);
    n.addComponent(UITransform).setContentSize(col.w, 40);
    const lab = makeLabel(n, 'Label', col.title, {
      fontSize: 22,
      color: MUTE(),
      y: 0,
    });
    lab.overflow = Label.Overflow.NONE;
    lab.node.getComponent(UITransform)!.setContentSize(col.w, 36);
    headLabs[col.key] = lab;

    const sortId: GalleryAttrFilter | null =
      col.key === 'name'
        ? 'all'
        : SORTABLE.has(col.key)
          ? (col.key as GalleryAttrFilter)
          : null;
    if (sortId) {
      n.on(Node.EventType.TOUCH_END, () => {
        playClickSfx(shell.body);
        attrFilter = sortId;
        void applyFilters(true);
      });
    }
  }

  const paintHead = () => {
    for (const col of COLS) {
      const lab = headLabs[col.key];
      if (!lab?.isValid) continue;
      let on = false;
      if (col.key === 'name') on = attrFilter === 'all';
      else if (SORTABLE.has(col.key)) on = attrFilter === col.key;
      lab.color = on ? HOT() : MUTE();
    }
  };

  const listRoot = new Node('List');
  shell.body.addChild(listRoot);
  listRoot.setPosition(0, 350, 0);
  listRoot.addComponent(UITransform).setContentSize(LIST_W, PAGE_SIZE * ROW_H + 10);

  const footInfo = makeRowLabel(shell.body, 'FootInfo', '', -300, {
    fontSize: 22,
    color: MUTE(),
  });
  footInfo.overflow = Label.Overflow.NONE;

  const rows: RowView[] = [];
  const onPickRow = (off: GalleryOfficer) => {
    selected = off;
    playClickSfx(shell.body);
    void refreshDetail();
    renderList();
  };
  for (let i = 0; i < PAGE_SIZE; i++) {
    const row = createRow(listRoot, onPickRow);
    row.node.setPosition(0, -i * ROW_H, 0);
    row.node.active = false;
    rows.push(row);
  }

  const applyPortrait = async (path: string) => {
    const frame = await loadSpriteFrame(path);
    if (!portrait.isValid) return;
    if (frame) {
      applySpriteContain(portrait, portraitSp, frame, 150, 190);
    } else {
      const ui = portrait.getComponent(UITransform) ?? portrait.addComponent(UITransform);
      ui.setContentSize(130, 170);
      portraitSp.sizeMode = Sprite.SizeMode.CUSTOM;
      portraitSp.color = new Color(50, 42, 34, 255);
    }
    portrait.setPosition(-320, 560, 0);
  };

  const refreshDetail = async () => {
    if (!selected || !nameL.isValid) return;
    const courtesy = selected.courtesyName ? `　${selected.courtesyName}` : '';
    const age = galleryAge(selected);
    setLabelText(nameL, `${selected.name ?? ''}${courtesy}`);
    setLabelText(
      metaL,
      `${selected.factionName ?? ''}　·　${selected.style ?? ''}　·　` +
        `${selected.gender === 'female' ? '女' : '男'}　·　` +
        `${age}岁（建安五年）`,
    );
    setLabelText(bioL, selected.bio ?? '');
    await applyPortrait(selected.portrait);
  };

  const renderList = () => {
    if (!listRoot.isValid) return;
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.max(0, Math.min(page, totalPages - 1));
    setLabelText(
      footInfo,
      `${page + 1} / ${totalPages}　·　本栏 ${list.length}　/　全库 ${GALLERY_OFFICERS.length}`,
    );

    const start = page * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const off = slice[i];
      if (!off) {
        row.node.active = false;
        continue;
      }
      row.node.active = true;
      paintRow(row, off, selected?.id === off.id);
    }
  };

  const applyFilters = async (resetSelection: boolean) => {
    list = refreshQuery();
    page = 0;
    if (list.length > 0) {
      if (resetSelection || !list.some((o) => o.id === selected?.id)) {
        selected = list[0];
      }
    }
    paintHead();
    if (selected) await refreshDetail();
    renderList();
  };

  paintHead();
  await refreshDetail();
  renderList();

  await createClassicButton(shell.body, {
    name: 'Prev',
    label: '上一页',
    style: 'quaternary',
    width: 300,
    height: 86,
    y: -400,
    x: -170,
    onClick: () => {
      page -= 1;
      renderList();
    },
  });

  await createClassicButton(shell.body, {
    name: 'Next',
    label: '下一页',
    style: 'quaternary',
    width: 300,
    height: 86,
    y: -400,
    x: 170,
    onClick: () => {
      page += 1;
      renderList();
    },
  });
}
