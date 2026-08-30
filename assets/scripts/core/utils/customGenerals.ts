import type { ScenarioGeneralDef } from '../models/types';

export const CUSTOM_GENERALS_KEY = 'three_kingdoms_custom_generals';

export type CustomGeneralDef = ScenarioGeneralDef & { age?: number; bio?: string };

export function loadCustomGenerals(): CustomGeneralDef[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(CUSTOM_GENERALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomGeneralDef[];
  } catch {
    return [];
  }
}

export function saveCustomGenerals(generals: CustomGeneralDef[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_GENERALS_KEY, JSON.stringify(generals));
    }
  } catch { /* ignore */ }
}

export function applyCustomGeneralsToScenario(generals: ScenarioGeneralDef[]): ScenarioGeneralDef[] {
  const customs = loadCustomGenerals();
  if (customs.length === 0) return generals;
  const map = new Map(customs.map((g) => [g.id, g]));
  return generals.map((g) => {
    const c = map.get(g.id);
    return c ? { ...g, ...c } : g;
  });
}
