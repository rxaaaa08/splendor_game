import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { createInitialState } from '@/lib/game-engine';

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const hostId = uuidv4();
  const state = createInitialState(hostId, name.trim());

  const { data, error } = await supabase
    .from('games')
    .insert({ state })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ gameId: data.id, playerId: hostId });
}
