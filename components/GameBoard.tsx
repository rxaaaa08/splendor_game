'use client';
import { useState, useCallback } from 'react';
import type { GameState, Card, RegularGemColor, ActionType } from '@/types/game';
import GemToken from './GemToken';
import CardDisplay from './CardDisplay';
import NobleDisplay from './NobleDisplay';
import PlayerPanel from './PlayerPanel';

const GEM_COLORS: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];

function cardBonus(cards: Card[]): Record<RegularGemColor, number> {
  const b: Record<RegularGemColor, number> = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  for (const c of cards) b[c.bonus]++;
  return b;
}

function canAffordCard(player: { gems: GameState['gems']; cards: Card[] }, card: Card): boolean {
  const bonus = cardBonus(player.cards);
  let goldNeeded = 0;
  for (const [color, cost] of Object.entries(card.cost) as [RegularGemColor, number][]) {
    const effective = Math.max(0, cost - bonus[color] - player.gems[color]);
    goldNeeded += effective;
  }
  return goldNeeded <= player.gems.gold;
}

interface Props {
  gameId: string;
  state: GameState;
  myId: string;
  onAction: (action: ActionType) => Promise<void>;
}

export default function GameBoard({ gameId: _gameId, state, myId, onAction }: Props) {
  const [selectedGems, setSelectedGems] = useState<Partial<Record<RegularGemColor, number>>>({});
  const [pendingAction, setPendingAction] = useState(false);
  const [error, setError] = useState('');

  const me = state.players.find(p => p.id === myId)!;
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === myId;

  const totalSelected = Object.values(selectedGems).reduce((s, n) => s + (n ?? 0), 0);
  const myGemCount = GEM_COLORS.reduce((s, c) => s + me.gems[c], 0) + me.gems.gold;

  const handleGemClick = useCallback((color: RegularGemColor) => {
    if (!isMyTurn || pendingAction) return;
    const current = selectedGems[color] ?? 0;
    const inBank = state.gems[color];
    const colors = Object.keys(selectedGems) as RegularGemColor[];
    const uniqueSelected = colors.filter(c => (selectedGems[c] ?? 0) > 0);

    if (current > 0) {
      setSelectedGems(prev => ({ ...prev, [color]: 0 }));
      return;
    }

    if (totalSelected === 0) {
      if (inBank >= 1) setSelectedGems({ [color]: 1 });
      return;
    }

    if (totalSelected === 1 && uniqueSelected.length === 1 && uniqueSelected[0] === color) {
      if (inBank >= 4 && current === 1) setSelectedGems({ [color]: 2 });
      return;
    }

    if (totalSelected === 1 && uniqueSelected[0] !== color && inBank >= 1) {
      setSelectedGems(prev => ({ ...prev, [color]: 1 }));
      return;
    }

    if (totalSelected === 2 && uniqueSelected.length === 2 && inBank >= 1) {
      setSelectedGems(prev => ({ ...prev, [color]: 1 }));
    }
  }, [isMyTurn, pendingAction, selectedGems, state.gems, totalSelected]);

  const handleConfirmGems = async () => {
    if (totalSelected === 0) return;
    const gems = Object.fromEntries(
      Object.entries(selectedGems).filter(([, n]) => (n ?? 0) > 0)
    ) as Partial<Record<RegularGemColor, number>>;

    setPendingAction(true);
    setError('');
    try {
      await onAction({ type: 'take_gems', gems });
      setSelectedGems({});
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPendingAction(false);
    }
  };

  const handleBuyCard = async (card: Card, fromReserved: boolean) => {
    setPendingAction(true);
    setError('');
    try {
      await onAction({ type: 'buy_card', cardId: card.id, fromReserved });
      setSelectedGems({});
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPendingAction(false);
    }
  };

  const handleReserveCard = async (card: Card) => {
    setPendingAction(true);
    setError('');
    try {
      await onAction({ type: 'reserve_card', cardId: card.id });
      setSelectedGems({});
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPendingAction(false);
    }
  };

  if (state.status === 'ended') {
    const winner = state.players.find(p => p.id === state.winner);
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
        <p className="text-2xl text-yellow-300 mb-8">{winner?.name ?? 'Unknown'} wins!</p>
        <div className="space-y-2">
          {[...state.players].sort((a, b) => b.points - a.points).map((p, i) => (
            <div key={p.id} className="flex gap-4 text-lg">
              <span className="text-gray-400">#{i + 1}</span>
              <span>{p.name}</span>
              <span className="text-yellow-300 font-bold">{p.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Splendor</h1>
        <div className="text-sm text-gray-400">
          {state.status === 'last_round' && <span className="text-orange-400 font-semibold mr-2">Final Round!</span>}
          {isMyTurn ? <span className="text-green-400 font-semibold">Your turn</span> : <span>{currentPlayer?.name}&apos;s turn</span>}
        </div>
      </div>

      {error && (
        <div className="bg-red-800 text-red-200 rounded px-3 py-2 text-sm mb-3">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main board */}
        <div className="flex-1">
          {/* Nobles */}
          <div className="mb-4">
            <h2 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Nobles</h2>
            <div className="flex flex-wrap gap-2">
              {state.nobles.map(n => <NobleDisplay key={n.id} noble={n} />)}
            </div>
          </div>

          {/* Card tiers */}
          {[2, 1, 0].map(tierIdx => {
            const tier = state.tiers[tierIdx];
            const tierNum = (tierIdx + 1) as 1 | 2 | 3;
            const tierLabel = ['', 'Level 1', 'Level 2', 'Level 3'][tierNum];
            return (
              <div key={tierIdx} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xs text-gray-400 uppercase tracking-wider">{tierLabel}</h2>
                  <span className="text-xs text-gray-500">({tier.deck.length} left)</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Deck placeholder — click to reserve blind */}
                  {tier.deck.length > 0 && isMyTurn && (
                    <button
                      className="w-28 h-24 rounded-lg border-2 border-dashed border-gray-600 text-gray-500 text-sm hover:border-yellow-500 hover:text-yellow-400 transition-all flex items-center justify-center"
                      onClick={async () => {
                        setPendingAction(true);
                        setError('');
                        try {
                          await onAction({ type: 'reserve_card', cardId: '', fromDeck: tierNum });
                          setSelectedGems({});
                        } catch (e: unknown) {
                          setError((e as Error).message);
                        } finally {
                          setPendingAction(false);
                        }
                      }}
                      disabled={pendingAction || me.reserved.length >= 3}
                    >Reserve from deck</button>
                  )}
                  {tier.visible.map((card, i) => (
                    card ? (
                      <CardDisplay
                        key={card.id}
                        card={card}
                        canAfford={canAffordCard(me, card)}
                        onBuy={isMyTurn ? () => handleBuyCard(card, false) : undefined}
                        onReserve={isMyTurn && me.reserved.length < 3 ? () => handleReserveCard(card) : undefined}
                      />
                    ) : (
                      <div key={i} className="w-28 h-24 rounded-lg border border-dashed border-gray-700 opacity-30" />
                    )
                  ))}
                </div>
              </div>
            );
          })}

          {/* Gem bank */}
          <div className="mb-4">
            <h2 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Gem Bank</h2>
            <div className="flex flex-wrap gap-2 items-end">
              {GEM_COLORS.map(c => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <GemToken
                    color={c}
                    count={state.gems[c]}
                    size="md"
                    onClick={isMyTurn ? () => handleGemClick(c) : undefined}
                    selected={(selectedGems[c] ?? 0) > 0}
                    disabled={!isMyTurn || pendingAction || state.gems[c] === 0}
                  />
                  {(selectedGems[c] ?? 0) > 0 && (
                    <span className="text-xs text-yellow-300">+{selectedGems[c]}</span>
                  )}
                </div>
              ))}
              <GemToken color="gold" count={state.gems.gold} size="md" />
            </div>
            {isMyTurn && totalSelected > 0 && (
              <div className="mt-3 flex gap-2 items-center">
                <button
                  className={`px-4 py-1.5 rounded font-semibold text-sm transition-all
                    ${myGemCount + totalSelected <= 10 ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 opacity-60 cursor-not-allowed'}`}
                  onClick={handleConfirmGems}
                  disabled={pendingAction || myGemCount + totalSelected > 10}
                >
                  Take {totalSelected} gem{totalSelected > 1 ? 's' : ''}
                </button>
                <button className="text-sm text-gray-400 hover:text-white" onClick={() => setSelectedGems({})}>Cancel</button>
                {myGemCount + totalSelected > 10 && (
                  <span className="text-xs text-red-400">Would exceed 10 gems ({myGemCount} + {totalSelected})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Players sidebar */}
        <div className="lg:w-64 flex flex-col gap-2">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">Players</h2>
          {state.players.map(p => (
            <PlayerPanel
              key={p.id}
              player={p}
              isActive={state.players[state.currentPlayerIndex]?.id === p.id}
              isMe={p.id === myId}
              onBuyReserved={isMyTurn ? (card) => handleBuyCard(card, true) : undefined}
              canAfford={(card) => canAffordCard(me, card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
