# 🎵 Narciso Music Generator

> **Sistema Profesional de Generación Musical con IA**  
> Integra SunoAPI, Next.js, Supabase y DALL-E 3 para crear, gestionar y reproducir música generada por inteligencia artificial con gestión multi-usuario.

![Narciso Music Generator](https://via.placeholder.com/1200x600/09090b/3b82f6?text=Narciso+Music+Generator)

## 🚀 Características Principales

### 1. Generación Musical Avanzada (Suno v3.5)
- **Control Total:** BPM (Tempo), Energía, Modo Instrumental.
- **Prompt Engineering:** Sistema inteligente que enriquece tus ideas (ej: "Un rock de los 80s" → "Anthem Rock, 80s style, electric guitars...").
- **Soporte Multilingüe:** Detección y selección automática del idioma para las letras.
- **Feedback en Tiempo Real:** Modal de logs que muestra paso a paso el proceso de generación.

### 2. Gestión de Usuarios y Roles (RBAC)
- **Sistema de Roles:** 
  - **Admin:** Control total, gestión de usuarios y acceso a todo.
  - **Editor:** Acceso a generador y biblioteca.
  - **Subscriber:** Acceso exclusivo al reproductor.
- **Panel de Administración:** Interfaz para listar, crear, eliminar y cambiar roles de usuarios.
- **Favoritos Personales:** Cada usuario gestiona su propia lista de "Me gusta" independiente.

### 3. Biblioteca Musical Inteligente
- **Almacenamiento Permanente:** Descarga automática de MP3 y subida a Supabase Storage (adiós a enlaces caducados).
- **Gestión de Covers con IA:** Integración con DALL-E 3 para generar carátulas artísticas automáticamente o bajo demanda.
- **Vistas Adaptables:** 
  - **Grid:** Responsive de 1 a 6 columnas (móvil a pantalla ultra ancha) sin prompts visibles para mayor limpieza.
  - **Lista:** Diseño optimizado con controles rápidos.
- **Filtros Avanzados:** Por género, favoritos personales, sin cover, ordenación múltiple.
- **Paginación Optimizada:** Cargas rápidas de 60 canciones por página.

### 4. Reproductor "Studio Pro"
- **Diseño Tipo Spotify:** Interfaz oscura, elegante y funcional.
- **Cola de Reproducción:** Gestión de lista, aleatorio inteligente (sin repeticiones) y repetición.
- **Visualización:** Barra de progreso interactiva, detección automática de duración real.
- **Filtro de Favoritos:** Botón dedicado para escuchar solo tus canciones preferidas.
- **Responsividad Total:** 
  - **Móvil:** Diseño vertical optimizado con controles grandes y accesibles.
  - **Desktop:** Layout de pantalla completa sin scroll innecesario.

### 5. Editor y Herramientas
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

## 📱 Experiencia Móvil Mejorada

La aplicación ha sido meticulosamente adaptada para dispositivos móviles:
- **Navegación Táctil:** Menús y botones dimensionados para dedos.
- **Listas Verticales:** Las tarjetas de canciones se transforman en diseños verticales para maximizar la legibilidad y el acceso a los botones de acción.
- **Reproductor Compacto:** Controles esenciales siempre a mano sin saturar la pantalla.
- **Admin Móvil:** Panel de gestión de usuarios adaptado a tarjetas para fácil administración desde el teléfono.

---

## 📦 Instalación y Despliegue

Consulta [INICIO-RAPIDO.md](./INICIO-RAPIDO.md) para instrucciones detalladas de instalación local y configuración de Supabase.

---

## 🔄 Última Actualización
- **Rebranding:** Cambio de nombre a "Narciso Music Generator".
- **Gestión Admin:** Nuevo panel `/admin/users` con capacidad de crear usuarios y asignar roles.
- **Seguridad:** Políticas RLS robustas y autenticación por token en API.
- **UX Favoritos:** Migración a tabla relacional para favoritos independientes por usuario.
- **Mejora UI:** Limpieza de tarjetas en biblioteca y optimización de estados vacíos en el reproductor.
