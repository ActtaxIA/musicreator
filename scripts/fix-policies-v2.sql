-- 1. Limpiar TODAS las políticas antiguas para empezar de cero limpio
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 2. Política BÁSICA: Todo usuario autenticado puede leer SU PROPIO rol
CREATE POLICY "Users can read own role" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Política ADMIN: Los admins pueden leer TODOS los roles
CREATE POLICY "Admins can read all roles" ON public.user_roles 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- 4. Política ADMIN UPDATE: Los admins pueden actualizar roles
CREATE POLICY "Admins can update roles" ON public.user_roles 
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- 5. Política ADMIN INSERT: Los admins pueden crear roles
CREATE POLICY "Admins can insert roles" ON public.user_roles 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );





