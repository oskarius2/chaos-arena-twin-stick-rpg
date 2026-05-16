import { GameState, Entity, EntityType, Particle, ItemType, EnemyType, Obstacle, BuffRarity, PassiveBuff, Artifact } from './types';
import { Vector2 } from './utils/vector';

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

export const INITIAL_STATE = (width: number, height: number): GameState => {
  const worldWidth = width * 10;
  const worldHeight = height * 10;
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
    nextLevelExp: 500,
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
    cardTimer: 60
  };
};

export const PASSIVE_BUFFS: Record<string, PassiveBuff> = {
  'dmg_up': { id: 'dmg_up', name: 'Kinetic Overload', description: 'Overcharge systems to increase base bullet damage by 25%', rarity: BuffRarity.COMMON, icon: 'Zap' },
  'crit_up': { id: 'crit_up', name: 'Precision Optics', description: 'Enhance targeting sensors to increase critical strike chance by 15%', rarity: BuffRarity.COMMON, icon: 'Target' },
  'health_up': { id: 'health_up', name: 'Composite Hull', description: 'Reinforce ship structure with composite plating (+60 Max HP)', rarity: BuffRarity.COMMON, icon: 'Shield' },
  'speed_up': { id: 'speed_up', name: 'Afterburners', description: 'Improve engine efficiency for constant 20% increase in mobility', rarity: BuffRarity.COMMON, icon: 'Flame' },
  'energy_up': { id: 'energy_up', name: 'Flux Capacitor', description: 'Install high-capacity energy cells for larger dash reserves', rarity: BuffRarity.COMMON, icon: 'Zap' },
  'magnet_up': { id: 'magnet_up', name: 'Singularity Field', description: 'Generate a local gravity well that pulls items from huge distances', rarity: BuffRarity.RARE, icon: 'Magnet' },
  'regen_up': { id: 'regen_up', name: 'Nano-Bot Swarm', description: 'Deploy repair drones that constantly mend hull integrity (4HP/s)', rarity: BuffRarity.RARE, icon: 'Activity' },
  'bounce_up': { id: 'bounce_up', name: 'Kinetic Rebound', description: 'Experimental ammo coating allows projectiles to bounce off obstacles', rarity: BuffRarity.RARE, icon: 'RotateCcw' },
  'lifesteal_up': { id: 'lifesteal_up', name: 'Soul Siphon', description: 'Harvest residual energy from destroyed enemies to recover health', rarity: BuffRarity.EPIC, icon: 'HeartPulse' },
  'shield_up': { id: 'shield_up', name: 'Aegis Protocol', description: 'Advanced emergency shielding that regenerates every 15 seconds', rarity: BuffRarity.EPIC, icon: 'ShieldCheck' },
  'explosive': { id: 'explosive', name: 'Volatile Rounds', description: 'Bullets have a chance to trigger massive area-of-effect explosions', rarity: BuffRarity.EPIC, icon: 'Bomb' },
  'multishot_up': { id: 'multishot_up', name: 'Split-Fire Array', description: 'Calibrate cannons to fire additional projectiles in each burst', rarity: BuffRarity.EPIC, icon: 'Swords' },
  'overdrive_p': { id: 'overdrive_p', name: 'Core Overclock', description: 'Permanently boost internal clock speeds for higher attack frequency', rarity: BuffRarity.EPIC, icon: 'Zap' },
  'time_slow_p': { id: 'time_slow_p', name: 'Chrono Disruption', description: 'Radiate a field that slows all surrounding enemy movement significantly', rarity: BuffRarity.EPIC, icon: 'RotateCcw' },
  'orbital': { id: 'orbital', name: 'Sentinel Drone', description: 'Deploy an automated combat drone that orbits and shreds nearby targets', rarity: BuffRarity.LEGENDARY, icon: 'CircleIcon' },
  'lighting': { id: 'lighting', name: 'Arc Discharger', description: 'Projectiles release high-voltage arcs that chain between enemies', rarity: BuffRarity.LEGENDARY, icon: 'Zap' },
  'rapid_fire_p': { id: 'rapid_fire_p', name: 'Hyper-Trigger', description: 'Unlock total fire rate potential, effectively doubling rate of fire', rarity: BuffRarity.LEGENDARY, icon: 'Flame' },
  'pierce_up': { id: 'pierce_up', name: 'Plasma Shredders', description: 'Ammunition becomes intangible, passing through all targets in its path', rarity: BuffRarity.LEGENDARY, icon: 'MoveRight' },
  'gravity_well': { id: 'gravity_well', name: 'Event Horizon', description: 'Bullets create micro-singularities that pull enemies into the line of fire', rarity: BuffRarity.LEGENDARY, icon: 'Zap' },
};

export function getRandomBuffs(count: number): PassiveBuff[] {
  const all = Object.values(PASSIVE_BUFFS);
  const selected: PassiveBuff[] = [];
  const pool = [...all];
  
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    // Rarity weighting: Legendary (3%), Epic (10%), Rare (25%), Common (62%)
    const rand = Math.random();
    let rarityTarget = BuffRarity.COMMON;
    if (rand < 0.03) rarityTarget = BuffRarity.LEGENDARY;
    else if (rand < 0.13) rarityTarget = BuffRarity.EPIC;
    else if (rand < 0.38) rarityTarget = BuffRarity.RARE;

    let options = pool.filter(b => b.rarity === rarityTarget);
    if (options.length === 0) {
      // Fallback: search for closest available rarity
      options = pool;
    }
    
    const idx = Math.floor(Math.random() * options.length);
    const buff = options[idx];
    selected.push(buff);
    pool.splice(pool.findIndex(b => b.id === buff.id), 1);
  }
  return selected;
}

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

export function spawnEnemy(state: GameState): Entity {
  const worldWidth = state.world.width;
  const worldHeight = state.world.height;
  const playerPos = state.player.pos;
  const level = state.level;
  const stage = state.stage;

  // Spawn range increases with maps
  const angle = Math.random() * Math.PI * 2;
  const distance = 1000 + Math.random() * 300; 
  
  let pos = new Vector2(
    playerPos.x + Math.cos(angle) * distance,
    playerPos.y + Math.sin(angle) * distance
  );

  pos.x = Math.max(0, Math.min(worldWidth, pos.x));
  pos.y = Math.max(0, Math.min(worldHeight, pos.y));

  // Balanced Difficulty Scaling
  const skillFactor = Math.sqrt(state.score / 3000 + 1); // Scales faster
  const healthScale = (1 + (level * 0.15) + (stage * 0.6)) * skillFactor;
  const speedScale = (1 + (level * 0.04) + (stage * 0.07)) * Math.min(1.8, skillFactor);
  
  const isBoss = state.bossActive && state.enemies.filter(e => e.enemyType === EnemyType.BOSS).length === 0;

  let radius = 12;
  let health = 30 * healthScale;
  let speed = (1.7 + Math.random() * 0.7) * speedScale;
  let color = '#f87171';
  let enemyType = EnemyType.CHASER;

  if (isBoss) {
    radius = 110 + stage * 15;
    health = 4000 + stage * 3000;
    speed = 0.8 * speedScale;
    color = '#991b1b';
    enemyType = EnemyType.BOSS;
  } else {
    const randType = Math.random();
    if (stage >= 8 && randType < 0.04) {
      color = '#7c3aed'; // Titan
      radius = 70;
      health *= 50;
      speed *= 0.2;
      enemyType = EnemyType.TANK;
    } else if (stage >= 6 && randType < 0.08) {
      color = '#0ea5e9'; // Phalanx
      radius = 40;
      health *= 30;
      speed *= 0.3;
      enemyType = EnemyType.PHALANX;
    } else if (stage >= 5 && randType < 0.12) {
      color = '#fde68a'; // Wraith
      radius = 18;
      health *= 5;
      speed *= 1.4;
      enemyType = EnemyType.WRAITH;
    } else if (stage >= 4 && randType < 0.18) {
      color = '#fbbf24'; // Elite
      radius = 35;
      health *= 15;
      speed *= 1.1;
      enemyType = EnemyType.ELITE;
    } else if (stage >= 3 && randType < 0.28) {
      color = '#f87171'; // Splinter
      radius = 25;
      health *= 8;
      speed *= 0.8;
      enemyType = EnemyType.SPLINTER;
    } else if (stage >= 2 && randType < 0.38) {
      color = '#f97316'; // Nova
      radius = 22;
      health *= 6;
      speed *= 1.1;
      enemyType = EnemyType.NOVA;
    } else if (stage >= 2 && randType < 0.50) {
      color = '#c084fc'; // Ranged
      radius = 20;
      health *= 2.5;
      speed *= 0.85;
      enemyType = EnemyType.RANGED;
    } else if (randType < 0.65) {
      color = '#fde047'; // Fast
      radius = 11;
      health *= 0.4;
      speed *= 2.3;
      enemyType = EnemyType.FAST;
    } else if (randType < 0.8) {
      color = '#fb923c'; // Swarmer
      radius = 9;
      health *= 0.15;
      speed *= 2.6;
      enemyType = EnemyType.SWARMER;
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
    damage: 12 + Math.floor(level / 1.5) + (stage * 5),
    enemyType,
    lastShot: Date.now(),
    aiTimer: 0,
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
  const { enemies, player, projectiles, buffs, world } = state;
  const playerPos = player.pos;

  // Apply time slow logic
  const enemyDt = buffs.timeSlow > 0 ? dt * 0.3 : dt;

  // Performance Optimization: Spatial Grid for Separation (Pre-built in App.tsx now ideally, but we'll optimize here)
  const gridSize = 120;
  const grid: Record<string, number[]> = {};
  
  // High-performance spatial partitioning
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const gx = Math.floor(e.pos.x / gridSize);
    const gy = Math.floor(e.pos.y / gridSize);
    const key = `${gx},${gy}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(i);
  }

  // Global chaos factor for balancing
  const chaosFactor = Math.max(1, enemies.length / 80);

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = playerPos.x - enemy.pos.x;
    const dy = playerPos.y - enemy.pos.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    
    if (dist > 0.1) {
      let vx = 0;
      let vy = 0;
      let steerX = 0;
      let steerY = 0;

      // --- AI BEHAVIOR BRANCHES ---
      // Distribute behaviors based on ID with much higher variance
      const aiSeed = (enemy.id.charCodeAt(enemy.id.length - 1) % 50) / 50;
      
      // Much more aggressive flanking angles: +/- ~160 degrees
      const flankAngle = (aiSeed - 0.5) * Math.PI * 1.7; 
      
      const approachType = aiSeed > 0.8 ? 'CIRCLE' : aiSeed > 0.45 ? 'FLANK' : 'DIRECT';

      if (enemy.enemyType === EnemyType.RANGED) {
        // Ranged behavior: strafe aggressively to stay in "sweet spot"
        const comfortZoneMin = 400;
        const comfortZoneMax = 600;
        
        if (dist > comfortZoneMax) {
          vx = (dx / dist) * enemy.speed;
          vy = (dy / dist) * enemy.speed;
        } else if (dist < comfortZoneMin) {
          vx = -(dx / dist) * enemy.speed;
          vy = -(dy / dist) * enemy.speed;
        } else {
          // Strafe in comfort zone
          const strafeDir = new Vector2(-dy / dist, dx / dist).mul(aiSeed > 0.5 ? 1 : -1);
          vx = strafeDir.x * enemy.speed;
          vy = strafeDir.y * enemy.speed;
        }

        // Weapon: Predictive/Burst
        const now = Date.now();
        const fireRate = (buffs.timeSlow > 0 ? 6000 : 3000) * (0.7 + aiSeed * 0.6);
        if (now - (enemy.lastShot || 0) > fireRate) {
          enemy.lastShot = now;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.12;
          projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            pos: enemy.pos.clone(),
            radius: 5,
            health: 1,
            maxHealth: 1,
            speed: 8,
            velocity: new Vector2(Math.cos(angle) * 8, Math.sin(angle) * 8),
            color: '#c084fc',
            ownerId: enemy.id,
            damage: enemy.damage || 10,
          });
        }
      } else if (enemy.enemyType === EnemyType.BOSS) {
        // Boss: Direct and menacing
        vx = (dx / dist) * enemy.speed;
        vy = (dy / dist) * enemy.speed;
        
        const now = Date.now();
        const baseInterval = (buffs.timeSlow > 0 ? 3000 : 1200);
        if (now - (enemy.lastShot || 0) > baseInterval) {
          enemy.lastShot = now;
          const attackPattern = Math.floor(now / 1500) % 3;
          const angleToPlayer = Math.atan2(dy, dx);

          if (attackPattern === 0) {
            // Nova
            for (let a = 0; a < 24; a++) {
              const angle = (a / 24) * Math.PI * 2;
              projectiles.push({
                id: Math.random().toString(),
                type: EntityType.PROJECTILE,
                pos: enemy.pos.clone(),
                radius: 14,
                health: 1,
                maxHealth: 1,
                speed: 6,
                velocity: new Vector2(Math.cos(angle) * 6, Math.sin(angle) * 6),
                color: '#ef4444',
                ownerId: enemy.id,
                damage: enemy.damage || 30,
              });
            }
          } else {
            // Target Barrage
            for (let a = -2; a <= 2; a++) {
              const angle = angleToPlayer + a * 0.15;
              projectiles.push({
                id: Math.random().toString(),
                type: EntityType.PROJECTILE,
                pos: enemy.pos.clone(),
                radius: 12,
                health: 1,
                maxHealth: 1,
                speed: 12,
                velocity: new Vector2(Math.cos(angle) * 12, Math.sin(angle) * 12),
                color: '#f97316',
                ownerId: enemy.id,
                damage: enemy.damage || 20,
              });
            }
          }
        }
      } else {
        // Standard Behavior with high path diversity
        if (approachType === 'CIRCLE' && dist < 500) {
          // Circlers strafe around you to create a cloud effect
          const strafeDir = new Vector2(-dy / dist, dx / dist).mul(aiSeed > 0.9 ? 1 : -1);
          const approachDir = new Vector2(dx / dist, dy / dist);
          // Mix strafe and approach so they don't just circle forever without hitting
          vx = (strafeDir.x * 0.75 + approachDir.x * 0.25) * enemy.speed;
          vy = (strafeDir.y * 0.75 + approachDir.y * 0.25) * enemy.speed;
        } else if (approachType === 'FLANK') {
          // Flankers move in wide arcs
          const cosF = Math.cos(flankAngle * 0.4);
          const sinF = Math.sin(flankAngle * 0.4);
          vx = ((dx * cosF - dy * sinF) / dist) * enemy.speed;
          vy = ((dx * sinF + dy * cosF) / dist) * enemy.speed;
        } else {
          // Direct chasers but with a "wobble" to prevent single-file lines
          const wobble = Math.sin(Date.now() / 250 + aiSeed * 20) * 0.2;
          const cosW = Math.cos(wobble);
          const sinW = Math.sin(wobble);
          vx = ((dx * cosW - dy * sinW) / dist) * enemy.speed;
          vy = ((dx * sinW + dy * cosW) / dist) * enemy.speed;
        }

        // Additional behavior for Elites: periodic burst fire
        if (enemy.enemyType === EnemyType.ELITE) {
          const now = Date.now();
          if (now - (enemy.lastShot || 0) > 2500) {
            enemy.lastShot = now;
            const angle = Math.atan2(dy, dx);
            for (let b = -1; b <= 1; b++) {
              const bAngle = angle + b * 0.3;
              projectiles.push({
                id: Math.random().toString(),
                type: EntityType.PROJECTILE,
                pos: enemy.pos.clone(),
                radius: 6,
                health: 1,
                maxHealth: 1,
                speed: 9,
                velocity: new Vector2(Math.cos(bAngle) * 9, Math.sin(bAngle) * 9),
                color: '#fbbf24',
                ownerId: enemy.id,
                damage: enemy.damage || 15,
              });
            }
          }
        }
      }

      // --- ADVANCED SEPARATION (Spatial Grid) ---
      // This is crucial to preventing "lines"
      const gx = Math.floor(enemy.pos.x / gridSize);
      const gy = Math.floor(enemy.pos.y / gridSize);
      const sepRadius = (enemy.radius + 20) * 2; 
      const sepForce = 4.0; // Dynamic and stronger push

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cell = grid[`${gx + ox},${gy + oy}`];
          if (!cell) continue;
          for (const otherIdx of cell) {
            if (otherIdx === i) continue;
            const other = enemies[otherIdx];
            const sdx = enemy.pos.x - other.pos.x;
            const sdy = enemy.pos.y - other.pos.y;
            const sdistSq = sdx * sdx + sdy * sdy;
            const minDist = (enemy.radius + other.radius) * 4.5; // Extreme buffer to force cloud behavior
            if (sdistSq < minDist * minDist) {
              const sdist = Math.sqrt(sdistSq) || 0.1;
              const push = (minDist - sdist) / minDist;
              steerX += (sdx / sdist) * push * sepForce;
              steerY += (sdy / sdist) * push * sepForce;
            }
          }
        }
      }

      // Organic noise for swarm variety
      const noiseX = Math.sin(Date.now() * 0.002 + i * 500) * 0.8;
      const noiseY = Math.cos(Date.now() * 0.003 + i * 700) * 0.8;

      vx += steerX + noiseX;
      vy += steerY + noiseY;

      if (enemy.knockback) {
        vx += enemy.knockback.x;
        vy += enemy.knockback.y;
        enemy.knockback.x *= Math.pow(0.85, enemyDt);
        enemy.knockback.y *= Math.pow(0.85, enemyDt);
        if (Math.abs(enemy.knockback.x) < 0.1 && Math.abs(enemy.knockback.y) < 0.1) enemy.knockback = undefined;
      }

      enemy.pos.x += vx * enemyDt;
      enemy.pos.y += vy * enemyDt;
      enemy.velocity.x = vx;
      enemy.velocity.y = vy;
      
      enemy.pos.x = Math.max(0, Math.min(world.width, enemy.pos.x));
      enemy.pos.y = Math.max(0, Math.min(world.height, enemy.pos.y));

      resolveObstacleCollision(enemy, state.obstacles);
    }
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

export const ARTIFACTS: Record<string, Artifact> = {
  // --- CANNON A (Primary) ---
  'iron_sights': {
    id: 'iron_sights',
    name: 'Iron Sights',
    description: 'Standard targeting optics. Damage +4',
    rarity: BuffRarity.COMMON,
    slot: 'CANNON_A',
    stats: { damageMod: 4 }
  },
  'vanguard_alpha': {
    id: 'vanguard_alpha',
    name: 'Vanguard Alpha',
    description: 'Aggressive prototype. Damage +25%, Crit +5%',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_A',
    stats: { damageMod: 1.25, critMod: 0.05 }
  },
  'void_shard': {
    id: 'void_shard',
    name: 'Void Shard',
    description: 'Mysterious artifact. Damage +45%, Speed -10%',
    rarity: BuffRarity.EPIC,
    slot: 'CANNON_A',
    stats: { damageMod: 1.45, speedMod: 0.9 }
  },
  'pulse_gatling': {
    id: 'pulse_gatling',
    name: 'Pulse Gatling',
    description: 'High-speed battery. Damage +15, Energy +20',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_A',
    stats: { damageMod: 15, energyMod: 20 }
  },
  'eternal_star': {
    id: 'eternal_star',
    name: 'Eternal Star',
    description: 'God-tier relic. Damage +60%, Health +150',
    rarity: BuffRarity.LEGENDARY,
    slot: 'CANNON_A',
    stats: { damageMod: 1.6, healthMod: 150, specialType: 'eternal' }
  },

  // --- CANNON B (Secondary) ---
  'backup_cannon': {
    id: 'backup_cannon',
    name: 'Backup Cannon',
    description: 'Emergency yield gun. Damage +3',
    rarity: BuffRarity.COMMON,
    slot: 'CANNON_B',
    stats: { damageMod: 3 }
  },
  'plasma_repeater': {
    id: 'plasma_repeater',
    name: 'Plasma Repeater',
    description: 'Cycling plasma rounds. Damage +20%',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_B',
    stats: { damageMod: 1.2 }
  },
  'storm_bringer': {
    id: 'storm_bringer',
    name: 'Storm Bringer',
    description: 'Electrical discharge unit. Crit +15%, Damage +10%',
    rarity: BuffRarity.EPIC,
    slot: 'CANNON_B',
    stats: { critMod: 0.15, damageMod: 1.1 }
  },

  // --- CANNON C (Special / Railgun) ---
  'heavy_slug': {
    id: 'heavy_slug',
    name: 'Heavy Slug',
    description: 'Manual rail driver. Damage +50',
    rarity: BuffRarity.COMMON,
    slot: 'CANNON_C',
    stats: { damageMod: 50 }
  },
  'chrono_piercer': {
    id: 'chrono_piercer',
    name: 'Chrono Piercer',
    description: 'Space-time kinetic driver. Damage +150%, Speed -20%',
    rarity: BuffRarity.RARE,
    slot: 'CANNON_C',
    stats: { damageMod: 2.5, speedMod: 0.8 }
  },
  'singularity_cannon': {
    id: 'singularity_cannon',
    name: 'Singularity Cannon',
    description: 'Miniature black hole driver. Damage +400, Crit +10%',
    rarity: BuffRarity.EPIC,
    slot: 'CANNON_C',
    stats: { damageMod: 400, critMod: 0.1 }
  },
  'oblivion_ray': {
    id: 'oblivion_ray',
    name: 'Oblivion Ray',
    description: 'Ultimate deletion tool. Damage +300%, Energy +50',
    rarity: BuffRarity.LEGENDARY,
    slot: 'CANNON_C',
    stats: { damageMod: 4.0, energyMod: 50, specialType: 'railgun' }
  },

  // --- ARMOR ---
  'basic_hull': {
    id: 'basic_hull',
    name: 'Reinforced Hull',
    description: 'Extra plating. Max Health +30',
    rarity: BuffRarity.COMMON,
    slot: 'ARMOR',
    stats: { healthMod: 30 }
  },
  'nanocarbon_shell': {
    id: 'nanocarbon_shell',
    name: 'Nanocarbon Shell',
    description: 'Lightweight protection. Health +50, Speed +5%',
    rarity: BuffRarity.RARE,
    slot: 'ARMOR',
    stats: { healthMod: 50, speedMod: 1.05 }
  },
  'titan_plate': {
    id: 'titan_plate',
    name: 'Titan Plate',
    description: 'Heavy duty armor. Max Health +150, Speed -5%',
    rarity: BuffRarity.EPIC,
    slot: 'ARMOR',
    stats: { healthMod: 150, speedMod: 0.95 }
  },
  'singularity_core': {
    id: 'singularity_core',
    name: 'Singularity Core',
    description: 'Self-repairing tech. Health +300, Damage +20%',
    rarity: BuffRarity.LEGENDARY,
    slot: 'ARMOR',
    stats: { healthMod: 300, damageMod: 1.2 }
  },

  // --- MOBILITY ---
  'basic_thrusters': {
    id: 'basic_thrusters',
    name: 'Basic Thrusters',
    description: 'Standard propulsion. Speed +10%',
    rarity: BuffRarity.COMMON,
    slot: 'MOBILITY',
    stats: { speedMod: 1.1 }
  },
  'kinetic_boosters': {
    id: 'kinetic_boosters',
    name: 'Kinetic Boosters',
    description: 'Improved thrust. Speed +15%, Energy +30',
    rarity: BuffRarity.RARE,
    slot: 'MOBILITY',
    stats: { speedMod: 1.15, energyMod: 30 }
  },
  'warp_drive': {
    id: 'warp_drive',
    name: 'Warp Drive',
    description: 'Folding engine. Speed +35%, Crit +5%',
    rarity: BuffRarity.EPIC,
    slot: 'MOBILITY',
    stats: { speedMod: 1.35, critMod: 0.05 }
  },
  'chronos_drive': {
    id: 'chronos_drive',
    name: 'Chronos Drive',
    description: 'Time-bending engine. Speed +50%, Energy +100',
    rarity: BuffRarity.LEGENDARY,
    slot: 'MOBILITY',
    stats: { speedMod: 1.5, energyMod: 100 }
  }
};

export function spawnItem(pos: Vector2): Entity | null {
  const rand = Math.random();
  if (rand > 0.25) return null; 
  
  let type: ItemType = ItemType.SCORE;
  let color = '#fbbf24'; 
  
  if (rand < 0.02) { 
    type = ItemType.ARTIFACT;
    color = '#f0abfc'; 
  } else if (rand < 0.08) {
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
