'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLAYER_KEY = (gameId: string) => `splendor_player_${gameId}`;

export default function Home() {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(PLAYER_KEY(data.gameId), data.playerId);
      router.push(`/game/${data.gameId}`);
    } catch (e: unknown) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-2 text-yellow-300">Splendor</h1>
        <p className="text-gray-400">The gem trading card game — play with friends online</p>
      </div>

      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-5">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Your name</label>
          <input
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-400"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          className={`py-3 rounded-xl font-bold text-lg transition-all
            ${name.trim() ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 active:scale-95' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          onClick={handleCreate}
          disabled={creating || !name.trim()}
        >
          {creating ? 'Creating game...' : 'Create New Game'}
        </button>

        <div className="text-center text-gray-500 text-sm">
          2–4 players · Share the link with friends to join
        </div>
      </div>

      <div className="mt-8 text-gray-600 text-sm text-center max-w-xs">
        <p className="mb-1 font-semibold text-gray-500">How to play</p>
        <p>Collect gems to buy development cards. Cards give permanent bonuses. First to 15 prestige points wins!</p>
      </div>
    </div>
  );
}
