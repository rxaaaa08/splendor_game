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
  const [showPlayers, setShowPlayers] = useState(false);

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

    if (current === 2) {
      setSelectedGems(prev => ({ ...prev, [color]: 0 }));
      return;
    }

    if (current === 1) {
      if (uniqueSelected.length === 1 && inBank >= 4) {
        setSelectedGems({ [color]: 2 });
      } else {
        setSelectedGems(prev => ({ ...prev, [color]: 0 }));
      }
      return;
    }

    if (totalSelected === 0) {
      if (inBank >= 1) setSelectedGems({ [color]: 1 });
      return;
    }

    if (totalSelected === 1 && uniqueSelected[0] !== color && inBank >= 1) {
      setSelectedGems(prev => ({ ...prev, [color]: 1 }));
      return;
    }

    if (totalSelected === 2 && uniqueSelected.length === 2 && !uniqueSelected.includes(color) && inBank >= 1) {
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
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
        <p className="text-2xl text-yellow-300 mb-8">{winner?.name ?? 'Unknown'} wins! 🏆</p>
        <div className="space-y-3 w-full max-w-xs">
          {[...state.players].sort((a, b) => b.points - a.points).map((p, i) => (
            <div key={p.id} className="flex justify-between bg-gray-800 rounded-lg px-4 py-2 text-lg">
              <span className="text-gray-400">#{i + 1} {p.name}</span>
              <span className="text-yellow-300 font-bold">{p.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* YOUR TURN banner */}
      {isMyTurn && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-2 font-bold text-base md:text-lg tracking-wide animate-pulse shadow-lg">
          🎯 YOUR TURN!
        </div>
      )}

      {/* Sticky header */}
      <div className={`sticky top-0 z-40 bg-gray-900 border-b border-gray-700 px-3 py-2 flex items-center justify-between ${isMyTurn ? 'mt-10' : ''}`}>
        <h1 className="text-base font-bold">Splendor</h1>
        <div className="flex items-center gap-2">
          {state.status === 'last_round' && <span className="text-orange-400 text-xs font-semibold">Final Round!</span>}
          {isMyTurn
            ? <span className="text-green-400 font-semibold text-sm">✅ Your turn</span>
            : <span className="text-gray-300 text-sm">{currentPlayer?.name}&apos;s turn</span>}
          {/* Players toggle button for mobile */}
          <button
            className="ml-2 bg-gray-700 rounded px-2 py-1 text-xs lg:hidden"
            onClick={() => setShowPlayers(p => !p)}
          >
            👥 Players
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-800 text-red-200 px-3 py-2 text-sm">{error}</div>
      )}

      {/* Mobile players drawer */}
      {showPlayers && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 flex flex-col justify-end" onClick={() => setShowPlayers(false)}>
          <div className="bg-gray-800 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Players</h2>
              <button className="text-gray-400 text-2xl leading-none" onClick={() => setShowPlayers(false)}>×</button>
            </div>
            <div className="flex flex-col gap-2">
              {state.players.map(p => (
                <PlayerPanel
                  key={p.id}
                  player={p}
                  isActive={state.players[state.currentPlayerIndex]?.id === p.id}
                  isMe={p.id === myId}
                  onBuyReserved={isMyTurn ? (card) => { handleBuyCard(card, true); setShowPlayers(false); } : undefined}
                 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4">
        {/* Main board */}
        <div className="flex-1 min-w-0 px-2 py-2 lg:px-0">

          {/* Nobles — horizontal scroll on mobile */}
          <div className="mb-3">
            <h2 className="text-xs text-gray-400 mb-1 uppercase tracking-wider px-1">Nobles</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {state.nobles.map(n => (
                <NobleDisplay
                  key={n.id}
                  noble={n}
                  onClaim={isMyTurn ? async () => {
                    setPendingAction(true);
                    setError('');
                    try { await onAction({ type: 'claim_noble', nobleId: n.id }); }
                    catch (e: unknown) { setError((e as Error).message); }
                    finally { setPendingAction(false); }
                  } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Card tiers — each row scrolls horizontally */}
          {[2, 1, 0].map(tierIdx => {
            const tier = state.tiers[tierIdx];
            const tierNum = (tierIdx + 1) as 1 | 2 | 3;
            const tierLabel = ['', 'Level 1', 'Level 2', 'Level 3'][tierNum];
            return (
              <div key={tierIdx} className="mb-3">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <h2 className="text-xs text-gray-400 uppercase tracking-wider">{tierLabel}</h2>
                  <span className="text-xs text-gray-500">({tier.deck.length} left)</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {/* Reserve from deck */}
                  {tier.deck.length > 0 && isMyTurn && (
                    <button
                      className="flex-shrink-0 w-24 h-28 rounded-lg border-2 border-dashed border-gray-600 text-gray-500 text-xs hover:border-yellow-500 hover:text-yellow-400 active:scale-95 transition-all flex items-center justify-center text-center p-1"
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
                    >Reserve<br />from deck</button>
                  )}
                  {tier.visible.map((card, i) => (
                    card ? (
                      <div key={card.id} className="flex-shrink-0">
                        <CardDisplay
                          card={card}
                         
                          onBuy={isMyTurn ? () => handleBuyCard(card, false) : undefined}
                          onReserve={isMyTurn && me.reserved.length < 3 ? () => handleReserveCard(card) : undefined}
                        />
                      </div>
                    ) : (
                      <div key={i} className="flex-shrink-0 w-24 h-28 rounded-lg border border-dashed border-gray-700 opacity-30" />
                    )
                  ))}
                </div>
              </div>
            );
          })}

          {/* Gem bank */}
          <div className="mb-4 px-1">
            <h2 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Gem Bank</h2>
            <div className="flex gap-3 flex-wrap items-end">
              {GEM_COLORS.map(c => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <GemToken
                    color={c}
                    count={state.gems[c]}
                    size="lg"
                    onClick={isMyTurn ? () => handleGemClick(c) : undefined}
                    selected={(selectedGems[c] ?? 0) > 0}
                    disabled={!isMyTurn || pendingAction || state.gems[c] === 0}
                  />
                  {(selectedGems[c] ?? 0) > 0 && (
                    <span className="text-xs text-yellow-300 font-bold">+{selectedGems[c]}</span>
                  )}
                </div>
              ))}
              <GemToken color="gold" count={state.gems.gold} size="lg" />
            </div>

            {isMyTurn && totalSelected > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  className={`px-5 py-2 rounded-lg font-semibold text-sm active:scale-95 transition-all
                    ${myGemCount + totalSelected <= 10 ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 opacity-60 cursor-not-allowed'}`}
                  onClick={handleConfirmGems}
                  disabled={pendingAction || myGemCount + totalSelected > 10}
                >
                  Take {totalSelected} gem{totalSelected > 1 ? 's' : ''}
                </button>
                <button className="text-sm text-gray-400 hover:text-white px-3 py-2" onClick={() => setSelectedGems({})}>Cancel</button>
                {myGemCount + totalSelected > 10 && (
                  <span className="text-xs text-red-400">Over 10 gem limit!</span>
                )}
              </div>
            )}
          </div>

          {/* My stats bar — always visible at bottom on mobile */}
          <div className="lg:hidden bg-gray-800 rounded-xl p-3 mb-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm truncate">{me.name} (you)</span>
              <span className="text-yellow-300 font-bold">{me.points} pt</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(['white','blue','green','red','black','gold'] as const).map(c => {
                const n = me.gems[c];
                if (n === 0) return null;
                return <GemToken key={c} color={c} count={n} size="sm" />;
              })}
            </div>
            {me.reserved.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">Reserved ({me.reserved.length}/3)</div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {me.reserved.map(card => (
                    <div key={card.id} className="flex-shrink-0">
                      <CardDisplay
                        card={card}
                       
                        onBuy={isMyTurn ? () => handleBuyCard(card, true) : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop players sidebar */}
        <div className="hidden lg:flex lg:w-64 flex-col gap-2">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">Players</h2>
          {state.players.map(p => (
            <PlayerPanel
              key={p.id}
              player={p}
              isActive={state.players[state.currentPlayerIndex]?.id === p.id}
              isMe={p.id === myId}
              onBuyReserved={isMyTurn ? (card) => handleBuyCard(card, true) : undefined}
             
            />
          ))}
        </div>
      </div>
    </div>
  );
}
