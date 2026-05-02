'use client';
import type { Card, RegularGemColor } from '@/types/game';

const BONUS_CARD_BG: Record<RegularGemColor, string> = {
  white: 'bg-slate-100',
  blue:  'bg-blue-900',
  green: 'bg-green-900',
  red:   'bg-red-900',
  black: 'bg-amber-900',
};

const BONUS_TEXT: Record<RegularGemColor, string> = {
  white: 'text-gray-800',
  blue:  'text-white',
  green: 'text-white',
  red:   'text-white',
  black: 'text-white',
};

const COST_GEM: Record<RegularGemColor, string> = {
  white: 'bg-white border border-gray-300 text-gray-800',
  blue:  'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red:   'bg-red-500 text-white',
  black: 'bg-amber-800 text-white',
};

const TIER_ACCENT: Record<1 | 2 | 3, string> = {
  1: 'border-gray-400',
  2: 'border-yellow-400',
  3: 'border-orange-400',
};

const GEM_COLORS: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];

interface Props {
  card: Card;
  onBuy?: () => void;
  onReserve?: () => void;
  compact?: boolean;
}

export default function CardDisplay({ card, onBuy, onReserve, compact }: Props) {
  if (compact) {
    return (
      <div className={`rounded-lg border-2 ${TIER_ACCENT[card.tier]} ${BONUS_CARD_BG[card.bonus]} w-14 h-16 p-1 flex flex-col justify-start shadow`}>
        <span className={`text-sm font-bold ${BONUS_TEXT[card.bonus]}`}>
          {card.points}
        </span>
      </div>
    );
  }

  const hasCost = GEM_COLORS.some(c => (card.cost[c] ?? 0) > 0);

  return (
    <div className={`rounded-xl border-2 ${TIER_ACCENT[card.tier]} ${BONUS_CARD_BG[card.bonus]} w-24 flex flex-col shadow-lg overflow-hidden`}>
      {/* Top: points only */}
      <div className="px-2 pt-2 pb-1">
        <span className={`text-2xl font-black leading-none ${BONUS_TEXT[card.bonus]}`}>
          {card.points}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[20px]" />

      {/* Cost gems */}
      <div className={`flex flex-col gap-1 items-end px-2 pb-1 ${!hasCost ? 'opacity-0' : ''}`}>
        {GEM_COLORS.map(c => {
          const n = card.cost[c] ?? 0;
          if (n === 0) return null;
          return (
            <div key={c} className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold shadow ${COST_GEM[c]}`}>
              <span>{n}</span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {(onBuy || onReserve) && (
        <div className="flex border-t border-black/20">
          {onBuy && (
            <button
              className="flex-1 text-xs py-1.5 font-bold transition-all active:scale-95 bg-green-600 hover:bg-green-500 text-white"
              onClick={onBuy}
            >Buy</button>
          )}
          {onReserve && (
            <button
              className="flex-1 text-xs py-1.5 font-bold bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-white transition-all"
              onClick={onReserve}
            >Hold</button>
          )}
        </div>
      )}
    </div>
  );
}
