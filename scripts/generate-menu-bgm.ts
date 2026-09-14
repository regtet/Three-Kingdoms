/**
 * 生成标题屏氛围 BGM：月夜低鸣 + 稀疏五声音符（可循环）。
 * 有意做成「静」——不抢戏；正式曲目以后可替换文件。
 * 运行：npm run gen:menu-bgm
 */
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('assets/resources/audio/menu_ambient.wav');
const SAMPLE_RATE = 44100;
const DURATION = 32; // 秒，循环友好

/** 五声：宫商角徵羽（相对 A3） */
const PENT = [220.0, 246.94, 277.18, 329.63, 369.99];

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function softNoise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed) * 43758.5453;
  return x - Math.floor(x);
}

function tone(freq: number, t: number, amp: number, attack: number, release: number, len: number): number {
  if (t < 0 || t > len) return 0;
  const a = t < attack ? t / attack : 1;
  const r = t > len - release ? Math.max(0, (len - t) / release) : 1;
  const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
  return amp * a * r * Math.sin(2 * Math.PI * freq * vib * t);
}

function sampleAt(t: number): number {
  // 低沉地鸣（夜色）
  const drone =
    0.09 * Math.sin(2 * Math.PI * 55 * t) +
    0.05 * Math.sin(2 * Math.PI * 82.5 * t) +
    0.03 * Math.sin(2 * Math.PI * 110 * t);

  // 缓慢五声拨弦感
  let pluck = 0;
  const events = [
    { at: 2.0, i: 0, len: 3.5 },
    { at: 5.5, i: 2, len: 2.8 },
    { at: 9.0, i: 4, len: 3.2 },
    { at: 13.0, i: 1, len: 2.5 },
    { at: 16.5, i: 3, len: 3.0 },
    { at: 20.0, i: 0, len: 4.0 },
    { at: 24.5, i: 2, len: 3.0 },
    { at: 28.0, i: 4, len: 3.5 },
  ];
  for (const e of events) {
    const local = t - e.at;
    const f = PENT[e.i];
    pluck += tone(f, local, 0.11, 0.02, 1.8, e.len);
    pluck += tone(f * 2, local, 0.03, 0.01, 1.2, e.len * 0.7);
  }

  // 极轻风噪
  const wind = (softNoise(t * 0.7, 1.7) - 0.5) * 0.02 * (0.5 + 0.5 * Math.sin(t * 0.15));

  // 淡入淡出，便于 loop
  const fade = Math.min(1, t / 1.2, (DURATION - t) / 1.2);
  return clamp((drone + pluck + wind) * fade * 0.85);
}

function writeWav(file: string) {
  const n = Math.floor(SAMPLE_RATE * DURATION);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
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
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < n; i++) {
    const s = sampleAt(i / SAMPLE_RATE);
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('wrote', file, `(${DURATION}s)`);
}

writeWav(OUT);
