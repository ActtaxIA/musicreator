import { NextResponse } from 'next/server';
import axios from 'axios';

// API REAL de Suno para STEMS (separar vocals + instrumental)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioId } = body;

    if (!audioId) {
      return NextResponse.json(
        { success: false, error: 'audioId is required' },
        { status: 400 }
      );
    }

    // Llamar a Suno API - Generate Stems endpoint
    // Nota: En sunoapi.org, el endpoint correcto es /api/v1/audio/separation
    const response = await axios.post(
      `${process.env.SUNO_API_BASE_URL}/api/v1/audio/separation`,
      {
        audioId: audioId,
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
    console.error('Error generating stems:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
