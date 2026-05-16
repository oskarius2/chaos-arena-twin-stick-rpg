import { Vector2 } from './utils/vector';

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
}

export enum ItemType {
  HEALTH = 'HEALTH',
  ENERGY = 'ENERGY',
  SCORE = 'SCORE',
  MULTISHOT = 'MULTISHOT',
  SHIELD = 'SHIELD',
  OVERDRIVE = 'OVERDRIVE',
  BOMB = 'BOMB',
  MAGNET = 'MAGNET',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER',
  RAPID_FIRE = 'RAPID_FIRE',
  TIME_SLOW = 'TIME_SLOW',
  PIERCING = 'PIERCING',
  ARTIFACT = 'ARTIFACT',
  XP = 'XP',
}

export enum EnemyType {
  CHASER = 'CHASER',
  RANGED = 'RANGED',
  TANK = 'TANK',
  BOSS = 'BOSS',
  FAST = 'FAST',
  ELITE = 'ELITE',
  SWARMER = 'SWARMER',
  PHALANX = 'PHALANX',
  WRAITH = 'WRAITH',
  SPLINTER = 'SPLINTER',
  NOVA = 'NOVA',
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  velocity: Vector2;
  color: string;
  damage?: number;
  ownerId?: string;
  itemType?: ItemType;
  enemyType?: EnemyType;
  hitTimer?: number;
  knockback?: Vector2;
  aiTimer?: number;
  lastShot?: number;
  bounceCount?: number;
  life?: number;
  aiState?: 'chase' | 'strafe' | 'retreat' | 'windup' | 'lunge' | 'blink';
  behaviorSeed?: number;
  burnTimer?: number;
  frostTimer?: number;
  damageResist?: number;
}

export interface Particle {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  particleType?: 'dot' | 'spark' | 'ring';
}

export interface Obstacle {
  id: string;
  type: 'RECT' | 'CIRCLE';
  pos: Vector2;
  size: Vector2; // x=width/radius, y=height
  rotation: number;
  color: string;
}

export enum BuffRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  EXCLUSIVE = 'EXCLUSIVE',
}

export interface PassiveBuff {
  id: string;
  name: string;
  description: string;
  stackSummary?: string;
  rarity: BuffRarity;
  icon: string;
  tags?: string[];
  maxStacks?: number;
  exclusive?: boolean;
  wowFactor?: 1 | 2 | 3;
  threatWeight?: number;
}

export type ArtifactSlot = 'CANNON_A' | 'CANNON_B' | 'CANNON_C' | 'ARMOR' | 'MOBILITY';

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: BuffRarity;
  slot: ArtifactSlot;
  stats: {
    damageMod?: number;
    healthMod?: number;
    speedMod?: number;
    energyMod?: number;
    expMod?: number;
    critMod?: number;
    specialType?: string;
  };
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  projectiles: Entity[];
  items: Entity[];
  particles: Particle[];
  obstacles: Obstacle[];
  score: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  survivalTime: number;
  threatLevel: number;
  threatPeak: number;
  augmentCount: number;
  augmentPityExclusive: number;
  runStartTime: number;
  isGameOver: boolean;
  isPaused: boolean;
  wave: number;
  stage: number;
  enemiesToKill: number;
  bossActive: boolean;
  stageTransition: number;
  world: { width: number; height: number };
  camera: Vector2;
  energy: number;
  maxEnergy: number;
  isDashing: boolean;
  dashDirection: Vector2;
  dashDuration: number;
  buffs: {
    shield: number;
    overdrive: number;
    magnet: number;
    scoreX: number;
    rapidFire: number;
    timeSlow: number;
    piercing: number;
  };
  screenshake: number;
  multiShot: number;
  baseDamage: number;
  critChance: number;
  lifeSteal: number;
  regen: number;
  explosiveChance: number;
  bounceCount: number;
  magnetRange: number;
  orbitalCount: number;
  passives: string[]; // List of passive IDs owned
  rapidFireTimer: number;
  shieldTimer: number;
  screenFlash: number;
  hitStop: number;
  damageTexts: DamageText[];
  combo: number;
  comboTimer: number;
  gameMode: 'NORMAL' | 'AIM_TRAINER';
  equippedArtifacts: Record<ArtifactSlot, string | null>;
  activeWeaponSlot: 'CANNON_A' | 'CANNON_B' | 'CANNON_C';
  cardTimer: number;
  permanentOverdrive: boolean;
  permanentTimeSlow: boolean;
  permanentRapidFire: boolean;
  permanentPiercing: boolean;
  hasLighting: boolean;
  hasGravityWell: boolean;
  hasBackshot: boolean;
  hasSpiralShot: boolean;
  burnOnCrit: boolean;
  frostSlowStrength: number;
  thornsDamage: number;
  dashIFrames: boolean;
  dashIFrameTimer: number;
  comboDamageMult: number;
  hasEmergencyShield: boolean;
  emergencyShieldCooldown: number;
  smartRicochet: boolean;
  vampiricBurstStacks: number;
  killCountSinceHeal: number;
  chainCritBonus: number;
  pendingCritBonus: number;
  wideArcStacks: number;
  dashEnergyDiscount: number;
  volatileDeath: boolean;
  hasTimeDilation: boolean;
  timeDilationCooldown: number;
  hunterMarkBonus: number;
  runArtifactUnlocks: number;
  bulletStormMult: number;
  hasVoidRift: boolean;
  voidRiftCooldown: number;
  killSatelliteCounter: number;
  hasInfinityPierce: boolean;
  runArtifactsUnlockedThisRun: string[];
  pickJuiceTimer: number;
  beamFlashes: BeamFlash[];
  nextShotBurns: boolean;
}

export interface DamageText {
  id: string;
  pos: Vector2;
  text: string;
  life: number;
  color: string;
}

export interface BeamFlash {
  id: string;
  origin: Vector2;
  end: Vector2;
  color: string;
  life: number;
  maxLife: number;
}
