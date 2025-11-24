'use client';

import { useState, useEffect } from 'react';
import { Music2, LogIn, Sparkles } from 'lucide-react';
import MusicPlayer from '@/components/MusicPlayer';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function TrialPlayerPage() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrialSongs();
  }, []);

  const loadTrialSongs = async () => {
    try {
      // 1. Buscar IDs guardados en localStorage
      const savedIds = localStorage.getItem('trial_song_ids');
      let payload = {};

      if (savedIds) {
        try {
          payload = { songIds: JSON.parse(savedIds) };
          console.log('🔄 Cargando canciones guardadas de sesión anterior...');
        } catch (e) {
          console.error('Error parsing saved IDs', e);
        }
      } else {
        console.log('🎲 Generando nueva selección de canciones trial...');
      }

      // 2. Pedir canciones al API
      const response = await fetch('/api/trial-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error cargando canciones');

      const data = await response.json();
      setSongs(data);

      // 3. Si no teníamos IDs guardados, guardarlos ahora
      if (!savedIds && data.length > 0) {
        const newIds = data.map((s: any) => s.id);
        localStorage.setItem('trial_song_ids', JSON.stringify(newIds));
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock para favoritos en modo trial (solo visual, no persiste en BD)
  const handleToggleFavorite = (songId: string) => {
    setSongs(prev => prev.map((s: any) => 
      s.id === songId ? { ...s, is_favorite: !s.is_favorite } : s
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-300 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-900 dark:text-white text-lg">Cargando Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200">
      {/* Header Simplificado */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Music2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h1 className="text-zinc-900 dark:text-white font-bold text-xl flex items-center gap-2">
                  Narciso Music
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                    Demo
                  </span>
                </h1>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href="/auth/login"
                className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Acceso Clientes</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Banner Promocional */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                Prueba la Experiencia Premium
              </h2>
              <p className="text-blue-100 max-w-xl">
                Estás escuchando una selección aleatoria de 5 canciones generadas por nuestra IA. 
                Los clientes registrados tienen acceso a generación ilimitada, biblioteca completa y descargas en alta calidad.
              </p>
            </div>
            {/* Botón CTA (Call to Action) opcional, por ahora lleva al login */}
          </div>
        </div>

        {/* Reproductor */}
        <MusicPlayer 
          songs={songs} 
          onToggleFavorite={handleToggleFavorite}
          userId="trial-user" 
        />

        <div className="mt-8 text-center text-zinc-500 dark:text-zinc-500 text-xs">
          <p>Sesión de prueba limitada a 5 canciones • ID de sesión: {typeof window !== 'undefined' && localStorage.getItem('trial_song_ids')?.substring(0, 15)}...</p>
        </div>
      </main>
    </div>
  );
}


