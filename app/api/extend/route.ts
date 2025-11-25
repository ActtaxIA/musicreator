import { NextResponse } from 'next/server';
import axios from 'axios';

// API REAL de Suno para EXTEND (alargar/continuar canción)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioId, prompt, continueAt, style, title } = body;

    // Validaciones según la documentación de Suno API
    if (!audioId) {
      return NextResponse.json(
        { success: false, error: 'audioId is required' },
        { status: 400 }
      );
    }

    if (continueAt === undefined || continueAt === null) {
      return NextResponse.json(
        { success: false, error: 'continueAt is required (time in seconds where to extend from)' },
        { status: 400 }
      );
    }

    if (continueAt < 0) {
      return NextResponse.json(
        { success: false, error: 'continueAt must be greater than 0' },
        { status: 400 }
      );
    }

    // Construir payload según documentación oficial
    const payload: any = {
      audioId: audioId,
      defaultParamFlag: true,
      model: 'V5', // Modelo consistente con la app
      callBackUrl: process.env.SUNO_CALLBACK_URL || 'https://webhook.site/suno-music-gen',
      // Parámetros requeridos cuando defaultParamFlag = true
      continueAt: continueAt,
      prompt: prompt || 'Continue the music with similar style and energy',
      style: style || 'original style',
      title: title || `Extended - ${style || 'Music'}`,
    };

    console.log('🎵 Extend Music Request:', {
      audioId,
      continueAt,
      model: payload.model,
      title: payload.title
    });

    // Llamar a Suno API - Extend endpoint
    const response = await axios.post(
      `${process.env.SUNO_API_BASE_URL}/api/v1/generate/extend`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000
      }
    );

    // La respuesta de Suno es: { code: 200, msg: "success", data: { taskId: "xxx" } }
    console.log('✅ Suno API Response:', response.data);

    if (response.data.code === 200 && response.data.data?.taskId) {
      return NextResponse.json({
        success: true,
        taskId: response.data.data.taskId,
      });
    } else {
      // Manejar códigos de error de Suno API según documentación
      const errorCode = response.data.code;
      const errorMsg = response.data.msg;
      
      let userMessage = errorMsg;
      switch (errorCode) {
        case 400:
          userMessage = 'Parámetros inválidos';
          break;
        case 401:
          userMessage = 'API Key inválida o expirada';
          break;
        case 429:
          userMessage = 'Créditos insuficientes en Suno API';
          break;
        case 430:
          userMessage = 'Demasiadas peticiones. Espera unos segundos';
          break;
        case 455:
          userMessage = 'Suno API en mantenimiento';
          break;
        case 500:
          userMessage = 'Error del servidor de Suno';
          break;
      }

      console.error(`❌ Suno API Error ${errorCode}:`, errorMsg);
      
      return NextResponse.json({
        success: false,
        error: userMessage,
        code: errorCode
      }, { status: errorCode === 429 || errorCode === 430 ? 429 : 500 });
    }
  } catch (error: any) {
    console.error('❌ Error extending song:', error.response?.data || error.message);
    
    // Error de red o timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return NextResponse.json({
        success: false,
        error: 'Timeout: Suno API no responde. Intenta de nuevo.',
      }, { status: 504 });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
