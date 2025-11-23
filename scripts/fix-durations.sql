-- Script para actualizar duraciones incorrectas
-- Poner todas las duraciones a NULL para que el reproductor las detecte automáticamente

UPDATE songs 
SET duration = NULL 
WHERE duration = 240;

-- Ver cuántas canciones se actualizaron
SELECT COUNT(*) as canciones_actualizadas 
FROM songs 
WHERE duration IS NULL;


