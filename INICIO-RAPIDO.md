# 🚀 Inicio Rápido - Narciso Music Generator

## Requisitos Previos
- **Node.js** 18+ instalado.
- **Cuenta en Supabase** (para base de datos y auth).
- **Cuenta en SunoAPI** (o servidor propio).
- **OpenAI API Key** (opcional, para covers con DALL-E 3).

## 1. Instalación

```bash
# Clonar repositorio
git clone <tu-repo>
cd music-creator

# Instalar dependencias
npm install
```

## 2. Configuración de Entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (NECESARIO para Admin)
SUNO_API_KEY=tu_api_key_suno
OPENAI_API_KEY=tu_api_key_openai
```

## 3. Configuración de Base de Datos

Ejecuta los scripts SQL en tu panel de Supabase (SQL Editor) en este orden:
1. `scripts/schema-auth.sql` (Tablas base)
2. `scripts/storage-setup.sql` (Buckets de almacenamiento)
3. `scripts/setup-roles.sql` (Tabla de roles)
4. `scripts/setup-favorites.sql` (Tabla de favoritos)
5. `scripts/setup-channels.sql` (Tabla de canales)
6. `scripts/setup-channel-songs.sql` (Tabla intermedia para canales)
7. `scripts/update-languages.sql` (Columna de idioma)
8. `scripts/fix-policies-v3-final.sql` (Políticas de seguridad RLS)

**Para ser Admin:**
Si eres el primer usuario, ejecuta `scripts/set-admin.sql` con tu email o usa el bypass de email configurado en `app/api/admin/users/route.ts`.

## 4. Ejecutar en Desarrollo

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

## 5. Despliegue en Producción (AWS Amplify / Vercel)

### Variables de Entorno Requeridas:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (CRÍTICO para Admin y generación)
SUNO_API_KEY
SUNO_API_BASE_URL
OPENAI_API_KEY
```

**Importante:** Asegúrate de que todas las variables estén configuradas en tu plataforma de deployment. Las variables con prefijo `NEXT_PUBLIC_` son públicas, las demás son privadas y solo accesibles desde el servidor.

## ✨ Características Nuevas (v1.5 - Sistema de Canales)

- **🎵 Canales (Playlists Manuales):** Crea canales temáticos y añade canciones manualmente desde la biblioteca.
- **🔄 Toggle Multi-Canal:** Añade o quita canciones de múltiples canales con un solo clic.
- **✓ Feedback Visual:** Los canales asignados aparecen con fondo verde y checkmark.
- **📱 Media Session API:** Controla la reproducción desde la pantalla de bloqueo del móvil (siguiente/anterior).
- **🌓 Tema Claro/Oscuro:** Toggle global con persistencia y contraste optimizado.
- **📲 PWA Mejorado:** Experiencia fullscreen sin scroll lateral en dispositivos móviles.
- **👥 Gestión de Usuarios:** Panel de administración completo para crear usuarios y asignar roles (Admin, Editor, Suscriptor).
- **❤️ Favoritos Personales:** Cada usuario tiene su propia lista de favoritos independiente.
- **💾 Almacenamiento Permanente:** Las canciones se guardan en Supabase Storage (sin enlaces caducados).
- **🎨 Covers con IA:** Genera portadas únicas para cada canción con DALL-E 3.
- **🔊 Reproductor Pro:** Cola inteligente, filtros por género/idioma/favoritos, búsqueda en tiempo real, aleatorio sin repeticiones.

## ❓ Solución de Problemas Comunes

- **Error 401 en Admin:** Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté en `.env.local` y en las variables de entorno de producción. Reinicia el servidor.
- **Generación falla en producción:** Verifica que `SUNO_API_KEY` y `SUNO_API_BASE_URL` estén configuradas correctamente en las variables de entorno de tu plataforma.
- **Error de Duración 0:00:** Se corrige automáticamente. Reproduce la canción y el sistema actualizará la duración real.
- **Imágenes rotas:** Usa el botón "Generar Cover" o el filtro "Sin Cover" para detectar y reparar canciones sin imagen.
- **Controles de bloqueo no aparecen (iOS):** Reproduce una canción, pausa, reproduce de nuevo. iOS puede tardar unos segundos en activar los controles la primera vez.
- **Scroll lateral en móvil:** Asegúrate de tener la última versión con `overflow-x: hidden` en `app/globals.css`.
