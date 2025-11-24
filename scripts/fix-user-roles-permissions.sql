-- Fix: Asegurar que Service Role puede insertar en user_roles
-- Esto es crítico para la creación de usuarios desde el panel de Admin

-- 1. Verificar que la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) AS table_exists;

-- 2. Añadir columna updated_at si no existe (para el UPSERT del PUT)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- 3. Política especial para Service Role (bypass RLS implícito, pero por si acaso)
-- El Service Role debería bypassear RLS automáticamente, pero esto es un fallback

DROP POLICY IF EXISTS "Service role can do anything" ON public.user_roles;
-- NO CREAR ESTA POLÍTICA - Service Role ya bypasea RLS automáticamente

-- 4. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_roles'
ORDER BY policyname;

-- 5. Verificar que RLS está habilitado (debe estar)
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'user_roles';

-- 📝 NOTA IMPORTANTE:
-- El Service Role Key debería poder insertar incluso con RLS habilitado.
-- Si este script no resuelve el problema, verifica en AWS Amplify que:
-- 1. SUPABASE_SERVICE_ROLE_KEY esté configurada correctamente
-- 2. NEXT_PUBLIC_SUPABASE_URL esté configurada
-- 3. NEXT_PUBLIC_SUPABASE_ANON_KEY esté configurada

