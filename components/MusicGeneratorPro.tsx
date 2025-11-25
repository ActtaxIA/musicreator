'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Music, Play, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GenerationModal from './GenerationModal';

interface Song {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  status: string;
}

const STYLES = [
  { value: 'classic', label: 'Clásico' },
  { value: 'modern', label: 'Moderno' },
  { value: 'contemporary', label: 'Actual/Contemporáneo' },
  { value: 'retro', label: 'Retro/Vintage' },
  { value: 'experimental', label: 'Experimental/Vanguardia' },
];

const GENRES = [
  { value: 'acid-house', label: 'Acid House' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'bachata', label: 'Bachata' },
  { value: 'blues', label: 'Blues' },
  { value: 'boom-bap', label: 'Boom Bap' },
  { value: 'breakbeat', label: 'Breakbeat' },
  { value: 'chillout', label: 'Chillout' },
  { value: 'classical', label: 'Clásica' },
  { value: 'country', label: 'Country' },
  { value: 'cumbia', label: 'Cumbia' },
  { value: 'dancehall', label: 'Dancehall' },
  { value: 'deep-house', label: 'Deep House' },
  { value: 'disco', label: 'Disco' },
  { value: 'downtempo', label: 'Downtempo' },
  { value: 'drum-and-bass', label: 'Drum & Bass' },
  { value: 'dub', label: 'Dub' },
  { value: 'dubstep', label: 'Dubstep' },
  { value: 'edm', label: 'EDM' },
  { value: 'experimental', label: 'Experimental' },
  { value: 'flamenco', label: 'Flamenco' },
  { value: 'folk', label: 'Folk' },
  { value: 'funk', label: 'Funk' },
  { value: 'garage', label: 'Garage' },
  { value: 'grunge', label: 'Grunge' },
  { value: 'hard-rock', label: 'Hard Rock' },
  { value: 'hip-hop', label: 'Hip Hop' },
  { value: 'house', label: 'House' },
  { value: 'indie', label: 'Indie Rock' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'k-pop', label: 'K-Pop' },
  { value: 'latin-pop', label: 'Pop Latino' },
  { value: 'lo-fi', label: 'Lo-Fi' },
  { value: 'merengue', label: 'Merengue' },
  { value: 'metal', label: 'Metal' },
  { value: 'new-wave', label: 'New Wave' },
  { value: 'opera', label: 'Ópera' },
  { value: 'pop', label: 'Pop' },
  { value: 'pop-rock', label: 'Pop Rock' },
  { value: 'punk', label: 'Punk' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'reggaeton', label: 'Reggaeton' },
  { value: 'rnb', label: 'R&B' },
  { value: 'rock', label: 'Rock' },
  { value: 'salsa', label: 'Salsa' },
  { value: 'soul', label: 'Soul' },
  { value: 'synth-pop', label: 'Synth Pop' },
  { value: 'synthwave', label: 'Synthwave' },
  { value: 'tech-house', label: 'Tech House' },
  { value: 'techno', label: 'Techno' },
  { value: 'trance', label: 'Trance' },
  { value: 'trap', label: 'Trap' },
  { value: 'vaporwave', label: 'Vaporwave' },
];

const MOODS = [
  { value: 'happy', label: 'Alegre' },
  { value: 'sad', label: 'Triste' },
  { value: 'energetic', label: 'Energético' },
  { value: 'relaxed', label: 'Relajado' },
  { value: 'epic', label: 'Épico' },
  { value: 'romantic', label: 'Romántico' },
  { value: 'melancholic', label: 'Melancólico' },
  { value: 'aggressive', label: 'Agresivo' },
  { value: 'peaceful', label: 'Pacífico' },
  { value: 'mysterious', label: 'Misterioso' },
  { value: 'uplifting', label: 'Inspirador' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'dreamy', label: 'Soñador' },
  { value: 'nostalgic', label: 'Nostálgico' },
  { value: 'powerful', label: 'Poderoso' },
  { value: 'sensual', label: 'Sensual' },
];

const VOICE_TYPES = [
  { value: 'male', label: 'Voz Masculina' },
  { value: 'female', label: 'Voz Femenina' },
  { value: 'choir', label: 'Coro' },
  { value: 'instrumental', label: 'Instrumental' },
];

const LANGUAGES = [
  { value: 'spanish', label: 'Español' },
  { value: 'english', label: 'Inglés' },
  { value: 'french', label: 'Francés' },
  { value: 'italian', label: 'Italiano' },
  { value: 'portuguese', label: 'Portugués' },
  { value: 'german', label: 'Alemán' },
  { value: 'japanese', label: 'Japonés' },
  { value: 'korean', label: 'Coreano' },
  { value: 'chinese', label: 'Chino' },
  { value: 'arabic', label: 'Árabe' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'russian', label: 'Ruso' },
];

const AI_MODELS = [
  { 
    value: 'V5' as const, 
    label: 'V5 (Recomendado)', 
    description: 'Superior expresión musical, más rápido, hasta 8+ min',
    badge: '🆕'
  },
  { 
    value: 'V4_5PLUS' as const, 
    label: 'V4.5+', 
    description: 'Sonido más rico, nuevas técnicas creativas, hasta 8 min',
    badge: '✨'
  },
  { 
    value: 'V4_5' as const, 
    label: 'V4.5', 
    description: 'Mejor mezcla de géneros, hasta 8 min',
    badge: ''
  },
  { 
    value: 'V4' as const, 
    label: 'V4', 
    description: 'Calidad alta, estructura refinada, hasta 4 min',
    badge: ''
  },
  { 
    value: 'V3_5' as const, 
    label: 'V3.5', 
    description: 'Arreglos sólidos, diversidad creativa, hasta 4 min',
    badge: ''
  },
];

// MAPEOS PARA GENERACIÓN ALEATORIA INTELIGENTE
const MOODS_BY_GENRE: { [key: string]: string[] } = {
  'techno': ['energetic', 'dark', 'mysterious', 'powerful'],
  'flamenco': ['romantic', 'melancholic', 'powerful', 'sensual'],
  'jazz': ['relaxed', 'nostalgic', 'romantic', 'uplifting'],
  'blues': ['sad', 'melancholic', 'nostalgic', 'peaceful'],
  'rock': ['energetic', 'aggressive', 'powerful', 'uplifting'],
  'metal': ['aggressive', 'dark', 'powerful', 'epic'],
  'lo-fi': ['relaxed', 'dreamy', 'peaceful', 'nostalgic'],
  'ambient': ['peaceful', 'dreamy', 'mysterious', 'relaxed'],
  'trap': ['aggressive', 'dark', 'energetic', 'powerful'],
  'reggae': ['relaxed', 'happy', 'peaceful', 'uplifting'],
  'salsa': ['happy', 'energetic', 'romantic', 'uplifting'],
  'cumbia': ['happy', 'energetic', 'romantic', 'uplifting'],
  'classical': ['peaceful', 'epic', 'romantic', 'melancholic'],
  'pop': ['happy', 'romantic', 'uplifting', 'energetic'],
  'indie': ['melancholic', 'romantic', 'nostalgic', 'dreamy'],
  'default': ['energetic', 'relaxed', 'romantic', 'mysterious'], // Para géneros sin mapeo específico
};

const TEMPO_RANGES: { [key: string]: { min: number; max: number } } = {
  'techno': { min: 125, max: 135 },
  'house': { min: 120, max: 130 },
  'trance': { min: 130, max: 145 },
  'drum-and-bass': { min: 160, max: 180 },
  'dubstep': { min: 135, max: 145 },
  'trap': { min: 130, max: 150 },
  'hip-hop': { min: 80, max: 110 },
  'reggae': { min: 60, max: 90 },
  'salsa': { min: 160, max: 220 },
  'flamenco': { min: 90, max: 120 },
  'jazz': { min: 80, max: 160 },
  'blues': { min: 60, max: 90 },
  'rock': { min: 110, max: 140 },
  'metal': { min: 140, max: 180 },
  'punk': { min: 150, max: 200 },
  'lo-fi': { min: 70, max: 90 },
  'ambient': { min: 60, max: 90 },
  'classical': { min: 60, max: 140 },
  'pop': { min: 100, max: 130 },
  'default': { min: 90, max: 130 },
};

const ENERGY_RANGES: { [key: string]: { min: number; max: number } } = {
  'energetic': { min: 70, max: 95 },
  'aggressive': { min: 80, max: 100 },
  'powerful': { min: 70, max: 90 },
  'epic': { min: 65, max: 85 },
  'uplifting': { min: 60, max: 80 },
  'happy': { min: 55, max: 75 },
  'romantic': { min: 35, max: 65 },
  'relaxed': { min: 20, max: 50 },
  'peaceful': { min: 15, max: 40 },
  'dreamy': { min: 20, max: 50 },
  'nostalgic': { min: 30, max: 60 },
  'melancholic': { min: 25, max: 55 },
  'sad': { min: 20, max: 45 },
  'dark': { min: 40, max: 70 },
  'mysterious': { min: 35, max: 65 },
  'sensual': { min: 30, max: 60 },
};

const THEMES_BY_MOOD: { [key: string]: string[] } = {
  'romantic': [
    'Un amor imposible bajo la lluvia',
    'Recuerdos de un verano junto al mar',
    'La promesa de volver algún día',
    'Miradas que lo dicen todo',
    'Bailando hasta el amanecer',
    'Cartas de amor nunca enviadas',
  ],
  'melancholic': [
    'Nostalgia de días que no volverán',
    'Soledad en una ciudad dormida',
    'El eco de una despedida',
    'Fotografías en blanco y negro',
    'El último tren de la noche',
    'Susurros del pasado',
  ],
  'energetic': [
    'La fiesta que nunca termina',
    'Corriendo hacia el horizonte',
    'Liberación y adrenalina pura',
    'Energía que rompe barreras',
    'El pulso de la noche',
    'Volar sin límites',
  ],
  'dark': [
    'Sombras en la niebla nocturna',
    'El peso del tiempo y el olvido',
    'Viaje al abismo interior',
    'Secretos ocultos en la oscuridad',
    'El lado oscuro del alma',
    'Ecos de un mundo perdido',
  ],
  'peaceful': [
    'Atardecer junto al río',
    'Meditación en el bosque',
    'El silencio de la montaña',
    'Despertar con el canto de los pájaros',
    'La calma después de la tormenta',
    'Refugio interior',
  ],
  'powerful': [
    'Guerrero inquebrantable',
    'Levantarse después de la caída',
    'Fuerza de voluntad',
    'El rugido del león',
    'Conquistar lo imposible',
    'Poder sin límites',
  ],
  'dreamy': [
    'Viaje a través de las nubes',
    'Sueños de mundos lejanos',
    'Flotando en el espacio',
    'Fantasía y realidad',
    'El jardín de los sueños',
    'Entre la vigilia y el sueño',
  ],
  'happy': [
    'Celebración de la vida',
    'Sonrisas bajo el sol',
    'Día perfecto',
    'Alegría compartida',
    'Momentos que brillan',
    'Risas y buenos tiempos',
  ],
  'nostalgic': [
    'Recuerdos de la infancia',
    'Viejo café parisino',
    'Ecos de otra época',
    'Cintas de cassette olvidadas',
    'El sabor de lo antiguo',
    'Cuando todo era más simple',
  ],
};

const LANGUAGES_BY_GENRE: { [key: string]: string[] } = {
  'flamenco': ['spanish'],
  'reggaeton': ['spanish'],
  'salsa': ['spanish'],
  'cumbia': ['spanish'],
  'bachata': ['spanish'],
  'k-pop': ['korean'],
  'opera': ['italian', 'german', 'french'],
  'tango': ['spanish'],
  'default': ['spanish', 'english'],
};

interface MusicGeneratorProProps {
  userId?: string;
  onSongGenerated?: () => void;
  regenerateFromSong?: any | null; // Datos de canción para regenerar
}

export default function MusicGeneratorPro({ userId, onSongGenerated, regenerateFromSong }: MusicGeneratorProProps = {}) {
  const [selectedGenre, setSelectedGenre] = useState('techno');
  const [customPrompt, setCustomPrompt] = useState('');
  const [tempo, setTempo] = useState(120); // BPM
  const [energy, setEnergy] = useState(50); // 0-100
  const [selectedMood, setSelectedMood] = useState('energetic');
  const [selectedStyle, setSelectedStyle] = useState('modern'); // NUEVO
  const [voiceType, setVoiceType] = useState('instrumental');
  const [selectedLanguage, setSelectedLanguage] = useState('spanish'); // NUEVO
  const [selectedModel, setSelectedModel] = useState<'V5' | 'V4_5PLUS' | 'V4_5' | 'V4' | 'V3_5'>('V5'); // NUEVO: Selector de modelo IA
  
  // NUEVOS PARÁMETROS AVANZADOS
  const [vocalGender, setVocalGender] = useState<'any' | 'm' | 'f'>('any'); // any = sin preferencia
  const [styleWeight, setStyleWeight] = useState(0.65); // 0-1, default 0.65
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.5); // 0-1, default 0.5 (creatividad media)
  const [negativeTags, setNegativeTags] = useState(''); // Estilos a evitar
  const [longTrack, setLongTrack] = useState(false); // Sugerencia de canción larga
  
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para el modal de generación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const logsRef = useRef<string[]>([]); // REF para logs sin causar re-renders

  // NUEVOS ESTADOS PARA GENERACIÓN MÚLTIPLE
  const [batchCount, setBatchCount] = useState(1); // Cantidad de generaciones (1-10)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 }); // Progreso del batch
  const [batchVariationType, setBatchVariationType] = useState<'similar' | 'different'>('similar'); // Tipo de variación
  const batchTaskIdsRef = useRef<string[]>([]); // IDs de todas las tareas del batch
  const batchCompletedRef = useRef(0); // Contador de generaciones completadas

  // Función para añadir log al modal CON actualización inmediata
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Añadir al ref
    logsRef.current = [...logsRef.current, logMessage];
    
    // Actualizar estado INMEDIATAMENTE para que se vea en tiempo real
    setGenerationLogs([...logsRef.current]);
    
    console.log(logMessage);
  };

  // Actualizar logs en el estado solo periódicamente
  // Los logs se actualizan directamente en addLog y en puntos críticos del flujo
  // No necesitamos un setInterval que cause rebuilds constantes

  // Pre-cargar datos cuando se va a regenerar una canción
  useEffect(() => {
    if (regenerateFromSong) {
      console.log('🔄 Pre-cargando datos para regenerar:', regenerateFromSong);
      
      // Cargar género
      if (regenerateFromSong.genre) {
        setSelectedGenre(regenerateFromSong.genre.toLowerCase());
      }
      
      // Cargar mood
      if (regenerateFromSong.mood) {
        setSelectedMood(regenerateFromSong.mood.toLowerCase());
      }
      
      // Cargar tempo (extraer número del string)
      if (regenerateFromSong.tempo) {
        const tempoMatch = regenerateFromSong.tempo.match(/\d+/);
        if (tempoMatch) {
          setTempo(parseInt(tempoMatch[0]));
        }
      }
      
      // Cargar energía
      if (regenerateFromSong.energy) {
        const energyMap: { [key: string]: number } = {
          'bajo': 25,
          'moderado': 50,
          'alto': 75,
          'intenso': 90
        };
        setEnergy(energyMap[regenerateFromSong.energy.toLowerCase()] || 50);
      }
      
      // Cargar tipo de voz
      if (regenerateFromSong.voice_type) {
        setVoiceType(regenerateFromSong.voice_type.toLowerCase());
      }
      
      // Mostrar mensaje informativo
      setSuccessMessage(`🔄 Datos cargados de "${regenerateFromSong.title}". Modifica lo que quieras y genera.`);
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [regenerateFromSong]);

  const buildPrompt = () => {
    // TRADUCCIÓN DE MOODS AL INGLÉS
    const moodTranslations: { [key: string]: string } = {
      'happy': 'happy',
      'sad': 'sad',
      'energetic': 'energetic',
      'relaxed': 'relaxed',
      'epic': 'epic',
      'romantic': 'romantic',
      'melancholic': 'melancholic',
      'aggressive': 'aggressive',
      'peaceful': 'peaceful',
      'mysterious': 'mysterious',
      'uplifting': 'uplifting',
      'dark': 'dark',
      'dreamy': 'dreamy',
      'nostalgic': 'nostalgic',
      'powerful': 'powerful',
      'sensual': 'sensual',
    };

    // TRADUCCIÓN DE GÉNEROS AL INGLÉS (labels en inglés)
    const genreEnglishNames: { [key: string]: string } = {
      'acid-house': 'Acid House',
      'ambient': 'Ambient',
      'bachata': 'Bachata',
      'blues': 'Blues',
      'boom-bap': 'Boom Bap',
      'breakbeat': 'Breakbeat',
      'chillout': 'Chillout',
      'classical': 'Classical',
      'country': 'Country',
      'cumbia': 'Cumbia',
      'dancehall': 'Dancehall',
      'deep-house': 'Deep House',
      'disco': 'Disco',
      'downtempo': 'Downtempo',
      'drum-and-bass': 'Drum and Bass',
      'dub': 'Dub',
      'dubstep': 'Dubstep',
      'edm': 'EDM',
      'experimental': 'Experimental',
      'flamenco': 'Flamenco',
      'folk': 'Folk',
      'funk': 'Funk',
      'garage': 'Garage Rock',
      'grunge': 'Grunge',
      'hard-rock': 'Hard Rock',
      'hip-hop': 'Hip Hop',
      'house': 'House',
      'indie': 'Indie Rock',
      'jazz': 'Jazz',
      'jungle': 'Jungle',
      'k-pop': 'K-Pop',
      'latin-pop': 'Latin Pop',
      'lo-fi': 'Lo-Fi',
      'merengue': 'Merengue',
      'metal': 'Metal',
      'new-wave': 'New Wave',
      'opera': 'Opera',
      'pop': 'Pop',
      'pop-rock': 'Pop Rock',
      'punk': 'Punk',
      'reggae': 'Reggae',
      'reggaeton': 'Reggaeton',
      'rnb': 'R&B',
      'rock': 'Rock',
      'salsa': 'Salsa',
      'soul': 'Soul',
      'synth-pop': 'Synth Pop',
      'synthwave': 'Synthwave',
      'tech-house': 'Tech House',
      'techno': 'Techno',
      'trance': 'Trance',
      'trap': 'Trap',
      'vaporwave': 'Vaporwave',
    };

    const genreEnglish = genreEnglishNames[selectedGenre] || selectedGenre;
    const moodEnglish = moodTranslations[selectedMood] || selectedMood;
    
    let tempoDesc = tempo < 90 ? 'slow' : tempo < 130 ? 'medium' : 'fast';
    let energyDesc = energy < 33 ? 'soft' : energy < 66 ? 'moderate' : 'intense';

    // DESCRIPCIONES EN INGLÉS - Muy detalladas y específicas por género
    const genreDescriptions: { [key: string]: string } = {
      'flamenco': 'authentic Spanish flamenco, flamenco guitar with rasgueado and alzapúa technique, palmas 12-beat compás, percussive flamenco cajón, rhythmic zapateado footwork, characteristic quejío vocal cry',
      'techno': 'pure techno with analog synthesizers Roland TR-909 style, constant 4x4 kick drum, metallic offbeat hi-hats, hypnotic bassline',
      'breakbeat': 'syncopated drum breaks Amen break style, funky broken groove, chopped and reordered samples, heavy bass',
      'jungle': 'extremely fast and complex breakbeats 160-180 BPM, deep reggae basslines, dark jungle atmosphere',
      'drum-and-bass': 'fast processed breaks, deep powerful sub-bass, dark neurofunk atmosphere',
      'hip-hop': 'classic boom-bap drums, vinyl samples with crackle, DJ turntablism scratching, fat bass',
      'trap': 'triple-time rolling hi-hats, heavy 808 bass with slides, layered sharp snares, dark atmosphere',
      'house': 'hypnotic 4x4 groove, claps on beats 2 and 4, syncopated funky bassline, disco strings',
      'trance': 'expansive atmospheric pads, ascending emotive arpeggios, epic breakdown with build-up, powerful kick',
      'dubstep': 'LFO-modulated wobble bass, half-time drums at 140 BPM, heavy drops with distortion',
      'reggae': 'characteristic one-drop riddim, offbeat skank guitar, heavy roots bass, Hammond organ',
      'salsa': 'Cuban montuno piano, timbales with bell, 2-3 son clave, tumbao congas, brass trumpets',
      'jazz': 'jazz piano with complex voicings, walking 4/4 double bass, swing ride cymbal pattern, improvisation',
      'blues': '12-bar blues guitar progression, expressive bends, wailing harmonica, shuffle drums',
      'rock': 'electric guitars with distorted power chords, powerful rock drums with backbeat, driving bass',
      'punk': 'fast direct downstroke guitars, aggressive double-time drums, raw DIY energy',
      'funk': 'syncopated slap and pop bass, funky wah-wah guitar, tight brass section, drums in the pocket',
      'synthwave': 'retro 80s analog synthesizers, gated reverb drums, melodic arpeggios, synthpop bassline',
      'lo-fi': 'vinyl samples with crackles and pops, relaxed downtempo beats, warm electric Rhodes, nostalgic atmosphere',
      'bachata': 'lead requinto bachata guitar, Dominican bongo and güira, romantic bass, maracas',
      'cumbia': 'vallenato accordion, scraping guacharaca, bombo drum, millo flute',
      'reggaeton': 'characteristic dembow rhythm, perreo 808 bass, Latin hi-hats, Spanish reggae',
      'merengue': 'Dominican merengue tambora, fast metal güira, diatonic accordion, saxophone',
      'metal': 'low-tuned palm-muted guitars, fast double bass drum, guttural screams, heavy riffs',
      'soul': 'emotional vocals with melismas, Hammond B3 organ, punchy soul horns, funky drums',
      'rnb': 'contemporary RnB beats, smooth sub bass, vocals with ad-libs, sensual atmosphere',
      'disco': '4x4 disco groove, orchestral strings, funky slap bass, open hi-hats',
      'country': 'crying steel guitar, banjo picking, fiddle melodies, acoustic storytelling',
      'folk': 'acoustic guitar fingerpicking, folk harmonica, storytelling vocals, organic atmosphere',
      'new-wave': '80s new wave synthesizers, funky cold bassline, drums with reverb, post-punk guitar',
      'garage': 'Hammond organ garage rock, distorted fuzz guitar, raw energetic drums',
      'ambient': 'ethereal soundscapes, atmospheric pads, subtle textures, spacious reverb',
      'classical': 'orchestral arrangement, classical composition, chamber music, symphonic elements',
      'edm': 'electronic dance music, massive drops, festival anthem, energetic build-ups',
      'indie': 'indie rock sound, alternative guitars, authentic production, modern indie feel',
      'k-pop': 'K-Pop production, catchy hooks, modern pop elements, Korean pop style',
      'latin-pop': 'Latin pop sound, tropical elements, contemporary production, Latin rhythms',
      'opera': 'operatic vocals, classical singing, dramatic performance, orchestral backing',
      'pop': 'catchy pop melody, mainstream production, radio-friendly, contemporary pop',
      'synth-pop': 'synthesizer-driven pop, electronic melodies, 80s pop influence, synth hooks',
      'trance': 'uplifting trance, euphoric melodies, emotional breakdown, driving bassline',
      'vaporwave': 'vaporwave aesthetic, slowed samples, 80s nostalgia, surreal atmosphere',
    };

    const genreDesc = genreDescriptions[selectedGenre] || '';

    // MODIFICADOR DE ESTILO EN INGLÉS
    let styleModifier = '';
    switch(selectedStyle) {
      case 'classic':
        styleModifier = 'classic traditional authentic style, vintage original sound from golden era';
        break;
      case 'modern':
        styleModifier = 'modern professional production, current clean and polished sound';
        break;
      case 'contemporary':
        styleModifier = 'contemporary innovative approach, fusion with current elements';
        break;
      case 'retro':
        styleModifier = 'retro vintage aesthetic, analog recording with nostalgic warmth';
        break;
      case 'experimental':
        styleModifier = 'experimental avant-garde approach, unconventional elements';
        break;
    }

    // TIPO DE VOZ EN INGLÉS
    let voiceDesc = '';
    switch(voiceType) {
      case 'male':
        voiceDesc = ', MALE LEAD VOCALS, man singer, male voice, male vocals, male singer';
        break;
      case 'female':
        voiceDesc = ', FEMALE LEAD VOCALS, woman singer, female voice, female vocals, female singer';
        break;
      case 'choir':
        voiceDesc = ', CHOIR VOCALS, multiple voices in harmony, vocal ensemble, choir';
        break;
      case 'instrumental':
        voiceDesc = ', COMPLETELY INSTRUMENTAL, NO HUMAN VOICES, NO VOCALS, only instruments, no singing';
        break;
    }

    // IDIOMA (mantenemos referencias en el idioma original para mejor comprensión)
    let languageDesc = '';
    if (voiceType !== 'instrumental') {
      const languageDescriptions: { [key: string]: string } = {
        'spanish': 'spanish lyrics, sung in Spanish, letra en español',
        'english': 'english lyrics, sung in English',
        'french': 'french lyrics, sung in French, paroles en français',
        'italian': 'italian lyrics, sung in Italian, testo in italiano',
        'portuguese': 'portuguese lyrics, sung in Portuguese, letra em português',
        'german': 'german lyrics, sung in German, Text auf Deutsch',
        'japanese': 'japanese lyrics, sung in Japanese, 日本語の歌詞',
        'korean': 'korean lyrics, sung in Korean, 한국어 가사',
        'chinese': 'chinese lyrics, sung in Mandarin, 中文歌词',
        'arabic': 'arabic lyrics, sung in Arabic, كلمات عربية',
        'hindi': 'hindi lyrics, sung in Hindi, हिंदी गीत',
        'russian': 'russian lyrics, sung in Russian, текст на русском',
      };
      languageDesc = `, ${languageDescriptions[selectedLanguage] || ''}`;
    }

    // Construir el prompt base
    let finalPrompt = `${moodEnglish} ${genreEnglish}, ${styleModifier}, ${genreDesc}, ${tempoDesc} tempo ${tempo} BPM, ${energyDesc} energy${voiceDesc}${languageDesc}`;

    // Si hay texto personalizado, traducirlo y añadirlo como complemento
    if (customPrompt.trim()) {
      // Traducir términos comunes del español al inglés
      let translatedCustom = customPrompt
        .replace(/canción sobre/gi, 'song about')
        .replace(/canción de/gi, 'song about')
        .replace(/letra sobre/gi, 'lyrics about')
        .replace(/historia de/gi, 'story of')
        .replace(/amor/gi, 'love')
        .replace(/desamor/gi, 'heartbreak')
        .replace(/tristeza/gi, 'sadness')
        .replace(/alegría/gi, 'joy')
        .replace(/nostalgia/gi, 'nostalgia')
        .replace(/recuerdos/gi, 'memories')
        .replace(/sueños/gi, 'dreams')
        .replace(/esperanza/gi, 'hope')
        .replace(/libertad/gi, 'freedom')
        .replace(/soledad/gi, 'loneliness')
        .replace(/pasión/gi, 'passion')
        .replace(/vida/gi, 'life')
        .replace(/muerte/gi, 'death')
        .replace(/noche/gi, 'night')
        .replace(/día/gi, 'day')
        .replace(/ciudad/gi, 'city')
        .replace(/mar/gi, 'sea')
        .replace(/montaña/gi, 'mountain')
        .replace(/viaje/gi, 'journey')
        .replace(/camino/gi, 'path')
        .replace(/tiempo/gi, 'time')
        .replace(/eternidad/gi, 'eternity')
        .replace(/familia/gi, 'family')
        .replace(/amigos/gi, 'friends')
        .replace(/guerra/gi, 'war')
        .replace(/paz/gi, 'peace')
        .replace(/revolución/gi, 'revolution')
        .replace(/con/gi, 'with')
        .replace(/y /gi, 'and ')
        .replace(/sobre/gi, 'about')
        .replace(/en /gi, 'in ')
        .replace(/de /gi, 'of ')
        .replace(/para/gi, 'for')
        .replace(/sin /gi, 'without ')
        .replace(/muy /gi, 'very ')
        .replace(/poco/gi, 'little')
        .replace(/mucho/gi, 'much')
        .replace(/todo/gi, 'everything')
        .replace(/nada/gi, 'nothing');
      
      finalPrompt += `. THEME: ${translatedCustom}`;
    }

    // NUEVO: Sugerencia de canción larga
    if (longTrack) {
      finalPrompt += `, full-length extended track, long version, epic 8-minute journey`;
    }

    return finalPrompt;
  };

  // NUEVA FUNCIÓN: Generación Aleatoria Inteligente
  const randomizeGeneration = () => {
    // 1. Género aleatorio
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)].value;
    setSelectedGenre(randomGenre);

    // 2. Mood coherente con el género
    const compatibleMoods = MOODS_BY_GENRE[randomGenre] || MOODS_BY_GENRE['default'];
    const randomMood = compatibleMoods[Math.floor(Math.random() * compatibleMoods.length)];
    setSelectedMood(randomMood);

    // 3. Tempo coherente con el género
    const tempoRange = TEMPO_RANGES[randomGenre] || TEMPO_RANGES['default'];
    const randomTempo = Math.floor(Math.random() * (tempoRange.max - tempoRange.min + 1)) + tempoRange.min;
    setTempo(randomTempo);

    // 4. Energía coherente con el mood
    const energyRange = ENERGY_RANGES[randomMood] || { min: 40, max: 70 };
    const randomEnergy = Math.floor(Math.random() * (energyRange.max - energyRange.min + 1)) + energyRange.min;
    setEnergy(randomEnergy);

    // 5. Estilo aleatorio
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)].value;
    setSelectedStyle(randomStyle);

    // 6. Voz (70% con voz, 30% instrumental)
    const voiceRandom = Math.random();
    let selectedVoice: string;
    if (voiceRandom > 0.7) {
      selectedVoice = 'instrumental';
    } else {
      const voices = ['male', 'female', 'choir'];
      selectedVoice = voices[Math.floor(Math.random() * voices.length)];
    }
    setVoiceType(selectedVoice);

    // 7. Idioma coherente con el género
    const compatibleLanguages = LANGUAGES_BY_GENRE[randomGenre] || LANGUAGES_BY_GENRE['default'];
    const randomLanguage = compatibleLanguages[Math.floor(Math.random() * compatibleLanguages.length)];
    setSelectedLanguage(randomLanguage);

    // 8. Tema personalizado coherente con el mood
    const themeOptions = THEMES_BY_MOOD[randomMood] || [
      'Una historia única y especial',
      'Viaje emocional intenso',
      'Momentos que definen la vida',
    ];
    const randomTheme = themeOptions[Math.floor(Math.random() * themeOptions.length)];
    setCustomPrompt(randomTheme);

    // 9. Parámetros avanzados aleatorios pero razonables
    setStyleWeight(0.5 + (Math.random() * 0.3)); // 50-80%
    setWeirdnessConstraint(Math.random() * 0.7); // 0-70%
    setLongTrack(Math.random() > 0.8); // 20% de probabilidad
    
    // 10. Género vocal (solo si no es instrumental)
    if (selectedVoice !== 'instrumental') {
      const genderOptions: ('any' | 'm' | 'f')[] = ['any', 'm', 'f'];
      setVocalGender(genderOptions[Math.floor(Math.random() * genderOptions.length)]);
    } else {
      setVocalGender('any');
    }

    // 11. Modelo SIEMPRE V5 (no se randomiza)
    setSelectedModel('V5');

    // 12. Limpiar negative tags
    setNegativeTags('');

    console.log('🎲 Generación aleatoria aplicada:', {
      genre: randomGenre,
      mood: randomMood,
      tempo: randomTempo,
      energy: randomEnergy,
      voice: selectedVoice,
      theme: randomTheme,
    });
  };

  const saveSongToSupabase = async (song: any) => {
    try {
      if (!userId) {
        console.warn('⚠️ No hay userId, no se puede guardar en Supabase');
        return;
      }

      console.log('💾 Guardando canción en Supabase...');
      console.log('📥 URL temporal de SunoAPI:', song.audio_url);

      // 1. Descargar el MP3 desde SunoAPI
      let permanentAudioUrl = song.audio_url;
      
      if (song.audio_url && song.audio_url.includes('suno')) {
        try {
          console.log('⬇️ Descargando MP3 desde SunoAPI...');
          
          // Crear un AbortController para timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
          
          const response = await fetch(song.audio_url, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const blob = await response.blob();
          console.log('✅ MP3 descargado:', blob.size, 'bytes');

          // 2. Generar nombre único para el archivo
          const fileName = `${userId}/${song.id}.mp3`;
          
          // 3. Subir a Supabase Storage
          console.log('⬆️ Subiendo a Supabase Storage:', fileName);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('songs')
            .upload(fileName, blob, {
              contentType: 'audio/mpeg',
              upsert: true
            });

          if (uploadError) {
            console.error('❌ Error subiendo a Storage:', uploadError);
            throw uploadError;
          }

          // 4. Obtener URL pública permanente
          const { data: urlData } = supabase.storage
            .from('songs')
            .getPublicUrl(fileName);

          permanentAudioUrl = urlData.publicUrl;
          console.log('✅ URL permanente creada:', permanentAudioUrl);
          
        } catch (storageError: any) {
          if (storageError.name === 'AbortError') {
            console.error('⚠️ Timeout al descargar MP3, usando URL temporal');
          } else {
            console.error('⚠️ Error en Storage, usando URL temporal:', storageError);
          }
          // Si falla, continuamos con la URL temporal
        }
      }

      // 5. Guardar en la base de datos (sin imagen, se generará después)
      const songData = {
        user_id: userId,
        title: song.title || 'Canción sin título',
        suno_id: song.id,
        audio_url: permanentAudioUrl, // URL permanente o temporal si falló
        image_url: null, // Se generará con DALL-E 3 en segundo plano
        genre: selectedGenre,
        prompt: buildPrompt(),
        duration: song.duration ? Math.floor(parseFloat(song.duration.toString())) : null, // Convertir a número y redondear
        tempo: tempo.toString(),
        energy: energy.toString(),
        mood: selectedMood,
        voice_type: voiceType,
        language: selectedLanguage, // ← AÑADIDO: Guardar el idioma
        status: 'complete' as const,
      };

      console.log('💾 Guardando en base de datos:', songData);

      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select();

      if (error) {
        console.error('❌ Error guardando en Supabase:', error);
        throw error;
      }

      const savedSong = data[0];
      console.log('✅ Canción guardada en Supabase:', savedSong);

      // 🎨 Generar cover con DALL-E 3 en segundo plano (NO BLOQUEA)
      generateCoverInBackground(savedSong.id, savedSong.title, selectedGenre, selectedMood, userId);

      return savedSong;
    } catch (err: any) {
      console.error('❌ Error en saveSongToSupabase:', err);
      throw err;
    }
  };

  // 🎨 Generar cover con DALL-E 3 en segundo plano (NO BLOQUEA la generación)
  const generateCoverInBackground = (
    songId: string,
    title: string,
    genre: string,
    mood: string,
    userId: string
  ) => {
    console.log('🎨 Iniciando generación de cover en segundo plano para:', title);
    
    // Llamada sin await - NO bloquea el proceso principal
    fetch('/api/generate-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        songId, 
        title, 
        genre, 
        mood, 
        userId 
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Cover generado exitosamente:', data.imageUrl);
          addLog(`🎨 Cover generado para "${title}"`);
        } else {
          console.warn('⚠️ Error generando cover (no crítico):', data.error);
        }
      })
      .catch(err => {
        console.error('⚠️ Error generando cover (no crítico):', err);
        // No es un error crítico - la canción ya está guardada
      });
  };

  // Función auxiliar para generar UNA canción (reutilizable para batch)
  const generateSingleMusic = async (batchIndex: number = 0, totalBatch: number = 1) => {
    try {
      // NUEVO: Si es batch múltiple, crear variación según el tipo seleccionado
      let currentCustomPrompt = customPrompt;
      let titleSuffix = '';
      
      if (totalBatch > 1 && batchIndex > 0) {
        if (batchVariationType === 'similar') {
          // VARIACIONES SUTILES: Solo cambios en el título, mismo tema
          const variations = [
            '', // Primera usa el original sin cambios
            ' (Versión Extendida)',
            ' (Remix)',
            ' (Alternative Version)',
            ' (Extended Mix)',
            ' (Original Mix)',
            ' (Club Version)',
            ' (Radio Edit)',
            ' (Acoustic Version)',
            ' (Unplugged)',
          ];
          titleSuffix = variations[batchIndex % variations.length];
          // currentCustomPrompt se mantiene igual
        } else {
          // VARIACIONES DIFERENTES: Temas completamente distintos
          const themeOptions = THEMES_BY_MOOD[selectedMood] || [
            'Una historia única y especial',
            'Viaje emocional intenso',
            'Momentos que definen la vida',
            'Experiencia musical profunda',
            'Recuerdos inolvidables',
            'Camino hacia lo desconocido',
          ];
          currentCustomPrompt = themeOptions[batchIndex % themeOptions.length];
          // Título incluirá primeras palabras del tema
          const themeWords = currentCustomPrompt.split(' ').slice(0, 3).join(' ');
          titleSuffix = ` - ${themeWords}`;
        }
      }

      // El prompt generado será el STYLE (descripción del género/estilo)
      const styleDescription = buildPrompt();
      
      // Generar título automático basado en el género y mood
      const genreLabel = GENRES.find(g => g.value === selectedGenre)?.label || selectedGenre;
      const moodLabel = MOODS.find(m => m.value === selectedMood)?.label || selectedMood;
      
      // NUEVO: Construir título con variación sutil
      let title = `${genreLabel} ${moodLabel}`;
      if (totalBatch > 1 && titleSuffix) {
        title = `${genreLabel} ${moodLabel}${titleSuffix}`;
      }

      const batchPrefix = totalBatch > 1 ? `[${batchIndex + 1}/${totalBatch}] ` : '';
      addLog(`${batchPrefix}🎵 Iniciando generación de música...`);
      if (batchIndex === 0) { // Solo mostrar detalles en la primera generación
        addLog(`🤖 Modelo IA: ${selectedModel} - ${AI_MODELS.find(m => m.value === selectedModel)?.description}`);
      }
      addLog(`${batchPrefix}📝 Título: ${title}`);
      // Solo mostrar todos los detalles en la primera generación del batch
      if (batchIndex === 0) {
        addLog(`🎸 Género: ${genreLabel}`);
        addLog(`😊 Mood: ${moodLabel}`);
        addLog(`🎚️ Tempo: ${tempo} BPM`);
        addLog(`⚡ Energía: ${energy}%`);
        addLog(`🎤 Voz: ${voiceType === 'instrumental' ? 'Instrumental' : VOICE_TYPES.find(v => v.value === voiceType)?.label}`);
        if (voiceType !== 'instrumental') {
          addLog(`🌍 Idioma: ${LANGUAGES.find(l => l.value === selectedLanguage)?.label}`);
        }
        if (currentCustomPrompt) {
          addLog(`💡 Tema personalizado: ${currentCustomPrompt.substring(0, 50)}...`);
        }
        if (totalBatch > 1) {
          addLog(`📚 Batch múltiple: Cada generación tendrá variación en el título`);
        }
        
        // NUEVOS LOGS PARA PARÁMETROS AVANZADOS
        if (longTrack) {
          addLog(`⏱️ Duración: Canción larga sugerida (8+ min)`);
        }
        if (vocalGender !== 'any') {
          addLog(`🎤 Género vocal: ${vocalGender === 'm' ? 'Masculino' : 'Femenino'}`);
        }
        addLog(`🎯 Adherencia al estilo: ${Math.round(styleWeight * 100)}%`);
        addLog(`🎨 Creatividad: ${Math.round(weirdnessConstraint * 100)}%`);
        if (negativeTags) {
          addLog(`🚫 Evitar: ${negativeTags}`);
        }
        
        // Mostrar el prompt completo que se enviará
        addLog(`📋 Prompt completo: ${styleDescription.substring(0, 100)}...`);
      }

      addLog(`${batchPrefix}📤 Enviando request a SunoAPI...`);

      const response = await axios({
        method: 'POST',
        url: '/api/generate',
        data: {
          prompt: styleDescription,        // Descripción del estilo (STYLE)
          customPrompt: currentCustomPrompt, // MODIFICADO: Usar tema específico de este batch
          make_instrumental: voiceType === 'instrumental',
          title,
          genre: selectedGenre,
          voiceType,
          language: selectedLanguage,      // Para generar letras placeholder en el idioma correcto
          model: selectedModel,            // Modelo IA seleccionado por el usuario
          // NUEVOS PARÁMETROS AVANZADOS
          vocalGender: vocalGender === 'any' ? undefined : vocalGender, // Solo enviar si está definido
          styleWeight: styleWeight,
          weirdnessConstraint: weirdnessConstraint,
          negativeTags: negativeTags.trim() || undefined, // Solo enviar si no está vacío
        },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success && response.data.data.taskId) {
        const taskId = response.data.data.taskId;
        addLog(`${batchPrefix}✅ Task ID recibido: ${taskId}`);
        return taskId; // Devolver el taskId para procesamiento posterior
      } else {
        addLog(`${batchPrefix}❌ Error: ${response.data.error || 'No se recibió taskId'}`);
        throw new Error(response.data.error || 'No se recibió taskId');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido al generar música';
      addLog(`${batchPrefix}❌ Error en generación: ${errorMessage}`);
      throw err;
    }
  };

  // NUEVA FUNCIÓN: Generación Múltiple en Paralelo
  const generateMusic = async () => {
    if (!selectedGenre && !customPrompt) {
      setError('Por favor selecciona un género o escribe un prompt personalizado');
      return;
    }

    // Abrir modal y resetear logs
    setIsModalOpen(true);
    setGenerationLogs([]);
    logsRef.current = [];
    setGenerationStatus('generating');
    setLoading(true);
    setError('');
    setBatchProgress({ current: 0, total: batchCount });
    batchCompletedRef.current = 0; // RESETEAR contador de completados

    try {
      addLog(`🎯 Iniciando generación de ${batchCount} lote(s) en paralelo...`);
      addLog(`📊 Total de canciones: ${batchCount * 2} (2 variaciones por generación)`);
      if (batchCount > 1) {
        const variationText = batchVariationType === 'similar' 
          ? 'variaciones sutiles en título (Remix, Extended, etc.)'
          : 'temas/letras completamente diferentes';
        addLog(`🎵 Mismo género/mood/tempo, ${variationText}`);
      }
      addLog('');

      // Crear array de promesas para ejecutar en paralelo
      const promises = Array(batchCount).fill(null).map((_, index) => 
        generateSingleMusic(index, batchCount)
      );

      // Ejecutar todas las generaciones en paralelo
      const taskIds = await Promise.all(promises);
      batchTaskIdsRef.current = taskIds;

      addLog('');
      addLog(`✅ ${batchCount} generación(es) iniciada(s) correctamente`);
      addLog(`📋 Task IDs: ${taskIds.join(', ')}`);
      addLog('⏳ Iniciando seguimiento de todas las canciones...');

      // Iniciar polling para todos los taskIds
      for (const taskId of taskIds) {
        pollSongStatus(taskId);
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido';
      addLog(`❌ Error en generación batch: ${errorMessage}`);
      
      setError(`Error al generar música: ${errorMessage}`);
      setLoading(false);
      setGenerationStatus('error');
    }
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    logsRef.current = []; // Limpiar logs ref
    setGenerationLogs([]);
  };

  // Función para cancelar generación
  const handleCancelGeneration = () => {
    addLog('🛑 Cancelando generación...');
    
    // Detener polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    currentTaskIdRef.current = null;
    setLoading(false);
    setGenerationStatus('error');
    addLog('❌ Generación cancelada por el usuario');
  };

  const pollSongStatus = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        addLog(`🔍 Consultando estado (intento ${attempts}/${maxAttempts})...`);
        
        const response = await axios({
          method: 'GET',
          url: '/api/status',
          params: { ids: taskId }
        });
        
        if (response.data.success) {
          const { status, songs } = response.data.data;
          
          // Según la doc, status puede ser: GENERATING, SUCCESS, FAILED, PENDING, TEXT_SUCCESS, FIRST_SUCCESS
          if ((status === 'SUCCESS' || status === 'TEXT_SUCCESS' || status === 'FIRST_SUCCESS') && songs && songs.length > 0) {
            // ✅ DETENER POLLING INMEDIATAMENTE
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            // Canciones completadas
            addLog(`✅ Generación completada! ${songs.length} canción(es)`);
            
            // Guardar en Supabase
            try {
              for (const song of songs) {
                addLog(`💾 Guardando: ${song.title}...`);
                
                try {
                  await saveSongToSupabase(song);
                  addLog(`✅ Guardada: ${song.title}`);
                } catch (saveErr: any) {
                  addLog(`⚠️ Error guardando ${song.title}: ${saveErr.message}`);
                  addLog(`💡 La canción se guardó con URL temporal`);
                }
                
              }
              
              addLog(`🎉 ¡${songs.length} canción(es) guardadas en tu biblioteca!`);
              
              // Incrementar contador de generaciones completadas
              batchCompletedRef.current += 1;
              const totalBatch = batchTaskIdsRef.current.length || 1;
              const completedCount = batchCompletedRef.current;
              
              addLog(`📊 Progreso: ${completedCount}/${totalBatch} generaciones completadas`);
              
              // Solo actualizar estado final cuando TODAS las generaciones terminen
              if (completedCount >= totalBatch) {
                const totalSongs = completedCount * 2; // Cada generación = 2 canciones
                addLog('');
                addLog(`🎊 ¡TODAS LAS GENERACIONES COMPLETADAS!`);
                addLog(`🎵 Total: ${totalSongs} canciones generadas y guardadas`);
                addLog('');
                
                setSuccessMessage(`🎉 ¡${totalSongs} canciones generadas y guardadas correctamente! Ve a la Biblioteca para escucharlas.`);
                setGenerationStatus('success');
                setLoading(false);
                
                // Notificar al componente padre
                if (onSongGenerated) {
                  onSongGenerated();
                }
              }
              
              // Limpiar mensaje después de 10 segundos (solo cuando termine todo)
              if (completedCount >= totalBatch) {
                setTimeout(() => setSuccessMessage(''), 10000);
              }
            } catch (saveError: any) {
              addLog(`❌ Error al guardar: ${saveError.message}`);
              setError('Canción generada pero hubo un error al guardar: ' + saveError.message);
              setGenerationStatus('error');
              setLoading(false);
            }
            
            return; // ✅ SALIR DE LA FUNCIÓN PARA EVITAR MÁS POLLING
          } else if (status === 'FAILED') {
            // ✅ DETENER POLLING EN CASO DE ERROR
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            addLog('❌ Generación falló');
            
            setError('La generación de música falló');
            setLoading(false);
            setGenerationStatus('error');
            return; // ✅ SALIR DE LA FUNCIÓN
          } else if (status === 'GENERATING' || status === 'PENDING' || status === 'TEXT_SUCCESS' || status === 'FIRST_SUCCESS') {
            // Aún generando, seguir consultando
            if (attempts < maxAttempts) {
              let statusMsg = status;
              if (status === 'TEXT_SUCCESS') {
                statusMsg = '🎵 Letras generadas, esperando audio...';
              } else if (status === 'FIRST_SUCCESS') {
                statusMsg = '🎸 Primera canción casi lista...';
              } else if (status === 'GENERATING') {
                statusMsg = '🎼 Generando música...';
              } else {
                statusMsg = '⏳ En cola...';
              }
              addLog(statusMsg);
              setTimeout(checkStatus, 5000);
            } else {
              // ✅ DETENER POLLING AL ALCANZAR MÁXIMO DE INTENTOS
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              addLog('⏰ Tiempo máximo alcanzado');
              
              setError('Tiempo de espera agotado. La generación está tomando más tiempo del esperado.');
              setLoading(false);
              setGenerationStatus('error');
              return; // ✅ SALIR DE LA FUNCIÓN
            }
          } else if (status === 'SUCCESS' && (!songs || songs.length === 0)) {
            // SUCCESS pero sin canciones aún - seguir esperando
            addLog(`⏳ Procesando respuesta... (intento ${attempts}/${maxAttempts})`);
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000);
            } else {
              // ✅ DETENER POLLING AL ALCANZAR MÁXIMO DE INTENTOS
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              addLog('❌ Las canciones no se generaron correctamente');
              
              setError('Las canciones no se generaron correctamente');
              setLoading(false);
              setGenerationStatus('error');
              return; // ✅ SALIR DE LA FUNCIÓN
            }
          }
        } else {
          addLog('❌ Respuesta sin éxito de la API');
        }
      } catch (err: any) {
        // ✅ MANEJO DE ERRORES DE RED
        const isNetworkError = err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.message?.includes('Network Error') || err.message?.includes('timeout');
        
        if (isNetworkError && attempts < maxAttempts) {
          addLog(`⚠️ Error de conexión, reintentando... (${err.message})`);
          // Esperar 3 segundos extra antes de reintentar
          setTimeout(checkStatus, 8000);
          return;
        }
        
        // ✅ DETENER POLLING EN CASO DE ERROR PERMANENTE
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        addLog(`❌ Error: ${err.message || 'Error desconocido'}`);
        
        setError('Error al consultar el estado: ' + (err.message || 'Error desconocido'));
        setLoading(false);
        setGenerationStatus('error');
        return; // ✅ SALIR DE LA FUNCIÓN
      }
    };

    checkStatus();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-colors duration-200">
        {/* Selector de Modelo IA - NUEVO */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-900 px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                🤖 Modelo de IA:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.badge} {model.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
              {AI_MODELS.find(m => m.value === selectedModel)?.description}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Generador de Música IA</h2>
            </div>
            {/* Botón de Generación Aleatoria */}
            <button
              onClick={randomizeGeneration}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Genera una configuración aleatoria coherente"
            >
              <span className="text-lg">🎲</span>
              <span className="hidden sm:inline">Generación Aleatoria</span>
              <span className="sm:hidden">Aleatorio</span>
            </button>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Configura los parámetros y genera tu música</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Género Musical */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              1. Elige tu género musical
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre.value}
                  onClick={() => setSelectedGenre(genre.value)}
                  className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                    selectedGenre === genre.value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                  } border`}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de Ánimo */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              2. ¿Qué sentimiento quieres transmitir?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                    selectedMood === mood.value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                  } border`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo/Era - NUEVO */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              3. ¿Qué estilo/época prefieres?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                    selectedStyle === style.value
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                  } border`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders: Tempo y Energía */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tempo */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                4. Tempo (BPM - Beats Per Minute)
              </label>
              <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Lento (60)</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">{tempo} BPM</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Rápido (200)</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Energía */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                5. Energía
              </label>
              <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Suave</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">{energy}%</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Alta</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Voz */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              6. Tipo de voz
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VOICE_TYPES.map((voice) => (
                <button
                  key={voice.value}
                  onClick={() => setVoiceType(voice.value)}
                  className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                    voiceType === voice.value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                  } border`}
                >
                  {voice.label}
                </button>
              ))}
            </div>
          </div>

          {/* Idioma de la letra */}
          {voiceType !== 'instrumental' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                7. Idioma de la letra
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setSelectedLanguage(lang.value)}
                    className={`px-3 py-2 rounded-md font-medium text-sm transition-all ${
                      selectedLanguage === lang.value
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                    } border`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NUEVOS: Parámetros Avanzados */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                ⚙️ Parámetros Avanzados (Opcional)
              </h3>
            </div>

            <div className="space-y-4">
              {/* Duración Sugerida */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  <input
                    type="checkbox"
                    checked={longTrack}
                    onChange={(e) => setLongTrack(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                  />
                  ⏱️ Canción Larga (8+ minutos)
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-6">
                  Sugiere a la IA generar una canción más larga (no garantizado, depende del modelo y estructura musical)
                </p>
              </div>

              {/* Género de Voz */}
              {voiceType !== 'instrumental' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    🎤 Género de Voz Preferido
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setVocalGender('any')}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                        vocalGender === 'any'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                      } border`}
                    >
                      Cualquiera
                    </button>
                    <button
                      onClick={() => setVocalGender('m')}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                        vocalGender === 'm'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                      } border`}
                    >
                      Masculina
                    </button>
                    <button
                      onClick={() => setVocalGender('f')}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                        vocalGender === 'f'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
                      } border`}
                    >
                      Femenina
                    </button>
                  </div>
                </div>
              )}

              {/* Style Weight */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  🎯 Adherencia al Estilo: {Math.round(styleWeight * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={styleWeight}
                  onChange={(e) => setStyleWeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>Flexible</span>
                  <span>Estricto</span>
                </div>
              </div>

              {/* Weirdness Constraint */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  🎨 Creatividad/Experimentación: {Math.round(weirdnessConstraint * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={weirdnessConstraint}
                  onChange={(e) => setWeirdnessConstraint(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>Convencional</span>
                  <span>Experimental</span>
                </div>
              </div>

              {/* Negative Tags */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  🚫 Estilos a Evitar (opcional)
                </label>
                <input
                  type="text"
                  value={negativeTags}
                  onChange={(e) => setNegativeTags(e.target.value)}
                  placeholder="Ej: Heavy Metal, Drums, Aggressive"
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Estilos o elementos musicales que NO quieres en la canción
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Personalizado */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              💡 Añade detalles extra (opcional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ej: Canción sobre un viaje al mar, con saxofón, recuerdos de verano..."
              className="w-full p-3 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-zinc-400 dark:placeholder-zinc-500"
              rows={3}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Describe la temática, lírica o características adicionales. Se combinará con los parámetros seleccionados.
            </p>
          </div>

          {/* Preview del Prompt */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Prompt generado:</div>
            <div className="text-sm text-zinc-700 dark:text-zinc-200 font-mono">{buildPrompt()}</div>
          </div>

          {/* NUEVO: Selector de Generación Múltiple */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-900 border border-blue-200 dark:border-zinc-700 rounded-lg p-4 space-y-4">
            {/* Cantidad de generaciones */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                📊 Generación Múltiple en Paralelo
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                Cantidad: <strong>{batchCount}</strong> generaciones = <strong className="text-blue-600 dark:text-blue-400">{batchCount * 2} canciones</strong> totales
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setBatchCount(count)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
                      batchCount === count
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
                    } border disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Variación - SIEMPRE VISIBLE cuando batch > 1 */}
            {batchCount > 1 && (
              <>
                <div className="border-t border-blue-200 dark:border-zinc-700 pt-4">
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                    🎭 Tipo de Variación
                  </label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                    ¿Cómo deben variar las canciones entre sí?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setBatchVariationType('similar')}
                      disabled={loading}
                      className={`px-4 py-3 rounded-md font-medium text-sm transition-all text-left ${
                        batchVariationType === 'similar'
                          ? 'bg-blue-600 text-white border-2 border-blue-400'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-2 border-zinc-300 dark:border-zinc-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="font-bold mb-1">📝 Parecidas</div>
                      <div className="text-xs opacity-80">Mismo tema, solo cambia el título</div>
                      <div className="text-xs opacity-60 mt-1">Ej: "Remix", "Extended", "Club Mix"</div>
                    </button>
                    <button
                      onClick={() => setBatchVariationType('different')}
                      disabled={loading}
                      className={`px-4 py-3 rounded-md font-medium text-sm transition-all text-left ${
                        batchVariationType === 'different'
                          ? 'bg-purple-600 text-white border-2 border-purple-400'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-2 border-zinc-300 dark:border-zinc-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="font-bold mb-1">🎨 Diferentes</div>
                      <div className="text-xs opacity-80">Temas y letras distintas</div>
                      <div className="text-xs opacity-60 mt-1">Cada canción habla de algo diferente</div>
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-blue-500/10 dark:bg-blue-500/5 rounded-md">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {batchVariationType === 'similar' 
                        ? '✅ Género/Mood/Tempo iguales. Solo varía el título (versiones del mismo tema)'
                        : '✅ Género/Mood/Tempo iguales. Cada canción tiene temática/letra diferente'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-blue-200 dark:border-zinc-700 pt-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    ⚡ <strong>Generación en paralelo:</strong> Todas las canciones se generan simultáneamente
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Botón Generar */}
          <button
            onClick={generateMusic}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-300 dark:bg-zinc-700 cursor-not-allowed text-zinc-500 dark:text-zinc-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando {batchCount > 1 ? `${batchCount} lotes...` : 'música...'}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {batchCount > 1 ? `Generar ${batchCount * 2} Canciones` : 'Generar Música'}
              </>
            )}
          </button>

          {/* Mensaje de Éxito */}
          {successMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <Music className="w-5 h-5" />
              {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Generación */}
      <GenerationModal
        isOpen={isModalOpen}
        logs={generationLogs}
        status={generationStatus}
        onClose={handleCloseModal}
        onCancel={handleCancelGeneration}
      />
    </div>
  );
}

