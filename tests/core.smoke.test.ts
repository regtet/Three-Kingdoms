import { describe, expect, it } from 'vitest';
import {
  advanceMonth,
  createInitialGameState,
  createOfficer,
  createEmptyCity,
  EventBus,
  findFaction,
  formatTurn,
  seasonFromMonth,
} from '../assets/core';

describe('Faction', () => {
  it('初始局含魏蜀吴三方', () => {
    const state = createInitialGameState();
    expect(state.factions.map((f) => f.id)).toEqual(['wei', 'shu', 'wu']);
    expect(findFaction(state.factions, 'wei')?.name).toBe('魏');
    expect(findFaction(state.factions, 'shu')?.rulerName).toBe('刘备');
    expect(findFaction(state.factions, 'wu')?.rulerName).toBe('孙权');
  });

  it('可指定玩家势力', () => {
    const state = createInitialGameState({ playerFactionId: 'shu' });
    expect(state.playerFactionId).toBe('shu');
    expect(findFaction(state.factions, 'shu')?.isPlayer).toBe(true);
    expect(findFaction(state.factions, 'wei')?.isPlayer).toBe(false);
  });
});

describe('Turn', () => {
  it('按月份映射季节', () => {
    expect(seasonFromMonth(1)).toBe('spring');
    expect(seasonFromMonth(4)).toBe('summer');
    expect(seasonFromMonth(9)).toBe('autumn');
    expect(seasonFromMonth(12)).toBe('winter');
  });

  it('推进月份并跨年', () => {
    const state = createInitialGameState({ year: 200, month: 12 });
    const next = advanceMonth(state.turn);
    expect(next.year).toBe(201);
    expect(next.month).toBe(1);
    expect(next.season).toBe('spring');
    expect(formatTurn(next)).toContain('201年1月');
  });
});

describe('City / Officer', () => {
  it('可创建城与武将并挂进 GameState', () => {
    const state = createInitialGameState({ playerFactionId: 'wei' });
    const city = createEmptyCity({
      id: 'luoyang',
      name: '洛阳',
      ownerFactionId: 'wei',
      gold: 1000,
      troops: 5000,
    });
    const officer = createOfficer({
      id: 'caocao',
      name: '曹操',
      factionId: 'wei',
      cityId: 'luoyang',
      force: 90,
    });
    state.cities.push(city);
    state.officers.push(officer);
    expect(state.cities).toHaveLength(1);
    expect(state.officers[0].name).toBe('曹操');
    expect(state.cities[0].troops).toBe(5000);
  });
});

describe('EventBus', () => {
  it('订阅后能收到 emit', () => {
    const bus = new EventBus();
    const seen: unknown[] = [];
    const off = bus.on<{ month: number }>('turn:advanced', (p) => {
      seen.push(p);
    });
    bus.emit('turn:advanced', { month: 2 });
    expect(seen).toEqual([{ month: 2 }]);
    off();
    bus.emit('turn:advanced', { month: 3 });
    expect(seen).toHaveLength(1);
  });
});
