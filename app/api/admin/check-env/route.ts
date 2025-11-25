import { NextResponse } from 'next/server';

// Endpoint temporal para verificar variables de entorno
export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Falta',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada (primeros 10 chars): ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) : '❌ Falta',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada (primeros 10 chars): ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) : '❌ Falta',
  };

  return NextResponse.json(envCheck);
}


