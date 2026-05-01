import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startGame } from '@/lib/game-engine';
import type { GameState } from '@/types/game';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { playerId } = await req.json();

  const { data, error } = await supabase.from('games').select('state').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const state = data.state as GameState;
  if (state.hostId !== playerId) return NextResponse.json({ error: 'Only the host can start' }, { status: 403 });

  try {
    const newState = startGame(state);
    const { error: updateError } = await supabase.from('games').update({ state: newState }).eq('id', id);
    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
