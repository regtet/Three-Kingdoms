/**
 * 生成菜单点击音：木牌叩击 + 极短铜铃尾。
 * 运行：npm run gen:menu-sfx
 */
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('assets/resources/audio/ui_tap.wav');
const SAMPLE_RATE = 44100;
const DURATION = 0.12;

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function sampleAt(t: number): number {
  // 木叩：低频噪声冲击
  const woodEnv = Math.exp(-t * 55);
  const wood =
    (Math.sin(2 * Math.PI * 180 * t) * 0.35 +
      Math.sin(2 * Math.PI * 95 * t) * 0.25 +
      (Math.random() * 2 - 1) * 0.45) *
    woodEnv;

  // 铜铃尾：短高音
  const bellEnv = Math.exp(-t * 28) * (t > 0.008 ? 1 : t / 0.008);
  const bell =
    (Math.sin(2 * Math.PI * 1480 * t) * 0.22 + Math.sin(2 * Math.PI * 2220 * t) * 0.1) *
    bellEnv;

  return clamp(wood * 0.72 + bell * 0.55);
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
    const t = i / SAMPLE_RATE;
    const s = sampleAt(t);
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('wrote', file, `(${DURATION}s)`);
}

writeWav(OUT);
