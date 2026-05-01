'use client';
import type { Card, GemColor, RegularGemColor } from '@/types/game';

const BONUS_BG: Record<RegularGemColor, string> = {
  white: 'bg-white text-gray-800',
  blue:  'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red:   'bg-red-500 text-white',
  black: 'bg-gray-800 text-white',
};

const COST_COLORS: Record<RegularGemColor, string> = {
  white: 'bg-white text-gray-800 border border-gray-300',
  blue:  'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red:   'bg-red-500 text-white',
  black: 'bg-gray-800 text-white',
};

const TIER_BORDER: Record<1 | 2 | 3, string> = {
  1: 'border-gray-400',
  2: 'border-yellow-500',
  3: 'border-orange-500',
};

interface Props {
  card: Card;
  canAfford?: boolean;
  onBuy?: () => void;
  onReserve?: () => void;
  compact?: boolean;
}

export default function CardDisplay({ card, canAfford, onBuy, onReserve, compact }: Props) {
  const colors: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];

  if (compact) {
    return (
      <div className={`rounded border-2 ${TIER_BORDER[card.tier]} ${BONUS_BG[card.bonus]} p-1 text-xs w-16`}>
        {card.points > 0 && <div className="font-bold text-sm">{card.points}pt</div>}
        <div className="text-xs opacity-70">+{card.bonus[0].toUpperCase()}</div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${TIER_BORDER[card.tier]} bg-gray-700 text-white w-28 p-2 flex flex-col gap-1 shadow`}>
      <div className={`rounded px-1 py-0.5 text-xs font-bold text-center ${BONUS_BG[card.bonus]}`}>
        {card.points > 0 ? `${card.points} pt` : '0 pt'} · +{card.bonus}
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {colors.map(c => {
          const n = card.cost[c] ?? 0;
          if (n === 0) return null;
          return (
            <span key={c} className={`rounded px-1 text-xs font-bold ${COST_COLORS[c]}`}>{n}{c[0].toUpperCase()}</span>
          );
        })}
      </div>
      {(onBuy || onReserve) && (
        <div className="flex gap-1 mt-1">
          {onBuy && (
            <button
              className={`flex-1 text-xs rounded py-0.5 font-semibold ${canAfford ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
              onClick={canAfford ? onBuy : undefined}
              disabled={!canAfford}
            >Buy</button>
          )}
          {onReserve && (
            <button className="flex-1 text-xs rounded py-0.5 font-semibold bg-yellow-600 hover:bg-yellow-500" onClick={onReserve}>
              Hold
            </button>
          )}
        </div>
      )}
    </div>
  );
}
