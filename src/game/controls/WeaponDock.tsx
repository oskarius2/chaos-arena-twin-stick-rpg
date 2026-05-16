import React from 'react';
import { motion } from 'motion/react';
import { Flame, Swords, Zap } from 'lucide-react';
import { MIN_TOUCH_PX } from './mobileLayout';

const SLOTS = ['CANNON_A', 'CANNON_B', 'CANNON_C'] as const;
export type WeaponSlot = (typeof SLOTS)[number];

const SLOT_META: Record<
  WeaponSlot,
  { label: string; short: string; Icon: typeof Swords }
> = {
  CANNON_A: { label: 'Primär', short: '1', Icon: Swords },
  CANNON_B: { label: 'Auto', short: '2', Icon: Flame },
  CANNON_C: { label: 'Special', short: '3', Icon: Zap },
};

interface WeaponDockProps {
  activeSlot: WeaponSlot;
  onSwitch: (slot: WeaponSlot) => void;
  portrait?: boolean;
}

export const WeaponDock: React.FC<WeaponDockProps> = ({
  activeSlot,
  onSwitch,
  portrait = false,
}) => (
  <div
    className={`pointer-events-auto z-40 flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-lg ${
      portrait ? 'px-3 py-2' : 'px-4 py-3'
    }`}
    style={{ minHeight: MIN_TOUCH_PX }}
    role="toolbar"
    aria-label="Vapen"
  >
    {SLOTS.map((slot) => {
      const isActive = activeSlot === slot;
      const { label, short, Icon } = SLOT_META[slot];
      return (
        <button
          key={slot}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onSwitch(slot);
          }}
          aria-label={`${label}${isActive ? ', aktiv' : ''}`}
          aria-pressed={isActive}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all touch-manipulation ${
            portrait ? 'min-h-14 min-w-[3.25rem]' : 'min-h-12 min-w-12'
          } ${
            isActive
              ? 'border-blue-400 bg-blue-600/40 shadow-[0_0_20px_rgba(59,130,246,0.45)] scale-105'
              : 'border-white/10 bg-white/5 opacity-80 active:scale-95'
          }`}
        >
          <Icon size={portrait ? 22 : 20} className={isActive ? 'text-blue-200' : 'text-slate-300'} />
          <span
            className={`mt-0.5 font-black uppercase leading-none ${
              portrait ? 'text-[9px]' : 'text-[8px]'
            } ${isActive ? 'text-blue-200' : 'text-white/50'}`}
          >
            {portrait ? label : short}
          </span>
          {isActive && (
            <motion.div
              layoutId="weapon-dock-glow"
              className="absolute inset-0 rounded-xl bg-blue-400/10"
            />
          )}
        </button>
      );
    })}
  </div>
);
