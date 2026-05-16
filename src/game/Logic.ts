import { GameState, Entity, EntityType, Particle, ItemType, EnemyType, Obstacle } from './types';
import { Vector2 } from './utils/vector';
import { hasTimeSlowEffect } from './buffs/applyBuff';
import {
  computeEnemyVelocity,
  runEnemyAttacks,
  getSeparationForce,
  finalizeEnemyMovement,
} from './ai/enemyBehaviors';
import { pickEnemyTypeForThreat } from './balance/threat';

export { ARTIFACTS, artifactPowerScore } from './content/artifacts';
export { PASSIVE_BUFFS } from './content/buffs';
export { pickBuffs } from './buffs/pickBuffs';
export { getCardIntervalSeconds, getNextLevelExp } from './buffs/cardTiming';
export { computeThreatLevel, getThreatMult, pickEnemyTypeForThreat } from './balance/threat';

export function appendObstaclesForExpansion(
  stage: number,
  worldWidth: number,
  worldHeight: number,
  expandW: number,
  expandH: number,
  playerPos: Vector2
): Obstacle[] {
  const obs: Obstacle[] = [];
  const count = 3 + Math.floor(stage * 0.5);
  for (let i = 0; i < count; i++) {
    const isCircle = Math.random() > 0.5;
    const sizeBase = 50 + Math.random() * 120;
    let pos = new Vector2(
      playerPos.x + (Math.random() - 0.5) * (worldWidth + expandW),
      playerPos.y + (Math.random() - 0.5) * (worldHeight + expandH)
    );
    pos.x = Math.max(80, Math.min(worldWidth + expandW - 80, pos.x));
    pos.y = Math.max(80, Math.min(worldHeight + expandH - 80, pos.y));
    if (pos.sub(playerPos).magnitude() < 200) continue;
    obs.push({
      id: Math.random().toString(),
      type: isCircle ? 'CIRCLE' : 'RECT',
      pos,
      size: isCircle ? new Vector2(sizeBase, 0) : new Vector2(sizeBase, sizeBase * (0.5 + Math.random())),
      rotation: isCircle ? Math.random() * Math.PI : 0,
      color: `hsl(${(stage * 25 + i * 17) % 360}, 30%, 15%)`,
    });
  }
  return obs;
}

export function generateObstaclesForStage(stage: number, width: number, height: number): Obstacle[] {
  const obs: Obstacle[] = [];
  const numObstacles = 4 + Math.floor(stage * 1.5);
  
  for (let i = 0; i < numObstacles; i++) {
    const isCircle = Math.random() > 0.5;
    const sizeBase = 50 + Math.random() * 150;
    const type = isCircle ? 'CIRCLE' : 'RECT';
    
    // Attempt to not spawn right in the center where player is
    let pos = new Vector2(Math.random() * width, Math.random() * height);
    while (pos.sub(new Vector2(width / 2, height / 2)).magnitude() < 300) {
      pos = new Vector2(Math.random() * width, Math.random() * height);
    }

    obs.push({
      id: Math.random().toString(),
      type,
      pos,
      size: isCircle ? new Vector2(sizeBase, 0) : new Vector2(sizeBase, sizeBase * (0.5 + Math.random())),
      rotation: isCircle ? Math.random() * Math.PI : 0, // 0 for AABB rects
      color: `hsl(${(stage * 25) % 360}, 30%, 15%)`,
    });
  }
  return obs;
}

export function getInitialWorldSize(viewWidth: number, viewHeight: number): { width: number; height: number } {
  const base = Math.min(viewWidth, viewHeight);
  const mult = 20;
  return { width: base * mult, height: base * mult };
}

export const INITIAL_STATE = (width: number, height: number): GameState => {
  const { width: worldWidth, height: worldHeight } = getInitialWorldSize(width, height);
  return {
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: new Vector2(worldWidth / 2, worldHeight / 2),
      radius: 15,
      health: 100,
      maxHealth: 100,
      speed: 6.5,
      velocity: new Vector2(0, 0),
      color: '#60a5fa',
    },
    enemies: [],
    projectiles: [],
    items: [],
    particles: [],
    obstacles: generateObstaclesForStage(1, worldWidth, worldHeight),
    score: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 650,
    isGameOver: false,
    isPaused: false,
    wave: 1,
    stage: 1,
    enemiesToKill: 60,
    bossActive: false,
    stageTransition: 0,
    world: { width: worldWidth, height: worldHeight },
    camera: new Vector2(worldWidth / 2 - width / 2, worldHeight / 2 - height / 2),
    energy: 100,
    maxEnergy: 100,
    isDashing: false,
    dashDirection: new Vector2(0, 0),
    dashDuration: 0,
    buffs: {
      shield: 0,
      overdrive: 0,
      magnet: 0,
      scoreX: 0,
      rapidFire: 0,
      timeSlow: 0,
      piercing: 0,
    },
    screenshake: 0,
    multiShot: 1,
    baseDamage: 12,
    critChance: 0.1,
    lifeSteal: 0,
    regen: 0,
    explosiveChance: 0,
    bounceCount: 0,
    magnetRange: 150,
    orbitalCount: 0,
    passives: [],
    rapidFireTimer: 0,
    shieldTimer: 0,
    screenFlash: 0,
    hitStop: 0,
    damageTexts: [],
    combo: 0,
    comboTimer: 0,
    gameMode: 'NORMAL',
    equippedArtifacts: {
      CANNON_A: null,
      CANNON_B: null,
      CANNON_C: null,
      ARMOR: null,
      MOBILITY: null
    },
    activeWeaponSlot: 'CANNON_A',
    cardTimer: 75,
    permanentOverdrive: false,
    permanentTimeSlow: false,
    permanentRapidFire: false,
    permanentPiercing: false,
    hasLighting: false,
    hasGravityWell: false,
    hasBackshot: false,
    hasSpiralShot: false,
    burnOnCrit: false,
    frostSlowStrength: 0,
    thornsDamage: 0,
    dashIFrames: false,
    dashIFrameTimer: 0,
    comboDamageMult: 1,
    hasEmergencyShield: false,
    emergencyShieldCooldown: 0,
    smartRicochet: false,
    vampiricBurstStacks: 0,
    killCountSinceHeal: 0,
    chainCritBonus: 0,
    pendingCritBonus: 0,
    wideArcStacks: 0,
    dashEnergyDiscount: 0,
    volatileDeath: false,
    hasTimeDilation: false,
    timeDilationCooldown: 0,
    hunterMarkBonus: 0,
    runArtifactUnlocks: 0,
    survivalTime: 0,
    threatLevel: 0,
    threatPeak: 0,
    augmentCount: 0,
    augmentPityExclusive: 0,
    runStartTime: Date.now(),
    bulletStormMult: 1,
    hasVoidRift: false,
    voidRiftCooldown: 0,
    killSatelliteCounter: 0,
    hasInfinityPierce: false,
    runArtifactsUnlockedThisRun: [],
    pickJuiceTimer: 0,
    beamFlashes: [],
    nextShotBurns: false,
  };
};

export function createExplosion(pos: Vector2, color: string, count: number = 10, speedMult: number = 1): Particle[] {
  const particles: Particle[] = [];
  
  // Core debris
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 5 + 3) * speedMult;
    const life = 0.5 + Math.random() * 0.8;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: life,
      maxLife: life,
      color,
      size: Math.random() * 4 + 2,
    });
  }

  // Extra sparks - higher speed
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 15 + 8) * speedMult;
    const life = 0.2 + Math.random() * 0.3;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: life,
      maxLife: life,
      color: '#ffffff',
      size: Math.random() * 2 + 1,
      particleType: 'spark'
    });
  }

  // Add an epic shockwave ring
  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.5,
    maxLife: 0.5,
    color: '#ffffff',
    size: count * 8 * speedMult, // expanding size
    particleType: 'ring'
  });
  
  // Soft glow flash
  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.4,
    maxLife: 0.4,
    color,
    size: count * 15 * speedMult, // expanding size
    particleType: 'dot'
  });

  return particles;
}

export function createImplosion(pos: Vector2, color: string, count: number = 12): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const startDist = 40 + Math.random() * 50;
    const speed = -(4 + Math.random() * 6);
    particles.push({
      id: Math.random().toString(),
      pos: pos.add(new Vector2(Math.cos(angle) * startDist, Math.sin(angle) * startDist)),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.5,
      color,
      size: Math.random() * 3 + 2,
      particleType: 'spark',
    });
  }
  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.35,
    maxLife: 0.35,
    color,
    size: 60,
    particleType: 'ring',
  });
  return particles;
}

export function spawnXpOrb(pos: Vector2, amount = 25): Entity {
  return {
    id: Math.random().toString(36).slice(2, 9),
    type: EntityType.ITEM,
    pos: pos.clone(),
    radius: 10,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 0),
    color: '#22d3ee',
    itemType: ItemType.XP,
    damage: amount,
  };
}

export function createImpact(pos: Vector2, color: string, count: number = 3): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 15 + 5; // faster speed for sparks
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0.2,
      maxLife: 0.2,
      color: '#ffffff', // Impacts are always bright
      size: Math.random() * 3 + 1,
      particleType: 'spark'
    });
  }
  
  // Small impact ring
  particles.push({
    id: Math.random().toString(),
    pos: pos.clone(),
    velocity: new Vector2(0, 0),
    life: 0.15,
    maxLife: 0.15,
    color: '#ffffff',
    size: 30 + count * 5,
    particleType: 'ring'
  });
  
  return particles;
}

export function createItemSparkle(pos: Vector2, color: string, count: number = 8): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    const life = 0.4 + Math.random() * 0.4;
    particles.push({
      id: Math.random().toString(),
      pos: pos.clone(),
      velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: life,
      maxLife: life,
      color: color,
      size: Math.random() * 2 + 1,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number = 1) {
  // Cap total particles higher for better visuals
  const maxParticlesCount = 300;
  let current = particles;
  if (particles.length > maxParticlesCount) {
    current = particles.slice(particles.length - maxParticlesCount);
  }

  return current.filter(p => {
    p.pos.x += p.velocity.x * dt;
    p.pos.y += p.velocity.y * dt;
    const friction = Math.pow(0.92, dt);
    p.velocity.x *= friction;
    p.velocity.y *= friction;
    p.life -= (1 / p.maxLife) * 0.03 * dt;
    // Shrink over life
    p.size *= Math.pow(0.98, dt);
    return p.life > 0;
  });
}

export function spawnEnemy(state: GameState, typeOverride?: number): Entity {
  const worldWidth = state.world.width;
  const worldHeight = state.world.height;
  const playerPos = state.player.pos;
  const augmentTier = state.augmentCount;
  const stage = state.stage;
  const threatMult = 1 + (state.threatLevel / 100) * 0.85;

  const angle = Math.random() * Math.PI * 2;
  const distance = 1000 + Math.random() * 300;

  let pos = new Vector2(
    playerPos.x + Math.cos(angle) * distance,
    playerPos.y + Math.sin(angle) * distance
  );

  pos.x = Math.max(0, Math.min(worldWidth, pos.x));
  pos.y = Math.max(0, Math.min(worldHeight, pos.y));

  const skillFactor = Math.sqrt(state.score / 3000 + 1);
  const healthScale = (1 + augmentTier * 0.12 + stage * 0.6) * skillFactor * threatMult;
  const speedScale =
    (1 + augmentTier * 0.035 + stage * 0.07) * Math.min(2.1, skillFactor + state.threatLevel / 80);

  const isBoss = state.bossActive && state.enemies.filter((e) => e.enemyType === EnemyType.BOSS).length === 0;

  let radius = 12;
  let health = 30 * healthScale;
  let speed = (1.7 + Math.random() * 0.7) * speedScale;
  let color = '#f87171';
  let enemyType = EnemyType.CHASER;
  let damageResist = 0;

  if (isBoss) {
    radius = 110 + stage * 15;
    health = (4000 + stage * 3000 + state.threatLevel * 40) * threatMult;
    speed = 0.8 * speedScale;
    color = '#991b1b';
    enemyType = EnemyType.BOSS;
  } else {
    const typePick = typeOverride ?? pickEnemyTypeForThreat(state, stage);
    switch (typePick) {
      case 0:
        color = '#7c3aed';
        radius = 70;
        health *= 50;
        speed *= 0.2;
        enemyType = EnemyType.TANK;
        break;
      case 1:
        color = '#0ea5e9';
        radius = 40;
        health *= 30;
        speed *= 0.3;
        enemyType = EnemyType.PHALANX;
        break;
      case 2:
        color = '#fde68a';
        radius = 18;
        health *= 5;
        speed *= 1.4;
        enemyType = EnemyType.WRAITH;
        break;
      case 3:
        color = '#fbbf24';
        radius = 35;
        health *= 15;
        speed *= 1.1;
        enemyType = EnemyType.ELITE;
        break;
      case 4:
        color = '#f87171';
        radius = 25;
        health *= 8;
        speed *= 0.8;
        enemyType = EnemyType.SPLINTER;
        break;
      case 5:
        color = '#f97316';
        radius = 22;
        health *= 6;
        speed *= 1.1;
        enemyType = EnemyType.NOVA;
        break;
      case 6:
        color = '#c084fc';
        radius = 20;
        health *= 2.5;
        speed *= 0.85;
        enemyType = EnemyType.RANGED;
        break;
      case 8:
        color = '#22d3ee';
        radius = 14;
        health *= 4;
        speed *= 1.2;
        enemyType = EnemyType.CHASER;
        damageResist = 0.15;
        break;
      case 9:
        color = '#fde047';
        radius = 11;
        health *= 0.4;
        speed *= 2.3;
        enemyType = EnemyType.FAST;
        break;
      case 10:
        color = '#fb923c';
        radius = 9;
        health *= 0.15;
        speed *= 2.6;
        enemyType = EnemyType.SWARMER;
        break;
      default:
        break;
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ENEMY,
    pos,
    radius,
    health,
    maxHealth: health,
    speed,
    velocity: new Vector2(0, 0),
    color,
    damage: Math.floor((12 + Math.floor(augmentTier / 1.5) + stage * 5) * threatMult),
    enemyType,
    lastShot: Date.now(),
    aiTimer: 0,
    behaviorSeed: Math.random(),
    aiState: 'chase',
    damageResist,
  };
}

export function updateProjectiles(projectiles: Entity[], worldWidth: number, worldHeight: number, dt: number = 1, bounceCount: number = 0) {
  const updated = projectiles.filter(p => {
    p.pos = p.pos.add(p.velocity.mul(dt));
    
    if (p.life !== undefined) {
      p.life -= 0.016 * dt;
      if (p.life <= 0) return false;
    }
    
    // Wall bounce
    if (bounceCount > 0) {
      if (p.pos.x < 0 || p.pos.x > worldWidth) {
        p.velocity.x *= -1;
        p.pos.x = Math.max(0, Math.min(worldWidth, p.pos.x));
      }
      if (p.pos.y < 0 || p.pos.y > worldHeight) {
        p.velocity.y *= -1;
        p.pos.y = Math.max(0, Math.min(worldHeight, p.pos.y));
      }
    }

    return (
      p.pos.x > -100 && p.pos.x < worldWidth + 100 &&
      p.pos.y > -100 && p.pos.y < worldHeight + 100
    );
  });
  return updated;
}

export function updateEnemies(state: GameState, dt: number = 1) {
  const { enemies, player } = state;
  const playerPos = player.pos;
  const enemyDt = hasTimeSlowEffect(state) ? dt * 0.3 : dt;

  const gridSize = 120;
  const grid: Record<string, number[]> = {};

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const gx = Math.floor(e.pos.x / gridSize);
    const gy = Math.floor(e.pos.y / gridSize);
    const key = `${gx},${gy}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(i);
  }

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = playerPos.x - enemy.pos.x;
    const dy = playerPos.y - enemy.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0.1) continue;

    let { vx, vy } = computeEnemyVelocity(enemy, state, enemyDt, dist, dx, dy);
    const sep = getSeparationForce(enemy, enemies, grid, gridSize, i, enemy.enemyType, state);
    vx += sep.vx;
    vy += sep.vy;

    runEnemyAttacks(enemy, state, dist, dx, dy, vx, vy);

    finalizeEnemyMovement(enemy, state, vx, vy, enemyDt, i);
    resolveObstacleCollision(enemy, state.obstacles);
  }
}

// Simple circle collision
export function checkCollision(e1: Entity, e2: Entity): boolean {
  const dx = e1.pos.x - e2.pos.x;
  const dy = e1.pos.y - e2.pos.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = e1.radius + e2.radius;
  return distSq < radiusSum * radiusSum;
}

export function resolveObstacleCollision(entity: Entity, obstacles: Obstacle[]) {
  // Simple push-out resolution
  for (const obs of obstacles) {
    if (obs.type === 'CIRCLE') {
      const dx = entity.pos.x - obs.pos.x;
      const dy = entity.pos.y - obs.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minRadius = entity.radius + obs.size.x;
      if (dist < minRadius) {
        const overlap = minRadius - dist;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;
        entity.pos.x += pushX;
        entity.pos.y += pushY;
      }
    } else if (obs.type === 'RECT') {
      // Very basic unrotated AABB collision for RECT
      const hw = obs.size.x / 2;
      const hh = obs.size.y / 2;
      // We will ignore rotation for physics simplicity right now, treating as AABB
      
      const testX = Math.max(obs.pos.x - hw, Math.min(entity.pos.x, obs.pos.x + hw));
      const testY = Math.max(obs.pos.y - hh, Math.min(entity.pos.y, obs.pos.y + hh));
      
      const dx = entity.pos.x - testX;
      const dy = entity.pos.y - testY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < entity.radius * entity.radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = entity.radius - dist;
        entity.pos.x += (dx / dist) * overlap;
        entity.pos.y += (dy / dist) * overlap;
      }
    }
  }
}

export function checkProjectileObstacleCollision(p: Entity, obs: Obstacle): boolean {
  if (obs.type === 'CIRCLE') {
    const dx = p.pos.x - obs.pos.x;
    const dy = p.pos.y - obs.pos.y;
    return (dx * dx + dy * dy) < (obs.size.x + p.radius) * (obs.size.x + p.radius);
  } else if (obs.type === 'RECT') {
    const hw = obs.size.x / 2;
    const hh = obs.size.y / 2;
    const testX = Math.max(obs.pos.x - hw, Math.min(p.pos.x, obs.pos.x + hw));
    const testY = Math.max(obs.pos.y - hh, Math.min(p.pos.y, obs.pos.y + hh));
    const dx = p.pos.x - testX;
    const dy = p.pos.y - testY;
    return (dx * dx + dy * dy) < p.radius * p.radius;
  }
  return false;
}

export function spawnItem(pos: Vector2): Entity | null {
  const rand = Math.random();
  if (rand > 0.25) return null; 
  
  let type: ItemType = ItemType.SCORE;
  let color = '#fbbf24'; 
  
  if (rand < 0.08) {
    type = ItemType.BOMB;
    color = '#ffffff'; 
  } else if (rand < 0.16) {
    type = ItemType.HEALTH;
    color = '#4ade80';
  } else {
    type = ItemType.ENERGY;
    color = '#a78bfa'; 
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: EntityType.ITEM,
    pos: pos.clone(),
    radius: 12,
    health: 1,
    maxHealth: 1,
    speed: 0,
    velocity: new Vector2(0, 0),
    color,
    itemType: type,
  };
}
