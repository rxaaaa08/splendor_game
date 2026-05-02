'use client';
import type { Noble, RegularGemColor } from '@/types/game';

const COST_GEM: Record<RegularGemColor, string> = {
  white: 'bg-white border border-gray-300 text-gray-800',
  blue:  'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red:   'bg-red-500 text-white',
  black: 'bg-gray-700 text-white',
};

const GEM_COLORS: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];

export default function NobleDisplay({ noble }: { noble: Noble }) {
  return (
    <div className="flex-shrink-0 rounded-xl border-2 border-yellow-400 bg-yellow-950 w-20 flex flex-col items-center py-2 px-1 gap-1 shadow-lg">
      <span className="text-yellow-300 font-black text-xl leading-none">{noble.points}</span>
      <span className="text-yellow-500 text-xs">Noble</span>
      <div className="flex flex-col gap-1 items-center mt-1">
        {GEM_COLORS.map(c => {
          const n = noble.requires[c] ?? 0;
          if (n === 0) return null;
          return (
            <div key={c} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold shadow ${COST_GEM[c]}`}>
              <span>{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
