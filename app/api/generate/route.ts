import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt,           // Descripción completa del estilo/género/mood/tema
      customPrompt,     // Tema adicional del usuario (opcional)
      make_instrumental = false, 
      title, 
      genre, 
      voiceType,
      language = 'spanish',
      model = 'V5'      // Modelo IA seleccionado (default: V5)
    } = body;

    const apiKey = process.env.SUNO_API_KEY;
    const baseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key no configurada' },
        { status: 500 }
      );
    }

    // SEGÚN LA DOCUMENTACIÓN: https://docs.sunoapi.org/suno-api/generate-music
    // Con customMode: FALSE (mejor para generación automática de letras)
    // - prompt: Descripción completa del estilo, género, mood, tema (max 500 chars)
    // - La IA genera letras automáticamente basándose en el prompt
    // - No necesita title ni style

    // Construir prompt completo
    let fullPrompt = prompt || 'Pop music';

    // Si hay tema personalizado, añadirlo
    if (customPrompt && customPrompt.trim()) {
      fullPrompt += `. Theme and lyrics about: ${customPrompt.trim()}`;
    }

    // Limitar a 500 caracteres para customMode: false
    if (fullPrompt.length > 500) {
      fullPrompt = fullPrompt.substring(0, 497) + '...';
    }

    console.log('📤 Enviando a SunoAPI (customMode: false - letras auto-generadas):');
    console.log('  - prompt:', fullPrompt);
    console.log('  - instrumental:', make_instrumental);
    console.log('  - model:', model);

    // Payload según documentación oficial (customMode: false)
    const payload: any = {
      prompt: fullPrompt,
      customMode: false,           // EXPLÍCITO: false para auto-generar letras
      instrumental: make_instrumental,
      model: model,                // Modelo seleccionado por el usuario (V5 por defecto)
      callBackUrl: process.env.SUNO_CALLBACK_URL || 'https://webhook.site/suno-music-gen'
    };

    // Determinar modelo fallback según el modelo seleccionado
    const fallbackModel = model === 'V5' ? 'V4' : 
                         model === 'V4_5PLUS' ? 'V4_5' :
                         model === 'V4_5' ? 'V4' :
                         model === 'V4' ? 'V3_5' : 'V3_5';

    // Probar con el modelo seleccionado (si falla, usar fallback)
    let response;
    try {
      response = await axios.post(
        `${baseUrl}/api/v1/generate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000 // 60 segundos (aumentado)
        }
      );
      console.log(`✅ ${model} funcionó correctamente`);
    } catch (modelError: any) {
      // Si el modelo falla (no disponible), intentar con fallback
      console.log(`⚠️ ${model} no disponible o timeout, intentando con ${fallbackModel}...`);
      console.log(`Error ${model}:`, modelError.code || modelError.response?.data || modelError.message);
      
      payload.model = fallbackModel;
      try {
        console.log(`🔄 Reintentando con ${fallbackModel} y timeout extendido...`);
        response = await axios.post(
          `${baseUrl}/api/v1/generate`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000 // 60 segundos (aumentado)
          }
        );
        console.log(`✅ ${fallbackModel} funcionó correctamente`);
      } catch (fallbackError: any) {
        console.error(`❌ ${fallbackModel} también falló:`, fallbackError.code || fallbackError.response?.data || fallbackError.message);
        
        // Si es timeout, dar mensaje más claro
        if (fallbackError.code === 'ETIMEDOUT' || fallbackError.code === 'ECONNABORTED') {
          throw new Error('⏱️ Timeout: SunoAPI no está respondiendo. Puede estar temporalmente caído o sobrecargado. Intenta de nuevo en unos minutos.');
        }
        
        throw fallbackError; // Re-lanzar el error para que lo capture el catch principal
      }
    }

    // LOG COMPLETO de la respuesta
    console.log('🎵 Respuesta de SunoAPI generate:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extraer taskId con validación flexible
    const taskId = response.data?.data?.taskId;
    
    if (!taskId) {
      console.error('❌ No se encontró taskId en la respuesta de SunoAPI');
      console.error('📊 Estructura recibida:', JSON.stringify(response.data, null, 2));
      return NextResponse.json({
        success: false,
        error: 'SunoAPI no devolvió un taskId válido',
        details: response.data
      }, { status: 500 });
    }
    
    console.log(`✅ Task ID generado: ${taskId}`);
    
    // La respuesta incluye un taskId que necesitamos devolver
    return NextResponse.json({
      success: true,
      data: {
        taskId: taskId,
        message: 'Generación iniciada. Usa el taskId para consultar el estado.'
      }
    });
  } catch (error: any) {
    console.error('Error generando música:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // Detectar error de créditos insuficientes
    const apiResponse = error.response?.data;
    let userFriendlyError = error.response?.data?.msg || error.response?.data?.message || error.message || 'Error desconocido';
    
    if (apiResponse?.code === 429 || apiResponse?.msg?.includes('insufficient')) {
      userFriendlyError = '💳 Créditos insuficientes en SunoAPI. Por favor recarga créditos en: https://sunoapi.org/api-key';
    }
    
    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
