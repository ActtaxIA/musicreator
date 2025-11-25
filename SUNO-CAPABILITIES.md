# 🎵 Cómo Funciona Suno API - Capacidades REALES

## 📊 Formatos de Salida

### Audio Generado
- **Formato principal**: MP3 (por defecto)
- **Calidad**: 128-192 kbps
- **Duración máxima por generación**:
  - V3.5: hasta 4 minutos
  - V4: hasta 4 minutos  
  - V4.5: hasta 8 minutos
  - V4.5+: hasta 8 minutos
  - **V5: hasta 8+ minutos** ✨ (última versión, más rápido y mejor expresión musical)

### Conversiones Disponibles
- **WAV**: Conversión de MP3 a WAV (sin compresión)
- **Stems**: Separación en pistas individuales

---

## ✅ Funciones REALES de Suno

### 1. 🎼 **Generate** (Crear Música)
**Endpoint**: `/api/v1/generate` o `/api/generate`

**Lo que hace**:
- Genera música desde cero con un prompt
- Soporta instrumentales o con vocals
- Puedes especificar género, mood, instrumentos

**Parámetros**:
```json
{
  "prompt": "Flamenco alegre con guitarra",
  "make_instrumental": false,
  "model": "V5"
}
```

**Output**: 2 variaciones de la misma canción

---

### 2. ➕ **Extend** (Alargar/Continuar)
**Endpoint**: `/api/v1/generate/extend`

**Lo que hace**:
- Alarga una canción existente
- Puedes especificar **desde qué segundo** continuar (`continueAt`)
- NO reemplaza partes - solo AÑADE al final o desde un punto

**Parámetros**:
```json
{
  "audioId": "abc123",
  "continueAt": 60,  // Desde segundo 60
  "prompt": "Añadir un solo de guitarra energético",
  "defaultParamFlag": true
}
```

**Ejemplos de uso**:
- ✅ Añadir intro: `continueAt: 0` → Añade al principio
- ✅ Alargar final: `continueAt: 120` → Añade desde segundo 120
- ✅ Continuar desde mitad: `continueAt: 60` → Continúa desde segundo 60

**Limitaciones**:
- ❌ NO puede editar el medio sin continuar desde ahí
- ❌ NO reemplaza secciones existentes
- ❌ NO hace "cut" o "trim"
- ⚠️ El audio generado escucha ~1 minuto ANTES del punto de continuación

---

### 3. 🎚️ **Get Stems** (Separar Pistas)
**Endpoint**: `/api/v1/audio/separation` o `/api/generate_stems`

**Lo que hace**:
- Separa la canción en **2 pistas**:
  1. **Vocals** (voces)
  2. **Instrumental** (todo lo demás)

**Con V5 (versión más nueva)**:
- Puede separar en **más stems**:
  - Vocals
  - Bass
  - Drums
  - Other instruments

**Parámetros**:
```json
{
  "audioId": "abc123"
}
```

**Output**: 2 clips nuevos (uno vocal, uno instrumental)

**Casos de uso**:
- ✅ Crear karaoke (solo instrumental)
- ✅ Aislar vocals para remix
- ✅ Edición profesional en DAW

**Limitaciones**:
- ❌ La separación no es perfecta (puede haber bleed)
- ❌ En versiones básicas, solo 2 stems (no 4 separados)

---

### 4. 🔗 **Concat** (Unir Clips)
**Endpoint**: `/api/v1/audio/concat` o `/api/concat`

**Lo que hace**:
- Une múltiples clips en UNA canción completa
- Útil cuando has hecho varias extensiones

**Parámetros**:
```json
{
  "clipIds": ["clip1-id", "clip2-id", "clip3-id"]
}
```

**Ejemplo de workflow**:
1. Generas canción inicial (clip1)
2. Extiendes con solo de guitarra (clip2)  
3. Extiendes con outro relajante (clip3)
4. **Concat** une todo en una sola canción

---

## 🚫 Lo que Suno NO Puede Hacer

### ❌ Edición Destructiva
- NO puede "cortar" o eliminar partes
- NO puede reemplazar secciones en medio
- NO puede regenerar SOLO un verso o estribillo

### ❌ Edición de Audio Tradicional
- NO es un DAW (como Ableton, FL Studio)
- NO tiene fade in/out (tendrías que hacerlo externamente)
- NO puede ajustar volumen de partes específicas
- NO puede cambiar tempo después de generada

### ❌ Stems Avanzados (en versiones antiguas)
- V4 y anteriores: Solo 2 stems (vocals + instrumental)
- V5: Hasta 4-5 stems separados

---

## 🎯 Workflow Correcto Para Tu Editor

### Caso 1: **Alargar una Canción**
```
Usuario tiene: Canción de 2 minutos
Usuario quiere: Alargar al final

1. Llamar /extend con continueAt = 120 (final)
2. Esperar a que se genere (30-60 seg)
3. Descargar extensión
4. OPCIONAL: Llamar /concat para unir todo
```

### Caso 2: **Añadir Intro**
```
Usuario tiene: Canción que empieza muy brusco
Usuario quiere: Añadir intro suave

1. Llamar /extend con continueAt = 0
2. Esto genera intro ANTES del audio original
3. Llamar /concat con [intro_id, original_id]
```

### Caso 3: **Regenerar una Sección**
```
Usuario tiene: Canción con estribillo malo en medio
Usuario quiere: Cambiar solo el estribillo

⚠️ NO ES POSIBLE DIRECTAMENTE
Workaround:
1. Identificar donde empieza el problema (ej: segundo 60)
2. Llamar /extend desde segundo 60 con nuevo prompt
3. Esto crea versión alternativa desde ese punto
4. Usuario debe elegir cuál le gusta más
```

### Caso 4: **Separar Stems para Remix**
```
Usuario quiere: Hacer remix profesional

1. Llamar /generate_stems
2. Descargar vocals + instrumental por separado
3. Importar ambos en Ableton/FL Studio
4. Editar profesionalmente
```

---

## 🔄 Polling y Estados

Suno genera de forma asíncrona. Workflow:

```
1. POST /generate (o /extend, /stems)
   └─> Respuesta inmediata con task_id

2. Polling: GET /status?ids=task_id cada 5 segundos
   └─> status: "pending" | "processing" | "complete" | "failed"

3. Cuando status = "complete"
   └─> audio_url disponible para descargar
```

**Tiempos típicos**:
- Generación inicial: 30-60 segundos
- Extensión: 30-60 segundos
- Stems: 30-90 segundos

---

## 💰 Costos por Operación

- **Generate**: ~$0.01-0.04 por canción
- **Extend**: ~$0.01-0.04 por extensión
- **Stems**: ~$0.01-0.02 por separación
- **Concat**: Gratis (solo procesamiento)

---

## 🎨 Diseño de Tu Editor - Basado en Realidad

### Pestaña 1: **Extender**
```
┌─────────────────────────────────────┐
│ [  WAVEFORM  ]  ← Usuario hace clic│
│                                     │
│ Extender desde: [  1:30  ]         │
│                                     │
│ Prompt: [Añadir solo de guitarra...│
│                                     │
│ [🔹 Inicio] [🔹 Mitad] [🔹 Final]  │
│                                     │
│ [ ✨ EXTENDER CANCIÓN ]             │
│                                     │
│ Extensiones:                        │
│ ✅ Ext 1 - Desde 0:00 [Descargar]  │
│ ⏳ Ext 2 - Desde 2:00 [Procesando] │
│                                     │
│ [ 🔗 UNIR TODO ]                    │
└─────────────────────────────────────┘
```

### Pestaña 2: **Stems**
```
┌─────────────────────────────────────┐
│ [ ✨ GENERAR STEMS ]                │
│                                     │
│ ┌──────────┐   ┌──────────┐        │
│ │ 🎤 VOCALS│   │ 🎸 INSTRU│        │
│ │ [▶️ Play]│   │ [▶️ Play]│        │
│ │ [⬇️ Down]│   │ [⬇️ Down]│        │
│ └──────────┘   └──────────┘        │
└─────────────────────────────────────┘
```

### Pestaña 3: **Exportar**
```
┌─────────────────────────────────────┐
│ 🎵 Original MP3   [Descargar]      │
│ 📦 Stems (2)      [Ir a Stems]     │
│ 🔗 Extensiones    [Ver Lista]      │
│ 🎚️ WAV            [Próximamente]   │
└─────────────────────────────────────┘
```

---

## 🎓 Mensajes Para el Usuario

### ✅ Mensajes Correctos:
- "Alargando canción desde 1:30..."
- "Generando vocal e instrumental por separado..."
- "Uniendo todas las extensiones en una sola canción..."

### ❌ Mensajes INCORRECTOS (mentira):
- ❌ "Editando el verso 2..."  
- ❌ "Reemplazando el estribillo..."
- ❌ "Cortando la intro..."
- ❌ "Ajustando volumen del bajo..."

---

## 📚 Recursos Oficiales

- **Docs Suno API**: https://docs.sunoapi.org/
- **GitHub Suno API**: https://github.com/gcui-art/suno-api
- **Changelog V5**: https://www.cometapi.com/suno-unveils-v5-model

---

## ✨ Resumen para Desarrolladores

### LO QUE SÍ PUEDES HACER:
✅ Generar música original
✅ Alargar canciones (extend)
✅ Separar vocals + instrumental
✅ Unir múltiples clips
✅ Especificar punto de continuación

### LO QUE NO PUEDES HACER:
❌ Editar audio destructivamente
❌ Cortar/eliminar secciones
❌ Reemplazar partes específicas sin re-generar
❌ Ajustar parámetros de audio generado (EQ, compresión, etc.)
❌ Control fino post-generación

### SOLUCIÓN:
Para edición avanzada → Exporta stems → Usa DAW profesional

---

**¡Tu editor debe reflejar estas capacidades REALES!** 🎯

No prometas funciones que Suno no tiene. En su lugar:
1. Extend + Concat para crear canciones más largas y complejas
2. Stems para edición externa profesional
3. Claridad sobre las limitaciones
