import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Play, RotateCcw, Shield, Swords, Zap, Trophy, Target } from 'lucide-react';
import { Joystick } from './game/controls/Joystick';
import { GameHUD } from './game/controls/GameHUD';
import { GearSystem } from './game/controls/GearSystem';
import { BuffCardPicker } from './game/controls/BuffCardPicker';
import { ArtifactUnlockPicker } from './game/controls/ArtifactUnlockPicker';
import { ArtifactInventory } from './game/controls/ArtifactInventory';
import { detectMobileViewport } from './game/controls/mobileLayout';
import { computeThreatLevel } from './game/balance/threat';
import { playSfx, loadSfxMuted, setSfxMuted, setSfxVolume, getSfxVolume, resumeAudio } from './game/audio/sfx';
import { startMusic, stopMusic, duckMusic, loadMusicSettings, setMusicMuted, setMusicVolume, getMusicMuted } from './game/audio/music';
import { computeBeam, createBeamFlash } from './game/combat/beam';
import { applyBeamHit } from './game/combat/beamHit';
import { spawnDamageNumber } from './game/juice/damageNumbers';
import { triggerHitFeedback, shootSfxForSlot, isBossHit } from './game/juice/hitFeedback';
import { getActiveSynergies } from './game/buffs/synergies';
import { SynergyBar } from './game/controls/SynergyBar';
import { RunSummary } from './game/controls/RunSummary';
import { PASSIVE_BUFFS } from './game/content/buffs';
import { BuffRarity } from './game/types';
import { Vector2 } from './game/utils/vector';
import { Artifact, ArtifactSlot, PassiveBuff, EntityType, GameState, ItemType, EnemyType, Entity } from './game/types';
import {
  INITIAL_STATE,
  spawnEnemy,
  updateProjectiles,
  updateEnemies,
  checkCollision,
  createExplosion,
  createImpact,
  updateParticles,
  spawnItem,
  createItemSparkle,
  createImplosion,
  spawnXpOrb,
  resolveObstacleCollision,
  checkProjectileObstacleCollision,
  generateObstaclesForStage,
  appendObstaclesForExpansion,
  pickBuffs,
  ARTIFACTS,
  getCardIntervalSeconds,
} from './game/Logic';
import { applyBuff, hasPermanentOverdrive, hasPermanentPiercing, hasPermanentRapidFire } from './game/buffs/applyBuff';
import { applyHangarLoadout } from './game/runSetup';
import { pickArtifactUnlockChoices } from './game/meta/artifactUnlock';
import { render } from './game/Renderer';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const [uiState, setUiState] = useState<{
    health: number;
    maxHealth: number;
    survivalTime: number;
    threatLevel: number;
    threatPeak: number;
    score: number;
    wave: number;
    stage: number;
    enemiesToKill: number;
    stageTransition: number;
    energy: number;
    maxEnergy: number;
    isGameOver: boolean;
    isPaused: boolean;
    gameMode: 'NORMAL' | 'AIM_TRAINER';
    buffs: {
      shield: number;
      overdrive: number;
      magnet: number;
      scoreX: number;
      rapidFire: number;
      timeSlow: number;
      piercing: number;
    };
    screenFlash?: number; 
    activeWeaponSlot: 'CANNON_A' | 'CANNON_B' | 'CANNON_C';
    equippedArtifacts: Record<ArtifactSlot, string | null>;
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [screen, setScreen] = useState<'MENU' | 'GAME'>('MENU');
  const [isGearOpen, setIsGearOpen] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  
  // Artifact Persistence
  const [unlockedArtifactIds, setUnlockedArtifactIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlockedArtifacts');
    return saved ? JSON.parse(saved) : ['iron_sights', 'backup_cannon', 'basic_hull', 'basic_thrusters'];
  });
  
  const [equippedArtifactIds, setEquippedArtifactIds] = useState<Record<ArtifactSlot, string | null>>(() => {
    const saved = localStorage.getItem('equippedArtifacts');
    if (saved) return JSON.parse(saved);
    return {
      CANNON_A: 'iron_sights',
      CANNON_B: 'backup_cannon',
      CANNON_C: null,
      ARMOR: 'basic_hull',
      MOBILITY: 'basic_thrusters'
    };
  });

  const [artifactUnlockChoices, setArtifactUnlockChoices] = useState<Artifact[]>([]);
  const [showArtifactUnlock, setShowArtifactUnlock] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [newUnlockIds, setNewUnlockIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('unlockedArtifacts', JSON.stringify(unlockedArtifactIds));
  }, [unlockedArtifactIds]);

  useEffect(() => {
    localStorage.setItem('equippedArtifacts', JSON.stringify(equippedArtifactIds));
  }, [equippedArtifactIds]);

  const controls = useRef({
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    isFiring: false,
    wantDash: false,
    mousePos: { x: 0, y: 0 },
    keys: new Set<string>(),
  });

  const lastFireTime = useRef(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentBuffs, setCurrentBuffs] = useState<PassiveBuff[]>([]);

  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const lastAiUpdate = useRef(0);

  useEffect(() => {
    loadSfxMuted();
    loadMusicSettings();
    setSfxMutedState(localStorage.getItem('sfxMuted') === '1');
    setMusicMutedState(localStorage.getItem('musicMuted') === '1');
    setSfxVol(getSfxVolume());
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(detectMobileViewport());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openBuffPicker = (state: GameState) => {
    state.isPaused = true;
    setCurrentBuffs(pickBuffs(state, 3));
    setShowLevelUp(true);
    playSfx('cardFlip');
    duckMusic(0.3);
  };

  const startGame = () => {
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    applyHangarLoadout(initialState, equippedArtifactIds);
    initialState.threatLevel = computeThreatLevel(initialState);
    initialState.threatPeak = initialState.threatLevel;
    initialState.runStartTime = Date.now();
    initialState.runArtifactsUnlockedThisRun = [];
    gameStateRef.current = initialState;
    setNewUnlockIds([]);
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
    resumeAudio();
    if (!musicMuted) startMusic();
  };

  const startAimTrainer = () => {
    const initialState = INITIAL_STATE(dimensions.width, dimensions.height);
    initialState.gameMode = 'AIM_TRAINER';
    initialState.player.maxHealth = 9999;
    initialState.player.health = 9999;
    initialState.enemiesToKill = 9999;
    initialState.stage = 1;
    initialState.enemies = Array.from({ length: 15 }).map(() => ({
      id: Math.random().toString(),
      type: EntityType.ENEMY,
      pos: new Vector2(Math.random() * initialState.world.width, Math.random() * initialState.world.height),
      radius: 12,
      health: 1,
      maxHealth: 1,
      speed: 4,
      velocity: new Vector2(0, 0),
      color: '#facc15',
    }));
    gameStateRef.current = initialState;
    syncUi();
    setScreen('GAME');
    setIsPauseMenuOpen(false);
  };

  const syncUi = () => {
    const state = gameStateRef.current;
    if (!state) return;
    setUiState({
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      survivalTime: state.survivalTime,
      threatLevel: state.threatLevel,
      threatPeak: state.threatPeak,
      score: state.score,
      wave: state.wave,
      stage: state.stage,
      enemiesToKill: state.enemiesToKill,
      stageTransition: state.stageTransition,
      energy: state.energy,
      maxEnergy: state.maxEnergy,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
      gameMode: state.gameMode,
      buffs: { ...state.buffs },
      screenFlash: state.screenFlash,
      cardTimer: state.cardTimer,
      activeWeaponSlot: state.activeWeaponSlot,
      equippedArtifacts: { ...state.equippedArtifacts },
    });

    // Strategy AI Trigger
    const currentTime = Date.now();
    if (currentTime - lastAiUpdate.current > 15000 && screen === 'GAME' && !state.isPaused && !state.isGameOver) {
      lastAiUpdate.current = currentTime;
      import('./services/geminiService').then(({ getTacticalCommentary }) => {
        getTacticalCommentary({
          score: state.score,
          health: Math.floor((state.player.health / state.player.maxHealth) * 100),
          equips: (Object.values(state.equippedArtifacts).filter(id => !!id) as string[]).map(id => ARTIFACTS[id]?.name || "Standard"),
          enemiesDefeated: Math.floor(state.score / 100)
        }).then(msg => {
          if (msg) {
            setAiCommentary(msg);
            setTimeout(() => setAiCommentary(null), 5000);
          }
        });
      });
    }
  };

  const handleLevelUpChoice = (choiceId: string) => {
    const next = gameStateRef.current;
    if (!next) return;
    applyBuff(next, choiceId);
    const def = PASSIVE_BUFFS[choiceId];
    if (def?.exclusive || def?.rarity === BuffRarity.EXCLUSIVE) playSfx('exclusive');
    else playSfx('augment');
    setShowLevelUp(false);
    next.isPaused = false;
    controls.current.isFiring = false;
    duckMusic(1);
    syncUi();
  };

  const handleArtifactUnlockChoice = (artifactId: string) => {
    if (!unlockedArtifactIds.includes(artifactId)) {
      setUnlockedArtifactIds((prev) => [...prev, artifactId]);
      setNewUnlockIds((prev) => [...prev, artifactId]);
    }
    const next = gameStateRef.current;
    if (next) {
      next.runArtifactUnlocks += 1;
      if (!next.runArtifactsUnlockedThisRun.includes(artifactId)) {
        next.runArtifactsUnlockedThisRun.push(artifactId);
      }
      next.isPaused = false;
      playSfx('artifact');
    }
    setShowArtifactUnlock(false);
    setArtifactUnlockChoices([]);
    syncUi();
  };

  const togglePause = () => {
    const next = gameStateRef.current;
    if (!next) return;
    next.isPaused = !next.isPaused;
    if (next.isPaused) controls.current.isFiring = false;
    setIsPauseMenuOpen(next.isPaused);
    duckMusic(next.isPaused ? 0.3 : 1);
    syncUi();
  };

  useEffect(() => {
    const duck = showLevelUp || showArtifactUnlock || isPauseMenuOpen;
    duckMusic(duck ? 0.3 : 1);
  }, [showLevelUp, showArtifactUnlock, isPauseMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      controls.current.keys.add(e.key.toLowerCase());
      if (e.key === ' ') controls.current.wantDash = true;
      if (e.key === 'p' || e.key === 'Escape') togglePause();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      controls.current.keys.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      controls.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent firing when clicking on buttons or interactive UI
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        controls.current.isFiring = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) controls.current.isFiring = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'GAME' || !gameStateRef.current) return;

    let animId: number;
    let lastUiSync = 0;
    let lastTime = performance.now();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const loop = (currentTime: number) => {
      const next = gameStateRef.current;
      
      // Calculate delta time
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // dt is normalized to 60fps (16.67ms per frame)
      const dt = Math.min(deltaTime / 16.67, 4); 

      if (!next || next.isPaused || showLevelUp || showArtifactUnlock) {
        if (next) render(ctx, next, dimensions.width, dimensions.height);
        animId = requestAnimationFrame(loop);
        return;
      }

      if (next.isGameOver) {
        // Only update particles for death explosion
        next.particles = updateParticles(next.particles, dt);
        if (next.screenshake > 0) next.screenshake *= Math.pow(0.9, dt);
        render(ctx, next, dimensions.width, dimensions.height);
        animId = requestAnimationFrame(loop);
        return;
      }

      // Hit-Stop logic: Reduced accumulation to prevent "perm-freeze" in heavy combat
      if (next.hitStop > 0) {
        next.hitStop -= dt;
        render(ctx, next, dimensions.width, dimensions.height);
        animId = requestAnimationFrame(loop);
        return;
      }

      const { player } = next;

      // Unify Spatial Partitioning (Grid) - Build once per frame
      const grid = new Map<string, Entity[]>();
      const cellSize = 150;
      for (let i = 0; i < next.enemies.length; i++) {
        const e = next.enemies[i];
        const gx = Math.floor(e.pos.x / cellSize);
        const gy = Math.floor(e.pos.y / cellSize);
        const key = `${gx},${gy}`;
        let cell = grid.get(key);
        if (!cell) {
          cell = [];
          grid.set(key, cell);
        }
        cell.push(e);
      }

      // Update Hit Timers
      if (player.hitTimer && player.hitTimer > 0) player.hitTimer -= dt;
      next.enemies.forEach(e => {
        if (e.hitTimer && e.hitTimer > 0) e.hitTimer -= dt;
      });

      // Update Damage Texts
      next.damageTexts = next.damageTexts.filter(dtxt => {
        dtxt.life -= 0.02 * dt;
        dtxt.pos.y -= 0.5 * dt;
        return dtxt.life > 0;
      });

      // Energy Regen
      if (!next.isDashing && next.energy < next.maxEnergy) {
        next.energy = Math.min(next.maxEnergy, next.energy + 0.3 * dt);
      }

      if (next.gameMode === 'NORMAL' && !next.isPaused) {
        next.survivalTime += dt * (16.67 / 1000);
        next.threatLevel = computeThreatLevel(next);
        next.threatPeak = Math.max(next.threatPeak, next.threatLevel);
      }

      if (next.pickJuiceTimer > 0) next.pickJuiceTimer -= dt;

      if (next.hasVoidRift) {
        next.voidRiftCooldown -= dt * (16.67 / 1000);
        if (next.voidRiftCooldown <= 0) {
          next.voidRiftCooldown = 720;
          const pulseR = 220;
          next.enemies.forEach((e) => {
            if (e.pos.distanceTo(player.pos) < pulseR) {
              const pull = player.pos.sub(e.pos).normalize().mul(35);
              e.pos = e.pos.add(pull);
              e.health -= 25 + next.threatLevel * 0.3;
              e.hitTimer = 5;
            }
          });
          next.particles.push(...createExplosion(player.pos, '#22d3ee', 25, 1.5));
          next.screenFlash = Math.max(next.screenFlash, 8);
        }
      }

      // Card Timer Logic
      next.cardTimer -= dt * (16.67 / 1000); // Decr in seconds
      if (next.cardTimer <= 0) {
        next.cardTimer = getCardIntervalSeconds(next.stage);
        openBuffPicker(next);
        next.particles.push(...createExplosion(player.pos, '#60a5fa', 80));
        next.screenshake = 25;
        syncUi();
      }

      if (next.dashIFrameTimer > 0) next.dashIFrameTimer -= dt;

      if (next.hasTimeDilation) {
        next.timeDilationCooldown -= dt * (16.67 / 1000);
        if (next.timeDilationCooldown <= 0) {
          next.buffs.timeSlow = Math.max(next.buffs.timeSlow, 360);
          next.timeDilationCooldown = 2400;
        }
      }

      if (next.hasEmergencyShield && player.health / player.maxHealth < 0.3) {
        next.emergencyShieldCooldown -= dt * (16.67 / 1000);
        if (next.emergencyShieldCooldown <= 0) {
          next.buffs.shield = Math.max(next.buffs.shield, 240);
          next.emergencyShieldCooldown = 2700;
        }
      }

      // Buffs decay (skip permanents)
      if (next.buffs.shield > 0) next.buffs.shield -= dt;
      if (!next.permanentOverdrive && next.buffs.overdrive > 0) next.buffs.overdrive -= dt;
      if (next.buffs.magnet > 0) next.buffs.magnet -= dt;
      if (next.buffs.scoreX > 0) next.buffs.scoreX -= dt;
      if (!next.permanentRapidFire && next.buffs.rapidFire > 0) next.buffs.rapidFire -= dt;
      if (!next.permanentTimeSlow && next.buffs.timeSlow > 0) next.buffs.timeSlow -= dt;
      if (!next.permanentPiercing && next.buffs.piercing > 0) next.buffs.piercing -= dt;
      
      if (next.comboTimer > 0) {
        next.comboTimer -= dt * (16.67 / 1000);
        if (next.comboTimer <= 0) next.combo = 0;
      }

      if (next.screenFlash > 0) next.screenFlash -= dt;
      
      // Passive Magnet Effect
      const effectiveMagnetRange = next.buffs.magnet > 0 ? 800 : next.magnetRange;

      // Passive Regen
      if (next.regen > 0 && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + (next.regen / 60) * dt);
      }

      // Passive Shield Charge
      if (next.passives.includes('shield_up')) {
        next.shieldTimer += dt;
        if (next.shieldTimer >= 1200) { // Every 20 seconds
          next.shieldTimer = 0;
          next.buffs.shield = Math.max(next.buffs.shield, 300); // 5 sec shield
        }
      }

      // Passive Health Regen (very slow - base)
      if (player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + 0.01 * dt);
      }

      // Process Input: Keyboard takes priority over Joystick
      let kx = 0;
      let ky = 0;
      if (controls.current.keys.has('w')) ky -= 1;
      if (controls.current.keys.has('s')) ky += 1;
      if (controls.current.keys.has('a')) kx -= 1;
      if (controls.current.keys.has('d')) kx += 1;

      // Weapon Switch
      if (controls.current.keys.has('q')) {
        const slots: ('CANNON_A' | 'CANNON_B' | 'CANNON_C')[] = ['CANNON_A', 'CANNON_B', 'CANNON_C'];
        const currentIdx = slots.indexOf(next.activeWeaponSlot);
        next.activeWeaponSlot = slots[(currentIdx + 1) % slots.length];
        controls.current.keys.delete('q'); // One-shot
        syncUi();
      }
      if (controls.current.keys.has('1')) { next.activeWeaponSlot = 'CANNON_A'; syncUi(); }
      if (controls.current.keys.has('2')) { next.activeWeaponSlot = 'CANNON_B'; syncUi(); }
      if (controls.current.keys.has('3')) { next.activeWeaponSlot = 'CANNON_C'; syncUi(); }

      let moveDir: Vector2;
      if (kx !== 0 || ky !== 0) {
        moveDir = new Vector2(kx, ky).normalize();
      } else {
        moveDir = new Vector2(controls.current.move.x, controls.current.move.y);
      }
      
      // Calculate Aim: Joystick takes priority for aiming if actively moved
      let aimDir: Vector2;
      if (controls.current.aim.x !== 0 || controls.current.aim.y !== 0) {
        aimDir = new Vector2(controls.current.aim.x, controls.current.aim.y);
      } else {
        const playerScreenX = player.pos.x - next.camera.x;
        const playerScreenY = player.pos.y - next.camera.y;
        aimDir = new Vector2(
          controls.current.mousePos.x - playerScreenX,
          controls.current.mousePos.y - playerScreenY
        );
        if (aimDir.magnitude() < 5) aimDir = new Vector2(1, 0); // Default if mouse is on player
        else aimDir = aimDir.normalize();
      }
      
      // Dash Initiation
      const dashCost = Math.max(12, 30 - next.dashEnergyDiscount);
      if (controls.current.wantDash && next.energy >= dashCost && !next.isDashing) {
        next.isDashing = true;
        next.dashDuration = 10;
        next.energy -= dashCost;
        if (next.dashIFrames) next.dashIFrameTimer = 18;
        controls.current.wantDash = false;
        
        // Fix: Better direction capturing
        if (moveDir.magnitude() > 0.05) {
          next.dashDirection = moveDir.normalize();
        } else if (aimDir.magnitude() > 0.05) {
          next.dashDirection = aimDir.normalize();
        } else {
          // Dash in the direction the ship is currently "facing" (velocity)
          const angle = Math.atan2(player.velocity.y, player.velocity.x);
          next.dashDirection = player.velocity.magnitude() > 0.1 ? player.velocity.normalize() : new Vector2(1, 0);
        }

        next.particles.push(...createExplosion(player.pos, '#ffffff', 15));
        next.screenshake = 10;
      }

      // Apply Movement
      let currentVelocity = moveDir.mul(player.speed * dt);
      
      if (next.isDashing) {
        currentVelocity = next.dashDirection.mul(player.speed * 4 * dt);
        next.dashDuration -= dt;
        if (next.dashDuration <= 0) next.isDashing = false;
        
        if (Math.random() > 0.4) {
          next.particles.push({
            id: Math.random().toString(),
            pos: player.pos.clone(),
            velocity: next.dashDirection.mul(-1),
            life: 0.4,
            maxLife: 0.4,
            color: 'rgba(255,255,255,0.4)',
            size: 5
          });
        }
      }

      player.velocity = currentVelocity;
      player.pos = player.pos.add(player.velocity);
      resolveObstacleCollision(player, next.obstacles);
      player.pos.x = Math.max(player.radius, Math.min(next.world.width - player.radius, player.pos.x));
      player.pos.y = Math.max(player.radius, Math.min(next.world.height - player.radius, player.pos.y));
      
      const fireIntervalBase = 150; // Super rapid fire base
      let fireInterval = hasPermanentOverdrive(next) ? fireIntervalBase * 0.4 : fireIntervalBase;
      if (next.buffs.overdrive > 0 && !next.permanentOverdrive) fireInterval *= 0.4;
      
      // Weapon-specific fire rates
      if (next.activeWeaponSlot === 'CANNON_B') fireInterval *= 2.5; // Rockets are slower
      if (next.activeWeaponSlot === 'CANNON_C') fireInterval = 4000; // Railgun/Laser is very slow (4s cooldown)
      
      if (hasPermanentRapidFire(next) || next.buffs.rapidFire > 0) fireInterval *= 0.4;
      if (next.bulletStormMult > 1) fireInterval /= next.bulletStormMult;
      
      if (controls.current.isFiring && currentTime - lastFireTime.current > fireInterval) {
        lastFireTime.current = currentTime;
        
        let numProjectiles = next.multiShot || 1;
        const spread = Math.min(Math.PI / 4, 0.1 * numProjectiles); // Dynamic spread
        
          const totalCritChance = (next.critChance || 0.15) + next.pendingCritBonus;

        // Weapon damage modifier
        let weaponDmgMod = 1;
        const activeArtId = next.equippedArtifacts[next.activeWeaponSlot];
        if (activeArtId && ARTIFACTS[activeArtId]) {
          const art = ARTIFACTS[activeArtId];
          if (art.stats.damageMod) weaponDmgMod = art.stats.damageMod;
        }

        // Special Tuning per Slot
        let projectileSpeed = 10;
        let pRadius = 5;
        let pColor = '#fef08a';
        let pPiercing = next.bounceCount;
        if (hasPermanentPiercing(next) || next.hasInfinityPierce) pPiercing += 1000;

        if (next.activeWeaponSlot === 'CANNON_B') {
          projectileSpeed = 7;
          pRadius = 10;
          pColor = '#fbbf24';
          // Rockets are inherently more powerful per shot
          weaponDmgMod *= 2.0; 
        } else if (next.activeWeaponSlot === 'CANNON_C') {
          pColor = '#00f2ff';
          numProjectiles = 1;
          weaponDmgMod *= 3.5;
          next.screenshake = 10;
        }

        // Tesla Procs - Optimized (no dt in Math.random for consistency)
        if ((next.hasLighting || next.passives.includes('lighting') || next.passives.includes('chain_god')) && Math.random() < 0.08) {
          const nearest = next.enemies[Math.floor(Math.random() * next.enemies.length)];
          if (nearest && nearest.pos.distanceTo(player.pos) < 400) {
            nearest.health -= 50;
            next.particles.push(...createImpact(nearest.pos, '#60a5fa', 5));
            if (next.passives.includes('chain_god')) {
              let chains = 0;
              for (const other of next.enemies) {
                if (chains >= 2) break;
                if (other.id !== nearest.id && other.health > 0 && other.pos.distanceTo(nearest.pos) < 180) {
                  other.health -= 40;
                  next.particles.push(...createImpact(other.pos, '#38bdf8', 4));
                  chains++;
                }
              }
            }
          }
        }

        for (let i = 0; i < numProjectiles; i++) {
          let finalAngle = Math.atan2(aimDir.y, aimDir.x);
          if (numProjectiles > 1) {
            finalAngle += ((i / (numProjectiles - 1)) - 0.5) * spread;
          }
          
          const velX = Math.cos(finalAngle) * projectileSpeed;
          const velY = Math.sin(finalAngle) * projectileSpeed;
          
          const isCrit = Math.random() < totalCritChance;
          const damageMult = isCrit ? 2.5 : 1;
          
          let baseDmg = next.baseDamage;
          if (weaponDmgMod > 5) baseDmg += weaponDmgMod;
          else baseDmg *= weaponDmgMod;

          const finalDamage = Math.floor(baseDmg * damageMult);

          // For Cannon C, we spawn multiple projectiles in a line to simulate a beam
          if (next.activeWeaponSlot === 'CANNON_C') {
             for (let b = 0; b < 25; b++) {
               const beamPos = player.pos.add(new Vector2(Math.cos(finalAngle), Math.sin(finalAngle)).mul(b * 35));
               next.projectiles.push({
                id: Math.random().toString(),
                type: EntityType.PROJECTILE,
                pos: beamPos,
                radius: pRadius,
                health: 1,
                maxHealth: 1,
                speed: projectileSpeed,
                velocity: new Vector2(velX, velY).mul(0.1), // Slow moving part of the static beam beam
                color: pColor,
                ownerId: 'player',
                damage: finalDamage,
                bounceCount: pPiercing,
                life: 0.15, // Short flash
              });
             }
          } else {
            next.projectiles.push({
              id: Math.random().toString(),
              type: EntityType.PROJECTILE,
              pos: player.pos.clone(),
              radius: isCrit ? pRadius * 1.5 : pRadius,
              health: 1,
              maxHealth: 1,
              speed: projectileSpeed,
              velocity: new Vector2(velX, velY),
              color: isCrit ? '#fca5a5' : pColor,
              ownerId: 'player',
              damage: finalDamage,
              bounceCount: pPiercing, 
              itemType: next.activeWeaponSlot === 'CANNON_B' ? ItemType.BOMB : undefined
            });
          }
        }
        
        const muzzlePos = player.pos.add(aimDir.normalize().mul(player.radius));
        if (next.activeWeaponSlot === 'CANNON_C') {
          next.particles.push(...createExplosion(muzzlePos, '#60a5fa', 15, 2));
          next.screenshake = 10;
        } else {
          next.particles.push(...createExplosion(muzzlePos, pColor, 2));
          next.screenshake = Math.min(next.screenshake + 1, 5);
        }

        if (next.hasBackshot) {
          const backAngle = Math.atan2(-aimDir.y, -aimDir.x);
          const bvx = Math.cos(backAngle) * projectileSpeed;
          const bvy = Math.sin(backAngle) * projectileSpeed;
          next.projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            pos: player.pos.clone(),
            radius: pRadius * 0.8,
            health: 1,
            maxHealth: 1,
            speed: projectileSpeed,
            velocity: new Vector2(bvx, bvy),
            color: pColor,
            ownerId: 'player',
            damage: Math.floor(next.baseDamage * 0.7),
            bounceCount: pPiercing,
          });
        }
      }

      // Orbitals Logic
      if (next.orbitalCount > 0) {
        const orbitRadius = 100;
        const orbitSpeed = 0.05;
        for (let i = 0; i < next.orbitalCount; i++) {
          const angle = (currentTime * orbitSpeed + (i * 2 * Math.PI) / next.orbitalCount);
          const orbitX = player.pos.x + Math.cos(angle) * orbitRadius;
          const orbitY = player.pos.y + Math.sin(angle) * orbitRadius;
          const orbitPos = new Vector2(orbitX, orbitY);
          
          // Debug/Visual only in renderer, but check collision here
          next.enemies.forEach(e => {
            if (e.pos.distanceTo(orbitPos) < 25) {
              e.health -= 2 * dt;
              e.hitTimer = 3;
              if (Math.random() < 0.1) next.particles.push(...createImpact(e.pos, '#8b5cf6', 1));
            }
          });
        }
      }

      next.projectiles = updateProjectiles(next.projectiles, next.world.width, next.world.height, dt, next.bounceCount);
      updateEnemies(next, dt);
      next.particles = updateParticles(next.particles, dt);

      // Stage Transition Logic
      if (next.gameMode === 'NORMAL') {
        if (next.stageTransition > 0) {
          next.stageTransition -= dt;
          if (next.stageTransition <= 0) {
            // Advance Stage
          next.stage++;
          next.cardTimer = getCardIntervalSeconds(next.stage);
          next.enemiesToKill = 150 + 100 * next.stage;
          next.bossActive = false;
          next.enemies = [];
          next.projectiles = [];
          next.items = [];
          const expand = 3200;
          const prevW = next.world.width;
          const prevH = next.world.height;
          next.world.width += expand;
          next.world.height += expand;
          const newObs = appendObstaclesForExpansion(next.stage, prevW, prevH, expand, expand, player.pos);
          next.obstacles = [...next.obstacles, ...newObs];
          next.player.health = Math.min(
            next.player.maxHealth,
            player.health + next.player.maxHealth * 0.3
          );
          next.screenFlash = 20;
          openBuffPicker(next);
          playSfx('augment');
        }
      }
      }

      // Spawning logic
      if (next.gameMode === 'AIM_TRAINER') {
        if (next.enemies.length < 15) {
          next.enemies.push({
            id: Math.random().toString(),
            type: EntityType.ENEMY,
            pos: new Vector2(Math.random() * next.world.width, Math.random() * next.world.height),
            radius: 12,
            health: 1,
            maxHealth: 1,
            speed: 4,
            velocity: new Vector2(0, 0),
            color: '#facc15',
          });
        }
      } else if (next.stageTransition <= 0) {
        // We only spawn if we haven't reached max enemies and we aren't waiting for the boss to spawn
        const maxEnemies = Math.min(500, 50 + next.stage * 40 + (next.score / 1500));
        const spawnChance = Math.min(0.25, 0.12 + (next.stage * 0.03));
        
        if (!next.bossActive && next.enemiesToKill > next.enemies.length && next.enemies.length < maxEnemies && Math.random() < spawnChance) {
          next.enemies.push(spawnEnemy(next));
          if (next.threatLevel >= 70 && Math.random() < 0.1) {
            for (let h = 0; h < 3; h++) next.enemies.push(spawnEnemy(next, 9));
          }
        } else if (next.bossActive && next.enemies.filter(e => e.enemyType === EnemyType.BOSS).length === 0) {
          // Spawn the boss
          next.enemies.push(spawnEnemy(next));
        } else if (next.bossActive && next.enemies.length < maxEnemies && Math.random() < spawnChance * 0.5) {
          // Add extra adds during boss fight
          next.enemies.push(spawnEnemy(next));
        }
      }

      // Camera follow
      const targetCamX = player.pos.x - dimensions.width / 2;
      const targetCamY = player.pos.y - dimensions.height / 2;
      next.camera.x += (targetCamX - next.camera.x) * 0.4 * dt;
      next.camera.y += (targetCamY - next.camera.y) * 0.4 * dt;
      next.camera.x = Math.max(0, Math.min(next.world.width - dimensions.width, next.camera.x));
      next.camera.y = Math.max(0, Math.min(next.world.height - dimensions.height, next.camera.y));

      // Collision
      for (let i = next.projectiles.length - 1; i >= 0; i--) {
        const p = next.projectiles[i];

        // vs Obstacles
        let hitObs = false;
        for (const obs of next.obstacles) {
          if (checkProjectileObstacleCollision(p, obs)) {
            hitObs = true;
            next.particles.push(...createImpact(p.pos, p.color, 2));
            break;
          }
        }
        if (hitObs) {
          p.health = 0;
          continue;
        }

        // Enemy projectiles vs Player
        if (p.ownerId !== 'player') {
          if (checkCollision(p, player)) {
            if (next.buffs.shield <= 0) {
              player.health -= (p.damage || 10);
              player.hitTimer = 3;
              next.screenshake = Math.min(next.screenshake + 5, 12);
              next.particles.push(...createImpact(player.pos, '#ffffff', 5));
              
              if (player.health <= 0) {
                next.isGameOver = true;
                next.particles.push(...createExplosion(player.pos, player.color, 50));
                next.particles.push(...createExplosion(player.pos, '#ffffff', 20));
                next.screenshake = 20;
                syncUi();
              }
            } else {
              // Shield absorbed
              next.particles.push(...createExplosion(p.pos, '#34d399', 3));
            }
            p.health = 0;
            continue;
          }
        }

        // Player projectiles vs Enemies
        if (p.ownerId === 'player') {
          const gx = Math.floor(p.pos.x / 150);
          const gy = Math.floor(p.pos.y / 150);
          
          let collided = false;
          // Check bullet cell and 8 neighbors
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const key = `${gx + ox},${gy + oy}`;
              const cellEnemies = grid.get(key);
              if (!cellEnemies) continue;

              for (let j = cellEnemies.length - 1; j >= 0; j--) {
                const e = cellEnemies[j];
                if (checkCollision(p, e)) {
                  let critRoll = (next.critChance || 0) + next.pendingCritBonus;
                  const isCrit = Math.random() < critRoll;
                  next.pendingCritBonus = isCrit ? Math.min(0.35, next.chainCritBonus) : 0;
                  let damage = (p.damage || 10) * (isCrit ? 2.5 : 1);
                  if (e.damageResist && e.damageResist > 0) damage *= 1 - e.damageResist;
                  if (e.health < e.maxHealth * 0.5 && next.hunterMarkBonus > 0) {
                    damage *= 1 + next.hunterMarkBonus;
                  }
                  if (next.frostSlowStrength > 0) {
                    e.frostTimer = Math.max(e.frostTimer || 0, 45 * next.frostSlowStrength);
                  }
                  
                  e.health -= damage;
                  e.hitTimer = 3; 

                  // Lifesteal
                  if (next.lifeSteal > 0 && e.health <= 0) {
                    player.health = Math.min(player.maxHealth, player.health + e.maxHealth * next.lifeSteal);
                  }

                  // Explosive Rounds & Cannon B Rockets
                  const isRocket = p.itemType === ItemType.BOMB;
                  if (isRocket || (next.explosiveChance > 0 && Math.random() < next.explosiveChance)) {
                    next.particles.push(...createExplosion(e.pos, isRocket ? '#fbbf24' : '#facc15', 20, 1.5));
                    // Hit nearby enemies - Optimized with Grid
                    const explosionRadius = isRocket ? 150 : 100;
                    const egx = Math.floor(e.pos.x / cellSize);
                    const egy = Math.floor(e.pos.y / cellSize);
                    
                    const explosionDamage = isRocket ? damage * 1.5 : damage * 0.5;
                    
                    for (let ox = -1; ox <= 1; ox++) {
                      for (let oy = -1; oy <= 1; oy++) {
                        const cell = grid.get(`${egx + ox},${egy + oy}`);
                        if (cell) {
                          cell.forEach(other => {
                            if (other !== e && other.pos.distanceTo(e.pos) < explosionRadius) {
                              other.health -= explosionDamage;
                              other.hitTimer = 3;
                            }
                          });
                        }
                      }
                    }
                  }
                  
                  // Gravity Well
                  if (next.passives.includes('gravity_well') && Math.random() < 0.1) {
                    const pullRadius = 180;
                    const pgx = Math.floor(e.pos.x / cellSize);
                    const pgy = Math.floor(e.pos.y / cellSize);

                    for (let ox = -2; ox <= 2; ox++) {
                      for (let oy = -2; oy <= 2; oy++) {
                        const cell = grid.get(`${pgx + ox},${pgy + oy}`);
                        if (cell) {
                          cell.forEach(other => {
                            if (other !== e && other.pos.distanceTo(e.pos) < pullRadius) {
                              const pullDir = e.pos.sub(other.pos).normalize();
                              other.pos = other.pos.add(pullDir.mul(25 * dt));
                            }
                          });
                        }
                      }
                    }
                  }
                  
                  if ((p.bounceCount || 0) > 0 && p.health > 0 && !isCrit && !hasPermanentPiercing(next) && !next.hasInfinityPierce && next.buffs.piercing <= 0) {
                    // Ricochet logic: find another nearby enemy
                    const bounceRadius = 300;
                    let nearestOther: Entity | null = null;
                    let minDist = bounceRadius;
                    
                    next.enemies.forEach(other => {
                      if (other.id === e.id || other.health <= 0) return;
                      const d = other.pos.distanceTo(e.pos);
                      if (d < minDist) {
                        minDist = d;
                        nearestOther = other;
                      }
                    });

                    if (nearestOther) {
                      const newDir = (nearestOther as Entity).pos.sub(e.pos).normalize();
                      const speed = p.velocity.magnitude();
                      p.velocity = newDir.mul(speed);
                      p.damage = (p.damage || 10) * 0.7; // Damage falls off
                      p.bounceCount = (p.bounceCount || 0) - 1; 
                    } else {
                      p.health = 0;
                    }
                  } else if (!isCrit && !hasPermanentPiercing(next) && !next.hasInfinityPierce && next.buffs.piercing <= 0) {
                    p.health = 0;
                  } else if (hasPermanentPiercing(next) || next.hasInfinityPierce || next.buffs.piercing > 0) {
                    p.damage = (p.damage || 10) * 0.8;
                    if ((p.damage || 0) < 5) p.health = 0;
                  } else if (isCrit) {
                    p.health = 0;
                  }
                  
                  if (isCrit) {
                    next.hitStop = Math.min(next.hitStop + 1.5, 5); // Capped hitStop accumulation
                  } else if (e.enemyType === EnemyType.BOSS) {
                    next.hitStop = Math.min(next.hitStop + 0.8, 3);
                  }
                  
                  const kbForce = Math.min((damage / e.maxHealth) * 30 + 2, 10);
                  const pNorm = p.velocity.normalize();
                  e.knockback = new Vector2(pNorm.x * kbForce, pNorm.y * kbForce);
                  
                  if (isCrit) {
                    next.screenshake = Math.min(next.screenshake + 5, 20);
                    next.particles.push(...createExplosion(e.pos, '#ffffff', 5, 2));
                  } else {
                    next.screenshake = Math.min(next.screenshake + 1.5, 10);
                  }

                  // Optimization: Throttle visual feedback when chaos is high
                  const chaosFactor = Math.max(1, next.enemies.length / 50);
                  const shouldSpawnText = Math.random() > (1 - 1/chaosFactor);
                  
                  if (shouldSpawnText) {
                    next.damageTexts.push({
                      id: Math.random().toString(),
                      pos: e.pos.clone(),
                      text: (isCrit ? 'CRIT! ' : '') + damage.toString(),
                      life: 0.8, // Shorter life for performance
                      color: isCrit ? '#fde047' : (e.health <= 0 ? '#ef4444' : '#ffffff')
                    });
                  }

                  if (Math.random() > (1 - 0.5/chaosFactor)) {
                    next.particles.push(...createImpact(p.pos, p.color || '#ffffff', isCrit ? 6 : 3));
                  }

                  if (e.health <= 0) {
                    next.combo++;
                    next.comboTimer = 1.5;
                    const scoreGain = 100 * (next.buffs.scoreX > 0 ? 2 : 1) * Math.min(10, next.combo) * next.comboDamageMult;
                    next.score += scoreGain;
                    next.killCountSinceHeal += 1;
                    if (next.passives.includes('kill_satellite')) {
                      next.killSatelliteCounter += 1;
                      if (next.killSatelliteCounter >= 8) {
                        next.killSatelliteCounter = 0;
                        const pulseDmg = 30 + next.threatLevel * 0.5;
                        next.enemies.forEach((oe) => {
                          if (oe.health > 0) oe.health -= pulseDmg;
                        });
                        next.particles.push(...createExplosion(player.pos, '#f472b6', 40, 2));
                        next.screenshake = Math.min(next.screenshake + 12, 25);
                      }
                    }
                    if (next.vampiricBurstStacks > 0 && next.killCountSinceHeal >= 20) {
                      next.killCountSinceHeal = 0;
                      player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.25 * next.vampiricBurstStacks);
                    }
                    if (next.volatileDeath) {
                      next.particles.push(...createExplosion(e.pos, e.color, 15, 1.2));
                      const vgx = Math.floor(e.pos.x / 150);
                      const vgy = Math.floor(e.pos.y / 150);
                      for (let ox = -1; ox <= 1; ox++) {
                        for (let oy = -1; oy <= 1; oy++) {
                          const cell = grid.get(`${vgx + ox},${vgy + oy}`);
                          if (cell) {
                            cell.forEach((other) => {
                              if (other !== e && other.pos.distanceTo(e.pos) < 90) {
                                other.health -= 40;
                              }
                            });
                          }
                        }
                      }
                    }
                    
                    // Throttle death explosions
                    const explCount = e.enemyType === EnemyType.BOSS ? 100 : (20 / chaosFactor);
                    next.particles.push(...createExplosion(e.pos, e.color, Math.max(5, explCount), 1.5));
                    
                    // Reduced screenshake in high chaos
                    const shakeMult = 1 / Math.sqrt(chaosFactor);
                    next.screenshake = Math.min(next.screenshake + (e.enemyType === EnemyType.BOSS ? 20 : 8) * shakeMult, 25);
                    
                    if (e.enemyType !== EnemyType.BOSS) {
                      next.screenFlash = Math.max(next.screenFlash, 2);
                    }
                    
                    const item = spawnItem(e.pos);
                    if (item) next.items.push(item);
                    
                    // Special death behaviors
                    if (e.enemyType === EnemyType.SPLINTER) {
                      for (let s = 0; s < 3; s++) {
                        const angle = (s / 3) * Math.PI * 2;
                        const offset = new Vector2(Math.cos(angle) * 30, Math.sin(angle) * 30);
                        next.enemies.push({
                          id: Math.random().toString(),
                          type: EntityType.ENEMY,
                          pos: e.pos.add(offset),
                          radius: 10,
                          health: 30 * (1 + next.stage * 0.2),
                          maxHealth: 30 * (1 + next.stage * 0.2),
                          speed: (3 + Math.random()) * (1 + next.stage * 0.05),
                          velocity: new Vector2(0, 0),
                          color: '#fb923c',
                          damage: 15 + next.stage * 3,
                          enemyType: EnemyType.SWARMER,
                        });
                      }
                    } else if (e.enemyType === EnemyType.NOVA) {
                      next.particles.push(...createExplosion(e.pos, '#f97316', 40, 2.5));
                      if (player.pos.distanceTo(e.pos) < 200) {
                        if (next.buffs.shield <= 0) {
                           player.health -= 35;
                           next.screenshake = Math.max(next.screenshake, 20);
                        }
                      }
                    }
                    
                    if (e.type === EntityType.ENEMY) {
                      if (e.enemyType === EnemyType.BOSS) {
                        next.bossActive = false;
                        next.stageTransition = 300; 
                        next.hitStop = 15; 
                        next.particles.push(...createExplosion(e.pos, '#fbbf24', 100, 3));
                        next.screenshake = 40;
                        next.screenFlash = 25; 
                        
                        if (next.runArtifactUnlocks < 2) {
                          const choices = pickArtifactUnlockChoices(unlockedArtifactIds, 2);
                          if (choices.length > 0) {
                            setArtifactUnlockChoices(choices);
                            setShowArtifactUnlock(true);
                            next.isPaused = true;
                          }
                        }

                        // Health / energy drops
                        const basicDrops = [ItemType.HEALTH, ItemType.ENERGY, ItemType.BOMB];
                        basicDrops.forEach(dt => {
                          const itm = spawnItem(e.pos);
                          if (itm) {
                            next.items.push({
                              ...itm,
                              itemType: dt,
                              pos: new Vector2(e.pos.x + (Math.random()-0.5)*200, e.pos.y + (Math.random()-0.5)*200)
                            });
                          }
                        });
                      } else if (!next.bossActive && next.enemiesToKill > 0 && next.gameMode === 'NORMAL') {
                        next.enemiesToKill--;
                        if (next.enemiesToKill <= 0) {
                          next.bossActive = true;
                          next.screenshake = 10;
                        }
                      }
                    }
                  }
                  collided = true;
                  break;
                }
              }
              if (collided) break;
            }
            if (collided) break;
          }
        }
      }

      next.enemies = next.enemies.filter(e => e.health > 0);
      next.projectiles = next.projectiles.filter(p => p.health > 0);

      // Item Collection
      next.items = next.items.filter(item => {
        // Magnet effect
        const d = player.pos.sub(item.pos);
        const dist = d.magnitude();
        if (dist < effectiveMagnetRange) {
          const mult = next.buffs.magnet > 0 ? 12 : 6;
          item.pos = item.pos.add(d.normalize().mul(mult * dt));
        }

        if (checkCollision(player, item)) {
          if (item.itemType === ItemType.HEALTH) {
            player.health = Math.min(player.maxHealth, player.health + 100);
          } else if (item.itemType === ItemType.ENERGY) {
            next.energy = next.maxEnergy;
          } else if (item.itemType === ItemType.BOMB) {
            next.enemies.forEach(e => {
              e.health = 0;
              next.particles.push(...createExplosion(e.pos, e.color, 12, 1.2));
            });
            next.screenshake = 30;
            next.screenFlash = 15;
            next.damageTexts.push({
              id: Math.random().toString(),
              pos: player.pos.clone(),
              text: 'BOMBED!',
              life: 2.0,
              color: '#ffffff'
            });
          }
          next.particles.push(...createItemSparkle(item.pos, item.color, 12));
          return false;
        }
        return true;
      });

      for (const e of next.enemies) {
        if (checkCollision(player, e)) {
          if (next.thornsDamage > 0) {
            e.health -= next.thornsDamage * 0.15 * dt;
          }
          if (next.dashIFrameTimer > 0) continue;
          if (next.buffs.shield <= 0) {
            player.health -= 0.6 * dt;
            player.hitTimer = 3;
            next.screenshake = Math.min(next.screenshake + 0.5 * dt, 8);
          } else {
            // Deflect effect
            next.particles.push(...createExplosion(player.pos, '#34d399', 1));
          }
          
          if (player.health <= 0) {
            next.isGameOver = true;
            next.particles.push(...createExplosion(player.pos, player.color, 50));
            next.particles.push(...createExplosion(player.pos, '#ffffff', 20));
            next.screenshake = 20;
            syncUi();
          }
        }
      }

      if (next.screenshake > 0) next.screenshake *= Math.pow(0.9, dt);

      if (player.health / player.maxHealth < 0.25 && Math.random() < 0.002) {
        playSfx('lowHp');
      }

      if (next.score > next.wave * 4000) {
        next.wave += 1;
      }

      // Sync UI less frequently for performance
      if (currentTime - lastUiSync > 250) {
        syncUi();
        lastUiSync = currentTime;
      }

      render(ctx, next, dimensions.width, dimensions.height);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [screen, dimensions, showLevelUp, showArtifactUnlock, equippedArtifactIds]);

  return (
    <div className={`fixed inset-0 bg-[#0c0c0e] overflow-hidden select-none touch-none ${screen === 'GAME' ? 'cursor-crosshair' : 'cursor-default'}`}>
      <AnimatePresence>
        {screen === 'MENU' && (
          <motion.div 
            key="main-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)] overflow-hidden"
          >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 z-[-1] opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-center mb-16">
              <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-white via-cyan-100 to-blue-500 italic tracking-tighter uppercase leading-none drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                Chaos <br /> <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]">Arena</span>
              </h1>
              <p className="text-blue-400 font-mono text-xs md:text-sm tracking-[0.4em] uppercase mt-6 drop-shadow-md">Cybernetic Twin-Stick Survivor</p>
            </motion.div>

            <div className="flex flex-col gap-4 w-72">
              <button onClick={startGame} className="group relative bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
                <Play size={24} fill="currentColor" /> INITIATE BOOT
              </button>
              <button onClick={startAimTrainer} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(217,119,6,0.4)] transition-all duration-300 hover:scale-105 active:scale-95">
                <Target size={24} fill="currentColor" /> AIM TRAINER
              </button>
              <button onClick={() => setIsGearOpen(true)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 min-h-14 rounded-2xl flex items-center justify-center gap-3 transition-colors hover:border-white/30 backdrop-blur-md">
                <Swords size={20} className="opacity-70" /> CONFIGURE LOADOUT
              </button>
              <button onClick={() => setIsInventoryOpen(true)} className="bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-white font-bold py-4 min-h-14 rounded-2xl flex items-center justify-center gap-3 transition-colors">
                RELIC VAULT ({unlockedArtifactIds.length})
              </button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['CANNON_A', 'CANNON_B', 'ARMOR', 'MOBILITY'] as ArtifactSlot[]).map(slot => {
                  const artId = equippedArtifactIds[slot];
                  const art = artId ? ARTIFACTS[artId] : null;
                  return (
                    <div key={slot} className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-2">
                       <div className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white/40">
                          {slot === 'CANNON_A' || slot === 'CANNON_B' ? <Swords size={12} /> : slot === 'ARMOR' ? <Shield size={12} /> : <Zap size={12} />}
                       </div>
                       <div className="min-w-0">
                          <div className="text-[7px] text-white/30 uppercase font-black leading-none mb-0.5">{slot.replace('_', ' ')}</div>
                          <div className="text-[10px] text-white font-bold truncate italic leading-none">{art?.name || 'Standard'}</div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none" 
      />
      
      {/* Tactical AI Overlay */}
      <AnimatePresence>
        {aiCommentary && (
          <motion.div
            key="ai-commentary"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%' }}
            className="absolute top-24 left-1/2 z-30"
          >
            <div className="bg-black/60 backdrop-blur-xl border-l-4 border-cyan-500 px-4 py-2 flex flex-col gap-0.5 shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-70">Tactical Intel</span>
              <p className="text-white font-mono text-xs leading-tight">
                {aiCommentary}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Low Health Tint */}
      {uiState && uiState.health / uiState.maxHealth < 0.25 && (
        <motion.div 
          key="low-health-tint"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-red-900/20 pointer-events-none z-10"
        />
      )}

      {screen === 'GAME' && uiState && (
        <motion.div key="game-ui-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
          <GameHUD 
            health={uiState.health} maxHealth={uiState.maxHealth}
            survivalTime={uiState.survivalTime}
            threatLevel={uiState.threatLevel}
            score={uiState.score} wave={uiState.wave}
            energy={uiState.energy} maxEnergy={uiState.maxEnergy}
            stage={uiState.stage} enemiesToKill={uiState.enemiesToKill} stageTransition={uiState.stageTransition} gameMode={uiState.gameMode}
            showLevelUp={showLevelUp} onChoiceSelection={handleLevelUpChoice}
            onOpenMenu={togglePause}
            onWeaponSwitch={(slot) => {
              const next = gameStateRef.current;
              if (next) {
                next.activeWeaponSlot = slot;
                syncUi();
              }
            }}
            randomBuffs={currentBuffs}
            cardTimer={uiState.cardTimer}
            activeWeaponSlot={uiState.activeWeaponSlot}
            equippedArtifacts={uiState.equippedArtifacts}
            isMobile={isMobile}
          />
          {/* Buff Bar */}
          <div className="absolute top-24 left-6 flex flex-col gap-2">
            {uiState?.buffs.shield > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/50">
                <Shield size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">SHIELD {Math.ceil(uiState.buffs.shield / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.overdrive > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-rose-500/50">
                <Zap size={16} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-400">OVERDRIVE {Math.ceil(uiState.buffs.overdrive / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.magnet > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/50">
                <Target size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-400">MAGNET {Math.ceil(uiState.buffs.magnet / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.scoreX > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-violet-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-violet-500/50">
                <Trophy size={16} className="text-violet-400" />
                <span className="text-xs font-bold text-violet-400">2X SCORE {Math.ceil(uiState.buffs.scoreX / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.rapidFire > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-orange-500/50">
                <Flame size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-orange-400">RAPID {Math.ceil(uiState.buffs.rapidFire / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.timeSlow > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-cyan-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/50">
                <RotateCcw size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400">SLOW-MO {Math.ceil(uiState.buffs.timeSlow / 60)}s</span>
              </motion.div>
            )}
            {uiState?.buffs.piercing > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 bg-pink-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-pink-500/50">
                <Swords size={16} className="text-pink-400" />
                <span className="text-xs font-bold text-pink-400">PIERCE {Math.ceil(uiState.buffs.piercing / 60)}s</span>
              </motion.div>
            )}
          </div>

          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col items-center gap-4">
            <Joystick size={isMobile ? 92 : 128} label="move" onMove={(dir) => { controls.current.move = dir; }} onEnd={() => { controls.current.move = { x: 0, y: 0 }; }} />
          </div>
          <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-4">
            <div className="relative mb-2">
              {uiState && uiState.energy < 30 && (
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse pointer-events-none" />
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => { 
                  e.stopPropagation();
                  controls.current.wantDash = true; 
                }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-white pointer-events-auto transition-all duration-300 shadow-lg ${
                  uiState && uiState.energy >= 30 
                    ? 'bg-amber-500 border-white/20 shadow-amber-500/40' 
                    : 'bg-gray-800 border-white/5 opacity-50 grayscale'
                }`}
              >
                <Zap size={32} fill={uiState && uiState.energy >= 30 ? "white" : "rgba(255,255,255,0.2)"} />
              </motion.button>
            </div>
            <Joystick size={isMobile ? 92 : 128} label="aim" color="bg-red-500/10" onMove={(dir) => { controls.current.aim = dir; controls.current.isFiring = true; }} onEnd={() => { controls.current.isFiring = false; }} />
          </div>
        </motion.div>
      )}


      <BuffCardPicker
        show={showLevelUp && screen === 'GAME'}
        buffs={currentBuffs}
        passives={gameStateRef.current?.passives ?? []}
        onSelect={handleLevelUpChoice}
        isMobile={isMobile}
      />

      <ArtifactUnlockPicker
        show={showArtifactUnlock && screen === 'GAME'}
        choices={artifactUnlockChoices}
        unlocksRemaining={2 - (gameStateRef.current?.runArtifactUnlocks ?? 0)}
        onSelect={handleArtifactUnlockChoice}
        isMobile={isMobile}
      />

      <ArtifactInventory
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        unlockedIds={unlockedArtifactIds}
        newUnlockIds={newUnlockIds}
        isMobile={isMobile}
        onOpenHangar={() => {
          setIsInventoryOpen(false);
          setIsGearOpen(true);
        }}
      />

      <GearSystem
        isMobile={isMobile} 
        isOpen={isGearOpen}
        onClose={() => setIsGearOpen(false)}
        unlockedArtifacts={unlockedArtifactIds.map(id => ARTIFACTS[id]).filter(Boolean)}
        equippedIds={equippedArtifactIds}
        onEquip={(id) => {
          const art = ARTIFACTS[id];
          if (art) {
            setEquippedArtifactIds(prev => ({ ...prev, [art.slot]: id }));
          }
        }}
      />

      <AnimatePresence>
        {isPauseMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">System Paused</h2>
              <p className="text-blue-400 font-mono text-sm tracking-widest mt-2 uppercase">Neural Link Suspended</p>
            </div>
            
            <div className="flex flex-col gap-4 w-72">
              <button 
                onClick={togglePause}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 transition-all pointer-events-auto"
              >
                <Play size={24} fill="white" /> RESUME MISSION
              </button>
              <button 
                onClick={() => {
                  gameStateRef.current = null;
                  setScreen('MENU');
                  setIsPauseMenuOpen(false);
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors pointer-events-auto"
              >
                <RotateCcw size={24} /> ABORT TO MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiState?.isGameOver && (
          <motion.div 
            key="game-over-screen"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 z-[100] bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-6">DEFEATED</h2>
            <div className="bg-black/40 border border-white/10 p-8 rounded-3xl text-center mb-8 min-w-[300px]">
              <div className="text-5xl font-black text-white mb-2">{uiState.score.toLocaleString()}</div>
              <div className="text-white/40 text-xs uppercase font-bold tracking-widest mb-4">Final Score</div>
              <div className="grid grid-cols-2 gap-3 text-left text-sm mt-4">
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-white/40 text-[10px] uppercase font-bold">Survived</div>
                  <div className="text-white font-mono font-bold">
                    {Math.floor((gameStateRef.current?.survivalTime ?? 0) / 60)}:
                    {String(Math.floor((gameStateRef.current?.survivalTime ?? 0) % 60)).padStart(2, '0')}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-white/40 text-[10px] uppercase font-bold">Peak Heat</div>
                  <div className="text-rose-400 font-black">{gameStateRef.current?.threatPeak ?? 0}%</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-white/40 text-[10px] uppercase font-bold">Sector</div>
                  <div className="text-amber-400 font-black">{uiState.stage}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-white/40 text-[10px] uppercase font-bold">Augments</div>
                  <div className="text-cyan-400 font-black">{gameStateRef.current?.augmentCount ?? 0}</div>
                </div>
              </div>
            </motion.div>
            <button onClick={() => { 
                gameStateRef.current = null;
                startGame();
              }} className="min-h-14 bg-white hover:bg-gray-200 transition-colors text-black font-black py-4 px-12 rounded-2xl flex items-center justify-center gap-3 pointer-events-auto">
              <RotateCcw size={24} /> RESTART RUN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
