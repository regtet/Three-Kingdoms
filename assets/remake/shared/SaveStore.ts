/**
 * 存档槽：列表 / 增删 / hasSave。
 */
import { getDefaultStorage, SAVE_STORAGE_KEY, type StorageLike } from './SaveProbe';

export type SaveSlot = {
  id: string;
  createdAt: number;
  updatedAt: number;
  scenarioId: string;
  scenarioName: string;
  rulerName: string;
  factionId: string;
  year: number;
  month: number;
};

export type SaveStore = { slots: SaveSlot[] };

function parseStore(raw: string | null): SaveStore {
  if (!raw) return { slots: [] };
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) {
      return { slots: data as SaveSlot[] };
    }
    if (data && typeof data === 'object' && Array.isArray((data as SaveStore).slots)) {
      return { slots: (data as SaveStore).slots };
    }
  } catch {
    /* ignore */
  }
  return { slots: [] };
}

export function listSaves(storage: StorageLike = getDefaultStorage()): SaveSlot[] {
  return parseStore(storage.getItem(SAVE_STORAGE_KEY)).slots.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function writeSaves(slots: SaveSlot[], storage: StorageLike = getDefaultStorage()): void {
  storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ slots }));
}

export function addSave(
  slot: Omit<SaveSlot, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  storage: StorageLike = getDefaultStorage(),
): SaveSlot {
  const now = Date.now();
  const full: SaveSlot = {
    id: slot.id ?? `slot_${now}`,
    createdAt: now,
    updatedAt: now,
    scenarioId: slot.scenarioId,
    scenarioName: slot.scenarioName,
    rulerName: slot.rulerName,
    factionId: slot.factionId,
    year: slot.year,
    month: slot.month,
  };
  const slots = listSaves(storage);
  slots.unshift(full);
  writeSaves(slots, storage);
  return full;
}

export function deleteSave(id: string, storage: StorageLike = getDefaultStorage()): boolean {
  const slots = listSaves(storage);
  const next = slots.filter((s) => s.id !== id);
  if (next.length === slots.length) return false;
  writeSaves(next, storage);
  return true;
}

export function findSave(id: string, storage: StorageLike = getDefaultStorage()): SaveSlot | null {
  return listSaves(storage).find((s) => s.id === id) ?? null;
}

export function formatSaveSummary(slot: SaveSlot): string {
  return `${slot.year}年${slot.month}月 · ${slot.rulerName} · ${slot.scenarioName}`;
}

export function formatSaveTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
