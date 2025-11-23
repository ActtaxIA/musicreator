'use client';

import { Sparkles, Music, Zap, Download, Check, Github } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'IA Generativa Avanzada',
      description: 'Crea música profesional en segundos con la última tecnología de Suno AI',
    },
    {
      icon: Music,
      title: 'Editor Visual Completo',
      description: 'Extiende, separa stems y personaliza tu música con una interfaz intuitiva',
    },
    {
      icon: Zap,
      title: 'Generación Rápida',
      description: 'De prompt a canción completa en menos de 60 segundos',
    },
    {
      icon: Download,
      title: 'Exporta en Múltiples Formatos',
      description: 'MP3, WAV, stems separados - todo listo para usar en tu DAW favorito',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'siempre',
      features: [
        '10 canciones/mes',
        'Todos los géneros',
        'Duración hasta 4 min',
        'Descarga MP3',
        'Biblioteca personal',
      ],
      cta: 'Empezar Gratis',
      popular: false,
    },
    {
      name: 'Pro',
      price: '19',
      period: 'mes',
      features: [
        'Canciones ilimitadas',
        'Todos los géneros',
        'Duración hasta 8 min',
        'Descarga MP3 + WAV',
        'Separación de stems',
        'Editor avanzado',
        'Prioridad en generación',
        'Soporte prioritario',
      ],
      cta: 'Prueba Pro 7 días',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Todo de Pro',
        'API access',
        'Volumen ilimitado',
        'White-label',
        'Soporte dedicado',
        'SLA garantizado',
      ],
      cta: 'Contactar',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <span className="text-white font-bold text-xl">Suno Music Generator</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Características
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Precios
              </a>
              <a href="#download" className="text-gray-300 hover:text-white transition-colors">
                Descargar
              </a>
              <Link
                href="/app"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Abrir App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Crea Música Profesional
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              con Inteligencia Artificial
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Genera, edita y exporta canciones originales en minutos. Sin conocimientos musicales necesarios.
            Potenciado por Suno AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/app"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:scale-105"
            >
              Probar Ahora - Gratis
            </Link>
            <a
              href="#download"
              className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-lg text-white font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
            >
              <Download className="w-5 h-5 inline mr-2" />
              Descargar para Windows
            </a>
          </div>

          {/* Demo Video Placeholder */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <Music className="w-20 h-20 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">Video Demo - Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            Todo lo que necesitas para crear música
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Planes para cada necesidad
          </h2>
          <p className="text-xl text-gray-300 text-center mb-16">
            Empieza gratis, escala cuando quieras
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500 scale-105'
                    : 'bg-white/5 backdrop-blur-lg border border-white/10'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">${plan.price}</span>
                  {plan.period && <span className="text-gray-400">/{plan.period}</span>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-20 px-4 bg-black/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Disponible como App de Escritorio
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Descarga la aplicación nativa para Windows, macOS o Linux. Sin instalaciones complicadas.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="text-4xl mb-4">🪟</div>
              <h3 className="text-xl font-semibold text-white mb-2">Windows</h3>
              <p className="text-gray-400 text-sm mb-4">Windows 10/11</p>
              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all">
                Descargar .exe
              </button>
              <p className="text-gray-500 text-xs mt-2">v1.0.0 - 120 MB</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="text-4xl mb-4">🍎</div>
              <h3 className="text-xl font-semibold text-white mb-2">macOS</h3>
              <p className="text-gray-400 text-sm mb-4">macOS 10.15+</p>
              <button className="w-full py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all">
                Próximamente
              </button>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="text-4xl mb-4">🐧</div>
              <h3 className="text-xl font-semibold text-white mb-2">Linux</h3>
              <p className="text-gray-400 text-sm mb-4">Ubuntu, Debian</p>
              <button className="w-full py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all">
                Próximamente
              </button>
            </div>
          </div>

          <div className="mt-12">
            <a
              href="https://github.com/tu-repo"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
              Ver código en GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-white font-bold">Suno Music Generator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Crea música profesional con IA. Potenciado por Suno API.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Producto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Características</a></li>
                <li><a href="#pricing" className="hover:text-white">Precios</a></li>
                <li><a href="#download" className="hover:text-white">Descargar</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Recursos</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Documentación</a></li>
                <li><a href="#" className="hover:text-white">Tutoriales</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Términos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Licencias</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
            <p>© 2025 Suno Music Generator. Desarrollado por Narciso Pardo.</p>
            <p className="mt-2">
              ⚠️ Música generada con IA. Para uso no comercial sin plan Pro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
