import { v4 as uuidv4 } from 'uuid';
import { ALL_CARDS, ALL_NOBLES } from './card-data';
import type {
  GameState, Player, Card, Noble, Tier,
  GemCounts, GemColor, RegularGemColor, ActionType,
} from '@/types/game';

const GEM_COLORS: RegularGemColor[] = ['white', 'blue', 'green', 'red', 'black'];
const EMPTY_GEMS = (): GemCounts => ({ white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 });

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gemCountsForPlayers(count: number): number {
  if (count === 2) return 4;
  if (count === 3) return 5;
  return 7;
}

export function createInitialState(hostId: string, hostName: string): GameState {
  const host: Player = {
    id: hostId,
    name: hostName,
    gems: EMPTY_GEMS(),
    cards: [],
    reserved: [],
    nobles: [],
    points: 0,
  };
  return {
    status: 'waiting',
    hostId,
    players: [host],
    gems: EMPTY_GEMS(),
    tiers: [
      { deck: [], visible: [null, null, null, null] },
      { deck: [], visible: [null, null, null, null] },
      { deck: [], visible: [null, null, null, null] },
    ],
    nobles: [],
    currentPlayerIndex: 0,
  };
}

export function addPlayer(state: GameState, name: string): { state: GameState; playerId: string } {
  if (state.status !== 'waiting') throw new Error('Game already started');
  if (state.players.length >= 4) throw new Error('Game is full');
  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    name,
    gems: EMPTY_GEMS(),
    cards: [],
    reserved: [],
    nobles: [],
    points: 0,
  };
  return { state: { ...state, players: [...state.players, player] }, playerId };
}

export function startGame(state: GameState): GameState {
  if (state.players.length < 2) throw new Error('Need at least 2 players');
  const n = state.players.length;
  const gemCount = gemCountsForPlayers(n);
  const bank: GemCounts = { white: gemCount, blue: gemCount, green: gemCount, red: gemCount, black: gemCount, gold: 5 };

  const tier1 = shuffle(ALL_CARDS.filter(c => c.tier === 1));
  const tier2 = shuffle(ALL_CARDS.filter(c => c.tier === 2));
  const tier3 = shuffle(ALL_CARDS.filter(c => c.tier === 3));

  const nobles = shuffle(ALL_NOBLES).slice(0, n + 1);

  const tiers: Tier[] = [
    { deck: tier1.slice(4), visible: tier1.slice(0, 4) as Card[] },
    { deck: tier2.slice(4), visible: tier2.slice(0, 4) as Card[] },
    { deck: tier3.slice(4), visible: tier3.slice(0, 4) as Card[] },
  ];

  return { ...state, status: 'active', gems: bank, tiers, nobles };
}

function cardBonus(player: Player): GemCounts {
  const bonus = EMPTY_GEMS();
  for (const card of player.cards) {
    bonus[card.bonus]++;
  }
  return bonus;
}

function totalGems(player: Player): number {
  return GEM_COLORS.reduce((s, c) => s + player.gems[c], 0) + player.gems.gold;
}

function canAfford(player: Player, card: Card): boolean {
  const bonus = cardBonus(player);
  let goldNeeded = 0;
  for (const [color, cost] of Object.entries(card.cost) as [RegularGemColor, number][]) {
    const effective = Math.max(0, cost - bonus[color] - player.gems[color]);
    goldNeeded += effective;
  }
  return goldNeeded <= player.gems.gold;
}

function applyPurchase(player: Player, card: Card, bank: GemCounts): { player: Player; bank: GemCounts } {
  const bonus = cardBonus(player);
  const newGems = { ...player.gems };
  const newBank = { ...bank };
  let goldUsed = 0;

  for (const [color, cost] of Object.entries(card.cost) as [RegularGemColor, number][]) {
    const afterBonus = Math.max(0, cost - bonus[color]);
    const fromGems = Math.min(afterBonus, newGems[color]);
    newGems[color] -= fromGems;
    newBank[color] += fromGems;
    const goldNeeded = afterBonus - fromGems;
    goldUsed += goldNeeded;
  }
  newGems.gold -= goldUsed;
  newBank.gold += goldUsed;

  const newCards = [...player.cards, card];
  const newPoints = newCards.reduce((s, c) => s + c.points, 0) + player.nobles.reduce((s, n) => s + n.points, 0);
  return {
    player: { ...player, gems: newGems, cards: newCards, points: newPoints },
    bank: newBank,
  };
}

function checkNobles(player: Player, nobles: Noble[]): { player: Player; nobles: Noble[] } {
  const bonus = cardBonus(player);
  const claimed: Noble[] = [];
  const remaining: Noble[] = [];

  for (const noble of nobles) {
    const eligible = Object.entries(noble.requires).every(
      ([color, req]) => bonus[color as RegularGemColor] >= (req ?? 0)
    );
    if (eligible && claimed.length === 0) {
      claimed.push(noble);
    } else {
      remaining.push(noble);
    }
  }

  if (claimed.length === 0) return { player, nobles };
  const newNobles = [...player.nobles, ...claimed];
  const newPoints = player.cards.reduce((s, c) => s + c.points, 0) + newNobles.reduce((s, n) => s + n.points, 0);
  return { player: { ...player, nobles: newNobles, points: newPoints }, nobles: remaining };
}

function refillVisible(tier: Tier): Tier {
  const deck = [...tier.deck];
  const visible = tier.visible.map(slot => {
    if (slot !== null) return slot;
    return deck.length > 0 ? (deck.shift() ?? null) : null;
  });
  return { deck, visible };
}

function advanceTurn(state: GameState): GameState {
  const next = (state.currentPlayerIndex + 1) % state.players.length;

  if (state.status === 'last_round' && next === state.lastRoundStarterIndex) {
    const winner = [...state.players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.cards.length - b.cards.length;
    })[0];
    return { ...state, status: 'ended', winner: winner.id, currentPlayerIndex: next };
  }

  return { ...state, currentPlayerIndex: next };
}

export function applyAction(state: GameState, playerId: string, action: ActionType): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) throw new Error('Not your turn');
  if (state.status !== 'active' && state.status !== 'last_round') throw new Error('Game not active');

  let player = { ...state.players[playerIndex] };
  let bank = { ...state.gems };
  let tiers = state.tiers.map(t => ({ ...t, visible: [...t.visible] }));
  let nobles = [...state.nobles];

  if (action.type === 'take_gems') {
    const taking = action.gems;
    const colors = Object.entries(taking).filter(([, n]) => n > 0) as [RegularGemColor, number][];

    if (colors.length === 2 && colors[0][1] === 2) {
      if (bank[colors[0][0]] < 4) throw new Error('Not enough gems to take 2');
    } else if (colors.length <= 3) {
      for (const [color] of colors) {
        if (bank[color] < 1) throw new Error(`No ${color} gems available`);
      }
      const unique = new Set(colors.map(([c]) => c));
      if (unique.size !== colors.length) throw new Error('Must take different colors for 3-gem action');
    } else {
      throw new Error('Invalid gem selection');
    }

    const newGems = { ...player.gems };
    for (const [color, n] of colors) {
      newGems[color] += n;
      bank[color] -= n;
    }

    if (totalGems({ ...player, gems: newGems }) > 10) throw new Error('Would exceed 10 gems');
    player = { ...player, gems: newGems };

  } else if (action.type === 'buy_card') {
    let card: Card | undefined;
    let cardSource: 'board' | 'reserved' = 'board';

    if (action.fromReserved) {
      const idx = player.reserved.findIndex(c => c.id === action.cardId);
      if (idx === -1) throw new Error('Card not in reserved');
      card = player.reserved[idx];
      cardSource = 'reserved';
      if (!canAfford(player, card)) throw new Error('Cannot afford card');
      const result = applyPurchase(player, card, bank);
      player = { ...result.player, reserved: player.reserved.filter((_, i) => i !== idx) };
      bank = result.bank;
    } else {
      let found = false;
      for (let t = 0; t < tiers.length; t++) {
        const slot = tiers[t].visible.findIndex(c => c?.id === action.cardId);
        if (slot !== -1) {
          card = tiers[t].visible[slot]!;
          if (!canAfford(player, card)) throw new Error('Cannot afford card');
          const result = applyPurchase(player, card, bank);
          player = result.player;
          bank = result.bank;
          tiers[t].visible[slot] = null;
          tiers[t] = refillVisible(tiers[t]);
          found = true;
          break;
        }
      }
      if (!found) throw new Error('Card not found on board');
    }
    void cardSource;

  } else if (action.type === 'reserve_card') {
    if (player.reserved.length >= 3) throw new Error('Already have 3 reserved cards');
    let card: Card | undefined;

    if (action.fromDeck !== undefined) {
      const tierIdx = action.fromDeck - 1;
      if (tiers[tierIdx].deck.length === 0) throw new Error('Deck is empty');
      const deck = [...tiers[tierIdx].deck];
      card = deck.shift()!;
      tiers[tierIdx] = { ...tiers[tierIdx], deck };
    } else {
      for (let t = 0; t < tiers.length; t++) {
        const slot = tiers[t].visible.findIndex(c => c?.id === action.cardId);
        if (slot !== -1) {
          card = tiers[t].visible[slot]!;
          tiers[t].visible[slot] = null;
          tiers[t] = refillVisible(tiers[t]);
          break;
        }
      }
    }

    if (!card) throw new Error('Card not found');
    const newGems = { ...player.gems };
    if (bank.gold > 0) {
      newGems.gold += 1;
      bank.gold -= 1;
    }
    if (totalGems({ ...player, gems: newGems }) > 10) throw new Error('Would exceed 10 gems');
    player = { ...player, gems: newGems, reserved: [...player.reserved, card] };

  } else if (action.type === 'return_gems') {
    const returning = action.gems;
    const newGems = { ...player.gems };
    const newBank = { ...bank };
    for (const [color, n] of Object.entries(returning) as [GemColor, number][]) {
      if (newGems[color] < n) throw new Error(`Not enough ${color} to return`);
      newGems[color] -= n;
      newBank[color] += n;
    }
    if (totalGems({ ...player, gems: newGems }) > 10) throw new Error('Still over 10 gems');
    player = { ...player, gems: newGems };
    bank = newBank;
  }

  // Handle claim_noble action
  if (action.type === 'claim_noble') {
    const nobleIdx = nobles.findIndex(n => n.id === action.nobleId);
    if (nobleIdx === -1) throw new Error('Noble not available');
    const noble = nobles[nobleIdx];
    const bonus = cardBonus(player);
    const eligible = Object.entries(noble.requires).every(
      ([color, req]) => bonus[color as RegularGemColor] >= (req ?? 0)
    );
    if (!eligible) throw new Error('You do not qualify for this noble');
    nobles = nobles.filter((_, i) => i !== nobleIdx);
    const newNobles = [...player.nobles, noble];
    const newPoints = player.cards.reduce((s, c) => s + c.points, 0) + newNobles.reduce((s, n) => s + n.points, 0);
    player = { ...player, nobles: newNobles, points: newPoints };
  }

  const newPlayers = state.players.map((p, i) => (i === playerIndex ? player : p));
  let newState: GameState = { ...state, players: newPlayers, gems: bank, tiers, nobles };

  // Check win condition — triggered if any player hits 15+ points
  // claim_noble and return_gems don't advance the turn
  if (action.type !== 'return_gems' && action.type !== 'claim_noble') {
    if (newState.status === 'active' && player.points >= 15) {
      newState = { ...newState, status: 'last_round', lastRoundStarterIndex: (playerIndex + 1) % newState.players.length };
    }
    newState = advanceTurn(newState);
  }

  return newState;
}
