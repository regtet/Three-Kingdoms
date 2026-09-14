import { describe, expect, it } from 'vitest';
import {
  SAVE_STORAGE_KEY,
  INTRO_SEEN_KEY,
  clearIntroSeen,
  hasSave,
  hasSeenIntro,
  markIntroSeen,
  type StorageLike,
} from '../assets/remake/shared/SaveProbe';
import { REMAKE_BUILD_TAG } from '../assets/remake/version';
import { RL } from '../assets/remake/shared/RemakeLayout';

function mem(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe('SaveProbe', () => {
  it('无存档时 hasSave 为 false', () => {
    expect(hasSave(mem())).toBe(false);
  });

  it('有 slots 数组时 hasSave 为 true', () => {
    const s = mem();
    s.setItem(SAVE_STORAGE_KEY, JSON.stringify({ slots: [{ id: 1 }] }));
    expect(hasSave(s)).toBe(true);
  });

  it('空数组不算有存档', () => {
    const s = mem();
    s.setItem(SAVE_STORAGE_KEY, JSON.stringify([]));
    expect(hasSave(s)).toBe(false);
  });

  it('开场标记读写', () => {
    const s = mem();
    expect(hasSeenIntro(s)).toBe(false);
    markIntroSeen(s);
    expect(hasSeenIntro(s)).toBe(true);
    expect(s.getItem(INTRO_SEEN_KEY)).toBe('1');
    clearIntroSeen(s);
    expect(hasSeenIntro(s)).toBe(false);
  });
});

describe('Remake layout / version', () => {
  it('设计分辨率 1080×1920', () => {
    expect(RL.W).toBe(1080);
    expect(RL.H).toBe(1920);
  });

  it('构建号已设置', () => {
    expect(REMAKE_BUILD_TAG).toMatch(/^REMAKE-/);
  });
});
