import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import type { ScenarioData } from '../core/models/types';
import { applyCustomGeneralsToScenario } from '../core/utils/customGenerals';
import { audioManager } from '../ui/AudioManager';
import { playIntroVideo } from '../ui/IntroVideo';
import { loadSettings } from '../ui/GameSettings';
import { REMAKE_BUILD_TAG } from './version';
import { RemakeNav, type MenuScreenId } from './shared/RemakeNav';
import { RL } from './shared/RemakeLayout';
import { remakeLabel, createScreenLayer } from './shared/RemakeWidgets';
import { buildTitleScreen } from './menu/TitleScreen';
import { buildScenarioScreen } from './menu/ScenarioScreen';
import { buildFactionScreen } from './menu/FactionScreen';
import { buildSettingsScreen, requestExitApp } from './menu/SettingsScreen';
import { buildSaveListScreen } from './menu/SaveListScreen';
import { buildMapStubScreen } from './map/MapStubScreen';

const { ccclass } = _decorator;

/**
 * 复刻 UI 根：替代 legacy GameRoot。
 * 阶段3：菜单完整；阶段4/5：占位。
 */
@ccclass('RemakeRoot')
export class RemakeRoot extends Component {
  private root!: Node;
  private nav = new RemakeNav();
  private layers: Record<MenuScreenId, Node> = {} as Record<MenuScreenId, Node>;
  private pendingScenario: ScenarioData | null = null;
  private sessionInfo = '';

  onLoad() {
    console.log(`[RemakeRoot] ${REMAKE_BUILD_TAG}`);
    const settings = loadSettings();
    audioManager.applySettings(settings);

    this.root = new Node('RemakeRoot');
    this.node.addChild(this.root);
    this.root.addComponent(UITransform).setContentSize(RL.W, RL.H);

    const ids: MenuScreenId[] = ['title', 'scenario', 'faction', 'saveList', 'settings', 'mapStub', 'end'];
    for (const id of ids) {
      this.layers[id] = createScreenLayer(this.root, id);
      this.nav.register(id, this.layers[id]);
    }

    this.nav.setOnShow((id) => {
      if (id === 'title' || id === 'scenario' || id === 'faction' || id === 'settings' || id === 'saveList') {
        audioManager.startMenuBgm();
      }
    });

    playIntroVideo(this.root, () => this.showTitle());
  }

  private showTitle() {
    buildTitleScreen(this.layers.title, this, {
      onNewGame: () => this.showScenario(),
      onContinue: () => this.showSaveList(),
      onSettings: () => this.showSettings(),
      onExit: () => requestExitApp(),
    });
    this.nav.show('title');
  }

  private showScenario() {
    buildScenarioScreen(
      this.layers.scenario,
      this,
      (sc) => {
        this.pendingScenario = {
          ...sc,
          generals: applyCustomGeneralsToScenario(sc.generals.map((g) => ({ ...g }))),
        };
        this.showFaction();
      },
      () => this.showTitle(),
    );
    this.nav.show('scenario');
  }

  private showFaction() {
    if (!this.pendingScenario) return;
    const sc = this.pendingScenario;
    buildFactionScreen(
      this.layers.faction,
      this,
      sc,
      (factionId) => this.startNewGame(sc, factionId),
      () => this.showScenario(),
    );
    this.nav.show('faction');
  }

  private showSettings() {
    buildSettingsScreen(this.layers.settings, this, () => this.showTitle());
    this.nav.show('settings');
  }

  private showSaveList() {
    buildSaveListScreen(
      this.layers.saveList,
      this,
      (slot) => this.loadSlot(slot),
      () => this.showTitle(),
    );
    this.nav.show('saveList');
  }

  private startNewGame(scenario: ScenarioData, factionId: string) {
    gameEngine.newGame(scenario, factionId);
    audioManager.startGameBgm();
    const fac = scenario.factions.find((f) => f.id === factionId);
    this.sessionInfo =
      `剧本：${scenario.name}\n势力：${fac?.name ?? factionId}\n` +
      `城池 ${scenario.cities.length} · 武将 ${scenario.generals.length}\n\n` +
      `核心逻辑已开局（GameEngine）。\n地图与命令 UI 将在阶段4/5复刻。`;
    this.showMapStub();
  }

  private loadSlot(slot: number) {
    const state = gameEngine.loadGameFromSlot(slot);
    if (!state) {
      this.toast('读档失败或槽位为空');
      return;
    }
    audioManager.startGameBgm();
    this.sessionInfo =
      `读档槽 ${slot + 1}\n${state.year}年${state.month}月 · 第${state.turn}回合\n\n` +
      `核心状态已载入。地图 UI 阶段4复刻。`;
    this.showMapStub();
  }

  private showMapStub() {
    buildMapStubScreen(this.layers.mapStub, this, this.sessionInfo, () => {
      audioManager.startMenuBgm();
      this.showTitle();
    });
    this.nav.show('mapStub');
  }

  private toast(msg: string) {
    const old = this.root.getChildByName('Toast');
    old?.destroy();
    remakeLabel(this.root, 'Toast', msg, 18, new Vec3(0, RL.TOAST_Y, 0), 640);
    this.unschedule(this.clearToast);
    this.scheduleOnce(this.clearToast, 2.2);
  }

  private clearToast = () => {
    this.root.getChildByName('Toast')?.destroy();
  };
}
