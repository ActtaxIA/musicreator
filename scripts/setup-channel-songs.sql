-- Tabla de relación Canal <-> Canción (Many-to-Many)
create table if not exists public.channel_songs (
  channel_id uuid references public.channels(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (channel_id, song_id)
);

-- Habilitar RLS
alter table public.channel_songs enable row level security;

-- Políticas
create policy "Ver canciones de canales" 
on public.channel_songs for select 
using (true);

create policy "Gestionar canciones de canales" 
on public.channel_songs for all 
using (
  exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'editor')
  )
);

-- Índices
create index if not exists channel_songs_channel_id_idx on public.channel_songs(channel_id);
create index if not exists channel_songs_song_id_idx on public.channel_songs(song_id);






