-- Crear tabla de canciones generadas
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  title TEXT NOT NULL,
  suno_id TEXT UNIQUE NOT NULL,
  audio_url TEXT,
  image_url TEXT,
  
  -- Parámetros de generación
  genre TEXT NOT NULL,
  prompt TEXT NOT NULL,
  duration INTEGER, -- en segundos
  
  -- Parámetros musicales
  tempo TEXT, -- slow, medium, fast
  energy TEXT, -- low, medium, high
  mood TEXT, -- happy, sad, energetic, relaxed, epic, romantic
  voice_type TEXT, -- male, female, choir, instrumental
  
  -- Instrumentos (array de strings)
  instruments TEXT[],
  
  -- Metadata
  status TEXT DEFAULT 'pending', -- pending, processing, complete, failed
  is_favorite BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_is_favorite ON songs(is_favorite);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

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
