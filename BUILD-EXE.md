# 🚀 BUILD DEL .EXE - Guía Definitiva

## ✅ ANTES DE EMPEZAR - Checklist

```bash
# 1. Verificar Node.js instalado
node --version
# Debe ser 18+

# 2. Verificar archivos clave existen
ls electron/main.js
ls electron/preload.js
ls package.json
ls next.config.js

# 3. (IMPORTANTE) Crear icono
# Ver: electron/ICONOS.md
# Debe existir: electron/icon.ico
```

---

## 📦 PASO 1: Instalar Dependencias

```bash
cd "MUSIC CREATOR"
npm install
```

⏱️ Tiempo: 2-3 minutos
✅ Espera a ver: "added XXX packages"

---

## 🎨 PASO 2: Crear Icono (OBLIGATORIO)

### **Opción Rápida:**
```
1. Descarga un PNG de música: https://icon-icons.com/
2. Convierte a .ico: https://icoconvert.com/
3. Guarda como: electron/icon.ico
```

### **Opción Profesional:**
Ver guía completa en: `electron/ICONOS.md`

⚠️ **SIN ICONO** → El .exe tendrá icono genérico de Electron

---

## 🔨 PASO 3: Build del .exe

### **Comando:**
```bash
npm run electron:build:win
```

### **¿Qué hace?**
```
1. Build de Next.js → export estático (carpeta /out)
2. Electron Builder empaqueta todo
3. Crea instalador NSIS en /dist
```

### **Duración:**
- ⏱️ Primera vez: 5-10 minutos
- ⏱️ Siguientes: 2-5 minutos

### **Output Esperado:**
```
✔ Building...
✔ Packaging...
✔ Creating NSIS installer...
✓ Built successfully!

dist/
├── Suno Music Generator-Setup-1.0.0.exe  ← INSTALADOR (120-150 MB)
└── win-unpacked/                          ← App desempaquetada
```

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### ❌ Error: "electron: command not found"
```bash
# Solución:
rm -rf node_modules package-lock.json
npm install
```

### ❌ Error: "Cannot find module 'electron'"
```bash
# Solución:
npm install electron --save-dev
```

### ❌ Error: "icon.ico not found"
```
Solución:
1. Crea electron/icon.ico
2. Ver: electron/ICONOS.md
3. Build de nuevo
```

### ❌ Error: "Application entry file does not exist"
```bash
# Solución:
# Verifica next.config.js tenga: output: 'export'
# Y que electron/main.js exista
```

### ❌ Error: "ENOENT: no such file or directory 'out'"
```bash
# Solución:
npm run build:export
# Luego:
npm run electron:build:win
```

---

## ✅ PASO 4: Probar el Instalador

### **Localizar el .exe:**
```
dist/Suno Music Generator-Setup-1.0.0.exe
```

### **Instalar:**
1. Doble clic en el .exe
2. Aceptar advertencia de Windows (normal para apps no firmadas)
3. Elegir carpeta de instalación (default: C:\Program Files\)
4. Marcar "Crear acceso directo en escritorio"
5. Instalar

### **Primera ejecución:**
1. Doble clic en icono del escritorio
2. Si pide permisos → Aceptar
3. Debe abrir ventana de login
4. Login con: narciso.pardo@outlook.com

---

## ⚠️ IMPORTANTE: Variables de Entorno

### **Problema:**
El .exe NO incluye `.env.local` por seguridad.

### **Soluciones:**

#### **Opción A: Hardcodear Keys (Solo Uso Interno)**
Edita `lib/supabase.ts`:
```typescript
export const supabase = createClient(
  'https://tu-proyecto.supabase.co',  // ← Hardcoded
  'tu_anon_key'                        // ← Hardcoded
);
```

**Pros:** Funciona directamente en .exe
**Contras:** Keys expuestas en código

#### **Opción B: .env.local en Instalación**
Usuario crea `.env.local` en:
```
C:\Program Files\Suno Music Generator\.env.local
```

**Pros:** Seguro
**Contras:** Usuario debe configurar

#### **Opción C: Config en Primera Ejecución**
App pide keys la primera vez que se abre.

**Pros:** User-friendly
**Contras:** Requiere más código

### **Recomendación para Uso Interno:**
Usa **Opción A** (hardcodear) si:
- ✅ Solo tú y tu cliente usan la app
- ✅ El .exe no se distribuye públicamente
- ✅ Quieres que funcione "out of the box"

---

## 📤 PASO 5: Distribuir el .exe

### **Opción A: Email/WeTransfer**
```
1. Comprime el .exe en .zip (opcional)
2. Envía a usuarios autorizados
3. Usuarios descargan e instalan
```

### **Opción B: GitHub Releases**
```
1. Sube a tu repo (privado)
2. Crea release: v1.0.0
3. Adjunta el .exe
4. Usuarios descargan desde GitHub
```

### **Opción C: SharePoint/Drive Interno**
```
1. Sube a carpeta compartida
2. Comparte link interno
3. Usuarios descargan desde ahí
```

---

## 🔄 ACTUALIZAR LA APP

### **Modificar Código:**
```bash
# 1. Haz cambios en tu código
# 2. Actualiza versión en package.json:
"version": "1.0.1"

# 3. Build de nuevo:
npm run electron:build:win

# 4. Distribuye nuevo .exe
```

### **Usuarios Actualizan:**
```
1. Desinstalan versión vieja
2. Instalan versión nueva
3. O simplemente instalan encima (sobrescribe)
```

---

## 🎯 VERIFICAR TODO FUNCIONA

### **Checklist Post-Instalación:**
- [ ] App se abre sin errores
- [ ] Aparece pantalla de login
- [ ] Login funciona con credenciales
- [ ] Se pueden generar canciones
- [ ] Se guardan en Supabase
- [ ] Editor funciona
- [ ] Descarga MP3 funciona
- [ ] Panel admin accesible (si eres admin)

---

## 📊 Tamaños Típicos

```
Instalador .exe:     120-150 MB
App instalada:       ~200-250 MB
(Incluye Chromium + Node.js + tu app)
```

**¿Por qué tan grande?**
- Chromium completo (~70 MB)
- Node.js runtime (~30 MB)
- Tu aplicación Next.js (~20 MB)
- Dependencias npm (~50 MB)

---

## 🔥 COMANDOS RÁPIDOS

```bash
# Build rápido (solo Windows)
npm run electron:build:win

# Build todas las plataformas
npm run electron:build

# Solo macOS
npm run electron:build:mac

# Solo Linux
npm run electron:build:linux

# Limpiar y rebuild
rm -rf dist out node_modules
npm install
npm run electron:build:win
```

---

## 💡 TIPS PRO

### **Reducir Tamaño:**
```javascript
// En electron/main.js:
// Deshabilita DevTools en producción
if (!isDev) {
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });
}
```

### **Firma Digital (Opcional):**
```
1. Compra certificado code-signing (~$100/año)
2. Configura en package.json:
"win": {
  "certificateFile": "cert.pfx",
  "certificatePassword": "password"
}
```

### **Auto-Updater (Futuro):**
```javascript
// electron/main.js
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

---

## 🎉 ¡LISTO!

Tu .exe está completo y listo para distribución interna.

### **Siguiente Nivel:**
1. ✅ Firma digital para evitar warnings
2. ✅ Auto-updater para actualizaciones automáticas
3. ✅ Crash reporting con Sentry
4. ✅ Analytics de uso

---

**¿Problemas?** Revisa sección "Errores Comunes" arriba.
**¿Funciona?** ¡Felicidades! 🎊 Tienes app nativa de escritorio.

---

_Build creado con Electron Builder_ ⚡
