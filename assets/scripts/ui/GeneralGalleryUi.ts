import {
  BlockInputEvents,
  Button,
  Component,
  Graphics,
  Label,
  Mask,
  Node,
  ScrollView,
  UITransform,
} from 'cc';
import {
  type GalleryGeneral,
  type TroopFilterId,
  formatTroopAdaptLine,
  TROOP_BADGE,
  TROOP_FILTER_TABS,
} from '../core/data/generalCatalog';
import { createGalleryDetailPortrait } from './GeneralPortrait';
import { createLobbyBgFallback } from './LobbyScreens';
import { applyLobbyTypography, createLobbyBack, createLobbyTitle, toCcColor } from './LobbyUi';
import { COL, L } from './OfficialLayout';
import { drawPanel, toColor } from './UiDraw';
import { audioManager } from './AudioManager';

type ColorLike = { r: number; g: number; b: number; a: number };

const TABLE_PAD = 12;
const TABLE_LEFT = -L.LOBBY_GALLERY_TABLE_W / 2 + TABLE_PAD;

/** 列宽固定、左缘对齐，避免姓名与表头「武将」重叠 */
const TABLE_COLS: { label: string; left: number; w: number; align: number }[] = [
  { label: '姓名', left: TABLE_LEFT, w: 96, align: Label.HorizontalAlign.LEFT },
  { label: '势力', left: TABLE_LEFT + 96, w: 56, align: Label.HorizontalAlign.CENTER },
  { label: '统率', left: TABLE_LEFT + 152, w: 56, align: Label.HorizontalAlign.CENTER },
  { label: '武力', left: TABLE_LEFT + 208, w: 56, align: Label.HorizontalAlign.CENTER },
  { label: '智力', left: TABLE_LEFT + 264, w: 56, align: Label.HorizontalAlign.CENTER },
  { label: '政治', left: TABLE_LEFT + 320, w: 56, align: Label.HorizontalAlign.CENTER },
  { label: '魅力', left: TABLE_LEFT + 376, w: 56, align: Label.HorizontalAlign.CENTER },
];

export function galleryScrollRowY(rowIndex: number): number {
  const h = L.LOBBY_GALLERY_TABLE_ROW_H;
  return -(rowIndex * h + h / 2);
}

function mkLabel(
  parent: Node,
  name: string,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: ColorLike,
  w = 120,
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
  lb.overflow = Label.Overflow.CLAMP;
  lb.color = toCcColor(color);
  applyLobbyTypography(lb, 'body');
  lb.enableOutline = fontSize >= 16;
  return lb;
}

export type GalleryListShell = {
  filterRoot: Node;
  scrollContent: Node;
  scrollView: ScrollView;
  countHint: Label;
};

/** 图鉴页骨架（固定表头 + 可滚动列表） */
export function buildGalleryListShell(
  layer: Node,
  onBack: () => void,
  host: Component,
): GalleryListShell {
  createLobbyBgFallback(layer);
  createLobbyTitle(layer, '名将录');
  const sub = new Node('GallerySubtitle');
  layer.addChild(sub);
  sub.setPosition(0, L.LOBBY_SUBTITLE_Y, 0);
  const subLb = sub.addComponent(Label);
  subLb.string = '表格浏览 · 上下滑动 · 点击行查看详情';
  subLb.fontSize = 18;
  subLb.lineHeight = 26;
  subLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  applyLobbyTypography(subLb, 'body');
  subLb.color = toCcColor(COL.menuGold);

  const filterRoot = new Node('GalleryFilters');
  layer.addChild(filterRoot);
  filterRoot.setPosition(0, L.LOBBY_GALLERY_FILTER_Y, 0);

  const headerRoot = new Node('GalleryHeader');
  layer.addChild(headerRoot);
  createGalleryTableHeader(headerRoot);

  const viewport = new Node('GalleryScrollView');
  layer.addChild(viewport);
  viewport.setPosition(0, L.LOBBY_GALLERY_SCROLL_CENTER_Y, 0);
  const viewTf = viewport.addComponent(UITransform);
  viewTf.setContentSize(L.LOBBY_GALLERY_TABLE_W, L.LOBBY_GALLERY_SCROLL_H);

  const clipG = viewport.addComponent(Graphics);
  clipG.fillColor = toColor({ r: 0, g: 0, b: 0, a: 1 });
  clipG.rect(-L.LOBBY_GALLERY_TABLE_W / 2, -L.LOBBY_GALLERY_SCROLL_H / 2, L.LOBBY_GALLERY_TABLE_W, L.LOBBY_GALLERY_SCROLL_H);
  clipG.fill();
  const mask = viewport.addComponent(Mask);
  mask.type = Mask.Type.GRAPHICS_RECT;

  const scrollContent = new Node('GalleryScrollContent');
  viewport.addChild(scrollContent);
  const contentTf = scrollContent.addComponent(UITransform);
  contentTf.setAnchorPoint(0.5, 1);
  contentTf.setContentSize(L.LOBBY_GALLERY_TABLE_W, L.LOBBY_GALLERY_TABLE_ROW_H);
  scrollContent.setPosition(0, L.LOBBY_GALLERY_SCROLL_H / 2, 0);

  const scrollView = viewport.addComponent(ScrollView);
  scrollView.content = scrollContent;
  scrollView.vertical = true;
  scrollView.horizontal = false;
  scrollView.inertia = true;
  scrollView.brake = 0.75;
  scrollView.elastic = true;
  scrollView.cancelInnerEvents = true;

  const countHint = mkLabel(layer, 'GalleryCountHint', '', 0, L.LOBBY_GALLERY_COUNT_Y, 16, COL.textDim, 360);
  countHint.color = toCcColor(COL.textDim);

  createLobbyBack(layer, onBack, host);
  return { filterRoot, scrollContent, scrollView, countHint };
}

/** 更新滚动区域内容高度 */
export function updateGalleryScrollHeight(content: Node, rowCount: number): void {
  const h = Math.max(rowCount * L.LOBBY_GALLERY_TABLE_ROW_H, L.LOBBY_GALLERY_TABLE_ROW_H);
  content.getComponent(UITransform)!.setContentSize(L.LOBBY_GALLERY_TABLE_W, h);
}

/** 兵种筛选 Tab */
export function rebuildGalleryFilters(
  root: Node,
  active: TroopFilterId,
  onSelect: (id: TroopFilterId) => void,
  host: Component,
): void {
  root.destroyAllChildren();
  const tabW = 96;
  const gap = 8;
  const totalW = TROOP_FILTER_TABS.length * tabW + (TROOP_FILTER_TABS.length - 1) * gap;
  const startX = -totalW / 2 + tabW / 2;
  TROOP_FILTER_TABS.forEach((tab, i) => {
    const x = startX + i * (tabW + gap);
    const node = new Node(`Filter_${tab.id}`);
    root.addChild(node);
    node.setPosition(x, 0, 0);
    node.addComponent(UITransform).setContentSize(tabW, 36);
    const g = node.addComponent(Graphics);
    const sel = tab.id === active;
    drawPanel(
      g,
      tabW,
      36,
      toColor(sel ? { r: 48, g: 38, b: 22, a: 230 } : { r: 24, g: 26, b: 34, a: 210 }),
      toColor(sel ? COL.borderGold : COL.borderGoldDim),
      6,
    );
    const lb = mkLabel(node, 'Label', tab.label, 0, 0, 16, sel ? COL.menuGold : COL.menuText, tabW - 8);
    lb.enableOutline = false;
    node.addComponent(Button);
    node.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      onSelect(tab.id);
    }, host);
  });
}

/** 表格表头（固定，不随列表滚动） */
export function createGalleryTableHeader(parent: Node): void {
  const header = new Node('TableHeader');
  parent.addChild(header);
  header.setPosition(0, L.LOBBY_GALLERY_TABLE_HEADER_Y, 0);
  header.addComponent(UITransform).setContentSize(L.LOBBY_GALLERY_TABLE_W, L.LOBBY_GALLERY_TABLE_ROW_H);
  const g = header.addComponent(Graphics);
  drawPanel(
    g,
    L.LOBBY_GALLERY_TABLE_W,
    L.LOBBY_GALLERY_TABLE_ROW_H,
    toColor({ r: 28, g: 32, b: 44, a: 240 }),
    toColor(COL.borderGold),
    4,
  );
  for (const col of TABLE_COLS) {
    const lb = mkLabel(
      header,
      `H_${col.label}`,
      col.label,
      col.left + col.w / 2,
      0,
      14,
      COL.menuGold,
      col.w,
      col.align,
    );
    lb.enableOutline = false;
  }
}

function cellText(g: GalleryGeneral, colIndex: number): string {
  switch (colIndex) {
    case 0: return g.name;
    case 1: return g.faction;
    case 2: return `${g.leadership}`;
    case 3: return `${g.force}`;
    case 4: return `${g.intelligence}`;
    case 5: return `${g.politics}`;
    case 6: return `${g.charm}`;
    default: return '';
  }
}

/** 表格数据行（置于 scrollContent 内，local Y 自上而下） */
export function createGalleryTableRow(
  parent: Node,
  g: GalleryGeneral,
  rowIndex: number,
  onClick: () => void,
  host: Component,
): Node {
  const y = galleryScrollRowY(rowIndex);
  const node = new Node(`Row_${g.id}`);
  parent.addChild(node);
  node.setPosition(0, y, 0);
  node.addComponent(UITransform).setContentSize(L.LOBBY_GALLERY_TABLE_W, L.LOBBY_GALLERY_TABLE_ROW_H);

  const gph = node.addComponent(Graphics);
  const stripe = rowIndex % 2 === 0;
  drawPanel(
    gph,
    L.LOBBY_GALLERY_TABLE_W,
    L.LOBBY_GALLERY_TABLE_ROW_H,
    toColor(stripe ? { r: 20, g: 24, b: 34, a: 220 } : { r: 16, g: 20, b: 30, a: 220 }),
    toColor(COL.borderGoldDim),
    2,
  );

  TABLE_COLS.forEach((col, i) => {
    const lb = mkLabel(
      node,
      `C_${i}`,
      cellText(g, i),
      col.left + col.w / 2,
      0,
      14,
      COL.menuText,
      col.w,
      col.align,
    );
    lb.enableOutline = false;
  });

  node.addComponent(Button);
  node.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    onClick();
  }, host);
  return node;
}

export type GalleryDetailRefs = {
  root: Node;
  title: Label;
  portraitSlot: Node;
  stats: Label;
  adapt: Label;
  bio: Label;
};

/** 武将详情弹层 */
export function buildGalleryDetailPanel(parent: Node, onClose: () => void, host: Component): GalleryDetailRefs {
  const root = new Node('GalleryDetail');
  parent.addChild(root);
  root.addComponent(UITransform).setContentSize(L.W, L.H);
  root.addComponent(BlockInputEvents);
  root.active = false;

  const dim = new Node('Dim');
  root.addChild(dim);
  dim.addComponent(UITransform).setContentSize(L.W, L.H);
  const dg = dim.addComponent(Graphics);
  dg.fillColor = toColor({ r: 0, g: 0, b: 0, a: 190 });
  dg.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  dg.fill();

  const card = new Node('DetailCard');
  root.addChild(card);
  card.addComponent(UITransform).setContentSize(L.LOBBY_GALLERY_DETAIL_W, L.LOBBY_GALLERY_DETAIL_H);
  drawPanel(
    card.addComponent(Graphics),
    L.LOBBY_GALLERY_DETAIL_W,
    L.LOBBY_GALLERY_DETAIL_H,
    toColor({ r: 22, g: 24, b: 32, a: 250 }),
    toColor(COL.borderGold),
    10,
  );

  const title = mkLabel(card, 'DetailTitle', '', 0, L.LOBBY_GALLERY_DETAIL_H / 2 - 48, 28, COL.menuGold, 600);
  applyLobbyTypography(title, 'title');
  title.fontSize = 30;

  const portraitSlot = new Node('DetailPortrait');
  card.addChild(portraitSlot);
  portraitSlot.setPosition(-140, L.LOBBY_GALLERY_DETAIL_PORTRAIT_Y, 0);
  portraitSlot.addComponent(UITransform).setContentSize(L.LOBBY_GALLERY_DETAIL_PORTRAIT_W, L.LOBBY_GALLERY_DETAIL_PORTRAIT_H);

  const stats = mkLabel(card, 'DetailStats', '', 150, 180, 17, COL.menuText, 300);
  stats.horizontalAlign = Label.HorizontalAlign.LEFT;
  stats.overflow = Label.Overflow.RESIZE_HEIGHT;
  stats.getComponent(UITransform)!.setContentSize(300, 200);

  const adapt = mkLabel(card, 'DetailAdapt', '', 150, 20, 16, COL.menuGold, 300);
  adapt.horizontalAlign = Label.HorizontalAlign.LEFT;
  adapt.overflow = Label.Overflow.RESIZE_HEIGHT;
  adapt.getComponent(UITransform)!.setContentSize(300, 120);

  const bio = mkLabel(card, 'DetailBio', '', 0, -220, 16, COL.menuText, L.LOBBY_GALLERY_DETAIL_W - 48);
  bio.horizontalAlign = Label.HorizontalAlign.LEFT;
  bio.overflow = Label.Overflow.RESIZE_HEIGHT;
  bio.getComponent(UITransform)!.setContentSize(L.LOBBY_GALLERY_DETAIL_W - 48, 360);

  const closeBtn = new Node('DetailClose');
  card.addChild(closeBtn);
  closeBtn.setPosition(L.LOBBY_GALLERY_DETAIL_W / 2 - 48, L.LOBBY_GALLERY_DETAIL_H / 2 - 48, 0);
  closeBtn.addComponent(UITransform).setContentSize(72, 36);
  drawPanel(closeBtn.addComponent(Graphics), 72, 36, toColor(COL.btn), toColor(COL.borderGoldDim), 6);
  mkLabel(closeBtn, 'Label', '关闭', 0, 0, 16, COL.menuText, 72);
  closeBtn.addComponent(Button);
  closeBtn.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    onClose();
  }, host);

  return { root, title, portraitSlot, stats, adapt, bio };
}

export function fillGalleryDetail(refs: GalleryDetailRefs, g: GalleryGeneral): void {
  refs.title.string = `${g.name} · ${g.epithet}　${g.grade}`;
  refs.portraitSlot.destroyAllChildren();
  createGalleryDetailPortrait(refs.portraitSlot, g.id, g.name);
  refs.stats.string =
    `势力 ${g.faction}　资质 ${g.aptitude}　${'★'.repeat(g.stars)}\n` +
    `统 ${g.leadership}　武 ${g.force}　智 ${g.intelligence}\n` +
    `政 ${g.politics}　魅 ${g.charm}\n` +
    `主兵种 ${TROOP_BADGE[g.troop]}　战法 ${g.skill}`;
  refs.adapt.string = `兵种适性（战略版）\n${formatTroopAdaptLine(g.adapt)}`;
  refs.bio.string = `── 列传 ──\n${g.bio}`;
}
