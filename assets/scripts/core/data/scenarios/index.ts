import type { ScenarioData } from '../models/types';
import { SCENARIO_001 } from '../scenario_001';
import { SCENARIO_002 } from '../scenario_002';

export const ALL_SCENARIOS: ScenarioData[] = [SCENARIO_001, SCENARIO_002];

export function getScenario(id: string): ScenarioData {
  return ALL_SCENARIOS.find((s) => s.id === id) ?? SCENARIO_001;
}

/** 地图布局（各剧本共用城池坐标） */
export const MAP_LAYOUT = SCENARIO_001.cities;
