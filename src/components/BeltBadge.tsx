import React from 'react';
import { BeltRank } from '../types';

export interface BeltConfig {
  name: string;
  bgHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  sleeveBgClass: string;
}

export const BELT_DETAILS: Record<BeltRank, BeltConfig> = {
  BLANCO: {
    name: 'Blanco',
    bgHex: '#FFFFFF',
    bgClass: 'bg-white',
    textClass: 'text-slate-900',
    borderClass: 'border-slate-300 shadow-sm',
    sleeveBgClass: 'bg-black',
  },
  AZUL: {
    name: 'Azul',
    bgHex: '#005596',
    bgClass: 'bg-[#005596]',
    textClass: 'text-white',
    borderClass: 'border-blue-400/40',
    sleeveBgClass: 'bg-black',
  },
  MORADO: {
    name: 'Morado',
    bgHex: '#7B1FA2',
    bgClass: 'bg-[#7B1FA2]',
    textClass: 'text-white',
    borderClass: 'border-purple-400/40',
    sleeveBgClass: 'bg-black',
  },
  MARRON: {
    name: 'Marrón',
    bgHex: '#6D4C41',
    bgClass: 'bg-[#6D4C41]',
    textClass: 'text-white',
    borderClass: 'border-amber-900/50',
    sleeveBgClass: 'bg-black',
  },
  NEGRO: {
    name: 'Negro',
    bgHex: '#121212',
    bgClass: 'bg-[#121212]',
    textClass: 'text-white',
    borderClass: 'border-white/30',
    sleeveBgClass: 'bg-[#C8102E]', // Iconic BJJ Red Sleeve Bar on Black Belt
  },
};

interface BeltBadgeProps {
  rank: BeltRank;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BeltBadge: React.FC<BeltBadgeProps> = ({
  rank,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const config = BELT_DETAILS[rank] || BELT_DETAILS.BLANCO;

  // Sizes for the miniature authentic belt icon
  const sizeStyles = {
    sm: {
      container: 'h-4 w-12 text-[9px] px-1',
      sleeveBar: 'w-3.5 h-full',
      text: 'text-[9px]',
    },
    md: {
      container: 'h-5 w-16 text-[10px] px-1.5',
      sleeveBar: 'w-4 h-full',
      text: 'text-[10px]',
    },
    lg: {
      container: 'h-6 w-20 text-xs px-2',
      sleeveBar: 'w-5 h-full',
      text: 'text-xs',
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Visual BJJ Belt Strip */}
      <div
        className={`relative inline-flex items-center rounded overflow-hidden border ${config.bgClass} ${config.borderClass} ${sizeStyles.container} shrink-0 shadow-md`}
        title={`Cinturón ${config.name}`}
      >
        {/* Belt Main Body */}
        <span
          className={`font-black uppercase tracking-widest ${config.textClass} ${sizeStyles.text} z-10 select-none`}
        >
          {config.name.substring(0, 3)}
        </span>

        {/* Sleeve Bar on the Right End of the Belt */}
        <div
          className={`absolute right-0 top-0 bottom-0 ${config.sleeveBgClass} ${sizeStyles.sleeveBar} border-l border-black/40 flex items-center justify-center`}
        >
          {/* Subtle BJJ Stripe lines inside sleeve */}
          <div className="w-[1px] h-2 bg-white/70"></div>
        </div>
      </div>

      {showLabel && (
        <span className="text-xs font-bold text-slate-200">
          Cinturón {config.name}
        </span>
      )}
    </div>
  );
};

interface BeltSelectProps {
  value: BeltRank;
  onChange: (value: BeltRank) => void;
  className?: string;
}

export const BeltSelect: React.FC<BeltSelectProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const ranks: BeltRank[] = ['BLANCO', 'AZUL', 'MORADO', 'MARRON', 'NEGRO'];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Visual Belt Selector Dropdown Container */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as BeltRank)}
          className="w-full bg-slate-900 border border-white/20 rounded-xl pl-11 pr-8 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-[#005596] cursor-pointer transition font-medium"
        >
          {ranks.map((r) => {
            const cfg = BELT_DETAILS[r];
            return (
              <option key={r} value={r} className="bg-[#050505] text-white py-1">
                {cfg.name === 'Blanco' && '⚪ '}
                {cfg.name === 'Azul' && '🔵 '}
                {cfg.name === 'Morado' && '🟣 '}
                {cfg.name === 'Marrón' && '🟤 '}
                {cfg.name === 'Negro' && '⚫ '}
                Cinturón {cfg.name}
              </option>
            );
          })}
        </select>

        {/* Selected Belt Indicator Badge on top left of select */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <BeltBadge rank={value} showLabel={false} size="sm" />
        </div>

        {/* Arrow Indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </div>
      </div>

      {/* Interactive Visual Belt Quick Bar */}
      <div className="flex items-center gap-1.5 pt-1">
        {ranks.map((r) => {
          const cfg = BELT_DETAILS[r];
          const isSelected = value === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={`flex-1 py-1 px-1 rounded-lg border text-[10px] font-bold uppercase transition flex flex-col items-center gap-0.5 ${
                isSelected
                  ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              title={`Seleccionar Cinturón ${cfg.name}`}
            >
              <div
                className={`w-full h-2.5 rounded-xs border ${cfg.bgClass} ${cfg.borderClass} relative overflow-hidden`}
              >
                <div className={`absolute right-0 top-0 bottom-0 w-2 ${cfg.sleeveBgClass}`} />
              </div>
              <span className="text-[9px] truncate">{cfg.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
