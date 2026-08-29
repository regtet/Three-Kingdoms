import type { ScenarioCityDef, ScenarioData, ScenarioGeneralDef } from '../models/types';

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

export const SCENARIO_001: ScenarioData = {
  id: 'scenario_001',
  name: '三足鼎立',
  startYear: 200,
  startMonth: 1,
  factions: [
    { id: 'wei', name: '魏', color: '#3366CC', rulerName: '曹操' },
    { id: 'shu', name: '蜀', color: '#CC3333', rulerName: '刘备' },
    { id: 'wu', name: '吴', color: '#33AA55', rulerName: '孙权' },
  ],
  cities: [
    city({ id: 'luoyang', name: '洛阳', initialFactionId: 'wei', x: 400, y: 520, population: 8000, gold: 300, food: 400, troops: 2000, commerce: 150, agriculture: 110, neighbors: ['ye', 'xuchang'] }),
    city({ id: 'ye', name: '邺城', initialFactionId: 'wei', x: 520, y: 480, population: 7000, gold: 250, food: 350, troops: 1800, neighbors: ['luoyang', 'xuchang'] }),
    city({ id: 'xuchang', name: '许昌', initialFactionId: 'wei', x: 460, y: 400, population: 7500, gold: 280, food: 380, troops: 1900, neighbors: ['luoyang', 'ye', 'shouchun'] }),
    city({ id: 'huaibei', name: '淮北', initialFactionId: 'wei', x: 560, y: 340, population: 6000, gold: 200, food: 300, troops: 1500, neighbors: ['shouchun', 'hefei', 'xuchang'] }),
    city({ id: 'chengdu', name: '成都', initialFactionId: 'shu', x: 120, y: 280, population: 8000, gold: 280, food: 500, troops: 2000, agriculture: 150, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'hanzhong', name: '汉中', initialFactionId: 'shu', x: 240, y: 360, population: 6500, gold: 220, food: 420, troops: 1700, neighbors: ['chengdu', 'yongan', 'jiangzhou'] }),
    city({ id: 'jiangzhou', name: '江州', initialFactionId: 'shu', x: 200, y: 200, population: 6000, gold: 200, food: 380, troops: 1600, neighbors: ['chengdu', 'yongan', 'shouchun'] }),
    city({ id: 'yongan', name: '永安', initialFactionId: 'shu', x: 300, y: 260, population: 5500, gold: 180, food: 350, troops: 1400, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'jianye', name: '建业', initialFactionId: 'wu', x: 640, y: 180, population: 7800, gold: 290, food: 400, troops: 1950, commerce: 140, neighbors: ['wuchang', 'hefei'] }),
    city({ id: 'wuchang', name: '武昌', initialFactionId: 'wu', x: 520, y: 160, population: 6800, gold: 240, food: 360, troops: 1750, neighbors: ['jianye', 'shouchun'] }),
    city({ id: 'hefei', name: '合肥', initialFactionId: 'wu', x: 600, y: 280, population: 6200, gold: 210, food: 320, troops: 1600, neighbors: ['jianye', 'huaibei', 'shouchun'] }),
    city({ id: 'shouchun', name: '寿春', initialFactionId: 'wu', x: 440, y: 280, population: 7000, gold: 260, food: 340, troops: 1800, commerce: 130, agriculture: 130, neighbors: ['xuchang', 'huaibei', 'wuchang', 'jiangzhou', 'hefei'] }),
  ],
  generals: [
    general({ id: 'g_caocao', name: '曹操', force: 72, intelligence: 92, leadership: 96, factionId: 'wei', cityId: 'luoyang' }),
    general({ id: 'g_xiahoudun', name: '夏侯惇', force: 90, intelligence: 50, leadership: 85, factionId: 'wei', cityId: 'luoyang' }),
    general({ id: 'g_xiahouyuan', name: '夏侯渊', force: 88, intelligence: 55, leadership: 82, factionId: 'wei', cityId: 'ye' }),
    general({ id: 'g_zhangliao', name: '张辽', force: 92, intelligence: 70, leadership: 90, factionId: 'wei', cityId: 'ye' }),
    general({ id: 'g_xuchu', name: '许褚', force: 95, intelligence: 40, leadership: 75, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_dianwei', name: '典韦', force: 96, intelligence: 38, leadership: 72, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_guojia', name: '郭嘉', force: 45, intelligence: 98, leadership: 80, factionId: 'wei', cityId: 'huaibei' }),
    general({ id: 'g_xunyu', name: '荀彧', force: 40, intelligence: 95, leadership: 85, factionId: 'wei', cityId: 'huaibei' }),
    general({ id: 'g_liubei', name: '刘备', force: 70, intelligence: 75, leadership: 88, factionId: 'shu', cityId: 'chengdu' }),
    general({ id: 'g_guanyu', name: '关羽', force: 97, intelligence: 75, leadership: 93, factionId: 'shu', cityId: 'chengdu' }),
    general({ id: 'g_zhangfei', name: '张飞', force: 98, intelligence: 45, leadership: 80, factionId: 'shu', cityId: 'hanzhong' }),
    general({ id: 'g_zhugeliang', name: '诸葛亮', force: 38, intelligence: 100, leadership: 98, factionId: 'shu', cityId: 'hanzhong' }),
    general({ id: 'g_zhaoyun', name: '赵云', force: 96, intelligence: 72, leadership: 88, factionId: 'shu', cityId: 'jiangzhou' }),
    general({ id: 'g_machao', name: '马超', force: 94, intelligence: 55, leadership: 82, factionId: 'shu', cityId: 'jiangzhou' }),
    general({ id: 'g_huangzhong', name: '黄忠', force: 93, intelligence: 60, leadership: 78, factionId: 'shu', cityId: 'yongan' }),
    general({ id: 'g_weiyan', name: '魏延', force: 88, intelligence: 58, leadership: 76, factionId: 'shu', cityId: 'yongan' }),
    general({ id: 'g_sunquan', name: '孙权', force: 68, intelligence: 82, leadership: 86, factionId: 'wu', cityId: 'jianye' }),
    general({ id: 'g_zhouyu', name: '周瑜', force: 78, intelligence: 92, leadership: 94, factionId: 'wu', cityId: 'jianye' }),
    general({ id: 'g_lusu', name: '鲁肃', force: 55, intelligence: 88, leadership: 80, factionId: 'wu', cityId: 'wuchang' }),
    general({ id: 'g_lvmeng', name: '吕蒙', force: 82, intelligence: 85, leadership: 88, factionId: 'wu', cityId: 'wuchang' }),
    general({ id: 'g_luxun', name: '陆逊', force: 72, intelligence: 95, leadership: 92, factionId: 'wu', cityId: 'hefei' }),
    general({ id: 'g_ganning', name: '甘宁', force: 91, intelligence: 65, leadership: 84, factionId: 'wu', cityId: 'hefei' }),
    general({ id: 'g_taishici', name: '太史慈', force: 92, intelligence: 68, leadership: 82, factionId: 'wu', cityId: 'shouchun' }),
    general({ id: 'g_huanggai', name: '黄盖', force: 85, intelligence: 62, leadership: 80, factionId: 'wu', cityId: 'shouchun' }),
  ],
};
