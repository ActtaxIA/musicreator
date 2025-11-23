-- SCHEMA ACTUALIZADO PARA APP PRIVADA

-- Tabla de usuarios (con roles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Usuario admin inicial (TÚ)
INSERT INTO users (email, name, role, is_active) 
VALUES ('narciso.pardo@outlook.com', 'Narciso Pardo', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Tabla de canciones (actualizada con user_id)
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Información básica
  title TEXT NOT NULL,
  suno_id TEXT UNIQUE NOT NULL,
  audio_url TEXT,
  image_url TEXT,
  
  -- Parámetros de generación
  genre TEXT NOT NULL,
  prompt TEXT NOT NULL,
  duration INTEGER,
  
  -- Parámetros musicales
  tempo TEXT,
  energy TEXT,
  mood TEXT,
  voice_type TEXT,
  instruments TEXT[],
  
  -- Metadata
  status TEXT DEFAULT 'pending',
  is_favorite BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_is_favorite ON songs(is_favorite);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_songs_updated_at
BEFORE UPDATE ON songs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURIDAD

-- Usuarios: Solo admins pueden ver todos, users solo se ven a sí mismos
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR auth.uid() = id
);

CREATE POLICY "Admins can create users"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can update users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Canciones: Los usuarios ven solo las suyas, admins ven todas
CREATE POLICY "Users can view own songs"
ON songs FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Users can insert own songs"
ON songs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs"
ON songs FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Users can delete own songs"
ON songs FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Tabla de actividad/logs (para admins)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Los logs solo los pueden ver admins
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Anyone can create logs"
ON activity_logs FOR INSERT
WITH CHECK (true);
