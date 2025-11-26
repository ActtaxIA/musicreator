-- ============================================
-- TABLA DE GESTIÓN DE SESIONES
-- ============================================
-- Esta tabla rastrea todas las sesiones activas de usuarios
-- para permitir logout selectivo y límite de sesiones

-- 1. Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Índices para optimización
  CONSTRAINT unique_user_session UNIQUE (user_id, session_token)
);

-- 2. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS: Solo el usuario puede ver sus propias sesiones
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Función para limpiar sesiones expiradas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para limitar sesiones simultáneas según rol
-- Admin: Hasta 3 sesiones
-- Editor/Subscriber: Solo 1 sesión (cierra la anterior automáticamente)
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
  user_role TEXT;
  max_sessions INTEGER;
  sessions_to_close RECORD;
BEGIN
  -- Obtener el rol del usuario desde user_roles
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = NEW.user_id;

  -- Si no se encuentra el rol, asumir subscriber (más restrictivo)
  IF user_role IS NULL THEN
    user_role := 'subscriber';
  END IF;

  -- Determinar límite de sesiones según rol
  IF user_role = 'admin' THEN
    max_sessions := 3;
  ELSE
    -- Editor y Subscriber: Solo 1 sesión
    max_sessions := 1;
  END IF;

  -- Contar sesiones activas del usuario
  SELECT COUNT(*) INTO session_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id AND is_active = true;

  -- Si excede el límite, cerrar las sesiones más antiguas
  IF session_count > max_sessions THEN
    -- Cerrar todas las sesiones antiguas excepto las más recientes (según límite)
    FOR sessions_to_close IN
      SELECT id
      FROM public.user_sessions
      WHERE user_id = NEW.user_id AND is_active = true
      ORDER BY last_activity DESC
      OFFSET max_sessions
    LOOP
      UPDATE public.user_sessions
      SET is_active = false
      WHERE id = sessions_to_close.id;
      
      RAISE NOTICE 'Sesión antigua cerrada para usuario % (rol: %)', NEW.user_id, user_role;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para aplicar límite de sesiones
DROP TRIGGER IF EXISTS enforce_session_limit_trigger ON public.user_sessions;
CREATE TRIGGER enforce_session_limit_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_session_limit();

-- 8. Comentarios para documentación
COMMENT ON TABLE public.user_sessions IS 'Gestión de sesiones con límites por rol: Admin (3), Editor/Subscriber (1)';
COMMENT ON COLUMN public.user_sessions.device_info IS 'Información del dispositivo (browser, OS, etc.) en formato JSON';
COMMENT ON COLUMN public.user_sessions.last_activity IS 'Última actividad registrada en esta sesión';
COMMENT ON COLUMN public.user_sessions.expires_at IS 'Fecha de expiración de la sesión (por defecto 7 días desde creación)';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Mostrar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Mostrar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_sessions';

