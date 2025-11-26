-- ============================================
-- ACTUALIZACIÓN DE TABLA DE SESIONES
-- ============================================
-- Script seguro que actualiza la tabla existente sin errores

-- 1. Eliminar trigger y función existentes para recrearlos
DROP TRIGGER IF EXISTS enforce_session_limit_trigger ON public.user_sessions;
DROP FUNCTION IF EXISTS public.enforce_session_limit();

-- 2. Recrear función con límites por rol
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

-- 3. Recrear trigger
CREATE TRIGGER enforce_session_limit_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_session_limit();

-- 4. Actualizar comentario de la tabla
COMMENT ON TABLE public.user_sessions IS 'Gestión de sesiones con límites por rol: Admin (3), Editor/Subscriber (1)';

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Trigger actualizado correctamente' AS status;

-- Mostrar función
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'enforce_session_limit';

