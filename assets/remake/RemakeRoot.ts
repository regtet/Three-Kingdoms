import {
  _decorator,
  Component,
  Node,
  UIOpacity,
  UITransform,
  Widget,
} from 'cc';
import { RL } from './shared/RemakeLayout';
import { REMAKE_BUILD_TAG } from './version';
import { buildTitleScreen } from './menu/TitleScreen';
import { buildPlaceholderScreen } from './menu/PlaceholderScreen';
import { fadeOpacity, setOpacity } from './shared/MenuChrome';

const { ccclass } = _decorator;

type LayerId = 'title' | 'scenario' | 'continue' | 'gallery' | 'settings';

/**
 * UI 根：层互斥 + 主菜单 / 占位页转场。
 * 不做玩法；子页仅占位。
 */
@ccclass('RemakeRoot')
export class RemakeRoot extends Component {
  private shell!: Node;
  private layers: Partial<Record<LayerId, Node>> = {};
  private current: LayerId | null = null;
  private transitioning = false;

  onLoad() {
    console.log(`[RemakeRoot] ${REMAKE_BUILD_TAG}`);

    const ui = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    ui.setContentSize(RL.W, RL.H);
    const widget = this.node.getComponent(Widget) ?? this.node.addComponent(Widget);
    widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
    widget.top = widget.bottom = widget.left = widget.right = 0;
    widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    widget.updateAlignment();

    this.shell = new Node('RemakeShell');
    this.node.addChild(this.shell);
    this.shell.addComponent(UITransform).setContentSize(RL.W, RL.H);

    const ids: LayerId[] = ['title', 'scenario', 'continue', 'gallery', 'settings'];
    for (const id of ids) {
      const layer = new Node(`Layer_${id}`);
      this.shell.addChild(layer);
      layer.addComponent(UITransform).setContentSize(RL.W, RL.H);
      layer.addComponent(UIOpacity).opacity = 255;
      layer.active = false;
      this.layers[id] = layer;
    }

    void this.openTitle(true);
  }

  private async openTitle(first: boolean) {
    const layer = this.layers.title!;
    await buildTitleScreen(layer, {
      onNewGame: () => void this.goPlaceholder('scenario', '剧本选择（占位）'),
      onContinue: () => void this.goPlaceholder('continue', '继续游戏（占位）'),
      onGallery: () => void this.goPlaceholder('gallery', '武将图鉴（占位）'),
      onSettings: () => void this.goPlaceholder('settings', '设置（占位）'),
    });
    if (first) {
      layer.active = true;
      this.current = 'title';
    } else {
      await this.transitionTo('title');
    }
  }

  private async goPlaceholder(id: Exclude<LayerId, 'title'>, title: string) {
    if (this.transitioning) return;
    const layer = this.layers[id]!;
    await buildPlaceholderScreen(layer, title, () => {
      void this.backToTitle();
    });
    await this.transitionTo(id);
  }

  private async backToTitle() {
    if (this.transitioning) return;
    // 返回时刷新继续按钮显隐
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
    // 跳过开场：SaveProbe 已见过则 buildTitleScreen 内部不播长动画
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
