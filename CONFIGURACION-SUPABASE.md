# 📝 Configuración Completa de Supabase para Ondeon

## 🎯 Resumen

Este documento detalla todos los pasos para configurar Supabase correctamente, incluyendo:
- Base de datos y tablas
- Autenticación y roles
- **Almacenamiento permanente de audio** 🆕
- Row Level Security (RLS)
- Usuario administrador

---

## 📋 Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Clic en **"New Project"**
3. Rellena:
   - **Name**: `ondeon-music` (o el nombre que prefieras)
   - **Database Password**: (guárdala, la necesitarás)
   - **Region**: Elige el más cercano (Europe West recomendado)
4. Espera 2-3 minutos a que se cree el proyecto

---

## 🗄️ Paso 2: Ejecutar Scripts SQL

Ve a **SQL Editor** en el menú lateral y ejecuta los siguientes scripts **EN ORDEN**:

### Script 1: Tablas Básicas (`supabase/schema.sql`)

```sql
-- Crear tabla de canciones
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  suno_id TEXT,
  audio_url TEXT NOT NULL,
  image_url TEXT,
  genre TEXT NOT NULL,
  prompt TEXT NOT NULL,
  duration INTEGER,
  tempo TEXT,
  energy TEXT,
  mood TEXT,
  voice_type TEXT,
  status TEXT DEFAULT 'pending',
  is_favorite BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_songs_user ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_created ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_favorites ON songs(user_id, is_favorite);
```

### Script 2: Autenticación y Roles (`supabase/SETUP-SUPABASE.sql`)

Este script crea:
- Tabla `user_roles` (admin/user)
- Tabla `user_settings` (configuración por usuario)
- Políticas RLS
- Trigger para crear roles automáticamente

**Copia todo el contenido del archivo y ejecútalo.**

### Script 3: Almacenamiento de Audio 🆕 (`supabase/storage-setup.sql`)

```sql
-- Crear bucket para almacenar archivos de audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leer archivos (público)
CREATE POLICY "Cualquiera puede leer archivos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'songs');

-- Política para permitir subir archivos (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs');

-- Política para permitir eliminar archivos (solo el dueño)
CREATE POLICY "Usuarios pueden eliminar sus archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**✅ Resultado**: Se crea un bucket llamado `songs` para almacenar los MP3 permanentemente.

---

## 👤 Paso 3: Crear Usuario Administrador

### A. Crear usuario en Auth

1. Ve a **Authentication** → **Users** en el menú lateral
2. Clic en **"Add User"** o **"Invite"**
3. Selecciona **"Create new user"**
4. Rellena:
   ```
   Email: narciso.pardo@outlook.com
   Password: 1435680Np@
   ```
5. ✅ **IMPORTANTE**: Marca **"Auto Confirm User"**
6. Clic en **"Create user"**

### B. Asignar rol de administrador

Vuelve al **SQL Editor** y ejecuta:

```sql
-- Asignar rol admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'narciso.pardo@outlook.com'
);

-- Verificar que funcionó
SELECT 
  u.email,
  u.id,
  ur.role,
  us.max_songs_per_month
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_settings us ON us.user_id = u.id
WHERE u.email = 'narciso.pardo@outlook.com';
```

**✅ Deberías ver**:
- `role`: `admin`
- `max_songs_per_month`: `100`

---

## 🔓 Paso 4: Deshabilitar RLS (Temporal)

Para simplificar el desarrollo inicial:

```sql
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
```

**⚠️ Nota**: En producción, deberías habilitar RLS correctamente.

---

## 🔍 Paso 5: Verificar Configuración

### Verificar Tablas

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver:
- `songs`
- `user_roles`
- `user_settings`

### Verificar Storage

1. Ve a **Storage** en el menú lateral
2. Deberías ver un bucket llamado **`songs`**
3. Haz clic en él - debería estar vacío al principio

### Verificar Usuario

```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id;
```

---

## 💾 Cómo Funciona el Almacenamiento Permanente

### Flujo Automático

1. **Usuario genera canción** → SunoAPI devuelve URL temporal
2. **Sistema descarga MP3** desde la URL temporal
3. **Sistema sube MP3** a Supabase Storage (`songs/{user_id}/{song_id}.mp3`)
4. **Sistema obtiene URL permanente** de Supabase
5. **Sistema guarda en BD** la URL permanente en lugar de la temporal

### Ventajas

✅ **URLs permanentes** - Nunca expiran
✅ **1GB gratis** - ~250-300 canciones
✅ **Backup automático** - Tus canciones están seguras
✅ **Rápido** - Servidor propio, no depende de SunoAPI

### Estructura de Archivos

```
songs/
├── {user_id_1}/
│   ├── {song_id_a}.mp3
│   ├── {song_id_b}.mp3
│   └── {song_id_c}.mp3
├── {user_id_2}/
│   ├── {song_id_d}.mp3
│   └── {song_id_e}.mp3
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

**Solución**: La tabla ya existe. Puedes ignorar o borrarla primero:
```sql
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
```

### Error: "duplicate key value violates unique constraint"

**Solución**: El bucket ya existe. Verifica en Storage.

### No veo el bucket "songs"

**Solución**: 
1. Ve a Storage en el menú
2. Si no aparece, ejecuta de nuevo `storage-setup.sql`
3. Refresca la página

### Las canciones no se reproducen

**Posibles causas**:
1. No ejecutaste `storage-setup.sql` → Ejecútalo
2. URLs viejas expiradas → Genera canciones nuevas
3. RLS bloqueando → Ejecuta el `ALTER TABLE ... DISABLE`

---

## 📊 Monitoreo

### Ver espacio usado

```sql
-- Ver tamaño de archivos por usuario
SELECT 
  foldername(name) as user_id,
  COUNT(*) as total_songs,
  ROUND(SUM(metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb
FROM storage.objects
WHERE bucket_id = 'songs'
GROUP BY foldername(name)
ORDER BY size_mb DESC;
```

### Ver canciones recientes

```sql
SELECT 
  title,
  genre,
  duration,
  audio_url,
  created_at
FROM songs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔗 Referencias

- **Supabase Docs**: https://supabase.com/docs
- **Storage Guide**: https://supabase.com/docs/guides/storage
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
