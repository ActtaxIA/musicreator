import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'IDs son requeridos' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SUNO_API_KEY;
    const baseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key no configurada' },
        { status: 500 }
      );
    }

    // Consultar el estado usando taskId
    // Documentación: https://docs.sunoapi.org/suno-api/generate-music
    const response = await axios.get(
      `${baseUrl}/api/v1/generate/record-info?taskId=${ids}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000, // 30 segundos de timeout
      }
    );

    // La respuesta tiene formato: { code, msg, data: { taskId, status, response } }
    const taskData = response.data.data;
    
    // LOG COMPLETO para debugging
    console.log('🔍 Respuesta completa de SunoAPI:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`📊 Estado: ${taskData.status}`);
    console.log(`🎵 Response: ${taskData.response ? 'Con datos' : 'null (aún generando)'}`);
    
    // Cuando response es null, significa que aún está generando
    // Cuando response tiene sunoData, las canciones están listas
    const songs = taskData.response?.sunoData || [];
    
    console.log(`🎵 Canciones encontradas: ${songs.length}`);
    if (songs.length > 0) {
      console.log(`✅ Primera canción: ${songs[0].title} - ${songs[0].audioUrl}`);
    }
    
    // Mapear campos de SunoAPI al formato esperado por el frontend
    const mappedSongs = songs.map((song: any) => {
      // Priorizar URLs completas (no-streaming) sobre URLs de streaming
      const audioUrl = song.sourceAudioUrl || song.audioUrl || song.sourceStreamAudioUrl || song.streamAudioUrl;
      
      console.log(`📀 Canción: ${song.title}`);
      console.log(`   - audioUrl: ${song.audioUrl ? '✅' : '❌'}`);
      console.log(`   - streamAudioUrl: ${song.streamAudioUrl ? '✅' : '❌'}`);
      console.log(`   - sourceAudioUrl: ${song.sourceAudioUrl ? '✅' : '❌'}`);
      console.log(`   - sourceStreamAudioUrl: ${song.sourceStreamAudioUrl ? '✅' : '❌'}`);
      console.log(`   - Usando: ${audioUrl}`);
      console.log(`   - Duration de API: ${song.duration} (${typeof song.duration})`);
      console.log(`   - Metadata de API:`, JSON.stringify({
        duration: song.duration,
        createdAt: song.createdAt,
        status: song.status
      }));
      
      return {
        id: song.id,
        title: song.title,
        audio_url: audioUrl,
        image_url: song.imageUrl || song.sourceImageUrl,
        status: 'complete',
        // Convertir duration a número entero si existe
        duration: song.duration ? Math.floor(parseFloat(song.duration)) : null,
        tags: song.tags,
        prompt: song.prompt,
        model_name: song.modelName
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        status: taskData.status,
        songs: mappedSongs,
        taskId: taskData.taskId,
        createTime: taskData.createTime
      }
    });
  } catch (error: any) {
    console.error('Error consultando estado:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Error desconocido',
      },
      { status: error.response?.status || 500 }
    );
  }
}
