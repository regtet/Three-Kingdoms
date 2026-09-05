/**
 * @deprecated LEGACY — 复刻期禁止在此加功能。
 * 新 UI 请写 `assets/scripts/remake/`（见 `.cursor/rules/remake-architecture.mdc`）。
 * 本文件仅作旧实现参考，地图/行动复刻完成后删除。
 */
import {
  _decorator,
  Component,
  Node,
  Label,
  Button,
  Color,
  UITransform,
  Vec3,
  BlockInputEvents,
  Graphics,
  tween,
  game,
  sys,
} from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import { ALL_SCENARIOS, getMapLayout } from '../core/data/scenarios/index';
import type { ScenarioCityDef, ScenarioData } from '../core/models/types';
import type { BattleResult, City, GameState, General } from '../core/models/types';
import { findCity } from '../core/utils/helpers';
import { getCityStateView } from '../core/utils/cityState';
import { getFactionGoldTotal, getFactionFoodTotal } from '../core/systems/diplomacy';
import { isGeneralOnEnvoy } from '../core/systems/envoy';
import { isGeneralTransporting } from '../core/systems/transport';
import { COL, CMD_CATEGORIES, L, mapScenarioCoord, CAT_COL, categoryUsesGeneralPicker } from './OfficialLayout';
import { audioManager } from './AudioManager';
import { MAX_SAVE_SLOTS } from '../core/systems/save';
import {
  buildGalleryDetailPanel,
  buildGalleryListShell,
  createGalleryTableRow,
  fillGalleryDetail,
  rebuildGalleryFilters,
  updateGalleryScrollHeight,
  type GalleryDetailRefs,
} from './GeneralGalleryUi';
import { preloadPortraits } from './PortraitLoader';
import { applyMenuBackground, preloadMenuBackgrounds } from './MenuBackground';
import { applyMenuLogo, applyWebFavicon, preloadBrandAssets } from './BrandAssets';
import { getMenuBackgroundLabel, MENU_BACKGROUNDS, nextMenuBackgroundId, normalizeMenuBackgroundId } from '../core/data/menuBackgrounds';
import { getGameIconLabel, nextGameIconId } from '../core/data/gameIcons';
import { getScenarioMeta } from '../core/data/scenarioMeta';
import { buildGalleryCatalog, filterGalleryByTroop, type GalleryGeneral, type TroopFilterId } from '../core/data/generalCatalog';
import { hasAnySave } from '../core/systems/save';
import { formatSaveSlotMenuLine, formatSaveSlotSubline, peekSaveSummary } from '../core/systems/saveSummary';
import { applyLobbyTypography, createLobbyBack, createLobbyTitle, createTextMenuItem } from './LobbyUi';
import {
  buildLobbyPageShell,
  createLobbyBody,
  createLobbyNavPair,
  createLobbyPageHint,
  createLobbySettingRow,
  updateTextMenuLabel,
} from './LobbyScreens';
import { buildFactionLegend, refreshNeighborHighlights } from './MapVisual';
import { refreshStrategicMapLayer } from './StrategicMap';
import { buildGeneralEditorPanel } from './GeneralEditor';
import { playIntroVideo } from './IntroVideo';
import { getLobbyLayerSize } from './ScreenAdapt';
import { UIManager, MODAL_CONFIRM, MODAL_DEPLOY, MODAL_INTEL, MODAL_DIP } from './UIManager';
import { ScreenNavigator, type GameScreen } from './ScreenNavigator';
import { onGameStateChange } from '../core/event/GameEventBus';
import {
  buildCategoryButtons as buildMapCategoryButtons,
  type MapSubPanelHost,
} from './MapSubPanelCommands';
import {
  clearDeployExtras as clearDeployExtrasCmd,
  openDeployPanel,
  type DeployPanelHost,
} from './DeployPanelCommands';
import {
  closeBattleReport,
  launchAttack as launchAttackFlow,
  type BattleFlowHost,
} from './BattleFlowCommands';
import {
  openDipPanel as openDipPanelCmd,
  openIntelPanel as openIntelPanelCmd,
  showIntelForCity as showIntelForCityCmd,
  type MapReportHost,
} from './MapReportCommands';
import {
  doEndTurn as doEndTurnCmd,
  onEndTurn as onEndTurnCmd,
  showConfirm as showConfirmCmd,
  showEndScreen as showEndScreenCmd,
  type EndTurnHost,
} from './EndTurnCommands';
import {
  buildCityStatusPanel,
  buildGeneralInfoContent,
  buildGeneralListRow,
  buildOfficialFooter,
  refreshCityStatusPanel,
} from './OfficialPanels';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type GameSettings } from './GameSettings';
import {
  drawButton,
  drawCategoryButton,
  drawCityMarker,
  drawMapGrid,
  drawModalFrame,
  drawPanel,
  drawSidebarButton,
  drawTitleBar,
  ensureToastBg,
  hexToColor,
  toColor,
} from './UiDraw';

type CmdCategory = (typeof CMD_CATEGORIES)[number];
type ColorLike = { r: number; g: number; b: number; a: number };

const { ccclass } = _decorator;

const TUTORIAL_KEY = 'tk_tutorial_seen';
/** 改 UI 后看主菜单副标题是否为此版本，否则说明 Cocos 未加载最新脚本 */
const UI_BUILD_TAG = 'UI-v1.9.17';

type Screen = GameScreen;
@ccclass('GameRoot')
export class GameRoot extends Component {
  private screen: Screen = 'menu';
  private selectedCityId: string | null = null;
  private deployFromCityId: string | null = null;
  private deployGeneralId: string | null = null;
  private deploySecondaryId: string | null = null;
  private deployTroopRatio = 0.7;
  private deployUseAmbush = false;
  private deployTryDuel = false;
  private subGeneralId: string | null = null;
  private activeCategory: CmdCategory | null = null;
  private selectedScenario: ScenarioData = ALL_SCENARIOS[0];
  private gameSettings: GameSettings = { ...DEFAULT_SETTINGS };
  private settingsReturn: Screen = 'menu';

  private root!: Node;
  private menuLayer!: Node;
  private menuItemsContainer!: Node;
  private menuBgFallback!: Node;
  private menuTitleFallback!: Node;
  private saveListLayer!: Node;
  private saveListBtnContainer!: Node;
  private scenarioDetailLayer!: Node;
  private scenarioDetailBody!: Label;
  private generalGalleryLayer!: Node;
  private galleryGenerals: GalleryGeneral[] = [];
  private galleryFilter: TroopFilterId = 'all';
  private galleryFilterRoot!: Node;
  private galleryScrollContent!: Node;
  private galleryScrollView!: import('cc').ScrollView;
  private galleryCountHint!: Label;
  private galleryDetail!: GalleryDetailRefs;
  private backgroundGalleryLayer!: Node;
  private backgroundGalleryLabel!: Label;
  private backgroundGalleryHint!: Label;
  private galleryBgIndex = 0;
  private scenarioLayer!: Node;
  private factionLayer!: Node;
  private settingsLayer!: Node;
  private factionBtnContainer!: Node;
  private mapLayer!: Node;
  private subPanel!: Node;
  private subBtnContainer!: Node;
  private subFooter!: Node;
  private deployPanel!: Node;
  private deployPortraitSlot!: Node;
  private battlePanel!: Node;
  private logPanel!: Node;
  private funcPanel!: Node;
  private statsPanel!: Node;
  private tutorialPanel!: Node;
  private slotPickerPanel!: Node;
  private slotBtnContainer!: Node;
  private subLogBtn!: Node;
  private intelPanel!: Node;
  private dipPanel!: Node;
  private confirmPanel!: Node;
  private monthBanner!: Node;
  private endLayer!: Node;
  private mapContainer!: Node;
  private uiManager!: UIManager;
  private screenNavigator!: ScreenNavigator;
  private mapHighlightLayer!: Node;
  private mapLegendNode: Node | null = null;
  private cityStatusPanel!: Node;
  private genInfoPanel!: Node;
  private genInfoBody!: Node;
  private genInfoFooter!: Node;
  private genInfoHeader!: Label;
  private intelCityPanel!: Node;
  private mapTerrainNode!: Node;
  private generalEditorPanel!: Node;
  private generalEditorRefresh: ((list: General[]) => void) | null = null;
  private rosterPanel!: Node;

  private hudDate!: Label;
  private hudCityName!: Label;
  private hudTurnBadge!: Label;
  private logLabel!: Label;
  private mapLogBar!: Node;
  private cmdBarNode!: Node;
  private subDimNode!: Node;
  private sidebarBtns: Node[] = [];
  private subTitle!: Label;
  private subInfo!: Label;
  private toastLabel!: Label;
  private toastBg!: Node;
  private mapNodes: Map<string, Node> = new Map();
  private cmdBtns: Map<string, Node> = new Map();
  private mapGridNode!: Node;
  private turnOverlay!: Node;
  private settingsBgmBtn!: Node;
  private settingsSfxBtn!: Node;
  private settingsBgmVolBtn!: Node;
  private settingsSfxVolBtn!: Node;
  private settingsTacticalBtn!: Node;
  private settingsConfirmBtn!: Node;
  private settingsSkipAiBtn!: Node;
  private settingsCutsceneBtn!: Node;
  private settingsMenuBgBtn!: Node;
  private settingsGameIconBtn!: Node;
  private menuBgFallback!: Node;
  private menuTitleFallback!: Node;
  private activeSaveSlot = 0;
  private genPickerSort: 'force' | 'intelligence' | 'loyalty' = 'force';
  private genPickerPage = 0;
  private rosterPage = 0;
  private customRecruitAmount = 100;
  private customTransportGold = 100;
  private customTransportFood = 100;
  private customTransportTroops = 200;
  private stratagemEnemyPage = 0;
  private logScrollOffset = 0;
  private logFullScrollOffset = 0;
  private readonly LOG_BAR_LINES = 1;
  private readonly LOG_FULL_PAGE = 12;

  onLoad() {
    try {
      console.log(`[Three-Kingdoms] ${UI_BUILD_TAG} — 若主菜单未显示此版本号，说明 Cocos 未加载最新脚本`);
      this.gameSettings = loadSettings();
      audioManager.applySettings(this.gameSettings);
      this.root = this.node;
      this.root.addComponent(UITransform).setContentSize(L.W, L.H);
      this.panelBg(this.root, 'RootBg', L.W, L.H, 0, L.BG_COLOR);
      this.buildUI();
      onGameStateChange(() => {
        if (this.screen === 'map' && gameEngine.state) this.refreshMap();
      });
      preloadPortraits(() => {
        if (this.activeCategory && this.selectedCityId && gameEngine.state) {
          const city = findCity(gameEngine.state, this.selectedCityId);
          this.buildCategoryButtons(this.activeCategory, city);
        }
        if (this.screen === 'generalGallery') this.refreshGeneralGallery();
      });
      preloadMenuBackgrounds(() => this.refreshMenuBackground());
      preloadBrandAssets(() => this.refreshMenuLayers());
      playIntroVideo(this.root, () => {
        this.showScreen('menu');
      });
      console.log('[GameRoot] 等待开场视频…');
    } catch (e) {
      console.error('[GameRoot] 启动失败:', e);
    }
  }

  // ── 构建 ──

  private buildUI() {
    this.menuLayer = this.layer('MenuLayer');
    this.scenarioLayer = this.layer('ScenarioLayer');
    this.factionLayer = this.layer('FactionLayer');
    this.settingsLayer = this.layer('SettingsLayer');
    this.mapLayer = this.layer('MapLayer', false);
    this.subPanel = new Node('SubPanel');
    this.subPanel.addComponent(UITransform).setContentSize(L.W, L.SUB_PANEL_H);
    this.subPanel.addComponent(BlockInputEvents);
    this.subPanel.active = false;
    this.subPanel.setPosition(0, L.SUB_PANEL_Y, 0);
    this.mapLayer.addChild(this.subPanel);
    this.deployPanel = this.layer('DeployPanel', false);
    this.battlePanel = this.layer('BattlePanel', false);
    this.endLayer = this.layer('EndLayer');

    this.buildMenu();
    this.buildSaveList();
    this.buildScenarioSelect();
    this.buildScenarioDetail();
    this.buildFactionSelect();
    this.buildGeneralGallery();
    this.buildBackgroundGallery();
    this.buildSettings();
    this.buildMapScreen();
    this.buildSubPanel();
    this.buildSlotPickerPanel();
    this.buildDeployPanel();
    this.buildBattlePanel();
    this.buildLogPanel();
    this.buildFuncPanel();
    this.buildStatsPanel();
    this.buildTutorialPanel();
    this.buildIntelPanel();
    this.buildDipPanel();
    this.buildConfirmPanel();
    this.buildMonthBanner();
    this.buildGenInfoPanel();
    this.buildGeneralEditor();
    this.buildRosterPanel();
    this.buildEndLayer();
    this.buildTurnOverlay();

    this.toastLabel = this.label(this.root, 'Toast', '', 20, new Vec3(0, L.TOAST_Y, 0), 680);
    this.toastLabel.color = this.c(COL.textGold);
    this.toastLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.toastBg = ensureToastBg(this.root, this.toastLabel);
    this.initScreenNavigator();
  }

  private initScreenNavigator() {
    this.screenNavigator = new ScreenNavigator(
      {
        menu: this.menuLayer,
        saveList: this.saveListLayer,
        scenario: this.scenarioLayer,
        scenarioDetail: this.scenarioDetailLayer,
        faction: this.factionLayer,
        generalGallery: this.generalGalleryLayer,
        backgroundGallery: this.backgroundGalleryLayer,
        settings: this.settingsLayer,
        map: this.mapLayer,
        end: this.endLayer,
      },
      (s) => this.onScreenShow(s),
    );
  }

  private layer(name: string, block = true): Node {
    const n = new Node(name);
    const { width, height } = getLobbyLayerSize();
    n.addComponent(UITransform).setContentSize(width, height);
    if (block) n.addComponent(BlockInputEvents);
    this.root.addChild(n);
    n.active = false;
    return n;
  }

  private panelBg(parent: Node, name: string, w: number, h: number, y: number, col: ColorLike = COL.panelBg, border: ColorLike = COL.borderGold): Node {
    const n = new Node(name);
    parent.addChild(n);
    n.setPosition(0, y, 0);
    n.addComponent(UITransform).setContentSize(w, h);
    const g = n.addComponent(Graphics);
    drawPanel(g, w, h, toColor(col), toColor(border));
    return n;
  }

  private label(parent: Node, name: string, text: string, size: number, pos: Vec3, w = 680, clip = false): Label {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(pos);
    const h = clip ? size * 4 + 8 : size + 16;
    node.addComponent(UITransform).setContentSize(w, h);
    const lb = node.addComponent(Label);
    lb.string = text;
    lb.fontSize = size;
    lb.lineHeight = size + 4;
    lb.overflow = clip ? Label.Overflow.CLAMP : Label.Overflow.RESIZE_HEIGHT;
    lb.color = this.c(COL.text);
    return lb;
  }

  private btn(
    parent: Node,
    name: string,
    text: string,
    pos: Vec3,
    cb: () => void,
    w = 120,
    h: number = L.CMD_BTN_H,
    highlight = false,
    danger = false,
    catColor?: { r: number; g: number; b: number; a: number },
  ): Node {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(pos);
    node.addComponent(UITransform).setContentSize(w, h);
    const g = node.addComponent(Graphics);
    if (catColor !== undefined) {
      drawSidebarButton(g, w, h, highlight);
    } else {
      drawButton(g, w, h, highlight, danger);
    }
    const fontSize = text.length > 8 ? 16 : 18;
    const lb = this.label(node, 'Label', text, fontSize, new Vec3(0, 0, 0), w - 8);
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
    lb.overflow = Label.Overflow.SHRINK;
    node.addComponent(Button);
    node.on(Button.EventType.CLICK, () => { audioManager.playClick(); cb(); }, this);
    return node;
  }

  private c(col: { r: number; g: number; b: number; a: number }) {
    return new Color(col.r, col.g, col.b, col.a);
  }

  private buildMenu() {
    const { width: lobbyW, height: lobbyH } = getLobbyLayerSize();
    this.menuBgFallback = this.panelBg(this.menuLayer, 'Bg', lobbyW, lobbyH, 0, COL.mapBg, { r: 0, g: 0, b: 0, a: 0 });

    this.menuTitleFallback = new Node('MenuTitleFallback');
    this.menuLayer.addChild(this.menuTitleFallback);
    const title = this.label(this.menuTitleFallback, 'Title', '三国志 · 天下争锋', 40, new Vec3(0, L.MENU_TITLE_Y, 0), 680);
    applyLobbyTypography(title, 'title');
    title.string = '三国志 · 天下争锋';

    const ver = this.label(this.menuLayer, 'BuildTag', UI_BUILD_TAG, 14, new Vec3(L.MENU_BUILD_TAG_X, L.MENU_BUILD_TAG_Y, 0), 120);
    ver.color = this.c(COL.textDim);
    ver.horizontalAlign = Label.HorizontalAlign.RIGHT;

    this.menuItemsContainer = new Node('MenuItems');
    this.menuLayer.addChild(this.menuItemsContainer);
    this.refreshMainMenuItems();
  }

  private refreshMainMenuItems() {
    this.menuItemsContainer.destroyAllChildren();
    type MenuDef = { id: string; text: string; y: number; action: () => void; show?: () => boolean };
    const gap = L.MENU_ITEM_GAP;
    const startY = L.MENU_ITEMS_START_Y;
    const defs: MenuDef[] = [
      { id: 'new', text: '新游戏', y: startY, action: () => this.showScreen('scenario') },
      { id: 'load', text: '加载游戏', y: startY - gap, action: () => this.showScreen('saveList'), show: () => hasAnySave() },
      { id: 'generals', text: '武将图鉴', y: startY - gap * 2, action: () => this.openGeneralGallery() },
      { id: 'backgrounds', text: '背景图鉴', y: startY - gap * 3, action: () => this.openBackgroundGallery() },
      { id: 'settings', text: '设置', y: startY - gap * 4, action: () => { this.settingsReturn = 'menu'; this.refreshSettingsUI(); this.showScreen('settings'); } },
      { id: 'exit', text: '退出游戏', y: startY - gap * 4 - L.MENU_ITEM_EXIT_GAP, action: () => this.exitGame() },
    ];
    for (const d of defs) {
      if (d.show && !d.show()) continue;
      createTextMenuItem(this.menuItemsContainer, d.id, d.text, d.y, d.action, this);
    }
  }

  private exitGame() {
    if (sys.isNative) {
      game.end();
      return;
    }
    this.toast('Web 预览无法退出，请关闭浏览器标签');
  }

  private applyLobbyBackground(layer: Node, fallback?: Node) {
    const ok = applyMenuBackground(layer, this.gameSettings.menuBackgroundId);
    if (fallback) fallback.active = !ok;
  }

  private saveListSubtitle!: Label;

  private buildSaveList() {
    this.saveListLayer = this.layer('SaveListLayer');
    const shell = buildLobbyPageShell(
      this.saveListLayer,
      '加载游戏',
      '选择存档继续征程',
      () => this.showScreen('menu'),
      this,
    );
    this.saveListSubtitle = shell.subtitleLabel;
    this.saveListBtnContainer = new Node('SaveBtns');
    this.saveListLayer.addChild(this.saveListBtnContainer);
  }

  private refreshSaveList() {
    this.saveListBtnContainer.destroyAllChildren();
    let row = 0;
    let count = 0;
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const detail = peekSaveSummary(i);
      if (!detail) continue;
      count++;
      const y = L.LOBBY_LIST_START_Y - row * (L.LOBBY_LIST_GAP + 8);
      const text = `${formatSaveSlotMenuLine(i, detail)}\n${formatSaveSlotSubline(detail)}`;
      createTextMenuItem(this.saveListBtnContainer, `Save_${i}`, text, y, () => {
        if (gameEngine.loadGameFromSlot(i)) {
          this.activeSaveSlot = i;
          this.showScreen('map');
          this.refreshMap();
        } else {
          this.toast('读取失败');
        }
      }, this, L.LOBBY_BODY_W);
      row++;
    }
    this.saveListSubtitle.string = count > 0 ? `共 ${count} 个存档` : '暂无存档';
    if (count === 0) {
      createLobbyBody(this.saveListBtnContainer, 'Empty', L.LOBBY_LIST_START_Y, L.LOBBY_BODY_W).string =
        '尚无保存的进度\n请先开始新游戏';
    }
  }

  private buildScenarioDetail() {
    this.scenarioDetailLayer = this.layer('ScenarioDetailLayer');
    buildLobbyPageShell(
      this.scenarioDetailLayer,
      '剧本详情',
      '确认史段后选择势力',
      () => this.showScreen('scenario'),
      this,
    );
    this.scenarioDetailTitle = this.scenarioDetailLayer.getChildByName('LobbyTitle')!.getComponent(Label)!;
    this.scenarioDetailBody = createLobbyBody(this.scenarioDetailLayer, 'Body', L.LOBBY_BODY_Y, L.LOBBY_BODY_W, 17);
    this.scenarioDetailStats = createLobbyBody(this.scenarioDetailLayer, 'Stats', L.LOBBY_DETAIL_STATS_Y, L.LOBBY_BODY_W, 16);
    this.scenarioDetailStats.color = this.c(COL.menuGold);
    createTextMenuItem(this.scenarioDetailLayer, 'ToFaction', '选择势力', L.LOBBY_ACTION_Y, () => {
      this.rebuildFactionButtons();
      this.showScreen('faction');
    }, this, 280);
  }

  private scenarioDetailStats!: Label;

  private refreshScenarioDetail() {
    const s = this.selectedScenario;
    const meta = getScenarioMeta(s.id);
    this.scenarioDetailTitle.string = s.name;
    const sub = this.scenarioDetailLayer.getChildByName('LobbySubtitle')?.getComponent(Label);
    if (sub) sub.string = meta.summary;
    this.scenarioDetailBody.string = meta.detail;
    const cityN = s.cities.length;
    const genN = s.generals.length;
    const wildN = s.wildGenerals?.length ?? 0;
    this.scenarioDetailStats.string =
      `初始 ${cityN} 城 · ${genN} 将${wildN > 0 ? ` · 在野 ${wildN} 人` : ''}\n${meta.recommend ?? ''}`;
  }

  private buildGeneralGallery() {
    this.galleryGenerals = buildGalleryCatalog();
    this.generalGalleryLayer = this.layer('GeneralGalleryLayer');
    const shell = buildGalleryListShell(this.generalGalleryLayer, () => this.showScreen('menu'), this);
    this.galleryFilterRoot = shell.filterRoot;
    this.galleryScrollContent = shell.scrollContent;
    this.galleryScrollView = shell.scrollView;
    this.galleryCountHint = shell.countHint;
    this.galleryDetail = buildGalleryDetailPanel(this.generalGalleryLayer, () => this.closeGalleryDetail(), this);
  }

  private openGeneralGallery() {
    this.galleryFilter = 'all';
    this.closeGalleryDetail();
    this.refreshGeneralGallery();
    this.showScreen('generalGallery');
  }

  private closeGalleryDetail() {
    this.galleryDetail.root.active = false;
  }

  private openGalleryDetail(g: GalleryGeneral) {
    fillGalleryDetail(this.galleryDetail, g);
    this.galleryDetail.root.active = true;
    this.galleryDetail.root.setSiblingIndex(this.generalGalleryLayer.children.length - 1);
  }

  private getFilteredGallery(): GalleryGeneral[] {
    return filterGalleryByTroop(this.galleryGenerals, this.galleryFilter);
  }

  private setGalleryFilter(filter: TroopFilterId) {
    this.galleryFilter = filter;
    this.refreshGeneralGallery();
  }

  private refreshGeneralGallery() {
    rebuildGalleryFilters(this.galleryFilterRoot, this.galleryFilter, (id) => this.setGalleryFilter(id), this);
    this.refreshGeneralGalleryGrid();
  }

  private refreshGeneralGalleryGrid() {
    const list = this.getFilteredGallery();

    this.galleryScrollContent.destroyAllChildren();
    list.forEach((g, i) => {
      createGalleryTableRow(this.galleryScrollContent, g, i, () => this.openGalleryDetail(g), this);
    });
    updateGalleryScrollHeight(this.galleryScrollContent, list.length);
    this.galleryScrollView.scrollToTop(0.1);

    this.galleryCountHint.string =
      list.length > 0
        ? `${this.galleryFilter === 'all' ? '共' : '筛选'} ${list.length} 位 · 上下滑动浏览`
        : '该兵种暂无武将';
  }

  private buildBackgroundGallery() {
    this.backgroundGalleryLayer = this.layer('BackgroundGalleryLayer');
    buildLobbyPageShell(
      this.backgroundGalleryLayer,
      '背景图鉴',
      '预览并设为主菜单背景',
      () => this.showScreen('menu'),
      this,
    );
    this.backgroundGalleryLabel = createLobbyBody(this.backgroundGalleryLayer, 'BgLabel', L.LOBBY_BG_LABEL_Y, L.LOBBY_BODY_W, 22);
    applyLobbyTypography(this.backgroundGalleryLabel, 'title');
    this.backgroundGalleryLabel.fontSize = 24;
    this.backgroundGalleryHint = createLobbyPageHint(this.backgroundGalleryLayer, L.LOBBY_BG_LABEL_Y - 36);
    createLobbyNavPair(
      this.backgroundGalleryLayer,
      L.LOBBY_BG_NAV_Y,
      () => this.stepBgGallery(-1),
      () => this.stepBgGallery(1),
      this,
      '◀ 上一张',
      '下一张 ▶',
    );
    createTextMenuItem(this.backgroundGalleryLayer, 'BgApply', '设为主菜单背景', L.LOBBY_BG_ACTION_Y, () => {
      const id = MENU_BACKGROUNDS[this.galleryBgIndex]?.id;
      if (!id) return;
      this.gameSettings.menuBackgroundId = id;
      this.persistSettings();
      this.refreshMenuBackground();
      this.applyLobbyBackground(this.backgroundGalleryLayer);
      this.toast(`已设为背景：${getMenuBackgroundLabel(id)}`);
    }, this, 300);
  }

  private openBackgroundGallery() {
    this.galleryBgIndex = MENU_BACKGROUNDS.findIndex((b) => b.id === normalizeMenuBackgroundId(this.gameSettings.menuBackgroundId));
    if (this.galleryBgIndex < 0) this.galleryBgIndex = 0;
    this.refreshBackgroundGallery();
    this.showScreen('backgroundGallery');
  }

  private stepBgGallery(delta: number) {
    this.galleryBgIndex = (this.galleryBgIndex + delta + MENU_BACKGROUNDS.length) % MENU_BACKGROUNDS.length;
    this.refreshBackgroundGallery();
  }

  private refreshBackgroundGallery() {
    const bg = MENU_BACKGROUNDS[this.galleryBgIndex];
    if (!bg) return;
    this.backgroundGalleryLabel.string = bg.label;
    this.backgroundGalleryHint.string = `${this.galleryBgIndex + 1} / ${MENU_BACKGROUNDS.length}`;
    applyMenuBackground(this.backgroundGalleryLayer, bg.id);
  }

  private cycleGameIcon() {
    this.gameSettings.gameIconId = nextGameIconId(this.gameSettings.gameIconId);
    this.persistSettings();
    this.refreshMenuBrand();
    this.refreshSettingsUI();
    this.toast(`图标：${getGameIconLabel(this.gameSettings.gameIconId)}`);
  }

  private refreshMenuBrand() {
    const logoOk = applyMenuLogo(this.menuLayer);
    if (this.menuTitleFallback) this.menuTitleFallback.active = !logoOk;
    applyWebFavicon(this.gameSettings.gameIconId);
    if (!logoOk) console.warn('[GameRoot] Logo 未加载，请确认 resources/brand/logo2.webp 已导入');
  }

  private refreshMenuLayers() {
    this.refreshMenuBackground();
    this.refreshMenuBrand();
    this.refreshMainMenuItems();
  }

  private cycleMenuBackground() {
    this.gameSettings.menuBackgroundId = nextMenuBackgroundId(this.gameSettings.menuBackgroundId);
    this.persistSettings();
    this.refreshMenuBackground();
    this.refreshSettingsUI();
    this.toast(`背景：${getMenuBackgroundLabel(this.gameSettings.menuBackgroundId)}`);
  }

  private refreshMenuBackground() {
    const ok = applyMenuBackground(this.menuLayer, this.gameSettings.menuBackgroundId);
    if (this.menuBgFallback) this.menuBgFallback.active = !ok;
  }

  private openSaveSlotPicker(forNewGame: boolean) {
    this.slotPickerForNew = forNewGame;
    this.slotPickerTitle!.string = forNewGame ? '选择存档槽 · 新游戏' : '选择存档槽 · 继续';
    this.slotPickerHint!.string = forNewGame ? '选择一个槽位开始新战役' : '选择一个槽位读取进度';
    this.rebuildSlotButtons();
    this.slotPickerPanel.active = true;
  }

  private slotPickerForNew = true;
  private slotPickerTitle!: Label;
  private slotPickerHint!: Label;

  private buildSlotPickerPanel() {
    this.slotPickerPanel = this.layer('SlotPickerPanel', false);
    this.panelBg(this.slotPickerPanel, 'Dim', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 180 }, { r: 0, g: 0, b: 0, a: 0 });
    const card = new Node('SlotCard');
    this.slotPickerPanel.addChild(card);
    card.setPosition(0, 0, 0);
    card.addComponent(UITransform).setContentSize(L.SLOT_MODAL_W, L.SLOT_MODAL_H);
    drawModalFrame(card.addComponent(Graphics), L.SLOT_MODAL_W, L.SLOT_MODAL_H);
    const bar = new Node('SlotBar');
    card.addChild(bar);
    bar.setPosition(0, L.SLOT_MODAL_H / 2 - 36, 0);
    bar.addComponent(UITransform).setContentSize(L.SLOT_MODAL_W - 48, 4);
    drawTitleBar(bar.addComponent(Graphics), L.SLOT_MODAL_W - 48, 0);
    this.slotPickerTitle = this.label(card, 'SlotTitle', '', 24, new Vec3(0, L.SLOT_MODAL_H / 2 - 64, 0), 560);
    this.slotPickerTitle.color = this.c(COL.textGold);
    this.slotPickerTitle.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.slotPickerHint = this.label(card, 'SlotHint', '', 14, new Vec3(0, L.SLOT_MODAL_H / 2 - 96, 0), 560);
    this.slotPickerHint.color = this.c(COL.textDim);
    this.slotPickerHint.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.slotBtnContainer = new Node('SlotBtns');
    card.addChild(this.slotBtnContainer);
    this.slotBtnContainer.setPosition(0, 20, 0);
    this.btn(card, 'SlotClose', '返回', new Vec3(0, -L.SLOT_MODAL_H / 2 + 48, 0), () => {
      this.slotPickerPanel.active = false;
    }, 200, 48);
  }

  private rebuildSlotButtons() {
    this.slotBtnContainer.destroyAllChildren();
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const summary = gameEngine.getSaveSummary(i);
      const hasSave = !!summary;
      const label = summary ? `槽 ${i + 1}    ${summary}` : `槽 ${i + 1}    （空）`;
      const y = L.SLOT_BTN_START_Y - i * L.SLOT_BTN_GAP;
      this.btn(this.slotBtnContainer, `Slot_${i}`, label, new Vec3(0, y, 0), () => {
        this.activeSaveSlot = i;
        gameEngine.setSaveSlot(i);
        if (this.slotPickerForNew) {
          this.slotPickerPanel.active = false;
          this.showScreen('scenario');
        } else if (gameEngine.loadGameFromSlot(i)) {
          this.slotPickerPanel.active = false;
          this.showScreen('map');
          this.refreshMap();
        } else {
          this.toast('该槽位无存档');
        }
      }, 540, 56, false, false, hasSave ? COL.btnHighlight : COL.btn);
    }
  }

  private closeSlotPicker() {
    this.slotPickerPanel.active = false;
  }

  private persistSettings() {
    saveSettings(this.gameSettings);
    audioManager.applySettings(this.gameSettings);
  }

  private volLabel(v: number): string {
    if (v <= 0.35) return '低';
    if (v <= 0.65) return '中';
    return '高';
  }

  private cycleVol(current: number): number {
    if (current <= 0.35) return 0.65;
    if (current <= 0.65) return 1;
    return 0.3;
  }

  private refreshSettingsUI() {
    updateTextMenuLabel(this.settingsBgmBtn, `背景音乐 · ${this.gameSettings.bgmEnabled ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsSfxBtn, `音效 · ${this.gameSettings.sfxEnabled ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsBgmVolBtn, `BGM 音量 · ${this.volLabel(this.gameSettings.bgmVolume)}`);
    updateTextMenuLabel(this.settingsSfxVolBtn, `音效音量 · ${this.volLabel(this.gameSettings.sfxVolume)}`);
    updateTextMenuLabel(this.settingsConfirmBtn, `结束确认 · ${this.gameSettings.confirmEndTurn ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsSkipAiBtn, `跳过 AI 遮罩 · ${this.gameSettings.skipAiOverlay ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsCutsceneBtn, `战斗过场 · ${this.gameSettings.battleCutscene ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsTacticalBtn, `战术战 · ${this.gameSettings.tacticalBattle ? '开' : '关'}`);
    updateTextMenuLabel(this.settingsMenuBgBtn, `主菜单背景 · ${getMenuBackgroundLabel(this.gameSettings.menuBackgroundId)}`);
    updateTextMenuLabel(this.settingsGameIconBtn, `游戏图标 · ${getGameIconLabel(this.gameSettings.gameIconId)}`);
  }

  private setBtnLabel(btnNode: Node, text: string) {
    const lb = btnNode.getChildByName('Label')?.getComponent(Label);
    if (lb) lb.string = text;
  }

  private buildSettings() {
    buildLobbyPageShell(
      this.settingsLayer,
      '设置',
      '音频 · 玩法 · 外观',
      () => this.showScreen(this.settingsReturn),
      this,
    );
    const y0 = L.LOBBY_SETTINGS_START_Y;
    const g = L.LOBBY_SETTINGS_GAP;
    this.settingsBgmBtn = createLobbySettingRow(this.settingsLayer, 'SetBgm', '背景音乐 · 开', y0, () => {
      this.gameSettings.bgmEnabled = !this.gameSettings.bgmEnabled;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsSfxBtn = createLobbySettingRow(this.settingsLayer, 'SetSfx', '音效 · 开', y0 - g, () => {
      this.gameSettings.sfxEnabled = !this.gameSettings.sfxEnabled;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsBgmVolBtn = createLobbySettingRow(this.settingsLayer, 'SetBgmVol', 'BGM 音量 · 中', y0 - g * 2, () => {
      this.gameSettings.bgmVolume = this.cycleVol(this.gameSettings.bgmVolume);
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsSfxVolBtn = createLobbySettingRow(this.settingsLayer, 'SetSfxVol', '音效音量 · 高', y0 - g * 3, () => {
      this.gameSettings.sfxVolume = this.cycleVol(this.gameSettings.sfxVolume);
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsConfirmBtn = createLobbySettingRow(this.settingsLayer, 'SetConfirm', '结束确认 · 开', y0 - g * 4, () => {
      this.gameSettings.confirmEndTurn = !this.gameSettings.confirmEndTurn;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsSkipAiBtn = createLobbySettingRow(this.settingsLayer, 'SetSkipAi', '跳过 AI 遮罩 · 关', y0 - g * 5, () => {
      this.gameSettings.skipAiOverlay = !this.gameSettings.skipAiOverlay;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsCutsceneBtn = createLobbySettingRow(this.settingsLayer, 'SetCutscene', '战斗过场 · 开', y0 - g * 6, () => {
      this.gameSettings.battleCutscene = !this.gameSettings.battleCutscene;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsTacticalBtn = createLobbySettingRow(this.settingsLayer, 'SetTactical', '战术战 · 开', y0 - g * 7, () => {
      this.gameSettings.tacticalBattle = !this.gameSettings.tacticalBattle;
      this.persistSettings();
      this.refreshSettingsUI();
    }, this);
    this.settingsMenuBgBtn = createLobbySettingRow(this.settingsLayer, 'SetMenuBg', '主菜单背景', y0 - g * 8, () => {
      this.cycleMenuBackground();
    }, this);
    this.settingsGameIconBtn = createLobbySettingRow(this.settingsLayer, 'SetGameIcon', '游戏图标', y0 - g * 9, () => {
      this.cycleGameIcon();
    }, this);
    createLobbySettingRow(this.settingsLayer, 'SettingsEditor', '武将编辑', L.LOBBY_SETTINGS_EXTRA_Y, () => {
      this.openGeneralEditor();
    }, this);
    createLobbySettingRow(this.settingsLayer, 'ClearSave', '删除当前槽存档', L.LOBBY_SETTINGS_DANGER_Y, () => {
      if (gameEngine.hasSaveInSlot(gameEngine.getSaveSlot())) {
        gameEngine.clearSaveSlot(gameEngine.getSaveSlot());
        this.toast(`槽 ${gameEngine.getSaveSlot() + 1} 存档已删除`);
        audioManager.playSuccess();
      } else {
        this.toast('当前槽没有存档');
      }
    }, this);
  }

  private buildTurnOverlay() {
    this.turnOverlay = new Node('TurnOverlay');
    this.root.addChild(this.turnOverlay);
    this.turnOverlay.addComponent(UITransform).setContentSize(L.W, L.H);
    this.turnOverlay.addComponent(BlockInputEvents);
    const bg = new Node('TurnOverlayBg');
    this.turnOverlay.addChild(bg);
    bg.addComponent(UITransform).setContentSize(L.W, L.H);
    const g = bg.addComponent(Graphics);
    g.fillColor = toColor({ r: 0, g: 0, b: 0, a: 180 });
    g.rect(-L.W / 2, -L.H / 2, L.W, L.H);
    g.fill();
    const txt = this.label(this.turnOverlay, 'TurnText', '电脑回合中…', 28, new Vec3(0, 40, 0), 600);
    txt.color = this.c(COL.textGold);
    txt.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.label(this.turnOverlay, 'TurnSub', 'AI 正在行动', 16, new Vec3(0, 0, 0)).color = this.c(COL.textDim);
    this.turnOverlay.active = false;
  }

  private buildScenarioSelect() {
    buildLobbyPageShell(
      this.scenarioLayer,
      '选择剧本',
      '择一段历史，开一局新战役',
      () => this.showScreen('menu'),
      this,
    );
    ALL_SCENARIOS.forEach((s, i) => {
      const meta = getScenarioMeta(s.id);
      const text = `${s.name}\n${meta.summary}`;
      createTextMenuItem(
        this.scenarioLayer,
        `Scenario_${s.id}`,
        text,
        L.LOBBY_LIST_START_Y - i * (L.LOBBY_LIST_GAP + 12),
        () => {
          this.selectedScenario = s;
          this.refreshScenarioDetail();
          this.showScreen('scenarioDetail');
        },
        this,
        L.LOBBY_BODY_W,
      );
    });
  }

  private rebuildFactionButtons() {
    this.factionBtnContainer.destroyAllChildren();
    this.activeSaveSlot = gameEngine.getSaveSlot();
    this.selectedScenario.factions.forEach((f, i) => {
      createTextMenuItem(
        this.factionBtnContainer,
        `Faction_${f.id}`,
        `${f.name}　${f.rulerName}`,
        L.LOBBY_LIST_START_Y - i * L.LOBBY_LIST_GAP,
        () => {
          gameEngine.setSaveSlot(this.activeSaveSlot);
          gameEngine.newGame(this.selectedScenario, f.id);
          this.selectedCityId = null;
          this.showScreen('map');
          this.refreshMap();
        },
        this,
        420,
      );
    });
  }

  private buildFactionSelect() {
    buildLobbyPageShell(
      this.factionLayer,
      '选择势力',
      '择君主而事，定天下归属',
      () => this.showScreen('scenarioDetail'),
      this,
    );
    this.factionBtnContainer = new Node('FactionBtns');
    this.factionLayer.addChild(this.factionBtnContainer);
    this.rebuildFactionButtons();
  }

  private buildMapScreen() {
    this.panelBg(this.mapLayer, 'MapBg', L.MAP_W + 32, L.MAP_H + 16, L.MAP_CENTER.y, COL.mapBg);
    this.panelBg(this.mapLayer, 'MapInner', L.MAP_W, L.MAP_H, L.MAP_CENTER.y, COL.mapInner, COL.mapBorder);

    this.mapGridNode = new Node('MapGrid');
    this.mapLayer.addChild(this.mapGridNode);
    this.mapGridNode.setPosition(L.MAP_CENTER.x, L.MAP_CENTER.y, 0);
    this.mapGridNode.addComponent(UITransform).setContentSize(L.MAP_W, L.MAP_H);
    drawMapGrid(this.mapGridNode.addComponent(Graphics), L.MAP_W - 20, L.MAP_H - 20);

    const terrainNode = new Node('MapTerrain');
    this.mapLayer.addChild(terrainNode);
    terrainNode.setPosition(L.MAP_CENTER.x, L.MAP_CENTER.y, 0);
    terrainNode.addComponent(UITransform).setContentSize(L.MAP_W, L.MAP_H);
    this.mapTerrainNode = terrainNode;

    // 官方顶栏
    this.panelBg(this.mapLayer, 'HeaderBar', L.W, L.HEADER_H + 12, L.HEADER_Y, COL.topBar, COL.borderGoldDim);
    this.hudDate = this.label(this.mapLayer, 'HUDDate', '', 16, new Vec3(-280, L.HEADER_Y, 0), 220);
    this.hudDate.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.hudDate.color = this.c(COL.textDim);
    this.hudCityName = this.label(this.mapLayer, 'HUDCityName', '—', 24, new Vec3(0, L.HEADER_Y, 0), 280);
    this.hudCityName.color = this.c(COL.textGold);
    this.hudCityName.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.hudTurnBadge = this.label(this.mapLayer, 'HUDTurn', '', 14, new Vec3(200, L.HEADER_Y, 0), 280);
    this.hudTurnBadge.horizontalAlign = Label.HorizontalAlign.RIGHT;

    // 官方城池状态面板（肖像 + 属性格）
    this.cityStatusPanel = buildCityStatusPanel(this.mapLayer);

    this.mapLogBar = this.panelBg(this.mapLayer, 'LogBar', L.W - 32, L.LOG_H, L.LOG_Y, COL.logBg, COL.borderGoldDim);
    this.cmdBarNode = this.panelBg(this.mapLayer, 'CmdBar', L.W, L.CMD_BAR_H, L.CMD_Y, COL.cmdBar);

    this.subDimNode = new Node('SubDim');
    this.mapLayer.addChild(this.subDimNode);
    this.subDimNode.setPosition(L.MAP_CENTER.x, L.MAP_CENTER.y, 0);
    this.subDimNode.addComponent(UITransform).setContentSize(L.MAP_W, L.MAP_H);
    const dimG = this.subDimNode.addComponent(Graphics);
    dimG.fillColor = toColor({ r: 0, g: 0, b: 0, a: 150 });
    dimG.rect(-L.MAP_W / 2, -L.MAP_H / 2, L.MAP_W, L.MAP_H);
    dimG.fill();
    this.subDimNode.active = false;

    this.logLabel = this.label(this.mapLayer, 'Log', '', 13, new Vec3(-20, L.LOG_Y, 0), 500);
    this.logLabel.color = this.c(COL.textDim);
    this.logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.btn(this.mapLayer, 'LogMore', '日志', new Vec3(300, L.LOG_Y, 0), () => this.openLogPanel(), 56, 32);

    // 官方右侧竖栏
    this.sidebarBtns = [
      this.btn(this.mapLayer, 'SideInfo', '情报', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y1, 0), () => this.openSideIntel(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn),
      this.btn(this.mapLayer, 'SideFunc', '功能', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y2, 0), () => this.openSideFunc(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn),
      this.btn(this.mapLayer, 'SideRoster', '武将', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y3, 0), () => this.openRosterPanel(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn),
      this.btn(this.mapLayer, 'SideGo', '进行', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y4, 0), () => this.onEndTurn(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, true, false, COL.sidebarBtn),
    ];

    CMD_CATEGORIES.forEach((cat, i) => {
      const node = this.btn(
        this.mapLayer,
        `Cmd_${cat}`,
        cat,
        new Vec3(L.CMD_START_X + i * L.CMD_GAP, L.CMD_Y, 0),
        () => this.onCategory(cat),
        L.CMD_BTN_W,
        L.CMD_BTN_H,
      );
      this.cmdBtns.set(cat, node);
    });
    this.refreshCmdHighlight();

    const mapContainer = new Node('MapContainer');
    this.mapLayer.addChild(mapContainer);
    mapContainer.setPosition(new Vec3(L.MAP_CENTER.x, L.MAP_CENTER.y, 0));
    this.mapContainer = mapContainer;

    this.mapHighlightLayer = new Node('MapHighlights');
    mapContainer.addChild(this.mapHighlightLayer);

    for (const c of getMapLayout(this.selectedScenario)) {
      const pos = mapScenarioCoord(c.x, c.y);
      this.mapNodes.set(c.id, this.cityNode(mapContainer, c.id, c.name, pos.x, pos.y));
    }
    this.drawLines(mapContainer, getMapLayout(this.selectedScenario));
    this.initUiManager();
  }

  private initUiManager() {
    this.uiManager = new UIManager({
      mapLayer: this.mapLayer,
      subPanel: this.subPanel,
      subDimNode: this.subDimNode,
      mapLogBar: this.mapLogBar,
      logLabelNode: this.logLabel.node,
      logMoreNode: this.mapLayer.getChildByName('LogMore'),
      cmdBarNode: this.cmdBarNode,
      cmdBtnNodes: [...this.cmdBtns.values()],
      sidebarBtnNodes: this.sidebarBtns,
    });
  }

  private getActiveMapLayout(): ScenarioCityDef[] {
    const id = gameEngine.state?.scenarioId ?? this.selectedScenario.id;
    return getMapLayout(id);
  }

  private openSideIntel() {
    if (this.selectedCityId) {
      this.showIntelForCity(this.selectedCityId);
    } else {
      this.openDipPanel();
    }
  }

  private openSideFunc() {
    this.funcPanel.active = true;
  }

  private buildGenInfoPanel() {
    this.genInfoPanel = this.layer('GenInfoPanel', false);
    this.panelBg(this.genInfoPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('GenFrame');
    this.genInfoPanel.addChild(frame);
    frame.setPosition(0, 60, 0);
    frame.addComponent(UITransform).setContentSize(660, 820);
    drawModalFrame(frame.addComponent(Graphics), 660, 820);
    this.label(this.genInfoPanel, 'GenTitle', '武  将  情  报', 28, new Vec3(0, L.GEN_PANEL_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.genInfoHeader = this.label(this.genInfoPanel, 'GenHeader', '', 14, new Vec3(0, L.GEN_PANEL_TITLE_Y - 36, 0), 620);
    this.genInfoHeader.color = this.c(COL.textDim);
    this.genInfoHeader.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.genInfoBody = new Node('GenInfoBody');
    this.genInfoPanel.addChild(this.genInfoBody);
    this.genInfoBody.setPosition(0, L.GEN_PANEL_BODY_Y, 0);
    this.genInfoFooter = new Node('GenFooter');
    this.genInfoPanel.addChild(this.genInfoFooter);
    this.genInfoFooter.setPosition(0, -420, 0);
    buildOfficialFooter(this.genInfoFooter, 0, {
      back: () => { this.genInfoPanel.active = false; },
      cancel: () => { this.genInfoPanel.active = false; },
      confirmEnabled: false,
    });
  }

  private showGeneralInfo(generalId: string) {
    const state = gameEngine.state;
    if (!state) return;
    const general = findGeneral(state, generalId);
    const city = findCity(state, general.cityId);
    this.genInfoHeader.string = `${state.year}年${state.month}月          ${city.name}`;
    buildGeneralInfoContent(this.genInfoBody, state, general);
    this.genInfoPanel.active = true;
  }

  private buildGeneralEditor() {
    const { panel, refresh } = buildGeneralEditorPanel(
      this.root,
      [],
      () => {
        this.toast('武将数据已保存，新游戏生效');
        audioManager.playSuccess();
      },
      () => { this.generalEditorPanel.active = false; },
    );
    this.generalEditorPanel = panel;
    this.generalEditorRefresh = refresh;
    this.generalEditorPanel.active = false;
  }

  private openGeneralEditor() {
    const state = gameEngine.state;
    const gens = state
      ? state.generals.filter((g) => g.factionId === state.playerFactionId)
      : ALL_SCENARIOS[0].generals.map((g) => ({
          ...g,
          status: 'idle' as const,
          age: 30,
        }));
    this.generalEditorRefresh?.(gens as General[]);
    this.generalEditorPanel.active = true;
  }

  private buildRosterPanel() {
    this.rosterPanel = this.layer('RosterPanel', false);
    this.panelBg(this.rosterPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('RosterFrame');
    this.rosterPanel.addChild(frame);
    frame.setPosition(0, 40, 0);
    frame.addComponent(UITransform).setContentSize(660, 860);
    drawModalFrame(frame.addComponent(Graphics), 660, 860);
    this.label(this.rosterPanel, 'RosterTitle', '武  将  一  览', 28, new Vec3(0, 420, 0)).color = this.c(COL.textGold);
    const rosterBody = new Node('RosterBody');
    this.rosterPanel.addChild(rosterBody);
    rosterBody.setPosition(0, 80, 0);
    this.btn(this.rosterPanel, 'CloseRoster', '关闭', new Vec3(0, -400, 0), () => {
      this.rosterPanel.active = false;
    }, 160, 44);
  }

  private openRosterPanel() {
    const state = gameEngine.state;
    if (!state) return;
    const body = this.rosterPanel.getChildByName('RosterBody');
    if (!body) return;
    body.destroyAllChildren();
    this.rosterPanel.children.filter((c) => c.name === 'RosterPrev' || c.name === 'RosterNext').forEach((c) => c.destroy());

    const gens = state.generals
      .filter((g) => g.factionId === state.playerFactionId)
      .sort((a, b) => b.force - a.force);
    const pageSize = 6;
    const maxPage = Math.max(0, Math.ceil(gens.length / pageSize) - 1);
    this.rosterPage = Math.min(this.rosterPage, maxPage);
    const page = this.rosterPage;

    if (page > 0) {
      this.btn(this.rosterPanel, 'RosterPrev', '上一页', new Vec3(-200, -400, 0), () => {
        this.rosterPage = Math.max(0, page - 1);
        this.openRosterPanel();
      }, 100, 40);
    }
    if ((page + 1) * pageSize < gens.length) {
      this.btn(this.rosterPanel, 'RosterNext', '下一页', new Vec3(200, -400, 0), () => {
        this.rosterPage = page + 1;
        this.openRosterPanel();
      }, 100, 40);
    }

    gens.slice(page * pageSize, page * pageSize + pageSize).forEach((g, i) => {
      buildGeneralListRow(
        body,
        g,
        state.factions.find((f) => f.id === g.factionId)?.color ?? '#888',
        false,
        360 - i * 56,
        () => { this.showGeneralInfo(g.id); },
        () => { this.showGeneralInfo(g.id); },
      );
    });
    this.rosterPanel.active = true;
  }

  private buildSubPanel() {
    this.panelBg(this.subPanel, 'SubBg', L.W, L.SUB_PANEL_H, 0, COL.subPanel, COL.borderGold);
    const inner = this.panelBg(this.subPanel, 'SubInner', L.W - 24, L.SUB_PANEL_H - 56, -8, COL.subPanelInner, COL.borderGoldDim);
    inner.setPosition(0, -8, 0);
    const bar = new Node('SubTitleBar');
    this.subPanel.addChild(bar);
    bar.setPosition(0, L.SUB_TITLE_Y + 8, 0);
    bar.addComponent(UITransform).setContentSize(L.W - 40, 6);
    drawTitleBar(bar.addComponent(Graphics), L.W - 40, 0);
    this.subTitle = this.label(this.subPanel, 'SubTitle', '', 22, new Vec3(0, L.SUB_TITLE_Y, 0), 640);
    this.subTitle.color = this.c(COL.textGold);
    this.subInfo = this.label(this.subPanel, 'SubInfo', '', 13, new Vec3(0, L.SUB_INFO_Y, 0), 660);
    this.subInfo.color = this.c(COL.textDim);
    this.subInfo.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.subInfo.overflow = Label.Overflow.CLAMP;
    this.subInfo.node.getComponent(UITransform)!.setContentSize(660, L.SUB_INFO_H);
    this.subBtnContainer = new Node('SubBtns');
    this.subPanel.addChild(this.subBtnContainer);
    this.subBtnContainer.setPosition(0, L.SUB_BTNS_Y, 0);
    this.subFooter = new Node('SubFooter');
    this.subPanel.addChild(this.subFooter);
    this.subFooter.setPosition(0, L.SUB_FOOTER_Y, 0);
    this.subLogBtn = this.btn(this.subPanel, 'SubLog', '日志', new Vec3(-280, L.SUB_TITLE_Y, 0), () => this.openLogPanel(), 72, 36);
    this.subLogBtn.active = false;
  }

  private buildLogPanel() {
    this.logPanel = this.layer('LogPanel', false);
    this.panelBg(this.logPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('LogFrame');
    this.logPanel.addChild(frame);
    frame.setPosition(0, 80, 0);
    frame.addComponent(UITransform).setContentSize(660, 800);
    drawModalFrame(frame.addComponent(Graphics), 660, 800);
    this.label(this.logPanel, 'LogTitle', '战  报  日  志', 28, new Vec3(0, 420, 0)).color = this.c(COL.textGold);
    this.label(this.logPanel, 'LogBody', '', 15, new Vec3(0, 80, 0), 620, true).node.name = 'LogBody';
    this.btn(this.logPanel, 'LogPrev', '上一页', new Vec3(-140, -380, 0), () => this.scrollFullLog(-1), 120, 44);
    this.btn(this.logPanel, 'LogNext', '下一页', new Vec3(140, -380, 0), () => this.scrollFullLog(1), 120, 44);
    this.btn(this.logPanel, 'CloseLog', '关闭', new Vec3(0, -380, 0), () => { this.logPanel.active = false; }, 120, 44);
  }

  private buildFuncPanel() {
    this.funcPanel = this.layer('FuncPanel', false);
    this.panelBg(this.funcPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('FuncFrame');
    this.funcPanel.addChild(frame);
    frame.setPosition(0, 80, 0);
    frame.addComponent(UITransform).setContentSize(560, 520);
    drawModalFrame(frame.addComponent(Graphics), 560, 520);
    this.label(this.funcPanel, 'FuncTitle', '功  能', 28, new Vec3(0, 260, 0)).color = this.c(COL.textGold);
    const mk = (y: number, name: string, text: string, cb: () => void) =>
      this.btn(this.funcPanel, name, text, new Vec3(0, y, 0), cb, 280, 48);
    mk(160, 'FuncSettings', '游戏设置', () => {
      this.funcPanel.active = false;
      this.settingsReturn = 'map';
      this.refreshSettingsUI();
      this.showScreen('settings');
    });
    mk(90, 'FuncStats', '势力统计', () => {
      this.funcPanel.active = false;
      this.openStatsPanel();
    });
    mk(20, 'FuncTutorial', '操作教程', () => {
      this.funcPanel.active = false;
      this.tutorialPanel.active = true;
    });
    mk(-50, 'FuncEditor', '武将编辑', () => {
      this.funcPanel.active = false;
      this.openGeneralEditor();
    });
    this.btn(this.funcPanel, 'CloseFunc', '关闭', new Vec3(0, -200, 0), () => { this.funcPanel.active = false; }, 160, 44);
  }

  private buildStatsPanel() {
    this.statsPanel = this.layer('StatsPanel', false);
    this.panelBg(this.statsPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('StatsFrame');
    this.statsPanel.addChild(frame);
    frame.setPosition(0, 80, 0);
    frame.addComponent(UITransform).setContentSize(660, 720);
    drawModalFrame(frame.addComponent(Graphics), 660, 720);
    this.label(this.statsPanel, 'StatsTitle', '势  力  统  计', 28, new Vec3(0, 360, 0)).color = this.c(COL.textGold);
    this.label(this.statsPanel, 'StatsBody', '', 16, new Vec3(0, 40, 0), 620, true).node.name = 'StatsBody';
    this.btn(this.statsPanel, 'CloseStats', '关闭', new Vec3(0, -320, 0), () => { this.statsPanel.active = false; }, 160, 44);
  }

  private buildTutorialPanel() {
    this.tutorialPanel = this.layer('TutorialPanel', false);
    this.panelBg(this.tutorialPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 210 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('TutFrame');
    this.tutorialPanel.addChild(frame);
    frame.setPosition(0, 60, 0);
    frame.addComponent(UITransform).setContentSize(640, 780);
    drawModalFrame(frame.addComponent(Graphics), 640, 780);
    this.label(this.tutorialPanel, 'TutTitle', '操  作  教  程', 28, new Vec3(0, 360, 0)).color = this.c(COL.textGold);
    const tips = [
      '1. 点击地图城池选中，底部五类命令展开子菜单',
      '2. 右侧「情报」查看城池/外交，「功能」打开设置与统计',
      '3. 每位武将每月可执行一次命令（内政/军事/人才/计谋）',
      '4. 征兵消耗本城金粮；运输需选武将，资源下月送达相邻城',
      '5. 右侧「进行」结束回合，电脑行动后月结算',
      '6. 设置中可开关战术战、战斗过场、结束确认',
    ].join('\n');
    this.label(this.tutorialPanel, 'TutBody', tips, 16, new Vec3(0, 80, 0), 580, true);
    this.btn(this.tutorialPanel, 'CloseTut', '知道了', new Vec3(0, -320, 0), () => {
      this.tutorialPanel.active = false;
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* ignore */ }
    }, 180, 48, true);
  }

  private openStatsPanel() {
    const text = gameEngine.getFactionStatsReport();
    this.setLabelText(this.statsPanel, 'StatsBody', text || '无数据');
    this.statsPanel.active = true;
  }

  private scrollLogBar(dir: -1 | 1) {
    const state = gameEngine.state;
    if (!state) return;
    const max = Math.max(0, state.actionLog.length - this.LOG_BAR_LINES);
    this.logScrollOffset = Math.max(0, Math.min(max, this.logScrollOffset + dir));
    this.refreshLogBar(state);
  }

  private refreshLogBar(state: GameState) {
    const max = Math.max(0, state.actionLog.length - this.LOG_BAR_LINES);
    this.logScrollOffset = Math.min(this.logScrollOffset, max);
    const slice = state.actionLog.slice(this.logScrollOffset, this.logScrollOffset + this.LOG_BAR_LINES);
    this.logLabel.string = slice.length ? slice.map((l) => l.message).join('\n') : '（暂无记录）';
  }

  private scrollFullLog(dir: -1 | 1) {
    const state = gameEngine.state;
    if (!state) return;
    const max = Math.max(0, state.actionLog.length - this.LOG_FULL_PAGE);
    this.logFullScrollOffset = Math.max(0, Math.min(max, this.logFullScrollOffset + dir));
    this.renderFullLog(state);
  }

  private renderFullLog(state: GameState) {
    const slice = state.actionLog.slice(this.logFullScrollOffset, this.logFullScrollOffset + this.LOG_FULL_PAGE);
    const lines = slice.map((l, i) => `${this.logFullScrollOffset + i + 1}. ${l.message}`);
    const pageInfo = `\n\n── ${this.logFullScrollOffset + 1}-${this.logFullScrollOffset + slice.length} / ${state.actionLog.length} ──`;
    this.setLabelText(this.logPanel, 'LogBody', (lines.length ? lines.join('\n') : '（暂无记录）') + pageInfo);
  }

  private maybeShowTutorial() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(TUTORIAL_KEY)) return;
    } catch { /* ignore */ }
    this.tutorialPanel.active = true;
  }

  private buildIntelPanel() {
    this.intelPanel = this.layer('IntelPanel', false);
    this.panelBg(this.intelPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('IntelFrame');
    this.intelPanel.addChild(frame);
    frame.setPosition(0, L.INTEL_FRAME_Y, 0);
    frame.addComponent(UITransform).setContentSize(L.INTEL_FRAME_W, L.INTEL_FRAME_H);
    drawModalFrame(frame.addComponent(Graphics), L.INTEL_FRAME_W, L.INTEL_FRAME_H);
    this.label(this.intelPanel, 'IntelTitle', '情  报', 28, new Vec3(0, L.INTEL_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.intelCityPanel = new Node('IntelCityPanel');
    this.intelPanel.addChild(this.intelCityPanel);
    this.intelCityPanel.setPosition(0, L.INTEL_CITY_Y, 0);
    this.label(this.intelPanel, 'IntelExtra', '', 14, new Vec3(0, L.INTEL_EXTRA_Y, 0), 620, true).node.name = 'IntelExtra';
    this.btn(this.intelPanel, 'CloseIntel', '返回', new Vec3(-140, L.INTEL_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_INTEL);
    }, 100, 44);
    this.btn(this.intelPanel, 'IntelCancel', '取消', new Vec3(0, L.INTEL_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_INTEL);
    }, 100, 44);
    this.btn(this.intelPanel, 'IntelDip', '外交', new Vec3(140, L.INTEL_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_INTEL);
      this.openDipPanel();
    }, 120, 44);
  }

  private openLogPanel() {
    const state = gameEngine.state;
    if (!state) return;
    this.logFullScrollOffset = 0;
    this.renderFullLog(state);
    this.logPanel.active = true;
  }

  private openIntelPanel() {
    openIntelPanelCmd(this.asReportHost());
  }

  private showIntelForCity(cityId: string) {
    showIntelForCityCmd(this.asReportHost(), cityId);
  }

  private buildDipPanel() {
    this.dipPanel = this.layer('DipPanel', false);
    this.panelBg(this.dipPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('DipFrame');
    this.dipPanel.addChild(frame);
    frame.setPosition(0, L.DIP_FRAME_Y, 0);
    frame.addComponent(UITransform).setContentSize(L.DIP_FRAME_W, L.DIP_FRAME_H);
    drawModalFrame(frame.addComponent(Graphics), L.DIP_FRAME_W, L.DIP_FRAME_H);
    this.label(this.dipPanel, 'DipTitle', '外  交  状  况', 28, new Vec3(0, L.DIP_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.label(this.dipPanel, 'DipBody', '', 16, new Vec3(0, L.DIP_BODY_Y, 0), 620, true).node.name = 'DipBody';
    this.btn(this.dipPanel, 'CloseDip', '关闭', new Vec3(0, L.DIP_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_DIP);
    }, 160, 44);
  }

  private openDipPanel() {
    openDipPanelCmd(this.asReportHost());
  }

  private buildConfirmPanel() {
    this.confirmPanel = this.layer('ConfirmPanel', false);
    this.panelBg(this.confirmPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 180 }, { r: 0, g: 0, b: 0, a: 0 });
    const box = new Node('ConfirmBox');
    this.confirmPanel.addChild(box);
    box.setPosition(0, L.CONFIRM_BOX_Y, 0);
    box.addComponent(UITransform).setContentSize(L.CONFIRM_BOX_W, L.CONFIRM_BOX_H);
    drawModalFrame(box.addComponent(Graphics), L.CONFIRM_BOX_W, L.CONFIRM_BOX_H);
    this.label(this.confirmPanel, 'ConfirmMsg', '', 20, new Vec3(0, L.CONFIRM_MSG_Y, 0), 440).node.name = 'ConfirmMsg';
    this.btn(this.confirmPanel, 'ConfirmYes', '确认', new Vec3(-90, L.CONFIRM_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_CONFIRM);
      this.confirmCallback?.();
      this.confirmCallback = null;
    }, 120, 44, true);
    this.btn(this.confirmPanel, 'ConfirmNo', '取消', new Vec3(90, L.CONFIRM_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_CONFIRM);
      this.confirmCallback = null;
    }, 120, 44);
  }

  private confirmCallback: (() => void) | null = null;

  private showConfirm(msg: string, onYes: () => void) {
    showConfirmCmd(this.asEndTurnHost(), msg, onYes);
  }

  private buildMonthBanner() {
    this.monthBanner = new Node('MonthBanner');
    this.root.addChild(this.monthBanner);
    this.monthBanner.addComponent(UITransform).setContentSize(L.W, 60);
    this.monthBanner.setPosition(0, L.TOP_BAR_Y - 30, 0);
    const bg = new Node('BannerBg');
    this.monthBanner.addChild(bg);
    bg.addComponent(UITransform).setContentSize(400, 50);
    const g = bg.addComponent(Graphics);
    drawPanel(g, 400, 50, toColor({ r: 20, g: 30, b: 50, a: 230 }), toColor(COL.borderGold), 10);
    this.label(this.monthBanner, 'BannerText', '', 24, new Vec3(0, 0, 0), 380).node.name = 'BannerText';
    this.monthBanner.active = false;
  }

  private showMonthBanner(text: string) {
    this.setLabelText(this.monthBanner, 'BannerText', text);
    this.monthBanner.active = true;
    this.monthBanner.setScale(0.8, 0.8, 1);
    tween(this.monthBanner)
      .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .delay(1.2)
      .call(() => { this.monthBanner.active = false; })
      .start();
  }

  private buildDeployPanel() {
    this.panelBg(this.deployPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 190 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('DeployFrame');
    this.deployPanel.addChild(frame);
    frame.setPosition(0, L.DEPLOY_FRAME_Y, 0);
    frame.addComponent(UITransform).setContentSize(L.DEPLOY_FRAME_W, L.DEPLOY_FRAME_H);
    drawModalFrame(frame.addComponent(Graphics), L.DEPLOY_FRAME_W, L.DEPLOY_FRAME_H);
    this.deployPortraitSlot = new Node('DeployPortrait');
    this.deployPanel.addChild(this.deployPortraitSlot);
    this.deployPortraitSlot.setPosition(L.DEPLOY_PORTRAIT_X, L.DEPLOY_PORTRAIT_Y, 0);
    this.label(this.deployPanel, 'Title', '出  兵', 30, new Vec3(0, L.MODAL_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.label(this.deployPanel, 'DeploySecLabel', '主将 / 副将 / 兵力', 13, new Vec3(L.DEPLOY_CTRL_X, L.DEPLOY_SEC_LABEL_Y, 0), 360).color = this.c(COL.textDim);
    this.label(this.deployPanel, 'DeployTacLabel', '策略选项', 13, new Vec3(L.DEPLOY_CTRL_X, L.DEPLOY_TAC_LABEL_Y, 0), 200).color = this.c(COL.textDim);
    this.label(this.deployPanel, 'DeployInfo', '', 16, new Vec3(0, L.DEPLOY_INFO_Y, 0), 560, true);
    this.btn(this.deployPanel, 'CloseDeploy', '取消', new Vec3(0, L.MODAL_BTN_Y, 0), () => {
      this.uiManager.closeModal(MODAL_DEPLOY);
    }, 160, 44);
  }

  private buildBattlePanel() {
    this.panelBg(this.battlePanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('BattleFrame');
    this.battlePanel.addChild(frame);
    frame.setPosition(0, L.BATTLE_FRAME_Y, 0);
    frame.addComponent(UITransform).setContentSize(L.BATTLE_FRAME_W, L.BATTLE_FRAME_H);
    drawModalFrame(frame.addComponent(Graphics), L.BATTLE_FRAME_W, L.BATTLE_FRAME_H);
    this.label(this.battlePanel, 'Title', '战  斗  报  告', 30, new Vec3(0, L.MODAL_TITLE_Y, 0)).color = this.c(COL.textGold);
    const reportLb = this.label(this.battlePanel, 'Report', '', 17, new Vec3(0, L.MODAL_BODY_Y, 0), L.BATTLE_REPORT_W, true);
    reportLb.lineHeight = 26;
    reportLb.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.btn(this.battlePanel, 'CloseBattle', '确定', new Vec3(0, L.MODAL_BTN_Y, 0), () => {
      closeBattleReport(this.asBattleHost());
    }, 160, 44);
  }

  private buildEndLayer() {
    this.panelBg(this.endLayer, 'Bg', L.W, L.H, 0, COL.mapBg);
    const bar = new Node('EndBar');
    this.endLayer.addChild(bar);
    bar.setPosition(0, 340, 0);
    bar.addComponent(UITransform).setContentSize(480, 6);
    drawTitleBar(bar.addComponent(Graphics), 480, 0);
    const titleLb = this.label(this.endLayer, 'EndTitle', '游戏结束', 44, new Vec3(0, 300, 0));
    titleLb.node.name = 'EndTitle';
    titleLb.color = this.c(COL.textGold);
    this.label(this.endLayer, 'Msg', '', 22, new Vec3(0, 180, 0), 680).node.name = 'EndMsg';
    this.btn(this.endLayer, 'Restart', '重新开始', new Vec3(0, 20, 0), () => {
      gameEngine.clearSave();
      this.showScreen('scenario');
    }, 220, 52, true);
    this.btn(this.endLayer, 'ToMenu', '主菜单', new Vec3(0, -70, 0), () => this.showScreen('menu'), 220, 52);
  }

  private cityNode(parent: Node, id: string, name: string, x: number, y: number): Node {
    const node = new Node(`City_${id}`);
    parent.addChild(node);
    node.setPosition(x, y, 0);
    node.addComponent(UITransform).setContentSize(56, 56);
    node.addComponent(Graphics);
    const nameLb = this.label(node, 'Name', name, 11, new Vec3(0, -30, 0), 88);
    nameLb.horizontalAlign = Label.HorizontalAlign.CENTER;
    nameLb.color = this.c(COL.textDim);
    const troops = this.label(node, 'Troops', '', 12, new Vec3(0, -2, 0), 44);
    troops.horizontalAlign = Label.HorizontalAlign.CENTER;
    troops.color = this.c(COL.text);
    node.addComponent(Button);
    node.on(Button.EventType.CLICK, () => this.onCityClick(id), this);
    return node;
  }

  private drawLines(parent: Node, cities: ScenarioCityDef[]) {
    const drawn = new Set<string>();
    for (const c of cities) {
      for (const nid of c.neighbors) {
        const key = [c.id, nid].sort().join('-');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const a = cities.find((x) => x.id === c.id)!;
        const b = cities.find((x) => x.id === nid)!;
        const pa = mapScenarioCoord(a.x, a.y);
        const pb = mapScenarioCoord(b.x, b.y);
        const ln = new Node(`Line_${key}`);
        parent.addChild(ln);
        const g = ln.addComponent(Graphics);
        g.strokeColor = new Color(70, 85, 110, 140);
        g.lineWidth = 2;
        g.moveTo(pa.x, pa.y);
        g.lineTo(pb.x, pb.y);
        g.stroke();
      }
    }
  }

  // ── 屏幕切换 ──

  private isLobbyScreen(s: Screen): boolean {
    return (
      s === 'menu'
      || s === 'saveList'
      || s === 'scenario'
      || s === 'scenarioDetail'
      || s === 'faction'
      || s === 'generalGallery'
      || s === 'backgroundGallery'
      || s === 'settings'
    );
  }

  private refreshScreenBgm(s: Screen) {
    if (!this.gameSettings.bgmEnabled) {
      audioManager.stopBgm();
      return;
    }
    if (this.isLobbyScreen(s)) audioManager.startMenuBgm();
    else if (s === 'map') audioManager.startGameBgm();
    else audioManager.stopBgm();
  }

  private showScreen(s: Screen) {
    if (this.uiManager) this.uiManager.dismissAll();
    this.screenNavigator.show(s);
    this.screen = s;
  }

  /** 全屏 Layer 切换后的刷新钩子 */
  private onScreenShow(s: Screen) {
    if (s === 'menu') this.refreshMenuLayers();
    if (s === 'saveList') {
      this.applyLobbyBackground(this.saveListLayer);
      this.refreshSaveList();
    }
    if (s === 'scenario') this.applyLobbyBackground(this.scenarioLayer);
    if (s === 'scenarioDetail') this.applyLobbyBackground(this.scenarioDetailLayer);
    if (s === 'faction') {
      this.applyLobbyBackground(this.factionLayer);
      const sub = this.factionLayer.getChildByName('LobbySubtitle')?.getComponent(Label);
      if (sub && this.selectedScenario) sub.string = `${this.selectedScenario.name} · 择君主而事`;
    }
    if (s === 'generalGallery') this.applyLobbyBackground(this.generalGalleryLayer);
    else this.closeGalleryDetail();
    if (s === 'backgroundGallery') this.applyLobbyBackground(this.backgroundGalleryLayer);
    if (s === 'settings') this.applyLobbyBackground(this.settingsLayer);

    this.logPanel.active = false;
    this.slotPickerPanel.active = false;
    this.funcPanel.active = false;
    this.statsPanel.active = false;
    this.tutorialPanel.active = false;
    this.intelPanel.active = false;
    this.dipPanel.active = false;
    this.confirmPanel.active = false;
    this.genInfoPanel.active = false;
    this.closeSubPanel();
    this.refreshScreenBgm(s);
    if (s === 'map') {
      this.refreshMap();
      this.maybeShowTutorial();
    }
    this.deployPanel.active = false;
    this.battlePanel.active = false;
  }

  private closeSubPanel() {
    if (!this.uiManager) return;
    this.uiManager.closeSubPanel();
  }

  private resetSubPanelState() {
    this.activeCategory = null;
    this.clearSubBtns();
    this.refreshCmdHighlight();
    if (this.subLogBtn) this.subLogBtn.active = false;
  }

  private refreshCmdHighlight() {
    CMD_CATEGORIES.forEach((cat) => {
      const node = this.cmdBtns.get(cat);
      if (!node) return;
      const g = node.getComponent(Graphics);
      if (!g) return;
      g.clear();
      const active = this.activeCategory === cat;
      drawCategoryButton(g, L.CMD_BTN_W, L.CMD_BTN_H, CAT_COL[cat], active);
    });
  }

  // ── 地图刷新 ──

  private getLabel(parent: Node, name: string): Label | null {
    const child = parent.getChildByName(name);
    return child ? child.getComponent(Label) : null;
  }

  private setLabelText(parent: Node, name: string, text: string) {
    const lb = this.getLabel(parent, name);
    if (lb) lb.string = text;
  }

  private refreshMap() {
    const state = gameEngine.state;
    if (!state) return;

    const player = state.factions.find((f) => f.id === state.playerFactionId);
    const gold = getFactionGoldTotal(state, state.playerFactionId);
    const food = getFactionFoodTotal(state, state.playerFactionId);
    const cities = state.cities.filter((c) => c.factionId === state.playerFactionId).length;

    this.hudDate.string = `${state.year}年${state.month}月  第${state.turn}回合`;
    const city = this.selectedCityId ? findCity(state, this.selectedCityId) : null;
    this.hudCityName.string = city?.name ?? '— 请选择城池 —';
    const turnText = state.phase === 'player' ? '我方回合' : '电脑回合';
    this.hudTurnBadge.string = `${turnText}  金${gold}  粮${food}  ${cities}城`;
    this.hudTurnBadge.color = state.phase === 'player' ? this.c(COL.resGold) : this.c(COL.turnAi);

    if (this.cityStatusPanel) {
      refreshCityStatusPanel(this.cityStatusPanel, state, this.selectedCityId);
      this.wireGovernorPortraitClick(state);
    }

    this.refreshLogBar(state);

    for (const city of state.cities) {
      const node = this.mapNodes.get(city.id);
      if (!node) continue;
      const faction = state.factions.find((f) => f.id === city.factionId);
      const g = node.getComponent(Graphics);
      if (g && faction) {
        g.clear();
        const col = hexToColor(faction.color);
        const selected = city.id === this.selectedCityId;
        const isPlayer = city.factionId === state.playerFactionId;
        const stroke = selected
          ? toColor({ r: 255, g: 230, b: 80, a: 255 })
          : isPlayer
            ? toColor({ r: 200, g: 220, b: 255, a: 220 })
            : toColor({ r: 255, g: 255, b: 255, a: 160 });
        drawCityMarker(g, col, stroke, selected, isPlayer);
      }
      this.setLabelText(node, 'Troops', `${city.troops}`);
    }

    this.refreshWildMarkers(state);
    this.refreshMapLegend(state);
    if (this.mapTerrainNode && gameEngine.state) {
      refreshStrategicMapLayer(this.mapTerrainNode, state, this.getActiveMapLayout(), this.selectedCityId);
    }

    if (this.mapHighlightLayer && gameEngine.state) {
      refreshNeighborHighlights(
        this.mapHighlightLayer,
        state,
        this.selectedCityId,
        this.getActiveMapLayout(),
        state.playerFactionId,
      );
    }

    if (state.phase === 'ended') this.showEndScreen();
  }

  private wireGovernorPortraitClick(state: GameState) {
    if (!this.selectedCityId || !this.cityStatusPanel) return;
    const slot = this.cityStatusPanel.getChildByName('GovPortrait');
    if (!slot) return;
    slot.getChildByName('PortraitBtn')?.destroy();
    const view = getCityStateView(state, this.selectedCityId);
    const gov = view.governor ?? view.generals[0];
    if (!gov) return;
    const btn = new Node('PortraitBtn');
    slot.addChild(btn);
    btn.addComponent(UITransform).setContentSize(90, 120);
    btn.addComponent(Button);
    btn.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      this.showGeneralInfo(gov.id);
    }, this);
  }

  private refreshMapLegend(state: GameState) {
    if (this.mapLegendNode) {
      this.mapLegendNode.destroy();
      this.mapLegendNode = null;
    }
    if (this.mapContainer) {
      this.mapLegendNode = buildFactionLegend(this.mapContainer, state);
    }
  }

  private refreshWildMarkers(state: GameState) {
    for (const city of state.cities) {
      const node = this.mapNodes.get(city.id);
      if (!node) continue;
      const wilds = state.wildGenerals.filter((w) => w.cityId === city.id);
      let marker = node.getChildByName('WildMarker');
      if (wilds.length > 0) {
        if (!marker) {
          marker = new Node('WildMarker');
          node.addChild(marker);
          marker.setPosition(18, 18, 0);
          const g = marker.addComponent(Graphics);
          g.fillColor = toColor(COL.textGold);
          g.roundRect(-8, -8, 16, 16, 3);
          g.fill();
          g.fillColor = toColor({ r: 40, g: 30, b: 10, a: 255 });
          const star = this.label(marker, 'Star', '将', 10, new Vec3(0, 0, 0), 20);
          star.horizontalAlign = Label.HorizontalAlign.CENTER;
          star.color = toColor(COL.textGold);
        }
        marker.active = true;
      } else if (marker) {
        marker.active = false;
      }
    }
  }

  // ── 交互：选城 ──

  private onCityClick(cityId: string) {
    const state = gameEngine.state;
    if (!state || state.phase !== 'player') {
      this.toast('当前不能操作');
      return;
    }
    const city = findCity(state, cityId);
    if (city.factionId === state.playerFactionId) {
      this.selectedCityId = cityId;
      this.closeSubPanel();
      this.refreshMap();
    } else {
      const wilds = state.wildGenerals.filter((w) => w.cityId === cityId);
      const wildHint = wilds.length ? ` · 在野${wilds.map((w) => w.name).join('、')}` : '';
      this.toast(`${city.name}（${this.fname(state, city.factionId)}）兵力 ${city.troops}${wildHint}`);
      this.showIntelForCity(cityId);
    }
  }

  private fname(state: GameState, fid: string) {
    return state.factions.find((f) => f.id === fid)?.name ?? fid;
  }

  // ── 交互：五大命令类（官方底部栏）──

  private onCategory(cat: CmdCategory) {
    if (!this.selectedCityId) {
      this.toast('请先点击地图上的己方城池');
      return;
    }
    const state = gameEngine.state!;
    const city = findCity(state, this.selectedCityId);
    if (city.factionId !== state.playerFactionId) {
      this.toast('只能对己方城池下令');
      return;
    }
    this.activeCategory = cat;
    this.refreshCmdHighlight();
    this.uiManager.openSubPanel(
      () => {
        this.subTitle.string = `${city.name} · ${cat}`;
        this.subGeneralId = null;
        this.genPickerPage = 0;
        this.stratagemEnemyPage = 0;
        this.clearSubBtns();
        const usesPicker = categoryUsesGeneralPicker(cat);
        this.subInfo.string = usesPicker
          ? '① 点选武将  ② 点下方命令执行'
          : gameEngine.getCityStateBrief(this.selectedCityId!);
        this.subInfo.node.active = true;
        this.buildCategoryButtons(cat, city);
        if (!usesPicker) this.refreshSubFooter();
        if (this.subLogBtn) this.subLogBtn.active = true;
      },
      () => this.resetSubPanelState(),
    );
  }

  private refreshSubFooter(onConfirm?: () => void) {
    this.subFooter.destroyAllChildren();
    buildOfficialFooter(this.subFooter, 0, {
      back: () => this.closeSubPanel(),
      cancel: () => {
        this.activeCategory = null;
        this.refreshCmdHighlight();
        this.closeSubPanel();
      },
      confirm: onConfirm,
      confirmEnabled: !!onConfirm,
    });
  }

  private clearSubBtns() {
    this.subBtnContainer.destroyAllChildren();
  }

  private genStatus(g: General): string {
    if (gameEngine.state) {
      if (isGeneralOnEnvoy(gameEngine.state, g.id)) return '使';
      if (isGeneralTransporting(gameEngine.state, g.id)) return '运';
    }
    if (g.actionUsed) return '动';
    if (g.status === 'injured') return '伤';
    if (g.status === 'governor') return '守';
    if (g.status === 'marching') return '行';
    return '';
  }

  private asSubPanelHost(): MapSubPanelHost {
    return this as unknown as MapSubPanelHost;
  }

  private asDeployHost(): DeployPanelHost {
    return this as unknown as DeployPanelHost;
  }

  private asBattleHost(): BattleFlowHost {
    return this as unknown as BattleFlowHost;
  }

  private asReportHost(): MapReportHost {
    return this as unknown as MapReportHost;
  }

  private asEndTurnHost(): EndTurnHost {
    return this as unknown as EndTurnHost;
  }

  private buildCategoryButtons(cat: CmdCategory, city: City) {
    buildMapCategoryButtons(this.asSubPanelHost(), cat, city);
  }

  private act(fn: () => { success: boolean; message: string }) {
    const r = fn();
    if (r.success) audioManager.playSuccess();
    else audioManager.playFail();
    this.toast(r.message);
    if (r.success) this.logScrollOffset = 0;
    if (r.success && this.selectedCityId) {
      const city = findCity(gameEngine.state!, this.selectedCityId);
      this.subInfo.string = gameEngine.getCityStateBrief(this.selectedCityId);
      if (this.activeCategory) this.buildCategoryButtons(this.activeCategory, city);
    }
    this.refreshMap();
  }

  private actStratagem(fn: () => { success: boolean; message: string }) {
    const r = fn();
    if (r.success) audioManager.playStratagem();
    else audioManager.playFail();
    this.toast(r.message);
    if (r.success) this.logScrollOffset = 0;
    if (r.success && this.selectedCityId) {
      const city = findCity(gameEngine.state!, this.selectedCityId);
      this.subInfo.string = gameEngine.getCityStateBrief(this.selectedCityId);
      if (this.activeCategory) this.buildCategoryButtons(this.activeCategory, city);
    }
    this.refreshMap();
  }

  private openDeploy() {
    openDeployPanel(this.asDeployHost());
  }

  private clearDeployExtras() {
    clearDeployExtrasCmd(this.asDeployHost());
  }

  private launchAttack(targetId: string) {
    launchAttackFlow(this.asBattleHost(), targetId);
  }

  private battleResult: BattleResult | null = null;

  private onEndTurn() {
    onEndTurnCmd(this.asEndTurnHost());
  }

  private doEndTurn() {
    doEndTurnCmd(this.asEndTurnHost());
  }

  private showEndScreen() {
    showEndScreenCmd(this.asEndTurnHost());
  }

  private toast(msg: string) {
    this.toastLabel.string = msg;
    ensureToastBg(this.root, this.toastLabel);
    this.unschedule(this.clearToast);
    this.scheduleOnce(this.clearToast, 2.5);
  }

  private clearToast() {
    this.toastLabel.string = '';
    if (this.toastBg) this.toastBg.active = false;
  }
}
