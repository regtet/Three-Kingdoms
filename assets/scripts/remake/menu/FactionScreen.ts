import { Component, Node, Vec3 } from 'cc';
import type { ScenarioData } from '../../core/models/types';
import { RL } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeButton,
  remakeLabel,
  remakePageTitle,
  remakeTextItem,
} from '../shared/RemakeWidgets';
import { applyMenuBackground } from '../../ui/MenuBackground';
import { loadSettings } from '../../ui/GameSettings';

export function buildFactionScreen(
  layer: Node,
  host: Component,
  scenario: ScenarioData,
  onPick: (factionId: string) => void,
  onBack: () => void,
): void {
  clearChildren(layer);
  fillScreenBg(layer);
  applyMenuBackground(layer, loadSettings().menuBackgroundId);
  remakePageTitle(layer, '选择势力', scenario.name);

  scenario.factions.forEach((f, i) => {
    const cities = scenario.cities.filter((c) => c.initialFactionId === f.id).length;
    const gens = scenario.generals.filter((g) => g.factionId === f.id).length;
    const y = RL.PAGE_LIST_START_Y - i * RL.PAGE_LIST_GAP;
    remakeTextItem(
      layer,
      `Fac_${f.id}`,
      `${f.name}（${f.rulerName}）· ${cities}城 ${gens}将`,
      y,
      host,
      () => onPick(f.id),
    );
  });

  remakeLabel(
    layer,
    'Hint',
    '选定后进入地图复刻（阶段4占位）',
    16,
    new Vec3(0, RL.PAGE_ACTION_Y, 0),
  );
  remakeButton(layer, 'Back', '返回', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBack, 200, 48);
}
