import type { ScenarioCityDef, ScenarioData, ScenarioGeneralDef, ScenarioWildDef } from '../models/types';

function city(c: Omit<ScenarioCityDef, 'commerce' | 'agriculture' | 'loyalty'> & Partial<Pick<ScenarioCityDef, 'commerce' | 'agriculture' | 'loyalty'>>): ScenarioCityDef {
  return { commerce: 120, agriculture: 120, loyalty: 75, ...c };
}

function general(g: Omit<ScenarioGeneralDef, 'politics' | 'charm' | 'loyalty'> & Partial<Pick<ScenarioGeneralDef, 'politics' | 'charm' | 'loyalty'>>): ScenarioGeneralDef {
  return {
    politics: Math.round(g.intelligence * 0.85),
    charm: Math.round(g.leadership * 0.75),
    loyalty: 90,
    ...g,
  };
}

function wild(w: ScenarioWildDef): ScenarioWildDef {
  return w;
}

/** 赤壁争锋：208年，前线对峙，在野名将 */
export const SCENARIO_002: ScenarioData = {
  id: 'scenario_002',
  name: '赤壁争锋',
  startYear: 208,
  startMonth: 10,
  factions: [
    { id: 'wei', name: '魏', color: '#3366CC', rulerName: '曹操' },
    { id: 'shu', name: '蜀', color: '#CC3333', rulerName: '刘备' },
    { id: 'wu', name: '吴', color: '#33AA55', rulerName: '孙权' },
  ],
  cities: [
    city({ id: 'luoyang', name: '洛阳', initialFactionId: 'wei', x: 400, y: 520, population: 7500, gold: 250, food: 350, troops: 1600, neighbors: ['ye', 'xuchang'] }),
    city({ id: 'ye', name: '邺城', initialFactionId: 'wei', x: 520, y: 480, population: 6800, gold: 220, food: 320, troops: 1500, neighbors: ['luoyang', 'xuchang'] }),
    city({ id: 'xuchang', name: '许昌', initialFactionId: 'wei', x: 460, y: 400, population: 7200, gold: 260, food: 360, troops: 1700, neighbors: ['luoyang', 'ye', 'shouchun'] }),
    city({ id: 'huaibei', name: '淮北', initialFactionId: 'wei', x: 560, y: 340, population: 5800, gold: 180, food: 280, troops: 2200, neighbors: ['shouchun', 'hefei', 'xuchang'] }),
    city({ id: 'chengdu', name: '成都', initialFactionId: 'shu', x: 120, y: 280, population: 7800, gold: 260, food: 480, troops: 1800, agriculture: 150, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'hanzhong', name: '汉中', initialFactionId: 'shu', x: 240, y: 360, population: 6200, gold: 200, food: 400, troops: 1500, neighbors: ['chengdu', 'yongan', 'jiangzhou'] }),
    city({ id: 'jiangzhou', name: '江州', initialFactionId: 'shu', x: 200, y: 200, population: 5800, gold: 180, food: 360, troops: 1400, neighbors: ['chengdu', 'yongan', 'shouchun'] }),
    city({ id: 'yongan', name: '永安', initialFactionId: 'shu', x: 300, y: 260, population: 5200, gold: 160, food: 330, troops: 1300, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'jianye', name: '建业', initialFactionId: 'wu', x: 640, y: 180, population: 7600, gold: 270, food: 380, troops: 2000, commerce: 140, neighbors: ['wuchang', 'hefei'] }),
    city({ id: 'wuchang', name: '武昌', initialFactionId: 'wu', x: 520, y: 160, population: 6600, gold: 230, food: 340, troops: 1900, neighbors: ['jianye', 'shouchun'] }),
    city({ id: 'hefei', name: '合肥', initialFactionId: 'wu', x: 600, y: 280, population: 6000, gold: 200, food: 300, troops: 1750, neighbors: ['jianye', 'huaibei', 'shouchun'] }),
    city({ id: 'shouchun', name: '寿春', initialFactionId: 'wu', x: 440, y: 280, population: 6800, gold: 240, food: 320, troops: 2100, commerce: 130, agriculture: 130, neighbors: ['xuchang', 'huaibei', 'wuchang', 'jiangzhou', 'hefei'] }),
  ],
  generals: [
    general({ id: 'g_caocao', name: '曹操', force: 72, intelligence: 92, leadership: 96, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_xiahoudun', name: '夏侯惇', force: 90, intelligence: 50, leadership: 85, factionId: 'wei', cityId: 'huaibei' }),
    general({ id: 'g_xiahouyuan', name: '夏侯渊', force: 88, intelligence: 55, leadership: 82, factionId: 'wei', cityId: 'ye' }),
    general({ id: 'g_zhangliao', name: '张辽', force: 92, intelligence: 70, leadership: 90, factionId: 'wei', cityId: 'hefei' }),
    general({ id: 'g_xuchu', name: '许褚', force: 95, intelligence: 40, leadership: 75, factionId: 'wei', cityId: 'luoyang' }),
    general({ id: 'g_guojia', name: '郭嘉', force: 45, intelligence: 98, leadership: 80, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_xunyu', name: '荀彧', force: 40, intelligence: 95, leadership: 85, factionId: 'wei', cityId: 'luoyang' }),
    general({ id: 'g_liubei', name: '刘备', force: 70, intelligence: 75, leadership: 88, factionId: 'shu', cityId: 'chengdu' }),
    general({ id: 'g_guanyu', name: '关羽', force: 97, intelligence: 75, leadership: 93, factionId: 'shu', cityId: 'jiangzhou' }),
    general({ id: 'g_zhangfei', name: '张飞', force: 98, intelligence: 45, leadership: 80, factionId: 'shu', cityId: 'yongan' }),
    general({ id: 'g_zhugeliang', name: '诸葛亮', force: 38, intelligence: 100, leadership: 98, factionId: 'shu', cityId: 'chengdu' }),
    general({ id: 'g_zhaoyun', name: '赵云', force: 96, intelligence: 72, leadership: 88, factionId: 'shu', cityId: 'hanzhong' }),
    general({ id: 'g_sunquan', name: '孙权', force: 68, intelligence: 82, leadership: 86, factionId: 'wu', cityId: 'jianye' }),
    general({ id: 'g_zhouyu', name: '周瑜', force: 78, intelligence: 92, leadership: 94, factionId: 'wu', cityId: 'wuchang' }),
    general({ id: 'g_lusu', name: '鲁肃', force: 55, intelligence: 88, leadership: 80, factionId: 'wu', cityId: 'jianye' }),
    general({ id: 'g_lvmeng', name: '吕蒙', force: 82, intelligence: 85, leadership: 88, factionId: 'wu', cityId: 'shouchun' }),
    general({ id: 'g_luxun', name: '陆逊', force: 72, intelligence: 95, leadership: 92, factionId: 'wu', cityId: 'hefei' }),
    general({ id: 'g_ganning', name: '甘宁', force: 91, intelligence: 65, leadership: 84, factionId: 'wu', cityId: 'wuchang' }),
    general({ id: 'g_huanggai', name: '黄盖', force: 85, intelligence: 62, leadership: 80, factionId: 'wu', cityId: 'shouchun' }),
  ],
  wildGenerals: [
    wild({ id: 'wild_pangde', name: '庞德', force: 89, intelligence: 58, leadership: 80, politics: 45, charm: 60, cityId: 'hanzhong', recruitGold: 150 }),
    wild({ id: 'wild_xuhuang', name: '徐晃', force: 88, intelligence: 65, leadership: 85, politics: 55, charm: 68, cityId: 'ye', recruitGold: 140 }),
    wild({ id: 'wild_zhanghe', name: '张郃', force: 87, intelligence: 70, leadership: 86, politics: 58, charm: 65, cityId: 'xuchang', recruitGold: 160 }),
    wild({ id: 'wild_taishici', name: '太史慈', force: 92, intelligence: 68, leadership: 82, politics: 55, charm: 75, cityId: 'shouchun', recruitGold: 180 }),
  ],
};
