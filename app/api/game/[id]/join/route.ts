import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addPlayer } from '@/lib/game-engine';
import type { GameState } from '@/types/game';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const { data, error } = await supabase.from('games').select('state').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  try {
    const { state, playerId } = addPlayer(data.state as GameState, name.trim());
    const { error: updateError } = await supabase.from('games').update({ state }).eq('id', id);
    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ playerId });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
