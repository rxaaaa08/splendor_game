import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createInitialState, addPlayer } from '@/lib/game-engine';
import { startGame } from '@/lib/game-engine';
import type { GameState } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { playerId } = await req.json();

  const { data, error } = await supabase.from('games').select('state').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const oldState = data.state as GameState;
  if (oldState.hostId !== playerId) return NextResponse.json({ error: 'Only the host can start a rematch' }, { status: 403 });
  if (oldState.status !== 'ended') return NextResponse.json({ error: 'Game not over yet' }, { status: 400 });

  // Create new game with same players, new IDs
  const newHostId = uuidv4();
  const hostName = oldState.players.find(p => p.id === oldState.hostId)?.name ?? 'Host';
  let newState = createInitialState(newHostId, hostName);

  // Map old player IDs to new ones so we can return them
  const playerIdMap: Record<string, string> = { [oldState.hostId]: newHostId };

  for (const p of oldState.players) {
    if (p.id === oldState.hostId) continue;
    const result = addPlayer(newState, p.name);
    newState = result.state;
    playerIdMap[p.id] = result.playerId;
  }

  newState = startGame(newState);

  // Insert new game
  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert({ state: newState })
    .select('id')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Write rematchGameId into the old game so all clients get notified
  await supabase
    .from('games')
    .update({ state: { ...oldState, rematchGameId: newGame.id } })
    .eq('id', id);

  return NextResponse.json({ newGameId: newGame.id, playerIdMap });
}
