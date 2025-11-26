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
9. `scripts/create-sessions-table.sql` (Sistema de gestión de sesiones) **NUEVO v1.7**

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

## ✨ Características Nuevas (v1.7 - Seguridad y Optimización)

### 🔐 Seguridad y Sesiones
- **Control de Sesiones por Dispositivo:** Sistema robusto que limita sesiones simultáneas por rol.
  - Admin: Hasta 3 dispositivos (PC, móvil, tablet)
  - Editor/Subscriber: Solo 1 dispositivo (cierra automáticamente la sesión anterior al iniciar en otro)
- **Gestión de Sesiones:** Nueva pestaña con:
  - Ver dispositivos activos (IP, navegador, OS, última actividad)
  - Cerrar sesiones específicas o todas las demás
  - Logout global en todos los dispositivos
- **Metadata Completa:** Tracking de IP, navegador, sistema operativo y tipo de dispositivo.

### ⚡ Optimización de Rendimiento
- **Paginación + Infinite Scroll:** Reproductor carga solo 50 canciones inicialmente (antes 200+).
  - Carga incremental automática de 20 más al hacer scroll
  - Tiempo de carga inicial: <1 segundo (antes 3-5s)
  - Escalable a millones de canciones sin pérdida de rendimiento
- **Optimización de Batería:** Consumo mínimo en segundo plano en dispositivos móviles.

### 📱 UX Móvil Mejorada
- **Toggle Carátula:** Botón para ocultar/mostrar carátula en reproductor móvil.
  - Libera ~350px de espacio vertical
  - 2x más canciones visibles sin scroll excesivo
  - Transición suave y animada

### 🎵 Generación Avanzada (v1.6)
- **Generación Múltiple en Paralelo:** Crea hasta 10 lotes simultáneos con variaciones similares o totalmente diferentes.
- **Títulos Inteligentes:** Generación aleatoria multiidioma sin prefijos de género, coherentes con las letras.
- **Parámetros Avanzados:** Género vocal, peso de estilo, creatividad (weirdness), tags negativos, sugerencia de track largo.
- **Extensión de Canciones:** Alargar inicio o final con prompt personalizado.
- **Modelo V5 por Defecto:** Máxima calidad y velocidad con fallback automático a V4/V3.5.

### Características Base (v1.5)
- **🎵 Canales (Playlists):** Crea canales temáticos y añade canciones manualmente.
- **🔄 Toggle Multi-Canal:** Añade o quita canciones de múltiples canales.
- **📱 Media Session API:** Controles desde pantalla de bloqueo.
- **🌓 Tema Claro/Oscuro:** Toggle global con persistencia.
- **👥 Gestión de Usuarios:** Panel completo con roles (Admin, Editor, Subscriber).
- **❤️ Favoritos Personales:** Lista independiente por usuario.
- **💾 Almacenamiento Permanente:** Supabase Storage (sin enlaces caducados).
- **🎨 Covers con IA:** Genera portadas con DALL-E 3.

## ❓ Solución de Problemas Comunes

- **Error 401 en Admin:** Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté en `.env.local` y en las variables de entorno de producción. Reinicia el servidor.
- **Generación falla en producción:** Verifica que `SUNO_API_KEY` y `SUNO_API_BASE_URL` estén configuradas correctamente en las variables de entorno de tu plataforma.
- **Error de Duración 0:00:** Se corrige automáticamente. Reproduce la canción y el sistema actualizará la duración real.
- **Imágenes rotas:** Usa el botón "Generar Cover" o el filtro "Sin Cover" para detectar y reparar canciones sin imagen.
- **Controles de bloqueo no aparecen (iOS):** Reproduce una canción, pausa, reproduce de nuevo. iOS puede tardar unos segundos en activar los controles la primera vez.
- **Scroll lateral en móvil:** Asegúrate de tener la última versión con `overflow-x: hidden` en `app/globals.css`.
