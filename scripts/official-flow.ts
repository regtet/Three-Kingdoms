import { GameEngine } from '../assets/scripts/core/game/GameEngine';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { getActableGeneralsInCity } from '../assets/scripts/core/systems/actionGuard';

const engine = new GameEngine();
engine.newGame(SCENARIO_001, 'wei');

function pickGeneral(cityId: string): string {
  return getActableGeneralsInCity(engine.state!, cityId)[0].id;
}

console.log('=== 官方流程演示（CLI）===\n');

console.log(engine.getCityState('luoyang'));

console.log('\n--- 内政：开发 ---');
console.log(engine.develop('luoyang', pickGeneral('luoyang')));

console.log('\n--- 内政：开垦（另一城） ---');
console.log(engine.farm('xuchang', pickGeneral('xuchang')));

console.log('\n--- 军事：征兵 ---');
console.log(engine.recruit('xuchang', 100, pickGeneral('xuchang')));

console.log('\n--- 计谋：火计 ---');
console.log(engine.fireAttack('huaibei', 'g_guojia', 'shouchun'));

console.log('\n--- 外交：宣战吴 ---');
console.log(engine.declareWar('wu'));

console.log('\n--- 军事：进攻 ---');
const atk = engine.attack({
  attackerGeneralId: 'g_xuchu',
  attackerTroops: 1200,
  fromCityId: 'xuchang',
  targetCityId: 'shouchun',
});
console.log(atk.log.join('\n'));

console.log('\n--- 结束回合（AI + 月结算）---');
console.log(engine.endTurn());

console.log('\n' + engine.getCityState('luoyang'));
console.log('\n演示完成');
