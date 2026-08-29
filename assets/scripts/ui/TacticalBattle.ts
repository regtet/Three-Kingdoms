import { Button, Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import type { BattleInput, GameState } from '../core/models/types';
import { findCity, findGeneral } from '../core/utils/helpers';
import { COL, L } from './OfficialLayout';
import { drawModalFrame, toColor } from './UiDraw';

export type TacticalResult = {
  retreated: boolean;
  modifier: number;
  log: string[];
};

/** 简化战术战：5×5 网格，移动/攻击/待机/退却 */
export function buildTacticalBattlePanel(
  parent: Node,
  state: GameState,
  input: BattleInput,
  onDone: (result: TacticalResult) => void,
): Node {
  const panel = new Node('TacticalPanel');
  parent.addChild(panel);
  panel.addComponent(UITransform).setContentSize(L.W, L.H);

  const bg = panel.addComponent(Graphics);
  bg.fillColor = toColor({ r: 0, g: 0, b: 0, a: 210 });
  bg.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  bg.fill();

  const frame = new Node('Frame');
  panel.addChild(frame);
  frame.setPosition(0, 80, 0);
  frame.addComponent(UITransform).setContentSize(640, 780);
  drawModalFrame(frame.addComponent(Graphics), 640, 780);

  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.targetCityId);
  const atk = findGeneral(state, input.attackerGeneralId);

  const title = new Node('Title');
  panel.addChild(title);
  title.setPosition(0, 420, 0);
  title.addComponent(UITransform).setContentSize(600, 36);
  const tl = title.addComponent(Label);
  tl.string = `战术战 · ${from.name} → ${to.name}`;
  tl.fontSize = 24;
  tl.color = toColor(COL.textGold);
  tl.horizontalAlign = Label.HorizontalAlign.CENTER;

  const info = new Node('Info');
  panel.addChild(info);
  info.setPosition(0, 370, 0);
  info.addComponent(UITransform).setContentSize(580, 24);
  const il = info.addComponent(Label);
  il.string = `${atk.name} 率 ${input.attackerTroops} 兵`;
  il.fontSize = 16;
  il.color = toColor(COL.textDim);
  il.horizontalAlign = Label.HorizontalAlign.CENTER;

  const gridRoot = new Node('Grid');
  panel.addChild(gridRoot);
  gridRoot.setPosition(0, 120, 0);

  const GRID = 5;
  const CELL = 56;
  let ax = 1; let ay = 2;
  let dx = 3; let dy = 2;
  let turn = 0;
  const maxTurns = 4;
  const logs: string[] = [];

  const logLb = new Node('Log');
  panel.addChild(logLb);
  logLb.setPosition(0, -120, 0);
  logLb.addComponent(UITransform).setContentSize(560, 80);
  const ll = logLb.addComponent(Label);
  ll.fontSize = 13;
  ll.lineHeight = 18;
  ll.color = toColor(COL.textDim);
  ll.overflow = Label.Overflow.CLAMP;

  const refreshGrid = () => {
    gridRoot.destroyAllChildren();
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const cell = new Node(`C_${x}_${y}`);
        gridRoot.addChild(cell);
        cell.setPosition((x - 2) * CELL, (2 - y) * CELL, 0);
        cell.addComponent(UITransform).setContentSize(CELL - 4, CELL - 4);
        const g = cell.addComponent(Graphics);
        const terrain = (x + y) % 3;
        const col = terrain === 0 ? { r: 40, g: 70, b: 45, a: 255 }
          : terrain === 1 ? { r: 35, g: 55, b: 38, a: 255 }
            : { r: 30, g: 45, b: 65, a: 255 };
        g.fillColor = toColor(col);
        g.roundRect(-(CELL - 4) / 2, -(CELL - 4) / 2, CELL - 4, CELL - 4, 4);
        g.fill();
        if (x === ax && y === ay) {
          g.strokeColor = toColor(COL.textGold);
          g.lineWidth = 2;
          g.roundRect(-(CELL - 4) / 2, -(CELL - 4) / 2, CELL - 4, CELL - 4, 4);
          g.stroke();
          const u = new Node('U');
          cell.addChild(u);
          u.addComponent(UITransform).setContentSize(CELL, CELL);
          const ul = u.addComponent(Label);
          ul.string = '我';
          ul.fontSize = 20;
          ul.color = new Color(255, 220, 100, 255);
          ul.horizontalAlign = Label.HorizontalAlign.CENTER;
        }
        if (x === dx && y === dy) {
          const u = new Node('E');
          cell.addChild(u);
          u.addComponent(UITransform).setContentSize(CELL, CELL);
          const ul = u.addComponent(Label);
          ul.string = '敌';
          ul.fontSize = 20;
          ul.color = new Color(255, 120, 100, 255);
          ul.horizontalAlign = Label.HorizontalAlign.CENTER;
        }
      }
    }
    ll.string = logs.slice(-4).join('\n') || '选择指令';
  };

  const finish = (retreated: boolean, modifier: number) => {
    onDone({ retreated, modifier, log: logs });
    panel.destroy();
  };

  const mkCmd = (text: string, x: number, cb: () => void) => {
    const n = new Node(`Cmd_${text}`);
    panel.addChild(n);
    n.setPosition(x, -280, 0);
    n.addComponent(UITransform).setContentSize(100, 40);
    const g = n.addComponent(Graphics);
    g.fillColor = toColor(COL.btn);
    g.roundRect(-50, -20, 100, 40, 6);
    g.fill();
    const lb = new Node('L');
    n.addChild(lb);
    lb.addComponent(UITransform).setContentSize(100, 40);
    const l = lb.addComponent(Label);
    l.string = text;
    l.fontSize = 16;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.color = toColor(COL.text);
    n.addComponent(Button);
    n.on(Button.EventType.CLICK, cb);
  };

  mkCmd('移动', -150, () => {
    if (turn >= maxTurns) return;
    ax = Math.min(GRID - 1, ax + 1);
    logs.push('我军前进');
    turn++;
    refreshGrid();
    if (ax === dx && ay === dy) {
      logs.push('接敌！');
      finish(false, 1.15);
    } else if (turn >= maxTurns) finish(false, 1.0);
  });

  mkCmd('攻击', -50, () => {
    const dist = Math.abs(ax - dx) + Math.abs(ay - dy);
    if (dist <= 1) {
      logs.push('猛攻！');
      finish(false, 1.2);
    } else {
      logs.push('距离过远');
      turn++;
      if (turn >= maxTurns) finish(false, 0.95);
      refreshGrid();
    }
  });

  mkCmd('待机', 50, () => {
    logs.push('整顿队形');
    turn++;
    if (turn >= maxTurns) finish(false, 1.05);
    refreshGrid();
  });

  mkCmd('退却', 150, () => {
    logs.push('全军退却');
    finish(true, 0.8);
  });

  refreshGrid();
  return panel;
}
