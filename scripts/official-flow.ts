import { GameEngine } from '../assets/scripts/core/game/GameEngine';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { SCENARIO_003 } from '../assets/scripts/core/data/scenario_003';
import { findCity, findGeneral } from '../assets/scripts/core/utils/helpers';

const engine = new GameEngine();
engine.newGame(SCENARIO_001, 'wei');

console.log('=== 官方流程演示（CLI）===\n');

console.log(engine.getCityState('luoyang'));

console.log('\n--- 内政：开发 ---');
console.log(engine.develop('luoyang', 'g_caocao'));

console.log('\n--- 内政：开垦 ---');
console.log(engine.farm('ye', 'g_xiahouyuan'));

console.log('\n--- 军事：征兵 ---');
console.log(engine.recruit('ye', 100, 'g_zhangliao'));

console.log('\n--- 军事：运输 ---');
console.log(engine.transport({
  fromCityId: 'huaibei',
  toCityId: 'xuchang',
  generalId: 'g_xunyu',
  gold: 30,
  food: 40,
  troops: 0,
}));

console.log('\n--- 计谋：火计 ---');
console.log(engine.fireAttack('huaibei', 'g_guojia', 'shouchun'));

console.log('\n--- 外交：宣战吴 ---');
console.log(engine.declareWar('wu'));

console.log('\n--- 外交：使者赠礼（延迟） ---');
console.log(engine.gift('shu', 'luoyang', 'g_xiahoudun'));

console.log('\n--- 军事：进攻（伏兵需高智力；一骑讨+联合军） ---');
{
  const s = engine.state!;
  findCity(s, 'xuchang').gold = 400;
  findCity(s, 'xuchang').food = 400;
  // 郭嘉已行动，用许褚演示一骑讨/联合军；另开引擎演示伏兵
  const atk = engine.attack({
    attackerGeneralId: 'g_xuchu',
    attackerTroops: 1200,
    fromCityId: 'xuchang',
    targetCityId: 'shouchun',
    tryDuel: true,
    secondaryGeneralId: 'g_dianwei',
  });
  console.log(atk.log.join('\n'));
}

console.log('\n--- 伏兵单独演示 ---');
{
  const e2 = new GameEngine();
  e2.newGame(SCENARIO_001, 'wei');
  e2.declareWar('wu');
  let saw = false;
  for (let i = 0; i < 30 && !saw; i++) {
    const s = e2.state!;
    findCity(s, 'xuchang').gold = 500;
    findCity(s, 'xuchang').food = 500;
    findCity(s, 'shouchun').troops = 2500;
    const guojia = findGeneral(s, 'g_guojia');
    guojia.cityId = 'xuchang';
    guojia.actionUsed = false;
    guojia.status = 'idle';
    if (!findCity(s, 'xuchang').generalIds.includes('g_guojia')) {
      findCity(s, 'xuchang').generalIds.push('g_guojia');
    }
    findCity(s, 'huaibei').generalIds = findCity(s, 'huaibei').generalIds.filter((id) => id !== 'g_guojia');
    const r = e2.attack({
      attackerGeneralId: 'g_guojia',
      attackerTroops: 800,
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
      stratagemId: 'ambush',
    });
    console.log(r.log.join('\n'));
    saw = r.log.some((l) => l.includes('伏兵'));
    if (!saw) e2.newGame(SCENARIO_001, 'wei');
  }
}

console.log('\n--- 结束回合（AI + 月结算 + 使者推进） ---');
console.log(engine.endTurn());

console.log('\n--- 官渡剧本冒烟 ---');
{
  const g3 = new GameEngine();
  g3.newGame(SCENARIO_003, 'wei');
  const st = g3.state!;
  console.log(`城池 ${st.cities.length} / 势力 ${st.factions.length} / 武将 ${st.generals.length}`);
  const yuan = findGeneral(st, 'g_yuanshao');
  console.log(`袁绍 force=${yuan.force} city=${yuan.cityId}`);
}

console.log('\n' + engine.getCityState('luoyang'));
console.log('\n演示完成');
