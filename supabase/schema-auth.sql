-- ============================================
-- SISTEMA DE AUTENTICACIÓN CERRADO
-- Solo admin puede crear usuarios
-- ============================================

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLA: user_roles (Roles de usuario)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: user_settings (Configuración de usuario)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  max_songs_per_month INTEGER DEFAULT 100,
  can_use_stems BOOLEAN DEFAULT true,
  can_use_extend BOOLEAN DEFAULT true,
  can_download BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: songs (Actualizada con user_id)
-- ============================================
ALTER TABLE songs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Índice para user_id
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Songs: Los usuarios solo ven sus propias canciones
DROP POLICY IF EXISTS "Users can view own songs" ON songs;
CREATE POLICY "Users can view own songs"
ON songs FOR SELECT
USING (auth.uid() = user_id);

-- Songs: Los usuarios solo pueden crear sus propias canciones
DROP POLICY IF EXISTS "Users can insert own songs" ON songs;
CREATE POLICY "Users can insert own songs"
ON songs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Songs: Los usuarios solo pueden actualizar sus propias canciones
DROP POLICY IF EXISTS "Users can update own songs" ON songs;
CREATE POLICY "Users can update own songs"
ON songs FOR UPDATE
USING (auth.uid() = user_id);

-- Songs: Los usuarios solo pueden eliminar sus propias canciones
DROP POLICY IF EXISTS "Users can delete own songs" ON songs;
CREATE POLICY "Users can delete own songs"
ON songs FOR DELETE
USING (auth.uid() = user_id);

-- Admins pueden ver todas las canciones
DROP POLICY IF EXISTS "Admins can view all songs" ON songs;
CREATE POLICY "Admins can view all songs"
ON songs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- User Roles: Solo admins pueden ver roles
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- User Roles: Solo admins pueden modificar roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- User Settings: Usuarios pueden ver sus propios settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

-- User Settings: Solo admins pueden modificar settings
DROP POLICY IF EXISTS "Admins can manage all settings" ON user_settings;
CREATE POLICY "Admins can manage all settings"
ON user_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================
-- FUNCIÓN: Crear usuario y asignar role automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar role por defecto (user)
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Insertar settings por defecto
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar al crear nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED: Usuario Admin Inicial
-- ============================================
-- IMPORTANTE: Este usuario debe crearse MANUALMENTE en Supabase Auth
-- Email: narciso.pardo@outlook.com
-- Password: 1435680Np@

-- Después de crear el usuario manualmente, ejecuta esto para hacerlo admin:
-- (Reemplaza 'USER_ID_AQUI' con el UUID real del usuario)

-- EJEMPLO (ejecutar después de crear usuario):
-- UPDATE user_roles 
-- SET role = 'admin' 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'narciso.pardo@outlook.com'
-- );

-- ============================================
-- FUNCIONES ÚTILES PARA ADMIN
-- ============================================

-- Función para verificar si usuario es admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_songs BIGINT,
  total_plays BIGINT,
  favorite_songs BIGINT,
  total_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_songs,
    SUM(play_count)::BIGINT as total_plays,
    COUNT(*) FILTER (WHERE is_favorite = true)::BIGINT as favorite_songs,
    SUM(duration)::INTEGER as total_duration
  FROM songs
  WHERE songs.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE user_roles IS 'Roles de usuario (admin/user)';
COMMENT ON TABLE user_settings IS 'Configuración y límites por usuario';
COMMENT ON FUNCTION is_admin IS 'Verifica si un usuario es administrador';
COMMENT ON FUNCTION get_user_stats IS 'Obtiene estadísticas de un usuario';
