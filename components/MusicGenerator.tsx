'use client';

import { useState } from 'react';
import axios from 'axios';

interface Song {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  status: string;
}

const GENRES = [
  { value: 'flamenco', label: '🎸 Flamenco', prompt: 'flamenco español tradicional con guitarra y palmas' },
  { value: 'techno', label: '🎹 Techno', prompt: 'techno electrónico con ritmos enérgicos y sintetizadores' },
  { value: 'trance', label: '✨ Trance', prompt: 'trance melódico con builds épicos y atmósferas etéreas' },
  { value: 'house', label: '🏠 House', prompt: 'house music bailable con ritmo constante' },
  { value: 'reggaeton', label: '🔥 Reggaeton', prompt: 'reggaeton latino con dembow y flow urbano' },
  { value: 'rock', label: '🤘 Rock', prompt: 'rock energético con guitarras eléctricas y batería potente' },
  { value: 'pop', label: '🎤 Pop', prompt: 'pop pegadizo con melodías vocales y producción moderna' },
  { value: 'jazz', label: '🎺 Jazz', prompt: 'jazz suave con improvisación de piano y saxofón' },
  { value: 'classical', label: '🎻 Clásica', prompt: 'música clásica orquestal con instrumentos sinfónicos' },
  { value: 'ambient', label: '🌊 Ambient', prompt: 'ambient relajante con texturas atmosféricas y pads' },
];

export default function MusicGenerator() {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState('');

  const generateMusic = async () => {
    if (!selectedGenre && !customPrompt) {
      setError('Por favor selecciona un género o escribe un prompt personalizado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const genre = GENRES.find(g => g.value === selectedGenre);
      const prompt = customPrompt || genre?.prompt || '';

      const response = await axios.post('/api/generate', {
        prompt,
        make_instrumental: false,
      });

      if (response.data.success) {
        // Guardar los IDs de las canciones para consultar su estado
        const songIds = response.data.data.map((song: any) => song.id);
        
        // Polling para obtener el estado de las canciones
        pollSongStatus(songIds);
      } else {
        setError('Error al generar la música: ' + response.data.error);
      }
    } catch (err: any) {
      setError('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const pollSongStatus = async (songIds: string[]) => {
    const maxAttempts = 60; // 5 minutos máximo
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/status?ids=${songIds.join(',')}`);
        
        if (response.data.success) {
          const completedSongs = response.data.data.filter(
            (song: Song) => song.status === 'complete' && song.audio_url
          );

          if (completedSongs.length > 0) {
            setSongs(prev => [...completedSongs, ...prev]);
          }

          // Si todas las canciones están completas, dejar de hacer polling
          const allComplete = response.data.data.every(
            (song: Song) => song.status === 'complete'
          );

          if (!allComplete && attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 5000); // Revisar cada 5 segundos
          }
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };

    checkStatus();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        {/* Selector de género */}
        <div className="mb-6">
          <label className="block text-white text-lg font-semibold mb-3">
            Selecciona un género musical:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {GENRES.map((genre) => (
              <button
                key={genre.value}
                onClick={() => {
                  setSelectedGenre(genre.value);
                  setCustomPrompt('');
                }}
                className={`p-3 rounded-lg font-medium transition-all ${
                  selectedGenre === genre.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt personalizado */}
        <div className="mb-6">
          <label className="block text-white text-lg font-semibold mb-3">
            O describe tu propia música:
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              setSelectedGenre('');
            }}
            placeholder="Ej: Una balada romántica al estilo de los 80s con saxofón..."
            className="w-full p-4 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Botón de generar */}
        <button
          onClick={generateMusic}
          disabled={loading || (!selectedGenre && !customPrompt)}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            loading || (!selectedGenre && !customPrompt)
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
          } text-white`}
        >
          {loading ? '⏳ Generando música...' : '🎵 Generar Música'}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Lista de canciones generadas */}
        {songs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-4">🎧 Tus canciones:</h3>
            <div className="space-y-4">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <h4 className="text-white font-semibold mb-2">{song.title || 'Sin título'}</h4>
                  {song.audio_url ? (
                    <audio
                      controls
                      className="w-full"
                      src={song.audio_url}
                    >
                      Tu navegador no soporta el reproductor de audio.
                    </audio>
                  ) : (
                    <p className="text-gray-400 text-sm">Generando audio...</p>
                  )}
                  {song.audio_url && (
                    <a
                      href={song.audio_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all"
                    >
                      ⬇️ Descargar MP3
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
