import React from 'react';
import { motion } from 'motion/react';
import { Sword, Zap, Flame, Menu } from 'lucide-react';

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
  stage?: number;
  enemiesToKill?: number;
  stageTransition?: number;
  gameMode?: 'NORMAL' | 'AIM_TRAINER';
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B' | 'CANNON_C') => void;
  cardTimer?: number;
  cardInterval?: number;
  activeWeaponSlot?: 'CANNON_A' | 'CANNON_B' | 'CANNON_C';
  energy: number;
  maxEnergy: number;
  isMobile?: boolean;
  compactHud?: boolean;
}

function CardTimerRing({ cardTimer, cardInterval }: { cardTimer: number; cardInterval: number }) {
  return (
    <motion.div className="relative flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
      <svg className="absolute inset-0 -rotate-90 w-10 h-10" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="3"
          strokeDasharray={`${Math.max(0, (cardTimer / cardInterval) * 94)} 94`}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center leading-none z-10">
        <span className="text-[7px] text-blue-400 font-black uppercase">Kort</span>
        <span className="text-[10px] font-mono text-white tabular-nums">
          {cardTimer > 3 ? `~${Math.ceil(cardTimer)}s` : `${Math.max(0, Math.ceil(cardTimer))}s`}
        </span>
      </div>
    </motion.div>
  );
}

function CompactTopHud(props: {
  threatLevel: number;
  threatPercent: number;
  score: number;
  survivalTime: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  gameMode: string;
  cardTimer: number;
  cardInterval: number;
  onOpenMenu?: () => void;
}) {
  const {
    threatLevel,
    threatPercent,
    score,
    survivalTime,
    stage,
    enemiesToKill,
    stageTransition,
    gameMode,
    cardTimer,
    cardInterval,
    onOpenMenu,
  } = props;

  return (
    <motion.div className="w-full flex flex-col gap-1.5 z-20">
      <motion.div className="flex items-center justify-between gap-2 w-full">
        <span className="shrink-0 bg-rose-600/90 px-2 py-1 rounded-md text-[10px] font-black uppercase text-white">
          {threatLevel}%
        </span>
        <p className="text-xl font-black text-white italic tracking-tighter truncate px-1">
          {score.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu?.();
          }}
          className="pointer-events-auto shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/10 border border-white/15 touch-manipulation"
          aria-label="Paus"
        >
          <Menu size={20} />
        </button>
      </motion.div>
      <motion.div className="flex items-center justify-between gap-2 text-[10px] font-mono text-white/80">
        <span className="text-cyan-400 tabular-nums">{formatSurvival(survivalTime)}</span>
        {gameMode === 'NORMAL' && (
          <span className="text-amber-400 font-black uppercase truncate">
            S{stage}
            {stageTransition > 0 ? ' · KLAR' : enemiesToKill > 0 ? ` · ${enemiesToKill}` : ' · BOSS'}
          </span>
        )}
        <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
      </motion.div>
      <motion.div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="h-full bg-linear-to-r from-rose-600 to-orange-400"
          animate={{ width: `${threatPercent}%` }}
        />
      </motion.div>
    </motion.div>
  );
}

export const GameHUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  survivalTime = 0,
  threatLevel = 0,
  score,
  stage = 1,
  enemiesToKill = 0,
  stageTransition = 0,
  gameMode = 'NORMAL',
  onOpenMenu,
  onWeaponSwitch,
  cardTimer = 60,
  cardInterval = 75,
  activeWeaponSlot = 'CANNON_A',
  energy,
  maxEnergy,
  compactHud = false,
  isMobile = false,
}) => {
  const healthPercent = (health / maxHealth) * 100;
  const energyPercent = (energy / maxEnergy) * 100;
  const threatPercent = Math.min(100, threatLevel);
  const showDesktopWeapons = !compactHud;

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none flex flex-col font-sans ${
        compactHud
          ? 'p-2 pt-[max(0.5rem,env(safe-area-inset-top))] px-[max(0.5rem,env(safe-area-inset-left))]'
          : 'p-6'
      }`}
    >
      {compactHud ? (
        <CompactTopHud
          threatLevel={threatLevel}
          threatPercent={threatPercent}
          score={score}
          survivalTime={survivalTime}
          stage={stage}
          enemiesToKill={enemiesToKill}
          stageTransition={stageTransition}
          gameMode={gameMode}
          cardTimer={cardTimer}
          cardInterval={cardInterval}
          onOpenMenu={onOpenMenu}
        />
      ) : (
        <motion.div className="w-full flex justify-between items-start gap-2 md:gap-4">
          <motion.div className="flex flex-col gap-2 min-w-0 flex-1 max-w-[min(100%,16rem)] relative z-10">
            <motion.div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-linear-to-r from-rose-600 to-orange-400"
                animate={{ width: `${threatPercent}%` }}
              />
            </motion.div>
            <motion.div className="flex flex-wrap items-center gap-2 text-white font-bold tracking-tight">
              <span className="bg-rose-600/80 px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap">
                HEAT {threatLevel}%
              </span>
              <span className="text-[10px] font-mono text-cyan-400 tabular-nums">{formatSurvival(survivalTime)}</span>
              <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMenu?.();
                }}
                className="pointer-events-auto bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/10 transition-colors min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                aria-label="Menu"
              >
                <Menu size={18} />
              </button>
            </motion.div>
          </motion.div>

          <p className="text-2xl md:text-3xl font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-tighter shrink-0 px-1">
            {score.toLocaleString()}
          </p>

          <motion.div className={`text-right flex flex-col items-end gap-1 shrink-0 ${isMobile ? 'max-w-[7rem]' : 'w-64'}`}>
            {gameMode === 'AIM_TRAINER' ? (
              <p className="text-xs md:text-sm font-black text-amber-500 uppercase">AIM</p>
            ) : (
              <>
                <p className="text-xs md:text-sm font-black text-amber-400 uppercase">SECTOR {stage}</p>
                {stageTransition > 0 ? (
                  <span className="text-[10px] uppercase text-green-400 bg-green-900/40 px-2 py-0.5 rounded">Clear</span>
                ) : enemiesToKill > 0 ? (
                  <span className="text-[10px] uppercase opacity-70 bg-black/40 px-2 py-0.5 rounded">
                    {enemiesToKill} left
                  </span>
                ) : (
                  <span className="text-[10px] uppercase text-red-500 font-bold bg-red-900/40 px-2 py-0.5 rounded animate-pulse">
                    BOSS
                  </span>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {showDesktopWeapons && (
        <motion.div className="mt-auto flex justify-between items-end">
          <motion.div className="flex gap-3 pointer-events-auto">
            {(['CANNON_A', 'CANNON_B', 'CANNON_C'] as const).map((slot) => {
              const isActive = activeWeaponSlot === slot;
              const label = slot === 'CANNON_A' ? 'Primary' : slot === 'CANNON_B' ? 'Auto' : 'Special';
              const Icon = slot === 'CANNON_B' ? Flame : slot === 'CANNON_C' ? Zap : Sword;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWeaponSwitch?.(slot);
                  }}
                  className={`relative h-14 w-14 md:h-16 md:w-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center touch-manipulation ${
                    isActive
                      ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.5)]'
                      : 'bg-black/60 border-white/5 opacity-50'
                  }`}
                >
                  <span
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 border px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${
                      isActive ? 'bg-blue-600 border-blue-400' : 'bg-black border-white/20'
                    }`}
                  >
                    {label}
                  </span>
                  <Icon size={24} className={isActive ? 'text-blue-300' : 'text-slate-500'} />
                </button>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      <motion.div
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none ${
          compactHud ? 'top-[5.75rem] w-[min(92vw,11rem)]' : 'top-16 w-56'
        }`}
      >
        <motion.div className="w-full h-2.5 md:h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
          <motion.div
            className="h-full bg-linear-to-r from-red-600 to-rose-400 rounded-full"
            animate={{
              width: `${healthPercent}%`,
              opacity: healthPercent < 25 ? [1, 0.4, 1] : 1,
            }}
            transition={{
              opacity: { repeat: Infinity, duration: 0.5 },
              width: { type: 'spring', stiffness: 100, damping: 20 },
            }}
          />
        </motion.div>
        <motion.div className="w-[85%] h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-linear-to-r from-amber-500 to-yellow-300 rounded-full"
            animate={{ width: `${energyPercent}%` }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
