import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}


