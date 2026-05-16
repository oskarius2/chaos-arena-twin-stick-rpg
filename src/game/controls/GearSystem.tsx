import React from 'react';
import { motion } from 'motion/react';
import { Swords, Shield, Zap, Info, Gem, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { Artifact, ArtifactSlot, BuffRarity } from '../types';
import { formatArtifactStats, formatArtifactDelta } from '../meta/formatArtifactStats';

interface GearSystemProps {
  equippedIds: Record<ArtifactSlot, string | null>;
  unlockedArtifacts: Artifact[];
  onEquip: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<BuffRarity, string> = {
  [BuffRarity.COMMON]: 'border-slate-400 bg-slate-400/10 text-slate-400',
  [BuffRarity.RARE]: 'border-blue-400 bg-blue-400/10 text-blue-400',
  [BuffRarity.EPIC]: 'border-purple-400 bg-purple-400/10 text-purple-400',
  [BuffRarity.LEGENDARY]: 'border-orange-400 bg-orange-400/10 text-orange-400',
};

const SLOT_ICONS: Record<ArtifactSlot, React.ReactNode> = {
  CANNON_A: <Swords size={24} className="text-red-400" />,
  CANNON_B: <Swords size={24} className="text-orange-400" />,
  CANNON_C: <Zap size={24} className="text-blue-400" />,
  ARMOR: <Shield size={24} className="text-blue-400" />,
  MOBILITY: <Zap size={24} className="text-yellow-400" />,
};

const SLOT_LABELS: Record<ArtifactSlot, string> = {
  CANNON_A: 'Alpha Cannon',
  CANNON_B: 'Beta Cannon',
  CANNON_C: 'Special Railgun',
  ARMOR: 'Armor Plating',
  MOBILITY: 'Mobility Drive',
};

export const GearSystem: React.FC<GearSystemProps> = ({ equippedIds, unlockedArtifacts, onEquip, isOpen, onClose }) => {
  if (!isOpen) return null;

  const [selectedSlot, setSelectedSlot] = React.useState<ArtifactSlot>('CANNON_A');
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const equippedForSlot = unlockedArtifacts.find(a => a.id === equippedIds[selectedSlot]);
  const hoveredArt = hoveredId ? unlockedArtifacts.find((a) => a.id === hoveredId) : null;
  const artifactsForSlot = unlockedArtifacts.filter(a => a.slot === selectedSlot);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex flex-col p-8 pointer-events-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Hangar Loadout</h2>
          <span className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">Experimental Nano-Tech Integration</span>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full uppercase font-bold text-xs transition-all">
          Exit Hangar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-1 overflow-hidden">
        {/* Slot Selection Buttons */}
        <div className="flex flex-col gap-3">
          {(['CANNON_A', 'CANNON_B', 'CANNON_C', 'ARMOR', 'MOBILITY'] as ArtifactSlot[]).map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${
                selectedSlot === slot ? 'bg-white/10 border-white/40 ring-2 ring-white/10' : 'bg-white/5 border-white/5 opacity-60'
              }`}
            >
              <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center shrink-0">
                {SLOT_ICONS[slot]}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">{SLOT_LABELS[slot]}</div>
                <div className="text-white font-bold truncate">
                  {equippedIds[slot] ? unlockedArtifacts.find(a => a.id === equippedIds[slot])?.name : 'Empty'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Artifact List for Selected Slot */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-blue-400 font-black text-sm italic uppercase">Slot: {SLOT_LABELS[selectedSlot]}</p>
              <p className="text-white/60 text-xs leading-tight">SELECT AN ARTIFACT TO EQUIP IT TO THIS SLOT.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <h3 className="text-white/20 uppercase text-[10px] font-black tracking-[0.3em]">Compatible Tech</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 pb-4 scrollbar-hide">
              {artifactsForSlot.map((artifact) => (
                <motion.button
                  key={artifact.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredId(artifact.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onEquip(artifact.id)}
                  className={`relative p-4 rounded-3xl border-2 flex flex-col items-start gap-2 text-left transition-all ${
                    equippedIds[selectedSlot] === artifact.id ? 'ring-4 ring-white/20 shadow-2xl' : 'opacity-70 grayscale-[0.3]'
                  } ${RARITY_COLORS[artifact.rarity]}`}
                >
                  <div>
                    <div className="text-[9px] font-black uppercase opacity-60 mb-0.5">{artifact.rarity}</div>
                    <div className="text-sm font-black text-white italic uppercase">{artifact.name}</div>
                  </div>
                  <p className="text-[10px] text-white/50 leading-tight">{artifact.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formatArtifactDelta(artifact, equippedForSlot ?? null).map((line) => (
                      <span key={line} className="text-[9px] font-mono text-cyan-300/90 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {line}
                      </span>
                    ))}
                  </div>
                  {equippedIds[selectedSlot] === artifact.id && (
                    <div className="absolute top-3 right-3 bg-white text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Equipped</div>
                  )}
                </motion.button>
              ))}
              {artifactsForSlot.length === 0 && (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center opacity-30">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="text-xs font-bold uppercase italic">No {SLOT_LABELS[selectedSlot]} Tech Found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slot Summary Details */}
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
           <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
              {SLOT_ICONS[selectedSlot]}
           </div>
           
           <h3 className="text-white/30 uppercase text-[10px] font-black tracking-[0.3em]">Component Specs</h3>
           
           {equippedForSlot ? (
             <div className="flex flex-col gap-5 relative h-full">
                <div>
                   <h4 className="text-2xl font-black text-white italic uppercase tracking-tight leading-tight">{equippedForSlot.name}</h4>
                   <p className="text-white/40 text-xs mt-1 leading-relaxed italic">{equippedForSlot.rarity} GRADE ARTIFACT</p>
                </div>

                <div className="h-px bg-white/10 w-full" />

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {equippedForSlot.stats.damageMod && (
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                         <span className="text-white/40 text-[9px] font-bold uppercase">Attack Power</span>
                         <span className="text-green-400 font-mono text-sm font-bold">+{equippedForSlot.stats.damageMod > 5 ? equippedForSlot.stats.damageMod : `${Math.round((equippedForSlot.stats.damageMod - 1) * 100)}%`}</span>
                      </div>
                    )}
                    {equippedForSlot.stats.healthMod && (
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                         <span className="text-white/40 text-[9px] font-bold uppercase">Hull Value</span>
                         <span className="text-blue-400 font-mono text-sm font-bold">+{equippedForSlot.stats.healthMod}</span>
                      </div>
                    )}
                    {equippedForSlot.stats.speedMod && (
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                         <span className="text-white/40 text-[9px] font-bold uppercase">Thruster Mod</span>
                         <span className="text-yellow-400 font-mono text-sm font-bold">{equippedForSlot.stats.speedMod > 1 ? '+' : ''}{Math.round((equippedForSlot.stats.speedMod - 1) * 100)}%</span>
                      </div>
                    )}
                    {equippedForSlot.stats.critMod && (
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                         <span className="text-white/40 text-[9px] font-bold uppercase">Crit Ratio</span>
                         <span className="text-red-400 font-mono text-sm font-bold">+{Math.round(equippedForSlot.stats.critMod * 100)}%</span>
                      </div>
                    )}
                </div>
                
                <div className="p-4 bg-white/5 rounded-2xl text-[10px] text-white/50 leading-snug italic border border-white/5">
                  "Found mid-flight. Optimized for deployment."
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-20">
                <AlertCircle size={48} />
                <p className="text-xs italic uppercase font-bold tracking-widest">No Component Installed</p>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

