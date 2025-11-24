import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente Admin de Supabase (Service Role) para leer canciones públicas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { songIds } = await request.json().catch(() => ({ songIds: null }));

    let query = supabaseAdmin
      .from('songs')
      .select('*')
      .eq('status', 'complete')
      .not('audio_url', 'is', null);

    if (songIds && Array.isArray(songIds) && songIds.length > 0) {
      // Si el cliente ya tiene IDs asignados, devolver ESOS ESPECÍFICOS
      query = query.in('id', songIds);
    } else {
      // Si es la primera vez, obtener canciones aleatorias
      // Nota: Supabase no tiene random() nativo fácil en query builder, 
      // así que pedimos un batch y seleccionamos 5 al azar en JS.
      // Limitamos a 50 recientes para que sean de calidad.
      query = query.order('created_at', { ascending: false }).limit(50);
    }

    const { data: songs, error } = await query;

    if (error) throw error;

    if (songIds && songIds.length > 0) {
      // Devolver las canciones solicitadas
      return NextResponse.json(songs);
    } else {
      // Seleccionar 5 aleatorias del pool
      const shuffled = songs?.sort(() => 0.5 - Math.random()) || [];
      const selected = shuffled.slice(0, 5);
      return NextResponse.json(selected);
    }

  } catch (error: any) {
    console.error('Error fetching trial songs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}




