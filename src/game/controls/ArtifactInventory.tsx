import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles } from 'lucide-react';
import { Artifact, ArtifactSlot, BuffRarity } from '../types';
import { ARTIFACTS, artifactPowerScore } from '../content/artifacts';
import { ALL_ARTIFACT_SLOTS } from '../content/artifactsExtra';

const RARITY_BORDER: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'border-slate-500/40',
  [BuffRarity.RARE]: 'border-blue-500/50',
  [BuffRarity.EPIC]: 'border-purple-500/60',
  [BuffRarity.LEGENDARY]: 'border-amber-400/70',
  [BuffRarity.EXCLUSIVE]: 'border-cyan-400/70',
};

interface ArtifactInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedIds: string[];
  newUnlockIds?: string[];
  isMobile?: boolean;
  onOpenHangar?: () => void;
}

export const ArtifactInventory: React.FC<ArtifactInventoryProps> = ({
  isOpen,
  onClose,
  unlockedIds,
  newUnlockIds = [],
  isMobile = false,
  onOpenHangar,
}) => {
  const [filterSlot, setFilterSlot] = useState<ArtifactSlot | 'ALL'>('ALL');

  if (!isOpen) return null;

  const all = Object.values(ARTIFACTS).sort((a, b) => artifactPowerScore(b) - artifactPowerScore(a));
  const filtered = filterSlot === 'ALL' ? all : all.filter((a) => a.slot === filterSlot);
  const ownedCount = unlockedIds.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[65] bg-black/95 backdrop-blur-2xl flex flex-col pointer-events-auto pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <motion.div
        className={`flex flex-col h-full ${isMobile ? 'p-4' : 'p-8'}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.div className="flex justify-between items-start mb-4 gap-4 shrink-0">
          <motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
              Relic Vault
            </h2>
            <p className="text-fuchsia-400/80 text-xs font-mono uppercase tracking-widest mt-1">
              {ownedCount} / {all.length} salvaged — permanent collection
            </p>
          </motion.div>
          <motion.div className="flex gap-2 shrink-0">
            {onOpenHangar && (
              <button
                type="button"
                onClick={onOpenHangar}
                className="min-h-12 px-4 bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs uppercase rounded-xl"
              >
                Hangar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 px-4 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase rounded-xl"
            >
              Close
            </button>
          </motion.div>
        </motion.div>

        <motion.div className="flex gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-hide">
          {(['ALL', ...ALL_ARTIFACT_SLOTS] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setFilterSlot(slot)}
              className={`shrink-0 min-h-10 px-3 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                filterSlot === slot ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {slot === 'ALL' ? 'All' : slot.replace('_', ' ')}
            </button>
          ))}
        </motion.div>

        <motion.div
          className={`grid gap-3 overflow-y-auto flex-1 pr-1 ${
            isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {filtered.map((art) => {
            const owned = unlockedIds.includes(art.id);
            const isNew = newUnlockIds.includes(art.id);
            return (
              <motion.div
                key={art.id}
                layout
                className={`relative p-4 rounded-2xl border-2 text-left ${
                  owned ? `${RARITY_BORDER[art.rarity]} bg-white/5` : 'border-white/10 bg-black/40 opacity-60'
                }`}
              >
                {isNew && owned && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black uppercase text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                    <Sparkles size={10} /> New
                  </span>
                )}
                {!owned && (
                  <Lock className="absolute top-3 right-3 text-white/20" size={16} />
                )}
                <span className="text-[9px] font-black uppercase text-white/40">{art.rarity}</span>
                <h3 className={`text-sm font-black italic mt-1 ${owned ? 'text-white' : 'text-white/40'}`}>
                  {owned ? art.name : '???'}
                </h3>
                {owned && <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{art.description}</p>}
                <p className="text-[9px] text-fuchsia-400/70 font-bold uppercase mt-2">{art.slot.replace('_', ' ')}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
