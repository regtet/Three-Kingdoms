import type { GameSettings } from './GameSettings';
import { DEFAULT_SETTINGS } from './GameSettings';

export type SfxName = 'click' | 'success' | 'fail' | 'battle' | 'stratagem' | 'turn_end' | 'capture';
export type BgmTrack = 'menu' | 'game';

/** Cocos 运行时注入的真实音频播放器 */
export interface FileAudioProvider {
  playSfx(name: SfxName): void;
  startMenuBgm(): void;
  startGameBgm(): void;
  startBgm(): void;
  stopBgm(): void;
  setBgmVolume(v: number): void;
  setSfxVolume(v: number): void;
  setBgmEnabled(on: boolean): void;
  setSfxEnabled(on: boolean): void;
}

/**
 * 音频管理：优先使用 WAV 文件（Cocos resources），否则回退 Web Audio 合成
 */
class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private bgmNodes: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private bgmEnabled = true;
  private sfxEnabled = true;
  private bgmVolume = DEFAULT_SETTINGS.bgmVolume;
  private sfxVolume = DEFAULT_SETTINGS.sfxVolume;
  private bgmPlaying = false;
  private bgmTrack: BgmTrack | null = null;
  private fileProvider: FileAudioProvider | null = null;
  private useFiles = false;

  /** 由 CocosAudioBridge 在资源加载完成后调用 */
  bindFileProvider(provider: FileAudioProvider) {
    this.fileProvider = provider;
    this.useFiles = true;
    provider.setBgmVolume(this.bgmVolume);
    provider.setSfxVolume(this.sfxVolume);
    provider.setBgmEnabled(this.bgmEnabled);
    provider.setSfxEnabled(this.sfxEnabled);
    if (this.bgmPlaying && this.bgmEnabled && this.bgmTrack) {
      if (this.bgmTrack === 'menu') provider.startMenuBgm();
      else provider.startGameBgm();
    }
  }

  applySettings(s: GameSettings) {
    this.bgmEnabled = s.bgmEnabled;
    this.sfxEnabled = s.sfxEnabled;
    this.bgmVolume = s.bgmVolume;
    this.sfxVolume = s.sfxVolume;
    if (this.useFiles && this.fileProvider) {
      this.fileProvider.setBgmVolume(s.bgmVolume);
      this.fileProvider.setSfxVolume(s.sfxVolume);
      this.fileProvider.setBgmEnabled(s.bgmEnabled);
      this.fileProvider.setSfxEnabled(s.sfxEnabled);
      if (!s.bgmEnabled) this.bgmPlaying = false;
      return;
    }
    this.refreshBgmGain();
    if (!this.bgmEnabled && this.bgmPlaying) this.stopBgm();
  }

  setMuted(m: boolean) {
    this.bgmEnabled = !m;
    this.sfxEnabled = !m;
    if (this.useFiles && this.fileProvider) {
      this.fileProvider.setBgmEnabled(!m);
      this.fileProvider.setSfxEnabled(!m);
      if (m) this.bgmPlaying = false;
      return;
    }
    this.refreshBgmGain();
    if (m && this.bgmPlaying) this.stopBgm();
  }

  isMuted(): boolean {
    return !this.bgmEnabled && !this.sfxEnabled;
  }

  setBgmEnabled(on: boolean) {
    this.bgmEnabled = on;
    if (this.useFiles && this.fileProvider) {
      this.fileProvider.setBgmEnabled(on);
      if (!on) this.bgmPlaying = false;
      else if (!this.bgmPlaying) { this.startMenuBgm(); }
      return;
    }
    if (!on) this.stopBgm();
    else if (!this.bgmPlaying) this.startMenuBgm();
    this.refreshBgmGain();
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on;
    if (this.useFiles && this.fileProvider) this.fileProvider.setSfxEnabled(on);
  }

  setBgmVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.useFiles && this.fileProvider) this.fileProvider.setBgmVolume(this.bgmVolume);
    else this.refreshBgmGain();
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.useFiles && this.fileProvider) this.fileProvider.setSfxVolume(this.sfxVolume);
  }

  getSettingsSnapshot(): Pick<GameSettings, 'bgmEnabled' | 'sfxEnabled' | 'bgmVolume' | 'sfxVolume'> {
    return {
      bgmEnabled: this.bgmEnabled,
      sfxEnabled: this.sfxEnabled,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  private refreshBgmGain() {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.bgmEnabled ? this.bgmVolume * 0.1 : 0;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playFileOrSynth(sfx: SfxName, synth: () => void) {
    if (this.useFiles && this.fileProvider && this.sfxEnabled) {
      this.fileProvider.playSfx(sfx);
      return;
    }
    synth();
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxEnabled) return;
    const vol = volume * this.sfxVolume;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private chord(freqs: number[], duration: number, volume = 0.05) {
    freqs.forEach((f) => this.tone(f, duration, 'triangle', volume));
  }

  playClick() {
    this.playFileOrSynth('click', () => this.tone(880, 0.06, 'square', 0.04));
  }

  playSuccess() {
    this.playFileOrSynth('success', () => this.chord([523, 659, 784], 0.18, 0.045));
  }

  playFail() {
    this.playFileOrSynth('fail', () => this.tone(220, 0.25, 'sawtooth', 0.05));
  }

  playBattle() {
    this.playFileOrSynth('battle', () => {
      this.chord([110, 146, 185], 0.35, 0.06);
      setTimeout(() => this.tone(98, 0.2, 'sawtooth', 0.05), 120);
    });
  }

  playStratagem() {
    this.playFileOrSynth('stratagem', () => {
      this.chord([440, 554, 659], 0.22, 0.05);
      setTimeout(() => this.tone(880, 0.12, 'sine', 0.04), 100);
    });
  }

  playTurnEnd() {
    this.playFileOrSynth('turn_end', () => this.chord([392, 494, 587], 0.28, 0.045));
  }

  playCapture() {
    this.playFileOrSynth('capture', () => this.chord([659, 784, 988], 0.35, 0.055));
  }

  startMenuBgm() {
    if (this.useFiles && this.fileProvider) {
      if (!this.bgmEnabled) return;
      this.fileProvider.startMenuBgm();
      this.bgmPlaying = true;
      this.bgmTrack = 'menu';
      return;
    }
    this.startBgmSynth();
    this.bgmTrack = 'menu';
  }

  startGameBgm() {
    if (this.useFiles && this.fileProvider) {
      if (!this.bgmEnabled) return;
      this.fileProvider.startGameBgm();
      this.bgmPlaying = true;
      this.bgmTrack = 'game';
      return;
    }
    this.startBgmSynth();
    this.bgmTrack = 'game';
  }

  /** @deprecated 使用 startGameBgm */
  startBgm() {
    this.startGameBgm();
  }

  private startBgmSynth() {
    const ctx = this.ensureCtx();
    if (!ctx || this.bgmPlaying || !this.bgmEnabled) return;
    this.stopBgm();
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = this.bgmVolume * 0.1;
    this.bgmGain.connect(ctx.destination);

    const notes = [220, 277, 330, 277];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.015;
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start(ctx.currentTime + i * 0.05);
      this.bgmNodes.push(osc);
    });
    this.bgmPlaying = true;
  }

  stopBgm() {
    if (this.useFiles && this.fileProvider) {
      this.fileProvider.stopBgm();
    }
    this.bgmNodes.forEach((n) => {
      try { n.stop(); } catch { /* already stopped */ }
    });
    this.bgmNodes = [];
    this.bgmGain = null;
    this.bgmPlaying = false;
    this.bgmTrack = null;
  }
}

export const audioManager = new AudioManagerImpl();
