# 🎵 Integración con Suno API - Documentación Técnica

## 📋 Resumen

Este documento explica cómo se integra Ondeon con [SunoAPI.org](https://docs.sunoapi.org/suno-api/generate-music) para generar música con IA.

---

## 🔧 Configuración Actual

### ✅ Modo de Operación: `customMode: false`

Usamos `customMode: false` porque:
- ✅ La IA genera **letras creativas automáticamente**
- ✅ Las letras **NO repiten literalmente** el prompt
- ✅ Más flexible y natural
- ✅ Mejor para generación automática

### ❌ NO usamos `customMode: true` porque:
- ❌ Requiere letras exactas en el `prompt`
- ❌ La IA canta literalmente lo que pongas
- ❌ Menos creativo y más rígido

---

## 📤 Estructura del Request

### Endpoint
```
POST https://api.sunoapi.org/api/v1/generate
```

### Headers
```json
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

### Payload (customMode: false)

```json
{
  "prompt": "mysterious Flamenco, classic traditional authentic style, authentic Spanish flamenco, flamenco guitar with rasgueado and alzapúa technique, palmas 12-beat compás, percussive flamenco cajón, rhythmic zapateado footwork, characteristic quejío vocal cry, medium tempo 93 BPM, intense energy, FEMALE LEAD VOCALS, woman singer, female voice, female vocals, female singer, spanish lyrics, sung in Spanish, letra en español. Theme and lyrics about: amor perdido en el mar",
  "customMode": false,
  "instrumental": false,
  "model": "V5",
  "callBackUrl": "https://webhook.site/suno-music-gen"
}
```

### Parámetros

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `prompt` | string | Descripción completa del estilo, género, mood, tema (max 500 chars) | "energetic Techno, pure techno with analog synthesizers..." |
| `customMode` | boolean | **false** = letras auto-generadas, **true** = letras literales | `false` |
| `instrumental` | boolean | **true** = sin voz, **false** = con voz | `false` |
| `model` | string | Modelo de IA: **V5** (recomendado), V4_5PLUS, V4_5, V4, V3_5 | `"V5"` |
| `callBackUrl` | string | URL para recibir notificaciones cuando termine | `"https://webhook.site/xxx"` |

---

## 🎨 Construcción del Prompt

### 1. Interfaz en Español → Prompt en Inglés

**Usuario configura (español):**
- Género: Flamenco
- Mood: Misterioso
- Estilo: Clásico
- Tempo: 93 BPM
- Energía: Intenso
- Voz: Femenina
- Idioma: Español

**Prompt generado (inglés):**
```
mysterious Flamenco, classic traditional authentic style, authentic Spanish flamenco, flamenco guitar with rasgueado and alzapúa technique, palmas 12-beat compás, percussive flamenco cajón, rhythmic zapateado footwork, characteristic quejío vocal cry, medium tempo 93 BPM, intense energy, FEMALE LEAD VOCALS, woman singer, female voice, female vocals, female singer, spanish lyrics, sung in Spanish, letra en español
```

### 2. Estructura del Prompt

```
[MOOD] [GENRE], [STYLE], [GENRE_DESCRIPTION], [TEMPO], [ENERGY], [VOICE], [LANGUAGE]
```

**Ejemplo completo:**
```
energetic Techno, modern professional production, pure techno with analog synthesizers Roland TR-909 style, constant 4x4 kick drum, metallic offbeat hi-hats, hypnotic bassline, fast tempo 140 BPM, intense energy, MALE LEAD VOCALS, man singer, male vocals, english lyrics, sung in English
```

### 3. Campo Personalizado (Opcional)

Si el usuario añade texto en "Añade detalles extra":
```
Canción sobre un viaje al mar con recuerdos de amor
```

Se traduce y añade al prompt:
```
... FEMALE LEAD VOCALS, spanish lyrics. Theme and lyrics about: song about a journey to the sea with memories of love
```

---

## 📥 Response de la API

### Success (200)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e"
  }
}
```

### Error (429 - Sin créditos)

```json
{
  "code": 429,
  "msg": "Insufficient credits",
  "data": null
}
```

---

## 🔄 Polling de Estado

### Endpoint
```
GET https://api.sunoapi.org/api/v1/generate/record-info?taskId=xxx
```

### Estados Posibles

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `PENDING` | En cola | Esperar 5s y reintentar |
| `GENERATING` | Generando | Esperar 5s y reintentar |
| `TEXT_SUCCESS` | Texto generado | Esperar (audio aún no listo) |
| `FIRST_SUCCESS` | Audio parcial | Esperar (aún no completo) |
| `SUCCESS` | ✅ Completo | Descargar y guardar |
| `FAILED` | ❌ Error | Mostrar error |

### Response en SUCCESS

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "xxx",
    "status": "SUCCESS",
    "response": {
      "sunoData": [
        {
          "id": "song-id",
          "title": "Flamenco Misterioso",
          "imageUrl": "https://...",
          "audioUrl": "https://...TEMPORAL",
          "sourceAudioUrl": "https://...TEMPORAL",
          "streamAudioUrl": "https://...TEMPORAL",
          "duration": 145.5,
          "lyric": "[Verse]\n..."
        }
      ]
    }
  }
}
```

---

## 💾 Almacenamiento Permanente

### Problema: URLs Temporales
Las URLs de audio de SunoAPI **expiran después de unas horas**.

### Solución: Supabase Storage

1. **Descargar** MP3 desde URL temporal de SunoAPI
2. **Subir** a Supabase Storage bucket `songs`
3. **Guardar** URL permanente en base de datos
4. **Usar** URL permanente en reproductor

### Código (simplificado)

```typescript
// 1. Descargar
const response = await fetch(temporaryUrl);
const blob = await response.blob();

// 2. Subir a Supabase
const { data } = await supabase.storage
  .from('songs')
  .upload(`${userId}/${songId}.mp3`, blob);

// 3. Obtener URL permanente
const { data: urlData } = supabase.storage
  .from('songs')
  .getPublicUrl(`${userId}/${songId}.mp3`);

const permanentUrl = urlData.publicUrl;

// 4. Guardar en BD
await supabase
  .from('songs')
  .insert([{ audio_url: permanentUrl, ... }]);
```

---

## 🎯 Mejores Prácticas

### ✅ DO's

1. **Usar prompts en inglés** - La IA los interpreta mejor
2. **Ser específico** - "flamenco guitar with rasgueado technique" > "flamenco"
3. **Usar `customMode: false`** - Para letras creativas
4. **Especificar idioma claramente** - "spanish lyrics, sung in Spanish"
5. **Añadir detalles técnicos** - "Roland TR-909, 4x4 kick, 140 BPM"
6. **Especificar BPM Exacto** - "128 BPM" en el prompt funciona mejor que "fast tempo"
7. **Usar V5 por defecto** - Es el modelo más rápido y con mejor calidad musical
8. **Fallback automático** - V5 → V4 → V3_5 si hay problemas
9. **Paginar la biblioteca** - Mostrar 20 canciones a la vez
9. **Lazy loading de imágenes** - Cargar solo cuando son visibles
10. **Memoización funciones** - Usar `useCallback` y `memo` para optimizar

### ❌ DON'Ts

1. ❌ NO usar `customMode: true` sin letras completas
2. ❌ NO exceder 500 caracteres en prompt
3. ❌ NO confiar en URLs temporales de SunoAPI
4. ❌ NO olvidar el `callBackUrl`
5. ❌ NO mezclar español e inglés en el prompt técnico
6. ❌ NO repetir información redundante
7. ❌ NO renderizar todas las canciones a la vez (usar paginación)

---

## 🔍 Debugging

### Logs Útiles

```typescript
console.log('📤 Enviando a SunoAPI:');
console.log('  - prompt:', fullPrompt);
console.log('  - instrumental:', make_instrumental);
console.log('  - model:', payload.model);

console.log('🎵 Respuesta de SunoAPI generate:');
console.log(JSON.stringify(response.data, null, 2));
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `404 Not Found` | Endpoint incorrecto | Usar `/api/v1/generate` |
| `401 Unauthorized` | API key incorrecta | Verificar `SUNO_API_KEY` |
| `429 Insufficient credits` | Sin créditos | Recargar en sunoapi.org |
| `500 Server Error` | Error interno | Reintentar en 1 minuto |
| Letras literales | `customMode: true` mal usado | Cambiar a `false` |

---

## 📚 Referencias

- [Documentación Oficial SunoAPI](https://docs.sunoapi.org/suno-api/generate-music)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🔄 Última Actualización

**Versión**: 1.1.0  
**Fecha**: Noviembre 2025  
**Configuración**: customMode: false + prompt en inglés + storage permanente + optimizaciones de rendimiento

### Cambios en v1.1.0
- ✅ Paginación (20 canciones por página)
- ✅ Lazy loading de imágenes
- ✅ Memoización de funciones con `useCallback`
- ✅ Vista Grid y Lista
- ✅ Menú contextual con z-index optimizado

