-- 1. Crear tabla de favoritos por usuario
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id UUID REFERENCES auth.users NOT NULL,
  song_id UUID REFERENCES public.songs ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, song_id)
);

-- 2. Habilitar seguridad
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 3. Políticas: Cada usuario gestiona sus favoritos
DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
CREATE POLICY "Users manage own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- 4. Migrar datos existentes (Opcional)
-- Si quieres preservar los favoritos actuales asignándoselos al dueño de la canción:
INSERT INTO public.user_favorites (user_id, song_id)
SELECT user_id, id FROM public.songs WHERE is_favorite = true
ON CONFLICT DO NOTHING;

-- Nota: Después de esto, la columna is_favorite en 'songs' quedará obsoleta
-- ALTER TABLE public.songs DROP COLUMN is_favorite; -- (Ejecutar más adelante si se desea limpiar)




