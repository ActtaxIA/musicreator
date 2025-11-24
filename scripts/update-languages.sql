-- Script para actualizar el campo 'language' en canciones existentes
-- Extrae el idioma del campo 'prompt' basándose en palabras clave

-- 1. Actualizar canciones en Español
UPDATE songs
SET language = 'Español'
WHERE language IS NULL
  AND (
    prompt ILIKE '%spanish lyrics%'
    OR prompt ILIKE '%letra en español%'
    OR prompt ILIKE '%sung in spanish%'
    OR prompt ILIKE '%cantado en español%'
  );

-- 2. Actualizar canciones en Inglés
UPDATE songs
SET language = 'Inglés'
WHERE language IS NULL
  AND (
    prompt ILIKE '%english lyrics%'
    OR prompt ILIKE '%sung in english%'
    OR prompt ILIKE '%letra en inglés%'
  );

-- 3. Actualizar canciones en Francés
UPDATE songs
SET language = 'Francés'
WHERE language IS NULL
  AND (
    prompt ILIKE '%french lyrics%'
    OR prompt ILIKE '%sung in french%'
    OR prompt ILIKE '%chanson française%'
  );

-- 4. Actualizar canciones en Italiano
UPDATE songs
SET language = 'Italiano'
WHERE language IS NULL
  AND (
    prompt ILIKE '%italian lyrics%'
    OR prompt ILIKE '%sung in italian%'
    OR prompt ILIKE '%canzone italiana%'
  );

-- 5. Actualizar canciones en Portugués
UPDATE songs
SET language = 'Português'
WHERE language IS NULL
  AND (
    prompt ILIKE '%portuguese lyrics%'
    OR prompt ILIKE '%sung in portuguese%'
    OR prompt ILIKE '%letra em português%'
  );

-- 6. Actualizar canciones instrumentales (sin letra)
UPDATE songs
SET language = 'Instrumental'
WHERE language IS NULL
  AND voice_type = 'instrumental';

-- 7. Para el resto (no identificadas), marcar como Español (por defecto más común)
UPDATE songs
SET language = 'Español'
WHERE language IS NULL
  AND voice_type != 'instrumental';

-- Verificar resultados
SELECT 
  language,
  COUNT(*) as total_canciones
FROM songs
GROUP BY language
ORDER BY total_canciones DESC;





