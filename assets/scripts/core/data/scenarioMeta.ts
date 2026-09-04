/** 剧本大厅展示文案（与 scenario_*.ts 数据对应） */
export type ScenarioMeta = {
  summary: string;
  detail: string;
  recommend?: string;
};

export const SCENARIO_META: Record<string, ScenarioMeta> = {
  scenario_001: {
    summary: '200年 · 三足鼎立',
    detail:
      '曹操平定北方，刘备据守巴蜀，孙权稳控江东。十三座城池、二十四员名将，重现东汉末年三分天下之局。',
    recommend: '推荐初次游玩选择刘备或曹操。',
  },
  scenario_002: {
    summary: '208年 · 赤壁前线',
    detail:
      '赤壁之战前夕，曹军南下，孙刘联盟初成。前线城池对峙，庞德、徐晃、张郃、太史慈等名将尚在野望。',
    recommend: '推荐体验孙权或刘备，感受联盟与火攻前夜。',
  },
  scenario_003: {
    summary: '200年 · 官渡对峙',
    detail:
      '袁绍据邺城、洛阳，兵多粮足；曹操守许昌，精兵良将。刘备、关羽、张飞尚在野，登用可扭转战局。',
    recommend: '推荐曹操以少胜多，或袁绍挥兵南下。',
  },
};

export function getScenarioMeta(id: string): ScenarioMeta {
  return (
    SCENARIO_META[id] ?? {
      summary: '历史剧本',
      detail: '群雄并起，逐鹿中原。',
    }
  );
}
