/**
 * 存档探测（纯逻辑，可供 Vitest）。
 * 真正存档格式以后再定；主菜单仅用「有无槽位」决定是否显示「继续游戏」。
 */

export const SAVE_STORAGE_KEY = 'tk_save_slots_v1';
export const INTRO_SEEN_KEY = 'tk_title_intro_seen_v1';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function memoryStorage(): StorageLike {
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

export function getDefaultStorage(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      return localStorage;
    }
  } catch {
    /* ignore */
  }
  return memoryStorage();
}

/** 是否存在可读存档（非空 JSON 数组或带 slot 的对象） */
export function hasSave(storage: StorageLike = getDefaultStorage()): boolean {
  const raw = storage.getItem(SAVE_STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) return data.length > 0;
    if (data && typeof data === 'object') {
      const slots = (data as { slots?: unknown[] }).slots;
      if (Array.isArray(slots)) return slots.length > 0;
      return Object.keys(data as object).length > 0;
    }
  } catch {
    return false;
  }
  return false;
}

export function markIntroSeen(storage: StorageLike = getDefaultStorage()): void {
  storage.setItem(INTRO_SEEN_KEY, '1');
}

export function hasSeenIntro(storage: StorageLike = getDefaultStorage()): boolean {
  return storage.getItem(INTRO_SEEN_KEY) === '1';
}

/** 调试：强制每次开场 */
export function clearIntroSeen(storage: StorageLike = getDefaultStorage()): void {
  storage.removeItem(INTRO_SEEN_KEY);
}
