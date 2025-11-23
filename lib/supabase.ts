import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface Song {
  id: string;
  title: string;
  suno_id: string;
  audio_url: string | null;
  image_url: string | null;
  genre: string;
  prompt: string;
  duration: number | null;
  tempo: string | null;
  energy: string | null;
  mood: string | null;
  voice_type: string | null;
  language: string | null;
  instruments: string[] | null;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  is_favorite: boolean;
  play_count: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface SongInsert {
  title: string;
  suno_id: string;
  audio_url?: string;
  image_url?: string;
  genre: string;
  prompt: string;
  duration?: number;
  tempo?: string;
  energy?: string;
  mood?: string;
  voice_type?: string;
  language?: string;
  instruments?: string[];
  status?: 'pending' | 'processing' | 'complete' | 'failed';
  user_id?: string;
}

export interface SongUpdate {
  title?: string;
  audio_url?: string;
  image_url?: string;
  duration?: number;
  status?: 'pending' | 'processing' | 'complete' | 'failed';
  is_favorite?: boolean;
  play_count?: number;
}
