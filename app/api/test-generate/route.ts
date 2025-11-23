import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const errors: any[] = [];
  
  try {
    logs.push('=== TEST DE GENERACIÓN DE MÚSICA ===');
    logs.push(`Timestamp: ${new Date().toISOString()}`);
    logs.push('');

    // 1. Verificar variables de entorno
    logs.push('1. Verificando variables de entorno...');
    const apiKey = process.env.SUNO_API_KEY;
    const baseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org';
    
    if (!apiKey) {
      errors.push('❌ SUNO_API_KEY no está configurada');
      logs.push('❌ ERROR: API Key no encontrada');
    } else {
      logs.push(`✅ API Key encontrada: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    }
    
    logs.push(`✅ Base URL: ${baseUrl}`);
    logs.push('');

    // 2. Verificación de API Key
    logs.push('2. Verificando autenticación con SunoAPI.org...');
    logs.push('⚠️ Saltando verificación de créditos (endpoint no disponible públicamente)');
    logs.push('✅ Procediendo directamente a test de generación...');
    logs.push('');

    // 3. Probar generación de música
    logs.push('3. Probando generación de música...');
      const testPrompt = 'A peaceful acoustic guitar melody with soft vocals, folk style';
      logs.push(`Prompt de prueba: "${testPrompt}"`);
      
      try {
        // callBackUrl es REQUERIDO según la respuesta del API
        const generatePayload = {
          prompt: testPrompt,
          customMode: false,
          instrumental: false,
          model: 'V3_5',
          callBackUrl: 'https://webhook.site/unique-url-here' // URL de prueba
        };
      
      logs.push(`Payload: ${JSON.stringify(generatePayload, null, 2)}`);
      logs.push(`Endpoint: ${baseUrl}/api/custom_generate`);
      
      // Usar endpoint correcto según documentación oficial
      logs.push(`   Endpoint: ${baseUrl}/api/v1/generate`);
      const generateResponse = await axios.post(
        `${baseUrl}/api/v1/generate`,
        generatePayload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      logs.push(`✅ Generación iniciada exitosamente`);
      logs.push(`📊 Respuesta completa:`);
      logs.push(JSON.stringify(generateResponse.data, null, 2));
      
      const taskId = generateResponse.data?.data?.taskId;
      
      if (taskId) {
        logs.push(`✅ Task ID obtenido: ${taskId}`);
        
        // 4. Probar consulta de estado
        logs.push('');
        logs.push('4. Probando consulta de estado...');
        
        try {
          const statusResponse = await axios.get(
            `${baseUrl}/api/v1/generate/record-info?taskId=${taskId}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
              timeout: 10000
            }
          );
          
          logs.push(`✅ Consulta de estado exitosa`);
          logs.push(`📊 Estado de la tarea:`);
          logs.push(JSON.stringify(statusResponse.data, null, 2));
        } catch (statusError: any) {
          errors.push({
            step: 'Consulta de estado',
            error: statusError.message,
            response: statusError.response?.data,
            status: statusError.response?.status
          });
          logs.push(`❌ Error consultando estado: ${statusError.message}`);
          if (statusError.response) {
            logs.push(`   Status: ${statusError.response.status}`);
            logs.push(`   Data: ${JSON.stringify(statusError.response.data, null, 2)}`);
          }
        }
      } else {
        logs.push(`⚠️ No se obtuvo Task ID en la respuesta`);
      }

    } catch (generateError: any) {
      errors.push({
        step: 'Generación',
        error: generateError.message,
        response: generateError.response?.data,
        status: generateError.response?.status,
        config: {
          url: generateError.config?.url,
          method: generateError.config?.method,
          headers: generateError.config?.headers,
          data: generateError.config?.data
        }
      });
      logs.push(`❌ Error en generación: ${generateError.message}`);
      if (generateError.response) {
        logs.push(`   Status: ${generateError.response.status}`);
        logs.push(`   Headers: ${JSON.stringify(generateError.response.headers, null, 2)}`);
        logs.push(`   Data: ${JSON.stringify(generateError.response.data, null, 2)}`);
      }
      if (generateError.code) {
        logs.push(`   Code: ${generateError.code}`);
      }
    }

    logs.push('');
    logs.push('=== FIN DEL TEST ===');

    return NextResponse.json({
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      logs,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalTests: 4,
        passed: 4 - errors.length,
        failed: errors.length
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    logs.push(`💥 ERROR CRÍTICO: ${error.message}`);
    logs.push(error.stack);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      logs,
      criticalError: {
        message: error.message,
        stack: error.stack
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

