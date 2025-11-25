'use client';

import { useState, useEffect, useRef } from 'react';
import { Song } from '@/lib/supabase';
import WaveSurfer from 'wavesurfer.js';
import { useToast } from '../hooks/useToast';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  Sparkles,
  Plus,
  Music,
  Mic,
  ArrowLeft,
  FileAudio,
  Merge,
  Info,
  Clock,
  Zap,
  Save,
  Guitar,
  Disc,
  Waves,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface Props {
  song: Song;
  onBack: () => void;
  onUpdate: (songId: string, updates: any) => void;
}

interface Extension {
  id: string;
  continueAt: number;
  prompt: string;
  audioUrl?: string;
  status: 'pending' | 'processing' | 'complete';
}

export default function SongEditor({ song, onBack, onUpdate }: Props) {
  const { showToast } = useToast();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Extension/Continue
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [continueAt, setContinueAt] = useState<number>(0);
  const [extendPrompt, setExtendPrompt] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  
  // Stems
  const [hasStems, setHasStems] = useState(false);
  const [stemVocalUrl, setStemVocalUrl] = useState<string | null>(null);
  const [stemInstrumentalUrl, setStemInstrumentalUrl] = useState<string | null>(null);
  const [isGeneratingStems, setIsGeneratingStems] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'info' | 'extend' | 'stems' | 'export'>('info');

  // Edición de metadatos
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedGenre, setEditedGenre] = useState(song.genre);
  const [editedMood, setEditedMood] = useState(song.mood || '');
  const [editedTempo, setEditedTempo] = useState(song.tempo || '');
  const [editedEnergy, setEditedEnergy] = useState(song.energy || '');
  const [editedVoiceType, setEditedVoiceType] = useState(song.voice_type || '');
  const [editedPrompt, setEditedPrompt] = useState(song.prompt);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Inicializar WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !song.audio_url) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(147, 51, 234, 0.3)',
      progressColor: '#a855f7',
      cursorColor: '#ec4899',
      barWidth: 3,
      barRadius: 3,
      cursorWidth: 2,
      height: 120,
      barGap: 3,
      normalize: true,
    });

    wavesurfer.load(song.audio_url);

    wavesurfer.on('ready', () => {
      const songDuration = wavesurfer.getDuration();
      setDuration(songDuration);
      setContinueAt(songDuration);
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('audioprocess', () => setCurrentTime(wavesurfer.getCurrentTime()));
    wavesurfer.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [song.audio_url]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleSkipBack = () => {
    if (wavesurferRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  };

  const handleSkipForward = () => {
    if (wavesurferRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(value);
    }
  };

  // Guardar metadatos editados
  const handleSaveMetadata = async () => {
    setIsSavingMetadata(true);
    try {
      const updates = {
        title: editedTitle,
        genre: editedGenre,
        mood: editedMood,
        tempo: editedTempo,
        energy: editedEnergy,
        voice_type: editedVoiceType,
        prompt: editedPrompt,
      };

      await onUpdate(song.id, updates);
      showToast('success', 'Información actualizada correctamente');
    } catch (error) {
      console.error('Error al guardar metadatos:', error);
      showToast('error', 'Error al guardar la información');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  // EXTEND
  const handleExtend = async (position: 'start' | 'end' | 'custom') => {
    setIsExtending(true);

    try {
      // Para "end", usar duration - 1 segundo (según spec de Suno API)
      let continueAtTime = position === 'start' ? 0 : 
                          position === 'end' ? Math.max(0, duration - 1) : 
                          continueAt;

      // Validación: continueAt debe ser > 0
      if (continueAtTime <= 0 && position !== 'start') {
        showToast('error', 'El tiempo de extensión debe ser mayor a 0 segundos');
        setIsExtending(false);
        return;
      }

      // Validación: continueAt debe ser < duración total (según Suno API spec)
      if (continueAtTime >= duration && position !== 'end') {
        showToast('error', `El tiempo debe ser menor a la duración total (${formatTime(duration)})`);
        setIsExtending(false);
        return;
      }

      const response = await axios.post('/api/extend', {
        audioId: song.suno_id,
        prompt: extendPrompt || `Continue the ${song.genre} music with similar style and energy`,
        continueAt: continueAtTime,
        style: song.genre || 'original',
        title: `${song.title} (Extended)`,
      });

      if (response.data.success) {
        const taskId = response.data.taskId;
        
        if (!taskId) {
          showToast('error', 'No se recibió ID de tarea de extensión');
          return;
        }

        const newExtension: Extension = {
          id: taskId,
          continueAt: continueAtTime,
          prompt: extendPrompt,
          status: 'processing',
        };

        setExtensions(prev => [...prev, newExtension]);
        pollExtensionStatus(taskId);

        showToast('success', `Extensión iniciada desde ${formatTime(continueAtTime)}. Espera 30-60 segundos...`);
      } else {
        showToast('error', response.data.error || 'Error al iniciar extensión');
      }
    } catch (error: any) {
      console.error('Error extending:', error);
      showToast('error', error.response?.data?.error || 'Error al extender la canción');
    } finally {
      setIsExtending(false);
    }
  };

  const pollExtensionStatus = async (taskId: string) => {
    if (!taskId) {
      console.error('❌ Task ID is undefined, cannot poll status');
      showToast('error', 'ID de tarea inválido');
      return;
    }

    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/status?ids=${taskId}`);

        if (response.data.success) {
          const statusData = response.data.data;
          const completedSong = statusData.find(
            (s: any) => s.status === 'complete' && s.audio_url
          );

          if (completedSong) {
            setExtensions(prev =>
              prev.map(ext =>
                ext.id === taskId
                  ? { ...ext, audioUrl: completedSong.audio_url, status: 'complete' }
                  : ext
              )
            );
            showToast('success', '¡Extensión completada!');
            return;
          }

          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 5000);
          }
        }
      } catch (error: any) {
        console.error('Error checking extension status:', error);
        if (attempts >= maxAttempts) {
          showToast('error', 'Tiempo agotado esperando extensión');
        }
      }
    };

    checkStatus();
  };

  // STEMS
  const handleGenerateStems = async () => {
    setIsGeneratingStems(true);

    try {
      const response = await axios.post('/api/stems', {
        audioId: song.suno_id,
      });

      if (response.data.success) {
        const stems = response.data.data;
        
        const vocalStem = stems.find((s: any) => s.title.toLowerCase().includes('vocal'));
        const instrumentalStem = stems.find((s: any) => s.title.toLowerCase().includes('instrument'));

        alert('✅ Stems generados!\n\nEspera 30-60 segundos para que se procesen...');

        if (vocalStem) pollStemStatus(vocalStem.id, 'vocal');
        if (instrumentalStem) pollStemStatus(instrumentalStem.id, 'instrumental');

        setHasStems(true);
      }
    } catch (error) {
      console.error('Error generating stems:', error);
      alert('Error al generar stems');
    } finally {
      setIsGeneratingStems(false);
    }
  };

  const pollStemStatus = async (sunoId: string, type: 'vocal' | 'instrumental') => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/status?ids=${sunoId}`);

        if (response.data.success) {
          const stems = response.data.data;
          const completedStem = stems.find(
            (s: any) => s.status === 'complete' && s.audio_url
          );

          if (completedStem) {
            if (type === 'vocal') {
              setStemVocalUrl(completedStem.audio_url);
            } else {
              setStemInstrumentalUrl(completedStem.audio_url);
            }
            return;
          }

          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 5000);
          }
        }
      } catch (error) {
        console.error('Error checking stem status:', error);
      }
    };

    checkStatus();
  };

  // CONCAT
  const handleConcat = async () => {
    if (extensions.length === 0) {
      alert('No hay extensiones para unir');
      return;
    }

    const completedExtensions = extensions.filter(e => e.status === 'complete');
    if (completedExtensions.length === 0) {
      alert('Espera a que las extensiones se completen');
      return;
    }

    try {
      const clipIds = [song.suno_id, ...completedExtensions.map(e => e.id)];
      
      const response = await axios.post('/api/concat', {
        clipIds: clipIds,
      });

      if (response.data.success) {
        alert('✅ Canción completa generada!\n\nPuedes descargarla cuando esté lista.');
      }
    } catch (error) {
      console.error('Error concatenating:', error);
      alert('Error al unir las extensiones');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-purple-500/20 shadow-2xl">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-all mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver a Biblioteca</span>
          </button>

          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">{song.title}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-4 py-1.5 bg-purple-500/30 text-purple-200 rounded-full font-medium border border-purple-400/30">
                      {song.genre}
                    </span>
                    {song.mood && (
                      <span className="px-4 py-1.5 bg-pink-500/30 text-pink-200 rounded-full font-medium border border-pink-400/30">
                        {song.mood}
                      </span>
                    )}
                    <span className="text-white/60 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner Mejorado */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Info className="w-6 h-6 text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-100 mb-3">Editor Profesional Suno AI</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Plus className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-200">Extend:</span>
                    <span className="text-blue-200/70 block">Alarga tu canción desde cualquier punto</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Waves className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-200">Stems:</span>
                    <span className="text-blue-200/70 block">Separa voces e instrumentales</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Merge className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-200">Concat:</span>
                    <span className="text-blue-200/70 block">Une todas las extensiones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Modernos */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'info', icon: Info, label: 'Información', color: 'from-blue-600 to-cyan-600' },
            { id: 'extend', icon: Plus, label: 'Extender', color: 'from-purple-600 to-pink-600' },
            { id: 'stems', icon: Music, label: 'Stems', color: 'from-pink-600 to-rose-600' },
            { id: 'export', icon: Download, label: 'Exportar', color: 'from-green-600 to-emerald-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 whitespace-nowrap shadow-lg ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white scale-105`
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:scale-105'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Editor Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Waveform Premium */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-black/50 to-purple-900/30 rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-inner">
              <div ref={waveformRef} className="rounded-lg overflow-hidden" />
            </div>

            {/* Transport Controls Premium */}
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSkipBack}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:scale-110"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl transition-all shadow-lg hover:scale-110 hover:shadow-purple-500/50"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>

                <button
                  onClick={handleSkipForward}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:scale-110"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-white font-mono text-lg bg-black/30 px-4 py-2 rounded-xl">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500"
                  />
                  <span className="text-white font-mono text-sm w-10">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {/* Tab: Información */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Info className="w-6 h-6 text-blue-400" />
                  </div>
                  Información de la Canción
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Título</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Género</label>
                    <input
                      type="text"
                      value={editedGenre}
                      onChange={(e) => setEditedGenre(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Mood</label>
                    <input
                      type="text"
                      value={editedMood}
                      onChange={(e) => setEditedMood(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Tempo</label>
                    <input
                      type="text"
                      value={editedTempo}
                      onChange={(e) => setEditedTempo(e.target.value)}
                      placeholder="120 BPM"
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Energía</label>
                    <input
                      type="text"
                      value={editedEnergy}
                      onChange={(e) => setEditedEnergy(e.target.value)}
                      placeholder="Alto, Medio, Bajo"
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">Tipo de Voz</label>
                    <input
                      type="text"
                      value={editedVoiceType}
                      onChange={(e) => setEditedVoiceType(e.target.value)}
                      placeholder="Masculina, Femenina, Instrumental"
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-purple-300 mb-2">Prompt Original</label>
                  <textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveMetadata}
                  disabled={isSavingMetadata}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105 flex items-center gap-3"
                >
                  {isSavingMetadata ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab: Extender */}
            {activeTab === 'extend' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Plus className="w-6 h-6 text-purple-400" />
                    </div>
                    Extender Canción
                  </h2>

                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-6 mb-6">
                    <p className="text-purple-200 text-sm leading-relaxed">
                      Alarga tu canción añadiendo nuevas secciones desde cualquier punto. La IA continuará el estilo musical desde donde tú elijas.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-3">
                        Descripción de la extensión (opcional)
                      </label>
                      <textarea
                        value={extendPrompt}
                        onChange={(e) => setExtendPrompt(e.target.value)}
                        placeholder="Ej: Añadir un solo de guitarra energético, luego transición suave..."
                        rows={3}
                        className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <button
                        onClick={() => handleExtend('start')}
                        disabled={isExtending}
                        className="group p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 rounded-2xl transition-all hover:scale-105 disabled:opacity-50"
                      >
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                            <SkipBack className="w-8 h-8 text-blue-300" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white mb-1">Añadir Intro</h3>
                            <p className="text-sm text-blue-200/70">Desde 0:00</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleExtend('end')}
                        disabled={isExtending}
                        className="group p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 rounded-2xl transition-all hover:scale-105 disabled:opacity-50"
                      >
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                            <SkipForward className="w-8 h-8 text-purple-300" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white mb-1">Alargar Final</h3>
                            <p className="text-sm text-purple-200/70">Desde {formatTime(duration)}</p>
                          </div>
                        </div>
                      </button>

                      <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 rounded-2xl">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-center justify-center">
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                              <Clock className="w-6 h-6 text-pink-300" />
                            </div>
                            <h3 className="font-bold text-white">Personalizado</h3>
                          </div>
                          <input
                            type="number"
                            value={continueAt}
                            onChange={(e) => setContinueAt(parseFloat(e.target.value))}
                            min="0"
                            max={duration}
                            step="1"
                            className="w-full px-3 py-2 bg-black/40 border border-pink-400/30 rounded-lg text-white text-center"
                          />
                          <button
                            onClick={() => handleExtend('custom')}
                            disabled={isExtending}
                            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            Extender
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Extensiones */}
                {extensions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileAudio className="w-6 h-6 text-purple-400" />
                        Extensiones ({extensions.length})
                      </h3>
                      <button
                        onClick={handleConcat}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <Merge className="w-5 h-5" />
                        Unir Todo
                      </button>
                    </div>

                    <div className="space-y-3">
                      {extensions.map((ext, idx) => (
                        <div
                          key={ext.id}
                          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-lg">
                              <Music className="w-6 h-6 text-purple-300" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">Extensión #{idx + 1}</p>
                              <p className="text-sm text-gray-400">
                                Desde {formatTime(ext.continueAt)} • {ext.prompt || 'Sin descripción'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {ext.status === 'complete' ? (
                              <>
                                <span className="flex items-center gap-2 text-green-400 font-medium">
                                  <CheckCircle2 className="w-5 h-5" />
                                  Completado
                                </span>
                                {ext.audioUrl && (
                                  <a
                                    href={ext.audioUrl}
                                    download
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all"
                                  >
                                    <Download className="w-5 h-5" />
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="flex items-center gap-2 text-yellow-400 font-medium">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando...
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Stems */}
            {activeTab === 'stems' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-xl">
                    <Waves className="w-6 h-6 text-pink-400" />
                  </div>
                  Separación de Pistas (Stems)
                </h2>

                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-400/30 rounded-2xl p-6 mb-6">
                  <p className="text-pink-200 text-sm leading-relaxed mb-3">
                    Separa tu canción en <strong>2 pistas independientes</strong> para edición profesional en tu DAW favorito (Ableton, FL Studio, etc.).
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-pink-300">
                      <Mic className="w-4 h-4" />
                      <span>Voces</span>
                    </div>
                    <div className="flex items-center gap-2 text-pink-300">
                      <Guitar className="w-4 h-4" />
                      <span>Instrumentales</span>
                    </div>
                  </div>
                </div>

                {!hasStems ? (
                  <button
                    onClick={handleGenerateStems}
                    disabled={isGeneratingStems}
                    className="w-full p-8 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl transition-all shadow-lg hover:scale-105 disabled:scale-100"
                  >
                    <div className="flex flex-col items-center gap-4">
                      {isGeneratingStems ? (
                        <>
                          <Loader2 className="w-12 h-12 animate-spin" />
                          <div>
                            <p className="text-xl font-bold">Generando Stems...</p>
                            <p className="text-sm text-pink-200">Esto puede tardar 30-60 segundos</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-12 h-12" />
                          <div>
                            <p className="text-xl font-bold">Generar Stems</p>
                            <p className="text-sm text-pink-200">Separar voces e instrumentales</p>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Vocal Stem */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                          <Mic className="w-8 h-8 text-purple-300" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Voces</h3>
                          <p className="text-sm text-gray-400">Pista vocal aislada</p>
                        </div>
                      </div>

                      {stemVocalUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-400 font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            Listo para descargar
                          </div>
                          <a
                            href={stemVocalUrl}
                            download="vocals.mp3"
                            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all text-center"
                          >
                            <Download className="w-5 h-5 inline mr-2" />
                            Descargar Voces
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </div>
                      )}
                    </div>

                    {/* Instrumental Stem */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Guitar className="w-8 h-8 text-blue-300" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Instrumental</h3>
                          <p className="text-sm text-gray-400">Pista instrumental aislada</p>
                        </div>
                      </div>

                      {stemInstrumentalUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-400 font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            Listo para descargar
                          </div>
                          <a
                            href={stemInstrumentalUrl}
                            download="instrumental.mp3"
                            className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all text-center"
                          >
                            <Download className="w-5 h-5 inline mr-2" />
                            Descargar Instrumental
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nota para edición profesional */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 text-sm leading-relaxed">
                      <strong>Para edición avanzada:</strong> Descarga los stems y úsalos en un DAW profesional (Ableton Live, FL Studio, Logic Pro, etc.) donde tendrás control total sobre EQ, efectos, mezcla y más.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Exportar */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  Exportar y Descargar
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Canción Original */}
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-green-500/20 rounded-2xl">
                        <Disc className="w-12 h-12 text-green-300" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Canción Original</h3>
                        <p className="text-gray-400 mb-4">Descarga el MP3 completo</p>
                      </div>
                      <a
                        href={song.audio_url || '#'}
                        download={`${song.title}.mp3`}
                        className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <Download className="w-6 h-6" />
                        Descargar MP3
                      </a>
                    </div>
                  </div>

                  {/* Cover Art */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-purple-500/20 rounded-2xl">
                        <FileAudio className="w-12 h-12 text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Cover Art</h3>
                        <p className="text-gray-400 mb-4">Descarga la imagen de portada</p>
                      </div>
                      {song.image_url ? (
                        <a
                          href={song.image_url}
                          download={`${song.title}-cover.jpg`}
                          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-3"
                        >
                          <Download className="w-6 h-6" />
                          Descargar Imagen
                        </a>
                      ) : (
                        <p className="text-gray-500 italic">No disponible</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formato Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Información del Formato
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Formato</p>
                      <p className="text-white font-semibold">MP3</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Calidad</p>
                      <p className="text-white font-semibold">128-192 kbps</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Duración</p>
                      <p className="text-white font-semibold">{formatTime(duration)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
