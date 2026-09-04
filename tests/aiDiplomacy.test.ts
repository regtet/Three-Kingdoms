import { describe, it, expect } from 'vitest';
import { createNewGame } from '../assets/scripts/core/utils/helpers';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { runAiDiplomacy } from '../assets/scripts/core/systems/aiDiplomacy';
import { getRelation } from '../assets/scripts/core/systems/diplomacy';

function newState() {
  return createNewGame(SCENARIO_001, 'wei');
}

describe('AI envoy diplomacy', () => {
  it('does nothing when chance roll fails', () => {
    const s = newState();
    runAiDiplomacy(s, () => 1);
    expect(s.envoyMissions.length).toBe(0);
    expect(getRelation(s, 'shu', 'wei')).toBe('hostile');
  });

  it('dispatches traveling envoys instead of instantly changing relations', () => {
    const s = newState();
    const relBefore = getRelation(s, 'wu', 'wei');
    runAiDiplomacy(s, () => 0);
    expect(s.envoyMissions.length).toBeGreaterThanOrEqual(1);
    expect(s.envoyMissions.every((m) => m.factionId !== 'wei')).toBe(true);
    expect(s.envoyMissions.some((m) => m.targetFactionId === 'wei')).toBe(true);
    expect(s.envoyMissions.every((m) => m.status === 'traveling')).toBe(true);
    expect(getRelation(s, 'wu', 'wei')).toBe(relBefore);
    const gid = s.envoyMissions[0].generalId;
    expect(s.generals.find((g) => g.id === gid)!.status).toBe('marching');
  });
});
