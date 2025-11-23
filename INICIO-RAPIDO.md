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
5. `scripts/fix-policies-v3-final.sql` (Políticas de seguridad RLS)

**Para ser Admin:**
Si eres el primer usuario, ejecuta el script de asignación manual o usa el bypass de email configurado en `route.ts`.

## 4. Ejecutar en Desarrollo

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

## ✨ Características Nuevas (v3.0 - Narciso)

- **👥 Gestión de Usuarios:** Panel de administración completo para crear usuarios y asignar roles (Admin, Editor, Suscriptor).
- **📱 Modo Móvil Completo:** Usa la app desde tu teléfono con una interfaz 100% adaptada, incluyendo el admin.
- **❤️ Favoritos Personales:** Cada usuario tiene su propia lista de favoritos.
- **💾 Almacenamiento Permanente:** Las canciones se guardan en tu propia nube.
- **🎨 Covers con IA:** Genera portadas únicas para cada canción.
- **🔊 Reproductor Pro:** Cola, filtros de favoritos, aleatorio inteligente y visualización de audio.

## ❓ Solución de Problemas Comunes

- **Error 401 en Admin:** Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté en `.env.local` y reinicia el servidor.
- **Error de Duración 0:00:** Se corrige solo. Reproduce la canción y el sistema actualizará la duración real automáticamente.
- **Imágenes rotas:** Usa el botón "Generar Cover" o "Sin Cover" para detectar y reparar canciones sin imagen.
