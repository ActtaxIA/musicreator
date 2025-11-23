# 🎨 Guía de Interfaz y Experiencia de Usuario (UX) - Narciso

## 📱 Filosofía de Diseño "Mobile-First & Studio-Desktop"

Narciso Music Generator utiliza un enfoque híbrido para satisfacer dos necesidades muy diferentes: la gestión rápida en móvil y la productividad en escritorio.

### 1. Adaptación Móvil (Responsive)
- **Navegación Vertical:** Los menús de pestañas se apilan verticalmente para facilitar el acceso con el pulgar.
- **Tarjetas de Canción (List View):**
  - **Diseño:** Bloque vertical limpio.
  - **Superior:** Portada + Título + Estado (Play/Pause).
  - **Inferior:** Fila dedicada de botones de acción.
- **Panel de Admin:**
  - Transición automática de Tabla (Desktop) a Tarjetas (Móvil).
  - Acciones críticas (Borrar, Cambiar Rol) grandes y accesibles.

### 2. Experiencia Desktop (Pantalla Grande)
- **Grid Dinámico:**
  - **XL/2XL:** Hasta 6 columnas para aprovechar monitores anchos.
  - **Limpieza:** Se ha eliminado el prompt de texto de las tarjetas grid para una apariencia más visual tipo galería de arte.
- **Reproductor "Studio Pro":**
  - Altura fija calculada para evitar scroll en la página principal.
  - Lista de reproducción con scroll interno independiente.
  - Columnas de datos expandidas (BPM, Idioma, Mood) y ordenables.

### 3. Componentes Clave

#### 🎵 El Reproductor (MusicPlayer)
- **Estado Vacío Inteligente:** Si buscas algo y no hay resultados, el reproductor no desaparece, solo se vacía la lista, manteniendo la interfaz estable.
- **Smart Shuffle:** Algoritmo que no repite canciones hasta terminar la cola.
- **Filtro de Favoritos:** Botón corazón dedicado para filtrar la cola instantáneamente.

#### 📚 La Biblioteca (SongLibrary)
- **Vista Grid Limpia:** Sin texto de prompt, foco total en el artwork y título.
- **Acciones Rápidas:** Menú contextual (...) y botones de acción directa en hover.
- **Generación de Covers:** Botón "Mágico" que detecta canciones sin portada.

#### 🛡️ Panel de Administración
- **Vista Híbrida:** Tabla densa en escritorio para gestión masiva vs. Tarjetas detalladas en móvil para gestión unitaria.
- **Feedback Visual:** Indicadores de carga y modales de creación claros.

### 4. Paleta de Colores
- **Fondo:** `bg-black` / `bg-zinc-950` (Profundidad).
- **Acentos:** 
  - Primario: `Cyan-400` (Tecnológico, Energía).
  - Secundario: `Purple-600` a `Pink-600` (Creatividad, Gradientes).
- **Texto:** `Zinc-200` (Lectura cómoda) y `Zinc-500` (Metadatos).

---

## 🛠️ Ajustes Recientes de CSS
- **Scrollbars:** Personalizadas (finas y oscuras) en `globals.css`.
- **Animaciones:** Efecto de ecualizador (`animate-music-bar`) en CSS puro.
- **Layout:** Uso intensivo de `hidden md:block` y `block md:hidden` para cambiar radicalmente la estructura entre dispositivos.
