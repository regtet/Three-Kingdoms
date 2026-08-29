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
} from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import { ALL_SCENARIOS, MAP_LAYOUT } from '../core/data/scenarios/index';
import type { ScenarioData } from '../core/models/types';
import type { BattleInput, BattleResult, City, GameState, General } from '../core/models/types';
import { findCity, findGeneral, getCityGenerals, getDefendingGeneral, getMaxTroops } from '../core/utils/helpers';
import { getCityStateView } from '../core/utils/cityState';
import { getFactionGoldTotal, getFactionFoodTotal } from '../core/systems/diplomacy';
import { getMaxRecruitAmount } from '../core/systems/recruit';
import { getStratagemGenerals } from '../core/systems/stratagem';
import { COL, CMD_CATEGORIES, L, mapScenarioCoord, CAT_COL } from './OfficialLayout';
import { audioManager } from './AudioManager';
import { flashCity, pulseCapture } from './BattleFx';
import { playBattleCutscene } from './BattleCutscene';
import { buildTacticalBattlePanel } from './TacticalBattle';
import { getRecruitEfficiency } from '../core/systems/recruit';
import { MAX_SAVE_SLOTS } from '../core/systems/save';
import { createPortraitDisplay } from './GeneralPortrait';
import { preloadPortraits } from './PortraitLoader';
import { buildFactionLegend, refreshNeighborHighlights } from './MapVisual';
import { refreshStrategicMapLayer } from './StrategicMap';
import { applyScreenAdapt } from './ScreenAdapt';
import { buildGeneralEditorPanel } from './GeneralEditor';
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
  drawCityMarker,
  drawMapGrid,
  drawModalFrame,
  drawPanel,
  drawTitleBar,
  ensureToastBg,
  hexToColor,
  toColor,
} from './UiDraw';

type CmdCategory = (typeof CMD_CATEGORIES)[number];
type ColorLike = { r: number; g: number; b: number; a: number };

const { ccclass } = _decorator;

const TUTORIAL_KEY = 'tk_tutorial_seen';

type Screen = 'menu' | 'scenario' | 'faction' | 'map' | 'end' | 'settings';
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
  private intelPanel!: Node;
  private dipPanel!: Node;
  private confirmPanel!: Node;
  private monthBanner!: Node;
  private endLayer!: Node;
  private mapContainer!: Node;
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
  private menuSaveHint!: Label;
  private logLabel!: Label;
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
  private activeSaveSlot = 0;
  private genPickerSort: 'force' | 'intelligence' | 'loyalty' = 'force';
  private genPickerPage = 0;
  private rosterPage = 0;
  private customRecruitAmount = 100;
  private customTransportGold = 100;
  private customTransportFood = 100;
  private customTransportTroops = 200;
  private pendingBattleInput: BattleInput | null = null;
  private logScrollOffset = 0;
  private logFullScrollOffset = 0;
  private readonly LOG_BAR_LINES = 4;
  private readonly LOG_FULL_PAGE = 12;

  onLoad() {
    this.gameSettings = loadSettings();
    audioManager.applySettings(this.gameSettings);
    this.root = this.node;
    this.root.addComponent(UITransform).setContentSize(L.W, L.H);
    applyScreenAdapt(this.root);
    this.panelBg(this.root, 'RootBg', L.W, L.H, 0, L.BG_COLOR);
    this.buildUI();
    preloadPortraits(() => {
      if (this.activeCategory && this.selectedCityId && gameEngine.state) {
        const city = findCity(gameEngine.state, this.selectedCityId);
        this.buildCategoryButtons(this.activeCategory, city);
      }
    });
    this.showScreen('menu');
  }

  // ── 构建 ──

  private buildUI() {
    this.menuLayer = this.layer('MenuLayer');
    this.scenarioLayer = this.layer('ScenarioLayer');
    this.factionLayer = this.layer('FactionLayer');
    this.settingsLayer = this.layer('SettingsLayer');
    this.mapLayer = this.layer('MapLayer', false);
    this.subPanel = this.layer('SubPanel', false);
    this.subPanel.setPosition(0, L.SUB_PANEL_Y, 0);
    this.deployPanel = this.layer('DeployPanel', false);
    this.battlePanel = this.layer('BattlePanel', false);
    this.endLayer = this.layer('EndLayer');

    this.buildMenu();
    this.buildScenarioSelect();
    this.buildFactionSelect();
    this.buildSettings();
    this.buildMapScreen();
    this.buildSubPanel();
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
  }

  private layer(name: string, block = true): Node {
    const n = new Node(name);
    n.addComponent(UITransform).setContentSize(L.W, L.H);
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
    if (catColor && !highlight) {
      g.fillColor = toColor(catColor);
      g.roundRect(-w / 2, -h / 2, w, h - 3, 8);
      g.fill();
      g.strokeColor = toColor(COL.borderGold);
      g.lineWidth = 1;
      g.roundRect(-w / 2, -h / 2, w, h - 3, 8);
      g.stroke();
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
    this.panelBg(this.menuLayer, 'Bg', L.W, L.H, 0, COL.mapBg, { r: 60, g: 80, b: 120, a: 80 });
    const deco = new Node('MenuDeco');
    this.menuLayer.addChild(deco);
    deco.setPosition(0, 120, 0);
    deco.addComponent(UITransform).setContentSize(400, 400);
    const dg = deco.addComponent(Graphics);
    drawTitleBar(dg, 480, 0);
    const title = this.label(this.menuLayer, 'Title', '三国志', 52, new Vec3(0, L.MENU_TITLE_Y + 20, 0), 680);
    title.color = this.c(COL.textGold);
    this.label(this.menuLayer, 'SubTitle', '天 下 争 锋', 28, new Vec3(0, L.MENU_TITLE_Y - 30, 0)).color = this.c(COL.text);
    this.label(this.menuLayer, 'Sub', '官方布局 · 竖屏还原', 16, new Vec3(0, L.MENU_TITLE_Y - 70, 0)).color = this.c(COL.textDim);
    this.btn(this.menuLayer, 'NewGame', '新游戏', new Vec3(0, L.MENU_BTN1_Y, 0), () => {
      this.openSaveSlotPicker(true);
    }, 260, 56);
    this.btn(this.menuLayer, 'Continue', '继续游戏', new Vec3(0, L.MENU_BTN2_Y, 0), () => {
      this.openSaveSlotPicker(false);
    }, 260, 56);
    this.menuSaveHint = this.label(this.menuLayer, 'SaveHint', '', 14, new Vec3(0, L.MENU_BTN2_Y - 38, 0), 680);
    this.menuSaveHint.color = this.c(COL.textDim);
    this.menuSaveHint.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.btn(this.menuLayer, 'Settings', '设置', new Vec3(0, L.MENU_BTN3_Y, 0), () => {
      this.settingsReturn = 'menu';
      this.refreshSettingsUI();
      this.showScreen('settings');
    }, 260, 48);
    this.refreshMenuHints();
  }

  private refreshMenuHints() {
    if (!this.menuSaveHint) return;
    const lines = gameEngine.getAllSaveSlotSummaries();
    this.menuSaveHint.string = lines.join('\n');
  }

  private openSaveSlotPicker(forNewGame: boolean) {
    this.clearSubBtns();
    this.subPanel.active = true;
    this.subPanel.setPosition(0, L.SUB_PANEL_Y, 0);
    this.subTitle.string = forNewGame ? '选择存档槽（新游戏）' : '选择存档槽（继续）';
    this.subInfo.string = '点击槽位开始';
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const summary = gameEngine.getSaveSummary(i) ?? '（空）';
      const y = 40 - i * 70;
      this.btn(this.subBtnContainer, `Slot_${i}`, `槽${i + 1}: ${summary}`, new Vec3(0, y, 0), () => {
        this.activeSaveSlot = i;
        gameEngine.setSaveSlot(i);
        if (forNewGame) {
          this.toast(`将在槽${i + 1}保存`);
          this.closeSubPanel();
          this.showScreen('scenario');
        } else if (gameEngine.loadGameFromSlot(i)) {
          if (this.gameSettings.bgmEnabled) audioManager.startBgm();
          this.closeSubPanel();
          this.showScreen('map');
          this.refreshMap();
        } else {
          this.toast('该槽位无存档');
        }
      }, 520, 44);
    }
    this.refreshSubFooter();
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
    this.setBtnLabel(this.settingsBgmBtn, `背景音乐: ${this.gameSettings.bgmEnabled ? '开' : '关'}`);
    this.setBtnLabel(this.settingsSfxBtn, `音效: ${this.gameSettings.sfxEnabled ? '开' : '关'}`);
    this.setBtnLabel(this.settingsBgmVolBtn, `BGM音量: ${this.volLabel(this.gameSettings.bgmVolume)}`);
    this.setBtnLabel(this.settingsSfxVolBtn, `音效音量: ${this.volLabel(this.gameSettings.sfxVolume)}`);
    this.setBtnLabel(this.settingsConfirmBtn, `结束确认: ${this.gameSettings.confirmEndTurn ? '开' : '关'}`);
    this.setBtnLabel(this.settingsSkipAiBtn, `跳过AI遮罩: ${this.gameSettings.skipAiOverlay ? '开' : '关'}`);
    this.setBtnLabel(this.settingsCutsceneBtn, `战斗过场: ${this.gameSettings.battleCutscene ? '开' : '关'}`);
    this.setBtnLabel(this.settingsTacticalBtn, `战术战: ${this.gameSettings.tacticalBattle ? '开' : '关'}`);
  }

  private setBtnLabel(btnNode: Node, text: string) {
    const lb = btnNode.getChildByName('Label')?.getComponent(Label);
    if (lb) lb.string = text;
  }

  private buildSettings() {
    this.panelBg(this.settingsLayer, 'Bg', L.W, L.H, 0, COL.mapBg);
    const bar = new Node('SettingsBar');
    this.settingsLayer.addChild(bar);
    bar.setPosition(0, L.SETTINGS_TITLE_Y + 20, 0);
    bar.addComponent(UITransform).setContentSize(360, 6);
    drawTitleBar(bar.addComponent(Graphics), 360, 0);
    const title = this.label(this.settingsLayer, 'Title', '游戏设置', 36, new Vec3(0, L.SETTINGS_TITLE_Y, 0));
    title.color = this.c(COL.textGold);

    const mkRow = (y: number, name: string, text: string, cb: () => void): Node =>
      this.btn(this.settingsLayer, name, text, new Vec3(0, y, 0), cb, 320, 50);

    this.settingsBgmBtn = mkRow(L.SETTINGS_ROW_START_Y, 'SetBgm', '背景音乐: 开', () => {
      this.gameSettings.bgmEnabled = !this.gameSettings.bgmEnabled;
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsSfxBtn = mkRow(L.SETTINGS_ROW_START_Y - L.SETTINGS_ROW_GAP, 'SetSfx', '音效: 开', () => {
      this.gameSettings.sfxEnabled = !this.gameSettings.sfxEnabled;
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsBgmVolBtn = mkRow(L.SETTINGS_ROW_START_Y - L.SETTINGS_ROW_GAP * 2, 'SetBgmVol', 'BGM音量: 中', () => {
      this.gameSettings.bgmVolume = this.cycleVol(this.gameSettings.bgmVolume);
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsSfxVolBtn = mkRow(L.SETTINGS_ROW_START_Y - L.SETTINGS_ROW_GAP * 3, 'SetSfxVol', '音效音量: 高', () => {
      this.gameSettings.sfxVolume = this.cycleVol(this.gameSettings.sfxVolume);
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsConfirmBtn = mkRow(L.SETTINGS_ROW_START_Y - L.SETTINGS_ROW_GAP * 4, 'SetConfirm', '结束确认: 开', () => {
      this.gameSettings.confirmEndTurn = !this.gameSettings.confirmEndTurn;
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsSkipAiBtn = mkRow(L.SETTINGS_ROW_START_Y - L.SETTINGS_ROW_GAP * 5, 'SetSkipAi', '跳过AI遮罩: 关', () => {
      this.gameSettings.skipAiOverlay = !this.gameSettings.skipAiOverlay;
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsCutsceneBtn = mkRow(40, 'SetCutscene', '战斗过场: 开', () => {
      this.gameSettings.battleCutscene = !this.gameSettings.battleCutscene;
      this.persistSettings();
      this.refreshSettingsUI();
    });
    this.settingsTacticalBtn = mkRow(-30, 'SetTactical', '战术战: 开', () => {
      this.gameSettings.tacticalBattle = !this.gameSettings.tacticalBattle;
      this.persistSettings();
      this.refreshSettingsUI();
    });

    this.btn(this.settingsLayer, 'ClearSave', '删除当前槽存档', new Vec3(0, -100, 0), () => {
      if (gameEngine.hasSaveInSlot(gameEngine.getSaveSlot())) {
        gameEngine.clearSaveSlot(gameEngine.getSaveSlot());
        this.refreshMenuHints();
        this.toast(`槽${gameEngine.getSaveSlot() + 1} 存档已删除`);
        audioManager.playSuccess();
      } else {
        this.toast('当前槽没有存档');
      }
    }, 260, 48, false, true);

    this.btn(this.settingsLayer, 'SettingsEditor', '武将编辑', new Vec3(0, -180, 0), () => {
      this.openGeneralEditor();
    }, 260, 48);

    this.btn(this.settingsLayer, 'SettingsMenu', '返回主菜单', new Vec3(0, -260, 0), () => {
      this.showScreen('menu');
    }, 200, 44);

    this.btn(this.settingsLayer, 'SettingsBack', '返回', new Vec3(0, -340, 0), () => {
      this.showScreen(this.settingsReturn);
    }, 200, 44);
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
    this.panelBg(this.scenarioLayer, 'Bg', L.W, L.H, 0, COL.mapBg);
    const bar = new Node('ScenarioBar');
    this.scenarioLayer.addChild(bar);
    bar.setPosition(0, L.FACTION_TITLE_Y + 20, 0);
    bar.addComponent(UITransform).setContentSize(400, 6);
    drawTitleBar(bar.addComponent(Graphics), 400, 0);
    const title = this.label(this.scenarioLayer, 'Title', '选择剧本', 36, new Vec3(0, L.FACTION_TITLE_Y, 0));
    title.color = this.c(COL.textGold);
    ALL_SCENARIOS.forEach((s, i) => {
      const desc = s.id === 'scenario_002' ? `${s.startYear}年 · 在野名将` : `${s.startYear}年 · 三足鼎立`;
      this.btn(
        this.scenarioLayer,
        `Scenario_${s.id}`,
        `${s.name}\n${desc}`,
        new Vec3(0, L.FACTION_START_Y - i * L.FACTION_GAP, 0),
        () => {
          this.selectedScenario = s;
          this.rebuildFactionButtons();
          this.showScreen('faction');
        },
        320,
        64,
      );
    });
    this.btn(this.scenarioLayer, 'Back', '返回', new Vec3(0, -480, 0), () => this.showScreen('menu'), 160, 44);
  }

  private rebuildFactionButtons() {
    this.factionBtnContainer.destroyAllChildren();
    this.selectedScenario.factions.forEach((f, i) => {
      const col = hexToColor(f.color);
      const btnNode = this.btn(
        this.factionBtnContainer,
        `Faction_${f.id}`,
        `${f.name}    ${f.rulerName}`,
        new Vec3(0, L.FACTION_START_Y - 80 - i * L.FACTION_GAP, 0),
        () => {
          gameEngine.setSaveSlot(this.activeSaveSlot);
          gameEngine.newGame(this.selectedScenario, f.id);
          this.selectedCityId = null;
          if (this.gameSettings.bgmEnabled) audioManager.startBgm();
          this.showScreen('map');
          this.refreshMap();
        },
        320,
        58,
        false,
        false,
        { r: Math.floor(col.r * 0.45), g: Math.floor(col.g * 0.45), b: Math.floor(col.b * 0.45), a: 255 },
      );
      const stripe = new Node('Stripe');
      btnNode.addChild(stripe);
      stripe.setPosition(-150, 0, 0);
      stripe.addComponent(UITransform).setContentSize(8, 40);
      const sg = stripe.addComponent(Graphics);
      sg.fillColor = col;
      sg.roundRect(-4, -20, 8, 40, 2);
      sg.fill();
    });
  }

  private buildFactionSelect() {
    this.panelBg(this.factionLayer, 'Bg', L.W, L.H, 0, COL.mapBg);
    const bar = new Node('FactionBar');
    this.factionLayer.addChild(bar);
    bar.setPosition(0, L.FACTION_TITLE_Y + 20, 0);
    bar.addComponent(UITransform).setContentSize(400, 6);
    drawTitleBar(bar.addComponent(Graphics), 400, 0);
    const title = this.label(this.factionLayer, 'Title', '选择势力', 36, new Vec3(0, L.FACTION_TITLE_Y, 0));
    title.color = this.c(COL.textGold);
    this.factionBtnContainer = new Node('FactionBtns');
    this.factionLayer.addChild(this.factionBtnContainer);
    this.rebuildFactionButtons();
    this.btn(this.factionLayer, 'Back', '返回', new Vec3(0, -480, 0), () => this.showScreen('scenario'), 160, 44);
  }

  private buildMapScreen() {
    this.panelBg(this.mapLayer, 'MapBg', L.W, L.MAP_H + 80, L.MAP_CENTER.y, COL.mapBg);
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

    // 官方顶栏：日期 + 城名
    this.panelBg(this.mapLayer, 'HeaderBar', L.W, L.HEADER_H + 8, L.HEADER_Y, COL.topBar);
    this.hudDate = this.label(this.mapLayer, 'HUDDate', '', 18, new Vec3(-260, L.HEADER_Y, 0), 200);
    this.hudDate.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.hudCityName = this.label(this.mapLayer, 'HUDCityName', '—', 22, new Vec3(0, L.HEADER_Y, 0), 300);
    this.hudCityName.color = this.c(COL.textGold);
    this.hudCityName.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.hudTurnBadge = this.label(this.mapLayer, 'HUDTurn', '', 15, new Vec3(260, L.HEADER_Y, 0), 140);
    this.hudTurnBadge.horizontalAlign = Label.HorizontalAlign.RIGHT;

    // 官方城池状态面板（肖像 + 属性格）
    this.cityStatusPanel = buildCityStatusPanel(this.mapLayer);

    this.panelBg(this.mapLayer, 'LogBar', L.W, L.LOG_H, L.LOG_Y, COL.panelBg);
    this.panelBg(this.mapLayer, 'CmdBar', L.W, L.CMD_BAR_H, L.CMD_Y, COL.cmdBar);

    this.logLabel = this.label(this.mapLayer, 'Log', '', 14, new Vec3(-30, L.LOG_Y, 0), 480, true);
    this.logLabel.color = this.c(COL.textDim);
    this.btn(this.mapLayer, 'LogUp', '▲', new Vec3(250, L.LOG_Y + 18, 0), () => this.scrollLogBar(-1), 36, 28);
    this.btn(this.mapLayer, 'LogDown', '▼', new Vec3(250, L.LOG_Y - 18, 0), () => this.scrollLogBar(1), 36, 28);
    this.btn(this.mapLayer, 'LogMore', '详', new Vec3(300, L.LOG_Y, 0), () => this.openLogPanel(), 36, 36);

    // 官方右侧竖栏
    this.btn(this.mapLayer, 'SideInfo', '情报', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y1, 0), () => this.openSideIntel(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn);
    this.btn(this.mapLayer, 'SideFunc', '功能', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y2, 0), () => this.openSideFunc(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn);
    this.btn(this.mapLayer, 'SideRoster', '武将', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y3, 0), () => this.openRosterPanel(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, false, false, COL.sidebarBtn);
    this.btn(this.mapLayer, 'SideGo', '进行', new Vec3(L.SIDEBAR_X, L.SIDEBAR_Y4, 0), () => this.onEndTurn(), L.SIDEBAR_BTN_W, L.SIDEBAR_BTN_H, true, false, COL.sidebarBtn);

    CMD_CATEGORIES.forEach((cat, i) => {
      const node = this.btn(
        this.mapLayer,
        `Cmd_${cat}`,
        cat,
        new Vec3(L.CMD_START_X + i * L.CMD_GAP, L.CMD_Y, 0),
        () => this.onCategory(cat),
        L.CMD_BTN_W,
        L.CMD_BTN_H,
        false,
        false,
        CAT_COL[cat],
      );
      this.cmdBtns.set(cat, node);
    });

    const mapContainer = new Node('MapContainer');
    this.mapLayer.addChild(mapContainer);
    mapContainer.setPosition(new Vec3(L.MAP_CENTER.x, L.MAP_CENTER.y, 0));
    this.mapContainer = mapContainer;

    this.mapHighlightLayer = new Node('MapHighlights');
    mapContainer.addChild(this.mapHighlightLayer);

    for (const c of MAP_LAYOUT) {
      const pos = mapScenarioCoord(c.x, c.y);
      this.mapNodes.set(c.id, this.cityNode(mapContainer, c.id, c.name, pos.x, pos.y));
    }
    this.drawLines(mapContainer, MAP_LAYOUT);
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
    this.panelBg(this.subPanel, 'SubBg', L.W, L.SUB_PANEL_H, 0, COL.subPanel);
    const bar = new Node('SubTitleBar');
    this.subPanel.addChild(bar);
    bar.setPosition(0, L.SUB_TITLE_Y + 8, 0);
    bar.addComponent(UITransform).setContentSize(L.W - 40, 6);
    drawTitleBar(bar.addComponent(Graphics), L.W - 40, 0);
    this.subTitle = this.label(this.subPanel, 'SubTitle', '', 22, new Vec3(0, L.SUB_TITLE_Y, 0), 640);
    this.subTitle.color = this.c(COL.textGold);
    this.subInfo = this.label(this.subPanel, 'SubInfo', '', 15, new Vec3(0, L.SUB_INFO_Y, 0), 660, true);
    this.subInfo.color = this.c(COL.textDim);
    this.subBtnContainer = new Node('SubBtns');
    this.subPanel.addChild(this.subBtnContainer);
    this.subBtnContainer.setPosition(0, L.SUB_BTNS_Y, 0);
    this.subFooter = new Node('SubFooter');
    this.subPanel.addChild(this.subFooter);
    this.subFooter.setPosition(0, L.SUB_FOOTER_Y, 0);
    this.btn(this.subPanel, 'SubLog', '日志', new Vec3(-280, L.SUB_TITLE_Y, 0), () => this.openLogPanel(), 72, 36);
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
      '3. 每城每月只能执行一次内政（开发/开垦/治理）',
      '4. 征兵消耗本城金粮，运输在相邻己方城之间调配',
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
    frame.setPosition(0, 40, 0);
    frame.addComponent(UITransform).setContentSize(660, 900);
    drawModalFrame(frame.addComponent(Graphics), 660, 900);
    this.label(this.intelPanel, 'IntelTitle', '情  报', 28, new Vec3(0, 460, 0)).color = this.c(COL.textGold);
    this.intelCityPanel = new Node('IntelCityPanel');
    this.intelPanel.addChild(this.intelCityPanel);
    this.intelCityPanel.setPosition(0, 200, 0);
    this.label(this.intelPanel, 'IntelExtra', '', 14, new Vec3(0, -120, 0), 620, true).node.name = 'IntelExtra';
    this.btn(this.intelPanel, 'CloseIntel', '返回', new Vec3(-140, -420, 0), () => { this.intelPanel.active = false; }, 100, 44);
    this.btn(this.intelPanel, 'IntelCancel', '取消', new Vec3(0, -420, 0), () => { this.intelPanel.active = false; }, 100, 44);
    this.btn(this.intelPanel, 'IntelDip', '外交', new Vec3(140, -420, 0), () => {
      this.intelPanel.active = false;
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
    if (!this.selectedCityId) {
      this.toast('请先选择城池');
      return;
    }
    this.showIntelForCity(this.selectedCityId);
  }

  /** @deprecated 使用 openSideIntel */

  private showIntelForCity(cityId: string) {
    const state = gameEngine.state;
    if (!state) return;
    this.intelCityPanel.destroyAllChildren();
    const inner = buildCityStatusPanel(this.intelCityPanel, 0);
    inner.setPosition(0, 0, 0);
    refreshCityStatusPanel(inner, state, cityId);
    const view = gameEngine.getCityState(cityId);
    const extra = view.split('--- 邻接 ---')[1] ?? '';
    this.setLabelText(this.intelPanel, 'IntelExtra', extra ? `--- 邻接 ---${extra}` : '');
    this.intelPanel.active = true;
  }

  private buildDipPanel() {
    this.dipPanel = this.layer('DipPanel', false);
    this.panelBg(this.dipPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('DipFrame');
    this.dipPanel.addChild(frame);
    frame.setPosition(0, 80, 0);
    frame.addComponent(UITransform).setContentSize(660, 720);
    drawModalFrame(frame.addComponent(Graphics), 660, 720);
    this.label(this.dipPanel, 'DipTitle', '外  交  状  况', 28, new Vec3(0, 380, 0)).color = this.c(COL.textGold);
    this.label(this.dipPanel, 'DipBody', '', 16, new Vec3(0, 60, 0), 620, true).node.name = 'DipBody';
    this.btn(this.dipPanel, 'CloseDip', '关闭', new Vec3(0, -340, 0), () => { this.dipPanel.active = false; }, 160, 44);
  }

  private openDipPanel() {
    this.setLabelText(this.dipPanel, 'DipBody', gameEngine.getDiplomacyReport());
    this.dipPanel.active = true;
  }

  private buildConfirmPanel() {
    this.confirmPanel = this.layer('ConfirmPanel', false);
    this.panelBg(this.confirmPanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 180 }, { r: 0, g: 0, b: 0, a: 0 });
    const box = new Node('ConfirmBox');
    this.confirmPanel.addChild(box);
    box.setPosition(0, 40, 0);
    box.addComponent(UITransform).setContentSize(480, 220);
    drawModalFrame(box.addComponent(Graphics), 480, 220);
    this.label(this.confirmPanel, 'ConfirmMsg', '', 20, new Vec3(0, 80, 0), 440).node.name = 'ConfirmMsg';
    this.btn(this.confirmPanel, 'ConfirmYes', '确认', new Vec3(-90, -20, 0), () => {
      this.confirmPanel.active = false;
      this.confirmCallback?.();
      this.confirmCallback = null;
    }, 120, 44, true);
    this.btn(this.confirmPanel, 'ConfirmNo', '取消', new Vec3(90, -20, 0), () => {
      this.confirmPanel.active = false;
      this.confirmCallback = null;
    }, 120, 44);
  }

  private confirmCallback: (() => void) | null = null;

  private showConfirm(msg: string, onYes: () => void) {
    this.setLabelText(this.confirmPanel, 'ConfirmMsg', msg);
    this.confirmCallback = onYes;
    this.confirmPanel.active = true;
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
    frame.setPosition(0, 80, 0);
    frame.addComponent(UITransform).setContentSize(660, 900);
    drawModalFrame(frame.addComponent(Graphics), 660, 900);
    this.deployPortraitSlot = new Node('DeployPortrait');
    this.deployPanel.addChild(this.deployPortraitSlot);
    this.deployPortraitSlot.setPosition(-260, 320, 0);
    this.label(this.deployPanel, 'Title', '出  兵', 30, new Vec3(0, L.MODAL_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.label(this.deployPanel, 'DeployInfo', '', 18, new Vec3(0, L.MODAL_BODY_Y, 0), 680).node.name = 'DeployInfo';
    this.btn(this.deployPanel, 'CloseDeploy', '取消', new Vec3(0, L.MODAL_BTN_Y, 0), () => {
      this.deployPanel.active = false;
      this.clearDeployExtras();
    }, 160, 44);
  }

  private buildBattlePanel() {
    this.panelBg(this.battlePanel, 'Bg', L.W, L.H, 0, { r: 0, g: 0, b: 0, a: 200 }, { r: 0, g: 0, b: 0, a: 0 });
    const frame = new Node('BattleFrame');
    this.battlePanel.addChild(frame);
    frame.setPosition(0, 100, 0);
    frame.addComponent(UITransform).setContentSize(640, 720);
    drawModalFrame(frame.addComponent(Graphics), 640, 720);
    this.label(this.battlePanel, 'Title', '战  斗  报  告', 30, new Vec3(0, L.MODAL_TITLE_Y, 0)).color = this.c(COL.textGold);
    this.label(this.battlePanel, 'Report', '', 18, new Vec3(0, L.MODAL_BODY_Y, 0), 680).node.name = 'BattleReport';
    this.btn(this.battlePanel, 'CloseBattle', '确定', new Vec3(0, L.MODAL_BTN_Y, 0), () => {
      this.battlePanel.active = false;
      this.refreshMap();
      if (gameEngine.state?.phase === 'ended') this.showEndScreen();
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

  private drawLines(parent: Node, cities: typeof MAP_LAYOUT) {
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

  private showScreen(s: Screen) {
    this.screen = s;
    this.menuLayer.active = s === 'menu';
    this.scenarioLayer.active = s === 'scenario';
    this.factionLayer.active = s === 'faction';
    this.settingsLayer.active = s === 'settings';
    this.mapLayer.active = s === 'map';
    this.endLayer.active = s === 'end';
    this.logPanel.active = false;
    this.funcPanel.active = false;
    this.statsPanel.active = false;
    this.tutorialPanel.active = false;
    this.intelPanel.active = false;
    this.dipPanel.active = false;
    this.confirmPanel.active = false;
    this.genInfoPanel.active = false;
    this.closeSubPanel();
    if (s === 'menu') this.refreshMenuHints();
    if (s === 'map') {
      this.refreshMap();
      this.maybeShowTutorial();
    }
    this.deployPanel.active = false;
    this.battlePanel.active = false;
  }

  private closeSubPanel() {
    this.subPanel.active = false;
    this.subPanel.setPosition(0, L.SUB_PANEL_Y, 0);
    this.activeCategory = null;
    this.clearSubBtns();
    this.refreshCmdHighlight();
  }

  private refreshCmdHighlight() {
    CMD_CATEGORIES.forEach((cat) => {
      const node = this.cmdBtns.get(cat);
      if (!node) return;
      const g = node.getComponent(Graphics);
      if (!g) return;
      g.clear();
      const active = this.activeCategory === cat;
      if (active) {
        drawButton(g, L.CMD_BTN_W, L.CMD_BTN_H, true);
      } else {
        g.fillColor = toColor(CAT_COL[cat]);
        g.roundRect(-L.CMD_BTN_W / 2, -L.CMD_BTN_H / 2, L.CMD_BTN_W, L.CMD_BTN_H - 3, 8);
        g.fill();
        g.strokeColor = toColor(COL.borderGold);
        g.lineWidth = 1;
        g.roundRect(-L.CMD_BTN_W / 2, -L.CMD_BTN_H / 2, L.CMD_BTN_W, L.CMD_BTN_H - 3, 8);
        g.stroke();
      }
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
    const turnText = state.phase === 'player' ? '▶ 我方' : '▶ 电脑';
    this.hudTurnBadge.string = `${turnText}  金${gold} 粮${food} 城${cities}`;
    this.hudTurnBadge.color = state.phase === 'player' ? this.c(COL.turnPlayer) : this.c(COL.turnAi);

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
      refreshStrategicMapLayer(this.mapTerrainNode, state, MAP_LAYOUT, this.selectedCityId);
    }

    if (this.mapHighlightLayer && gameEngine.state) {
      refreshNeighborHighlights(
        this.mapHighlightLayer,
        state,
        this.selectedCityId,
        MAP_LAYOUT,
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
      this.toast(`已选 ${city.name}，请选择下方命令`);
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
    this.subPanel.active = true;
    this.subPanel.setPosition(0, L.SUB_PANEL_Y - 60, 0);
    tween(this.subPanel)
      .to(0.18, { position: new Vec3(0, L.SUB_PANEL_Y, 0) }, { easing: 'quadOut' })
      .start();
    this.subTitle.string = `${city.name} · ${cat}`;
    this.subInfo.string = gameEngine.getCityStateBrief(this.selectedCityId);
    this.subGeneralId = null;
    this.clearSubBtns();
    this.buildCategoryButtons(cat, city);
    if (cat !== '人才' && cat !== '计谋') this.refreshSubFooter();
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
    if (g.status === 'injured') return '伤';
    if (g.status === 'governor') return '守';
    return '';
  }

  /** 子面板武将列表（肖像 + 四维） */
  private buildGeneralPicker(gens: General[], startY: number, onPick: (id: string) => void) {
    const state = gameEngine.state!;
    const usable = gens.filter((g) => g.status !== 'marching');
    if (!this.subGeneralId && usable.length) this.subGeneralId = usable[0].id;

    const hint = new Node('PickerHint');
    this.subBtnContainer.addChild(hint);
    hint.setPosition(0, startY + 36, 0);
    hint.addComponent(UITransform).setContentSize(L.GEN_LIST_W, 20);
    const hl = hint.addComponent(Label);
    hl.string = '请选择目标武将';
    hl.fontSize = 13;
    hl.color = this.c(COL.textDim);
    hl.horizontalAlign = Label.HorizontalAlign.CENTER;

    const sortFn = (a: General, b: General) => {
      if (this.genPickerSort === 'intelligence') return b.intelligence - a.intelligence;
      if (this.genPickerSort === 'loyalty') return b.loyalty - a.loyalty;
      return b.force - a.force;
    };
    const sorted = [...usable].sort(sortFn);
    const pageSize = 4;
    const page = Math.min(this.genPickerPage, Math.max(0, Math.ceil(sorted.length / pageSize) - 1));
    this.genPickerPage = page;

    [['武力', 'force'], ['智力', 'intelligence'], ['忠诚', 'loyalty']].forEach(([label, key], i) => {
      const x = (i - 1) * 100;
      this.btn(this.subBtnContainer, `Sort_${key}`, label, new Vec3(x, startY + 58, 0), () => {
        this.genPickerSort = key as typeof this.genPickerSort;
        onPick('');
      }, 80, 28, this.genPickerSort === key);
    });

    if (page > 0) {
      this.btn(this.subBtnContainer, 'PrevPage', '上一页', new Vec3(-260, startY + 30, 0), () => {
        this.genPickerPage = Math.max(0, page - 1);
        onPick('');
      }, 72, 28);
    }
    if ((page + 1) * pageSize < sorted.length) {
      this.btn(this.subBtnContainer, 'NextPage', '下一页', new Vec3(260, startY + 30, 0), () => {
        this.genPickerPage = page + 1;
        onPick('');
      }, 72, 28);
    }

    sorted.slice(page * pageSize, page * pageSize + pageSize).forEach((g, i) => {
      const faction = state.factions.find((f) => f.id === g.factionId);
      buildGeneralListRow(
        this.subBtnContainer,
        g,
        faction?.color ?? '#888888',
        g.id === this.subGeneralId,
        startY - i * (L.GEN_LIST_ROW_H + 4),
        () => {
          this.subGeneralId = g.id;
          onPick(g.id);
        },
        () => {
          audioManager.playClick();
          this.showGeneralInfo(g.id);
        },
      );
    });

    this.refreshSubFooter(() => {
      if (this.subGeneralId) onPick(this.subGeneralId);
    });
    return usable;
  }

  private buildCategoryButtons(cat: CmdCategory, city: City) {
    const row = (buttons: [string, () => void][], startY = 0) => {
      buttons.forEach(([text, cb], i) => {
        const x = (i - (buttons.length - 1) / 2) * 140;
        this.btn(this.subBtnContainer, `SubBtn_${text}`, text, new Vec3(x, startY, 0), cb, 120, 44);
      });
    };

    switch (cat) {
      case '内政':
        row([
          ['开发', () => this.act(() => gameEngine.develop(city.id))],
          ['开垦', () => this.act(() => gameEngine.farm(city.id))],
          ['治理', () => this.act(() => gameEngine.govern(city.id))],
        ]);
        break;
      case '军事': {
        const eff = Math.floor(getRecruitEfficiency(gameEngine.state!, city.id) * 100);
        this.subInfo.string += `\n征兵效率 ${eff}%`;
        row([
          ['征兵50', () => this.doRecruit(50)],
          ['征兵100', () => this.doRecruit(100)],
          ['自定义', () => this.cycleCustomRecruit(city.id)],
          ['最大', () => this.doRecruitMax()],
        ], 35);
        row([
          ['出兵', () => this.openDeploy()],
          ['运输', () => this.openTransportMenu()],
        ], -35);
        break;
      }
      case '人才': {
        const state = gameEngine.state!;
        const gens = getCityGenerals(state, city.id);
        const wilds = gameEngine.getWildAtCity(city.id);
        if (gens.length === 0 && wilds.length === 0) {
          this.subInfo.string += '\n（本城无武将）';
          row([['搜索人才', () => this.act(() => gameEngine.searchTalent(city.id))]], 0);
          return;
        }
        if (gens.length === 0) {
          row([['搜索人才', () => this.act(() => gameEngine.searchTalent(city.id))]], 30);
          wilds.forEach((w, i) => {
            const x = (i - (wilds.length - 1) / 2) * 160;
            this.btn(this.subBtnContainer, `Wild_${w.id}`, `登用${w.name}(${w.recruitGold}金)`, new Vec3(x, -20, 0), () => {
              this.act(() => gameEngine.recruitWild(city.id, w.id));
            }, 160, 40);
          });
          break;
        }
        const rebuild = () => this.buildCategoryButtons('人才', city);
        this.buildGeneralPicker(gens, 70, () => rebuild());
        const gid = () => this.subGeneralId ?? gens[0].id;
        row([
          ['赏赐', () => this.act(() => gameEngine.rewardGeneral(gid(), city.id))],
          ['任命太守', () => this.act(() => gameEngine.appointGovernor(city.id, gid()))],
          ['搜索', () => this.act(() => gameEngine.searchTalent(city.id))],
        ], -95);
        wilds.forEach((w, i) => {
          const x = (i - (wilds.length - 1) / 2) * 150;
          this.btn(this.subBtnContainer, `Wild_${w.id}`, `登用${w.name}(${w.recruitGold}金)`, new Vec3(x, -140, 0), () => {
            this.act(() => gameEngine.recruitWild(city.id, w.id));
          }, 150, 36);
        });
        const allies = city.neighbors.map((id) => findCity(state, id)).filter((c) => c.factionId === state.playerFactionId);
        allies.forEach((to, i) => {
          const x = (i - (allies.length - 1) / 2) * 130;
          this.btn(this.subBtnContainer, `Move_${to.id}`, `移至${to.name}`, new Vec3(x, -140, 0), () => {
            this.act(() => gameEngine.moveGeneral(gid(), to.id));
          }, 120, 36);
        });
        break;
      }
      case '计谋': {
        const state = gameEngine.state!;
        const gens = getStratagemGenerals(state, city.id, 50);
        const enemies = city.neighbors.map((id) => findCity(state, id)).filter((c) => c.factionId !== city.factionId);
        if (gens.length === 0 || enemies.length === 0) {
          this.subInfo.string += '\n（无可用武将或相邻敌城）';
          return;
        }
        const rebuild = () => this.buildCategoryButtons('计谋', city);
        this.buildGeneralPicker(gens, 70, () => rebuild());
        const gid = () => this.subGeneralId ?? gens[0].id;
        row([
          ['鼓舞', () => this.actStratagem(() => gameEngine.inspire(city.id, gid()))],
        ], -50);
        enemies.forEach((e, i) => {
          const x = (i - (enemies.length - 1) / 2) * 155;
          this.btn(this.subBtnContainer, `Fire_${e.id}`, `火计→${e.name}`, new Vec3(x, -95, 0), () => {
            this.actStratagem(() => gameEngine.fireAttack(city.id, gid(), e.id));
          }, 130, 36);
          this.btn(this.subBtnContainer, `Discord_${e.id}`, `离间→${e.name}`, new Vec3(x, -137, 0), () => {
            this.actStratagem(() => gameEngine.sowDiscord(city.id, gid(), e.id));
          }, 130, 36);
          this.btn(this.subBtnContainer, `Disrupt_${e.id}`, `扰乱→${e.name}`, new Vec3(x, -179, 0), () => {
            this.actStratagem(() => gameEngine.disrupt(city.id, gid(), e.id));
          }, 130, 36);
          this.btn(this.subBtnContainer, `Fake_${e.id}`, `伪报→${e.name}`, new Vec3(x, -221, 0), () => {
            this.actStratagem(() => gameEngine.fakeReport(city.id, gid(), e.id));
          }, 130, 36);
        });
        break;
      }
      case '外交': {
        const others = (gameEngine.state && gameEngine.state.factions.filter(
          (f) => f.id !== city.factionId && !f.isEliminated,
        )) || [];
        others.forEach((f, i) => {
          const y = 30 - i * 55;
          this.btn(this.subBtnContainer, `Dip_a_${f.id}`, `同盟${f.name}`, new Vec3(-200, y, 0), () => this.act(() => gameEngine.alliance(f.id)), 110, 38);
          this.btn(this.subBtnContainer, `Dip_t_${f.id}`, `停战${f.name}`, new Vec3(-40, y, 0), () => this.act(() => gameEngine.truce(f.id)), 110, 38);
          this.btn(this.subBtnContainer, `Dip_w_${f.id}`, `宣战${f.name}`, new Vec3(120, y, 0), () => this.act(() => gameEngine.declareWar(f.id)), 110, 38);
          this.btn(this.subBtnContainer, `Dip_g_${f.id}`, `赠礼${f.name}`, new Vec3(260, y, 0), () => this.act(() => gameEngine.gift(f.id, city.id)), 110, 38);
        });
        break;
      }
    }
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

  private cycleCustomRecruit(_cityId: string) {
    const amounts = [50, 100, 200, 500];
    const idx = amounts.indexOf(this.customRecruitAmount);
    this.customRecruitAmount = amounts[(idx + 1) % amounts.length];
    this.toast(`征兵 ${this.customRecruitAmount}`);
    this.doRecruit(this.customRecruitAmount);
  }

  private doRecruit(amount: number) {
    if (!this.selectedCityId) return;
    const max = getMaxRecruitAmount(gameEngine.state!, this.selectedCityId);
    const n = Math.min(amount, max);
    if (n <= 0) { this.toast('无法征兵'); return; }
    this.act(() => gameEngine.recruit(this.selectedCityId!, n));
  }

  private doRecruitMax() {
    if (!this.selectedCityId) return;
    const max = getMaxRecruitAmount(gameEngine.state!, this.selectedCityId);
    if (max <= 0) { this.toast('无法征兵'); return; }
    this.act(() => gameEngine.recruit(this.selectedCityId!, max));
  }

  // ── 出兵 / 战斗 ──

  private openTransportMenu() {
    if (!this.selectedCityId) return;
    const state = gameEngine.state!;
    const from = findCity(state, this.selectedCityId);
    const allies = from.neighbors
      .map((id) => findCity(state, id))
      .filter((c) => c.factionId === state.playerFactionId);
    if (!allies.length) { this.toast('无相邻己方城池'); return; }
    this.clearSubBtns();

    const refreshLabels = () => {
      this.setBtnLabel(this.subBtnContainer.getChildByName('CycleGold')!, `金:${this.customTransportGold}`);
      this.setBtnLabel(this.subBtnContainer.getChildByName('CycleFood')!, `粮:${this.customTransportFood}`);
      this.setBtnLabel(this.subBtnContainer.getChildByName('CycleTroops')!, `兵:${this.customTransportTroops}`);
    };

    this.btn(this.subBtnContainer, 'CycleGold', `金:${this.customTransportGold}`, new Vec3(-200, 80, 0), () => {
      this.customTransportGold = this.customTransportGold === 50 ? 100 : this.customTransportGold === 100 ? 200 : 50;
      refreshLabels();
    }, 100, 32);
    this.btn(this.subBtnContainer, 'CycleFood', `粮:${this.customTransportFood}`, new Vec3(-60, 80, 0), () => {
      this.customTransportFood = this.customTransportFood === 50 ? 100 : this.customTransportFood === 100 ? 200 : 50;
      refreshLabels();
    }, 100, 32);
    this.btn(this.subBtnContainer, 'CycleTroops', `兵:${this.customTransportTroops}`, new Vec3(80, 80, 0), () => {
      this.customTransportTroops = this.customTransportTroops === 100 ? 200 : this.customTransportTroops === 200 ? 500 : 100;
      refreshLabels();
    }, 100, 32);
    allies.forEach((to, i) => {
      const y = 20 - i * 70;
      this.btn(this.subBtnContainer, `T_${to.id}`, `→${to.name} 运输`, new Vec3(0, y, 0), () => {
        this.act(() => gameEngine.transport({
          fromCityId: from.id,
          toCityId: to.id,
          gold: this.customTransportGold,
          food: this.customTransportFood,
          troops: this.customTransportTroops,
        }));
      }, 200, 40);
    });
    this.refreshSubFooter();
  }

  private openDeploy() {
    if (!this.selectedCityId) return;
    const state = gameEngine.state!;
    const from = findCity(state, this.selectedCityId);
    this.deployFromCityId = this.selectedCityId;
    this.deployTroopRatio = 0.7;
    this.deployUseAmbush = false;
    this.deployTryDuel = false;
    this.deploySecondaryId = null;
    this.closeSubPanel();

    const gens = getCityGenerals(state, from.id).filter((g) => g.status !== 'marching' && g.status !== 'injured');
    this.deployGeneralId = gens[0]?.id ?? null;

    this.clearDeployExtras();
    this.refreshDeployPanel(from, gens);
    if (!gens.length) { this.toast('无可用武将'); return; }
    this.deployPanel.active = true;
  }

  private clearDeployExtras() {
    this.deployPanel.children.filter((c) =>
      c.name.startsWith('Target_') || c.name.startsWith('Gen_') ||
      c.name.startsWith('Ratio_') || c.name.startsWith('Ambush_') ||
      c.name.startsWith('Duel_') || c.name.startsWith('Sec_'),
    ).forEach((c) => c.destroy());
  }

  private refreshDeployPortrait(_from: City, gen: General | undefined) {
    this.deployPortraitSlot.destroyAllChildren();
    if (!gen) return;
    const state = gameEngine.state!;
    const faction = state.factions.find((f) => f.id === gen.factionId);
    const node = createPortraitDisplay(
      this.deployPortraitSlot,
      gen,
      '',
      faction?.color ?? '#888888',
      'left',
      100,
      130,
    );
    node.setPosition(0, 0, 0);
    const tag = this.genStatus(gen);
    if (tag) {
      const lb = this.label(this.deployPortraitSlot, 'Status', `[${tag}]`, 14, new Vec3(0, -78, 0), 80);
      lb.color = this.c(COL.textDim);
    }
  }

  private refreshDeployPanel(from: City, gens: General[]) {
    this.clearDeployExtras();
    const state = gameEngine.state!;
    const info = this.getLabel(this.deployPanel, 'DeployInfo');
    const gen = gens.find((g) => g.id === this.deployGeneralId) ?? gens[0];
    this.deployGeneralId = gen?.id ?? null;
    this.refreshDeployPortrait(from, gen);
    const troops = Math.max(Math.floor(from.troops * this.deployTroopRatio), 500);

    if (info && gen) {
      const est = gameEngine.estimateBattle({
        attackerGeneralId: gen.id,
        attackerTroops: troops,
        fromCityId: from.id,
        targetCityId: from.neighbors.find((nid) => {
          const c = findCity(state, nid);
          return c.factionId !== state.playerFactionId;
        }) ?? from.neighbors[0],
        secondaryGeneralId: this.deploySecondaryId ?? undefined,
      });
      const estText = est ? `\n战力 ${est.atkPower} vs ${est.defPower}（${est.label}）` : '';
      info.string = `从 ${from.name} 出兵\n武将 ${gen.name}  兵力 ${troops}/${from.troops}${estText}`;
    }

    gens.forEach((g, i) => {
      const x = (i - (gens.length - 1) / 2) * 130;
      this.btn(this.deployPanel, `Gen_${g.id}`, g.name, new Vec3(x, 300, 0), () => {
        this.deployGeneralId = g.id;
        if (this.deploySecondaryId === g.id) this.deploySecondaryId = null;
        this.refreshDeployPanel(from, gens);
      }, 110, 38, g.id === this.deployGeneralId);
    });

    const secCandidates = gens.filter((g) => g.id !== this.deployGeneralId);
    if (secCandidates.length) {
      this.btn(this.deployPanel, 'Sec_none', this.deploySecondaryId ? '副将:无' : '副将:无', new Vec3(-200, 260, 0), () => {
        this.deploySecondaryId = null;
        this.refreshDeployPanel(from, gens);
      }, 100, 32, !this.deploySecondaryId);
      secCandidates.forEach((g, i) => {
        const x = -100 + i * 110;
        this.btn(this.deployPanel, `Sec_${g.id}`, g.name, new Vec3(x, 260, 0), () => {
          this.deploySecondaryId = g.id;
          this.refreshDeployPanel(from, gens);
        }, 100, 32, g.id === this.deploySecondaryId);
      });
    }

    [[0.5, '半数'], [0.7, '七成'], [1.0, '全军']].forEach(([ratio, label], i) => {
      const x = (i - 1) * 140;
      this.btn(this.deployPanel, `Ratio_${ratio}`, label as string, new Vec3(x, 240, 0), () => {
        this.deployTroopRatio = ratio as number;
        this.refreshDeployPanel(from, gens);
      }, 100, 36, this.deployTroopRatio === ratio);
    });

    this.btn(this.deployPanel, 'Ambush_toggle', this.deployUseAmbush ? '伏兵:开' : '伏兵:关', new Vec3(-100, 180, 0), () => {
      this.deployUseAmbush = !this.deployUseAmbush;
      this.refreshDeployPanel(from, gens);
    }, 120, 36, this.deployUseAmbush);

    this.btn(this.deployPanel, 'Duel_toggle', this.deployTryDuel ? '一骑讨:开' : '一骑讨:关', new Vec3(100, 180, 0), () => {
      this.deployTryDuel = !this.deployTryDuel;
      this.refreshDeployPanel(from, gens);
    }, 120, 36, this.deployTryDuel);

    this.clearDeployTargets();
    const enemies = from.neighbors.map((id) => findCity(state, id)).filter((c) => c.factionId !== state.playerFactionId);
    enemies.forEach((t, i) => {
      const y = 60 - i * 52;
      this.btn(this.deployPanel, `Target_${t.id}`, `进攻 ${t.name}（${this.fname(state, t.factionId)} ${t.troops}兵）`, new Vec3(0, y, 0), () => {
        this.launchAttack(t.id);
      }, 400, 42);
    });
    if (!enemies.length) this.toast('无相邻敌城');
  }

  private clearDeployTargets() {
    this.deployPanel.children.filter((c) => c.name.startsWith('Target_')).forEach((c) => c.destroy());
  }

  private launchAttack(targetId: string) {
    if (!this.deployFromCityId || !this.deployGeneralId) return;
    const state = gameEngine.state!;
    const from = findCity(state, this.deployFromCityId);
    const target = findCity(state, targetId);
    const attacker = findGeneral(state, this.deployGeneralId);
    const defender = getDefendingGeneral(state, targetId);
    const atkFaction = state.factions.find((f) => f.id === attacker.factionId);
    const defFaction = state.factions.find((f) => f.id === target.factionId);

    const troops = Math.min(Math.max(Math.floor(from.troops * this.deployTroopRatio), 500), from.troops);
    const input: BattleInput = {
      attackerGeneralId: this.deployGeneralId,
      attackerTroops: troops,
      fromCityId: this.deployFromCityId,
      targetCityId: targetId,
      stratagemId: this.deployUseAmbush ? 'ambush' : undefined,
      secondaryGeneralId: this.deploySecondaryId ?? undefined,
      tryDuel: this.deployTryDuel,
    };

    this.deployPanel.active = false;
    this.clearDeployExtras();

    const runBattle = (modifier = 1) => {
      input.tacticalModifier = modifier;
      if (this.gameSettings.battleCutscene) {
        playBattleCutscene({
          parent: this.root,
          attacker,
          defender,
          attackerFactionColor: atkFaction?.color ?? '#3366CC',
          defenderFactionColor: defFaction?.color ?? '#CC3333',
          targetCityName: target.name,
          attackerTroops: troops,
          defenderTroops: target.troops,
          onMidpoint: () => {
            audioManager.playBattle();
            this.battleResult = gameEngine.attack(input);
          },
          onDone: () => this.finishBattle(targetId),
        });
      } else {
        audioManager.playBattle();
        this.battleResult = gameEngine.attack(input);
        this.finishBattle(targetId);
      }
    };

    if (this.gameSettings.tacticalBattle) {
      buildTacticalBattlePanel(this.root, state, input, (res) => {
        if (res.retreated) {
          this.toast('全军退却，取消进攻');
          return;
        }
        runBattle(res.modifier);
      });
    } else {
      runBattle(1);
    }
  }

  private battleResult: BattleResult | null = null;

  private finishBattle(targetId: string) {
    const result = this.battleResult;
    this.battleResult = null;
    if (!result) return;

    const cityNode = this.mapNodes.get(targetId);
    const done = () => {
      if (result.cityCaptured) {
        audioManager.playCapture();
        if (cityNode) pulseCapture(cityNode);
      }
      this.refreshMap();
      this.showBattleReport(result);
    };

    if (cityNode) {
      flashCity(cityNode, !!result.cityCaptured, done);
    } else {
      done();
    }
  }

  private showBattleReport(result: BattleResult) {
    this.battlePanel.active = true;
    this.setLabelText(this.battlePanel, 'Report', '');
    const lines = result.log;
    lines.forEach((line, i) => {
      this.scheduleOnce(() => {
        const prev = this.getLabel(this.battlePanel, 'Report')?.string ?? '';
        this.setLabelText(this.battlePanel, 'Report', prev ? `${prev}\n${line}` : line);
      }, i * 0.28);
    });
  }

  private onEndTurn() {
    const summary = gameEngine.getTurnEndSummary();
    const msg = summary
      ? `${summary}\n\n结束本回合？\n电脑将行动并进行月结算`
      : '结束本回合？\n电脑将行动并进行月结算';
    if (this.gameSettings.confirmEndTurn) {
      this.showConfirm(msg, () => this.doEndTurn());
    } else {
      this.doEndTurn();
    }
  }

  private doEndTurn() {
    this.closeSubPanel();
    this.selectedCityId = null;
    audioManager.playTurnEnd();
    const delay = this.gameSettings.skipAiOverlay ? 0.05 : 0.75;
    if (!this.gameSettings.skipAiOverlay) this.turnOverlay.active = true;
    this.scheduleOnce(() => {
      const before = gameEngine.state;
      const r = gameEngine.endTurn();
      this.turnOverlay.active = false;
      this.toast(r.message);
      const after = gameEngine.state;
      if (before && after && (before.year !== after.year || before.month !== after.month)) {
        this.showMonthBanner(`${after.year}年 ${after.month}月`);
      }
      this.refreshMap();
      if (gameEngine.state?.phase === 'ended') this.showEndScreen();
    }, delay);
  }

  private showEndScreen() {
    const state = gameEngine.state;
    if (!state) return;
    const won = state.winnerFactionId === state.playerFactionId;
    const summary = gameEngine.getTurnEndSummary();
    const titleLb = this.getLabel(this.endLayer, 'EndTitle');
    if (titleLb) {
      titleLb.string = won ? '天下统一！' : '势力覆灭';
      titleLb.color = won ? this.c(COL.textGold) : this.c({ r: 255, g: 130, b: 100, a: 255 });
    }
    this.setLabelText(
      this.endLayer,
      'EndMsg',
      won
        ? `历经 ${state.turn} 回合，群雄尽伏\n${summary}`
        : `第 ${state.turn} 回合，国祚已尽\n${summary}`,
    );
    if (titleLb) {
      titleLb.node.setScale(0.5, 0.5, 1);
      tween(titleLb.node)
        .to(0.45, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .start();
    }
    this.showScreen('end');
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
