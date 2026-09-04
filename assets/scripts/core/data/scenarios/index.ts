import type { ScenarioCityDef, ScenarioData } from '../models/types';
import { SCENARIO_001 } from '../scenario_001';
import { SCENARIO_002 } from '../scenario_002';
import { SCENARIO_003 } from '../scenario_003';

export const ALL_SCENARIOS: ScenarioData[] = [SCENARIO_001, SCENARIO_002, SCENARIO_003];

export function getScenario(id: string): ScenarioData {
  return ALL_SCENARIOS.find((s) => s.id === id) ?? SCENARIO_001;
}

/** 按剧本取地图布局（城池 id / 坐标 / 邻接） */
export function getMapLayout(scenarioOrId: ScenarioData | string): ScenarioCityDef[] {
  const scenario = typeof scenarioOrId === 'string' ? getScenario(scenarioOrId) : scenarioOrId;
  return scenario.cities;
}

/** @deprecated 使用 getMapLayout(scenarioId) */
export const MAP_LAYOUT = SCENARIO_001.cities;
