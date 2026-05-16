import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Artifact, BuffRarity } from '../types';

const RARITY_BORDER: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'border-slate-400/50',
  [BuffRarity.RARE]: 'border-blue-400/50',
  [BuffRarity.EPIC]: 'border-purple-400/50',
  [BuffRarity.LEGENDARY]: 'border-amber-400/60',
};

interface ArtifactUnlockPickerProps {
  show: boolean;
  choices: Artifact[];
  unlocksRemaining: number;
  onSelect: (artifactId: string) => void;
}

export const ArtifactUnlockPicker: React.FC<ArtifactUnlockPickerProps> = ({
  show,
  choices,
  unlocksRemaining,
  onSelect,
}) => (
  <AnimatePresence>
    {show && choices.length > 0 && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[105] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 pointer-events-auto"
      >
        <div className="text-center mb-8">
          <Sparkles className="mx-auto text-fuchsia-400 mb-3" size={40} />
          <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
            Relic Salvaged
          </h2>
          <p className="text-fuchsia-300/80 text-xs font-mono uppercase tracking-widest mt-2">
            Unlock for Hangar ({unlocksRemaining} left this run)
          </p>
        </div>

        <motion.div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          {choices.map((art) => (
            <motion.button
              key={art.id}
              type="button"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(art.id)}
              className={`flex-1 p-6 rounded-2xl border-2 bg-white/5 text-left ${RARITY_BORDER[art.rarity]}`}
            >
              <span className="text-[10px] font-black uppercase text-white/40">{art.rarity}</span>
              <h3 className="text-xl font-black text-white italic mt-2">{art.name}</h3>
              <p className="text-sm text-white/60 mt-2">{art.description}</p>
              <p className="text-[10px] text-fuchsia-400 font-bold uppercase mt-3">{art.slot.replace('_', ' ')}</p>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
