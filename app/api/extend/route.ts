import { NextResponse } from 'next/server';
import axios from 'axios';

// API REAL de Suno para EXTEND (alargar/continuar canción)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioId, prompt, continueAt, style } = body;

    if (!audioId) {
      return NextResponse.json(
        { success: false, error: 'audioId is required' },
        { status: 400 }
      );
    }

    // Llamar a Suno API - Extend endpoint
    const response = await axios.post(
      `${process.env.SUNO_API_BASE_URL}/api/v1/generate/extend`,
      {
        audioId: audioId,
        prompt: prompt || 'Continue the music with similar style',
        continueAt: continueAt || 0,
        style: style || '',
        title: `Extended - ${style}`,
        model: 'V5', // Usar el mismo modelo que la canción original
        defaultParamFlag: true,
        callBackUrl: process.env.SUNO_CALLBACK_URL || 'https://webhook.site/suno-music-gen'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    );

    // La respuesta de Suno es: { code: 200, msg: "success", data: { taskId: "xxx" } }
    if (response.data.code === 200 && response.data.data?.taskId) {
      return NextResponse.json({
        success: true,
        taskId: response.data.data.taskId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.data.msg || 'Error desconocido',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error extending song:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
