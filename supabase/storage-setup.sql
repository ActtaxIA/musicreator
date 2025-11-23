-- Crear bucket para almacenar archivos de audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subir archivos (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs');

-- Política para permitir leer archivos (público)
CREATE POLICY "Cualquiera puede leer archivos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'songs');

-- Política para permitir eliminar archivos (solo el dueño)
CREATE POLICY "Usuarios pueden eliminar sus archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'songs' AND auth.uid()::text = (storage.foldername(name))[1]);


