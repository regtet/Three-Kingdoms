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

/**
 * 官渡争锋：200年秋，曹操据许昌，袁绍控邺城、洛阳。
 * 双势力剧本：袁军兵力占优，曹军将才与枢纽城池见长。
 */
export const SCENARIO_003: ScenarioData = {
  id: 'scenario_003',
  name: '官渡争锋',
  startYear: 200,
  startMonth: 8,
  factions: [
    { id: 'wei', name: '曹', color: '#3366CC', rulerName: '曹操' },
    { id: 'yuan', name: '袁', color: '#9B59B6', rulerName: '袁绍' },
  ],
  cities: [
    city({ id: 'luoyang', name: '洛阳', initialFactionId: 'yuan', x: 400, y: 520, population: 8200, gold: 320, food: 520, troops: 5200, commerce: 140, agriculture: 130, neighbors: ['ye', 'xuchang'] }),
    city({ id: 'ye', name: '邺城', initialFactionId: 'yuan', x: 520, y: 480, population: 9000, gold: 380, food: 600, troops: 6500, commerce: 145, agriculture: 140, neighbors: ['luoyang', 'xuchang'] }),
    city({ id: 'xuchang', name: '许昌', initialFactionId: 'wei', x: 460, y: 400, population: 7800, gold: 340, food: 420, troops: 2800, commerce: 160, agriculture: 120, neighbors: ['luoyang', 'ye', 'shouchun'] }),
    city({ id: 'huaibei', name: '淮北', initialFactionId: 'wei', x: 560, y: 340, population: 6200, gold: 220, food: 340, troops: 1600, neighbors: ['shouchun', 'hefei', 'xuchang'] }),
    city({ id: 'chengdu', name: '成都', initialFactionId: 'wei', x: 120, y: 280, population: 5000, gold: 160, food: 280, troops: 600, agriculture: 140, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'hanzhong', name: '汉中', initialFactionId: 'wei', x: 240, y: 360, population: 4800, gold: 150, food: 260, troops: 550, neighbors: ['chengdu', 'yongan', 'jiangzhou'] }),
    city({ id: 'jiangzhou', name: '江州', initialFactionId: 'wei', x: 200, y: 200, population: 4500, gold: 140, food: 240, troops: 500, neighbors: ['chengdu', 'yongan', 'shouchun'] }),
    city({ id: 'yongan', name: '永安', initialFactionId: 'wei', x: 300, y: 260, population: 4200, gold: 130, food: 220, troops: 450, neighbors: ['hanzhong', 'jiangzhou'] }),
    city({ id: 'jianye', name: '建业', initialFactionId: 'wei', x: 640, y: 180, population: 5200, gold: 170, food: 260, troops: 600, commerce: 130, neighbors: ['wuchang', 'hefei'] }),
    city({ id: 'wuchang', name: '武昌', initialFactionId: 'wei', x: 520, y: 160, population: 4800, gold: 150, food: 240, troops: 550, neighbors: ['jianye', 'shouchun'] }),
    city({ id: 'hefei', name: '合肥', initialFactionId: 'wei', x: 600, y: 280, population: 5500, gold: 180, food: 280, troops: 900, neighbors: ['jianye', 'huaibei', 'shouchun'] }),
    city({ id: 'shouchun', name: '寿春', initialFactionId: 'wei', x: 440, y: 280, population: 6400, gold: 210, food: 320, troops: 1200, commerce: 125, agriculture: 125, neighbors: ['xuchang', 'huaibei', 'wuchang', 'jiangzhou', 'hefei'] }),
  ],
  generals: [
    general({ id: 'g_caocao', name: '曹操', force: 72, intelligence: 94, leadership: 97, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_guojia', name: '郭嘉', force: 45, intelligence: 98, leadership: 82, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_xunyu', name: '荀彧', force: 40, intelligence: 96, leadership: 86, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_xuchu', name: '许褚', force: 96, intelligence: 40, leadership: 76, factionId: 'wei', cityId: 'xuchang' }),
    general({ id: 'g_zhangliao', name: '张辽', force: 93, intelligence: 72, leadership: 91, factionId: 'wei', cityId: 'huaibei' }),
    general({ id: 'g_xiahoudun', name: '夏侯惇', force: 90, intelligence: 52, leadership: 86, factionId: 'wei', cityId: 'huaibei' }),
    general({ id: 'g_yujin', name: '于禁', force: 82, intelligence: 68, leadership: 84, factionId: 'wei', cityId: 'shouchun' }),
    general({ id: 'g_caoren', name: '曹仁', force: 84, intelligence: 62, leadership: 88, factionId: 'wei', cityId: 'hefei' }),
    general({ id: 'g_xiahouyuan', name: '夏侯渊', force: 88, intelligence: 58, leadership: 83, factionId: 'wei', cityId: 'jianye' }),
    general({ id: 'g_yuanshao', name: '袁绍', force: 65, intelligence: 78, leadership: 88, factionId: 'yuan', cityId: 'ye' }),
    general({ id: 'g_yanliang', name: '颜良', force: 94, intelligence: 42, leadership: 80, factionId: 'yuan', cityId: 'ye' }),
    general({ id: 'g_wenchou', name: '文丑', force: 93, intelligence: 40, leadership: 78, factionId: 'yuan', cityId: 'ye' }),
    general({ id: 'g_tianfeng', name: '田丰', force: 35, intelligence: 92, leadership: 75, factionId: 'yuan', cityId: 'ye' }),
    general({ id: 'g_jushou', name: '沮授', force: 38, intelligence: 90, leadership: 80, factionId: 'yuan', cityId: 'luoyang' }),
    general({ id: 'g_shenpei', name: '审配', force: 48, intelligence: 82, leadership: 78, factionId: 'yuan', cityId: 'luoyang' }),
    general({ id: 'g_zhanghe', name: '张郃', force: 87, intelligence: 72, leadership: 86, factionId: 'yuan', cityId: 'luoyang' }),
    general({ id: 'g_gaolan', name: '高览', force: 85, intelligence: 60, leadership: 80, factionId: 'yuan', cityId: 'luoyang' }),
  ],
  wildGenerals: [
    wild({ id: 'wild_liubei', name: '刘备', force: 70, intelligence: 75, leadership: 88, politics: 85, charm: 95, cityId: 'xuchang', recruitGold: 200 }),
    wild({ id: 'wild_guanyu', name: '关羽', force: 97, intelligence: 75, leadership: 93, politics: 60, charm: 80, cityId: 'huaibei', recruitGold: 220 }),
    wild({ id: 'wild_zhangfei', name: '张飞', force: 98, intelligence: 45, leadership: 80, politics: 40, charm: 55, cityId: 'shouchun', recruitGold: 180 }),
  ],
};
