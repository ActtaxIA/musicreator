# 🎨 Guía de Interfaz y Experiencia de Usuario (UX) - Narciso

## 📱 Filosofía de Diseño "Mobile-First & Studio-Desktop"

Narciso Music Generator utiliza un enfoque híbrido para satisfacer dos necesidades muy diferentes: la gestión rápida en móvil y la productividad en escritorio.

### 1. Adaptación Móvil (Responsive)
- **Navegación Vertical:** Los menús de pestañas se apilan verticalmente para facilitar el acceso con el pulgar.
- **Tarjetas de Canción (List View):**
  - **Diseño:** Bloque vertical limpio con botones de acción destacados.
  - **Superior:** Portada + Título + Género/Duración.
  - **Inferior:** Fila dedicada de botones de acción (Favorito, Descargar, Regenerar | Canal, Editar, Eliminar).
  - **Dropdowns Adaptativos:** Los menús de canales aparecen hacia arriba para evitar ser cortados por los bordes.
- **Panel de Admin:**
  - Transición automática de Tabla (Desktop) a Tarjetas (Móvil).
  - Acciones críticas (Borrar, Cambiar Rol) grandes y accesibles.
- **PWA Fullscreen:**
  - Sin barras de navegación del navegador.
  - Sin scroll lateral (prevención de swipe/bounce).
  - Experiencia 100% nativa.

### 2. Experiencia Desktop (Pantalla Grande)
- **Grid Dinámico:**
  - **XL/2XL:** Hasta 6 columnas para aprovechar monitores anchos.
  - **Limpieza:** Prompt de texto oculto en las tarjetas grid para una apariencia más visual tipo galería de arte.
  - **Botones Directos:** Play/Pause grande + acciones secundarias (Favorito, Descargar, Regenerar) + botón "Añadir a Canal" con popup inteligente.
- **Reproductor "Studio Pro":**
  - Altura fija calculada para evitar scroll en la página principal.
  - Lista de reproducción con scroll interno independiente.
  - Columnas de datos expandidas (BPM, Idioma, Mood) y ordenables.
  - Selector de canales integrado con dropdown.

### 3. Componentes Clave

#### 🎵 El Reproductor (MusicPlayer)
- **Estado Vacío Inteligente:** Si buscas algo y no hay resultados, el reproductor no desaparece, solo se vacía la lista, manteniendo la interfaz estable.
- **Smart Shuffle:** Algoritmo que no repite canciones hasta terminar la cola.
- **Filtros Múltiples:** Género, Idioma, Favoritos y búsqueda por texto en tiempo real.
- **Selector de Canales:** Dropdown para cargar y reproducir canales específicos creados por Admin/Editores.
- **Media Session API:** Controles de siguiente/anterior desde pantalla de bloqueo, auriculares Bluetooth, widgets del sistema.

#### 📚 La Biblioteca (SongLibrary)
- **Vista Grid Limpia:** Sin texto de prompt, foco total en el artwork y título.
- **Vista Lista Completa:** Botones de acción directa + dropdown de canales con feedback visual.
- **Gestión de Canales:** 
  - Botón "Añadir a Canal" con popup que muestra todos los canales disponibles.
  - **Toggle Intuitivo:** Clic añade o quita canción del canal sin cerrar el menú.
  - **Feedback Visual:** Canales asignados con fondo verde y checkmark ✓.
- **Acciones Rápidas:** Favorito, Descargar, Regenerar, Añadir a Canal, Editar, Generar Cover (condicional), Eliminar.

#### 🎛️ Gestión de Canales (ChannelManager)
- **Pestaña Dedicada:** Exclusiva para Admin y Editores.
- **Listado:** Cards con nombre, descripción, cantidad de canciones y fecha de creación.
- **Creación:** Modal simple con nombre y descripción opcional.
- **Edición de Contenido:** Vista detallada con listado de canciones y opción de quitar canciones.
- **Añadir Canciones:** Modal con búsqueda y listado completo de canciones para añadir manualmente.

#### 🛡️ Panel de Administración
- **Vista Híbrida:** Tabla densa en escritorio para gestión masiva vs. Tarjetas detalladas en móvil para gestión unitaria.
- **Creación de Usuarios:** Modal con email, contraseña y rol inicial.
- **Feedback Visual:** Indicadores de carga y mensajes de éxito/error.

### 4. Sistema de Temas (Claro/Oscuro)

#### Modo Oscuro (Por defecto)
- **Fondo:** `bg-black` / `bg-zinc-950` (Profundidad).
- **Acentos:** 
  - Primario: `Cyan-400` (Tecnológico, Energía).
  - Secundario: `Purple-600` a `Pink-600` (Creatividad, Gradientes).
- **Texto:** `Zinc-200` (Lectura cómoda) y `Zinc-500` (Metadatos).

#### Modo Claro
- **Fondo:** `bg-white` / `bg-zinc-50` (Limpieza).
- **Acentos:** Mismos colores con ajustes de contraste (`bg-blue-50`, `text-blue-600`).
- **Texto:** `text-zinc-900` (Títulos) y `text-zinc-700` (Cuerpo).
- **Contraste Optimizado:** Todos los componentes revisados para legibilidad perfecta.

#### Toggle de Tema
- **Ubicación:** Navbar superior derecho.
- **Icono:** Sol (modo claro) / Luna (modo oscuro).
- **Persistencia:** LocalStorage para mantener preferencia entre sesiones.
- **Transición:** Instantánea y fluida gracias a Tailwind CSS `dark:` utilities.

---

## 🛠️ Ajustes Recientes de CSS
- **Scrollbars:** Personalizadas (finas y oscuras/claras según tema) en `globals.css`.
- **Animaciones:** Efecto de ecualizador (`animate-music-bar`) en CSS puro.
- **Layout:** Uso intensivo de `hidden md:block` y `block md:hidden` para cambiar radicalmente la estructura entre dispositivos.
- **Variables CSS:** Sistema de variables para colores (`--bg-primary`, `--text-primary`) que cambian según el tema.
- **Prevent Lateral Scroll:** `overflow-x: hidden` y `overscroll-behavior-x: none` para experiencia móvil nativa.

---

## 🎯 Principios de Diseño

1. **Feedback Visual Inmediato:** Hovers, estados activos, checkmarks, colores distintivos.
2. **Acciones Reversibles:** Toggle en lugar de "añadir/quitar" separado.
3. **Minimizar Clics:** Acciones principales a un clic de distancia.
4. **Contexto Claro:** Siempre sabes dónde estás y qué estás haciendo (breadcrumbs visuales, estados activos).
5. **Responsive sin Compromiso:** La experiencia móvil no es una versión reducida, es una interfaz repensada para dedos y pantallas pequeñas.
