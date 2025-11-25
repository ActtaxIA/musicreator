-- Fix: Arreglar el trigger de creación de usuarios
-- El trigger puede estar causando que falle la creación de usuarios

-- 1. Eliminar el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar la función existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recrear la función con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Intentar insertar el rol por defecto
  INSERT INTO public.user_roles (user_id, role, email)
  VALUES (new.id, 'subscriber', new.email)
  ON CONFLICT (user_id) DO NOTHING; -- Si ya existe, no hacer nada
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay un error, loguearlo pero NO fallar la creación del usuario
    RAISE WARNING 'Error inserting user role: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Verificar que el trigger está activo
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 📝 NOTA: Este trigger se ejecuta automáticamente cuando:
-- - Un usuario se registra por sí mismo
-- - Un admin crea un usuario desde el panel
--
-- El trigger asigna el rol 'subscriber' por defecto.
-- Si el admin quiere otro rol, lo cambia después en la tabla user_roles.


