import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { applyAction } from '@/lib/game-engine';
import type { GameState, ActionType } from '@/types/game';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { playerId, action } = await req.json() as { playerId: string; action: ActionType };

  const { data, error } = await supabase.from('games').select('state').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  try {
    const newState = applyAction(data.state as GameState, playerId, action);
    const { error: updateError } = await supabase.from('games').update({ state: newState }).eq('id', id);
    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
