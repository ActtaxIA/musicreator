import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook endpoint para recibir notificaciones de SunoAPI.org
 * cuando la generación de música está completa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log para debugging
    console.log('📩 Webhook recibido de SunoAPI.org:', {
      timestamp: new Date().toISOString(),
      data: JSON.stringify(body, null, 2)
    });

    // La estructura del callback según la documentación:
    // {
    //   "code": 200,
    //   "msg": "success",
    //   "data": {
    //     "taskId": "...",
    //     "status": "SUCCESS",
    //     "response": {
    //       "data": [
    //         {
    //           "id": "...",
    //           "audio_url": "...",
    //           "title": "...",
    //           ...
    //         }
    //       ]
    //     }
    //   }
    // }

    // TODO: Aquí podrías:
    // 1. Guardar en Supabase
    // 2. Enviar notificación al usuario
    // 3. Actualizar estado en tiempo real con websockets

    // Por ahora solo respondemos OK
    return NextResponse.json({ 
      success: true,
      message: 'Webhook recibido correctamente'
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando webhook',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Permitir también GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'Webhook endpoint de SunoAPI.org está funcionando'
  });
}


