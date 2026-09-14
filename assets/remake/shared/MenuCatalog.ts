/**
 * 菜单用最小内容库：剧本 / 可选君主 / 图鉴武将。
 */
export type ScenarioDef = {
  id: string;
  name: string;
  era: string;
  year: number;
  month: number;
  blurb: string;
  /** 该剧本可选君主 factionId */
  rulerIds: string[];
};

export type RulerDef = {
  id: string;
  name: string;
  factionId: string;
  factionName: string;
  color: string;
  blurb: string;
  portrait: string;
};

export type GalleryOfficer = {
  id: string;
  name: string;
  factionId: string;
  factionName: string;
  force: number;
  intellect: number;
  leadership: number;
  politics: number;
  charm: number;
  bio: string;
  portrait: string;
};

export const SCENARIOS: readonly ScenarioDef[] = [
  {
    id: 'y180',
    name: '黄巾之乱',
    era: '光和七年',
    year: 184,
    month: 2,
    blurb: '张角举义，天下震动。群雄初起，逐鹿中原。',
    rulerIds: ['cao_cao', 'liu_bei', 'sun_jian', 'yuan_shao', 'dong_zhuo'],
  },
  {
    id: 'y190',
    name: '群雄讨董',
    era: '初平元年',
    year: 190,
    month: 1,
    blurb: '董卓乱政，关东诸侯结盟。虎牢关外，锋芒初露。',
    rulerIds: ['cao_cao', 'liu_bei', 'sun_jian', 'yuan_shao', 'yuan_shu'],
  },
  {
    id: 'y200',
    name: '官渡之战',
    era: '建安五年',
    year: 200,
    month: 8,
    blurb: '袁曹决战在即。北方霸业，决于一役。',
    rulerIds: ['cao_cao', 'yuan_shao', 'liu_bei', 'sun_ce'],
  },
];

export const RULERS: readonly RulerDef[] = [
  {
    id: 'cao_cao',
    name: '曹操',
    factionId: 'wei',
    factionName: '魏',
    color: '#3a5fcd',
    blurb: '治世之能臣，乱世之奸雄。雄才大略，屯田养兵。',
    portrait: 'officer/portraits/g_caocao',
  },
  {
    id: 'liu_bei',
    name: '刘备',
    factionId: 'shu',
    factionName: '蜀',
    color: '#2e8b57',
    blurb: '汉室宗亲，仁德之名远播。得人者昌，志在匡扶。',
    portrait: 'officer/portraits/g_liubei',
  },
  {
    id: 'sun_quan',
    name: '孙权',
    factionId: 'wu',
    factionName: '吴',
    color: '#c0392b',
    blurb: '承父兄之业，坐断东南。知人善任，保据江东。',
    portrait: 'officer/portraits/g_sunquan',
  },
  {
    id: 'sun_jian',
    name: '孙坚',
    factionId: 'wu',
    factionName: '吴',
    color: '#c0392b',
    blurb: '江东猛虎。破虏讨逆，威震一方。',
    portrait: 'officer/portraits/pool/pool_sun_jian',
  },
  {
    id: 'sun_ce',
    name: '孙策',
    factionId: 'wu',
    factionName: '吴',
    color: '#c0392b',
    blurb: '小霸王。拓土江东，英年早逝亦留传奇。',
    portrait: 'officer/portraits/pool/pool_sun_ce',
  },
  {
    id: 'yuan_shao',
    name: '袁绍',
    factionId: 'yuan',
    factionName: '袁',
    color: '#8e44ad',
    blurb: '四世三公，名门望族。兵多将广，决策常犹豫。',
    portrait: 'officer/portraits/pool/pool_yuan_shao',
  },
  {
    id: 'yuan_shu',
    name: '袁术',
    factionId: 'yuanshu',
    factionName: '袁术',
    color: '#9b59b6',
    blurb: '僭号称帝，粮尽兵疲。野心大于才略。',
    portrait: 'officer/portraits/pool/pool_yuan_shu',
  },
  {
    id: 'dong_zhuo',
    name: '董卓',
    factionId: 'dong',
    factionName: '董',
    color: '#5d4037',
    blurb: '西凉铁骑入洛。专权残暴，终为天下所弃。',
    portrait: 'officer/portraits/pool/pool_dong_zhuo',
  },
];

export const GALLERY_OFFICERS: readonly GalleryOfficer[] = [
  {
    id: 'cao_cao',
    name: '曹操',
    factionId: 'wei',
    factionName: '魏',
    force: 72,
    intellect: 91,
    leadership: 96,
    politics: 94,
    charm: 88,
    bio: '曹魏奠基者。善用兵、通权变，诗赋亦称大家。',
    portrait: 'officer/portraits/g_caocao',
  },
  {
    id: 'liu_bei',
    name: '刘备',
    factionId: 'shu',
    factionName: '蜀',
    force: 74,
    intellect: 76,
    leadership: 90,
    politics: 85,
    charm: 98,
    bio: '蜀汉昭烈帝。以信义聚人心，终成三分之一。',
    portrait: 'officer/portraits/g_liubei',
  },
  {
    id: 'sun_quan',
    name: '孙权',
    factionId: 'wu',
    factionName: '吴',
    force: 68,
    intellect: 82,
    leadership: 88,
    politics: 90,
    charm: 86,
    bio: '吴大帝。年轻继位，守成开疆，赤壁联刘破曹。',
    portrait: 'officer/portraits/g_sunquan',
  },
  {
    id: 'zhuge_liang',
    name: '诸葛亮',
    factionId: 'shu',
    factionName: '蜀',
    force: 62,
    intellect: 100,
    leadership: 92,
    politics: 98,
    charm: 90,
    bio: '卧龙。出师未捷身先死，长使英雄泪满襟。',
    portrait: 'officer/portraits/g_zhugeliang',
  },
  {
    id: 'guan_yu',
    name: '关羽',
    factionId: 'shu',
    factionName: '蜀',
    force: 97,
    intellect: 80,
    leadership: 90,
    politics: 70,
    charm: 88,
    bio: '武圣。义薄云天，水淹七军，威震华夏。',
    portrait: 'officer/portraits/g_guanyu',
  },
  {
    id: 'zhang_fei',
    name: '张飞',
    factionId: 'shu',
    factionName: '蜀',
    force: 98,
    intellect: 55,
    leadership: 84,
    politics: 42,
    charm: 60,
    bio: '燕人张翼德。长坂桥一声喝退曹军。',
    portrait: 'officer/portraits/g_zhangfei',
  },
  {
    id: 'zhao_yun',
    name: '赵云',
    factionId: 'shu',
    factionName: '蜀',
    force: 96,
    intellect: 78,
    leadership: 88,
    politics: 72,
    charm: 86,
    bio: '常山赵子龙。单骑救主，一身是胆。',
    portrait: 'officer/portraits/g_zhaoyun',
  },
  {
    id: 'zhou_yu',
    name: '周瑜',
    factionId: 'wu',
    factionName: '吴',
    force: 78,
    intellect: 96,
    leadership: 94,
    politics: 82,
    charm: 92,
    bio: '美周郎。赤壁火攻，定鼎江东。',
    portrait: 'officer/portraits/g_zhouyu',
  },
  {
    id: 'lu_xun',
    name: '陆逊',
    factionId: 'wu',
    factionName: '吴',
    force: 70,
    intellect: 95,
    leadership: 93,
    politics: 88,
    charm: 80,
    bio: '书生拜将。夷陵火烧连营，折尽蜀汉锐气。',
    portrait: 'officer/portraits/g_luxun',
  },
  {
    id: 'guo_jia',
    name: '郭嘉',
    factionId: 'wei',
    factionName: '魏',
    force: 40,
    intellect: 98,
    leadership: 72,
    politics: 86,
    charm: 78,
    bio: '鬼才。曹操股肱，英年早逝令人扼腕。',
    portrait: 'officer/portraits/g_guojia',
  },
  {
    id: 'xiahou_dun',
    name: '夏侯惇',
    factionId: 'wei',
    factionName: '魏',
    force: 90,
    intellect: 62,
    leadership: 86,
    politics: 58,
    charm: 70,
    bio: '拔矢啖睛。曹氏宗亲猛将，忠勇无双。',
    portrait: 'officer/portraits/g_xiahoudun',
  },
  {
    id: 'zhang_liao',
    name: '张辽',
    factionId: 'wei',
    factionName: '魏',
    force: 93,
    intellect: 78,
    leadership: 91,
    politics: 65,
    charm: 74,
    bio: '威震逍遥津。江东小儿闻名止啼。',
    portrait: 'officer/portraits/g_zhangliao',
  },
  {
    id: 'sima_yi',
    name: '司马懿',
    factionId: 'wei',
    factionName: '魏',
    force: 58,
    intellect: 97,
    leadership: 90,
    politics: 96,
    charm: 70,
    bio: '狼顾之相。隐忍布局，终移曹氏之鼎。',
    portrait: 'officer/portraits/pool/pool_sima_yi',
  },
  {
    id: 'lu_bu',
    name: '吕布',
    factionId: 'lu',
    factionName: '吕',
    force: 100,
    intellect: 42,
    leadership: 80,
    politics: 30,
    charm: 72,
    bio: '天下无双。人中吕布，马中赤兔。',
    portrait: 'officer/portraits/pool/pool_lu_bu',
  },
  {
    id: 'jia_xu',
    name: '贾诩',
    factionId: 'wei',
    factionName: '魏',
    force: 48,
    intellect: 97,
    leadership: 70,
    politics: 88,
    charm: 55,
    bio: '毒士。算无遗策，自保亦精。',
    portrait: 'officer/portraits/pool/pool_jia_xu',
  },
  {
    id: 'pang_tong',
    name: '庞统',
    factionId: 'shu',
    factionName: '蜀',
    force: 55,
    intellect: 97,
    leadership: 78,
    politics: 84,
    charm: 60,
    bio: '凤雏。与卧龙并称，落凤坡殉志。',
    portrait: 'officer/portraits/pool/pool_pang_tong',
  },
];

export function getScenario(id: string): ScenarioDef | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function rulersForScenario(scenarioId: string): RulerDef[] {
  const sc = getScenario(scenarioId);
  if (!sc) return [];
  return sc.rulerIds
    .map((id) => RULERS.find((r) => r.id === id))
    .filter((r): r is RulerDef => !!r);
}

export function getRuler(id: string): RulerDef | undefined {
  return RULERS.find((r) => r.id === id);
}
