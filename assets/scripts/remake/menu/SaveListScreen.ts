import { Component, Node, Vec3 } from 'cc';
import { MAX_SAVE_SLOTS } from '../../core/systems/save';
import { formatSaveSlotMenuLine, peekSaveSummary } from '../../core/systems/saveSummary';
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

export function buildSaveListScreen(
  layer: Node,
  host: Component,
  onLoad: (slot: number) => void,
  onBack: () => void,
): void {
  clearChildren(layer);
  fillScreenBg(layer);
  applyMenuBackground(layer, loadSettings().menuBackgroundId);
  remakePageTitle(layer, '继续游戏', '选择存档槽');

  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const summary = peekSaveSummary(i);
    const text = summary ? formatSaveSlotMenuLine(i, summary) : `槽位 ${i + 1}　（空）`;
    const y = RL.PAGE_LIST_START_Y - i * RL.PAGE_LIST_GAP;
    if (summary) {
      remakeTextItem(layer, `Slot_${i}`, text, y, host, () => onLoad(i));
    } else {
      remakeTextItem(layer, `Slot_${i}`, text, y, host, () => {});
    }
  }

  remakeButton(layer, 'Back', '返回', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBack, 200, 48);
}
