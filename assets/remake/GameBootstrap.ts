import {
  _decorator,
  Camera,
  Canvas,
  Component,
  director,
  macro,
  Node,
  UITransform,
  Size,
  view,
  ResolutionPolicy,
} from 'cc';
import { RemakeRoot } from './RemakeRoot';
import { RL } from './shared/RemakeLayout';

const { ccclass } = _decorator;

/**
 * 场景入口：挂在 Canvas 上。竖屏 1080×1920，挂载 RemakeRoot。
 * meta uuid 必须与 Game.scene 中压缩引用 93506MMUENNg4PHkBs9eTuB 一致。
 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  onLoad() {
    console.log('[GameBootstrap] 启动主菜单…');
    view.setOrientation(macro.ORIENTATION_PORTRAIT);
    view.setDesignResolutionSize(RL.W, RL.H, ResolutionPolicy.FIXED_HEIGHT);

    const scene = director.getScene()!;
    let canvas = this.getComponent(Canvas) || scene.getComponentInChildren(Canvas);
    let canvasNode: Node;

    if (!canvas) {
      canvasNode = new Node('Canvas');
      scene.addChild(canvasNode);
      canvas = canvasNode.addComponent(Canvas);
      canvasNode.addComponent(UITransform).setContentSize(new Size(RL.W, RL.H));

      const cameraNode = new Node('UICamera');
      canvasNode.addChild(cameraNode);
      cameraNode.setPosition(0, 0, 1000);
      const cam = cameraNode.addComponent(Camera);
      cam.projection = Camera.ProjectionType.ORTHO;
      cam.orthoHeight = RL.H / 2;
      cam.near = 1;
      cam.far = 2000;
      cam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
      cam.clearColor.set(8, 10, 14, 255);
      canvas.cameraComponent = cam;
    } else {
      canvasNode = canvas.node;
      const ui = canvasNode.getComponent(UITransform);
      if (ui) ui.setContentSize(new Size(RL.W, RL.H));
      if (canvas.cameraComponent) {
        canvas.cameraComponent.orthoHeight = RL.H / 2;
      }
    }

    if (!canvasNode.getComponent(RemakeRoot)) {
      canvasNode.addComponent(RemakeRoot);
    }
    // 场景内已有 Canvas+Camera；此处只挂 UI 根
    console.log('[GameBootstrap] RemakeRoot 已挂载（场景含 Canvas）');
  }
}
