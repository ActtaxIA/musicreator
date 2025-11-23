# 🌍 Actualizar Idiomas de Canciones Existentes

Este script actualiza el campo `language` en todas las canciones que se generaron antes de que implementáramos este campo.

## 📋 Cómo ejecutar

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Abre tu proyecto: `zenksbydlppmjlpgmkn`
3. Ve a **SQL Editor** en la barra lateral
4. Haz clic en **New query**
5. Copia y pega todo el contenido de `scripts/update-languages.sql`
6. Haz clic en **Run** (▶️)

### Opción 2: Desde terminal (si tienes psql instalado)

```bash
# Ejecutar el script
psql -h [TU_HOST] -U postgres -d postgres -f scripts/update-languages.sql
```

## 🎯 ¿Qué hace el script?

El script analiza el campo `prompt` de cada canción y detecta el idioma basándose en palabras clave:

1. **Español** → Si encuentra "spanish lyrics", "letra en español", etc.
2. **Inglés** → Si encuentra "english lyrics", "sung in english", etc.
3. **Francés** → Si encuentra "french lyrics", "chanson française", etc.
4. **Italiano** → Si encuentra "italian lyrics", "canzone italiana", etc.
5. **Portugués** → Si encuentra "portuguese lyrics", etc.
6. **Instrumental** → Si `voice_type = 'instrumental'`
7. **Por defecto** → Las que no coincidan se marcarán como "Español" (asumiendo que es el más común)

## ✅ Verificar resultados

Al final del script, verás un resumen como este:

```
language     | total_canciones
-------------+----------------
Español      | 45
Inglés       | 23
Instrumental | 5
Francés      | 2
```

## 🔄 A partir de ahora

Todas las **nuevas canciones** se guardarán automáticamente con el idioma correcto, ya que acabamos de actualizar el código para incluir el campo `language` al guardar.

## 📝 Notas

- ⚠️ Este script es **idempotente**: puedes ejecutarlo varias veces sin problemas
- ✅ Solo actualiza canciones donde `language IS NULL`
- 🔒 No modifica canciones que ya tienen idioma asignado


