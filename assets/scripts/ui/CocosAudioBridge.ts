import { _decorator, AudioClip, AudioSource, Component, Node, resources } from 'cc';
import { audioManager, type FileAudioProvider, type SfxName } from './AudioManager';

const { ccclass } = _decorator;

const CLIP_NAMES: (SfxName | 'bgm')[] = [
  'bgm', 'click', 'success', 'fail', 'battle', 'stratagem', 'turn_end', 'capture',
];

/**
 * 从 assets/resources/audio/ 加载 WAV 并绑定到 audioManager
 * 挂到 GameBootstrap 节点即可
 */
@ccclass('CocosAudioBridge')
export class CocosAudioBridge extends Component {
  private bgmSource!: AudioSource;
  /** Cocos 3.8：playOneShot 为实例方法，非静态 */
  private sfxSource!: AudioSource;
  private clips = new Map<string, AudioClip>();
  private bgmEnabled = true;
  private sfxEnabled = true;
  private bgmVolume = 0.6;
  private sfxVolume = 0.8;

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
          console.warn(`[CocosAudioBridge] 加载 audio/${name} 失败，将使用合成音效`, err);
        }
        if (pending === 0 && loaded > 0) {
          this.bindProvider();
        }
      });
    }
  }

  private playSfxClip(clip: AudioClip) {
    if (!this.sfxSource || !this.sfxEnabled) return;
    // Cocos 3.8.8：实例方法 playOneShot
    if (typeof this.sfxSource.playOneShot === 'function') {
      this.sfxSource.playOneShot(clip, this.sfxVolume);
      return;
    }
    // 兼容旧版：单次播放
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
      startBgm: () => {
        if (!this.bgmEnabled) return;
        const clip = this.clips.get('bgm');
        if (clip && this.bgmSource) {
          this.bgmSource.clip = clip;
          this.bgmSource.volume = this.bgmVolume;
          this.bgmSource.loop = true;
          this.bgmSource.play();
        }
      },
      stopBgm: () => {
        this.bgmSource?.stop();
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
        if (!on) this.bgmSource?.stop();
      },
      setSfxEnabled: (on) => {
        this.sfxEnabled = on;
      },
    };
    audioManager.bindFileProvider(provider);
  }
}
