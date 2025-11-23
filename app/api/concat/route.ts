import { NextResponse } from 'next/server';
import axios from 'axios';

// API REAL de Suno para CONCAT (unir extensiones en canción completa)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clipIds } = body;

    if (!clipIds || !Array.isArray(clipIds) || clipIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'clipIds array with at least 2 IDs is required' },
        { status: 400 }
      );
    }

    // Llamar a Suno API - Concat endpoint
    // Nota: Este endpoint une múltiples clips en uno solo
    const response = await axios.post(
      `${process.env.SUNO_API_BASE_URL}/api/v1/audio/concat`,
      {
        clipIds: clipIds,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error concatenating clips:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
