'use client';
import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { GameState, ActionType } from '@/types/game';
import WaitingRoom from '@/components/WaitingRoom';
import GameBoard from '@/components/GameBoard';

const PLAYER_KEY = (gameId: string) => `splendor_player_${gameId}`;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();

  const [state, setState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [error, setError] = useState('');

  const loadState = useCallback(async () => {
    const { data } = await supabase.from('games').select('state').eq('id', gameId).single();
    if (data) setState(data.state as GameState);
  }, [gameId]);

  useEffect(() => {
    const stored = localStorage.getItem(PLAYER_KEY(gameId));
    if (stored) setMyId(stored);

    loadState();

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, payload => {
        const newState = (payload.new as { state: GameState }).state;
        setState(newState);

        // Auto-redirect all players to the rematch game
        if (newState.rematchGameId) {
          const oldMyId = localStorage.getItem(PLAYER_KEY(gameId));
          // playerIdMap is stored temporarily to map old → new ID
          const newMyId = localStorage.getItem(`splendor_rematch_${newState.rematchGameId}_${oldMyId}`);
          if (newMyId) {
            localStorage.setItem(PLAYER_KEY(newState.rematchGameId), newMyId);
          }
          router.push(`/game/${newState.rematchGameId}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, loadState, router]);

  const handleJoin = async () => {
    if (!name.trim()) return;
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/game/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(PLAYER_KEY(gameId), data.playerId);
      setMyId(data.playerId);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await fetch(`/api/game/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myId }),
      });
    } catch {
      setStarting(false);
    }
  };

  const handleRematch = async () => {
    if (!myId) return;
    setRematching(true);
    try {
      const res = await fetch(`/api/game/${gameId}/rematch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Store new player IDs for all players so redirect works
      const { newGameId, playerIdMap } = data;
      for (const [oldId, newId] of Object.entries(playerIdMap as Record<string, string>)) {
        localStorage.setItem(`splendor_rematch_${newGameId}_${oldId}`, newId);
      }

      // Store host's own new ID and redirect
      const myNewId = playerIdMap[myId];
      if (myNewId) localStorage.setItem(PLAYER_KEY(newGameId), myNewId);
      router.push(`/game/${newGameId}`);
    } catch (e: unknown) {
      setError((e as Error).message);
      setRematching(false);
    }
  };

  const handleAction = useCallback(async (action: ActionType) => {
    const res = await fetch(`/api/game/${gameId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myId, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
  }, [gameId, myId]);

  if (!state) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>
  );

  if (!myId || !state.players.find(p => p.id === myId)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-2">Splendor</h1>
        {state.status !== 'waiting' ? (
          <p className="text-gray-400">This game is already in progress.</p>
        ) : (
          <>
            <p className="text-gray-400 mb-6">You&apos;ve been invited to play!</p>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-lg flex flex-col gap-4">
              <label className="text-sm text-gray-300">Your name</label>
              <input
                className="bg-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-semibold text-white disabled:opacity-50"
                onClick={handleJoin}
                disabled={joining || !name.trim()}
              >
                {joining ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (state.status === 'waiting') {
    return (
      <WaitingRoom
        gameId={gameId}
        state={state}
        myId={myId}
        onStart={handleStart}
        starting={starting}
      />
    );
  }

  return (
    <GameBoard
      gameId={gameId}
      state={state}
      myId={myId}
      isHost={myId === state.hostId}
      onAction={handleAction}
      onRematch={handleRematch}
      rematching={rematching}
    />
  );
}
