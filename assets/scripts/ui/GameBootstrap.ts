import { _decorator, Camera, Component, director, Node, Canvas, UITransform, Size, view, ResolutionPolicy } from 'cc';
import { GameRoot } from './GameRoot';
import { CocosAudioBridge } from './CocosAudioBridge';
import { applyScreenAdapt } from './ScreenAdapt';
import { L } from './OfficialLayout';

const { ccclass } = _decorator;

/**
 * 挂到任意节点即可；若无 Canvas 会自动创建。
 * 用法：新建空场景 → 空节点添加 GameBootstrap → 设为启动场景 → 运行
 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  onLoad() {
    console.log('[GameBootstrap] 启动…');
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

    const frame = view.getVisibleSize();
    const ratio = frame.width / frame.height;
    const designRatio = L.W / L.H;
    if (ratio >= designRatio) {
      view.setDesignResolutionSize(L.W, L.H, ResolutionPolicy.FIXED_HEIGHT);
    } else {
      view.setDesignResolutionSize(L.W, L.H, ResolutionPolicy.FIXED_WIDTH);
    }

    if (!canvasNode.getComponent(GameRoot)) {
      canvasNode.addComponent(GameRoot);
    }
    if (!canvasNode.getComponent(CocosAudioBridge)) {
      canvasNode.addComponent(CocosAudioBridge);
    }

    applyScreenAdapt(canvasNode);
    console.log('[GameBootstrap] Canvas 就绪');
  }
}
