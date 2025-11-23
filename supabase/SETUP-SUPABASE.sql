-- ============================================
-- SCRIPT COMPLETO PARA CONFIGURAR SUPABASE
-- Ejecutar TODO este archivo en el SQL Editor
-- ============================================

-- Habilitar Row Level Security en songs
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLA: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLA: user_settings
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

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Añadir user_id a songs
-- ============================================
ALTER TABLE songs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES - SONGS
-- ============================================

DROP POLICY IF EXISTS "Users can view own songs" ON songs;
CREATE POLICY "Users can view own songs"
ON songs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own songs" ON songs;
CREATE POLICY "Users can insert own songs"
ON songs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own songs" ON songs;
CREATE POLICY "Users can update own songs"
ON songs FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own songs" ON songs;
CREATE POLICY "Users can delete own songs"
ON songs FOR DELETE
USING (auth.uid() = user_id);

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

-- ============================================
-- ROW LEVEL SECURITY POLICIES - USER_ROLES
-- ============================================

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

-- ============================================
-- ROW LEVEL SECURITY POLICIES - USER_SETTINGS
-- ============================================

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

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
-- FUNCIÓN: Crear usuario automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

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
    COALESCE(COUNT(*), 0)::BIGINT as total_songs,
    COALESCE(SUM(play_count), 0)::BIGINT as total_plays,
    COALESCE(COUNT(*) FILTER (WHERE is_favorite = true), 0)::BIGINT as favorite_songs,
    COALESCE(SUM(duration), 0)::INTEGER as total_duration
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


