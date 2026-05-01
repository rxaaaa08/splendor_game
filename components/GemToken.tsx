'use client';
import type { GemColor } from '@/types/game';

const GEM_STYLES: Record<GemColor, string> = {
  white:  'bg-white border-gray-300 text-gray-800',
  blue:   'bg-blue-500 border-blue-700 text-white',
  green:  'bg-green-500 border-green-700 text-white',
  red:    'bg-red-500 border-red-700 text-white',
  black:  'bg-gray-800 border-gray-600 text-white',
  gold:   'bg-yellow-400 border-yellow-600 text-gray-800',
};

const GEM_LABELS: Record<GemColor, string> = {
  white: '◇', blue: '◆', green: '◆', red: '◆', black: '◆', gold: '★',
};

interface Props {
  color: GemColor;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export default function GemToken({ color, count, size = 'md', onClick, selected, disabled }: Props) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <button
      className={`relative rounded-full border-2 flex items-center justify-center font-bold transition-all
        ${sizes[size]} ${GEM_STYLES[color]}
        ${onClick && !disabled ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
        ${selected ? 'ring-4 ring-yellow-300 scale-110' : ''}
        ${disabled ? 'opacity-40' : ''}
      `}
      onClick={onClick}
      disabled={!onClick || disabled}
      type="button"
    >
      {GEM_LABELS[color]}
      {count !== undefined && (
        <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {count}
        </span>
      )}
    </button>
  );
}
