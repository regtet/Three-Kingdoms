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
import { buildPlaceholderScreen } from './menu/PlaceholderScreen';
import { fadeOpacity, setOpacity } from './shared/MenuChrome';
import { debugAdaptInfo, getVisibleDesignSize, matchVisibleSize } from './shared/ScreenAdapt';
import { RL } from './shared/RemakeLayout';

const { ccclass } = _decorator;

type LayerId = 'title' | 'scenario' | 'continue' | 'gallery' | 'settings';

/**
 * UI 根：跟 Canvas 同尺寸；等一帧再布局（等 Canvas Widget 对齐完成）。
 */
@ccclass('RemakeRoot')
export class RemakeRoot extends Component {
  private shell!: Node;
  private layers: Partial<Record<LayerId, Node>> = {};
  private current: LayerId | null = null;
  private transitioning = false;
  private lastPlaceholderTitle = '';
  private booted = false;

  onLoad() {
    console.log(`[RemakeRoot] ${REMAKE_BUILD_TAG}`);

    this.node.setPosition(0, 0, 0);
    const ui = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    ui.setAnchorPoint(0.5, 0.5);

    this.shell = new Node('RemakeShell');
    this.node.addChild(this.shell);
    this.shell.addComponent(UITransform).setAnchorPoint(0.5, 0.5);

    const ids: LayerId[] = ['title', 'scenario', 'continue', 'gallery', 'settings'];
    for (const id of ids) {
      const layer = new Node(`Layer_${id}`);
      this.shell.addChild(layer);
      layer.addComponent(UITransform).setAnchorPoint(0.5, 0.5);
      layer.addComponent(UIOpacity).opacity = 255;
      layer.active = false;
      this.layers[id] = layer;
    }

    view.on('canvas-resize', this.onResize, this);
    // 等 Canvas / Widget / 设计分辨率生效后再建主菜单
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
    for (const id of Object.keys(this.layers) as LayerId[]) {
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
    if (this.current === 'title') {
      await this.openTitle(false);
      return;
    }
    const titles: Record<Exclude<LayerId, 'title'>, string> = {
      scenario: '剧本选择（占位）',
      continue: '继续游戏（占位）',
      gallery: '武将图鉴（占位）',
      settings: '设置（占位）',
    };
    const id = this.current;
    await buildPlaceholderScreen(this.layers[id]!, this.lastPlaceholderTitle || titles[id], () => {
      void this.backToTitle();
    });
    this.layers[id]!.active = true;
  }

  private async openTitle(first: boolean) {
    const layer = this.layers.title!;
    await buildTitleScreen(
      layer,
      {
        onNewGame: () => void this.goPlaceholder('scenario', '剧本选择（占位）'),
        onContinue: () => void this.goPlaceholder('continue', '继续游戏（占位）'),
        onGallery: () => void this.goPlaceholder('gallery', '武将图鉴（占位）'),
        onSettings: () => void this.goPlaceholder('settings', '设置（占位）'),
      },
      { forceIntro: first ? undefined : false },
    );
    if (first) {
      layer.active = true;
      this.current = 'title';
    } else {
      await this.transitionTo('title');
    }
  }

  private async goPlaceholder(id: Exclude<LayerId, 'title'>, title: string) {
    if (this.transitioning) return;
    this.lastPlaceholderTitle = title;
    const layer = this.layers[id]!;
    await buildPlaceholderScreen(layer, title, () => {
      void this.backToTitle();
    });
    await this.transitionTo(id);
  }

  private async backToTitle() {
    if (this.transitioning) return;
    const layer = this.layers.title!;
    await buildTitleScreen(
      layer,
      {
        onNewGame: () => void this.goPlaceholder('scenario', '剧本选择（占位）'),
        onContinue: () => void this.goPlaceholder('continue', '继续游戏（占位）'),
        onGallery: () => void this.goPlaceholder('gallery', '武将图鉴（占位）'),
        onSettings: () => void this.goPlaceholder('settings', '设置（占位）'),
      },
      { forceIntro: false },
    );
    await this.transitionTo('title');
  }

  private async transitionTo(next: LayerId) {
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
