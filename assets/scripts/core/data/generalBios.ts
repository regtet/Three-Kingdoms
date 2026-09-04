/** 武将图鉴列传条目 */
export type GeneralBioEntry = {
  epithet: string;
  origin: string;
  deeds: string;
  quote?: string;
};

const BIOS: Record<string, GeneralBioEntry> = {
  g_caocao: {
    epithet: '奸雄',
    origin: '沛国谯县人，汉末权臣，曹魏基业开创者。',
    deeds: '挟天子以令诸侯，官渡一战定北方。善用人才，诗文豪健，机变百出，为乱世中最具帝王心术者之一。',
    quote: '宁教我负天下人，休教天下人负我。',
  },
  g_xiahoudun: {
    epithet: '独眼将军',
    origin: '沛国谯县人，曹操同族，早期元勋。',
    deeds: '随曹公征战四方，拔矢啖睛传为胆气象征。守淮南、平吕布，性刚烈而忠勤，为魏之柱石。',
  },
  g_xiahouyuan: {
    epithet: '神速将军',
    origin: '沛国谯县人，夏侯惇从弟，长于奔袭。',
    deeds: '常率轻骑千里击敌，虎步关右威震凉州。然恃速而疏于防备，终在定军山为黄忠所斩。',
  },
  g_zhangliao: {
    epithet: '威震逍遥',
    origin: '雁门马邑人，初仕吕布，后归曹操。',
    deeds: '合肥之战以八百破孙权十万，「张辽止啼」成江东儿语。文武兼备，曹魏五子良将之首。',
  },
  g_xuchu: {
    epithet: '虎痴',
    origin: '谯国谯县人，力大无穷，曹操近卫。',
    deeds: '裸衣斗马超，护曹公于渭水、官渡、赤壁诸役。性朴直少文，然忠勇冠三军。',
  },
  g_dianwei: {
    epithet: '古之恶来',
    origin: '陈留己吾人，曹操宿卫，力能扛鼎。',
    deeds: '宛城之战以双戟断后，身死而主公得脱。其勇烈之姿，为曹营诸将所仰。',
  },
  g_guojia: {
    epithet: '鬼才',
    origin: '颍川阳翟人，曹操首席谋臣。',
    deeds: '十胜十败论定官渡大局，白狼山奇策平乌桓。料事深远而早逝，曹公每言「天丧我也」。',
    quote: '当奉天子以令不臣，修耕战以蓄军资。',
  },
  g_xunyu: {
    epithet: '王佐之才',
    origin: '颍川颍阴人，曹操谋臣之首。',
    deeds: '举荐诸贤、定都许昌、规划官渡后勤。性守名节，终与魏公政见不合而忧死。',
  },
  g_liubei: {
    epithet: '昭烈皇帝',
    origin: '涿郡涿县人，汉室宗亲，蜀汉开国君主。',
    deeds: '桃园结义、三顾茅庐、赤壁联吴。虽颠沛半生，终据益州，以仁德凝聚人心。',
    quote: '勿以恶小而为之，勿以善小而不为。',
  },
  g_guanyu: {
    epithet: '武圣',
    origin: '河东解县人，刘备义弟，万人敌。',
    deeds: '温酒斩华雄、斩颜良、水淹七军。义重如山，后世人尊为「关圣帝君」。',
    quote: '玉可碎而不可改其白，竹可焚而不可毁其节。',
  },
  g_zhangfei: {
    epithet: '万人敌',
    origin: '涿郡人，刘备义弟，性暴而忠。',
    deeds: '长坂坡当阳桥喝退曹军，义释严颜。善饮而失戒备，终为部卒所害，令人扼腕。',
  },
  g_zhugeliang: {
    epithet: '卧龙',
    origin: '琅琊阳都人，蜀汉丞相，千古名相。',
    deeds: '隆中对定三分，七擒孟获、六出祁山。鞠躬尽瘁，发明木牛流马，治蜀有法度。',
    quote: '非淡泊无以明志，非宁静无以致远。',
  },
  g_zhaoyun: {
    epithet: '常山赵子龙',
    origin: '常山真定人，蜀汉名将。',
    deeds: '长坂坡单骑救主，汉中之战力斩夏侯渊。一身是胆，不恋财物而重信义。',
  },
  g_machao: {
    epithet: '锦马超',
    origin: '扶风茂陵人，西凉猛将，马超之后。',
    deeds: '潼关之战逼曹公割须弃袍，后归刘备封将。英武冠世，有「神威天将军」之号。',
  },
  g_huangzhong: {
    epithet: '老将',
    origin: '南阳人，初仕刘表，后归刘备。',
    deeds: '定军山一箭射杀夏侯渊，定汉中首功。年高而弓马不减，与关羽同列五虎上将。',
  },
  g_weiyan: {
    epithet: '子午奇谋',
    origin: '义阳人，刘备部将，蜀汉后期大将。',
    deeds: '随诸葛亮北伐，屡建战功。性刚自负，与杨仪不睦，终致身死，为蜀汉一大憾事。',
  },
  g_sunquan: {
    epithet: '吴大帝',
    origin: '吴郡富春人，孙坚次子，江东之主。',
    deeds: '承父兄基业，联刘抗曹，赤壁之后据有江东。识人善任，使周瑜、陆逊各展其才。',
  },
  g_zhouyu: {
    epithet: '美周郎',
    origin: '庐江舒县人，东吴大都督。',
    deeds: '赤壁火攻破曹，拓江陵、定南郡。文武兼资，雅善音律，人称「曲有误，周郎顾」。',
  },
  g_lusu: {
    epithet: '榻上策',
    origin: '临淮东城人，东吴战略家。',
    deeds: '初见孙权便陈三分天下之大计，力主联刘抗曹。后鲁肃代周瑜，稳保江东根本。',
  },
  g_lvmeng: {
    epithet: '白衣渡江',
    origin: '汝南富陂人，东吴名将。',
    deeds: '初为武夫，后发愤读书，士别三日。袭荆州擒关羽，开吴之全盛，然不久暴卒。',
  },
  g_luxun: {
    epithet: '书生拜将',
    origin: '吴郡吴县人，东吴后期统帅。',
    deeds: '夷陵之战火烧连营，大破刘备。后领荆州、扬州，为吴之擎天柱石。',
  },
  g_ganning: {
    epithet: '锦帆贼',
    origin: '江夏人，少年为盗，后归孙权。',
    deeds: '百骑夜袭曹营，逍遥津前张辽之敌。轻侠好施，孙权曰「孟德有张辽，孤有兴霸」。',
  },
  g_taishici: {
    epithet: '神射手',
    origin: '东莱黄县人，东吴猛将。',
    deeds: '北海救孔融、神亭岭独战小霸王。弓马绝伦，与关羽、张飞相类，为江东名将。',
  },
  g_huanggai: {
    epithet: '苦肉计',
    origin: '零陵泉陵人，孙坚旧部。',
    deeds: '随孙氏三代，赤壁诈降献火攻之策。老当益壮，为东吴战功卓著之宿将。',
  },
  wild_xuhuang: {
    epithet: '长驱直入',
    origin: '河东杨县人，曹魏名将，在野可登用。',
    deeds: '解樊城之围、破关羽。治军严整，常先登陷阵，为五子良将之一。',
  },
  wild_zhanghe: {
    epithet: '巧变',
    origin: '河间鄚县人，初仕袁绍，后归曹操。',
    deeds: '善料敌机变，街亭败马谡。与蜀将交锋多年，为魏之智勇名将。',
  },
  wild_pangde: {
    epithet: '白马将军',
    origin: '南安狟道人，马超旧部，在野可登用。',
    deeds: '抬棺战关羽，射中其额。宁死不降，其忠烈为世人所称。',
  },
  wild_taishici: {
    epithet: '神射手',
    origin: '东莱黄县人，可自在野登用。',
    deeds: '神亭岭独战小霸王，北海义救孔融。弓马绝伦，为东吴名将之一。',
  },
  lu_bu: {
    epithet: '飞将',
    origin: '五原九原人，东汉末年第一猛将。',
    deeds: '辕门射戟、虎牢关前战三英。然反复无常，终白门楼殒命。',
    quote: '大丈夫生居天地间，岂能郁郁久居人下！',
  },
  sima_yi: {
    epithet: '冢虎',
    origin: '河内温县人，曹魏谋臣，晋之祖。',
    deeds: '拒诸葛亮北伐、平公孙渊、灭曹爽。深忍厚黑，奠定司马氏代魏之基。',
  },
  diao_chan: {
    epithet: '闭月',
    origin: '东汉末年美女，连环计关键人物。',
    deeds: '王允设连环计，离间董卓与吕布。以一身系汉室安危，为演义四大美女之一。',
  },
  pang_tong: {
    epithet: '凤雏',
    origin: '襄阳人，与诸葛亮齐名。',
    deeds: '献连环计于赤壁，随刘备入蜀。落凤坡中箭而亡，蜀汉失一栋梁。',
  },
  jiang_wei: {
    epithet: '天水麒麟',
    origin: '天水冀县人，诸葛亮传人。',
    deeds: '九伐中原，屡挑魏室。然时势已去，终不能复汉，饮恨而降。',
  },
  yuan_shao: {
    epithet: '四世三公',
    origin: '汝南汝阳人，东汉末最大诸侯。',
    deeds: '据河北四州，官渡一败由盛转衰。好谋无断，空负名门之资。',
  },
  yan_liang: {
    epithet: '河北先锋',
    origin: '袁绍部将，河北名将。',
    deeds: '勇冠三军，白马坡为关羽所斩，河北军心由是大沮。',
  },
  wen_chou: {
    epithet: '河北猛将',
    origin: '袁绍部将，与颜良齐名。',
    deeds: '颜良既死，复率骑追击，亦为关羽所斩，袁军锋锐尽失。',
  },
  ju_shou: {
    epithet: '远见',
    origin: '广平人，袁绍谋主。',
    deeds: '屡谏缓战固守，官渡前力阻出兵。绍不纳，终被囚杀。',
  },
  tian_feng: {
    epithet: '刚直',
    origin: '钜鹿人，袁绍谋士。',
    deeds: '谏阻官渡之役，绍怒而囚之。闻败讯，遂自杀以明志。',
  },
  shen_pei: {
    epithet: '刚愎',
    origin: '魏郡人，袁绍腹心。',
    deeds: '主战甚力，官渡后守邺。城破被执，骂曹而死。',
  },
  gao_lan: {
    epithet: '降将',
    origin: '袁绍部将，后归曹操。',
    deeds: '官渡时与张郃同被疑，遂降曹。后战死。',
  },
  zhang_he: {
    epithet: '巧变',
    origin: '河间鄚人，初仕袁绍，后归曹操。',
    deeds: '官渡降曹，数立战功。街亭破马谡，为魏五子良将之一。',
  },
  cao_ren: {
    epithet: '铁壁',
    origin: '沛国谯人，曹操从弟。',
    deeds: '守樊城抗关羽，善守善攻，曹魏宗室柱石。',
  },
  yu_jin: {
    epithet: '持军',
    origin: '泰山钜平人，曹操部将。',
    deeds: '治军严整。水淹七军时降关羽，晚节受讥。',
  },
  dong_zhuo: {
    epithet: '太师',
    origin: '陇西临洮人，东汉末权奸。',
    deeds: '废立天子，迁都长安，暴虐京师。终为吕布所弑，乱政之祸首。',
  },
  zhang_jiao: {
    epithet: '天公将军',
    origin: '钜鹿人，黄巾起义领袖。',
    deeds: '以太平道聚众，苍天已死黄天当立。虽起义失败，却动摇汉室根基。',
  },
  huang_yueying: {
    epithet: '才女',
    origin: '沔南名士之女，诸葛亮之妻。',
    deeds: '貌陋而才高，传作木兽流马、连弩之辅。助卧龙理家理事，静守隆中之后。',
  },
  sun_ce: {
    epithet: '小霸王',
    origin: '吴郡富春人，孙坚长子。',
    deeds: '年未弱冠平江东，英气干云。遇刺早亡，使孙权承其遗业。',
  },
  sun_jian: {
    epithet: '江东猛虎',
    origin: '吴郡富春人，孙吴奠基者。',
    deeds: '讨董先锋，得传国玉玺。勇烈冠三军，为孙氏开基第一人。',
  },
  cao_pi: {
    epithet: '魏文帝',
    origin: '沛国谯县人，曹操长子。',
    deeds: '代汉建魏，七步诗之外善诗赋。与孙权争衡，确立三国正式对峙。',
  },
  cao_zhi: {
    epithet: '才高八斗',
    origin: '沛国谯县人，曹操之子。',
    deeds: '七步成诗，洛神赋动天下。才名盖世而政治失势，典型才子命运。',
  },
  jia_xu: {
    epithet: '毒士',
    origin: '武威姑臧人，奇谋之士。',
    deeds: '献计离间马超、破吕布。后归曹操，多所保全，以智避祸。',
  },
  chen_gong: {
    epithet: '智士',
    origin: '东郡东武阳人，吕布谋主。',
    deeds: '曾弃曹事吕，有宁死不降之节。其谋略若归明主，当更大展。',
  },
  zhen_ji: {
    epithet: '洛神',
    origin: '中山无极人，曹丕皇后。',
    deeds: '才貌双全，曹植《洛神赋》所咏。身世浮沉，为建安风骨添一笔哀艳。',
  },
  xiao_qiao: {
    epithet: '江东绝色',
    origin: '庐江皖县人，乔公次女。',
    deeds: '嫁周瑜，赤壁前后助稳军心。与其姊大乔并称，为乱世红颜。',
  },
  da_qiao: {
    epithet: '江东绝色',
    origin: '庐江皖县人，乔公长女。',
    deeds: '嫁孙策，随夫定江东。英年寡居，令人叹红颜命薄。',
  },
};

function dominantRole(force: number, intelligence: number, leadership: number, politics: number): string {
  const scores = [
    ['沙场猛将', force],
    ['运筹帷幄', intelligence],
    ['统军帅才', leadership],
    ['治世能臣', politics],
  ] as const;
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

function fallbackBio(
  name: string,
  force: number,
  intelligence: number,
  leadership: number,
  politics: number,
  charm: number,
  skill: string,
): GeneralBioEntry {
  const role = dominantRole(force, intelligence, leadership, politics);
  const variants = [
    {
      epithet: skill,
      origin: `${name}，汉末群雄之一，以${role}著称。`,
      deeds: `武 ${force}、智 ${intelligence}、统 ${leadership}，在乱世中历事诸主。或随征战阵，或参赞军谋，名见于史册与演义之间。`,
    },
    {
      epithet: skill,
      origin: `${name}，活跃于东汉末年，乡里称其${role}。`,
      deeds: `五维之中政 ${politics}、魅 ${charm}，能服众心。或守土安民，或随军出征，为一方所记。`,
    },
    {
      epithet: skill,
      origin: `${name}，三国乱世中的${role}。`,
      deeds: `史载其性刚毅，多历战阵。与同代名将并列，虽事迹或简略，亦足以入图鉴列传。`,
    },
  ];
  const idx = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % variants.length;
  return variants[idx];
}

export function getGeneralBio(
  id: string,
  name: string,
  stats: { force: number; intelligence: number; leadership: number; politics: number; charm: number },
  skill: string,
): GeneralBioEntry {
  const aliases: Record<string, string> = {
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
  };
  const mapped = aliases[id] ?? id;
  return BIOS[id] ?? BIOS[mapped] ?? fallbackBio(name, stats.force, stats.intelligence, stats.leadership, stats.politics, stats.charm, skill);
}

export function formatGalleryBio(entry: GeneralBioEntry): string {
  let text = `【${entry.epithet}】\n${entry.origin}\n\n${entry.deeds}`;
  if (entry.quote) text += `\n\n「${entry.quote}」`;
  return text;
}
