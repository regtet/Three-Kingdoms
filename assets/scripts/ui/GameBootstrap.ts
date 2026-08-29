import { _decorator, Component, director, Node, Canvas, UITransform, Size, view, ResolutionPolicy } from 'cc';
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
    let canvas = director.getScene()?.getComponentInChildren(Canvas);
    if (!canvas) {
      const scene = director.getScene()!;
      const canvasNode = new Node('Canvas');
      scene.addChild(canvasNode);
      canvas = canvasNode.addComponent(Canvas);
      const tf = canvasNode.addComponent(UITransform);
      tf.setContentSize(new Size(L.W, L.H));
    }

    const frame = view.getVisibleSize();
    const ratio = frame.width / frame.height;
    const designRatio = L.W / L.H;
    if (ratio >= designRatio) {
      view.setDesignResolutionSize(L.W, L.H, ResolutionPolicy.FIXED_HEIGHT);
    } else {
      view.setDesignResolutionSize(L.W, L.H, ResolutionPolicy.FIXED_WIDTH);
    }

    if (!canvas.node.getComponent(GameRoot)) {
      canvas.node.addComponent(GameRoot);
    }
    if (!canvas.node.getComponent(CocosAudioBridge)) {
      canvas.node.addComponent(CocosAudioBridge);
    }

    applyScreenAdapt(canvas.node);
  }
}
