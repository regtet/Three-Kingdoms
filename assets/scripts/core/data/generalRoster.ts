/**
 * 武将图鉴权威数据：属性、兵种适性对标《三国志·战略版》，列传依史书记载。
 * 适性顺序：骑 / 盾 / 弓 / 枪 / 器
 */
import { formatGalleryBio, getGeneralBio } from './generalBios';

export type TroopKind = 'cavalry' | 'shield' | 'archer' | 'spear' | 'siege';
export type TroopGrade = 'S' | 'A' | 'B' | 'C';
export type TroopFilterId = 'all' | TroopKind;

export type TroopAdapt = Record<TroopKind, TroopGrade>;

export type GeneralRosterDef = {
  name: string;
  force: number;
  intelligence: number;
  leadership: number;
  politics: number;
  charm: number;
  skill: string;
  epithet: string;
  adapt: TroopAdapt;
  star: number;
};

export const TROOP_FILTER_TABS: { id: TroopFilterId; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'cavalry', label: '骑兵' },
  { id: 'shield', label: '盾兵' },
  { id: 'archer', label: '弓兵' },
  { id: 'spear', label: '枪兵' },
  { id: 'siege', label: '器械' },
];

export const TROOP_LABELS: Record<TroopKind, string> = {
  cavalry: '骑兵',
  shield: '盾兵',
  archer: '弓兵',
  spear: '枪兵',
  siege: '器械',
};

export const TROOP_BADGE: Record<TroopKind, string> = {
  cavalry: '骑',
  shield: '盾',
  archer: '弓',
  spear: '枪',
  siege: '器',
};

const GRADE_SCORE: Record<TroopGrade, number> = { S: 4, A: 3, B: 2, C: 1 };

/** 骑 盾 弓 枪 器 */
function ad(
  cavalry: TroopGrade,
  shield: TroopGrade,
  archer: TroopGrade,
  spear: TroopGrade,
  siege: TroopGrade,
): TroopAdapt {
  return { cavalry, shield, archer, spear, siege };
}

function def(
  name: string,
  force: number,
  intelligence: number,
  leadership: number,
  politics: number,
  charm: number,
  skill: string,
  epithet: string,
  adapt: TroopAdapt,
  star: number,
): GeneralRosterDef {
  return { name, force, intelligence, leadership, politics, charm, skill, epithet, adapt, star };
}

/** 战略版武将库（属性与适性参照官方设定，列传取自史书） */
export const GENERAL_ROSTER: Record<string, GeneralRosterDef> = {
  // ── 剧本核心将 ──
  g_caocao: def('曹操', 72, 96, 96, 92, 96, '奸雄', '魏武帝', ad('S', 'A', 'A', 'S', 'C'), 5),
  g_xiahoudun: def('夏侯惇', 90, 56, 92, 58, 70, '刚烈', '独眼将军', ad('S', 'A', 'B', 'A', 'C'), 4),
  g_xiahouyuan: def('夏侯渊', 88, 54, 90, 52, 62, '神速', '妙才', ad('S', 'B', 'B', 'A', 'C'), 4),
  g_zhangliao: def('张辽', 92, 70, 94, 58, 78, '突袭', '威震逍遥', ad('S', 'A', 'B', 'S', 'C'), 5),
  g_xuchu: def('许褚', 96, 36, 78, 28, 52, '虎痴', '虎侯', ad('S', 'S', 'B', 'A', 'C'), 4),
  g_dianwei: def('典韦', 96, 38, 80, 24, 48, '古之恶来', '恶来', ad('S', 'A', 'B', 'S', 'C'), 4),
  g_guojia: def('郭嘉', 48, 98, 84, 78, 82, '十胜十败', '鬼才', ad('C', 'B', 'A', 'B', 'A'), 5),
  g_xunyu: def('荀彧', 34, 96, 86, 94, 88, '王佐', '王佐之才', ad('C', 'A', 'A', 'B', 'S'), 5),
  g_liubei: def('刘备', 70, 76, 88, 78, 92, '仁德', '昭烈皇帝', ad('A', 'S', 'B', 'A', 'C'), 5),
  g_guanyu: def('关羽', 97, 76, 93, 62, 90, '武圣', '汉寿亭侯', ad('S', 'A', 'A', 'S', 'S'), 5),
  g_zhangfei: def('张飞', 98, 38, 82, 22, 48, '咆哮', '万人敌', ad('S', 'S', 'B', 'S', 'C'), 5),
  g_zhugeliang: def('诸葛亮', 38, 100, 98, 92, 88, '神算', '武兴王', ad('C', 'S', 'S', 'A', 'S'), 5),
  g_zhaoyun: def('赵云', 96, 72, 90, 58, 84, '七进七出', '常山赵子龙', ad('S', 'A', 'A', 'S', 'C'), 5),
  g_machao: def('马超', 94, 52, 88, 36, 76, '锦马超', '神威天将军', ad('S', 'A', 'B', 'S', 'C'), 5),
  g_huangzhong: def('黄忠', 92, 58, 80, 42, 68, '百步穿杨', '老将', ad('A', 'A', 'S', 'A', 'C'), 5),
  g_weiyan: def('魏延', 90, 58, 84, 32, 52, '子午奇谋', '文长', ad('S', 'A', 'A', 'S', 'C'), 4),
  g_sunquan: def('孙权', 68, 82, 86, 80, 88, '制衡', '吴大帝', ad('A', 'A', 'A', 'B', 'B'), 5),
  g_zhouyu: def('周瑜', 78, 94, 96, 62, 90, '火计', '美周郎', ad('A', 'S', 'S', 'A', 'B'), 5),
  g_lusu: def('鲁肃', 52, 88, 82, 86, 84, '榻上策', '子敬', ad('C', 'S', 'A', 'B', 'A'), 4),
  g_lvmeng: def('吕蒙', 82, 86, 90, 58, 72, '白衣渡江', '子明', ad('A', 'S', 'A', 'A', 'B'), 5),
  g_luxun: def('陆逊', 72, 96, 94, 78, 82, '火烧连营', '伯言', ad('A', 'S', 'S', 'A', 'B'), 5),
  g_ganning: def('甘宁', 92, 62, 86, 28, 72, '锦帆', '兴霸', ad('S', 'A', 'B', 'A', 'C'), 4),
  g_taishici: def('太史慈', 92, 68, 84, 42, 76, '神射', '子义', ad('A', 'A', 'S', 'A', 'C'), 4),
  g_huanggai: def('黄盖', 86, 62, 82, 48, 68, '苦肉', '公覆', ad('B', 'S', 'A', 'A', 'C'), 4),
  wild_xuhuang: def('徐晃', 88, 64, 88, 48, 62, '长驱', '公明', ad('A', 'A', 'B', 'S', 'C'), 4),
  wild_zhanghe: def('张郃', 86, 68, 90, 44, 58, '巧变', '儁乂', ad('A', 'A', 'B', 'S', 'C'), 4),
  wild_pangde: def('庞德', 90, 48, 82, 32, 60, '抬棺', '令明', ad('S', 'A', 'B', 'S', 'C'), 4),
  wild_taishici: def('太史慈', 92, 68, 84, 42, 76, '神射', '子义', ad('A', 'A', 'S', 'A', 'C'), 4),

  // ── 名将池（战略版适性） ──
  lu_bu: def('吕布', 98, 26, 88, 18, 52, '天下无双', '飞将', ad('S', 'S', 'A', 'S', 'C'), 5),
  sima_yi: def('司马懿', 62, 98, 92, 88, 78, '鹰视狼顾', '冢虎', ad('C', 'A', 'A', 'B', 'S'), 5),
  diao_chan: def('貂蝉', 28, 72, 48, 56, 96, '闭月', '闭月', ad('C', 'C', 'B', 'C', 'B'), 4),
  pang_tong: def('庞统', 42, 96, 86, 68, 62, '连环', '凤雏', ad('C', 'B', 'A', 'B', 'S'), 5),
  jiang_wei: def('姜维', 88, 88, 86, 52, 70, '九伐', '伯约', ad('A', 'A', 'A', 'S', 'B'), 5),
  yuan_shao: def('袁绍', 62, 68, 76, 72, 82, '四世三公', '本初', ad('A', 'A', 'A', 'B', 'B'), 4),
  dong_zhuo: def('董卓', 78, 42, 72, 38, 36, '暴虐', '太师', ad('A', 'A', 'B', 'A', 'C'), 4),
  zhang_jiao: def('张角', 32, 78, 68, 62, 84, '太平', '天公将军', ad('C', 'B', 'B', 'C', 'A'), 4),
  huang_yueying: def('黄月英', 36, 92, 72, 78, 68, '工神', '才女', ad('C', 'B', 'A', 'B', 'S'), 4),
  sun_ce: def('孙策', 92, 58, 90, 42, 84, '小霸王', '伯符', ad('S', 'A', 'B', 'S', 'C'), 5),
  sun_jian: def('孙坚', 90, 52, 86, 44, 78, '江东猛虎', '文台', ad('S', 'A', 'B', 'S', 'C'), 4),
  cao_pi: def('曹丕', 58, 82, 78, 80, 76, '篡汉', '魏文帝', ad('A', 'A', 'A', 'B', 'B'), 4),
  cao_zhi: def('曹植', 28, 82, 52, 68, 88, '七步', '子建', ad('C', 'B', 'B', 'C', 'A'), 3),
  jia_xu: def('贾诩', 52, 96, 80, 72, 58, '毒士', '文和', ad('C', 'B', 'A', 'B', 'S'), 5),
  chen_gong: def('陈宫', 48, 88, 72, 58, 62, '智迟', '公台', ad('C', 'B', 'A', 'B', 'A'), 4),
  zhen_ji: def('甄姬', 24, 74, 52, 62, 92, '洛神', '文昭', ad('C', 'B', 'A', 'C', 'B'), 4),
  xiao_qiao: def('小乔', 22, 68, 48, 54, 94, '天香', '江东绝色', ad('C', 'C', 'B', 'C', 'B'), 4),
  da_qiao: def('大乔', 22, 66, 46, 56, 92, '国色', '江东绝色', ad('C', 'C', 'B', 'C', 'B'), 4),
  cao_ren: def('曹仁', 82, 58, 88, 52, 62, '铁壁', '子孝', ad('A', 'S', 'B', 'A', 'C'), 4),
  cao_hong: def('曹洪', 78, 42, 76, 38, 48, '福将', '子廉', ad('S', 'A', 'B', 'A', 'C'), 3),
  xun_you: def('荀攸', 38, 94, 82, 80, 72, '十二奇策', '公达', ad('C', 'B', 'A', 'B', 'S'), 5),
  deng_ai: def('邓艾', 82, 88, 86, 52, 58, '偷渡阴平', '士载', ad('A', 'A', 'B', 'S', 'B'), 5),
  zhong_hui: def('钟会', 68, 92, 84, 62, 58, '精练策数', '士季', ad('C', 'B', 'A', 'B', 'S'), 4),
  yu_jin: def('于禁', 76, 62, 82, 48, 52, '持军', '文则', ad('A', 'A', 'B', 'A', 'C'), 3),
  le_jin: def('乐进', 80, 52, 80, 38, 48, '先登', '文谦', ad('A', 'A', 'B', 'S', 'C'), 4),
  yue_jin: def('乐进', 80, 52, 80, 38, 48, '先登', '文谦', ad('A', 'A', 'B', 'S', 'C'), 4),
  li_dian: def('李典', 62, 78, 76, 58, 62, '破敌', '曼成', ad('A', 'A', 'B', 'A', 'B'), 3),
  man_chong: def('满宠', 58, 82, 80, 72, 58, '严整', '伯宁', ad('C', 'S', 'A', 'B', 'A'), 4),
  xu_shu: def('徐庶', 52, 88, 72, 68, 74, '荐诸葛', '元直', ad('C', 'B', 'A', 'B', 'A'), 4),
  fazheng: def('法正', 48, 92, 78, 68, 62, '定军', '孝直', ad('C', 'B', 'A', 'B', 'S'), 4),
  zhou_tai: def('周泰', 88, 42, 78, 28, 52, '护主', '幼平', ad('A', 'S', 'B', 'A', 'C'), 4),
  zhu_ran: def('朱然', 78, 62, 82, 48, 58, '守江陵', '义封', ad('B', 'A', 'A', 'S', 'C'), 4),
  zhuge_jin: def('诸葛瑾', 42, 82, 72, 78, 82, '秉节', '子瑜', ad('C', 'A', 'S', 'B', 'A'), 3),
  zhuge_ke: def('诸葛恪', 58, 78, 72, 52, 62, '傲才', '元逊', ad('A', 'A', 'B', 'A', 'B'), 3),
  lady_zhurong: def('祝融夫人', 82, 48, 72, 28, 68, '火神', '南蛮女王', ad('A', 'B', 'B', 'S', 'C'), 4),
  zuo_ci: def('左慈', 28, 88, 58, 62, 78, '元放', '仙人', ad('C', 'C', 'B', 'C', 'A'), 3),
  cheng_pu: def('程普', 78, 58, 80, 48, 62, '苦肉', '德谋', ad('B', 'S', 'A', 'A', 'C'), 4),
  han_dang: def('韩当', 76, 52, 78, 42, 58, '弓马', '义公', ad('A', 'A', 'S', 'A', 'C'), 3),
  ding_feng: def('丁奉', 80, 58, 82, 42, 56, '短兵', '承渊', ad('A', 'A', 'B', 'S', 'C'), 4),
  ling_tong: def('凌统', 86, 52, 80, 32, 62, '国士', '公绩', ad('S', 'A', 'B', 'A', 'C'), 4),
  xu_sheng: def('徐盛', 82, 56, 84, 44, 58, '疑城', '文向', ad('B', 'S', 'A', 'A', 'C'), 4),
  pan_zhang: def('潘璋', 78, 48, 74, 32, 48, '擒羽', '文珪', ad('A', 'A', 'B', 'A', 'C'), 3),
  jiang_qin: def('蒋钦', 80, 50, 78, 38, 54, '水军', '公奕', ad('A', 'A', 'B', 'A', 'C'), 3),
  lu_kang: def('陆抗', 62, 90, 88, 72, 78, '夷道', '幼节', ad('A', 'S', 'A', 'A', 'B'), 5),
  sun_shangxiang: def('孙尚香', 72, 58, 68, 42, 86, '弓腰姬', '枭姬', ad('A', 'B', 'S', 'B', 'C'), 4),
  gongsun_zan: def('公孙瓒', 82, 52, 80, 42, 68, '白马', '伯珪', ad('S', 'B', 'A', 'A', 'C'), 4),
  liu_biao: def('刘表', 48, 72, 68, 78, 72, '单骑入宜', '景升', ad('C', 'A', 'A', 'B', 'B'), 3),
  liu_zhang: def('刘璋', 38, 58, 52, 62, 48, '暗弱', '季玉', ad('C', 'B', 'B', 'C', 'B'), 2),
  zhang_lu: def('张鲁', 42, 68, 62, 72, 76, '米道', '公祺', ad('C', 'B', 'B', 'C', 'A'), 3),
  ma_teng: def('马腾', 82, 48, 76, 38, 62, '西凉', '寿成', ad('S', 'B', 'B', 'A', 'C'), 3),
  han_sui: def('韩遂', 68, 58, 72, 48, 52, '西凉', '文约', ad('S', 'B', 'B', 'A', 'C'), 3),
  gao_shun: def('高顺', 86, 48, 82, 28, 42, '陷阵营', '元伯', ad('A', 'A', 'B', 'S', 'C'), 4),
  hua_xiong: def('华雄', 84, 38, 72, 22, 42, '猛将', '魔将', ad('S', 'B', 'B', 'S', 'C'), 3),
  yan_liang: def('颜良', 90, 42, 76, 28, 48, '勇冠', '元图', ad('S', 'B', 'B', 'S', 'C'), 4),
  wen_chou: def('文丑', 88, 40, 74, 26, 46, '猛将', '丑', ad('S', 'B', 'B', 'S', 'C'), 4),
  ju_shou: def('沮授', 42, 88, 76, 72, 62, '谏绍', '公与', ad('C', 'B', 'A', 'B', 'S'), 4),
  tian_feng: def('田丰', 38, 92, 72, 68, 58, '谏争', '元皓', ad('C', 'B', 'A', 'B', 'S'), 4),
  shen_pei: def('审配', 48, 82, 78, 70, 52, '刚愎', '正南', ad('C', 'B', 'A', 'B', 'A'), 3),
  gao_lan: def('高览', 85, 58, 80, 42, 55, '降将', '元图', ad('A', 'B', 'B', 'A', 'C'), 3),
  zhang_he: def('张郃', 87, 72, 86, 58, 65, '巧变', '儁乂', ad('A', 'A', 'A', 'B', 'B'), 4),
  liu_ye: def('刘晔', 42, 90, 78, 68, 58, '料敌', '子扬', ad('C', 'B', 'A', 'B', 'S'), 4),
  cheng_yu: def('程昱', 48, 88, 76, 62, 48, '十面埋伏', '仲德', ad('C', 'B', 'A', 'B', 'S'), 4),
  guo_huai: def('郭淮', 62, 78, 80, 52, 48, '守陇', '淮', ad('A', 'A', 'B', 'A', 'B'), 3),
  cao_zhen: def('曹真', 72, 68, 84, 52, 58, '真', '子丹', ad('A', 'A', 'B', 'A', 'C'), 4),
  cao_xiu: def('曹休', 74, 62, 80, 48, 56, '千里驹', '文烈', ad('S', 'A', 'B', 'A', 'C'), 3),
  sima_zhao: def('司马昭', 68, 86, 82, 62, 52, '权臣', '子上', ad('C', 'A', 'A', 'B', 'S'), 4),
  sima_shi: def('司马师', 62, 84, 80, 58, 48, '权臣', '子元', ad('C', 'A', 'A', 'B', 'S'), 4),
  zhang_zhao: def('张昭', 28, 82, 62, 88, 72, '治政', '子布', ad('C', 'A', 'B', 'C', 'S'), 4),
  gu_yong: def('顾雍', 32, 84, 68, 90, 76, '秉节', '元叹', ad('C', 'A', 'B', 'C', 'S'), 3),
  huang_quan: def('黄权', 58, 78, 80, 68, 62, '守险', '公衡', ad('C', 'A', 'A', 'B', 'A'), 3),
  li_yan: def('李严', 62, 72, 76, 68, 52, '督运', '平叔', ad('C', 'A', 'B', 'B', 'A'), 3),
  fei_yi: def('费祎', 38, 82, 68, 86, 78, '秉节', '文伟', ad('C', 'A', 'B', 'C', 'S'), 4),
  jiang_wan: def('蒋琬', 42, 82, 76, 88, 74, '守成', '公琰', ad('C', 'A', 'B', 'C', 'S'), 4),
  dong_yun: def('董允', 38, 78, 62, 82, 68, '秉节', '休昭', ad('C', 'A', 'B', 'C', 'S'), 3),
  ma_liang: def('马良', 32, 86, 68, 78, 72, '白眉', '季常', ad('C', 'B', 'A', 'B', 'S'), 3),
  ma_su: def('马谡', 42, 78, 58, 52, 48, '纸上谈兵', '幼常', ad('C', 'B', 'A', 'B', 'A'), 2),
  ma_dai: def('马岱', 76, 48, 72, 32, 48, '西凉', '伯瞻', ad('S', 'B', 'B', 'A', 'C'), 3),
  liao_hua: def('廖化', 72, 52, 74, 38, 52, '先锋', '元俭', ad('A', 'A', 'B', 'A', 'C'), 3),
  guan_ping: def('关平', 78, 52, 72, 38, 62, '关家', '关平', ad('S', 'A', 'B', 'S', 'C'), 3),
  guan_xing: def('关兴', 76, 48, 70, 32, 58, '关家', '安国', ad('S', 'A', 'B', 'A', 'C'), 3),
  zhang_bao: def('张宝', 62, 72, 64, 48, 68, '黄巾', '地公将军', ad('C', 'B', 'B', 'B', 'A'), 3),
  zhang_liang: def('张梁', 68, 58, 66, 38, 56, '黄巾', '人公将军', ad('A', 'B', 'B', 'A', 'C'), 3),
  cai_wenji: def('蔡文姬', 22, 78, 48, 62, 82, '胡笳', '文姬', ad('C', 'C', 'B', 'C', 'A'), 4),
  hua_tuo: def('华佗', 18, 82, 42, 58, 72, '青囊', '神医', ad('C', 'C', 'C', 'C', 'A'), 3),
  sima_hui: def('司马徽', 18, 92, 52, 68, 80, '水镜', '德操', ad('C', 'C', 'B', 'C', 'A'), 4),
  wen_yang: def('文鸯', 92, 48, 82, 28, 52, '单骑退敌', '次骞', ad('S', 'A', 'B', 'S', 'C'), 4),
  wang_yi: def('王异', 62, 72, 68, 58, 76, '贞烈', '女中豪杰', ad('C', 'A', 'A', 'B', 'B'), 4),
  meng_huo: def('孟获', 78, 42, 72, 32, 62, '南蛮', '南蛮王', ad('A', 'B', 'B', 'S', 'C'), 4),
  king_mulu: def('木鹿大王', 72, 38, 68, 24, 48, '兽兵', '八纳洞主', ad('A', 'B', 'B', 'A', 'C'), 3),
  wu_tugu: def('兀突骨', 82, 28, 70, 18, 36, '藤甲', '藤甲王', ad('A', 'S', 'B', 'A', 'C'), 3),
};

/** 剧本 g_* / wild_* → roster 储备 ID */
const ROSTER_ID_ALIASES: Record<string, string> = {
  g_yuanshao: 'yuan_shao',
  g_yanliang: 'yan_liang',
  g_wenchou: 'wen_chou',
  g_tianfeng: 'tian_feng',
  g_jushou: 'ju_shou',
  g_shenpei: 'shen_pei',
  g_gaolan: 'gao_lan',
  g_zhanghe: 'zhang_he',
  g_caoren: 'cao_ren',
  g_yujin: 'yu_jin',
  wild_zhanghe: 'zhang_he',
  wild_liubei: 'g_liubei',
  wild_guanyu: 'g_guanyu',
  wild_zhangfei: 'g_zhangfei',
};

/** 获取 roster；未知武将按姓名生成合理默认（仍标注为史册风格） */
export function resolveGeneralRoster(id: string, fallbackName: string): GeneralRosterDef {
  const mapped = ROSTER_ID_ALIASES[id] ?? id;
  const hit = GENERAL_ROSTER[id] ?? GENERAL_ROSTER[mapped];
  if (hit) return hit;
  return def(
    fallbackName,
    68,
    68,
    70,
    58,
    62,
    '均衡',
    '将才',
    ad('B', 'B', 'B', 'B', 'C'),
    2,
  );
}

export function primaryTroopKind(adapt: TroopAdapt): TroopKind {
  const order: TroopKind[] = ['cavalry', 'spear', 'shield', 'archer', 'siege'];
  let best: TroopKind = 'spear';
  let bestScore = -1;
  for (const k of order) {
    const s = GRADE_SCORE[adapt[k]];
    if (s > bestScore) {
      bestScore = s;
      best = k;
    }
  }
  return best;
}

export function rosterAptitude(r: GeneralRosterDef): number {
  return Math.round((r.force + r.intelligence + r.leadership + r.politics + r.charm) / 5);
}

export function rosterGrade(r: GeneralRosterDef): 'SS' | 'S' | 'A' | 'B' {
  const apt = rosterAptitude(r);
  if (apt >= 92) return 'SS';
  if (apt >= 85) return 'S';
  if (apt >= 78) return 'A';
  return 'B';
}

export function formatRosterBio(id: string, r: GeneralRosterDef): string {
  const entry = getGeneralBio(id, r.name, r, r.skill);
  return formatGalleryBio(entry);
}

export function filterRosterByTroop(list: { troop: TroopKind; adapt: TroopAdapt }[], filter: TroopFilterId) {
  if (filter === 'all') return list;
  return list.filter((g) => g.troop === filter || GRADE_SCORE[g.adapt[filter]] >= 3);
}
