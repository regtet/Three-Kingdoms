/** 轴向坐标（pointy-top） */

export type HexAxial = { q: number; r: number };

export const HEX_DIRS: readonly HexAxial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export interface HexBattleState {
  radius: number;
  player: HexAxial;
  enemy: HexAxial;
  turn: number;
  maxTurns: number;
  logs: string[];
  done: boolean;
  retreated: boolean;
  modifier: number;
}

export function hexKey(h: HexAxial): string {
  return `${h.q},${h.r}`;
}

export function hexEq(a: HexAxial, b: HexAxial): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexAdd(a: HexAxial, b: HexAxial): HexAxial {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexDistance(a: HexAxial, b: HexAxial): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

export function inHexRadius(h: HexAxial, radius: number): boolean {
  return hexDistance({ q: 0, r: 0 }, h) <= radius;
}

export function hexNeighbors(h: HexAxial): HexAxial[] {
  return HEX_DIRS.map((d) => hexAdd(h, d));
}

export function hexesInRadius(radius: number): HexAxial[] {
  const out: HexAxial[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) out.push({ q, r });
  }
  return out;
}

/** pointy-top 像素（y 向上） */
export function hexToPixel(h: HexAxial, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * h.q + (Math.sqrt(3) / 2) * h.r);
  const y = size * ((3 / 2) * h.r);
  return { x, y };
}

export function hexTerrain(h: HexAxial): 0 | 1 | 2 {
  const n = ((h.q * 3 + h.r * 5) % 3 + 3) % 3;
  return n as 0 | 1 | 2;
}

export function hexStepToward(from: HexAxial, to: HexAxial, radius: number): HexAxial | null {
  if (hexEq(from, to)) return null;
  const options = hexNeighbors(from).filter((n) => inHexRadius(n, radius));
  if (!options.length) return null;
  options.sort((a, b) => hexDistance(a, to) - hexDistance(b, to));
  return options[0];
}

export function createHexBattle(): HexBattleState {
  return {
    radius: 2,
    player: { q: -2, r: 1 },
    enemy: { q: 2, r: -1 },
    turn: 0,
    maxTurns: 5,
    logs: [],
    done: false,
    retreated: false,
    modifier: 1,
  };
}

function finish(state: HexBattleState, retreated: boolean, modifier: number, log: string): void {
  state.logs.push(log);
  state.done = true;
  state.retreated = retreated;
  state.modifier = modifier;
}

function enemyAdvance(state: HexBattleState): void {
  if (state.done) return;
  if (hexDistance(state.player, state.enemy) <= 1) return;
  const step = hexStepToward(state.enemy, state.player, state.radius);
  if (!step || hexEq(step, state.player)) return;
  state.enemy = step;
  state.logs.push('敌军逼近');
}

function afterAction(state: HexBattleState, consumeTurn: boolean, timeoutMod = 1.0): void {
  if (state.done) return;
  if (hexEq(state.player, state.enemy)) {
    finish(state, false, 1.15, '接敌！');
    return;
  }
  enemyAdvance(state);
  if (state.done) return;
  if (hexEq(state.player, state.enemy)) {
    finish(state, false, 1.15, '接敌！');
    return;
  }
  if (consumeTurn) state.turn += 1;
  if (!state.done && state.turn >= state.maxTurns) {
    finish(state, false, timeoutMod, '接战时间耗尽，按当前阵势交锋');
  }
}

export function hexCanMoveTo(state: HexBattleState, dest: HexAxial): boolean {
  if (state.done) return false;
  if (!inHexRadius(dest, state.radius)) return false;
  return hexDistance(state.player, dest) === 1;
}

export function hexMoveTo(state: HexBattleState, dest: HexAxial): boolean {
  if (!hexCanMoveTo(state, dest)) {
    state.logs.push('无法移动到该格');
    return false;
  }
  state.player = dest;
  state.logs.push('我军前进');
  afterAction(state, true);
  return true;
}

export function hexAdvance(state: HexBattleState): void {
  if (state.done) return;
  const step = hexStepToward(state.player, state.enemy, state.radius);
  if (!step) {
    state.logs.push('无路可进');
    return;
  }
  hexMoveTo(state, step);
}

export function hexAttack(state: HexBattleState): void {
  if (state.done) return;
  if (hexDistance(state.player, state.enemy) <= 1) {
    finish(state, false, 1.2, '猛攻！');
    return;
  }
  state.logs.push('距离过远');
  afterAction(state, true, 0.95);
}

export function hexWait(state: HexBattleState): void {
  if (state.done) return;
  state.logs.push('整顿队形');
  afterAction(state, true, 1.05);
}

export function hexRetreat(state: HexBattleState): void {
  if (state.done) return;
  finish(state, true, 0.8, '全军退却');
}
