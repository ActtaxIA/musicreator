'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Channel, Song } from '@/types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Music, 
  Search, 
  Save, 
  X, 
  MoreVertical,
  Play,
  Radio
} from 'lucide-react';

interface Props {
  userRole?: string;
}

export default function ChannelManager({ userRole }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelSongs, setChannelSongs] = useState<Song[]>([]);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  
  // Modal para añadir canciones
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) setChannels(data);
    setIsLoading(false);
  };

  const fetchChannelSongs = async (channelId: string) => {
    const { data: songsData, error } = await supabase
      .from('channel_songs')
      .select('song_id, songs:song_id(*)') // Join con tabla songs
      .eq('channel_id', channelId);

    if (songsData) {
      // Extraer la canción del objeto anidado
      const songs = songsData.map((item: any) => item.songs) as Song[];
      setChannelSongs(songs);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: newChannelName,
        description: newChannelDesc,
        filters: {}, // Vacío para manual
        is_active: true
      })
      .select()
      .single();

    if (!error && data) {
      setChannels([data, ...channels]);
      setIsCreateModalOpen(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } else {
      alert('Error al crear canal');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('¿Eliminar este canal?')) return;

    const { error } = await supabase
      .from('channels')
      .update({ is_active: false })
      .eq('id', channelId);

    if (!error) {
      setChannels(channels.filter(c => c.id !== channelId));
      if (selectedChannel?.id === channelId) setSelectedChannel(null);
    }
  };

  const handleRemoveSongFromChannel = async (songId: string) => {
    if (!selectedChannel) return;

    const { error } = await supabase
      .from('channel_songs')
      .delete()
      .eq('channel_id', selectedChannel.id)
      .eq('song_id', songId);

    if (!error) {
      setChannelSongs(channelSongs.filter(s => s.id !== songId));
    } else {
      alert('Error al quitar canción');
    }
  };

  // Función para abrir modal y cargar todas las canciones
  const handleOpenAddSongModal = async () => {
    setIsAddSongModalOpen(true);
    setIsLoadingSongs(true);
    
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: false });
    
    if (data) setAllSongs(data);
    setIsLoadingSongs(false);
  };

  // Función para añadir canción al canal actual
  const handleAddSongToChannel = async (songId: string) => {
    if (!selectedChannel) return;

    const { error } = await supabase
      .from('channel_songs')
      .insert({
        channel_id: selectedChannel.id,
        song_id: songId
      });

    if (error) {
      if (error.code === '23505') {
        alert('⚠️ Esta canción ya está en el canal');
      } else {
        alert('❌ Error al añadir canción');
      }
    } else {
      alert('✅ Canción añadida');
      // Recargar canciones del canal
      fetchChannelSongs(selectedChannel.id);
    }
  };

  // Filtrar canciones disponibles por búsqueda
  const filteredAvailableSongs = allSongs.filter(song => 
    song.title.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
    song.genre.toLowerCase().includes(searchSongQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      
      {/* COLUMNA IZQUIERDA: Lista de Canales */}
      <div className="w-full md:w-1/3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <h2 className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Canales
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Nuevo Canal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoading ? (
            <div className="text-center p-4 text-zinc-500">Cargando...</div>
          ) : channels.length === 0 ? (
            <div className="text-center p-8 text-zinc-500">
              <p>No hay canales.</p>
              <p className="text-xs mt-1">Crea uno para empezar.</p>
            </div>
          ) : (
            channels.map(channel => (
              <div
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel);
                  fetchChannelSongs(channel.id);
                }}
                className={`p-3 rounded-lg cursor-pointer border transition-all group ${
                  selectedChannel?.id === channel.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-zinc-800/50 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold ${selectedChannel?.id === channel.id ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {channel.name}
                    </h3>
                    {channel.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {channel.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChannel(channel.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: Detalle del Canal */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {selectedChannel ? (
          <>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                    {selectedChannel.name}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {selectedChannel.description || 'Sin descripción'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenAddSongModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
                    title="Añadir canciones"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Añadir</span>
                  </button>
                  <div className="text-sm text-zinc-500">
                    {channelSongs.length} canciones
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {channelSongs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Este canal está vacío.</p>
                  <p className="text-sm mt-2">Ve a la <b>Biblioteca</b> y añade canciones a "{selectedChannel.name}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {channelSongs.map((song, index) => (
                    <div 
                      key={song.id}
                      className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-100 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                    >
                      <span className="text-zinc-400 text-xs font-mono w-6">{index + 1}</span>
                      
                      <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                        {song.image_url ? (
                          <img src={song.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-full h-full p-2 text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                          {song.title}
                        </h4>
                        <div className="flex gap-2 text-xs text-zinc-500">
                          <span className="bg-zinc-200 dark:bg-zinc-700 px-1.5 rounded">
                            {song.genre}
                          </span>
                          <span>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSongFromChannel(song.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Quitar del canal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <Radio className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecciona un canal para ver su contenido</p>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Nuevo Canal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Ej: Temazos 2024"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descripción (Opcional)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Breve descripción del contenido..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Crear Canal
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Añadir Canciones */}
      {isAddSongModalOpen && selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-3xl h-[80vh] shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Añadir a "{selectedChannel.name}"
                </h3>
                <button
                  onClick={() => {
                    setIsAddSongModalOpen(false);
                    setSearchSongQuery('');
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchSongQuery}
                  onChange={(e) => setSearchSongQuery(e.target.value)}
                  placeholder="Buscar por título o género..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingSongs ? (
                <div className="text-center py-12 text-zinc-500">Cargando canciones...</div>
              ) : filteredAvailableSongs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No se encontraron canciones</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableSongs.map(song => (
                    <div 
                      key={song.id}
                      className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                        {song.image_url ? (
                          <img src={song.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-full h-full p-2 text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                          {song.title}
                        </h4>
                        <div className="flex gap-2 text-xs text-zinc-500">
                          <span className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                            {song.genre}
                          </span>
                          <span>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddSongToChannel(song.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

