import { Graphics, Label, Node, UITransform } from 'cc';
import type { GameState } from '../core/models/types';
import { findCity } from '../core/utils/helpers';
import { L, mapScenarioCoord } from './OfficialLayout';
import { hexToColor, toColor } from './UiDraw';

type CityLayout = { id: string; name: string; x: number; y: number; neighbors: readonly string[] };

/** 绘制完整战略地图：地域、河流、道路、城池 */
export function drawStrategicMap(
  g: Graphics,
  state: GameState,
  cities: readonly CityLayout[],
  selectedCityId: string | null,
): void {
  g.clear();
  const hw = L.MAP_W / 2;
  const hh = L.MAP_H / 2;

  // 大地图底色（中原）
  g.fillColor = toColor({ r: 22, g: 32, b: 28, a: 255 });
  g.roundRect(-hw + 8, -hh + 8, L.MAP_W - 16, L.MAP_H - 16, 12);
  g.fill();

  // 区域块
  drawRegion(g, -180, 100, 200, 120, { r: 35, g: 48, b: 38, a: 180 }, '冀州');
  drawRegion(g, -60, 130, 180, 100, { r: 40, g: 52, b: 42, a: 160 }, '兖州');
  drawRegion(g, -220, -40, 160, 140, { r: 38, g: 42, b: 32, a: 170 }, '益州');
  drawRegion(g, 80, -60, 200, 130, { r: 32, g: 45, b: 38, a: 165 }, '荆州');
  drawRegion(g, 160, 80, 180, 110, { r: 36, g: 50, b: 44, a: 160 }, '扬州');

  // 黄河
  g.strokeColor = toColor({ r: 180, g: 160, b: 90, a: 140 });
  g.lineWidth = 6;
  g.moveTo(-hw + 40, 80);
  g.bezierCurveTo(-40, 120, 60, 60, hw - 30, 90);
  g.stroke();

  // 长江
  g.strokeColor = toColor({ r: 60, g: 120, b: 180, a: 180 });
  g.lineWidth = 8;
  g.moveTo(-hw + 20, -10);
  g.bezierCurveTo(0, -30, 120, 10, hw - 20, -20);
  g.stroke();

  // 道路（邻接连线）
  const drawn = new Set<string>();
  for (const c of cities) {
    const posA = mapScenarioCoord(c.x, c.y);
    for (const nid of c.neighbors) {
      const key = c.id < nid ? `${c.id}_${nid}` : `${nid}_${c.id}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const nb = cities.find((x) => x.id === nid);
      if (!nb) continue;
      const posB = mapScenarioCoord(nb.x, nb.y);
      g.strokeColor = toColor({ r: 90, g: 75, b: 55, a: 100 });
      g.lineWidth = 3;
      g.moveTo(posA.x, posA.y);
      g.lineTo(posB.x, posB.y);
      g.stroke();
    }
  }

  // 城池标记由 GameRoot cityNode 绘制，此处仅画选中圈
  if (selectedCityId) {
    const layout = cities.find((c) => c.id === selectedCityId);
    if (layout) {
      const pos = mapScenarioCoord(layout.x, layout.y);
      g.strokeColor = toColor({ r: 255, g: 230, b: 80, a: 220 });
      g.lineWidth = 3;
      g.circle(pos.x, pos.y, 28);
      g.stroke();
    }
  }
}

function drawRegion(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  col: { r: number; g: number; b: number; a: number },
  _name: string,
) {
  g.fillColor = toColor(col);
  g.roundRect(x - w / 2, y - h / 2, w, h, 8);
  g.fill();
}

/** 在 mapContainer 上绘制城池名牌（更官方式） */
export function buildCityNameplate(
  parent: Node,
  cityId: string,
  cityName: string,
  factionColor: string,
  troops: number,
  x: number,
  y: number,
  selected: boolean,
): Node {
  const node = new Node(`City_${cityId}`);
  parent.addChild(node);
  node.setPosition(x, y, 0);
  node.addComponent(UITransform).setContentSize(72, 56);

  const g = node.addComponent(Graphics);
  const col = hexToColor(factionColor);
  g.fillColor = toColor({ r: col.r, g: col.g, b: col.b, a: 220 });
  g.roundRect(-36, -28, 72, 56, 6);
  g.fill();
  if (selected) {
    g.strokeColor = toColor({ r: 255, g: 230, b: 80, a: 255 });
    g.lineWidth = 3;
    g.roundRect(-36, -28, 72, 56, 6);
    g.stroke();
  }

  const nameN = new Node('Name');
  node.addChild(nameN);
  nameN.setPosition(0, 8, 0);
  nameN.addComponent(UITransform).setContentSize(68, 22);
  const nl = nameN.addComponent(Label);
  nl.string = cityName;
  nl.fontSize = 14;
  nl.horizontalAlign = Label.HorizontalAlign.CENTER;
  nl.color = toColor({ r: 255, g: 255, b: 255, a: 255 });

  const troopN = new Node('Troops');
  node.addChild(troopN);
  troopN.setPosition(0, -12, 0);
  troopN.addComponent(UITransform).setContentSize(68, 18);
  const tl = troopN.addComponent(Label);
  tl.string = `${troops}`;
  tl.fontSize = 12;
  tl.horizontalAlign = Label.HorizontalAlign.CENTER;
  tl.color = toColor({ r: 255, g: 220, b: 120, a: 255 });

  return node;
}

/** 刷新战略地图层 */
export function refreshStrategicMapLayer(
  terrainNode: Node,
  state: GameState,
  cities: readonly CityLayout[],
  selectedCityId: string | null,
): void {
  let g = terrainNode.getComponent(Graphics);
  if (!g) g = terrainNode.addComponent(Graphics);
  drawStrategicMap(g, state, cities, selectedCityId);
}
