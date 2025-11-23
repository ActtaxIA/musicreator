# 🔑 Guía Completa: Cómo Configurar SunoAPI.org

## 📖 Tabla de Contenidos
1. [¿Qué es SunoAPI.org?](#qué-es-sunoapiorg)
2. [Registro y Configuración](#registro-y-configuración)
3. [Obtener tu API Key](#obtener-tu-api-key)
4. [Añadir Créditos](#añadir-créditos)
5. [Configurar en tu App](#configurar-en-tu-app)
6. [Precios y Planes](#precios-y-planes)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 ¿Qué es SunoAPI.org?

SunoAPI.org es un **servicio de terceros NO oficial** que proporciona acceso a la tecnología de Suno AI mediante una API REST. 

### ✅ Ventajas

- **Sin suscripción de Suno**: No necesitas pagar $24/mes a Suno directamente
- **Más económico**: ~$0.01-0.04 por generación vs suscripción mensual
- **Pago por uso**: Solo pagas lo que usas
- **Sin marcas de agua**: Música limpia y lista para usar
- **Múltiples modelos**: Acceso a v3.5, v4, v4.5 y v5
- **API REST simple**: Fácil de integrar

### ⚠️ Consideraciones

- Es un servicio de terceros (no oficial de Suno)
- Requiere añadir créditos manualmente
- Puede tener límites de tasa (rate limits)

---

## 📝 Registro y Configuración

### Paso 1: Acceder al sitio web

1. Abre tu navegador
2. Ve a: **https://docs.sunoapi.org/**
3. Verás la página principal de documentación

### Paso 2: Crear cuenta

1. Busca el botón **"Sign Up"** o **"Get Started"** (arriba a la derecha)
2. Haz clic para registrarte
3. Completa el formulario:
   - Email
   - Contraseña
   - Nombre (opcional)
4. Acepta los términos de servicio
5. Haz clic en **"Create Account"**

### Paso 3: Verificar email

1. Revisa tu bandeja de entrada
2. Busca el email de verificación de SunoAPI
3. Haz clic en el enlace de verificación
4. Tu cuenta estará activada

---

## 🔐 Obtener tu API Key

### Paso 1: Acceder al Dashboard

1. Inicia sesión en https://docs.sunoapi.org/
2. Busca y haz clic en **"Dashboard"** o **"Console"** en el menú
3. Te llevará a tu panel de control

### Paso 2: Navegar a API Keys

En el dashboard:
1. Busca en el menú lateral: **"API Keys"** o **"Credentials"**
2. Haz clic para abrir la sección de claves

### Paso 3: Generar tu API Key

1. Haz clic en el botón **"Create API Key"** o **"Generate New Key"**
2. (Opcional) Dale un nombre descriptivo: "Music Generator App"
3. Haz clic en **"Generate"** o **"Create"**

### Paso 4: Copiar tu API Key

⚠️ **MUY IMPORTANTE**:

1. La API Key aparecerá en pantalla: `sk-xxxxxxxxxxxxxxxxxxxxx`
2. **CÓPIALA INMEDIATAMENTE** - Solo se muestra una vez
3. Guárdala en un lugar seguro (bloc de notas, gestor de contraseñas)
4. Si la pierdes, tendrás que generar una nueva

**Ejemplo de API Key**:
```
sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

## 💳 Añadir Créditos

### ¿Cuántos créditos necesito?

- **1 generación** = ~0.01-0.04 USD = 1-4 créditos
- Cada generación produce **2 variantes** de la canción
- **Para empezar**: $10 USD = ~250-1000 generaciones

### Paso 1: Ir a Billing

1. En el dashboard, busca **"Billing"**, **"Credits"** o **"Payment"**
2. Haz clic para acceder

### Paso 2: Añadir fondos

1. Haz clic en **"Add Credits"** o **"Top Up"**
2. Selecciona o ingresa la cantidad (Ej: $10, $20, $50)
3. Elige método de pago:
   - 💳 Tarjeta de crédito/débito
   - 💰 PayPal
   - 🪙 Criptomonedas (si está disponible)

### Paso 3: Confirmar pago

1. Completa los datos de pago
2. Revisa el monto
3. Haz clic en **"Pay"** o **"Confirm"**
4. Espera la confirmación

### Paso 4: Verificar saldo

- Regresa al dashboard
- Deberías ver tu nuevo saldo de créditos
- Ej: "Balance: 1000 credits" o "$10.00"

---

## ⚙️ Configurar en tu App

### Paso 1: Crear archivo .env.local

En la carpeta de tu proyecto:

1. Duplica el archivo `.env.example`
2. Renómbralo a `.env.local`

**Windows** (Explorador de archivos):
- Renombrar `.env.example` → `.env.local`

**Windows** (Línea de comandos):
```bash
copy .env.example .env.local
```

### Paso 2: Añadir tu API Key

Abre `.env.local` con un editor de texto (Notepad++, VS Code, etc.)

Reemplaza `tu_api_key_aqui` con tu API Key real:

```env
SUNO_API_KEY=sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SUNO_API_BASE_URL=https://api.sunoapi.org
```

**Guarda el archivo** (Ctrl+S)

### Paso 3: Instalar dependencias

Abre una terminal en la carpeta del proyecto:

```bash
npm install
```

### Paso 4: Iniciar la aplicación

```bash
npm run dev
```

### Paso 5: Probar

1. Abre: http://localhost:3000
2. Selecciona un género
3. Haz clic en "Generar Música"
4. ¡Espera tu canción!

---

## 💰 Precios y Planes

### Modelo de Precios (Aproximado)

| Acción | Costo | Notas |
|--------|-------|-------|
| Generar canción | $0.01-0.04 | 2 variantes incluidas |
| Extender audio | ~$0.02 | Alargar canción existente |
| Generar letras | ~$0.005 | Solo letras |
| Separar stems | ~$0.03 | Vocal + instrumental |

### Paquetes Comunes

1. **Starter**: $10 → ~250-1000 generaciones
2. **Medium**: $25 → ~625-2500 generaciones
3. **Pro**: $50 → ~1250-5000 generaciones

### Comparación vs Suscripción Oficial

| Plan | Precio | Generaciones | Costo/Gen |
|------|--------|--------------|-----------|
| **Suno Pro** | $24/mes | ~500/mes | $0.048 |
| **SunoAPI** | $20 créditos | ~500-2000 | $0.01-0.04 |

💡 **Conclusión**: SunoAPI.org es más económico si no generas constantemente.

---

## 🛠️ Solución de Problemas

### ❌ "API Key no configurada"

**Problema**: El archivo `.env.local` no existe o está mal configurado.

**Solución**:
1. Verifica que el archivo se llama `.env.local` (NO `.env.example`)
2. Abre el archivo y confirma que tiene:
   ```env
   SUNO_API_KEY=tu_key_real_aqui
   ```
3. Reinicia el servidor: `Ctrl+C` luego `npm run dev`

### ❌ "Invalid API Key" o "Unauthorized"

**Problema**: La API Key es incorrecta o ha expirado.

**Solución**:
1. Ve al dashboard de SunoAPI.org
2. Verifica que la API Key es correcta
3. Si es necesario, genera una nueva API Key
4. Actualiza `.env.local` con la nueva key
5. Reinicia el servidor

### ❌ "Insufficient credits"

**Problema**: Te quedaste sin créditos.

**Solución**:
1. Ve a Billing en el dashboard
2. Añade más créditos
3. Espera unos minutos para que se actualice
4. Intenta generar música de nuevo

### ❌ "Rate limit exceeded"

**Problema**: Demasiadas solicitudes en poco tiempo.

**Solución**:
1. Espera 1-5 minutos
2. Reduce la frecuencia de generaciones
3. Si el problema persiste, contacta soporte de SunoAPI

### ❌ La música no se genera (stuck)

**Problema**: El proceso se quedó atascado.

**Solución**:
1. Espera 2-3 minutos (a veces tarda)
2. Refresca la página (F5)
3. Revisa la consola del navegador (F12) por errores
4. Verifica que el servidor de desarrollo está corriendo

### ❌ "Network Error" o "Cannot connect"

**Problema**: No hay conexión con la API.

**Solución**:
1. Verifica tu conexión a internet
2. Comprueba que `SUNO_API_BASE_URL` es correcto
3. Intenta acceder a https://api.sunoapi.org en el navegador
4. Si el sitio está caído, espera un tiempo

---

## 📊 Monitoreo de Uso

### Ver estadísticas

En el dashboard de SunoAPI.org:

1. **Usage** o **Analytics**: Ve cuántas generaciones has hecho
2. **Billing History**: Revisa tus pagos y saldo
3. **API Logs**: (Si disponible) Mira los logs de tus llamadas

### Límites

- **Rate Limit**: ~10-20 requests/minuto (varía por plan)
- **Daily Limit**: Depende de tu saldo de créditos
- **Concurrent**: ~2-5 generaciones simultáneas

---

## 🎓 Mejores Prácticas

### ✅ Seguridad

- 🔒 **NUNCA** compartas tu API Key públicamente
- 🔒 **NUNCA** subas `.env.local` a GitHub
- 🔒 Usa variables de entorno en producción (Vercel, Netlify)
- 🔒 Regenera tu key si sospechas que fue comprometida

### ✅ Optimización de Costos

- 📉 Usa prompts claros para evitar regeneraciones
- 📉 Prueba con el plan gratuito primero
- 📉 Monitorea tu uso regularmente
- 📉 Implementa caché si es posible

### ✅ Calidad

- 🎵 Usa modelos más nuevos (v4.5, v5) para mejor calidad
- 🎵 Sé específico en los prompts
- 🎵 Prueba diferentes variaciones de prompts

---

## 📞 Recursos y Soporte

### Documentación Oficial

- **SunoAPI Docs**: https://docs.sunoapi.org/
- **API Reference**: https://docs.sunoapi.org/api-reference
- **Ejemplos de código**: https://docs.sunoapi.org/examples

### Contacto

- **Email soporte**: support@sunoapi.org (verifica en su sitio)
- **Discord/Slack**: (si tienen comunidad)
- **GitHub Issues**: (si tienen repo público)

### Alternativas

Si SunoAPI.org no funciona, prueba:
1. **AI/ML API**: https://aimlapi.com/suno-ai-api
2. **API.box**: https://api.box/
3. **GitHub suno-api**: https://github.com/gcui-art/suno-api (auto-hospedado)

---

## ✨ Resumen Rápido

### 5 Pasos para Empezar

1. ✅ Regístrate en https://docs.sunoapi.org/
2. ✅ Genera tu API Key en el dashboard
3. ✅ Añade $10 de créditos
4. ✅ Copia la key a `.env.local`
5. ✅ Ejecuta `npm run dev` y genera música

### Costos Estimados

- 🎵 **1 canción** = ~$0.01-0.04 USD
- 🎵 **100 canciones** = ~$1-4 USD
- 🎵 **1000 canciones** = ~$10-40 USD

---

**¡Ya estás listo para generar música con IA! 🎵✨**

¿Tienes dudas? Revisa el README.md principal o la documentación oficial.
