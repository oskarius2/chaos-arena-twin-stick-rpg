import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { GameState } from '../types';
import { ARTIFACTS } from '../content/artifacts';
import { getBuildName, getTopPassives } from '../meta/buildName';
import { getNextUnlockGoal } from '../meta/artifactGoals';

interface RunSummaryProps {
  state: GameState;
  unlockedCount: number;
  totalArtifacts: number;
  lockedIds: string[];
  onRestart: () => void;
  onVault: () => void;
  victory?: boolean;
}

export const RunSummary: React.FC<RunSummaryProps> = ({
  state,
  unlockedCount,
  totalArtifacts,
  lockedIds,
  onRestart,
  onVault,
  victory = false,
}) => {
  const buildName = getBuildName(state);
  const topBuffs = getTopPassives(state);
  const runArts = state.runArtifactsUnlockedThisRun
    .map((id) => ARTIFACTS[id]?.name)
    .filter(Boolean);
  const goal = getNextUnlockGoal(lockedIds);
  const mins = Math.floor(state.survivalTime / 60);
  const secs = String(Math.floor(state.survivalTime % 60)).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-[100] ${victory ? 'bg-indigo-950/95' : 'bg-red-950/95'} backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto`}
    >
      <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
        {victory ? 'SEGER' : 'RUN SLUT'}
      </h2>
      <p className="text-cyan-400/80 font-mono text-xs uppercase tracking-widest mb-6">{buildName}</p>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-black/50 border border-white/10 rounded-3xl p-6 mb-6 space-y-4"
      >
        <div className="text-center">
          <p className="text-4xl font-black text-white">{state.score.toLocaleString()}</p>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Poäng</p>
        </div>

        <motion.div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Tid</p>
            <p className="text-white font-mono font-bold">{mins}:{secs}</p>
          </div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Sektor</p>
            <p className="text-amber-400 font-black">{state.stage}</p>
          </motion.div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Våg</p>
            <p className="text-white font-black">{state.wave}</p>
          </motion.div>
          <motion.div className="bg-white/5 p-3 rounded-xl">
            <p className="text-white/40 text-[10px] uppercase font-bold">Toppvärme</p>
            <p className="text-rose-400 font-black">{state.threatPeak}%</p>
          </motion.div>
        </motion.div>

        {topBuffs.length > 0 && (
          <motion.div>
            <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2">Toppförstärkningar</p>
            <ul className="space-y-1">
              {topBuffs.map((b) => (
                <li key={b.id} className="text-xs text-white/80 flex justify-between">
                  <span>{b.name}</span>
                  {b.stacks > 1 && <span className="text-cyan-400 font-mono">×{b.stacks}</span>}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {runArts.length > 0 && (
          <motion.div>
            <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-fuchsia-400" /> Reliker denna run
            </p>
            <ul className="text-xs text-fuchsia-200/90 space-y-0.5">
              {runArts.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div className="text-center pt-2 border-t border-white/10">
          <p className="text-lg font-black text-white">
            {unlockedCount} / {totalArtifacts}
          </p>
          <p className="text-white/40 text-[10px] uppercase">i samlingen</p>
          {goal && (
            <p className="text-cyan-400/90 text-xs mt-2 font-bold">
              {goal.label} → {goal.name}
            </p>
          )}
        </motion.div>
      </motion.div>

      <motion.div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-14 bg-white hover:bg-gray-200 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 pointer-events-auto"
        >
          <RotateCcw size={24} /> NY RUN
        </button>
        <button
          type="button"
          onClick={onVault}
          className="min-h-12 bg-fuchsia-600/30 border border-fuchsia-500/40 text-white font-bold py-3 rounded-2xl pointer-events-auto"
        >
          RELIKVALV
        </button>
      </motion.div>
    </motion.div>
  );
};
