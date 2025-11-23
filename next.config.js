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
  },
};

module.exports = nextConfig;
