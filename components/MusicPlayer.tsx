'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Song, supabase } from '@/lib/supabase';
import { Channel } from '@/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  List,
  Music2,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Heart,
  Search,
  Globe,
  Radio,
  X,
  Trash2
} from 'lucide-react';

type SortKey = 'title' | 'mood' | 'genre' | 'bpm' | 'language' | 'duration';

interface Props {
  songs: Song[];
  userId?: string;
  userRole?: string;
  onToggleFavorite: (songId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function MusicPlayer({ 
  songs, 
  userId, 
  userRole, 
  onToggleFavorite,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const queueItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<Song[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showArtwork, setShowArtwork] = useState(true);

  // Cargar canales al montar
  useEffect(() => {
    const fetchChannels = async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setChannels(data);
    };
    fetchChannels();
  }, []);

  const handleSelectChannel = async (channel: Channel) => {
    if (activeChannelId === channel.id) {
      // Deseleccionar (volver a todas las canciones)
      setActiveChannelId(null);
      setQueue(songs); // Restaurar lista original (filtrada por otros criterios si los hubiera)
    } else {
      // Seleccionar canal
      setActiveChannelId(channel.id);
      
      try {
        // Obtener canciones del canal desde la tabla intermedia
        const { data: channelSongs, error } = await supabase
          .from('channel_songs')
          .select('song_id')
          .eq('channel_id', channel.id);

        if (error) throw error;

        const songIds = channelSongs.map(item => item.song_id);
        
        // Filtrar la lista actual de canciones para mostrar solo las del canal
        const songsInChannel = songs.filter(song => songIds.includes(song.id));
        
        setQueue(songsInChannel);
        setCurrentSongIndex(0); // Reiniciar índice
        
      } catch (error) {
        console.error('Error loading channel songs:', error);
        alert('Error al cargar canciones del canal');
      }
    }
  };

  // Obtener géneros únicos y ordenar alfabéticamente
  const uniqueGenres = Array.from(new Set(songs.map(s => s.genre))).sort();
  const genres = ['all', ...uniqueGenres];
  
  // Mapeo de idiomas a español
  const languageMap: { [key: string]: string } = {
    'spanish': 'Español',
    'english': 'Inglés',
    'instrumental': 'Instrumental',
    'french': 'Francés',
    'italian': 'Italiano',
    'portuguese': 'Portugués',
    'german': 'Alemán',
    'japanese': 'Japonés',
    'Español': 'Español',
    'Inglés': 'Inglés',
    'Desconocido': 'Desconocido'
  };
  
  // Obtener idiomas únicos, normalizar, eliminar duplicados y ordenar alfabéticamente
  const rawLanguages = Array.from(new Set(songs.map(s => s.language || 'Desconocido')));
  const normalizedLanguages = rawLanguages.map(lang => languageMap[lang] || lang);
  const uniqueLanguages = Array.from(new Set(normalizedLanguages)).sort();
  const languages = ['all', ...uniqueLanguages];

  // Filtrar canciones por género, idioma y favoritos
  const filteredSongs = songs.filter(song => {
    const songLanguage = languageMap[song.language || 'Desconocido'] || song.language || 'Desconocido';
    const matchesSearch = searchQuery === '' || 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.mood && song.mood.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorites = showFavoritesOnly ? song.is_favorite : true;

    return (
      (selectedGenre === 'all' || song.genre === selectedGenre) && 
      (selectedLanguage === 'all' || songLanguage === selectedLanguage) &&
      matchesSearch &&
      matchesFavorites &&
      song.status === 'complete' && 
      song.audio_url
    );
  });

  // Canción actual de la cola
  const currentSong = queue[currentSongIndex];

  // Inicializar cola al montar o cuando cambian las canciones
  useEffect(() => {
    if (filteredSongs.length > 0) {
      // Guardar ID de la canción actual
      const currentSongId = queue[currentSongIndex]?.id;
      
      setQueue(filteredSongs);
      
      // Intentar mantener la canción actual
      if (currentSongId) {
        const newIndex = filteredSongs.findIndex(s => s.id === currentSongId);
        if (newIndex !== -1) {
          setCurrentSongIndex(newIndex);
        } else {
          setCurrentSongIndex(0);
        }
      } else if (queue.length === 0) {
        setCurrentSongIndex(0);
      }
    }
  }, [songs]); 

  // Actualizar cola cuando cambia el género, idioma, búsqueda o filtro de favoritos
  useEffect(() => {
    if (filteredSongs.length > 0) {
      // Guardar ID de la canción actual
      const currentSongId = queue[currentSongIndex]?.id;
      
      setQueue(filteredSongs);
      
      // Intentar mantener la canción actual en la nueva lista filtrada
      if (currentSongId) {
        const newIndex = filteredSongs.findIndex(s => s.id === currentSongId);
        if (newIndex !== -1) {
          setCurrentSongIndex(newIndex);
        } else {
          // Si la canción que suena ya no está en el filtro, no la paramos, 
          // pero el índice apuntará a la primera de la nueva lista si cambiamos.
          // Para UI, mostramos la primera de la lista filtrada como seleccionada visualmente o 0.
          setCurrentSongIndex(0); 
        }
      } else {
        setCurrentSongIndex(0);
      }
      // setIsPlaying(false); // NO pausar al filtrar, es molesto
    } else if (filteredSongs.length === 0 && queue.length > 0) {
        // Si el filtro no deja resultados, vaciar cola visual pero mantener audio si suena?
        // Mejor dejarlo vacío
        setQueue([]);
    }
  }, [selectedGenre, selectedLanguage, searchQuery, showFavoritesOnly]);

  // NO hay useEffect para shuffle - solo afecta al handleNext

  // Scroll automático en la cola cuando cambia la canción
  useEffect(() => {
    if (currentSongIndex >= 0 && queueItemRefs.current[currentSongIndex]) {
      queueItemRefs.current[currentSongIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSongIndex]);

  // Configurar audio cuando cambia la canción
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    // Resetear estados
    setCurrentTime(0);
    setDuration(0);

    // Cargar nueva canción
    audio.src = currentSong.audio_url || '';
    audio.volume = isMuted ? 0 : volume;
    audio.load();

    // Reproducir automáticamente si estaba sonando
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Error playing:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentSong?.id, currentSong?.audio_url]); // Solo cuando cambia la ID o URL de la canción actual

  // Actualizar volumen
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const [shuffleHistory, setShuffleHistory] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Resetear historial de shuffle cuando cambia la cola o se desactiva shuffle
  useEffect(() => {
    if (!isShuffled || queue.length === 0) {
      setShuffleHistory([]);
    }
  }, [isShuffled, queue.length]);

  // ⚡ INFINITE SCROLL: Detectar cuando el usuario llega al final de la lista
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const threshold = target.scrollHeight - 200; // 200px antes del final
    
    // Si llegamos cerca del final y hay más canciones disponibles
    if (scrollPosition >= threshold && hasMore && onLoadMore && !isLoadingMore) {
      console.log('📊 Infinite scroll triggered - Loading more songs...');
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoadingMore]);

  // Función para actualizar duración en BD
  const updateSongDuration = async (songId: string, duration: number) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ duration })
        .eq('id', songId);
      
      if (error) {
        console.error('❌ Error actualizando duration:', error);
      } else {
        console.log('✅ Duration actualizada en BD desde Player');
        // Actualizar estado local también
        setQueue(prev => prev.map(s => s.id === songId ? { ...s, duration } : s));
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // Funciones de control - definir ANTES de los event listeners
  const handleNext = useCallback(() => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Error playing:', err));
      }
      return;
    }

    if (isShuffled) {
      if (queue.length <= 1) return;
      
      // Añadir canción actual al historial
      const newHistory = [...shuffleHistory, currentSongIndex];
      
      // Si ya escuchamos todas (menos la actual), reiniciar historial
      // Dejamos la actual en el historial para no repetirla inmediatamente
      let availableIndices = queue.map((_, i) => i).filter(i => !newHistory.includes(i));
      
      if (availableIndices.length === 0) {
        // Si se acabaron, reiniciamos el historial (barajamos de nuevo)
        // Pero excluimos la actual para no repetirla justo ahora
        availableIndices = queue.map((_, i) => i).filter(i => i !== currentSongIndex);
        setShuffleHistory([currentSongIndex]);
      } else {
        setShuffleHistory(newHistory);
      }
      
      // Elegir uno al azar de los disponibles
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      
      setCurrentSongIndex(randomIndex);
      setIsPlaying(true);
    } else {
      // Modo normal: siguiente en orden
      if (currentSongIndex < queue.length - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
        setIsPlaying(true);
      } else if (repeatMode === 'all') {
        setCurrentSongIndex(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [repeatMode, currentSongIndex, queue.length, isShuffled, shuffleHistory]);

  const handlePrevious = () => {
    if (currentTime > 3) {
      // Si ya pasaron 3 segundos, reinicia la canción
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
    } else if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setIsPlaying(true); // Auto-play anterior
    } else {
      // Si estamos en la primera canción, reiniciarla
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
    }
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Error playing:', err));
    }
  };

  // Event listeners del audio - DESPUÉS de definir handleNext
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handleDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
        
        // Si la canción actual tiene duration 0 en los datos, actualizarla
        if (currentSong && (!currentSong.duration || currentSong.duration === 0)) {
           const newDuration = Math.floor(audio.duration);
           if (newDuration > 0) {
             updateSongDuration(currentSong.id, newDuration);
           }
        }
      }
    };
    const handleEnded = () => handleNext();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handleNext]); // Incluir handleNext en dependencias

  // Media Session API - Controles en pantalla de bloqueo y notificaciones
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        // Actualizar metadata con información completa
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title || 'Sin título',
          artist: currentSong.genre || 'Narciso Music Generator',
          album: currentSong.mood || 'Generated Music',
          artwork: currentSong.image_url ? [
            { src: currentSong.image_url, sizes: '96x96', type: 'image/jpeg' },
            { src: currentSong.image_url, sizes: '128x128', type: 'image/jpeg' },
            { src: currentSong.image_url, sizes: '192x192', type: 'image/jpeg' },
            { src: currentSong.image_url, sizes: '256x256', type: 'image/jpeg' },
            { src: currentSong.image_url, sizes: '384x384', type: 'image/jpeg' },
            { src: currentSong.image_url, sizes: '512x512', type: 'image/jpeg' }
          ] : [
            { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
          ]
        });

        // Configurar action handlers (SIEMPRE, incluso si hay una sola canción)
        navigator.mediaSession.setActionHandler('play', () => {
          console.log('Media Session: Play');
          const audio = audioRef.current;
          if (audio) {
            audio.play();
            setIsPlaying(true);
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          console.log('Media Session: Pause');
          const audio = audioRef.current;
          if (audio) {
            audio.pause();
            setIsPlaying(false);
          }
        });

        // CRÍTICO: Configurar previoustrack y nexttrack SIEMPRE para iOS
        // Incluso si hay una sola canción, iOS necesita ver que los handlers existen
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          console.log('Media Session: Previous Track');
          handlePrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          console.log('Media Session: Next Track');
          handleNext();
        });

        // ❌ DESACTIVAR seek handlers para priorizar botones de cambio de canción
        // Si estos están activos, iOS/Android muestran ⏪10s y ⏩10s en lugar de ⏮️ y ⏭️
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);

        // Seek to (para la barra de progreso táctil)
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          console.log('Media Session: Seek To', details.seekTime);
          const audio = audioRef.current;
          if (audio && details.seekTime !== null && details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });

        // Actualizar playback state
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        // Actualizar posición (para la barra de progreso del sistema)
        const updatePositionState = () => {
          if ('setPositionState' in navigator.mediaSession && audio.duration && isFinite(audio.duration)) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: Math.min(audio.currentTime, audio.duration)
              });
            } catch (error) {
              // Ignorar errores de posición (puede pasar si el audio está cargando)
            }
          }
        };

        // Actualizar posición inmediatamente y cada segundo
        updatePositionState();
        const positionInterval = setInterval(updatePositionState, 1000);

        return () => {
          clearInterval(positionInterval);
        };
      } catch (error) {
        console.error('Error setting up Media Session:', error);
      }
    }

    // Cleanup al desmontar o cambiar de canción
    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekto', null);
          // seekbackward y seekforward ya están en null, no hace falta limpiarlos
        } catch (error) {
          // Ignorar errores al limpiar
        }
      }
    };
  }, [currentSong, isPlaying, handleNext, handlePrevious]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(false);
    const audio = audioRef.current;
    if (audio) audio.volume = value;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setIsMuted(!isMuted);
    audio.volume = isMuted ? volume : 0;
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const playSongAtIndex = (index: number) => {
    if (index === currentSongIndex && isPlaying) {
      // Si es la misma canción y está sonando, pausar
      setIsPlaying(false);
    } else {
      // Cambiar a la canción seleccionada y reproducir
      setCurrentSongIndex(index);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const currentSongId = queue[currentSongIndex]?.id;

    const sortedQueue = [...queue].sort((a, b) => {
      let valueA: any = '';
      let valueB: any = '';

      switch (key) {
        case 'title':
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
          break;
        case 'mood':
          valueA = (a.mood || '').toLowerCase();
          valueB = (b.mood || '').toLowerCase();
          break;
        case 'genre':
          valueA = (a.genre || '').toLowerCase();
          valueB = (b.genre || '').toLowerCase();
          break;
        case 'bpm':
          const bpmA = (a.tags + ' ' + a.prompt).match(/(\d+)\s*bpm/i);
          const bpmB = (b.tags + ' ' + b.prompt).match(/(\d+)\s*bpm/i);
          valueA = bpmA ? parseInt(bpmA[1]) : 0;
          valueB = bpmB ? parseInt(bpmB[1]) : 0;
          break;
        case 'language':
          valueA = (a.language || '').toLowerCase();
          valueB = (b.language || '').toLowerCase();
          break;
        case 'duration':
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setQueue(sortedQueue);

    if (currentSongId) {
      const newIndex = sortedQueue.findIndex(s => s.id === currentSongId);
      if (newIndex !== -1) setCurrentSongIndex(newIndex);
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    }
    return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };

  // Renderizar pantalla de bienvenida solo si NO HAY CANCIONES EN TOTAL (base de datos vacía)
  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center">
          <Music2 className="w-24 h-24 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">No hay canciones disponibles</h2>
          <p className="text-gray-400">Genera algunas canciones primero para poder reproducirlas</p>
        </div>
      </div>
    );
  }

  // Si hay canciones pero el filtro no devuelve nada, mostrar estructura vacía
  // currentSong puede ser undefined si queue está vacía


  return (
    <div className="h-auto lg:h-[680px] bg-gray-100 dark:bg-[#09090b] p-4 pb-0 flex flex-col font-sans overflow-y-auto lg:overflow-hidden rounded-b-xl transition-colors duration-200">
      <audio ref={audioRef} />

      {/* Grid Principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-0 h-auto lg:h-full w-full max-w-[1600px] mx-auto pb-4">
        
        {/* COLUMNA IZQUIERDA: PLAYER MAESTRO */}
        <div className="flex flex-col min-h-0 h-auto lg:h-full overflow-visible lg:overflow-hidden shrink-0">
          <div className="bg-white dark:bg-[#18181b] rounded-xl p-4 border border-zinc-300 dark:border-white/5 shadow-2xl flex flex-col h-auto lg:h-full relative overflow-hidden group transition-colors duration-200">
            
            {/* Background Blur Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Toggle Carátula (Solo visible en móvil) */}
            <button
              onClick={() => setShowArtwork(!showArtwork)}
              className="lg:hidden absolute top-2 right-2 z-20 p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700"
              title={showArtwork ? "Ocultar carátula" : "Mostrar carátula"}
            >
              {showArtwork ? (
                <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>

            {/* 1. ARTWORK & INFO */}
            <div className={`flex-1 flex flex-col justify-center items-center text-center space-y-4 z-10 min-h-0 transition-all duration-300 ${!showArtwork ? 'lg:flex hidden' : ''}`}>
              <div className="relative w-48 h-48 rounded-lg shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500 shrink-0">
                {currentSong?.image_url ? (
                  <>
                    <img
                      src={currentSong.image_url}
                      alt={currentSong.title}
                      className="w-full h-full object-cover rounded-lg shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
                    />
                    {/* Glow trasero basado en la imagen */}
                    <div className="absolute -inset-4 bg-white/5 blur-2xl -z-10 rounded-full opacity-20" />
                  </>
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center rounded-lg">
                    <Music2 className="w-16 h-16 text-zinc-600" />
                  </div>
                )}
              </div>

              <div className="space-y-1 w-full shrink-0">
                <div className="flex items-center justify-center gap-3 px-4 w-full">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate max-w-[80%]">
                    {currentSong?.title || 'Seleccione una canción'}
                  </h2>
                  {currentSong && (
                    <button 
                      onClick={() => onToggleFavorite(currentSong.id)}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-500 transition-colors"
                      title={currentSong.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <Heart className={`w-5 h-5 ${currentSong.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-600 dark:text-zinc-500">
                  <span className="border border-zinc-400 dark:border-zinc-700 px-1.5 py-0.5 rounded hover:border-zinc-600 dark:hover:border-zinc-500 transition-colors cursor-default">
                    {currentSong?.genre || '-'}
                  </span>
                  {currentSong?.mood && (
                    <span className="border border-zinc-400 dark:border-zinc-700 px-1.5 py-0.5 rounded hover:border-zinc-600 dark:hover:border-zinc-500 transition-colors cursor-default">
                      {currentSong.mood}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. VISUALIZADOR (Fake) */}
            <div className={`h-6 flex items-end justify-center gap-0.5 mb-3 z-10 opacity-40 shrink-0 transition-all duration-300 ${!showArtwork ? 'lg:flex hidden' : ''}`}>
              {isPlaying && Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-500/80 rounded-t-[1px] animate-music-bar"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDuration: `${0.4 + Math.random() * 0.4}s`
                  }}
                />
              ))}
              {!isPlaying && <div className="h-[1px] w-full bg-zinc-800 rounded-full" />}
            </div>

            {/* 3. CONTROLES PRO */}
            <div className="space-y-4 z-10 bg-white/90 dark:bg-[#141417]/80 backdrop-blur-md rounded-lg p-3 shrink-0 border border-zinc-300 dark:border-white/5">
              {/* Progress Bar */}
              <div className="group/progress space-y-1.5">
                <div
                  onClick={handleSeek}
                  className="w-full h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full cursor-pointer relative overflow-hidden group-hover/progress:h-1.5 transition-all"
                >
                  <div
                    className="h-full bg-blue-500 dark:bg-zinc-400 rounded-full relative group-hover/progress:bg-blue-600 dark:group-hover/progress:bg-cyan-400 transition-colors"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity scale-150" />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-medium text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 rounded-md transition-all ${isShuffled ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <button onClick={handlePrevious} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-transform hover:scale-110 active:scale-95">
                    <SkipBack className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 flex items-center justify-center bg-blue-500 dark:bg-zinc-200 text-white dark:text-black rounded-full hover:scale-105 hover:bg-blue-600 dark:hover:bg-cyan-400 hover:text-white dark:hover:text-black transition-all shadow-lg active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-0.5" />}
                  </button>

                  <button onClick={handleNext} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-transform hover:scale-110 active:scale-95">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                <button
                  onClick={toggleRepeat}
                  className={`p-1.5 rounded-md transition-all relative ${repeatMode !== 'off' ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  <Repeat className="w-4 h-4" />
                  {repeatMode === 'one' && <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-cyan-400 rounded-full" />}
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded border border-white/5">
                <button onClick={toggleMute} className="text-zinc-500 hover:text-zinc-300">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400 hover:accent-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: BIBLIOTECA & FILTROS */}
        <div className="flex flex-col gap-4 min-h-0 h-[500px] lg:h-full overflow-hidden">
          
          {/* CANALES (Playlists Curadas) */}
          {channels.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 custom-scrollbar px-1">
              {channels.map(channel => (
                <div key={channel.id} className="relative group/channel shrink-0">
                  <button
                    onClick={() => handleSelectChannel(channel)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                      activeChannelId === channel.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-white/10 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white'
                    }`}
                    title={channel.description}
                  >
                    <Radio className="w-3 h-3" />
                    {channel.name}
                  </button>
                  
                  {/* Botón de eliminar (Admin/Editor) */}
                  {(userRole === 'admin' || userRole === 'editor') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChannel(channel.id);
                      }}
                      className="absolute -top-1.5 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/channel:opacity-100 transition-opacity shadow-sm hover:bg-red-600 hover:scale-110 z-10"
                      title="Eliminar canal"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* BARRA SUPERIOR DE FILTROS (Dropdowns Técnicos) */}
          <div className="bg-white dark:bg-[#18181b] rounded-xl p-3 border border-zinc-300 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg shrink-0 gap-3 transition-colors duration-200">
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest pl-2 flex-1 min-w-0 w-full md:w-auto">
              <List className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap mr-2">Library ({queue.length})</span>
              
              {/* Búsqueda */}
              <div className="relative flex-1 w-full md:max-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-gray-100 dark:bg-black/20 border border-zinc-300 dark:border-white/5 rounded px-8 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 dark:focus:border-white/20 transition-colors"
                />
                <Search className="w-3 h-3 text-zinc-400 dark:text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Botón Favoritos */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-3 py-2 md:py-1.5 rounded border text-xs font-medium transition-all uppercase tracking-wide ${
                  showFavoritesOnly 
                    ? 'bg-pink-500/10 text-pink-500 border-pink-500' 
                    : 'bg-white dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title={showFavoritesOnly ? "Ver todas" : "Ver solo favoritos"}
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favoritos</span>
              </button>

              {/* Dropdown Género */}
              <div className="relative group w-full md:w-auto">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full md:w-auto appearance-none bg-white dark:bg-[#09090b] text-xs font-bold text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded px-3 py-2 md:py-1.5 pr-8 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500/50 uppercase tracking-wide min-w-[140px] cursor-pointer shadow-sm"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="text-zinc-900 dark:text-white bg-white dark:bg-[#09090b] font-medium">{genre === 'all' ? 'TODOS LOS GÉNEROS' : genre}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 dark:text-zinc-500">
                   <Music2 className="w-3 h-3" />
                </div>
              </div>

              {/* Dropdown Idioma */}
              <div className="relative group w-full md:w-auto">
                 <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full md:w-auto appearance-none bg-white dark:bg-[#09090b] text-xs font-bold text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded px-3 py-2 md:py-1.5 pr-8 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500/50 uppercase tracking-wide min-w-[120px] cursor-pointer shadow-sm"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang} className="text-zinc-900 dark:text-white bg-white dark:bg-[#09090b] font-medium">{lang === 'all' ? 'TODOS IDIOMAS' : lang}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 dark:text-zinc-500">
                   <Globe className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE CANCIONES (Estilo Data Table) */}
          <div className="flex-1 bg-white dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col shadow-lg min-h-0">
            {/* Header de la Tabla */}
            <div className="grid grid-cols-[40px_30px_1fr_60px] md:grid-cols-[40px_30px_1fr_100px_100px_60px_60px_60px] gap-3 p-3 border-b border-zinc-200 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-wider bg-gray-50 dark:bg-[#18181b] z-10 shrink-0">
              <span className="text-center">#</span>
              <span className="text-center"></span> {/* Columna vacía para corazón */}
              <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-left">
                Track {getSortIcon('title')}
              </button>
              <button onClick={() => handleSort('mood')} className="hidden md:flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-left">
                Mood {getSortIcon('mood')}
              </button>
              <button onClick={() => handleSort('genre')} className="hidden md:flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-left">
                Genre {getSortIcon('genre')}
              </button>
              <button onClick={() => handleSort('bpm')} className="hidden md:flex items-center justify-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-center">
                BPM {getSortIcon('bpm')}
              </button>
              <button onClick={() => handleSort('language')} className="hidden md:flex items-center justify-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-center">
                Lang {getSortIcon('language')}
              </button>
              <button onClick={() => handleSort('duration')} className="flex items-center justify-end gap-1 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors group text-right">
                Time {getSortIcon('duration')}
              </button>
            </div>

            <div 
              className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2"
              onScroll={handleScroll}
            >
              {queue.map((song, index) => {
                // Extraer BPM
                const bpmMatch = (song.tags + ' ' + song.prompt).match(/(\d+)\s*bpm/i);
                const bpm = bpmMatch ? bpmMatch[1] : '-';

                return (
                <div
                  key={`${song.id}-${index}`}
                  ref={(el) => { queueItemRefs.current[index] = el as any }}
                  onClick={() => playSongAtIndex(index)}
                  role="button"
                  tabIndex={0}
                  className={`w-full grid grid-cols-[40px_30px_1fr_60px] md:grid-cols-[40px_30px_1fr_100px_100px_60px_60px_60px] gap-3 items-center p-3 rounded-lg transition-all text-left group border border-transparent cursor-pointer ${
                    index === currentSongIndex
                      ? 'bg-blue-50 dark:bg-white/5 text-blue-700 dark:text-white border-blue-100 dark:border-white/5 font-medium'
                      : 'text-zinc-700 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.02] hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {/* Index / Playing Icon */}
                  <div className="flex justify-center pointer-events-none">
                    {index === currentSongIndex && isPlaying ? (
                       <div className="flex items-end gap-[2px] h-3 w-3 pb-0.5">
                          <div className="w-0.5 bg-blue-500 dark:bg-cyan-400 animate-music-bar h-full" style={{animationDelay:'0s'}}/>
                          <div className="w-0.5 bg-blue-500 dark:bg-cyan-400 animate-music-bar h-2/3" style={{animationDelay:'0.2s'}}/>
                          <div className="w-0.5 bg-blue-500 dark:bg-cyan-400 animate-music-bar h-full" style={{animationDelay:'0.4s'}}/>
                       </div>
                    ) : (
                       <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 group-hover:hidden">{index + 1}</span>
                    )}
                    <Play className={`w-3 h-3 hidden ${index !== currentSongIndex && 'group-hover:block opacity-70'}`} />
                  </div>

                  {/* Corazón (Favorito) */}
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(song.id);
                        }}
                        className="text-zinc-400 dark:text-zinc-600 hover:text-pink-500 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/5"
                    >
                        <Heart className={`w-3.5 h-3.5 ${song.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>
                  </div>

                  {/* Título & Art (Mini) */}
                  <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
                    <img 
                      src={song.image_url || '/placeholder-album.svg'} 
                      className={`w-8 h-8 rounded object-cover shadow-sm ${index === currentSongIndex ? 'opacity-100 ring-1 ring-blue-500/30 dark:ring-cyan-500/30' : 'opacity-90 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all'}`}
                      alt=""
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`truncate font-bold text-xs ${index === currentSongIndex ? 'text-blue-600 dark:text-cyan-400' : 'text-zinc-800 dark:text-white'}`}>
                        {song.title}
                      </span>
                      <span className="truncate text-[9px] text-zinc-500 dark:text-zinc-500 md:hidden">
                        {song.genre} • {song.mood || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Mood (Desktop) */}
                  <div className="truncate text-[10px] uppercase tracking-wide text-zinc-600 dark:text-zinc-500 hidden md:block pointer-events-none font-medium">
                    {song.mood || '-'}
                  </div>

                  {/* Género (Desktop) */}
                  <div className="truncate text-[10px] uppercase tracking-wide text-zinc-600 dark:text-zinc-500 font-bold hidden md:block pointer-events-none">
                    {song.genre}
                  </div>

                  {/* BPM (Desktop) */}
                  <div className="truncate text-[10px] font-mono text-zinc-500 dark:text-zinc-500 text-center hidden md:block pointer-events-none">
                    {bpm}
                  </div>

                  {/* Idioma (Desktop) */}
                  <div className="truncate text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500 text-center hidden md:block pointer-events-none">
                    {languageMap[song.language || ''] || (song.language?.substring(0, 3) || '-')}
                  </div>

                  {/* Duración */}
                  <div className="text-right text-[10px] font-mono text-zinc-500 dark:text-zinc-500 pointer-events-none">
                    {formatTime(song.duration)}
                  </div>
                </div>
                );
              })}

              {/* Indicador de carga para infinite scroll */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
                  <span className="ml-3 text-xs text-zinc-600 dark:text-zinc-500">Cargando más canciones...</span>
                </div>
              )}

              {/* Mensaje cuando ya no hay más canciones */}
              {!hasMore && queue.length > 0 && (
                <div className="text-center py-4 text-xs text-zinc-500 dark:text-zinc-600">
                  ✅ Todas las canciones cargadas ({queue.length} en total)
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes music-bar {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        .animate-music-bar {
          animation: music-bar 0.5s ease-in-out infinite alternate;
        }
      ` }} />
    </div>
  );
}

