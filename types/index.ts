export interface Song {
  id: string;
  title: string;
  genre: string;
  audio_url: string;
  image_url?: string;
  duration: number;
  created_at: string;
  is_favorite: boolean;
  play_count: number;
  suno_id?: string;
  mood?: string;
  tempo?: string;
  energy?: number;
  prompt?: string;
  status?: string;
  language?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  filters: {
    genre?: string;
    mood?: string;
    search?: string;
    language?: string;
  };
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export interface UserRole {
  role: 'admin' | 'editor' | 'subscriber';
}






