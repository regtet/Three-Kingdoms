/**
 * 生成武将像素立绘 PNG（48×48，原创程序化绘制）
 * 运行: npm run generate:portraits
 */
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { SCENARIO_002 } from '../assets/scripts/core/data/scenario_002';

const OUT = path.join(__dirname, '../assets/resources/portraits');
const W = 48;
const H = 48;

interface PortraitDef {
  id: string;
  name: string;
  force: number;
  intelligence: number;
}

function collectGenerals(): PortraitDef[] {
  const map = new Map<string, PortraitDef>();
  for (const sc of [SCENARIO_001, SCENARIO_002]) {
    for (const g of sc.generals) {
      map.set(g.id, { id: g.id, name: g.name, force: g.force, intelligence: g.intelligence });
    }
    for (const w of sc.wildGenerals ?? []) {
      map.set(w.id, { id: w.id, name: w.name, force: w.force, intelligence: w.intelligence });
    }
  }
  return [...map.values()];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function hsv(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0; let g = 0; let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255),
  ];
}

function setPx(data: Uint8Array, x: number, y: number, r: number, g: number, b: number, a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
}

function fillRect(data: Uint8Array, x0: number, y0: number, w: number, h: number, rgb: [number, number, number]) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPx(data, x, y, rgb[0], rgb[1], rgb[2]);
  }
}

function fillEllipse(data: Uint8Array, cx: number, cy: number, rx: number, ry: number, rgb: [number, number, number]) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(data, x, y, rgb[0], rgb[1], rgb[2]);
    }
  }
}

function renderPortrait(def: PortraitDef): Uint8Array {
  const data = new Uint8Array(W * H * 4);
  const h = hash(def.id);
  const hair = hsv(h % 360, 0.5, 0.35);
  const skin = hsv(30 + (h % 20), 0.25, 0.85);
  const robe = hsv((h >> 8) % 360, 0.45, 0.55);
  const armor = hsv((h >> 16) % 360, 0.3, 0.65);

  fillRect(data, 0, 0, W, H, [20, 28, 42]);

  // 身体 / 袍服
  fillEllipse(data, 24, 38, 16, 14, robe);
  if (def.force >= 85) {
    fillRect(data, 14, 28, 20, 12, armor);
  }

  // 脸部
  fillEllipse(data, 24, 20, 13, 15, skin);

  // 头发
  fillEllipse(data, 24, 12, 14, 8, hair);
  fillRect(data, 10, 12, 28, 8, hair);

  // 眼
  const eyeY = 22;
  setPx(data, 18, eyeY, 30, 20, 15);
  setPx(data, 19, eyeY, 30, 20, 15);
  setPx(data, 30, eyeY, 30, 20, 15);
  setPx(data, 31, eyeY, 30, 20, 15);
  setPx(data, 19, eyeY + 1, 255, 255, 255);
  setPx(data, 31, eyeY + 1, 255, 255, 255);

  // 须（高武力）
  if (def.force >= 88) {
    for (let x = 20; x <= 28; x++) setPx(data, x, 28, 60, 45, 35);
    setPx(data, 24, 29, 60, 45, 35);
  }

  // 智将头巾
  if (def.intelligence >= 90) {
    fillRect(data, 12, 8, 24, 4, [180, 50, 50]);
  }

  return data;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

function writePng(filePath: string, rgba: Uint8Array) {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const o = y * (1 + W * 3) + 1 + x * 3;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
    }
  }
  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
}

fs.mkdirSync(OUT, { recursive: true });
const generals = collectGenerals();
console.log(`Generating ${generals.length} portraits to assets/resources/portraits/ …`);
for (const g of generals) {
  writePng(path.join(OUT, `${g.id}.png`), renderPortrait(g));
  console.log(`  ✓ ${g.id}.png (${g.name})`);
}
console.log('Done.');
