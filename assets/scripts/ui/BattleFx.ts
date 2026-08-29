import { Graphics, Node, tween, UITransform, Vec3 } from 'cc';
import { toColor } from './UiDraw';

/** 战斗时城池闪烁 */
export function flashCity(node: Node, captured: boolean, onDone: () => void) {
  const flash = node.getChildByName('BattleFlash') ?? (() => {
    const n = new Node('BattleFlash');
    node.addChild(n);
    n.addComponent(UITransform).setContentSize(60, 60);
    return n;
  })();
  const g = flash.getComponent(Graphics) ?? flash.addComponent(Graphics);
  g.clear();
  g.fillColor = toColor(captured
    ? { r: 80, g: 220, b: 100, a: 180 }
    : { r: 220, g: 80, b: 60, a: 180 });
  g.roundRect(-30, -30, 60, 60, 8);
  g.fill();
  flash.active = true;
  flash.setScale(0.6, 0.6, 1);

  tween(node)
    .to(0.12, { scale: new Vec3(1.35, 1.35, 1) })
    .to(0.12, { scale: new Vec3(1, 1, 1) })
    .start();

  tween(flash)
    .to(0.15, { scale: new Vec3(1.4, 1.4, 1) })
    .to(0.2, { scale: new Vec3(0.8, 0.8, 1) })
    .call(() => {
      flash.active = false;
      onDone();
    })
    .start();
}

/** 占城成功脉冲 */
export function pulseCapture(node: Node) {
  tween(node)
    .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
    .to(0.25, { scale: new Vec3(1, 1, 1) })
    .start();
}
