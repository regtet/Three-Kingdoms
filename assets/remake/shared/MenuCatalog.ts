/**
 * 菜单用最小内容库：剧本 / 可选君主 / 图鉴武将。
 */
import { OFFICER_CATALOG } from '../../core/data/OfficerCatalog';

export type ScenarioDef = {
  id: string;
  name: string;
  era: string;
  year: number;
  month: number;
  blurb: string;
  /** 该剧本可选君主 id */
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
  courtesyName?: string;
  factionId: string;
  factionName: string;
  style: string;
  gender: 'male' | 'female';
  birthYear: number;
  force: number;
  intellect: number;
  leadership: number;
  politics: number;
  charm: number;
  bio: string;
  portrait: string;
};

/** 图鉴年龄推算基准年（建安五年）；剧本年不同则年龄不同，图鉴统一按此年展示 */
export const GALLERY_REF_YEAR = 200;

export type GalleryAttrFilter =
  | 'all'
  | 'force'
  | 'intellect'
  | 'leadership'
  | 'politics'
  | 'charm';

export type GalleryFilter = {
  id: GalleryAttrFilter;
  label: string;
};

const FACTION_NAME: Record<string, string> = {
  wei: '魏',
  shu: '蜀',
  wu: '吴',
  yuan: '袁',
  dong: '董',
  lu: '吕',
  han: '汉',
  nan: '南',
  other: '群',
};

export const GALLERY_ATTR_FILTERS: readonly GalleryFilter[] = [
  { id: 'all', label: '全部' },
  { id: 'force', label: '武力' },
  { id: 'intellect', label: '智力' },
  { id: 'leadership', label: '统率' },
  { id: 'politics', label: '政治' },
  { id: 'charm', label: '魅力' },
] as const;

export function galleryAge(o: { birthYear: number }, year = GALLERY_REF_YEAR): number {
  return year - o.birthYear;
}

function inferGender(style: string): 'male' | 'female' {
  return style === '女将' ? 'female' : 'male';
}

function toGalleryOfficer(o: (typeof OFFICER_CATALOG)[number]): GalleryOfficer {
  return {
    id: o.id,
    name: o.name,
    courtesyName: o.courtesyName,
    factionId: o.factionHint,
    factionName: FACTION_NAME[o.factionHint] ?? '群',
    style: o.style,
    gender: inferGender(o.style),
    birthYear: o.birthYear,
    force: o.force,
    intellect: o.intellect,
    leadership: o.leadership,
    politics: o.politics,
    charm: o.charm,
    bio: o.bio,
    portrait: o.portrait,
  };
}

/** 图鉴全库：接 core OfficerCatalog（一百余人） */
export const GALLERY_OFFICERS: readonly GalleryOfficer[] =
  OFFICER_CATALOG.map(toGalleryOfficer);

const ATTR_KEY: Record<Exclude<GalleryAttrFilter, 'all'>, keyof GalleryOfficer> = {
  force: 'force',
  intellect: 'intellect',
  leadership: 'leadership',
  politics: 'politics',
  charm: 'charm',
};

/** 属性排序（列表展示性别/年龄数字，不做分段筛选） */
export function queryGalleryOfficers(opts: {
  attr?: GalleryAttrFilter;
} = {}): GalleryOfficer[] {
  const attr = opts.attr ?? 'all';
  if (attr === 'all') return [...GALLERY_OFFICERS];

  const key = ATTR_KEY[attr];
  return [...GALLERY_OFFICERS].sort((a, b) => {
    const d = (b[key] as number) - (a[key] as number);
    return d !== 0 ? d : a.name.localeCompare(b.name, 'zh');
  });
}

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

export function getScenario(id: string): ScenarioDef | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function rulersForScenario(scenarioId: string): RulerDef[] {
  const sc = getScenario(scenarioId);
  if (!sc) return [];
  return sc.rulerIds
    .map((rid) => RULERS.find((r) => r.id === rid))
    .filter((r): r is RulerDef => !!r);
}

export function getRuler(id: string): RulerDef | undefined {
  return RULERS.find((r) => r.id === id);
}
