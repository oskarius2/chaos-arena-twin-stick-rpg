import { ARTIFACTS, artifactPowerScore } from '../content/artifacts';
import { PASSIVE_BUFFS } from '../content/buffs';
import { ArtifactSlot, BuffRarity, GameState } from '../types';

const EXCLUSIVE_IDS = new Set(
  Object.values(PASSIVE_BUFFS)
    .filter((b) => b.exclusive || b.rarity === BuffRarity.EXCLUSIVE)
    .map((b) => b.id)
);

const STACK_WEIGHTS: Record<string, number> = {
  multishot_up: 4,
  multishot_apocalypse: 8,
  dmg_up: 2,
  crit_up: 2,
  orbital: 3,
  orbital_legion: 6,
  lifesteal_up: 2,
  explosive: 2,
  bullet_storm: 5,
  infinity_pierce: 4,
  chain_god: 4,
  glass_cannon_omega: 4,
  kill_satellite: 3,
  void_rift: 3,
};

export function computeThreatLevel(state: GameState): number {
  let score = 0;

  for (const id of state.passives) {
    const def = PASSIVE_BUFFS[id];
    const w = STACK_WEIGHTS[id] ?? (def?.exclusive ? 3 : 1);
    const mult = EXCLUSIVE_IDS.has(id) ? 1.5 : 1;
    score += w * mult;
  }

  score += Math.min(20, state.multiShot * 2);
  score += Math.min(15, (state.baseDamage / 12 - 1) * 10);
  score += state.critChance * 40;
  score += state.orbitalCount * 4;

  if (state.permanentOverdrive) score += 6;
  if (state.permanentRapidFire) score += 6;
  if (state.permanentPiercing) score += 5;
  if (state.permanentTimeSlow) score += 8;
  if (state.hasLighting) score += 4;
  if (state.hasGravityWell || state.hasVoidRift) score += 4;
  if (state.bulletStormMult > 1) score += 8;

  const slots = Object.keys(state.equippedArtifacts) as ArtifactSlot[];
  for (const slot of slots) {
    const artId = state.equippedArtifacts[slot];
    if (artId && ARTIFACTS[artId]) {
      score += artifactPowerScore(ARTIFACTS[artId]) * 0.15;
    }
  }

  score += state.augmentCount * 1.5;
  score += state.stage * 0.8;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getThreatMult(state: GameState): number {
  return 1 + (state.threatLevel / 100) * 0.85;
}

export function pickEnemyTypeForThreat(state: GameState, stage: number): number {
  const t = state.threatLevel;
  const r = Math.random();

  if (state.bossActive) return -1;

  if (t >= 85 && r < 0.06) return 8;
  if (t >= 70 && r < 0.12) return 7;
  if (stage >= 8 && r < 0.04) return 0;
  if ((t >= 50 || stage >= 6) && r < 0.08) return 1;
  if ((t >= 30 || stage >= 5) && r < 0.12) return 2;
  if (stage >= 4 && r < 0.18) return 3;
  if (stage >= 3 && r < 0.28) return 4;
  if (stage >= 2 && r < 0.38) return 5;
  if ((t >= 30 || stage >= 2) && r < 0.5) return 6;
  if (r < 0.65) return 9;
  if (r < 0.8) return 10;
  return 11;
}
