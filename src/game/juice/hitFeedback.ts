import { EnemyType, GameState } from '../types';
import { playSfx, SfxEvent } from '../audio/sfx';

export type HitKind = 'normal' | 'crit' | 'shield' | 'boss';

export function triggerHitFeedback(state: GameState, kind: HitKind): void {
  switch (kind) {
    case 'crit':
      state.screenFlash = Math.max(state.screenFlash, 4);
      state.hitStop = Math.min(state.hitStop + 1.5, 5);
      state.screenshake = Math.min(state.screenshake + 5, 20);
      playSfx('crit');
      break;
    case 'boss':
      state.hitStop = Math.min(state.hitStop + 0.8, 3);
      state.screenshake = Math.min(state.screenshake + 3, 15);
      playSfx('hit');
      break;
    case 'shield':
      state.screenFlash = Math.max(state.screenFlash, 1.5);
      playSfx('shield');
      break;
    case 'normal':
    default:
      state.screenshake = Math.min(state.screenshake + 1.5, 10);
      playSfx('hit');
      break;
  }
}

export function shootSfxForSlot(slot: 'CANNON_A' | 'CANNON_B' | 'CANNON_C'): void {
  const map: Record<string, SfxEvent> = {
    CANNON_A: 'shoot_a',
    CANNON_B: 'shoot_b',
    CANNON_C: 'shoot_c',
  };
  playSfx(map[slot]);
}

export function isBossHit(enemyType?: EnemyType): boolean {
  return enemyType === EnemyType.BOSS;
}
