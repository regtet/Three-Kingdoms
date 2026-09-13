import {
  Component,
  Label,
  Mask,
  Node,
  ScrollView,
  UITransform,
  Vec3,
  game,
  sys,
} from 'cc';
import { getMenuBackgroundLabel, nextMenuBackgroundId } from '../../core/data/menuBackgrounds';
import { audioManager } from '../../ui/AudioManager';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../ui/GameSettings';
import { applyMenuBackground } from '../../ui/MenuBackground';
import { RL } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeButton,
  remakePageTitle,
  remakeTextItem,
} from '../shared/RemakeWidgets';

function volLabel(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function nextVol(v: number): number {
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const idx = steps.findIndex((s) => Math.abs(s - v) < 0.05);
  return steps[(Math.max(idx, 0) + 1) % steps.length];
}

function setMenuItemText(node: Node, text: string): void {
  const main = node.getChildByName('Label')?.getComponent(Label);
  const shadow = node.getChildByName('Shadow')?.getComponent(Label);
  if (main) main.string = text;
  if (shadow) shadow.string = text;
}

/** 设置页：ScrollView 列表 + 就地改文案（禁止整页 destroy 重建） */
export function buildSettingsScreen(layer: Node, host: Component, onBack: () => void): void {
  clearChildren(layer);
  fillScreenBg(layer);
  let settings = loadSettings();
  applyMenuBackground(layer, settings.menuBackgroundId);
  remakePageTitle(layer, '设置', '点按切换 · 列表可滚动');

  const viewport = new Node('SettingsScroll');
  layer.addChild(viewport);
  viewport.setPosition(0, RL.SETTINGS_SCROLL_Y, 0);
  viewport.addComponent(UITransform).setContentSize(RL.SETTINGS_SCROLL_W, RL.SETTINGS_SCROLL_H);
  viewport.addComponent(Mask).type = Mask.Type.RECT;

  const content = new Node('Content');
  viewport.addChild(content);
  const contentTf = content.addComponent(UITransform);
  contentTf.setAnchorPoint(0.5, 1);
  content.setPosition(0, RL.SETTINGS_SCROLL_H / 2, 0);

  const scrollView = viewport.addComponent(ScrollView);
  scrollView.content = content;
  scrollView.vertical = true;
  scrollView.horizontal = false;
  scrollView.inertia = true;
  scrollView.brake = 0.75;
  scrollView.elastic = true;
  scrollView.cancelInnerEvents = true;

  type Row = { id: string; text: () => string; onClick: () => void };
  const rows: Row[] = [
    {
      id: 'bgm',
      text: () => `音乐：${settings.bgmEnabled ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, bgmEnabled: !settings.bgmEnabled };
        persist();
        audioManager.applySettings(settings);
        if (settings.bgmEnabled) audioManager.startMenuBgm();
        else audioManager.stopBgm();
      },
    },
    {
      id: 'sfx',
      text: () => `音效：${settings.sfxEnabled ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, sfxEnabled: !settings.sfxEnabled };
        persist();
        audioManager.applySettings(settings);
      },
    },
    {
      id: 'bgmVol',
      text: () => `音乐音量：${volLabel(settings.bgmVolume)}`,
      onClick: () => {
        settings = { ...settings, bgmVolume: nextVol(settings.bgmVolume) };
        persist();
        audioManager.applySettings(settings);
      },
    },
    {
      id: 'sfxVol',
      text: () => `音效音量：${volLabel(settings.sfxVolume)}`,
      onClick: () => {
        settings = { ...settings, sfxVolume: nextVol(settings.sfxVolume) };
        persist();
        audioManager.applySettings(settings);
      },
    },
    {
      id: 'confirm',
      text: () => `结束确认：${settings.confirmEndTurn ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, confirmEndTurn: !settings.confirmEndTurn };
        persist();
      },
    },
    {
      id: 'cutscene',
      text: () => `战报演出：${settings.battleCutscene ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, battleCutscene: !settings.battleCutscene };
        persist();
      },
    },
    {
      id: 'tactical',
      text: () => `战术战：${settings.tacticalBattle ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, tacticalBattle: !settings.tacticalBattle };
        persist();
      },
    },
    {
      id: 'skipAi',
      text: () => `跳过 AI 遮罩：${settings.skipAiOverlay ? '开' : '关'}`,
      onClick: () => {
        settings = { ...settings, skipAiOverlay: !settings.skipAiOverlay };
        persist();
      },
    },
    {
      id: 'bg',
      text: () => `背景：${getMenuBackgroundLabel(settings.menuBackgroundId)}`,
      onClick: () => {
        settings = {
          ...settings,
          menuBackgroundId: nextMenuBackgroundId(settings.menuBackgroundId),
        };
        persist();
        applyMenuBackground(layer, settings.menuBackgroundId);
      },
    },
    {
      id: 'reset',
      text: () => '恢复默认',
      onClick: () => {
        settings = { ...DEFAULT_SETTINGS };
        persist();
        audioManager.applySettings(settings);
        if (settings.bgmEnabled) audioManager.startMenuBgm();
        else audioManager.stopBgm();
        applyMenuBackground(layer, settings.menuBackgroundId);
      },
    },
  ];

  const itemNodes: Node[] = [];
  const rowPitch = RL.SETTINGS_ROW_GAP;
  contentTf.setContentSize(RL.SETTINGS_SCROLL_W, Math.max(rows.length * rowPitch, RL.SETTINGS_SCROLL_H));

  function persist() {
    saveSettings(settings);
    refreshLabels();
  }

  function refreshLabels() {
    rows.forEach((row, i) => {
      const n = itemNodes[i];
      if (n) setMenuItemText(n, row.text());
    });
  }

  rows.forEach((row, i) => {
    const y = -i * rowPitch - RL.TITLE_ITEM_H / 2;
    const node = remakeTextItem(content, `Set_${row.id}`, row.text(), y, host, () => row.onClick());
    // remakeTextItem 会把 y 设成世界式 position.y；上面已传入本地 y
    itemNodes.push(node);
  });

  remakeButton(layer, 'Back', '返回', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBack, 200, 48);
  scrollView.scrollToTop(0);
}

export function requestExitApp(): void {
  if (sys.isNative) {
    game.end();
  } else {
    console.log('[Remake] 浏览器预览无法退出，请关闭标签页');
  }
}
