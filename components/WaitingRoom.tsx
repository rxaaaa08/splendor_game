'use client';
import type { GameState } from '@/types/game';

interface Props {
  gameId: string;
  state: GameState;
  myId: string;
  onStart: () => void;
  starting: boolean;
}

export default function WaitingRoom({ gameId, state, myId, onStart, starting }: Props) {
  const isHost = myId === state.hostId;
  const gameUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2">Splendor</h1>
      <p className="text-gray-400 mb-6">Waiting for players...</p>

      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mb-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Players ({state.players.length}/4)</h2>
        <ul className="space-y-2">
          {state.players.map(p => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              <span>{p.name}</span>
              {p.id === state.hostId && <span className="text-xs text-yellow-400 ml-1">(host)</span>}
              {p.id === myId && <span className="text-xs text-blue-400 ml-1">(you)</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 w-full max-w-md mb-6 shadow">
        <p className="text-sm text-gray-400 mb-2">Share this link with friends:</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-700 rounded px-3 py-1 text-sm text-gray-200 truncate"
            readOnly
            value={gameUrl}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-medium"
            onClick={() => navigator.clipboard.writeText(gameUrl)}
          >Copy</button>
        </div>
      </div>

      {isHost && (
        <button
          className={`px-8 py-3 rounded-xl text-lg font-bold transition-all
            ${state.players.length >= 2
              ? 'bg-green-600 hover:bg-green-500 active:scale-95'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          onClick={onStart}
          disabled={state.players.length < 2 || starting}
        >
          {starting ? 'Starting...' : `Start Game (${state.players.length} players)`}
        </button>
      )}
      {!isHost && (
        <p className="text-gray-500 text-sm">Waiting for the host to start...</p>
      )}
    </div>
  );
}
