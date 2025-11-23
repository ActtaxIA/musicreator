'use client';

import { useState } from 'react';
import { Music, Guitar, Piano, Drum, Zap, Heart, Smile, Frown, Battery, Sparkles } from 'lucide-react';

export interface GeneratorParams {
  genre: string;
  prompt: string;
  tempo: 'slow' | 'medium' | 'fast';
  energy: 'low' | 'medium' | 'high';
  mood: string;
  voiceType: 'male' | 'female' | 'choir' | 'instrumental';
  instruments: string[];
  duration: number;
}

interface Props {
  onGenerate: (params: GeneratorParams) => void;
  isGenerating: boolean;
}

const GENRES = [
  { value: 'flamenco', label: 'Flamenco', emoji: '🎸', color: 'from-red-500 to-orange-500' },
  { value: 'techno', label: 'Techno', emoji: '🎹', color: 'from-purple-500 to-pink-500' },
  { value: 'trance', label: 'Trance', emoji: '✨', color: 'from-blue-500 to-cyan-500' },
  { value: 'house', label: 'House', emoji: '🏠', color: 'from-green-500 to-teal-500' },
  { value: 'reggaeton', label: 'Reggaeton', emoji: '🔥', color: 'from-yellow-500 to-red-500' },
  { value: 'rock', label: 'Rock', emoji: '🤘', color: 'from-gray-600 to-gray-800' },
  { value: 'pop', label: 'Pop', emoji: '🎤', color: 'from-pink-400 to-purple-400' },
  { value: 'jazz', label: 'Jazz', emoji: '🎺', color: 'from-amber-600 to-yellow-600' },
  { value: 'classical', label: 'Clásica', emoji: '🎻', color: 'from-indigo-500 to-purple-600' },
  { value: 'ambient', label: 'Ambient', emoji: '🌊', color: 'from-cyan-400 to-blue-500' },
];

const MOODS = [
  { value: 'happy', label: 'Alegre', icon: Smile, color: 'text-yellow-400' },
  { value: 'sad', label: 'Triste', icon: Frown, color: 'text-blue-400' },
  { value: 'energetic', label: 'Energético', icon: Zap, color: 'text-orange-400' },
  { value: 'relaxed', label: 'Relajado', icon: Heart, color: 'text-green-400' },
  { value: 'epic', label: 'Épico', icon: Sparkles, color: 'text-purple-400' },
  { value: 'romantic', label: 'Romántico', icon: Heart, color: 'text-pink-400' },
];

const INSTRUMENTS = [
  { value: 'guitar', label: 'Guitarra', icon: Guitar },
  { value: 'piano', label: 'Piano', icon: Piano },
  { value: 'drums', label: 'Batería', icon: Drum },
  { value: 'synth', label: 'Sintetizador', icon: Music },
  { value: 'bass', label: 'Bajo', icon: Music },
  { value: 'strings', label: 'Cuerdas', icon: Music },
];

const VOICE_TYPES = [
  { value: 'male', label: 'Voz Masculina' },
  { value: 'female', label: 'Voz Femenina' },
  { value: 'choir', label: 'Coro' },
  { value: 'instrumental', label: 'Instrumental' },
];

export default function MusicGeneratorAdvanced({ onGenerate, isGenerating }: Props) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [tempo, setTempo] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [voiceType, setVoiceType] = useState<'male' | 'female' | 'choir' | 'instrumental'>('instrumental');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [duration, setDuration] = useState(120); // 2 minutos por defecto

  const toggleInstrument = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument));
    } else {
      setSelectedInstruments([...selectedInstruments, instrument]);
    }
  };

  const buildPrompt = () => {
    if (customPrompt) return customPrompt;

    const genre = GENRES.find(g => g.value === selectedGenre);
    const mood = MOODS.find(m => m.value === selectedMood);
    
    let prompt = `${genre?.label || 'música'}`;
    
    if (mood) prompt += ` con estilo ${mood.label.toLowerCase()}`;
    if (tempo === 'slow') prompt += ', tempo lento';
    if (tempo === 'fast') prompt += ', tempo rápido';
    if (energy === 'high') prompt += ', muy energético';
    if (energy === 'low') prompt += ', suave y relajado';
    
    if (selectedInstruments.length > 0) {
      const instrNames = selectedInstruments.map(i => 
        INSTRUMENTS.find(ins => ins.value === i)?.label.toLowerCase()
      ).join(', ');
      prompt += ` con ${instrNames}`;
    }

    if (voiceType !== 'instrumental') {
      if (voiceType === 'male') prompt += ', voz masculina';
      if (voiceType === 'female') prompt += ', voz femenina';
      if (voiceType === 'choir') prompt += ', coro';
    }

    return prompt;
  };

  const handleGenerate = () => {
    const prompt = buildPrompt();
    
    onGenerate({
      genre: selectedGenre || 'custom',
      prompt,
      tempo,
      energy,
      mood: selectedMood,
      voiceType,
      instruments: selectedInstruments,
      duration,
    });
  };

  const canGenerate = (selectedGenre || customPrompt) && !isGenerating;

  return (
    <div className="space-y-8">
      {/* Selector de Género */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Music className="w-6 h-6" />
          1. Elige tu género musical
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {GENRES.map((genre) => (
            <button
              key={genre.value}
              onClick={() => {
                setSelectedGenre(genre.value);
                setCustomPrompt('');
              }}
              className={`relative p-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                selectedGenre === genre.value
                  ? `bg-gradient-to-br ${genre.color} text-white shadow-lg scale-105`
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <div className="text-3xl mb-2">{genre.emoji}</div>
              <div className="text-sm">{genre.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Estado de Ánimo */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6" />
          2. ¿Qué sentimiento quieres transmitir?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-lg font-medium transition-all ${
                  selectedMood === mood.value
                    ? 'bg-white/20 border-2 border-white scale-105'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${mood.color}`} />
                <div className="text-white text-sm">{mood.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tempo y Energía */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tempo */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">3. Tempo (Velocidad)</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Lento</span>
              <span>Medio</span>
              <span>Rápido</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={tempo === 'slow' ? 0 : tempo === 'medium' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTempo(val === 0 ? 'slow' : val === 1 ? 'medium' : 'fast');
              }}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="text-center text-white font-semibold mt-2">
              {tempo === 'slow' && '🐌 Lento (60-90 BPM)'}
              {tempo === 'medium' && '🎵 Medio (90-120 BPM)'}
              {tempo === 'fast' && '⚡ Rápido (120-180 BPM)'}
            </div>
          </div>
        </div>

        {/* Energía */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">4. Energía</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Suave</span>
              <span>Media</span>
              <span>Alta</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={energy === 'low' ? 0 : energy === 'medium' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setEnergy(val === 0 ? 'low' : val === 1 ? 'medium' : 'high');
              }}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-500 [&::-webkit-slider-thumb]:to-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="text-center text-white font-semibold mt-2 flex items-center justify-center gap-2">
              <Battery className="w-5 h-5" />
              {energy === 'low' && 'Relajado y Suave'}
              {energy === 'medium' && 'Energía Media'}
              {energy === 'high' && 'Muy Energético'}
            </div>
          </div>
        </div>
      </div>

      {/* Instrumentos */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">5. Instrumentos (opcional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INSTRUMENTS.map((instrument) => {
            const Icon = instrument.icon;
            const isSelected = selectedInstruments.includes(instrument.value);
            return (
              <button
                key={instrument.value}
                onClick={() => toggleInstrument(instrument.value)}
                className={`p-3 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">{instrument.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tipo de Voz */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">6. Tipo de Voz</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VOICE_TYPES.map((voice) => (
            <button
              key={voice.value}
              onClick={() => setVoiceType(voice.value as any)}
              className={`p-4 rounded-lg font-medium transition-all ${
                voiceType === voice.value
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white scale-105'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {voice.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">7. Duración</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[30, 60, 120, 180, 240, 480].map((dur) => (
            <button
              key={dur}
              onClick={() => setDuration(dur)}
              className={`p-3 rounded-lg font-medium transition-all ${
                duration === dur
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-105'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {dur < 60 ? `${dur}s` : `${dur / 60}min`}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Personalizado (Opcional) */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">
          8. O describe tu propia música (opcional)
        </h3>
        <textarea
          value={customPrompt}
          onChange={(e) => {
            setCustomPrompt(e.target.value);
            if (e.target.value) setSelectedGenre('');
          }}
          placeholder="Ej: Una balada romántica al estilo de los 80s con saxofón y sintetizadores..."
          className="w-full p-4 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Preview del Prompt */}
      {!customPrompt && selectedGenre && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/20">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Vista previa:</h4>
          <p className="text-white">{buildPrompt()}</p>
        </div>
      )}

      {/* Botón de Generar */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`w-full py-5 rounded-xl font-bold text-xl transition-all transform ${
          canGenerate
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:scale-105'
            : 'bg-gray-600 cursor-not-allowed text-gray-400'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            Generando tu música...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            Crear Mi Canción
          </span>
        )}
      </button>
    </div>
  );
}
