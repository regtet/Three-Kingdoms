import { Component, Node, Vec3 } from 'cc';
import { ALL_SCENARIOS } from '../../core/data/scenarios/index';
import { getScenarioMeta } from '../../core/data/scenarioMeta';
import type { ScenarioData } from '../../core/models/types';
import { RL } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeButton,
  remakePageTitle,
  remakeTextItem,
} from '../shared/RemakeWidgets';
import { applyMenuBackground } from '../../ui/MenuBackground';
import { loadSettings } from '../../ui/GameSettings';

export function buildScenarioScreen(
  layer: Node,
  host: Component,
  onPick: (scenario: ScenarioData) => void,
  onBack: () => void,
): void {
  clearChildren(layer);
  fillScreenBg(layer);
  applyMenuBackground(layer, loadSettings().menuBackgroundId);
  remakePageTitle(layer, '选择剧本', '对照三國志２ · 历史开局');

  ALL_SCENARIOS.forEach((sc, i) => {
    const meta = getScenarioMeta(sc.id);
    const label = `${sc.name}　${meta.summary}`;
    const y = RL.PAGE_LIST_START_Y - i * RL.PAGE_LIST_GAP;
    remakeTextItem(layer, `Sc_${sc.id}`, label, y, host, () => onPick(sc));
  });

  remakeButton(layer, 'Back', '返回', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBack, 200, 48);
}
