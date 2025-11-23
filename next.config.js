/** @type {import('next').NextConfig} */
const nextConfig = {
  // Para Electron: exportar como sitio estático cuando BUILD_MODE=electron
  output: process.env.BUILD_MODE === 'electron' ? 'export' : undefined,
  
  // Deshabilitar optimización de imágenes para export estático
  images: {
    unoptimized: true,
  },

  // Trailing slash para compatibilidad con file://
  trailingSlash: true,

  // Base path vacío para Electron
  basePath: '',
  assetPrefix: '',

  // Desactivar checks en build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Variables de entorno expuestas
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    // Forzar paso de variables de servidor para AWS Amplify
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUNO_API_KEY: process.env.SUNO_API_KEY,
    SUNO_API_BASE_URL: process.env.SUNO_API_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

module.exports = nextConfig;
