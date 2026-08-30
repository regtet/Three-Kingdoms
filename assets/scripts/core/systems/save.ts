import type { GameState } from '../models/types';
import { SAVE_KEY, SAVE_VERSION } from '../models/types';

export const MAX_SAVE_SLOTS = 3;
export const ACTIVE_SLOT_KEY = 'three_kingdoms_active_slot';

function slotKey(slot: number): string {
  return `${SAVE_KEY}_slot_${slot}`;
}

export function getActiveSlot(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const v = localStorage.getItem(ACTIVE_SLOT_KEY);
    return v ? Math.min(MAX_SAVE_SLOTS - 1, Math.max(0, parseInt(v, 10))) : 0;
  } catch {
    return 0;
  }
}

export function setActiveSlot(slot: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_SLOT_KEY, String(Math.min(MAX_SAVE_SLOTS - 1, Math.max(0, slot))));
    }
  } catch { /* ignore */ }
}

function migrateState(data: GameState): GameState {
  if (!data.wildGenerals) data.wildGenerals = [];
  for (const rel of data.relations) {
    if (rel.relationScore === undefined) {
      rel.relationScore = rel.status === 'allied' ? 85 : rel.status === 'truce' ? 65 : rel.status === 'neutral' ? 40 : 0;
    }
  }
  for (const g of data.generals) {
    if (g.age === undefined) g.age = 30 + (g.name.charCodeAt(0) % 25);
  }
  data.saveVersion = SAVE_VERSION;
  return data;
}

export function serializeGame(state: GameState): string {
  return JSON.stringify({ ...state, saveVersion: SAVE_VERSION });
}

export function deserializeGame(json: string): GameState | null {
  try {
    const data = JSON.parse(json) as GameState;
    if (!data || !data.cities || !data.generals || !data.factions) return null;
    if (data.saveVersion === SAVE_VERSION) return data;
    if (data.saveVersion === 3 || data.saveVersion === undefined) return migrateState(data);
    return null;
  } catch {
    return null;
  }
}

export function saveToStorage(state: GameState, slot = getActiveSlot()): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(slotKey(slot), serializeGame(state));
      setActiveSlot(slot);
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function loadFromStorage(slot = getActiveSlot()): GameState | null {
  try {
    if (typeof localStorage !== 'undefined') {
      let raw = localStorage.getItem(slotKey(slot));
      if (!raw && slot === 0) raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const state = deserializeGame(raw);
      if (state && slot === 0 && !localStorage.getItem(slotKey(0)) && raw) {
        localStorage.setItem(slotKey(0), raw);
      }
      return state;
    }
  } catch { /* ignore */ }
  return null;
}

export function hasAnySave(): boolean {
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    if (hasSave(i)) return true;
  }
  return false;
}

export function hasSave(slot = getActiveSlot()): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem(slotKey(slot))) return true;
      return slot === 0 && localStorage.getItem(SAVE_KEY) !== null;
    }
  } catch { /* ignore */ }
  return false;
}

export function clearSave(slot = getActiveSlot()): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(slotKey(slot));
      if (slot === 0) localStorage.removeItem(SAVE_KEY);
    }
  } catch { /* ignore */ }
}

export function peekSlotRaw(slot: number): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(slotKey(slot)) ?? (slot === 0 ? localStorage.getItem(SAVE_KEY) : null);
  } catch {
    return null;
  }
}
