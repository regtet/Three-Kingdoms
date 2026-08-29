import {
  BlockInputEvents,
  Graphics,
  Label,
  Node,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import type { General } from '../core/models/types';
import { COL, L } from './OfficialLayout';
import { createPortraitDisplay } from './GeneralPortrait';
import { drawModalFrame, toColor } from './UiDraw';

export interface BattleCutsceneOpts {
  parent: Node;
  attacker: General;
  defender: General | null;
  attackerFactionColor: string;
  defenderFactionColor: string;
  targetCityName: string;
  attackerTroops?: number;
  defenderTroops?: number;
  onMidpoint?: () => void;
  onDone: () => void;
}

/** 战斗过场：双将交锋 → 回调 */
export function playBattleCutscene(opts: BattleCutsceneOpts) {
  const overlay = new Node('BattleCutscene');
  opts.parent.addChild(overlay);
  overlay.addComponent(UITransform).setContentSize(L.W, L.H);
  overlay.addComponent(BlockInputEvents);

  const bg = new Node('CutsceneBg');
  overlay.addChild(bg);
  bg.addComponent(UITransform).setContentSize(L.W, L.H);
  const bgG = bg.addComponent(Graphics);
  bgG.fillColor = toColor({ r: 0, g: 0, b: 0, a: 0 });
  bgG.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  bgG.fill();

  const frame = new Node('CutsceneFrame');
  overlay.addChild(frame);
  frame.setPosition(0, 60, 0);
  frame.addComponent(UITransform).setContentSize(680, 520);
  drawModalFrame(frame.addComponent(Graphics), 680, 520);

  const title = new Node('CutsceneTitle');
  overlay.addChild(title);
  title.setPosition(0, 380, 0);
  title.addComponent(UITransform).setContentSize(600, 40);
  const tl = title.addComponent(Label);
  tl.string = `进 攻  ${opts.targetCityName}`;
  tl.fontSize = 28;
  tl.horizontalAlign = Label.HorizontalAlign.CENTER;
  tl.color = toColor(COL.textGold);

  const left = createPortraitDisplay(overlay, opts.attacker, '', opts.attackerFactionColor, 'left');
  const right = createPortraitDisplay(
    overlay,
    opts.defender,
    '守军',
    opts.defenderFactionColor,
    'right',
  );

  left.setPosition(-220, 40, 0);
  right.setPosition(220, 40, 0);
  left.setScale(0.3, 0.3, 1);
  right.setScale(0.3, 0.3, 1);

  const vs = new Node('VS');
  overlay.addChild(vs);
  vs.setPosition(0, 60, 0);
  vs.addComponent(UITransform).setContentSize(80, 80);
  const vsG = vs.addComponent(Graphics);
  vsG.fillColor = toColor({ r: 180, g: 50, b: 40, a: 255 });
  vsG.circle(0, 0, 36);
  vsG.fill();
  vsG.strokeColor = toColor(COL.textGold);
  vsG.lineWidth = 2;
  vsG.circle(0, 0, 36);
  vsG.stroke();
  const vsLb = new Node('VSText');
  vs.addChild(vsLb);
  vsLb.addComponent(UITransform).setContentSize(60, 40);
  const vl = vsLb.addComponent(Label);
  vl.string = 'VS';
  vl.fontSize = 26;
  vl.horizontalAlign = Label.HorizontalAlign.CENTER;
  vl.color = toColor(COL.text);
  vs.setScale(0, 0, 1);

  if (opts.attackerTroops != null || opts.defenderTroops != null) {
    const troopNode = new Node('Troops');
    overlay.addChild(troopNode);
    troopNode.setPosition(0, -60, 0);
    troopNode.addComponent(UITransform).setContentSize(560, 30);
    const tl = troopNode.addComponent(Label);
    const atk = opts.attackerTroops != null ? `${opts.attackerTroops}兵` : '';
    const def = opts.defenderTroops != null ? `${opts.defenderTroops}兵` : '?';
    tl.string = `${atk}  ⚔  ${def}`;
    tl.fontSize = 20;
    tl.horizontalAlign = Label.HorizontalAlign.CENTER;
    tl.color = toColor(COL.textGold);
    troopNode.setScale(0.8, 0.8, 1);
    tween(troopNode).delay(0.4).to(0.2, { scale: new Vec3(1, 1, 1) }).start();
  }

  const clash = new Node('Clash');
  overlay.addChild(clash);
  clash.setPosition(0, 60, 0);
  clash.addComponent(UITransform).setContentSize(120, 120);
  const cg = clash.addComponent(Graphics);
  cg.strokeColor = toColor({ r: 255, g: 200, b: 80, a: 255 });
  cg.lineWidth = 4;
  cg.moveTo(-50, -50);
  cg.lineTo(50, 50);
  cg.moveTo(50, -50);
  cg.lineTo(-50, 50);
  cg.stroke();
  clash.active = false;

  tween(bgG)
    .to(0.2, {}, {
      onUpdate: (_target, ratio) => {
        bgG.clear();
        bgG.fillColor = toColor({ r: 0, g: 0, b: 0, a: Math.floor(200 * (ratio ?? 0)) });
        bgG.rect(-L.W / 2, -L.H / 2, L.W, L.H);
        bgG.fill();
      },
    })
    .start();

  tween(left)
    .to(0.35, { position: new Vec3(-180, 40, 0), scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
    .start();
  tween(right)
    .to(0.35, { position: new Vec3(180, 40, 0), scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
    .delay(0.05)
    .start();

  tween(vs)
    .delay(0.3)
    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
    .to(0.1, { scale: new Vec3(1, 1, 1) })
    .start();

  tween(overlay)
    .delay(0.75)
    .call(() => {
      clash.active = true;
      clash.setScale(0.5, 0.5, 1);
      tween(clash)
        .to(0.15, { scale: new Vec3(1.8, 1.8, 1) })
        .start();
      opts.onMidpoint?.();
    })
    .delay(0.35)
    .call(() => {
      tween(overlay)
        .to(0.25, {}, {
          onUpdate: (_t, ratio) => {
            overlay.setScale(1, 1 - (ratio ?? 0) * 0.05, 1);
          },
        })
        .call(() => {
          overlay.destroy();
          opts.onDone();
        })
        .start();
    })
    .start();
}
