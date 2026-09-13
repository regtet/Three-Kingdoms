import {
  BlockInputEvents,
  Button,
  Component,
  Graphics,
  Label,
  Node,
  UITransform,
  Vec3,
} from 'cc';
import { gameEngine } from '../../core/game/GameEngine';
import { getMapLayout } from '../../core/data/scenarios/index';
import { getFactionFoodTotal, getFactionGoldTotal } from '../../core/systems/diplomacy';
import { saveToStorage, getActiveSlot } from '../../core/systems/save';
import { getCityStateView } from '../../core/utils/cityState';
import { findCity } from '../../core/utils/helpers';
import { audioManager } from '../../ui/AudioManager';
import { createPortraitDisplay } from '../../ui/GeneralPortrait';
import { drawPanel, toColor } from '../../ui/UiDraw';
import {
  MAP_CMD_CATEGORIES,
  MAP_CMD_COLORS,
  RL,
  RC,
  remakeMapCoord,
  type MapCmdCategory,
} from '../shared/RemakeLayout';
import { remakeColor, remakeLabel } from '../shared/RemakeWidgets';
import { openDomesticPanel } from '../play/DomesticPanel';
import { openMilitaryPanel } from '../play/MilitaryPanel';
import { REMAKE_BUILD_TAG } from '../version';
import { drawRemakeStrategicMap, hexToRgb } from './MapDraw';

export type MapScreenCallbacks = {
  onBackToTitle: () => void;
  onToast: (msg: string) => void;
};

export type MapScreenApi = {
  refresh: () => void;
};

function drawChromePanel(g: Graphics, w: number, h: number) {
  drawPanel(g, w, h, toColor(RC.chrome), toColor(RC.chromeBorder), 4);
}

function drawSquareCmd(g: Graphics, size: number, accent: { r: number; g: number; b: number; a: number }) {
  g.clear();
  g.fillColor = toColor(RC.cmdFaceTop);
  g.roundRect(-size / 2, -size / 2 + 2, size, size - 2, 10);
  g.fill();
  g.fillColor = toColor(RC.cmdFace);
  g.roundRect(-size / 2, -size / 2, size, size - 4, 10);
  g.fill();
  g.strokeColor = toColor(RC.chromeBorder);
  g.lineWidth = 2;
  g.roundRect(-size / 2, -size / 2, size, size - 4, 10);
  g.stroke();
  g.fillColor = toColor(accent);
  g.roundRect(-size / 2 + 8, size / 2 - 18, size - 16, 6, 2);
  g.fill();
}

function drawSideBtn(g: Graphics, w: number, h: number, primary: boolean) {
  g.clear();
  const face = primary ? RC.cmdFaceTop : RC.chrome;
  drawPanel(g, w, h, toColor(face), toColor(primary ? RC.border : RC.chromeBorder), 6);
}

/** 战略地图主框架（对齐官方结构，一次只改这一屏） */
export function createMapScreen(layer: Node, host: Component, cb: MapScreenCallbacks): MapScreenApi {
  layer.destroyAllChildren();

  const bg = new Node('MapBg');
  layer.addChild(bg);
  bg.addComponent(UITransform).setContentSize(RL.W, RL.H);
  drawPanel(bg.addComponent(Graphics), RL.W, RL.H, toColor(RC.bg), toColor({ r: 0, g: 0, b: 0, a: 0 }), 0);

  // ── 日期条 ──
  const dateBar = new Node('DateBar');
  layer.addChild(dateBar);
  dateBar.setPosition(0, RL.MAP_DATE_Y, 0);
  dateBar.addComponent(UITransform).setContentSize(RL.MAP_STATUS_W, RL.MAP_DATE_H);
  drawChromePanel(dateBar.addComponent(Graphics), RL.MAP_STATUS_W, RL.MAP_DATE_H);
  const dateLb = remakeLabel(dateBar, 'Date', '', 16, new Vec3(-200, 0, 0), 280);
  dateLb.horizontalAlign = Label.HorizontalAlign.LEFT;
  dateLb.color = remakeColor(RC.chromeText);
  const cityNameLb = remakeLabel(dateBar, 'CityName', '', 18, new Vec3(160, 0, 0), 280);
  cityNameLb.horizontalAlign = Label.HorizontalAlign.RIGHT;
  cityNameLb.color = remakeColor(RC.chromeText);

  // ── 立绘 + 数值网格 ──
  const status = new Node('Status');
  layer.addChild(status);
  status.setPosition(0, RL.MAP_STATUS_Y, 0);
  status.addComponent(UITransform).setContentSize(RL.MAP_STATUS_W, RL.MAP_STATUS_H);
  drawChromePanel(status.addComponent(Graphics), RL.MAP_STATUS_W, RL.MAP_STATUS_H);

  const portraitSlot = new Node('Portrait');
  status.addChild(portraitSlot);
  portraitSlot.setPosition(RL.MAP_PORTRAIT_X, 0, 0);
  portraitSlot.addComponent(UITransform).setContentSize(RL.MAP_PORTRAIT_W, RL.MAP_PORTRAIT_H);

  const fieldsRoot = new Node('Fields');
  status.addChild(fieldsRoot);
  fieldsRoot.setPosition(0, 0, 0);

  // ── 地图 ──
  const mapArea = new Node('MapArea');
  layer.addChild(mapArea);
  mapArea.setPosition(0, RL.MAP_AREA_Y, 0);
  mapArea.addComponent(UITransform).setContentSize(RL.MAP_AREA_W, RL.MAP_AREA_H);
  const mapGfxNode = new Node('MapGfx');
  mapArea.addChild(mapGfxNode);
  mapGfxNode.addComponent(UITransform).setContentSize(RL.MAP_AREA_W, RL.MAP_AREA_H);
  const mapG = mapGfxNode.addComponent(Graphics);
  const cityLayer = new Node('Cities');
  mapArea.addChild(cityLayer);
  const bubbleLb = remakeLabel(mapArea, 'BubbleName', '', 14, new Vec3(0, 0, 0), 70);
  bubbleLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  bubbleLb.color = remakeColor(RC.chromeText);
  bubbleLb.node.active = false;

  // ── 右三键：情报 / 機能 / 進行 ──
  const sideRoot = new Node('SideRoot');
  layer.addChild(sideRoot);
  const sideDefs: [string, number, () => void][] = [
    ['情报', RL.MAP_SIDE_Y1, () => {
      if (!selectedCityId) {
        cb.onToast('请先选择城池');
        return;
      }
      cb.onToast(gameEngine.getCityStateBrief(selectedCityId));
    }],
    ['機能', RL.MAP_SIDE_Y2, () => toggleFuncMenu()],
    ['进行', RL.MAP_SIDE_Y3, () => {
      if (panelOpen) {
        cb.onToast('请先关闭命令面板');
        return;
      }
      doEndTurn();
    }],
  ];
  for (const [text, y, action] of sideDefs) {
    const btn = new Node(`Side_${text}`);
    sideRoot.addChild(btn);
    btn.setPosition(RL.MAP_SIDE_X, y, 0);
    btn.addComponent(UITransform).setContentSize(RL.MAP_SIDE_W, RL.MAP_SIDE_H);
    drawSideBtn(btn.addComponent(Graphics), RL.MAP_SIDE_W, RL.MAP_SIDE_H, text === '进行');
    const lb = remakeLabel(btn, 'L', text, 18, new Vec3(0, 0, 0), RL.MAP_SIDE_W - 6);
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
    lb.color = remakeColor(RC.chromeText);
    btn.addComponent(Button);
    btn.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      action();
    }, host);
  }

  // 機能弹出
  const funcMenu = new Node('FuncMenu');
  layer.addChild(funcMenu);
  funcMenu.active = false;
  funcMenu.setPosition(RL.MAP_SIDE_X - 110, RL.MAP_SIDE_Y2, 0);
  funcMenu.addComponent(UITransform).setContentSize(160, 140);
  funcMenu.addComponent(BlockInputEvents);
  drawChromePanel(funcMenu.addComponent(Graphics), 160, 140);
  const funcItems: [string, () => void][] = [
    ['存档', () => {
      const state = gameEngine.state;
      if (!state) {
        cb.onToast('无进行中的游戏');
        return;
      }
      saveToStorage(state);
      cb.onToast(`已存档（槽位 ${getActiveSlot() + 1}）`);
      funcMenu.active = false;
    }],
    ['回标题', () => {
      funcMenu.active = false;
      if (panelOpen) closeCmdPanel();
      cb.onBackToTitle();
    }],
    ['关闭', () => {
      funcMenu.active = false;
    }],
  ];
  funcItems.forEach(([text, fn], i) => {
    const y = 40 - i * 42;
    const b = new Node(`Func_${text}`);
    funcMenu.addChild(b);
    b.setPosition(0, y, 0);
    b.addComponent(UITransform).setContentSize(140, 36);
    drawSideBtn(b.addComponent(Graphics), 140, 36, false);
    const lb = remakeLabel(b, 'L', text, 16, new Vec3(0, 0, 0), 130);
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
    lb.color = remakeColor(RC.chromeText);
    b.addComponent(Button);
    b.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      fn();
    }, host);
  });

  function toggleFuncMenu() {
    funcMenu.active = !funcMenu.active;
  }

  // ── 底五键大方块 ──
  const cmdBar = new Node('CmdBar');
  layer.addChild(cmdBar);
  cmdBar.setPosition(0, RL.MAP_CMD_Y, 0);
  MAP_CMD_CATEGORIES.forEach((cat, i) => {
    const x = RL.MAP_CMD_START_X + i * RL.MAP_CMD_GAP;
    const btn = new Node(`Cmd_${cat}`);
    cmdBar.addChild(btn);
    btn.setPosition(x, 0, 0);
    btn.addComponent(UITransform).setContentSize(RL.MAP_CMD_SIZE, RL.MAP_CMD_SIZE);
    drawSquareCmd(btn.addComponent(Graphics), RL.MAP_CMD_SIZE, MAP_CMD_COLORS[cat]);
    const lb = remakeLabel(btn, 'L', cat, 20, new Vec3(0, -8, 0), RL.MAP_CMD_SIZE - 12);
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
    lb.color = remakeColor(RC.chromeText);
    btn.addComponent(Button);
    btn.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      openCmdPanel(cat);
    }, host);
  });

  const panelHost = new Node('PanelHost');
  layer.addChild(panelHost);

  const tag = remakeLabel(
    layer,
    'BuildTag',
    REMAKE_BUILD_TAG,
    12,
    new Vec3(RL.TITLE_BUILD_X, RL.TITLE_BUILD_Y, 0),
    140,
  );
  tag.color = remakeColor(RC.textDim);
  tag.horizontalAlign = Label.HorizontalAlign.RIGHT;

  let selectedCityId: string | null = null;
  let prevSelectedCityId: string | null = null;
  let panelOpen = false;
  let panelHandle: { destroy: () => void } | null = null;
  let citiesBuiltScenario: string | null = null;
  const cityGfx = new Map<string, { g: Graphics; factionId: string }>();

  function setMapChromeVisible(visible: boolean) {
    cmdBar.active = visible;
    sideRoot.active = visible;
    if (!visible) funcMenu.active = false;
  }

  function closeCmdPanel() {
    panelHandle?.destroy();
    panelHandle = null;
    panelHost.destroyAllChildren();
    panelOpen = false;
    setMapChromeVisible(true);
  }

  function openCmdPanel(cat: MapCmdCategory) {
    if (panelOpen) return;
    const state = gameEngine.state;
    if (!state) {
      cb.onToast('无进行中的游戏');
      return;
    }
    if (!selectedCityId) {
      cb.onToast('请先选择城池');
      return;
    }
    const city = findCity(state, selectedCityId);
    if (city.factionId !== state.playerFactionId) {
      cb.onToast('只能对自己的城池下令');
      return;
    }
    if (cat === '内政') {
      setMapChromeVisible(false);
      panelOpen = true;
      panelHandle = openDomesticPanel(panelHost, host, selectedCityId, {
        onClose: () => closeCmdPanel(),
        onToast: cb.onToast,
        onActionDone: () => refresh({ forceCities: true }),
      });
      return;
    }
    if (cat === '军事') {
      setMapChromeVisible(false);
      panelOpen = true;
      panelHandle = openMilitaryPanel(panelHost, host, selectedCityId, {
        onClose: () => closeCmdPanel(),
        onToast: cb.onToast,
        onActionDone: () => refresh({ forceCities: true }),
      });
      return;
    }
    cb.onToast(`「${cat}」命令面板将在后续复刻`);
  }

  function doEndTurn() {
    const r = gameEngine.endTurn();
    cb.onToast(r.message);
    refresh({ forceCities: true });
  }

  function paintCityDot(g: Graphics, col: { r: number; g: number; b: number; a: number }, selected: boolean) {
    g.clear();
    g.fillColor = toColor({ r: 255, g: 255, b: 255, a: 220 });
    g.circle(0, 0, selected ? 16 : 13);
    g.fill();
    g.fillColor = toColor(col);
    g.circle(0, 0, selected ? 12 : 10);
    g.fill();
    g.strokeColor = toColor(selected ? RC.selectRing : { r: 40, g: 40, b: 50, a: 200 });
    g.lineWidth = selected ? 3 : 1;
    g.circle(0, 0, selected ? 16 : 13);
    g.stroke();
  }

  function syncCities(force = false, selectionOnly = false) {
    const state = gameEngine.state;
    if (!state) return;
    const layout = getMapLayout(state.scenarioId);
    const needRebuild = force || citiesBuiltScenario !== state.scenarioId || cityGfx.size === 0;

    if (needRebuild) {
      cityLayer.destroyAllChildren();
      cityGfx.clear();
      citiesBuiltScenario = state.scenarioId;
      for (const c of layout) {
        const city = findCity(state, c.id);
        const fac = state.factions.find((f) => f.id === city.factionId);
        const pos = remakeMapCoord(c.x, c.y);
        const node = new Node(`City_${c.id}`);
        cityLayer.addChild(node);
        node.setPosition(pos.x, pos.y, 0);
        node.addComponent(UITransform).setContentSize(RL.MAP_CITY_HIT, RL.MAP_CITY_HIT);
        const g = node.addComponent(Graphics);
        const col = fac ? hexToRgb(fac.color) : RC.textDim;
        paintCityDot(g, col, selectedCityId === c.id);
        cityGfx.set(c.id, { g, factionId: city.factionId });
        const nameLb = remakeLabel(node, 'Name', c.name, 11, new Vec3(0, -20, 0), 64);
        nameLb.horizontalAlign = Label.HorizontalAlign.CENTER;
        nameLb.color = remakeColor({ r: 250, g: 250, b: 245, a: 255 });
        node.addComponent(Button);
        node.on(Button.EventType.CLICK, () => {
          if (panelOpen) return;
          audioManager.playClick();
          if (selectedCityId === c.id) return;
          prevSelectedCityId = selectedCityId;
          selectedCityId = c.id;
          refresh({ light: true });
        }, host);
      }
      prevSelectedCityId = selectedCityId;
      return;
    }

    const paintOne = (id: string | null) => {
      if (!id) return;
      const ref = cityGfx.get(id);
      if (!ref) return;
      const city = findCity(state, id);
      const fac = state.factions.find((f) => f.id === city.factionId);
      const col = fac ? hexToRgb(fac.color) : RC.textDim;
      ref.factionId = city.factionId;
      paintCityDot(ref.g, col, selectedCityId === id);
    };

    if (selectionOnly) {
      paintOne(prevSelectedCityId);
      paintOne(selectedCityId);
      prevSelectedCityId = selectedCityId;
      return;
    }

    for (const c of layout) {
      paintOne(c.id);
    }
    prevSelectedCityId = selectedCityId;
  }

  function refreshStatusPanel() {
    const state = gameEngine.state;
    portraitSlot.destroyAllChildren();
    fieldsRoot.destroyAllChildren();
    if (!state || !selectedCityId) {
      cityNameLb.string = '';
      return;
    }
    const view = getCityStateView(state, selectedCityId);
    const c = view.city;
    cityNameLb.string = c.name;
    const fac = state.factions.find((f) => f.id === c.factionId);
    const face = view.governor ?? view.generals[0] ?? null;
    if (face) {
      const node = createPortraitDisplay(
        portraitSlot,
        face,
        '',
        fac?.color ?? '#888',
        'embed',
        RL.MAP_PORTRAIT_W,
        RL.MAP_PORTRAIT_H,
      );
      node.setPosition(0, 0, 0);
    } else {
      const ph = new Node('Empty');
      portraitSlot.addChild(ph);
      ph.addComponent(UITransform).setContentSize(RL.MAP_PORTRAIT_W, RL.MAP_PORTRAIT_H);
      drawPanel(
        ph.addComponent(Graphics),
        RL.MAP_PORTRAIT_W,
        RL.MAP_PORTRAIT_H,
        toColor(RC.chromeDark),
        toColor(RC.chromeBorder),
        4,
      );
    }

    const goldTotal = getFactionGoldTotal(state, state.playerFactionId);
    const foodTotal = getFactionFoodTotal(state, state.playerFactionId);
    const cells: [string, string][] = [
      ['势力', view.factionName],
      ['太守', view.governor?.name ?? '无'],
      ['现役', `${view.generals.length}`],
      ['金', `${c.gold}`],
      ['兵粮', `${c.food}`],
      ['兵士', `${c.troops}`],
      ['国库金', `${goldTotal}`],
      ['国库粮', `${foodTotal}`],
      ['民忠', `${c.loyalty}`],
      ['商业', `${c.commerce}`],
      ['农业', `${c.agriculture}`],
      ['可动', `${view.actableGeneralCount}`],
    ];

    const cols = RL.MAP_STAT_COLS;
    cells.forEach(([label, val], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = RL.MAP_STAT_ORIGIN_X + col * (RL.MAP_STAT_CELL_W + RL.MAP_STAT_GAP_X);
      const y = RL.MAP_STAT_ORIGIN_Y - row * (RL.MAP_STAT_CELL_H + RL.MAP_STAT_GAP_Y);
      const cell = new Node(`C_${label}`);
      fieldsRoot.addChild(cell);
      cell.setPosition(x, y, 0);
      cell.addComponent(UITransform).setContentSize(RL.MAP_STAT_CELL_W, RL.MAP_STAT_CELL_H);
      drawPanel(
        cell.addComponent(Graphics),
        RL.MAP_STAT_CELL_W,
        RL.MAP_STAT_CELL_H,
        toColor(RC.chromeField),
        toColor(RC.chromeBorder),
        2,
      );
      const lb = remakeLabel(
        cell,
        'T',
        `${label} ${val}`,
        12,
        new Vec3(0, 0, 0),
        RL.MAP_STAT_CELL_W - 6,
      );
      lb.horizontalAlign = Label.HorizontalAlign.CENTER;
      lb.color = remakeColor(RC.chromeText);
      lb.overflow = Label.Overflow.SHRINK;
    });
  }

  function refreshBubble() {
    const state = gameEngine.state;
    if (!state || !selectedCityId) {
      bubbleLb.node.active = false;
      return;
    }
    const layout = getMapLayout(state.scenarioId).find((c) => c.id === selectedCityId);
    if (!layout) {
      bubbleLb.node.active = false;
      return;
    }
    const pos = remakeMapCoord(layout.x, layout.y);
    bubbleLb.node.active = true;
    bubbleLb.node.setPosition(pos.x, pos.y + 18 + RL.MAP_BUBBLE_H / 2, 0);
    bubbleLb.string = layout.name;
  }

  function refresh(opts?: { light?: boolean; forceCities?: boolean }) {
    const state = gameEngine.state;
    if (!state) {
      dateLb.string = '无存档';
      return;
    }
    dateLb.string = `${state.year}年 ${state.month}月　第${state.turn}回合`;

    if (selectedCityId && !state.cities.some((c) => c.id === selectedCityId)) {
      selectedCityId = null;
    }
    if (!selectedCityId) {
      const own = state.cities.find((c) => c.factionId === state.playerFactionId);
      selectedCityId = own?.id ?? state.cities[0]?.id ?? null;
    }

    const layout = getMapLayout(state.scenarioId);
    if (!opts?.light) {
      drawRemakeStrategicMap(mapG, state, layout, selectedCityId);
    } else {
      drawRemakeStrategicMap(mapG, state, layout, selectedCityId);
    }
    syncCities(!!opts?.forceCities, !!opts?.light);
    refreshStatusPanel();
    refreshBubble();
  }

  return { refresh: () => refresh() };
}
