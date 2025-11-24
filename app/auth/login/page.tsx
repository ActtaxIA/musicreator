'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Intentando login con Supabase...');
      console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Login exitoso:', data.user?.email);
      
      // Redirigir a la app
      router.push('/');
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      
      // Manejo específico de errores
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (error.message?.includes('fetch')) {
        errorMessage = '🌐 Error de conexión con Supabase. Verifica tu conexión a internet o las variables de entorno.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = '🔑 Email o contraseña incorrectos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-purple-900 dark:via-black dark:to-blue-900 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Narciso Music Generator
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Herramienta Interna - Acceso Restringido</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 dark:border-white/20 shadow-xl dark:shadow-none">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-gray-700 dark:text-white font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 dark:text-white font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              🔒 Sistema privado. Solo usuarios autorizados.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs text-center mt-2">
              ¿No tienes acceso? Contacta al administrador.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © 2025 Narciso Music Generator - Herramienta Interna
          </p>
        </div>
      </div>
    </div>
  );
}
