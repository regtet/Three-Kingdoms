/** 回合 / 月份 / 季节。纯逻辑，无引擎依赖。 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface TurnState {
  /** 年份（展示用，如 200） */
  year: number;
  /** 月份 1–12 */
  month: number;
  season: Season;
}

export function seasonFromMonth(month: number): Season {
  if (month < 1 || month > 12) {
    throw new Error(`month out of range: ${month}`);
  }
  if (month <= 3) return 'spring';
  if (month <= 6) return 'summer';
  if (month <= 9) return 'autumn';
  return 'winter';
}

export function createTurn(year: number, month: number): TurnState {
  return { year, month, season: seasonFromMonth(month) };
}

/** 推进一个月；12 月之后进入下一年 1 月 */
export function advanceMonth(turn: TurnState): TurnState {
  if (turn.month >= 12) {
    return createTurn(turn.year + 1, 1);
  }
  return createTurn(turn.year, turn.month + 1);
}

export function formatTurn(turn: TurnState): string {
  const seasonLabel: Record<Season, string> = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬',
  };
  return `${turn.year}年${turn.month}月（${seasonLabel[turn.season]}）`;
}
