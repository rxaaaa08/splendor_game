'use client';
import type { Noble, RegularGemColor } from '@/types/game';

const COST_COLORS: Record<RegularGemColor, string> = {
  white: 'bg-white text-gray-800 border border-gray-300',
  blue:  'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red:   'bg-red-500 text-white',
  black: 'bg-gray-800 text-white',
};

export default function NobleDisplay({ noble }: { noble: Noble }) {
  const colors: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];
  return (
    <div className="rounded-lg border-2 border-yellow-500 bg-yellow-900 text-white w-20 p-2 flex flex-col items-center gap-1 shadow">
      <div className="text-yellow-300 font-bold text-sm">{noble.points} pt</div>
      <div className="text-xs text-center text-yellow-200">Noble</div>
      <div className="flex flex-wrap gap-1 justify-center">
        {colors.map(c => {
          const n = noble.requires[c] ?? 0;
          if (n === 0) return null;
          return (
            <span key={c} className={`rounded px-1 text-xs font-bold ${COST_COLORS[c]}`}>{n}{c[0].toUpperCase()}</span>
          );
        })}
      </div>
    </div>
  );
}
