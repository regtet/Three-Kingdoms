import { _decorator, AudioClip, AudioSource, Component, Node, resources } from 'cc';
import { audioManager, type BgmTrack, type FileAudioProvider, type SfxName } from './AudioManager';

const { ccclass } = _decorator;

const CLIP_NAMES: (SfxName | 'bgm' | 'menu_bgm')[] = [
  'bgm', 'menu_bgm', 'click', 'success', 'fail', 'battle', 'stratagem', 'turn_end', 'capture',
];

/**
 * 从 assets/resources/audio/ 加载音频并绑定到 audioManager
 */
@ccclass('CocosAudioBridge')
export class CocosAudioBridge extends Component {
  private bgmSource!: AudioSource;
  private sfxSource!: AudioSource;
  private clips = new Map<string, AudioClip>();
  private bgmEnabled = true;
  private sfxEnabled = true;
  private bgmVolume = 0.6;
  private sfxVolume = 0.8;
  private currentBgm: BgmTrack | null = null;

  onLoad() {
    this.bgmSource = this.addComponent(AudioSource);
    this.bgmSource.loop = true;
    this.bgmSource.volume = this.bgmVolume;
    this.bgmSource.playOnAwake = false;

    const sfxNode = new Node('SfxAudio');
    this.node.addChild(sfxNode);
    this.sfxSource = sfxNode.addComponent(AudioSource);
    this.sfxSource.loop = false;
    this.sfxSource.playOnAwake = false;

    this.loadClips();
  }

  private loadClips() {
    let pending = CLIP_NAMES.length;
    let loaded = 0;
    for (const name of CLIP_NAMES) {
      resources.load(`audio/${name}`, AudioClip, (err, clip) => {
        pending--;
        if (!err && clip) {
          this.clips.set(name, clip);
          loaded++;
        } else if (err) {
          console.warn(`[CocosAudioBridge] 加载 audio/${name} 失败`, err);
        }
        if (pending === 0 && loaded > 0) {
          this.bindProvider();
        }
      });
    }
  }

  private playBgmTrack(track: BgmTrack) {
    if (!this.bgmEnabled) return;
    const key = track === 'menu' ? 'menu_bgm' : 'bgm';
    const clip = this.clips.get(key) ?? this.clips.get('bgm');
    if (!clip || !this.bgmSource) return;
    if (this.currentBgm === track && this.bgmSource.playing) return;
    this.bgmSource.stop();
    this.bgmSource.clip = clip;
    this.bgmSource.volume = this.bgmVolume;
    this.bgmSource.loop = true;
    this.bgmSource.play();
    this.currentBgm = track;
  }

  private playSfxClip(clip: AudioClip) {
    if (!this.sfxSource || !this.sfxEnabled) return;
    if (typeof this.sfxSource.playOneShot === 'function') {
      this.sfxSource.playOneShot(clip, this.sfxVolume);
      return;
    }
    this.sfxSource.stop();
    this.sfxSource.clip = clip;
    this.sfxSource.volume = this.sfxVolume;
    this.sfxSource.loop = false;
    this.sfxSource.play();
  }

  private bindProvider() {
    const provider: FileAudioProvider = {
      playSfx: (name: SfxName) => {
        if (!this.sfxEnabled) return;
        const clip = this.clips.get(name);
        if (clip) this.playSfxClip(clip);
      },
      startMenuBgm: () => this.playBgmTrack('menu'),
      startGameBgm: () => this.playBgmTrack('game'),
      startBgm: () => this.playBgmTrack('game'),
      stopBgm: () => {
        this.bgmSource?.stop();
        this.currentBgm = null;
      },
      setBgmVolume: (v) => {
        this.bgmVolume = v;
        if (this.bgmSource) this.bgmSource.volume = v;
      },
      setSfxVolume: (v) => {
        this.sfxVolume = v;
      },
      setBgmEnabled: (on) => {
        this.bgmEnabled = on;
        if (!on) {
          this.bgmSource?.stop();
          this.currentBgm = null;
        }
      },
      setSfxEnabled: (on) => {
        this.sfxEnabled = on;
      },
    };
    audioManager.bindFileProvider(provider);
  }
}
