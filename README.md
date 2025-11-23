# 🎵 Narciso Music Generator

> **Sistema Profesional de Generación Musical con IA**  
> Integra SunoAPI, Next.js, Supabase y DALL-E 3 para crear, gestionar y reproducir música generada por inteligencia artificial con gestión multi-usuario y sistema de canales.

![Narciso Music Generator](https://via.placeholder.com/1200x600/09090b/3b82f6?text=Narciso+Music+Generator)

## 🚀 Características Principales

### 1. Generación Musical Avanzada (Suno v3.5)
- **Control Total:** BPM (Tempo), Energía, Modo Instrumental.
- **Prompt Engineering:** Sistema inteligente que enriquece tus ideas (ej: "Un rock de los 80s" → "Anthem Rock, 80s style, electric guitars...").
- **Soporte Multilingüe:** Detección y selección automática del idioma para las letras.
- **Feedback en Tiempo Real:** Modal de logs que muestra paso a paso el proceso de generación.

### 2. Gestión de Usuarios y Roles (RBAC)
- **Sistema de Roles:** 
  - **Admin:** Control total, gestión de usuarios, canales y acceso a todo.
  - **Editor:** Acceso a generador, biblioteca y gestión de canales.
  - **Subscriber:** Acceso exclusivo al reproductor.
- **Panel de Administración:** Interfaz para listar, crear, eliminar y cambiar roles de usuarios.
- **Favoritos Personales:** Cada usuario gestiona su propia lista de "Me gusta" independiente.

### 3. Sistema de Canales (Playlists Manuales)
- **Gestión Completa:** Administradores y Editores pueden crear, editar y eliminar canales.
- **Asignación Manual:** Añade canciones a múltiples canales desde la biblioteca (Grid y Lista).
- **Feedback Visual:** Los canales ya asignados aparecen con fondo verde y checkmark ✓.
- **Toggle Intuitivo:** Añade o quita canciones de canales con un solo clic, sin cerrar el menú.
- **Reproducción por Canal:** Carga y reproduce las canciones de un canal específico desde el reproductor.
- **Pestaña Dedicada:** Sección "Canales" exclusiva para Admin/Editor con listado, creación y gestión de contenido.

### 4. Biblioteca Musical Inteligente
- **Almacenamiento Permanente:** Descarga automática de MP3 y subida a Supabase Storage (adiós a enlaces caducados).
- **Gestión de Covers con IA:** Integración con DALL-E 3 para generar carátulas artísticas automáticamente o bajo demanda.
- **Vistas Adaptables:** 
  - **Grid:** Responsive de 1 a 6 columnas (móvil a pantalla ultra ancha) sin prompts visibles para mayor limpieza.
  - **Lista:** Diseño optimizado con controles rápidos y botones de acción destacados.
- **Filtros Avanzados:** Por género, idioma, favoritos personales, sin cover, ordenación múltiple.
- **Paginación Optimizada:** Cargas rápidas de 60 canciones por página.
- **Acciones Rápidas:** Favorito, descarga, regenerar, añadir a canal, editar, generar cover, eliminar.

### 5. Reproductor "Studio Pro"
- **Diseño Tipo Spotify:** Interfaz oscura/clara, elegante y funcional.
- **Cola de Reproducción:** Gestión de lista, aleatorio inteligente (sin repeticiones) y repetición.
- **Visualización:** Barra de progreso interactiva, detección automática de duración real.
- **Filtros Integrados:** Por género, idioma, favoritos y búsqueda por texto en tiempo real.
- **Selector de Canales:** Dropdown para cargar y reproducir canales específicos.
- **Controles de Bloqueo:** Media Session API para controlar siguiente/anterior desde la pantalla de bloqueo del móvil.
- **Responsividad Total:** 
  - **Móvil:** Diseño vertical optimizado con controles grandes y accesibles.
  - **Desktop:** Layout de pantalla completa sin scroll innecesario.

### 6. Editor y Herramientas
- **Song Editor:** Modifica metadatos, prompts y parámetros de tus canciones generadas.
- **Regeneración:** Crea nuevas versiones basadas en canciones existentes.
- **Descargas:** Bajada directa de archivos MP3 sanitizados.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend:** Next.js API Routes (con autenticación segura y Service Role).
- **Base de Datos:** Supabase (PostgreSQL + Storage + Auth + RLS Policies).
- **IA Musical:** SunoAPI (vía API no oficial).
- **IA Visual:** OpenAI DALL-E 3.

---

## 🌓 Modo Claro/Oscuro

- **Toggle Automático:** Botón de tema en el navbar (Sol/Luna) con persistencia en localStorage.
- **Contraste Optimizado:** Todos los componentes ajustados para legibilidad perfecta en ambos modos.
- **Transiciones Suaves:** Cambio instantáneo y fluido entre temas.

---

## 📱 Experiencia PWA (Progressive Web App)

La aplicación está optimizada como PWA para móviles:
- **Instalación Nativa:** Añade a pantalla de inicio desde Safari/Chrome.
- **Fullscreen:** Sin barras de navegación del navegador, experiencia 100% app.
- **Sin Scroll Lateral:** Prevención de swipe lateral y bounce nativo de iOS.
- **Controles de Bloqueo:** Media Session API para controlar reproducción desde pantalla bloqueada, auriculares Bluetooth y widgets del sistema.
- **Iconos Adaptativos:** SVG escalable para todas las resoluciones.

---

## 📱 Experiencia Móvil Mejorada

La aplicación ha sido meticulosamente adaptada para dispositivos móviles:
- **Navegación Táctil:** Menús y botones dimensionados para dedos, con áreas de toque grandes.
- **Listas Verticales:** Las tarjetas de canciones se transforman en diseños verticales para maximizar la legibilidad y el acceso a los botones de acción.
- **Dropdowns Adaptativos:** Popups de canales que aparecen hacia arriba para evitar ser cortados.
- **Reproductor Compacto:** Controles esenciales siempre a mano sin saturar la pantalla.
- **Admin Móvil:** Panel de gestión de usuarios adaptado a tarjetas para fácil administración desde el teléfono.

---

## 📦 Instalación y Despliegue

Consulta [INICIO-RAPIDO.md](./INICIO-RAPIDO.md) para instrucciones detalladas de instalación local y configuración de Supabase.

---

## 🔄 Últimas Actualizaciones

### v1.5.0 - Sistema de Canales y Mejoras Móviles
- ✅ **Canales (Playlists Manuales):** Gestión completa de canales con asignación manual de canciones.
- ✅ **Toggle Multi-Canal:** Añade/quita canciones de múltiples canales sin cerrar el menú.
- ✅ **Feedback Visual:** Canales asignados con fondo verde y checkmark.
- ✅ **Media Session API:** Controles de siguiente/anterior en pantalla de bloqueo (iOS/Android).
- ✅ **PWA Mejorado:** Experiencia fullscreen sin scroll lateral en móviles.

### v1.4.0 - Modo Claro/Oscuro
- ✅ **Tema Dual:** Toggle claro/oscuro con persistencia.
- ✅ **Contraste Optimizado:** Ajustes en todos los componentes para ambos modos.

### v1.3.0 - RBAC y Admin Panel
- ✅ **Rebranding:** Cambio de nombre a "Narciso Music Generator".
- ✅ **Gestión Admin:** Nuevo panel `/admin/users` con capacidad de crear usuarios y asignar roles.
- ✅ **Seguridad:** Políticas RLS robustas y autenticación por token en API.
- ✅ **UX Favoritos:** Migración a tabla relacional para favoritos independientes por usuario.
- ✅ **Mejora UI:** Limpieza de tarjetas en biblioteca y optimización de estados vacíos en el reproductor.
