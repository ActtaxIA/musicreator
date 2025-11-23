'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Song, supabase } from '@/lib/supabase';
import { UserRole } from '@/types';
import { 
  Play, 
  Pause, 
  Download, 
  Heart, 
  Search, 
  Filter,
  Clock,
  Calendar,
  Music,
  MoreVertical,
  Trash2,
  RefreshCw,
  Edit,
  Grid3x3,
  List,
  Radio,
  Save
} from 'lucide-react';

interface Props {
  songs: Song[];
  userRole?: string;
  onToggleFavorite: (songId: string) => void;
  onDelete: (songId: string) => void;
  onRegenerate: (song: Song) => void;
  onUpdatePlayCount: (songId: string) => void;
  onEdit?: (song: Song) => void;
}

export default function SongLibrary({ 
  songs, 
  userRole,
  onToggleFavorite, 
  onDelete, 
  onRegenerate,
  onUpdatePlayCount,
  onEdit
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'duration' | 'plays'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showNoCover, setShowNoCover] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(60);
  const [isGeneratingCovers, setIsGeneratingCovers] = useState(false);
  
  // Estado para creación de canales
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [userChannels, setUserChannels] = useState<any[]>([]); // Lista de canales para el menú contextual
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Cargar canales al montar (para el menú "Añadir a canal")
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'editor') {
      const fetchChannels = async () => {
        const { data } = await supabase.from('channels').select('id, name').eq('is_active', true);
        if (data) setUserChannels(data);
      };
      fetchChannels();
    }
  }, [userRole]);

  // Función para crear canal vacío (Manual)
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    
    setIsCreatingChannel(true);
    try {
      // Canal manual no tiene filtros predefinidos
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName,
          filters: {}, // Filtros vacíos = canal manual
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      alert('✅ Canal creado exitosamente');
      setIsChannelModalOpen(false);
      setNewChannelName('');
      setUserChannels(prev => [...prev, data]); // Actualizar lista local
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Error al crear el canal');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // Función para añadir canción a canal
  const handleAddToChannel = async (songId: string, channelId: string) => {
    try {
      const { error } = await supabase
        .from('channel_songs')
        .insert({
          channel_id: channelId,
          song_id: songId
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          alert('Esta canción ya está en ese canal');
        } else {
          throw error;
        }
      } else {
        alert('✅ Canción añadida al canal');
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error adding to channel:', error);
      alert('Error al añadir al canal');
    }
  };

  // Obtener géneros únicos
  const genres = ['all', ...Array.from(new Set(songs.map(s => s.genre)))];

  // Función auxiliar: Verificar si una canción necesita cover
  // (sin URL o con URL de SunoAPI que caduca)
  const needsCover = (song: Song) => {
    if (!song.image_url) return true;
    // Si la URL es de SunoAPI, también necesita cover (porque caduca)
    return song.image_url.includes('suno') || song.image_url.includes('cdn');
  };

  // Función para actualizar duración en BD (definir ANTES de usarla en handlePlayPause)
  const updateSongDuration = async (songId: string, duration: number) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ duration })
        .eq('id', songId);
      
      if (error) {
        console.error('❌ Error actualizando duration:', error);
      } else {
        console.log('✅ Duration actualizada en BD');
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  // Filtrar y ordenar canciones
  const filteredSongs = songs
    .filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || song.genre === selectedGenre;
      const matchesFavorites = !showFavoritesOnly || song.is_favorite;
      const matchesNoCover = !showNoCover || needsCover(song); // ACTUALIZADO
      
      return matchesSearch && matchesGenre && matchesFavorites && matchesNoCover && song.status === 'complete';
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'plays':
          return b.play_count - a.play_count;
        default:
          return 0;
      }
    });

  // Paginación
  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSongs = filteredSongs.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, sortBy, showFavoritesOnly, showNoCover]);

  // Función para generar covers en masa
  const generateCoversInBulk = async () => {
    const songsWithoutCover = songs.filter(song => needsCover(song) && song.status === 'complete');
    
    if (songsWithoutCover.length === 0) {
      alert('✅ Todas las canciones ya tienen cover permanente!');
      return;
    }

    const confirmed = confirm(
      `¿Generar covers para ${songsWithoutCover.length} canción(es)?\n\n` +
      `Esto costará aproximadamente $${(songsWithoutCover.length * 0.04).toFixed(2)} USD`
    );

    if (!confirmed) return;

    setIsGeneratingCovers(true);
    console.log(`🎨 Generando ${songsWithoutCover.length} covers...`);

    let successCount = 0;
    let errorCount = 0;

    for (const song of songsWithoutCover) {
      try {
        console.log(`🎨 Generando cover para: ${song.title}`);
        
        const response = await fetch('/api/generate-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: song.id,
            title: song.title,
            genre: song.genre,
            mood: song.mood || 'energetic',
            userId: (song as any).user_id,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          successCount++;
          console.log(`✅ Cover generado para: ${song.title}`);
        } else {
          errorCount++;
          console.error(`❌ Error en: ${song.title}`, data.error);
        }

        // Pequeña pausa entre peticiones para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        console.error(`❌ Error generando cover para: ${song.title}`, error);
      }
    }

    setIsGeneratingCovers(false);
    
    alert(
      `✅ Generación masiva completada!\n\n` +
      `✓ Exitosos: ${successCount}\n` +
      `✗ Errores: ${errorCount}\n\n` +
      `Las imágenes aparecerán en unos segundos.`
    );

    // Refrescar la página para ver los nuevos covers
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handlePlayPause = useCallback((song: Song) => {
    if (!song.audio_url) {
      console.error('❌ No hay URL de audio para esta canción:', song);
      alert('Esta canción no tiene URL de audio. Por favor, regenera la canción.');
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    console.log('🎵 Click en play/pause:', {
      title: song.title,
      songId: song.id,
      currentlyPlaying: currentlyPlaying,
      isPaused: audio.paused,
      isAudioPlaying: isAudioPlaying
    });

    // Si es la misma canción
    if (currentlyPlaying === song.id) {
      if (isAudioPlaying) {
        console.log('⏸️ Pausando...');
        audio.pause();
        setIsAudioPlaying(false);
      } else {
        console.log('▶️ Reanudando...');
        audio.play().catch(err => console.error('Error al reanudar:', err));
        setIsAudioPlaying(true);
      }
    } else {
      // Canción diferente - Reiniciar
      console.log('🔄 Cambiando de canción:', song.title);
      
      if (currentlyPlaying) {
        // Si había otra sonando, asegurar que se detenga
        audio.pause();
        audio.currentTime = 0;
      }
      
      // Configurar nueva canción
      audio.src = song.audio_url;
      setCurrentTime(0);
      setDuration(0);
      setCurrentlyPlaying(song.id);
      setIsAudioPlaying(true); // Asumimos que empezará a sonar
      
      // Reproducir
      audio.load();
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Reproducción iniciada');
            onUpdatePlayCount(song.id);
            
            // Intentar obtener duration
            setTimeout(() => {
              if (audio.duration && isFinite(audio.duration)) {
                console.log('✅ Duration inicial:', audio.duration);
                setDuration(audio.duration);
                const realDuration = Math.floor(audio.duration);
                if (song.duration !== realDuration && realDuration > 0) {
                  updateSongDuration(song.id, realDuration);
                }
              }
            }, 500);
          })
          .catch(error => {
            console.error('❌ Error al reproducir:', error);
            setIsAudioPlaying(false);
            setCurrentlyPlaying(null);
          });
      }
    }
  }, [currentlyPlaying, isAudioPlaying, onUpdatePlayCount]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = useCallback(async (audioUrl: string, title: string) => {
    try {
      console.log('🔽 Iniciando descarga de:', title);
      
      // Intentar descarga directa con fetch
      const response = await fetch(audioUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Convertir a blob
      const blob = await response.blob();
      console.log('✅ Blob creado:', blob.size, 'bytes');
      
      // Crear un enlace temporal y forzar descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      
      // Sanitizar el nombre del archivo
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeTitle}.mp3`;
      
      // Añadir atributos adicionales para forzar descarga
      link.setAttribute('download', `${safeTitle}.mp3`);
      link.setAttribute('target', '_blank');
      
      // Trigger la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar después de un pequeño delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✅ Descarga completada');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error al descargar:', error);
      
      // Fallback: abrir en nueva pestaña con download attribute
      console.log('⚠️ Intentando método alternativo...');
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []); // useCallback para memoizar

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Hoy';
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setCurrentlyPlaying(null);
      setCurrentTime(0);
      setDuration(0);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
        
        // Si aún no tenemos duration pero el audio está reproduciendo, intentar obtenerla
        if ((!duration || !isFinite(duration)) && audio.duration && isFinite(audio.duration)) {
          console.log('✅ Duration obtenida durante reproducción:', audio.duration);
          setDuration(audio.duration);
        }
      }
    };

    const handleLoadedMetadata = () => {
      console.log('✅ Metadata cargada, duration:', audio.duration);
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        console.log('⚠️ Metadata cargada pero duration es', audio.duration);
      }
    };

    const handleCanPlay = () => {
      console.log('✅ Audio listo para reproducir, duration:', audio.duration);
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleDurationChange = () => {
      console.log('✅ Duration cambió:', audio.duration);
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleProgress = () => {
      // Este evento se dispara cuando el navegador está descargando el audio
      if (audio.buffered.length > 0 && audio.duration && isFinite(audio.duration)) {
        if (!duration || !isFinite(duration)) {
          console.log('✅ Duration obtenida durante buffering:', audio.duration);
          setDuration(audio.duration);
        }
      }
    };

    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isDragging, duration]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('⚠️ No hay referencia al audio');
      return;
    }
    
    // Intentar obtener la duración de diferentes formas
    let effectiveDuration = duration;
    
    // Si no tenemos duration pero el audio tiene seekable ranges, usarlos
    if ((!effectiveDuration || !isFinite(effectiveDuration)) && audio.seekable.length > 0) {
      effectiveDuration = audio.seekable.end(0);
      console.log('✅ Usando seekable range como duration:', effectiveDuration);
    }
    
    // Si aún no tenemos duration válida, no hacer seek
    if (!effectiveDuration || !isFinite(effectiveDuration)) {
      console.log('⚠️ No se puede hacer seek sin duration válida. Seekable length:', audio.seekable.length);
      // Intentar actualizar duration del audio actual
      if (audio.duration && isFinite(audio.duration)) {
        effectiveDuration = audio.duration;
        setDuration(audio.duration);
        console.log('✅ Duration obtenida del audio:', effectiveDuration);
      } else {
        console.log('❌ No hay forma de obtener duration para hacer seek');
        return;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * effectiveDuration;
    
    console.log('🎯 Click en barra:', {
      x,
      width: rect.width,
      percentage: (percentage * 100).toFixed(1) + '%',
      newTime: newTime.toFixed(2) + 's',
      duration: effectiveDuration.toFixed(2) + 's'
    });
    
    // Verificar que el nuevo tiempo sea válido
    if (!isFinite(newTime) || isNaN(newTime) || newTime < 0) {
      console.log('⚠️ Tiempo calculado no válido:', newTime);
      return;
    }
    
    // Intentar hacer seek
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      console.log('✅ Seek exitoso a', newTime.toFixed(2) + 's');
    } catch (error) {
      console.error('❌ Error al hacer seek:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      {/* Controles y Filtros */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-zinc-200 dark:border-transparent shadow-sm dark:shadow-none transition-all duration-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Barra de búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o descripción..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-purple-500 outline-none transition-colors placeholder-zinc-400 dark:placeholder-zinc-500"
            />
          </div>

          {/* Botón de favoritos */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              showFavoritesOnly
                ? 'bg-pink-50 dark:bg-gradient-to-r from-pink-500 to-red-500 text-pink-600 dark:text-white border-pink-200 dark:border-transparent'
                : 'bg-gray-50 dark:bg-white/5 text-zinc-600 dark:text-gray-300 border-zinc-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-zinc-300'
            }`}
          >
            <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favoritos
          </button>

          {/* NUEVO: Botón para filtrar canciones sin cover */}
          <button
            onClick={() => setShowNoCover(!showNoCover)}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              showNoCover
                ? 'bg-orange-50 dark:bg-gradient-to-r from-orange-500 to-yellow-500 text-orange-600 dark:text-white border-orange-200 dark:border-transparent'
                : 'bg-gray-50 dark:bg-white/5 text-zinc-600 dark:text-gray-300 border-zinc-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-zinc-300'
            }`}
          >
            <Filter className={`w-5 h-5`} />
            Sin Cover ({songs.filter(s => needsCover(s)).length})
          </button>

          {/* NUEVO: Botón para generar covers en masa - SIEMPRE VISIBLE */}
          <button
            onClick={generateCoversInBulk}
            disabled={isGeneratingCovers || songs.filter(s => needsCover(s) && s.status === 'complete').length === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              isGeneratingCovers
                ? 'bg-purple-100 dark:bg-gray-600 text-purple-700 dark:text-gray-300 border-purple-200 dark:border-transparent cursor-wait'
                : songs.filter(s => needsCover(s) && s.status === 'complete').length === 0
                ? 'bg-gray-100 dark:bg-gray-700 text-zinc-400 dark:text-gray-400 border-zinc-200 dark:border-transparent cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-lg hover:scale-105'
            }`}
          >
            {isGeneratingCovers ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                {songs.filter(s => needsCover(s)).length > 0 
                  ? `Generar Covers (${songs.filter(s => needsCover(s)).length})` 
                  : 'Todos tienen Cover ✓'}
              </>
            )}
          </button>

          {/* Botón para crear Canal (Admin/Editor) */}
          {(userRole === 'admin' || userRole === 'editor') && (
            <button
              onClick={() => setIsChannelModalOpen(true)}
              className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border bg-gray-50 dark:bg-white/5 text-zinc-600 dark:text-gray-300 border-zinc-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-zinc-400"
              title="Crear un nuevo canal vacío"
            >
              <Save className="w-5 h-5" />
              Crear Canal
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por género */}
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-gray-400 mb-2">Género</label>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400 dark:text-gray-400" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-purple-500 outline-none transition-colors cursor-pointer"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    {genre === 'all' ? 'Todos los géneros' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-gray-400 mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-purple-500 outline-none transition-colors cursor-pointer [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-white"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="duration">Duración</option>
              <option value="plays">Más escuchadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Channel Creation Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Crear Canal</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Crea un nuevo canal vacío. Podrás añadir canciones manualmente desde el menú de opciones de cada canción.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre del Canal</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Ej: Top Hits Verano, Selección Chill..."
                    className="w-full px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 justify-end">
                <button
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim() || isCreatingChannel}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingChannel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Crear Canal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultados y Toggle de Vista */}
      <div className="flex items-center justify-between">
        <div className="text-gray-400 text-sm">
          {filteredSongs.length} {filteredSongs.length === 1 ? 'canción' : 'canciones'} encontradas
        </div>
        
        {/* Toggle de Vista */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            title="Vista de tarjetas"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vista de Canciones - Grid o Lista */}
      {filteredSongs.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-12 text-center">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No se encontraron canciones
          </h3>
          <p className="text-gray-500">
            {searchQuery || showFavoritesOnly 
              ? 'Intenta ajustar los filtros de búsqueda' 
              : 'Genera tu primera canción para empezar'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {paginatedSongs.map((song) => (
            <div
              key={song.id}
              className="bg-zinc-50 dark:bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden hover:shadow-xl transition-all border border-zinc-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-white/20 group"
            >
              {/* Imagen/Artwork */}
              <div className="relative aspect-square bg-zinc-200 dark:bg-white/5 flex items-center justify-center">
                {song.image_url && !needsCover(song) ? (
                  <img 
                    src={song.image_url} 
                    alt={song.title} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    onError={(e) => {
                      // Si falla la carga, usar placeholder
                      e.currentTarget.src = '/placeholder-album.svg';
                    }}
                  />
                ) : (
                  <img 
                    src="/placeholder-album.svg" 
                    alt="Generando cover..." 
                    className="w-full h-full object-contain p-8 opacity-50" 
                  />
                )}
                
                {/* Botón de reproducir superpuesto */}
                <button
                  onClick={() => handlePlayPause(song)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {currentlyPlaying === song.id && isAudioPlaying ? (
                    <Pause className="w-16 h-16 text-white drop-shadow-lg" />
                  ) : (
                    <Play className="w-16 h-16 text-white drop-shadow-lg" />
                  )}
                </button>

                {/* Badge de favorito */}
                {song.is_favorite && (
                  <div className="absolute top-3 right-3 bg-pink-500 rounded-full p-2 shadow-lg">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </div>

               {/* Información */}
               <div className="p-4 space-y-3">
                 {/* Título */}
                 <h3 className="font-bold text-zinc-900 dark:text-white text-lg line-clamp-2">
                   {song.title}
                 </h3>

                 {/* Género */}
                 <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                   {song.genre}
                 </div>

                 {/* Metadata */}
                 <div className="flex items-center justify-between text-xs text-gray-400">
                   <div className="flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {song.duration ? formatDuration(song.duration) : '--:--'}
                   </div>
                   <div className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {formatDate(song.created_at)}
                   </div>
                   <div className="flex items-center gap-1">
                     <Play className="w-3 h-3" />
                     {song.play_count}
                   </div>
                 </div>

                 {/* Botones de acción */}
                 <div className="space-y-2 pt-2">
                   {/* Barra de progreso (solo si está reproduciendo esta canción) */}
                   {currentlyPlaying === song.id && (
                     <div className="space-y-1">
                       {/* Barra interactiva */}
                       <div 
                         ref={progressBarRef}
                         onMouseDown={handleMouseDown}
                         onMouseMove={handleMouseMove}
                         onMouseUp={handleMouseUp}
                         onMouseLeave={handleMouseUp}
                         className="w-full h-2 bg-white/10 rounded-full cursor-pointer hover:h-3 transition-all relative group"
                       >
                         <div 
                           className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all relative pointer-events-none"
                           style={{ 
                             width: (() => {
                               // Prioridad 1: duration del state
                               if (duration && isFinite(duration)) {
                                 return `${(currentTime / duration) * 100}%`;
                               }
                               // Prioridad 2: seekable del audio
                               if (audioRef.current?.seekable && audioRef.current.seekable.length > 0) {
                                 const seekableDuration = audioRef.current.seekable.end(0);
                                 if (isFinite(seekableDuration)) {
                                   return `${(currentTime / seekableDuration) * 100}%`;
                                 }
                               }
                               // Sin información: 0%
                               return '0%';
                             })()
                           }}
                         >
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                       </div>
                       
                       {/* Tiempos */}
                       <div className="flex justify-between text-xs text-zinc-400">
                         <span>{formatDuration(Math.floor(currentTime))}</span>
                         <span>
                           {duration && isFinite(duration) 
                             ? formatDuration(duration)
                             : (audioRef.current?.seekable && audioRef.current.seekable.length > 0)
                               ? formatDuration(audioRef.current.seekable.end(0))
                               : '--:--'
                           }
                         </span>
                       </div>
                     </div>
                   )}

                   {/* Botón Play/Pause principal */}
                   <button
                     onClick={() => handlePlayPause(song)}
                     className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all flex items-center justify-center gap-2"
                   >
                     {currentlyPlaying === song.id && isAudioPlaying ? (
                       <>
                         <Pause className="w-4 h-4" />
                         Pausar
                       </>
                     ) : (
                       <>
                         <Play className="w-4 h-4" />
                         Reproducir
                       </>
                     )}
                   </button>

                   {/* Botones de acción secundarios */}
                   <div className="grid grid-cols-3 gap-1">
                     {/* Favorito */}
                     <button
                       onClick={() => onToggleFavorite(song.id)}
                       className={`p-2 rounded-lg transition-colors text-xs font-medium ${song.is_favorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                       title={song.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                     >
                       <Heart className={`w-4 h-4 mx-auto ${song.is_favorite ? 'fill-current' : ''}`} />
                     </button>

                     {/* Descargar */}
                     {song.audio_url && (
                       <button
                         onClick={() => handleDownload(song.audio_url!, song.title)}
                         className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 transition-all"
                         title="Descargar MP3"
                       >
                         <Download className="w-4 h-4 mx-auto" />
                       </button>
                     )}

                     {/* Regenerar */}
                     <button
                       onClick={() => onRegenerate(song)}
                       className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 transition-all"
                       title="Regenerar similar"
                     >
                       <RefreshCw className="w-4 h-4 mx-auto" />
                     </button>
                   </div>

                   {/* Botones adicionales: Añadir a Canal, Editar, Eliminar */}
                   <div className="grid grid-cols-3 gap-1">
                     {/* Añadir a Canal (Admin/Editor) */}
                     {(userRole === 'admin' || userRole === 'editor') && userChannels.length > 0 && (
                       <div className="relative col-span-3">
                         <button
                           onClick={() => setOpenMenuId(openMenuId === song.id ? null : song.id)}
                           className="w-full p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all text-xs font-medium flex items-center justify-center gap-1"
                         >
                           <Radio className="w-3 h-3" />
                           Añadir a Canal
                         </button>
                         
                         {/* Dropdown de canales */}
                         {openMenuId === song.id && (
                           <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden z-50 max-h-40 overflow-y-auto">
                             {userChannels.map(channel => (
                               <button
                                 key={channel.id}
                                 onClick={() => {
                                   handleAddToChannel(song.id, channel.id);
                                   setOpenMenuId(null);
                                 }}
                                 className="w-full px-3 py-2 text-left text-zinc-800 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 text-xs border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                               >
                                 <Radio className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                 <span className="font-medium truncate">{channel.name}</span>
                               </button>
                             ))}
                           </div>
                         )}
                       </div>
                     )}

                     {/* Editar */}
                     {onEdit && (
                       <button
                         onClick={() => onEdit(song)}
                         className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 transition-all"
                         title="Editar con IA"
                       >
                         <Edit className="w-4 h-4 mx-auto" />
                       </button>
                     )}

                     {/* Generar Cover (si falta) */}
                     {needsCover(song) && (
                       <button
                         onClick={async () => {
                           const userId = (song as any).user_id;
                           try {
                             const response = await fetch('/api/generate-cover', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 songId: song.id,
                                 title: song.title,
                                 genre: song.genre,
                                 mood: song.mood || 'energetic',
                                 userId: userId,
                               }),
                             });
                             const data = await response.json();
                             if (data.success) {
                               alert('✅ Cover generándose!');
                               setTimeout(() => window.location.reload(), 3000);
                             } else {
                               alert('❌ Error: ' + data.error);
                             }
                           } catch (error) {
                             alert('❌ Error generando cover');
                           }
                         }}
                         className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all"
                         title="Generar Cover"
                       >
                         <Music className="w-4 h-4 mx-auto" />
                       </button>
                     )}

                     {/* Eliminar */}
                     <button
                       onClick={() => {
                         if (confirm('¿Estás seguro de eliminar esta canción?')) {
                           onDelete(song.id);
                         }
                       }}
                       className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                       title="Eliminar"
                     >
                       <Trash2 className="w-4 h-4 mx-auto" />
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Siguiente
            </button>
            
            <span className="ml-4 text-gray-400 text-sm">
              Página {currentPage} de {totalPages} ({filteredSongs.length} canciones)
            </span>
          </div>
        )}
        </>
      ) : (
        /* Vista de Lista */
        <>
        <div className="space-y-3">
          {paginatedSongs.map((song) => (
            <div
              key={song.id}
              className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4 transition-all hover:border-blue-500 dark:hover:border-white/20 flex flex-col sm:flex-row gap-4 sm:items-center group shadow-sm hover:shadow-md"
            >
              {/* SECCIÓN PRINCIPAL: Play + Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                
                {/* Botón de Play/Pause Grande */}
                <button
                  onClick={() => handlePlayPause(song)}
                  className="flex-shrink-0 w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/20 hover:scale-105"
                >
                  {currentlyPlaying === song.id && isAudioPlaying ? (
                    <Pause className="w-6 h-6 sm:w-5 sm:h-5 text-white fill-current" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-5 sm:h-5 text-white fill-current ml-1" />
                  )}
                </button>

                {/* Portada */}
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shadow-inner border border-zinc-200 dark:border-white/5">
                  {song.image_url && !needsCover(song) ? (
                    <img 
                      src={song.image_url} 
                      alt={song.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-album.svg';
                      }}
                    />
                  ) : (
                    <Music className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-300 dark:text-white/30" />
                  )}
                </div>

                {/* Información de Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg truncate leading-tight">
                      {song.title}
                    </h3>
                    {song.is_favorite && (
                      <Heart className="w-4 h-4 text-pink-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Metadata compacta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                     <span className="bg-purple-50 dark:bg-white/5 px-2 py-0.5 rounded text-purple-600 dark:text-purple-300 font-medium border border-purple-100 dark:border-white/5">
                       {song.genre}
                     </span>
                     <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {song.duration ? formatDuration(song.duration) : '--:--'}
                     </div>
                     {/* Barra de progreso desktop */}
                     {currentlyPlaying === song.id && duration > 0 && (
                        <span className="hidden sm:inline text-purple-600 dark:text-purple-400 font-mono">
                           {formatDuration(currentTime)}
                        </span>
                     )}
                  </div>
                </div>
              </div>

              {/* Barra de progreso (Móvil - Debajo de la info) */}
              {currentlyPlaying === song.id && (
                <div className="w-full sm:hidden px-1">
                   <div className="h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 animate-pulse" 
                        style={{ width: duration > 0 && isFinite(duration) ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                   </div>
                   <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 font-mono">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                   </div>
                </div>
              )}

              {/* SECCIÓN BOTONES: Debajo en móvil / Derecha en desktop */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 pt-3 sm:pt-0 border-t border-zinc-100 dark:border-white/5 sm:border-0 mt-1 sm:mt-0">
                 
                 {/* Grupo Izquierdo (Móvil) / Principal */}
                 <div className="flex items-center gap-2">
                    {/* Favorito */}
                    <button
                      onClick={() => onToggleFavorite(song.id)}
                      className={`p-2.5 rounded-lg transition-colors border ${song.is_favorite ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-500 border-pink-200 dark:border-pink-500/20' : 'bg-zinc-50 dark:bg-white/5 text-zinc-400 dark:text-gray-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white'}`}
                      title={song.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <Heart className={`w-5 h-5 ${song.is_favorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Descargar */}
                    {song.audio_url && (
                      <button
                        onClick={() => handleDownload(song.audio_url!, song.title)}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-white/5"
                        title="Descargar MP3"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}

                    {/* Regenerar */}
                    <button
                      onClick={() => onRegenerate(song)}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-white/5"
                      title="Regenerar similar"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Grupo Derecho (Acciones Extra) */}
                 <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-white/10">
                    {/* Cover Gen */}
                    {needsCover(song) && (
                      <button
                        onClick={async () => {
                          const userId = (song as any).user_id;
                          try {
                            const response = await fetch('/api/generate-cover', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                songId: song.id,
                                title: song.title,
                                genre: song.genre,
                                mood: song.mood || 'energetic',
                                userId: userId,
                              }),
                            });
                            const data = await response.json();
                            if (data.success) {
                              alert('✅ Cover generándose! Aparecerá en 10-30 segundos.');
                              setTimeout(() => window.location.reload(), 3000);
                            } else {
                              alert('❌ Error: ' + data.error);
                            }
                          } catch (error) {
                            alert('❌ Error generando cover');
                          }
                        }}
                        className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 transition-colors"
                        title="Generar Cover con IA"
                      >
                        <Music className="w-5 h-5" />
                      </button>
                    )}

                    {/* Editar */}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(song)}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-white/5"
                        title="Editar con IA"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}

                    {/* Eliminar */}
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta canción?')) {
                          onDelete(song.id);
                        }
                      }}
                      className="p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Siguiente
            </button>
            
            <span className="ml-4 text-gray-400 text-sm">
              Página {currentPage} de {totalPages} ({filteredSongs.length} canciones)
            </span>
          </div>
        )}
        </>
      )}

      {/* Audio player oculto */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
