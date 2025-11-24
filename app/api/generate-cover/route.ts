import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para escribir
);

export async function POST(request: NextRequest) {
  try {
    const { songId, title, genre, mood, userId } = await request.json();

    console.log('🎨 Generando cover para:', { songId, title, genre, mood });

    // 1. Construir prompt artístico para DALL-E 3
    const imagePrompt = `Professional album cover art for a ${genre} music track titled "${title}". 
Mood: ${mood}. 
Visual style: Modern, vibrant, abstract art with musical elements, cinematic lighting, 
high quality digital art, professional music industry aesthetic, colorful gradient background, 
artistic composition, 4K quality. 
NO TEXT, NO WORDS, just pure visual art representing the ${genre} genre and ${mood} mood.`;

    console.log('📝 Prompt para DALL-E:', imagePrompt);

    // 2. Generar imagen con DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard", // "standard" o "hd"
      style: "vivid", // "vivid" (vibrante) o "natural"
    });

    const tempImageUrl = response.data[0]?.url;
    if (!tempImageUrl) {
      throw new Error('DALL-E 3 no devolvió una imagen');
    }

    console.log('✅ Imagen generada por DALL-E 3');

    // 3. Descargar la imagen (las URLs de OpenAI expiran en 1 hora)
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Error descargando imagen: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    console.log('📥 Imagen descargada:', imageBlob.size, 'bytes');

    // 4. Subir a Supabase Storage
    const fileName = `${userId}/${songId}-cover.png`;
    const { error: uploadError } = await supabase.storage
      .from('songs')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Error subiendo a Supabase Storage:', uploadError);
      throw uploadError;
    }

    // 5. Obtener URL pública permanente
    const { data: urlData } = supabase.storage
      .from('songs')
      .getPublicUrl(fileName);

    const permanentImageUrl = urlData.publicUrl;
    console.log('✅ URL permanente creada:', permanentImageUrl);

    // 6. Actualizar la canción en la base de datos
    const { error: updateError } = await supabase
      .from('songs')
      .update({ image_url: permanentImageUrl })
      .eq('id', songId);

    if (updateError) {
      console.error('❌ Error actualizando BD:', updateError);
      throw updateError;
    }

    console.log('✅ Cover generado y guardado exitosamente');

    return NextResponse.json({
      success: true,
      imageUrl: permanentImageUrl,
      message: 'Cover generado con DALL-E 3',
    });
  } catch (error: any) {
    console.error('❌ Error generando cover:', error);
    
    // Mensajes de error específicos
    let errorMessage = error.message;
    if (error.message?.includes('API key')) {
      errorMessage = 'API key de OpenAI no configurada o inválida';
    } else if (error.message?.includes('insufficient_quota')) {
      errorMessage = 'Sin créditos suficientes en OpenAI';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    );
  }
}





