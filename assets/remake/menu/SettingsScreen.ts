import { Color, Node } from 'cc';
import {
  applyMenuBgmVolume,
  createClassicButton,
  makeLabel,
  playMenuBgm,
} from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
import { loadSettings, saveSettings, type SettingsState } from '../shared/SettingsPrefs';

function volLabel(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export async function buildSettingsScreen(layer: Node, onBack: () => void): Promise<void> {
  const shell = await createMenuShell(layer, '设置', onBack);
  let prefs: SettingsState = loadSettings();

  const musicLine = makeRowLabel(shell.body, 'MusicLine', '', 420, { fontSize: 30 });
  const sfxLine = makeRowLabel(shell.body, 'SfxLine', '', 120, { fontSize: 30 });
  makeRowLabel(shell.body, 'Display', '画面：竖屏 1080×1920（预留）', -140, {
    fontSize: 28,
    color: new Color(170, 160, 140, 220),
  });
  makeRowLabel(shell.body, 'Lang', '语言：简体中文', -220, {
    fontSize: 28,
    color: new Color(170, 160, 140, 220),
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

  await createClassicButton(shell.body, {
    name: 'MusicToggle',
    label: '音乐开/关',
    style: 'quaternary',
    width: 280,
    height: 72,
    y: 340,
    onClick: () => {
      prefs = { ...prefs, musicEnabled: !prefs.musicEnabled };
      persist();
    },
  });

  await createClassicButton(shell.body, {
    name: 'MusicDown',
    label: '音量−',
    style: 'quaternary',
    width: 200,
    height: 72,
    y: 250,
    onClick: () => {
      prefs = { ...prefs, musicVolume: Math.max(0, +(prefs.musicVolume - 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('MusicDown')?.setPosition(-140, 250, 0);

  await createClassicButton(shell.body, {
    name: 'MusicUp',
    label: '音量+',
    style: 'quaternary',
    width: 200,
    height: 72,
    y: 250,
    onClick: () => {
      prefs = { ...prefs, musicVolume: Math.min(1, +(prefs.musicVolume + 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('MusicUp')?.setPosition(140, 250, 0);

  await createClassicButton(shell.body, {
    name: 'SfxToggle',
    label: '音效开/关',
    style: 'quaternary',
    width: 280,
    height: 72,
    y: 40,
    onClick: () => {
      prefs = { ...prefs, sfxEnabled: !prefs.sfxEnabled };
      persist();
    },
  });

  await createClassicButton(shell.body, {
    name: 'SfxDown',
    label: '音量−',
    style: 'quaternary',
    width: 200,
    height: 72,
    y: -50,
    onClick: () => {
      prefs = { ...prefs, sfxVolume: Math.max(0, +(prefs.sfxVolume - 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('SfxDown')?.setPosition(-140, -50, 0);

  await createClassicButton(shell.body, {
    name: 'SfxUp',
    label: '音量+',
    style: 'quaternary',
    width: 200,
    height: 72,
    y: -50,
    onClick: () => {
      prefs = { ...prefs, sfxVolume: Math.min(1, +(prefs.sfxVolume + 0.1).toFixed(2)) };
      persist();
    },
  });
  shell.body.getChildByName('SfxUp')?.setPosition(140, -50, 0);

  makeLabel(shell.body, 'Hint', '画面与语言项将在后续版本开放', {
    fontSize: 22,
    color: new Color(140, 130, 110, 180),
    y: -300,
  });
}
