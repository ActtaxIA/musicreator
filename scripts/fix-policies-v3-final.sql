-- 1. Función segura para chequear admin (evita recursión directa en políticas)
-- SECURITY DEFINER es clave: la función se ejecuta con permisos de creador, no del usuario
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpieza total de políticas
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 3. Políticas limpias usando la función
-- A. Leer propio rol: Fundamental para que funcione todo
CREATE POLICY "Users can read own role" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- B. Leer todos (Solo admin usando la función segura)
CREATE POLICY "Admins can read all roles" ON public.user_roles 
  FOR SELECT USING (public.is_admin());

-- C. Actualizar (Solo admin)
CREATE POLICY "Admins can update roles" ON public.user_roles 
  FOR UPDATE USING (public.is_admin());

-- D. Insertar (Solo admin)
CREATE POLICY "Admins can insert roles" ON public.user_roles 
  FOR INSERT WITH CHECK (public.is_admin());


