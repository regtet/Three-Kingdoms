import { Graphics } from 'cc';
import type { GameState } from '../../core/models/types';
import { RL, RC, remakeMapCoord, type RemakeColor } from '../shared/RemakeLayout';
import { toColor } from '../../ui/UiDraw';

type CityLayout = { id: string; name: string; x: number; y: number; neighbors: readonly string[] };

function hexToRgb(hex: string): RemakeColor {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
}

function soft(col: RemakeColor, a: number): RemakeColor {
  return { r: col.r, g: col.g, b: col.b, a };
}

/** 战略地图底图：浅绿陆地 + 势力色块 + 道路（无大黑框） */
export function drawRemakeStrategicMap(
  g: Graphics,
  state: GameState,
  cities: readonly CityLayout[],
  selectedCityId: string | null,
): void {
  g.clear();
  const hw = RL.MAP_AREA_W / 2;
  const hh = RL.MAP_AREA_H / 2;

  // 陆地底
  g.fillColor = toColor(RC.mapBg);
  g.rect(-hw, -hh, RL.MAP_AREA_W, RL.MAP_AREA_H);
  g.fill();

  // 陆地起伏（程序化，替代纯黑）
  g.fillColor = toColor({ ...RC.mapLand, a: 90 });
  g.ellipse(-120, 80, 220, 140);
  g.fill();
  g.fillColor = toColor({ r: 55, g: 85, b: 100, a: 70 });
  g.ellipse(40, -40, 260, 70);
  g.fill();
  g.fillColor = toColor({ ...RC.mapLand, a: 70 });
  g.ellipse(160, -120, 160, 100);
  g.fill();

  // 势力色块：每城一团半透明色
  for (const c of cities) {
    const city = state.cities.find((x) => x.id === c.id);
    const fac = state.factions.find((f) => f.id === city?.factionId);
    if (!fac) continue;
    const pos = remakeMapCoord(c.x, c.y);
    const col = hexToRgb(fac.color);
    g.fillColor = toColor(soft(col, 95));
    g.ellipse(pos.x, pos.y, 52, 38);
    g.fill();
    g.fillColor = toColor(soft(col, 55));
    g.ellipse(pos.x + 8, pos.y - 6, 36, 28);
    g.fill();
  }

  // 道路
  const drawn = new Set<string>();
  for (const c of cities) {
    const posA = remakeMapCoord(c.x, c.y);
    for (const nid of c.neighbors) {
      const key = c.id < nid ? `${c.id}_${nid}` : `${nid}_${c.id}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const nb = cities.find((x) => x.id === nid);
      if (!nb) continue;
      const posB = remakeMapCoord(nb.x, nb.y);
      g.strokeColor = toColor(RC.road);
      g.lineWidth = 2;
      g.moveTo(posA.x, posA.y);
      g.lineTo(posB.x, posB.y);
      g.stroke();
    }
  }

  // 选中城气泡底
  if (selectedCityId) {
    const layout = cities.find((c) => c.id === selectedCityId);
    if (layout) {
      const pos = remakeMapCoord(layout.x, layout.y);
      g.fillColor = toColor({ r: 255, g: 255, b: 255, a: 230 });
      g.roundRect(pos.x - 36, pos.y + 18, 72, RL.MAP_BUBBLE_H, 6);
      g.fill();
      g.strokeColor = toColor(RC.chromeBorder);
      g.lineWidth = 1;
      g.roundRect(pos.x - 36, pos.y + 18, 72, RL.MAP_BUBBLE_H, 6);
      g.stroke();
      // 小三角
      g.fillColor = toColor({ r: 255, g: 255, b: 255, a: 230 });
      g.moveTo(pos.x - 6, pos.y + 18);
      g.lineTo(pos.x + 6, pos.y + 18);
      g.lineTo(pos.x, pos.y + 10);
      g.close();
      g.fill();
    }
  }
}

export { hexToRgb };
