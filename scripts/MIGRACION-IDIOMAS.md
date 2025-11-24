# 🔧 Migración: Añadir campo de idioma

## ⚠️ IMPORTANTE: Ejecutar en este orden

Necesitas ejecutar **2 scripts en orden**:

### 1️⃣ PRIMERO: Crear la columna `language`

**Archivo:** `scripts/add-language-column.sql`

```sql
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS language TEXT;
```

**Cómo ejecutar:**
1. Ve a [Supabase Dashboard](https://app.supabase.com) → Tu proyecto
2. Abre **SQL Editor**
3. Copia el contenido de `scripts/add-language-column.sql`
4. Pégalo y dale **Run** ▶️
5. Deberías ver: ✅ "Columna language añadida correctamente"

### 2️⃣ DESPUÉS: Actualizar canciones existentes

**Archivo:** `scripts/update-languages.sql`

Ahora sí puedes ejecutar el script que actualiza los idiomas de las canciones antiguas.

**Cómo ejecutar:**
1. En el mismo **SQL Editor**
2. Copia el contenido de `scripts/update-languages.sql`
3. Pégalo y dale **Run** ▶️
4. Verás un resumen de canciones por idioma

---

## ✅ Resultado esperado

Después de ejecutar ambos scripts:

```
language     | total_canciones
-------------+----------------
Español      | 45
Inglés       | 23
Instrumental | 5
```

## 🎵 A partir de ahora

Las nuevas canciones se guardarán automáticamente con el idioma correcto (ya actualizado en el código).

---

## 🔍 Verificar que funcionó

Puedes ejecutar esta query en SQL Editor:

```sql
SELECT title, language, voice_type, genre
FROM songs
LIMIT 10;
```

Deberías ver la columna `language` con valores como "Español", "Inglés", etc.





