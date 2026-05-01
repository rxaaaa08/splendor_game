'use client';
import type { Player, GemColor, RegularGemColor, Card } from '@/types/game';
import GemToken from './GemToken';
import CardDisplay from './CardDisplay';

const GEM_COLORS: GemColor[] = ['white', 'blue', 'green', 'red', 'black', 'gold'];
const REG_COLORS: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];

interface Props {
  player: Player;
  isActive: boolean;
  isMe: boolean;
  onBuyReserved?: (card: Card) => void;
  canAfford?: (card: Card) => boolean;
}

export default function PlayerPanel({ player, isActive, isMe, onBuyReserved, canAfford }: Props) {
  const bonusByColor = REG_COLORS.reduce((acc, c) => {
    acc[c] = player.cards.filter(card => card.bonus === c).length;
    return acc;
  }, {} as Record<RegularGemColor, number>);

  return (
    <div className={`rounded-lg p-3 border-2 transition-all ${isActive ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 bg-gray-800'} ${isMe ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white truncate max-w-[120px]">{player.name}</span>
        <span className="text-yellow-300 font-bold text-lg">{player.points} pt</span>
      </div>
      {isActive && <div className="text-xs text-yellow-300 mb-2 font-semibold">Your turn</div>}

      {/* Gems */}
      <div className="flex flex-wrap gap-1 mb-2">
        {GEM_COLORS.map(c => {
          const n = player.gems[c];
          if (n === 0) return null;
          return <GemToken key={c} color={c} count={n} size="sm" />;
        })}
      </div>

      {/* Card bonuses */}
      <div className="flex flex-wrap gap-1 mb-2">
        {REG_COLORS.map(c => {
          const n = bonusByColor[c];
          if (n === 0) return null;
          return (
            <span key={c} className="text-xs bg-gray-600 rounded px-1 py-0.5 text-white">
              {n}× {c[0].toUpperCase()}
            </span>
          );
        })}
      </div>

      {/* Reserved cards */}
      {player.reserved.length > 0 && (
        <div className="mt-1">
          <div className="text-xs text-gray-400 mb-1">Reserved ({player.reserved.length}/3)</div>
          <div className="flex flex-wrap gap-1">
            {player.reserved.map(card => (
              <CardDisplay
                key={card.id}
                card={card}
                canAfford={canAfford?.(card)}
                onBuy={isMe && onBuyReserved ? () => onBuyReserved(card) : undefined}
                compact={!isMe}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nobles claimed */}
      {player.nobles.length > 0 && (
        <div className="text-xs text-yellow-300 mt-1">{player.nobles.length} noble{player.nobles.length > 1 ? 's' : ''} claimed</div>
      )}
    </div>
  );
}
