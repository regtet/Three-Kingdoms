import {
  _decorator,
  Component,
  Node,
  UIOpacity,
  UITransform,
  view,
} from 'cc';
import { REMAKE_BUILD_TAG } from './version';
import { buildTitleScreen } from './menu/TitleScreen';
import { buildScenarioScreen } from './menu/ScenarioScreen';
import { buildRulerScreen } from './menu/RulerScreen';
import { buildContinueScreen } from './menu/ContinueScreen';
import { buildGalleryScreen } from './menu/GalleryScreen';
import { buildSettingsScreen } from './menu/SettingsScreen';
import {
  buildPlayStubScreen,
  linesForLoad,
  linesForNewGame,
} from './menu/PlayStubScreen';
import { fadeOpacity, setOpacity } from './shared/MenuChrome';
import { debugAdaptInfo, getVisibleDesignSize, matchVisibleSize } from './shared/ScreenAdapt';
import { RL } from './shared/RemakeLayout';
import { type MenuLayerId } from './shared/MenuSpec';
import { addSave, listSaves, type SaveSlot } from './shared/SaveStore';
import type { ScenarioDef } from './shared/MenuCatalog';

const { ccclass } = _decorator;

@ccclass('RemakeRoot')
export class RemakeRoot extends Component {
  private shell!: Node;
  private layers: Partial<Record<MenuLayerId, Node>> = {};
  private current: MenuLayerId | null = null;
  private transitioning = false;
  private booted = false;
  private selectedScenario: ScenarioDef | null = null;

  onLoad() {
    console.log(`[RemakeRoot] ${REMAKE_BUILD_TAG}`);

    this.node.setPosition(0, 0, 0);
    const ui = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    ui.setAnchorPoint(0.5, 0.5);

    this.shell = new Node('RemakeShell');
    this.node.addChild(this.shell);
    this.shell.addComponent(UITransform).setAnchorPoint(0.5, 0.5);

    const ids: MenuLayerId[] = [
      'title',
      'scenario',
      'ruler',
      'continue',
      'gallery',
      'settings',
      'play',
    ];
    for (const id of ids) {
      const layer = new Node(`Layer_${id}`);
      this.shell.addChild(layer);
      layer.addComponent(UITransform).setAnchorPoint(0.5, 0.5);
      layer.addComponent(UIOpacity).opacity = 255;
      layer.active = false;
      this.layers[id] = layer;
    }

    view.on('canvas-resize', this.onResize, this);
    this.scheduleOnce(() => void this.boot(true), 0);
  }

  onDestroy() {
    view.off('canvas-resize', this.onResize, this);
  }

  private onResize = () => {
    if (!this.booted || this.transitioning) return;
    this.scheduleOnce(() => void this.rebuildCurrent(), 0);
  };

  private syncLayerSizes() {
    const vis = getVisibleDesignSize();
    matchVisibleSize(this.node, vis);
    matchVisibleSize(this.shell, vis);
    for (const id of Object.keys(this.layers) as MenuLayerId[]) {
      const layer = this.layers[id];
      if (layer) matchVisibleSize(layer, vis);
    }
    console.log('[RemakeRoot]', debugAdaptInfo());
  }

  private async boot(first: boolean) {
    this.syncLayerSizes();
    this.booted = true;
    await this.openTitle(first);
  }

  private async rebuildCurrent() {
    if (!this.current) return;
    this.syncLayerSizes();
    switch (this.current) {
      case 'title':
        await this.openTitle(false);
        break;
      case 'scenario':
        await this.openScenario();
        break;
      case 'ruler':
        if (this.selectedScenario) await this.openRuler(this.selectedScenario.id);
        break;
      case 'continue':
        await this.openContinue();
        break;
      case 'gallery':
        await this.openGallery();
        break;
      case 'settings':
        await this.openSettings();
        break;
      default:
        break;
    }
  }

  private titleCallbacks() {
    return {
      onNewGame: () => void this.openScenario(),
      onContinue: () => void this.openContinue(),
      onGallery: () => void this.openGallery(),
      onSettings: () => void this.openSettings(),
    };
  }

  private async openTitle(first: boolean) {
    const layer = this.layers.title!;
    await buildTitleScreen(layer, this.titleCallbacks(), {
      forceIntro: first ? undefined : false,
    });
    if (first) {
      layer.active = true;
      this.current = 'title';
    } else {
      await this.transitionTo('title');
    }
  }

  private async openScenario() {
    if (this.transitioning) return;
    await buildScenarioScreen(this.layers.scenario!, {
      onPick: (sc) => {
        this.selectedScenario = sc;
        void this.openRuler(sc.id);
      },
      onBack: () => void this.backToTitle(),
    });
    await this.transitionTo('scenario');
  }

  private async openRuler(scenarioId: string) {
    if (this.transitioning) return;
    await buildRulerScreen(this.layers.ruler!, {
      scenarioId,
      onConfirm: (ruler) => {
        const sc = this.selectedScenario;
        if (!sc) return;
        addSave({
          scenarioId: sc.id,
          scenarioName: sc.name,
          rulerName: ruler.name,
          factionId: ruler.factionId,
          year: sc.year,
          month: sc.month,
        });
        void this.openPlay('开局成功', linesForNewGame(sc, ruler));
      },
      onBack: () => void this.openScenario(),
    });
    await this.transitionTo('ruler');
  }

  private async openContinue() {
    if (this.transitioning) return;
    if (listSaves().length === 0) {
      await this.backToTitle();
      return;
    }
    await buildContinueScreen(this.layers.continue!, {
      onLoad: (slot: SaveSlot) => {
        void this.openPlay('读档成功', linesForLoad(slot));
      },
      onBack: () => void this.backToTitle(),
      onEmpty: () => {
        void this.backToTitle();
      },
    });
    await this.transitionTo('continue');
  }

  private async openGallery() {
    if (this.transitioning) return;
    await buildGalleryScreen(this.layers.gallery!, () => void this.backToTitle());
    await this.transitionTo('gallery');
  }

  private async openSettings() {
    if (this.transitioning) return;
    await buildSettingsScreen(this.layers.settings!, () => void this.backToTitle());
    await this.transitionTo('settings');
  }

  private async openPlay(title: string, lines: string[]) {
    if (this.transitioning) return;
    await buildPlayStubScreen(this.layers.play!, {
      title,
      lines,
      onBack: () => void this.backToTitle(),
    });
    await this.transitionTo('play');
  }

  private async backToTitle() {
    if (this.transitioning) return;
    const layer = this.layers.title!;
    await buildTitleScreen(layer, this.titleCallbacks(), { forceIntro: false });
    await this.transitionTo('title');
  }

  private async transitionTo(next: MenuLayerId) {
    if (this.current === next) {
      this.layers[next]!.active = true;
      return;
    }
    this.transitioning = true;
    const ms = RL.transitionMs;
    const prev = this.current ? this.layers[this.current] : null;
    const target = this.layers[next]!;
    target.active = true;
    setOpacity(target, 0);

    if (prev && prev.active) {
      await fadeOpacity(prev, 255, 0, ms);
      prev.active = false;
      setOpacity(prev, 255);
    }
    await fadeOpacity(target, 0, 255, ms);
    this.current = next;
    this.transitioning = false;
  }
}
