export type GemColor = 'white' | 'blue' | 'green' | 'red' | 'black' | 'gold';
export type RegularGemColor = Exclude<GemColor, 'gold'>;

export interface GemCounts {
  white: number;
  blue: number;
  green: number;
  red: number;
  black: number;
  gold: number;
}

export interface Card {
  id: string;
  tier: 1 | 2 | 3;
  bonus: RegularGemColor;
  points: number;
  cost: Partial<Record<RegularGemColor, number>>;
}

export interface Noble {
  id: string;
  points: number;
  requires: Partial<Record<RegularGemColor, number>>;
}

export interface Tier {
  deck: Card[];
  visible: (Card | null)[];
}

export interface Player {
  id: string;
  name: string;
  gems: GemCounts;
  cards: Card[];
  reserved: Card[];
  nobles: Noble[];
  points: number;
}

export type GameStatus = 'waiting' | 'active' | 'last_round' | 'ended';

export interface GameState {
  status: GameStatus;
  hostId: string;
  players: Player[];
  gems: GemCounts;
  tiers: Tier[];
  nobles: Noble[];
  currentPlayerIndex: number;
  lastRoundStarterIndex?: number;
  winner?: string;
}

export type ActionType =
  | { type: 'take_gems'; gems: Partial<Record<RegularGemColor, number>> }
  | { type: 'buy_card'; cardId: string; fromReserved: boolean }
  | { type: 'reserve_card'; cardId: string; fromDeck?: 1 | 2 | 3 }
  | { type: 'return_gems'; gems: Partial<Record<RegularGemColor, number>> }
  | { type: 'claim_noble'; nobleId: string };
