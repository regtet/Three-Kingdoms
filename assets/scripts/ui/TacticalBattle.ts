import { Button, Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import type { BattleInput, GameState } from '../core/models/types';
import { findCity, findGeneral } from '../core/utils/helpers';
import {
  createHexBattle,
  hexAdvance,
  hexAttack,
  hexCanMoveTo,
  hexDistance,
  hexEq,
  hexesInRadius,
  hexMoveTo,
  hexRetreat,
  hexTerrain,
  hexToPixel,
  hexWait,
  type HexAxial,
  type HexBattleState,
} from '../core/systems/hexBattle';
import { COL, L } from './OfficialLayout';
import { drawModalFrame, toColor } from './UiDraw';

export type TacticalResult = {
  retreated: boolean;
  modifier: number;
  log: string[];
};

function drawHexFill(g: Graphics, size: number): void {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
  }
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 6; i++) g.lineTo(pts[i].x, pts[i].y);
  g.close();
  g.fill();
}

function drawHexStroke(g: Graphics, size: number): void {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
  }
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 6; i++) g.lineTo(pts[i].x, pts[i].y);
  g.close();
  g.stroke();
}

/** HEX 战术战：半径 2 轴向格，点邻格移动 / 攻击 / 待机 / 退却 */
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
  frame.setPosition(0, L.TACT_FRAME_Y, 0);
  frame.addComponent(UITransform).setContentSize(L.TACT_FRAME_W, L.TACT_FRAME_H);
  drawModalFrame(frame.addComponent(Graphics), L.TACT_FRAME_W, L.TACT_FRAME_H);

  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.targetCityId);
  const atk = findGeneral(state, input.attackerGeneralId);

  const title = new Node('Title');
  panel.addChild(title);
  title.setPosition(0, L.TACT_TITLE_Y, 0);
  title.addComponent(UITransform).setContentSize(600, 36);
  const tl = title.addComponent(Label);
  tl.string = `战术战 · HEX · ${from.name} → ${to.name}`;
  tl.fontSize = 24;
  tl.color = toColor(COL.textGold);
  tl.horizontalAlign = Label.HorizontalAlign.CENTER;

  const info = new Node('Info');
  panel.addChild(info);
  info.setPosition(0, L.TACT_INFO_Y, 0);
  info.addComponent(UITransform).setContentSize(580, 24);
  const il = info.addComponent(Label);
  il.string = `${atk.name} 率 ${input.attackerTroops} 兵 · 点相邻格移动`;
  il.fontSize = 16;
  il.color = toColor(COL.textDim);
  il.horizontalAlign = Label.HorizontalAlign.CENTER;

  const gridRoot = new Node('Grid');
  panel.addChild(gridRoot);
  gridRoot.setPosition(0, L.TACT_GRID_Y, 0);

  const battle = createHexBattle();
  const hexSize = L.TACT_HEX_SIZE;

  const logLb = new Node('Log');
  panel.addChild(logLb);
  logLb.setPosition(0, L.TACT_LOG_Y, 0);
  logLb.addComponent(UITransform).setContentSize(560, L.TACT_LOG_H);
  const ll = logLb.addComponent(Label);
  ll.fontSize = 13;
  ll.lineHeight = 18;
  ll.color = toColor(COL.textDim);
  ll.overflow = Label.Overflow.CLAMP;

  const finish = (s: HexBattleState) => {
    onDone({ retreated: s.retreated, modifier: s.modifier, log: s.logs });
    panel.destroy();
  };

  const refreshGrid = () => {
    gridRoot.destroyAllChildren();
    const cells = hexesInRadius(battle.radius);
    for (const h of cells) {
      const pos = hexToPixel(h, hexSize);
      const cell = new Node(`H_${h.q}_${h.r}`);
      gridRoot.addChild(cell);
      cell.setPosition(pos.x, pos.y, 0);
      const hit = hexSize * 1.85;
      cell.addComponent(UITransform).setContentSize(hit, hit);
      const g = cell.addComponent(Graphics);
      const terrain = hexTerrain(h);
      const col = terrain === 0
        ? { r: 40, g: 72, b: 46, a: 255 }
        : terrain === 1
          ? { r: 36, g: 56, b: 40, a: 255 }
          : { r: 32, g: 48, b: 68, a: 255 };
      g.fillColor = toColor(col);
      drawHexFill(g, hexSize - 2);

      const movable = hexCanMoveTo(battle, h);
      if (movable) {
        g.strokeColor = toColor({ r: 180, g: 210, b: 255, a: 200 });
        g.lineWidth = 2;
        drawHexStroke(g, hexSize - 2);
      }
      if (hexEq(h, battle.player)) {
        g.strokeColor = toColor(COL.textGold);
        g.lineWidth = 2;
        drawHexStroke(g, hexSize - 2);
        addUnitLabel(cell, '我', new Color(255, 220, 100, 255));
      } else if (hexEq(h, battle.enemy)) {
        addUnitLabel(cell, '敌', new Color(255, 120, 100, 255));
      }

      if (movable) {
        cell.addComponent(Button);
        const dest: HexAxial = { q: h.q, r: h.r };
        cell.on(Button.EventType.CLICK, () => {
          hexMoveTo(battle, dest);
          afterCmd();
        });
      }
    }
    const dist = hexDistance(battle.player, battle.enemy);
    ll.string = (battle.logs.slice(-4).join('\n') || '选择邻格或底部指令')
      + `\n回合 ${battle.turn}/${battle.maxTurns} · 距敌 ${dist} 格`;
  };

  const afterCmd = () => {
    refreshGrid();
    if (battle.done) finish(battle);
  };

  const mkCmd = (text: string, xi: number, cb: () => void) => {
    const n = new Node(`Cmd_${text}`);
    panel.addChild(n);
    n.setPosition(xi * L.TACT_CMD_GAP, L.TACT_CMD_Y, 0);
    n.addComponent(UITransform).setContentSize(L.TACT_CMD_W, L.TACT_CMD_H);
    const g = n.addComponent(Graphics);
    g.fillColor = toColor(COL.btn);
    g.roundRect(-L.TACT_CMD_W / 2, -L.TACT_CMD_H / 2, L.TACT_CMD_W, L.TACT_CMD_H, 6);
    g.fill();
    const lb = new Node('L');
    n.addChild(lb);
    lb.addComponent(UITransform).setContentSize(L.TACT_CMD_W, L.TACT_CMD_H);
    const l = lb.addComponent(Label);
    l.string = text;
    l.fontSize = 16;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.color = toColor(COL.text);
    n.addComponent(Button);
    n.on(Button.EventType.CLICK, cb);
  };

  mkCmd('前进', -1.5, () => { hexAdvance(battle); afterCmd(); });
  mkCmd('攻击', -0.5, () => { hexAttack(battle); afterCmd(); });
  mkCmd('待机', 0.5, () => { hexWait(battle); afterCmd(); });
  mkCmd('退却', 1.5, () => { hexRetreat(battle); afterCmd(); });

  refreshGrid();
  return panel;
}

function addUnitLabel(cell: Node, text: string, color: Color): void {
  const u = new Node('U');
  cell.addChild(u);
  u.addComponent(UITransform).setContentSize(40, 40);
  const ul = u.addComponent(Label);
  ul.string = text;
  ul.fontSize = 20;
  ul.color = color;
  ul.horizontalAlign = Label.HorizontalAlign.CENTER;
  u.setPosition(new Vec3(0, 0, 0));
}
