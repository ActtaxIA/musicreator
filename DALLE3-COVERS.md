# 🎨 Generación Automática de Covers con DALL-E 3

## 📋 Resumen

Ondeon ahora genera automáticamente **portadas de álbum profesionales** para cada canción usando **DALL-E 3 de OpenAI**.

---

## ✨ Características

### 🚀 **No Bloquea la Generación**
- La canción se guarda **inmediatamente** con el audio
- El cover se genera **en segundo plano**
- El usuario puede seguir usando la app mientras se crea la imagen

### 🎨 **Covers Contextuales**
Las imágenes se generan basándose en:
- **Género musical** (Flamenco, Techno, Jazz, etc.)
- **Mood** (Alegre, Melancólico, Energético, etc.)
- **Título de la canción**

### 💾 **Almacenamiento Permanente**
- Las imágenes se suben a **Supabase Storage**
- URLs permanentes (no expiran como las de SunoAPI)
- Alta calidad (1024x1024 píxeles)

### 📱 **UX Fluida**
- Muestra un **placeholder animado** mientras se genera
- La imagen aparece automáticamente cuando está lista
- Fallback robusto si falla la generación

---

## 🔧 Configuración

### 1. **Obtener API Key de OpenAI**

1. Ve a: https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia la key (empieza con `sk-proj-...`)

### 2. **Configurar Variable de Entorno**

Abre tu archivo `.env.local` y añade:

```bash
OPENAI_API_KEY=sk-proj-TU_API_KEY_AQUI
```

### 3. **Reiniciar el Servidor**

```bash
# Detener el servidor actual
Ctrl + C

# Limpiar y reiniciar
npm run dev
```

---

## 🎯 Cómo Funciona

### Workflow de Generación:

```
1. Usuario genera música
   ↓
2. Se guarda canción con audio (image_url = null)
   ↓
3. Usuario ve la canción inmediatamente con placeholder
   ↓
4. EN SEGUNDO PLANO (sin esperar):
   ├─ Se llama a OpenAI DALL-E 3
   ├─ Se genera imagen basada en: género + mood + título
   ├─ Se descarga la imagen
   ├─ Se sube a Supabase Storage
   └─ Se actualiza image_url en la BD
   ↓
5. La imagen aparece automáticamente en la biblioteca
```

### Código Relevante:

#### **API Endpoint** (`app/api/generate-cover/route.ts`)
```typescript
// Genera cover con DALL-E 3
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: `Professional album cover art for ${genre} - ${mood}...`,
  size: "1024x1024",
  quality: "standard",
});
```

#### **Generación en Segundo Plano** (`components/MusicGeneratorPro.tsx`)
```typescript
// NO bloquea - se ejecuta en paralelo
generateCoverInBackground(songId, title, genre, mood, userId);
```

#### **Placeholder Automático** (`components/SongLibrary.tsx`)
```tsx
{song.image_url ? (
  <img src={song.image_url} onError={() => setFallback()} />
) : (
  <img src="/placeholder-album.svg" alt="Generando..." />
)}
```

---

## 💰 Costos

### Precios de DALL-E 3:

| Calidad | Tamaño | Precio por Imagen |
|---------|--------|-------------------|
| Standard | 1024x1024 | $0.040 (~4¢) |
| HD | 1024x1024 | $0.080 (~8¢) |

**Ejemplo de uso:**
- 100 canciones generadas = **$4 USD** (standard)
- 1000 canciones generadas = **$40 USD** (standard)

### Cambiar a Calidad HD:

En `app/api/generate-cover/route.ts`, línea 31:
```typescript
quality: "hd", // Cambiar de "standard" a "hd"
```

---

## 🎨 Personalizar Prompts

### Prompt Actual:

```typescript
const imagePrompt = `Professional album cover art for a ${genre} music track titled "${title}". 
Mood: ${mood}. 
Visual style: Modern, vibrant, abstract art with musical elements, cinematic lighting, 
high quality digital art, professional music industry aesthetic, colorful gradient background, 
artistic composition, 4K quality. 
NO TEXT, NO WORDS, just pure visual art representing the ${genre} genre and ${mood} mood.`;
```

### Ejemplos de Personalización:

#### Estilo Minimalista:
```typescript
Visual style: Minimalist, clean, simple geometric shapes, flat design, 
modern aesthetic, limited color palette
```

#### Estilo Retro:
```typescript
Visual style: Retro 80s aesthetic, neon colors, synthwave vibes, 
vintage album art style, nostalgic composition
```

#### Estilo Fotográfico:
```typescript
Visual style: High-quality photography, cinematic composition, 
professional lighting, artistic mood, atmospheric
```

---

## 🐛 Troubleshooting

### **Error: "API key de OpenAI no configurada"**
- Verifica que `OPENAI_API_KEY` esté en `.env.local`
- Reinicia el servidor después de añadir la key

### **Error: "insufficient_quota"**
- Sin créditos en OpenAI
- Ve a https://platform.openai.com/settings/organization/billing
- Añade créditos a tu cuenta

### **Imágenes no aparecen**
- Espera 10-30 segundos (DALL-E 3 tarda en generar)
- Refresca la biblioteca
- Revisa logs del servidor para errores

### **Imágenes con baja calidad**
- Cambia `quality: "hd"` en el endpoint
- Aumenta el tamaño a `1792x1024` si quieres panorámico

---

## 📊 Estadísticas

### Tiempos Promedio:
- **Generación de imagen**: 10-30 segundos
- **Subida a Supabase**: 2-5 segundos
- **Total**: ~15-35 segundos en segundo plano

### Tamaño de Archivos:
- **Standard**: ~200-400 KB por imagen
- **HD**: ~500-800 KB por imagen

---

## 🔒 Seguridad

### ⚠️ **IMPORTANTE - Regenera tu API Key**

Si compartiste tu API key públicamente (como en este chat):

1. Ve a: https://platform.openai.com/api-keys
2. Haz clic en tu key actual
3. Clic en "Revoke" (revocar)
4. Crea una nueva key
5. Actualiza `.env.local` con la nueva key
6. Reinicia el servidor

### Buenas Prácticas:
- ✅ Mantén `.env.local` en `.gitignore`
- ✅ Nunca compartas la API key públicamente
- ✅ Usa variables de entorno en producción
- ✅ Monitorea el uso en OpenAI Dashboard

---

## 🎯 Próximas Mejoras

### Posibles Funcionalidades Futuras:

1. **Estilos Predefinidos**
   - Minimalista, Retro, Fotográfico, etc.
   - Selector en el generador

2. **Regenerar Cover**
   - Botón para generar nueva imagen
   - Sin re-generar la música

3. **Editar Prompt Manualmente**
   - Permitir al usuario describir la imagen
   - Prompt personalizado por canción

4. **Múltiples Variaciones**
   - Generar 2-3 opciones
   - Usuario elige la que prefiere

5. **Análisis de Audio**
   - Analizar frecuencias del audio
   - Colores basados en el sonido

---

## 📚 Recursos

- **OpenAI DALL-E 3 Docs**: https://platform.openai.com/docs/guides/images
- **Pricing**: https://openai.com/pricing#image-models
- **Best Practices**: https://platform.openai.com/docs/guides/images/usage

---

**¡Disfruta de tus covers automáticos!** 🎨✨





