'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MusicGeneratorPro from '@/components/MusicGeneratorPro';
import SongLibrary from '@/components/SongLibrary';
import SongEditor from '@/components/SongEditor';
import MusicPlayer from '@/components/MusicPlayer';
import ChannelManager from '@/components/ChannelManager';
import ActiveSessions from '@/components/ActiveSessions';
import ThemeToggle from '@/components/ThemeToggle';
import { UserRole } from '@/types';
import { Song } from '@/lib/supabase';
import { Sparkles, Music2, Settings, LogOut, Shield, User, Radio, ListMusic, Laptop } from 'lucide-react';
import Link from 'next/link';

export default function MainApp() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Recuperar última pestaña activa del localStorage (sin player, ahora es página separada)
  const [activeTab, setActiveTab] = useState<'generator' | 'library' | 'editor' | 'channels' | 'sessions'>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('ondeon-active-tab');
      // Si estaba en player, redirigir a library
      const tab = savedTab === 'player' ? 'library' : savedTab;
      return (tab as 'generator' | 'library' | 'editor' | 'channels' | 'sessions') || 'generator';
    }
    return 'generator';
  });
  
  const [songs, setSongs] = useState<Song[]>([]); // TODAS las canciones para biblioteca
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [regenerateSongData, setRegenerateSongData] = useState<Song | null>(null);
  const [totalSongsCount, setTotalSongsCount] = useState<number>(0);

  // Guardar pestaña activa en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ondeon-active-tab', activeTab);
    }
  }, [activeTab]);

  // Check auth al montar
  useEffect(() => {
    checkAuth();
  }, []);

  // Cargar TODAS las canciones cuando hay usuario autenticado Y perfil cargado
  // (necesitamos el perfil para saber si es admin/editor)
  useEffect(() => {
    if (user && userProfile) {
      loadAllSongs();
    }
  }, [user, userProfile]);

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
      } else {
        console.log('User Profile Loaded:', profile); // DEBUG LOG
      }

      setUserProfile(profile);
      
      // Si es suscriptor, redirigir a reproductor
      if (profile?.role === 'subscriber') {
        router.push('/reproductor');
        return;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };


  // 📚 FUNCIÓN PARA BIBLIOTECA: Cargar TODAS las canciones
  // Admin y Editor ven TODAS las canciones, usuarios normales solo las suyas
  const loadAllSongs = async () => {
    if (!user) return;

    try {
      // Determinar si el usuario es admin o editor (pueden ver todas las canciones)
      const isStaff = userProfile?.role === 'admin' || userProfile?.role === 'editor';

      // 1. Obtener el conteo TOTAL real (para mostrar en la UI)
      let countQuery = supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });
      
      // Solo filtrar por user_id si NO es admin/editor
      if (!isStaff) {
        countQuery = countQuery.eq('user_id', user.id);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        console.error('Error counting songs:', countError);
      } else {
        setTotalSongsCount(totalCount || 0);
      }

      // 2. Cargar canciones (admin/editor ven todas, otros solo las suyas)
      let songsQuery = supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Solo filtrar por user_id si NO es admin/editor
      if (!isStaff) {
        songsQuery = songsQuery.eq('user_id', user.id);
      }

      const { data: songsData, error: songsError } = await songsQuery;

      if (songsError) throw songsError;

      // 3. Cargar mis favoritos
      const { data: favsData, error: favsError } = await supabase
        .from('user_favorites')
        .select('song_id')
        .eq('user_id', user.id);

      if (favsError) throw favsError;

      setFavoriteIds(new Set(favsData?.map(f => f.song_id) || []));
      setSongs(songsData || []);
      
      console.log(`✅ Biblioteca: ${songsData?.length || 0} canciones cargadas ${isStaff ? '(todas - admin/editor)' : '(propias)'}`);
    } catch (error) {
      console.error('Error loading all songs:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Cerrar sesión localmente y globalmente en Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Marcar sesiones como inactivas en la BD
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

  const handleDeleteSong = async (songId: string) => {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      // Actualizar lista local
      setSongs(prev => prev.filter(s => s.id !== songId));
      // Actualizar contador total
      setTotalSongsCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Error al eliminar la canción');
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

  const handleUpdatePlayCount = async (songId: string) => {
    try {
      const song = songs.find(s => s.id === songId);
      if (!song) return;

      const { error } = await supabase
        .from('songs')
        .update({ play_count: (song.play_count || 0) + 1 })
        .eq('id', songId);

      if (error) throw error;

      // Actualizar lista local
      setSongs(prev => prev.map(s => 
        s.id === songId ? { ...s, play_count: (s.play_count || 0) + 1 } : s
      ));
    } catch (error) {
      console.error('Error updating play count:', error);
    }
  };

  const handleRegenerateSong = (song: Song) => {
    // Guardar los datos de la canción para pre-cargar en el generador
    setRegenerateSongData(song);
    // Cambiar a la pestaña de generador
    setActiveTab('generator');
  };

  const handleOpenEditor = (song: Song) => {
    setEditingSong(song);
    setActiveTab('editor');
  };

  const handleBackFromEditor = () => {
    setEditingSong(null);
    setActiveTab('library');
  };

  const handleSongUpdate = (songId: string, updates: Partial<Song>) => {
    setSongs(prev =>
      prev.map(song =>
        song.id === songId ? { ...song, ...updates } : song
      )
    );
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

  // Si está en el editor
  if (activeTab === 'editor' && editingSong) {
    return (
      <SongEditor
        song={editingSong}
        onBack={handleBackFromEditor}
        onUpdate={handleSongUpdate}
      />
    );
  }

  // 3. Combinar info (inyectar is_favorite)
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
              <Music2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h1 className="text-zinc-900 dark:text-white font-bold text-xl">Narciso Music Generator</h1>
                <p className="text-zinc-600 dark:text-zinc-500 text-xs">Sistema Interno</p>
              </div>
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
                onClick={() => setActiveTab('sessions')}
                className={`p-2 rounded-md transition-colors border ${
                  activeTab === 'sessions'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700'
                }`}
                title="Gestión de Sesiones"
              >
                <Laptop className="w-5 h-5" />
              </button>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Admin Button - Mostrar si es admin por BD O si es el email del superadmin (fallback) */}
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

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-2 mb-6">
          {userProfile?.role !== 'subscriber' && (
            <>
              <button
                onClick={() => setActiveTab('generator')}
                className={`px-6 py-3 rounded-md font-medium transition-all flex items-center justify-center md:justify-start gap-2 border ${
                  activeTab === 'generator'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                Generar
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-6 py-3 rounded-md font-medium transition-all flex items-center justify-center md:justify-start gap-2 border ${
                  activeTab === 'library'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <Music2 className="w-5 h-5" />
                Biblioteca ({totalSongsCount > 0 ? totalSongsCount : songs.length})
              </button>
              {(userProfile?.role === 'admin' || userProfile?.role === 'editor') && (
                <button
                  onClick={() => setActiveTab('channels')}
                  className={`px-6 py-3 rounded-md font-medium transition-all flex items-center justify-center md:justify-start gap-2 border ${
                    activeTab === 'channels'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <ListMusic className="w-5 h-5" />
                  Canales
                </button>
              )}
            </>
          )}
          <Link
            href="/reproductor"
            className="px-6 py-3 rounded-md font-medium transition-all flex items-center justify-center md:justify-start gap-2 border bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700"
          >
            <Radio className="w-5 h-5" />
            Reproductor
          </Link>
        </div>

        {/* Content */}
        {activeTab === 'generator' && (
          <MusicGeneratorPro 
            userId={user?.id}
            regenerateFromSong={regenerateSongData}
            onSongGenerated={() => {
              // Recargar todas las canciones cuando se genera una canción
              loadAllSongs();
              // Limpiar datos de regeneración
              setRegenerateSongData(null);
            }}
          />
        )}

        {activeTab === 'library' && (
          <SongLibrary
            songs={songsWithFavorites}
            userRole={userProfile?.role}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteSong}
            onRegenerate={handleRegenerateSong}
            onUpdatePlayCount={handleUpdatePlayCount}
            onEdit={handleOpenEditor}
            totalSongsCount={totalSongsCount}
          />
        )}

        {activeTab === 'channels' && (userProfile?.role === 'admin' || userProfile?.role === 'editor') && (
          <ChannelManager userRole={userProfile?.role} />
        )}

        {activeTab === 'sessions' && user && (
          <ActiveSessions userId={user.id} userRole={userProfile?.role} />
        )}
      </div>
    </div>
  );
}
