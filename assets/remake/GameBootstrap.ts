import {
  _decorator,
  Canvas,
  Component,
  director,
  macro,
  Node,
  view,
} from 'cc';
import { RemakeRoot } from './RemakeRoot';
import { applyDesignResolution, debugAdaptInfo } from './shared/ScreenAdapt';

const { ccclass } = _decorator;

/**
 * 场景入口：只设设计分辨率，不抢 Canvas/Camera。
 * 适配交给：项目设置 + Canvas.alignCanvasWithScreen + Widget。
 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  onLoad() {
    console.log('[GameBootstrap] 启动…');
    view.setOrientation(macro.ORIENTATION_PORTRAIT);
    applyDesignResolution();

    const scene = director.getScene()!;
    const canvas = this.getComponent(Canvas) || scene.getComponentInChildren(Canvas);
    if (!canvas) {
      console.error('[GameBootstrap] 场景缺少 Canvas，请打开带 Canvas 的 Game.scene');
      return;
    }

    const canvasNode = canvas.node;
    if (!canvasNode.getComponent(RemakeRoot)) {
      canvasNode.addComponent(RemakeRoot);
    }

    console.log('[GameBootstrap] RemakeRoot 已挂载', debugAdaptInfo());
  }
}
