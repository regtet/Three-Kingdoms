import { GameEngine } from '../assets/scripts/core/game/GameEngine';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { findCity } from '../assets/scripts/core/utils/helpers';

const engine = new GameEngine();
engine.newGame(SCENARIO_001, 'wei');

console.log('=== 三国志 MVP 模拟 ===');
console.log(`玩家: 魏 | 剧本: ${SCENARIO_001.name}`);

for (let i = 0; i < 5; i++) {
  const s = engine.state!;
  console.log(`\n--- 回合 ${s.turn} (${s.year}年${s.month}月) ---`);

  const cities = s.cities.filter((c) => c.factionId === 'wei');
  for (const city of cities.slice(0, 2)) {
    engine.develop(city.id);
    engine.farm(city.id);
    engine.recruit(city.id, 300);
  }

  const from = findCity(engine.state!, 'xuchang');
  if (from.troops >= 1500) {
    const result = engine.attack({
      attackerGeneralId: 'g_xuchu',
      attackerTroops: Math.floor(from.troops * 0.6),
      fromCityId: 'xuchang',
      targetCityId: 'shouchun',
    });
    console.log('战斗:', result.log[0]);
  }

  engine.endTurn();

  if (s.phase === 'ended') {
    console.log(`\n游戏结束: ${s.endReason} 胜者 ${s.winnerFactionId}`);
    break;
  }

  const owned = s.cities.filter((c) => c.factionId === 'wei').length;
  console.log(`魏占领 ${owned}/12 城`);
}

console.log('\n模拟完成');
