import { Component, Node, Vec3, game, sys } from 'cc';
import { RL } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeButton,
  remakePageTitle,
  remakeTextItem,
} from '../shared/RemakeWidgets';
import { applyMenuBackground } from '../../ui/MenuBackground';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../ui/GameSettings';
import { audioManager } from '../../ui/AudioManager';
import { getMenuBackgroundLabel, nextMenuBackgroundId } from '../../core/data/menuBackgrounds';

export function buildSettingsScreen(layer: Node, host: Component, onBack: () => void): void {
  clearChildren(layer);
  fillScreenBg(layer);
  let settings = loadSettings();
  applyMenuBackground(layer, settings.menuBackgroundId);
  remakePageTitle(layer, '设置', '音效与确认');

  const rebuild = () => buildSettingsScreen(layer, host, onBack);

  const rows: [string, () => void][] = [
    [
      `音效：${settings.sfxEnabled ? '开' : '关'}`,
      () => {
        settings = { ...settings, sfxEnabled: !settings.sfxEnabled };
        saveSettings(settings);
        audioManager.applySettings(settings);
        rebuild();
      },
    ],
    [
      `结束确认：${settings.confirmEndTurn ? '开' : '关'}`,
      () => {
        settings = { ...settings, confirmEndTurn: !settings.confirmEndTurn };
        saveSettings(settings);
        rebuild();
      },
    ],
    [
      `战术战：${settings.tacticalBattle ? '开' : '关'}`,
      () => {
        settings = { ...settings, tacticalBattle: !settings.tacticalBattle };
        saveSettings(settings);
        rebuild();
      },
    ],
    [
      `背景：${getMenuBackgroundLabel(settings.menuBackgroundId)}`,
      () => {
        settings = { ...settings, menuBackgroundId: nextMenuBackgroundId(settings.menuBackgroundId) };
        saveSettings(settings);
        rebuild();
      },
    ],
    [
      '恢复默认',
      () => {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings(settings);
        audioManager.applySettings(settings);
        rebuild();
      },
    ],
  ];

  rows.forEach(([text, cb], i) => {
    remakeTextItem(layer, `Set_${i}`, text, RL.PAGE_LIST_START_Y - i * RL.PAGE_LIST_GAP, host, cb);
  });

  remakeButton(layer, 'Back', '返回', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBack, 200, 48);
}

export function requestExitApp(): void {
  if (sys.isNative) {
    game.end();
  } else {
    console.log('[Remake] 浏览器预览无法退出，请关闭标签页');
  }
}
