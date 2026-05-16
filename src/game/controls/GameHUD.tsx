import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Shield, Sword, Zap, Activity, HeartPulse, ShieldCheck, Bomb, Swords, CircleIcon, MoveRight, Target, Flame, Magnet, Menu, RotateCcw } from 'lucide-react';
import { PassiveBuff, BuffRarity } from '../types';

function formatSurvival(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HUDProps {
  health: number;
  maxHealth: number;
  survivalTime?: number;
  threatLevel?: number;
  score: number;
  wave: number;
  energy: number;
  maxEnergy: number;
  stage?: number;
  enemiesToKill?: number;
  stageTransition?: number;
  gameMode?: 'NORMAL' | 'AIM_TRAINER';
  onChoiceSelection?: (choiceId: string) => void;
  showLevelUp?: boolean;
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B' | 'CANNON_C') => void;
  randomBuffs?: PassiveBuff[];
  cardTimer?: number;
  activeWeaponSlot?: 'CANNON_A' | 'CANNON_B' | 'CANNON_C';
  equippedArtifacts?: Record<string, string | null>;
  isMobile?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap />,
  Target: <Target />,
  Shield: <Shield />,
  Flame: <Flame />,
  Magnet: <Magnet />,
  Activity: <Activity />,
  HeartPulse: <HeartPulse />,
  ShieldCheck: <ShieldCheck />,
  Bomb: <Bomb />,
  Swords: <Swords />,
  CircleIcon: <CircleIcon />,
  MoveRight: <MoveRight />,
  RotateCcw: <RotateCcw />,
};

const RARITY_STYLE: Record<BuffRarity, { border: string, bg: string, glow: string, text: string }> = {
  [BuffRarity.COMMON]: { border: 'border-slate-500/30', bg: 'bg-slate-500/10', glow: 'shadow-slate-500/20', text: 'text-slate-400' },
  [BuffRarity.RARE]: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20', text: 'text-blue-400' },
  [BuffRarity.EPIC]: { border: 'border-purple-500/50', bg: 'bg-purple-500/15', glow: 'shadow-purple-500/30', text: 'text-purple-400' },
  [BuffRarity.LEGENDARY]: { border: 'border-amber-400/60', bg: 'bg-amber-400/20', glow: 'shadow-amber-400/50', text: 'text-amber-400' },
  [BuffRarity.EXCLUSIVE]: { border: 'border-cyan-400/60', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/40', text: 'text-cyan-300' },
};

export const GameHUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  survivalTime = 0,
  threatLevel = 0,
  score,
  wave,
  energy,
  maxEnergy,
  stage = 1,
  enemiesToKill = 0,
  stageTransition = 0,
  gameMode = 'NORMAL',
  onChoiceSelection,
  showLevelUp,
  onOpenMenu,
  onWeaponSwitch,
  randomBuffs = [],
  cardTimer = 60,
  activeWeaponSlot = 'CANNON_A',
  equippedArtifacts = {},
  isMobile = false,
}) => {
  const healthPercent = (health / maxHealth) * 100;
  const energyPercent = (energy / maxEnergy) * 100;
  const threatPercent = Math.min(100, threatLevel);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col p-6 font-sans">
      {/* Top Bar: XP & Score */}
      <div className="w-full flex justify-between items-start gap-4">
        {/* Left Side: XP & Level Info */}
        <div className="flex flex-col gap-2 w-64 relative z-10">
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              className="h-full bg-linear-to-r from-rose-600 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${threatPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-white font-bold tracking-tight">
            <span className="bg-rose-600/80 px-2 py-0.5 rounded text-[10px] font-black uppercase">HEAT {threatLevel}%</span>
            <span className="text-[10px] font-mono text-cyan-400 tabular-nums">{formatSurvival(survivalTime)}</span>
            <span className="text-[10px] font-mono text-blue-400 tabular-nums">{Math.max(0, Math.ceil(cardTimer))}s</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }} 
              className="pointer-events-auto bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Center: Score */}
        <div className="text-3xl font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-tighter">
          {score.toLocaleString()}
        </div>

        {/* Right Side: Stage Info */}
        <div className={`text-right flex flex-col items-end gap-1 ${isMobile ? 'w-32' : 'w-64'}`}>
          {gameMode === 'AIM_TRAINER' ? (
            <div className="text-sm font-black text-amber-500 uppercase drop-shadow tracking-widest">AIM TRAINER</div>
          ) : (
            <>
              <motion.div className="text-sm font-black text-amber-400 uppercase drop-shadow">SECTOR {stage}</motion.div>
              {stageTransition > 0 ? (
                <span className="text-xs uppercase text-green-400 animate-pulse bg-green-900/40 px-2 py-1 rounded">Stage Clear</span>
              ) : enemiesToKill > 0 ? (
                <span className="text-xs uppercase opacity-70 bg-black/40 px-2 py-1 rounded tracking-wider">{enemiesToKill} TO KILL</span>
              ) : (
                <span className="text-xs uppercase text-red-500 animate-pulse font-bold bg-red-900/40 px-2 py-1 rounded">BOSS INCOMING</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar: Weapon Switcher */}
      <div className={`mt-auto flex justify-between items-end ${isMobile ? 'mb-24' : ''}`}>
        {/* Weapon Slots (Adaptive Location) */}
        <div className={`flex gap-3 pointer-events-auto ${isMobile ? 'fixed top-1 left-1/2 -translate-x-1/2 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10' : ''}`}>
          {['CANNON_A', 'CANNON_B', 'CANNON_C'].map((slot) => {
            const isActive = activeWeaponSlot === slot;
            const artId = equippedArtifacts[slot];
            
            let label = 'Primary';
            if (slot === 'CANNON_B') label = 'Auto';
            if (slot === 'CANNON_C') label = 'Special';

            let Icon = Swords;
            if (slot === 'CANNON_A') Icon = Swords;
            if (slot === 'CANNON_B') Icon = Flame;
            if (slot === 'CANNON_C') Icon = Zap;

            return (
              <button 
                key={slot}
                onClick={(e) => { e.stopPropagation(); onWeaponSwitch?.(slot as any); }}
                className={`relative group h-12 w-12 md:w-16 md:h-16 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
                  ${isActive 
                    ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.5)] scale-110' 
                    : 'bg-black/60 border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                {!isMobile && (
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 border px-2 py-0.5 rounded text-[8px] font-black uppercase text-white
                    ${isActive ? 'bg-blue-600 border-blue-400' : 'bg-black border-white/20'}`}>
                    {label}
                  </div>
                )}
                
                <Icon size={isMobile ? 18 : 24} className={isActive ? 'text-blue-300' : 'text-slate-500'} />
                
                {isActive && (
                  <motion.div layoutId="weapon-glow" className="absolute inset-0 rounded-xl bg-blue-400/10 animate-pulse" />
                )}

                {!isMobile && (
                  <div className="absolute -bottom-4 text-[8px] font-mono text-white/30 tracking-widest">
                    {slot === 'CANNON_A' ? '[1]' : slot === 'CANNON_B' ? '[2]' : '[3]'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Energy & Dash Info (Bottom Right placeholder or visual) */}
        <div className="flex flex-col items-end gap-2">
            {/* Visual only, real one is center top */}
        </div>
      </div>

      {/* Center: Bars above player (Original position or kept for clarity) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <div className="w-56 h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5 relative pointer-events-none">
          <motion.div 
            className="h-full bg-linear-to-r from-red-600 to-rose-400 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]"
            initial={{ width: '100%' }}
            animate={{ 
              width: `${healthPercent}%`,
              opacity: healthPercent < 25 ? [1, 0.4, 1] : 1
            }}
            transition={{ 
              opacity: { repeat: Infinity, duration: 0.5 },
              width: { type: 'spring', stiffness: 100, damping: 20 }
            }}
          />
        </div>
        <div className="w-44 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative pointer-events-none">
          <motion.div 
            className="h-full bg-linear-to-r from-amber-500 to-yellow-300 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]"
            initial={{ width: '100%' }}
            animate={{ width: `${energyPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Buff picker rendered in App.tsx (BuffCardPicker) */}
      {false && showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-4 md:p-8 pointer-events-auto"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-12"
            >
              <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-white via-blue-200 to-blue-600 tracking-tighter italic uppercase">
                Augment
              </h2>
              <p className="text-blue-400 font-mono tracking-[0.3em] text-xs mt-2 uppercase">Neural Link Established • Choose One</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
              {randomBuffs.map((buff, i) => {
                const style = RARITY_STYLE[buff.rarity];
                return (
                  <motion.button
                    key={buff.id + i}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 100 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChoiceSelection?.(buff.id)}
                    className={`group relative w-full sm:w-64 h-96 p-1 rounded-[2.5rem] ${style.bg} ${style.border} border-2 overflow-hidden flex flex-col items-center text-center transition-all duration-500 ${style.glow} hover:shadow-2xl`}
                  >
                    {/* Card Inner Background */}
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                    
                    {/* Rarity Tag */}
                    <div className={`mt-6 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.text} bg-black/40 border ${style.border} z-10`}>
                      {buff.rarity}
                    </div>

                    {/* Icon Container */}
                    <div className={`mt-8 mb-8 w-24 h-24 rounded-full flex items-center justify-center ${style.bg} border-2 ${style.border} ${style.text} z-10 group-hover:scale-110 transition-transform duration-500`}>
                      {React.cloneElement((ICON_MAP[buff.icon] || <Zap />) as React.ReactElement, { size: 48, strokeWidth: 1.5 })}
                    </div>

                    {/* Info */}
                    <div className="px-6 z-10">
                      <h3 className="text-2xl font-black text-white italic tracking-tight uppercase leading-tight">
                        {buff.name}
                      </h3>
                      <p className="mt-4 text-slate-400 text-sm font-medium leading-snug">
                        {buff.description}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    <div className="mt-auto mb-8 w-12 h-1 bg-white/20 rounded-full group-hover:bg-white group-hover:w-20 transition-all duration-300" />
                    
                    {/* Animated Border Shimmer */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent w-full h-full -translate-x-[100%] group-hover:animate-[shimmer_3s_infinite]" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
    </div>
  );
};
