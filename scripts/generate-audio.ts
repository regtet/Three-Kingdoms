/**
 * 生成程序化 WAV 音效（无需外部素材，可自由使用）
 * 运行: npm run generate:audio
 */
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, '../assets/resources/audio');
const SAMPLE_RATE = 22050;

type SfxDef = {
  name: string;
  duration: number;
  render: (t: number, i: number, n: number) => number;
};

function writeWav(name: string, samples: Float32Array) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.floor(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, `${name}.wav`), buf);
  console.log(`  ✓ ${name}.wav`);
}

function renderSfx(def: SfxDef): Float32Array {
  const n = Math.floor(def.duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = def.render(t, i, n);
  }
  return out;
}

function env(t: number, dur: number, attack = 0.02, release = 0.15): number {
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

function tone(t: number, freq: number, type: 'sine' | 'square' | 'tri' | 'saw' = 'sine'): number {
  const p = (t * freq) % 1;
  if (type === 'sine') return Math.sin(2 * Math.PI * t * freq);
  if (type === 'square') return p < 0.5 ? 1 : -1;
  if (type === 'saw') return 2 * p - 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

const SFX: SfxDef[] = [
  {
    name: 'click',
    duration: 0.08,
    render: (t) => tone(t, 1200, 'square') * env(t, 0.08, 0.005, 0.04) * 0.25,
  },
  {
    name: 'success',
    duration: 0.35,
    render: (t) => {
      const f = t < 0.12 ? 523 : t < 0.22 ? 659 : 784;
      return tone(t, f, 'tri') * env(t, 0.35, 0.01, 0.12) * 0.3;
    },
  },
  {
    name: 'fail',
    duration: 0.3,
    render: (t) => tone(t, 180 - t * 120, 'saw') * env(t, 0.3, 0.01, 0.15) * 0.35,
  },
  {
    name: 'battle',
    duration: 0.55,
    render: (t) => {
      const drum = Math.sin(2 * Math.PI * 3 * t) * Math.exp(-t * 6) * 0.5;
      const clash = tone(t, 150, 'saw') * env(t, 0.55, 0.02, 0.2) * 0.25;
      const hit = t > 0.15 ? tone(t - 0.15, 80, 'square') * env(t - 0.15, 0.3, 0.01, 0.15) * 0.4 : 0;
      return drum + clash + hit;
    },
  },
  {
    name: 'stratagem',
    duration: 0.4,
    render: (t) => {
      const bell = tone(t, 880, 'sine') * env(t, 0.4, 0.02, 0.2) * 0.2;
      const sweep = tone(t, 440 + t * 400, 'tri') * env(t, 0.4, 0.05, 0.15) * 0.15;
      return bell + sweep;
    },
  },
  {
    name: 'turn_end',
    duration: 0.45,
    render: (t) => {
      const f = t < 0.15 ? 392 : t < 0.3 ? 494 : 587;
      return tone(t, f, 'tri') * env(t, 0.45, 0.02, 0.18) * 0.28;
    },
  },
  {
    name: 'capture',
    duration: 0.5,
    render: (t) => {
      const fanfare = tone(t, 659, 'tri') * env(t, 0.5, 0.02, 0.25) * 0.2
        + tone(t, 784, 'tri') * env(t, 0.5, 0.08, 0.2) * 0.18
        + (t > 0.2 ? tone(t - 0.2, 988, 'sine') * env(t - 0.2, 0.3, 0.02, 0.15) * 0.22 : 0);
      return fanfare;
    },
  },
];

function renderBgm(): Float32Array {
  const duration = 8;
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  const melody = [262, 330, 392, 330, 294, 349, 392, 440];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const step = Math.floor(t * 2) % melody.length;
    const freq = melody[step];
    const noteT = (t * 2) % 1;
    const note = tone(t, freq, 'sine') * env(noteT, 0.5, 0.05, 0.2) * 0.12;
    const pad = tone(t, freq / 2, 'tri') * 0.04;
    const bass = tone(t, 110, 'sine') * 0.03;
    out[i] = note + pad + bass;
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
console.log('Generating audio to assets/resources/audio/ …');
for (const def of SFX) writeWav(def.name, renderSfx(def));
writeWav('bgm', renderBgm());
console.log('Done.');
