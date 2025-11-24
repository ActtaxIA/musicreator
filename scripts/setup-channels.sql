-- 1. Crear tabla de canales si no existe
create table if not exists public.channels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar RLS (Row Level Security)
alter table public.channels enable row level security;

-- 3. Política de LECTURA: Todo el mundo puede ver canales activos
create policy "Canales visibles para todos" 
on public.channels for select 
using (is_active = true);

-- 4. Política de ESCRITURA (Insert/Update/Delete): Solo Admins y Editores
-- Usamos la función is_admin() o consultamos user_roles directamente
create policy "Solo staff gestiona canales" 
on public.channels for all 
using (
  exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'editor')
  )
);

-- 5. Índices para rendimiento
create index if not exists channels_is_active_idx on public.channels(is_active);
create index if not exists channels_created_at_idx on public.channels(created_at desc);

-- 6. Comentarios
comment on table public.channels is 'Canales o playlists inteligentes curadas por admins/editores';



