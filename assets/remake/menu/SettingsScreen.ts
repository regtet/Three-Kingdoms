import { Color, Node } from 'cc';
import {
  applyMenuBgmVolume,
  makeLabel,
  playMenuBgm,
} from '../shared/MenuChrome';
import {
  createInkOption,
  createMenuShell,
  makeRowLabel,
} from '../shared/MenuShell';
import { loadSettings, saveSettings, type SettingsState } from '../shared/SettingsPrefs';

function volLabel(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export async function buildSettingsScreen(layer: Node, onBack: () => void): Promise<void> {
  const shell = await createMenuShell(layer, '设置', onBack);
  let prefs: SettingsState = loadSettings();

  const musicLine = makeRowLabel(shell.body, 'MusicLine', '', 400, { fontSize: 30 });
  const sfxLine = makeRowLabel(shell.body, 'SfxLine', '', 80, { fontSize: 30 });
  makeRowLabel(shell.body, 'Display', '画面：竖屏 1080×1920（预留）', -200, {
    fontSize: 26,
  });
  makeRowLabel(shell.body, 'Lang', '语言：简体中文', -270, {
    fontSize: 26,
  });

  const refresh = () => {
    musicLine.string = `音乐：${prefs.musicEnabled ? '开' : '关'}　音量 ${volLabel(prefs.musicVolume)}`;
    sfxLine.string = `音效：${prefs.sfxEnabled ? '开' : '关'}　音量 ${volLabel(prefs.sfxVolume)}`;
  };
  refresh();

  const persist = () => {
    saveSettings(prefs);
    applyMenuBgmVolume();
    if (prefs.musicEnabled) playMenuBgm(shell.root);
    refresh();
  };

  await createInkOption(shell.body, {
    name: 'MusicToggle',
    label: '音乐 开/关',
    y: 300,
    width: 560,
    height: 72,
    onClick: () => {
      prefs = { ...prefs, musicEnabled: !prefs.musicEnabled };
      persist();
    },
  });

  await createInkOption(shell.body, {
    name: 'MusicDown',
    label: '音乐音量 −',
    y: 210,
    width: 280,
    height: 68,
    onClick: () => {
      prefs = { ...prefs, musicVolume: Math.max(0, +(prefs.musicVolume - 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('MusicDown')?.setPosition(-160, 210, 0);

  await createInkOption(shell.body, {
    name: 'MusicUp',
    label: '音乐音量 +',
    y: 210,
    width: 280,
    height: 68,
    onClick: () => {
      prefs = { ...prefs, musicVolume: Math.min(1, +(prefs.musicVolume + 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('MusicUp')?.setPosition(160, 210, 0);

  await createInkOption(shell.body, {
    name: 'SfxToggle',
    label: '音效 开/关',
    y: -20,
    width: 560,
    height: 72,
    onClick: () => {
      prefs = { ...prefs, sfxEnabled: !prefs.sfxEnabled };
      persist();
    },
  });

  await createInkOption(shell.body, {
    name: 'SfxDown',
    label: '音效音量 −',
    y: -110,
    width: 280,
    height: 68,
    onClick: () => {
      prefs = { ...prefs, sfxVolume: Math.max(0, +(prefs.sfxVolume - 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('SfxDown')?.setPosition(-160, -110, 0);

  await createInkOption(shell.body, {
    name: 'SfxUp',
    label: '音效音量 +',
    y: -110,
    width: 280,
    height: 68,
    onClick: () => {
      prefs = { ...prefs, sfxVolume: Math.min(1, +(prefs.sfxVolume + 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('SfxUp')?.setPosition(160, -110, 0);

  makeLabel(shell.body, 'Hint', '画面与语言项后续开放', {
    fontSize: 22,
    color: new Color(210, 198, 170, 180),
    y: -340,
  });
}
