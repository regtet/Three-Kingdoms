import { _decorator, Camera, Canvas, Component, director, macro, Node, UITransform, Size, view } from 'cc';
import { RemakeRoot } from '../remake/RemakeRoot';
import { GameRoot } from './GameRoot';
import { CocosAudioBridge } from './CocosAudioBridge';
import { applyScreenAdapt } from './ScreenAdapt';
import { L } from './OfficialLayout';

const { ccclass } = _decorator;

/**
 * 挂到任意节点即可；若无 Canvas 会自动创建。
 * 复刻期挂载 RemakeRoot（不再挂 GameRoot）。
 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  onLoad() {
    console.log('[GameBootstrap] 启动（Remake）…');
    view.setOrientation(macro.ORIENTATION_PORTRAIT);

    const scene = director.getScene()!;

    let canvas = scene.getComponentInChildren(Canvas);
    let canvasNode: Node;

    if (!canvas) {
      canvasNode = new Node('Canvas');
      scene.addChild(canvasNode);
      canvas = canvasNode.addComponent(Canvas);
      canvasNode.addComponent(UITransform).setContentSize(new Size(L.W, L.H));

      const cameraNode = new Node('UICamera');
      canvasNode.addChild(cameraNode);
      cameraNode.setPosition(0, 0, 1000);
      const cam = cameraNode.addComponent(Camera);
      cam.projection = Camera.ProjectionType.ORTHO;
      cam.orthoHeight = L.H / 2;
      cam.near = 1;
      cam.far = 2000;
      cam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
      cam.clearColor.set(10, 14, 24, 255);
      canvas.cameraComponent = cam;
    } else {
      canvasNode = canvas.node;
    }

    applyScreenAdapt(canvasNode, canvas.cameraComponent);

    const legacy = canvasNode.getComponent(GameRoot);
    if (legacy) {
      canvasNode.removeComponent(legacy);
    }

    if (!canvasNode.getComponent(RemakeRoot)) {
      canvasNode.addComponent(RemakeRoot);
    }
    if (!canvasNode.getComponent(CocosAudioBridge)) {
      canvasNode.addComponent(CocosAudioBridge);
    }

    console.log('[GameBootstrap] RemakeRoot 就绪');
  }
}
