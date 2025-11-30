'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MusicPlayer from '@/components/MusicPlayer';
import ThemeToggle from '@/components/ThemeToggle';
import { Song } from '@/lib/supabase';
import { LogOut, User, Radio, Laptop } from 'lucide-react';
import Link from 'next/link';

export default function ReproductorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [songs, setSongs] = useState<Song[]>([]); // Solo 30 iniciales + infinite scroll
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hasMoreSongs, setHasMoreSongs] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalSongsCount, setTotalSongsCount] = useState<number>(0);

  // Check auth al montar
  useEffect(() => {
    checkAuth();
  }, []);

  // Cargar canciones cuando hay usuario autenticado
  useEffect(() => {
    if (user) {
      loadSongs();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Cargar perfil de usuario (tabla user_roles)
      const { data: profile, error: profileError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user role:', profileError);
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  // ⚡ Cargar solo las primeras 30 canciones (optimización para reproductor)
  const loadSongs = async () => {
    if (!user) return;

    try {
      // 1. Obtener el conteo TOTAL real (para mostrar en la UI)
      const { count: totalCount, error: countError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error counting songs:', countError);
      } else {
        setTotalSongsCount(totalCount || 0);
      }

      // 2. Cargar las primeras 30 canciones
      // ⚡ OPTIMIZACIÓN: Solo cargar las primeras 30 canciones para carga ultra rápida inicial
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (songsError) throw songsError;

      // Si recibimos menos de 30, no hay más canciones
      if (songsData && songsData.length < 30) {
        setHasMoreSongs(false);
      } else {
        setHasMoreSongs(true);
      }

      // 3. Cargar mis favoritos
      const { data: favsData, error: favsError } = await supabase
        .from('user_favorites')
        .select('song_id')
        .eq('user_id', user.id);

      if (favsError) throw favsError;

      setFavoriteIds(new Set(favsData?.map(f => f.song_id) || []));
      setSongs(songsData || []);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  // ⚡ Cargar más canciones (infinite scroll)
  const loadMoreSongs = async () => {
    if (!user || isLoadingMore || !hasMoreSongs) return;
    
    setIsLoadingMore(true);
    console.log('🔄 Cargando más canciones...');
    
    try {
      // Obtener la fecha de la última canción cargada
      const lastSong = songs[songs.length - 1];
      
      // Cargar las siguientes 20 canciones
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .lt('created_at', lastSong.created_at)
        .limit(20);

      if (error) throw error;
      
      // Si recibimos menos de 20, no hay más canciones
      if (data.length < 20) {
        setHasMoreSongs(false);
        console.log('✅ No hay más canciones para cargar');
      }
      
      // Añadir las nuevas canciones al array existente
      if (data && data.length > 0) {
        setSongs(prev => [...prev, ...data]);
        console.log(`✅ ${data.length} canciones más cargadas (Total: ${songs.length + data.length})`);
      }
    } catch (error) {
      console.error('Error loading more songs:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }
      
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/auth/login');
    }
  };

  const handleToggleFavorite = async (songId: string) => {
    try {
      const isFavorite = favoriteIds.has(songId);
      
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId);
          
        if (error) throw error;
        
        const newFavs = new Set(favoriteIds);
        newFavs.delete(songId);
        setFavoriteIds(newFavs);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, song_id: songId });
          
        if (error) throw error;
        
        const newFavs = new Set(favoriteIds);
        newFavs.add(songId);
        setFavoriteIds(newFavs);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-300 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-900 dark:text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // Combinar info (inyectar is_favorite)
  const songsWithFavorites = songs.map(song => ({
    ...song,
    is_favorite: favoriteIds.has(song.id)
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors duration-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Radio className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h1 className="text-zinc-900 dark:text-white font-bold text-xl">Reproductor</h1>
                <p className="text-zinc-600 dark:text-zinc-500 text-xs">Narciso Music Generator</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 transition-colors text-sm"
              >
                Biblioteca
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-zinc-900 dark:text-white text-sm font-medium">{user?.email}</p>
                <p className="text-zinc-600 dark:text-zinc-500 text-xs capitalize">
                  {userProfile?.role || 'Usuario'}
                </p>
              </div>

              {/* Sesiones Button */}
              <button
                onClick={() => router.push('/?tab=sessions')}
                className="p-2 rounded-md transition-colors border bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
                title="Gestión de Sesiones"
              >
                <Laptop className="w-5 h-5" />
              </button>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Admin Button */}
              {(userProfile?.role === 'admin' || user?.email === 'narciso.pardo@outlook.com') && (
                <button
                  onClick={() => router.push('/admin/users')}
                  className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 border border-zinc-300 dark:border-zinc-700 transition-colors"
                  title="Gestión de Usuarios"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Reproductor */}
      <div className="container mx-auto px-4 py-6">
        <MusicPlayer
          songs={songsWithFavorites}
          userId={user?.id}
          userRole={userProfile?.role}
          onToggleFavorite={handleToggleFavorite}
          onLoadMore={loadMoreSongs}
          hasMore={hasMoreSongs}
          isLoadingMore={isLoadingMore}
          totalSongsCount={totalSongsCount}
        />
      </div>
    </div>
  );
}

