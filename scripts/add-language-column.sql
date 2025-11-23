-- Migración: Añadir columna 'language' a la tabla 'songs'
-- Fecha: 2025-11-22
-- Descripción: Añade el campo para almacenar el idioma de las letras de cada canción

-- 1. Añadir la columna 'language' (permitir NULL temporalmente)
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS language TEXT;

-- 2. Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'songs' AND column_name = 'language';

-- 3. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Columna "language" añadida correctamente a la tabla "songs"';
END $$;


