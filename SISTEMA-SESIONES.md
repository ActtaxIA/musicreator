# 🔐 Sistema de Gestión de Sesiones

## Visión General

El **Sistema de Gestión de Sesiones** de Narciso Music Generator proporciona control completo sobre las sesiones de usuario por dispositivo, con límites automáticos basados en roles para prevenir accesos no autorizados y sesiones compartidas.

---

## 🎯 Características Principales

### 1. Límites por Rol

| Rol | Sesiones Simultáneas | Comportamiento |
|-----|---------------------|----------------|
| **Admin** | 3 dispositivos | Puede trabajar en PC, móvil y tablet simultáneamente |
| **Editor** | 1 dispositivo | Al iniciar sesión en otro dispositivo, se cierra la anterior automáticamente |
| **Subscriber** | 1 dispositivo | Al iniciar sesión en otro dispositivo, se cierra la anterior automáticamente |

### 2. Registro Automático de Metadata

Cada sesión registra:
- 🌐 **IP del dispositivo** (pública, no privada)
- 💻 **Navegador** (Chrome, Safari, Firefox, Edge, Opera)
- 📱 **Sistema Operativo** (Windows, macOS, iOS, Android, Linux)
- 📲 **Tipo de Dispositivo** (Desktop, Mobile, Tablet)
- ⏰ **Última actividad** (timestamp actualizado en cada interacción)
- 🔑 **Token de sesión** (JWT de Supabase Auth)

### 3. UI de Gestión de Sesiones

Accesible desde el **botón de laptop (💻)** en el header:
- Ver todos los dispositivos activos
- Información detallada de cada sesión
- Cerrar sesiones específicas
- Cerrar todas las demás sesiones (excepto la actual)
- Alerta visual para usuarios con límite de 1 sesión

---

## 🛠️ Arquitectura Técnica

### Base de Datos

#### Tabla `user_sessions`

```sql
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### Trigger Automático

```sql
CREATE TRIGGER enforce_session_limit_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_session_limit();
```

**Lógica del Trigger:**
1. Obtiene el rol del usuario desde `user_roles`
2. Determina el límite de sesiones (Admin: 3, otros: 1)
3. Cuenta sesiones activas del usuario
4. Si excede el límite, cierra las sesiones más antiguas automáticamente

### Seguridad (RLS)

Políticas de Row Level Security:
```sql
-- Solo puedes ver tus propias sesiones
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Solo puedes insertar tus propias sesiones
CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo puedes actualizar tus propias sesiones
CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Solo puedes eliminar tus propias sesiones
CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 📋 Flujo de Usuario

### Escenario 1: Editor en PC

1. ✅ Hace login en PC → Se registra sesión
2. ✅ Trabaja normalmente
3. 📱 Intenta iniciar en móvil → Se registra nueva sesión
4. 🔒 **Trigger detecta 2 sesiones** (límite es 1)
5. ❌ **Cierra automáticamente la sesión del PC**
6. ✅ Solo queda activa la sesión del móvil

### Escenario 2: Admin en Múltiples Dispositivos

1. 💻 Login en PC → Sesión 1
2. 📱 Login en móvil → Sesión 2
3. 📲 Login en tablet → Sesión 3
4. ✅ **Todas permanecen activas** (límite es 3)
5. 🖥️ Login en otro PC → Sesión 4
6. 🔒 **Cierra automáticamente la sesión más antigua**
7. ✅ Solo quedan 3 sesiones activas

### Escenario 3: Cerrar Otras Sesiones

1. Usuario abre la pestaña "Sesiones" (💻)
2. Ve 2 dispositivos activos:
   - 💻 PC (Esta sesión)
   - 📱 Móvil (Última actividad: Hace 2 horas)
3. Click en **"Cerrar otras sesiones"**
4. ✅ Se cierra la sesión del móvil
5. ✅ Solo permanece activa la sesión del PC

---

## 🔧 Implementación

### 1. Instalación

Ejecuta el script SQL en Supabase:

```bash
# En Supabase SQL Editor
scripts/create-sessions-table.sql
```

O para actualizar una instalación existente:

```bash
scripts/update-sessions-table.sql
```

### 2. Componentes

#### `lib/sessionManager.ts`

Helper con funciones para:
- `registerSession(userId, userRole)` - Registra nueva sesión
- `getUserActiveSessions(userId)` - Obtiene sesiones activas
- `closeSession(sessionId)` - Cierra sesión específica
- `closeOtherSessions(userId)` - Cierra todas excepto la actual
- `closeAllSessions(userId)` - Logout global
- `getDeviceInfo()` - Detecta navegador, OS, dispositivo
- `getClientIP()` - Obtiene IP pública

#### `components/ActiveSessions.tsx`

UI para gestionar sesiones:
- Lista de dispositivos activos
- Información detallada de cada sesión
- Botones de acción (cerrar sesión, cerrar otras)
- Alerta de límite para Editor/Subscriber

### 3. Integración en Login

```typescript
// app/auth/login/page.tsx
import { registerSession } from '@/lib/sessionManager';

// Después del login exitoso
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', data.user.id)
  .single();

const userRole = roleData?.role || 'subscriber';

await registerSession(data.user.id, userRole);
```

### 4. Integración en Logout

```typescript
// app/page.tsx
const handleLogout = async () => {
  try {
    // Cerrar sesión globalmente
    await supabase.auth.signOut({ scope: 'global' });
    
    // Marcar sesiones como inactivas
    if (user) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);
    }
    
    router.push('/auth/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};
```

---

## 🎨 UI de Sesiones Activas

### Diseño

```
┌──────────────────────────────────────────┐
│  Sesiones Activas                        │
│  1 de 1 dispositivo permitido            │
│                                    [Cerrar otras] │
├──────────────────────────────────────────┤
│  ⚠️ Límite de sesión única               │
│  Solo puedes tener un dispositivo activo │
│  a la vez. Si inicias en otro, esta     │
│  sesión se cerrará automáticamente.      │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ │
│  │ 💻 Chrome          [Esta sesión]   │ │
│  │ Windows • Desktop                  │ │
│  │ IP: 192.168.1.10                  │ │
│  │ Última actividad: Ahora mismo     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 📱 Safari                      [X] │ │
│  │ iOS • Mobile                       │ │
│  │ IP: 192.168.1.20                  │ │
│  │ Última actividad: Hace 2 horas    │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Iconos por Tipo de Dispositivo

- 💻 **Desktop**: Monitor
- 📱 **Mobile**: Smartphone
- 📲 **Tablet**: Tablet

### Estados Visuales

- **Esta sesión**: Badge azul, no se puede cerrar
- **Otras sesiones**: Botón X para cerrar individual
- **Sesiones inactivas**: No se muestran (is_active = false)

---

## 🔒 Seguridad

### ✅ Implementado

1. **Row Level Security (RLS)**: Solo ves tus propias sesiones
2. **Tokens seguros**: JWT de Supabase Auth, no expuestos en cliente
3. **IP pública**: No se registra IP privada (solo vía API externa)
4. **Metadata no sensible**: Solo info del navegador/OS/dispositivo
5. **Expiración automática**: Sesiones caducan a los 7 días
6. **Cleanup automático**: Función para limpiar sesiones expiradas
7. **Logout global**: Invalida tokens en Supabase Auth

### 🚫 No Implementado (No Necesario)

- **Geolocalización**: No se guarda ubicación precisa
- **Fingerprinting**: No se hace tracking del dispositivo
- **Historial de sesiones**: Solo sesiones activas, no historial completo

---

## 📊 Monitoreo y Mantenimiento

### Cleanup Manual de Sesiones Expiradas

```sql
-- Ejecutar periódicamente en Supabase SQL Editor
SELECT public.cleanup_expired_sessions();
```

Esta función elimina:
- Sesiones con `expires_at < NOW()`
- Sesiones con `last_activity` > 30 días

### Consultas Útiles

**Ver todas las sesiones activas:**
```sql
SELECT 
  u.email,
  ur.role,
  us.device_info->>'browser' as browser,
  us.device_info->>'os' as os,
  us.ip_address,
  us.last_activity,
  us.created_at
FROM user_sessions us
JOIN auth.users u ON us.user_id = u.id
JOIN user_roles ur ON us.user_id = ur.user_id
WHERE us.is_active = true
ORDER BY us.last_activity DESC;
```

**Contar sesiones por usuario:**
```sql
SELECT 
  u.email,
  ur.role,
  COUNT(*) as active_sessions
FROM user_sessions us
JOIN auth.users u ON us.user_id = u.id
JOIN user_roles ur ON us.user_id = ur.user_id
WHERE us.is_active = true
GROUP BY u.email, ur.role
ORDER BY active_sessions DESC;
```

**Detectar usuarios con exceso de sesiones:**
```sql
SELECT 
  u.email,
  ur.role,
  COUNT(*) as active_sessions,
  CASE 
    WHEN ur.role = 'admin' THEN 3
    ELSE 1
  END as max_allowed
FROM user_sessions us
JOIN auth.users u ON us.user_id = u.id
JOIN user_roles ur ON us.user_id = ur.user_id
WHERE us.is_active = true
GROUP BY u.email, ur.role
HAVING COUNT(*) > CASE WHEN ur.role = 'admin' THEN 3 ELSE 1 END;
```

---

## 🐛 Solución de Problemas

### Problema: Usuario bloqueado (sin sesiones activas)

**Solución:**
```sql
-- Cerrar todas las sesiones del usuario
UPDATE user_sessions 
SET is_active = false 
WHERE user_id = '<user_id>';

-- El usuario puede volver a hacer login
```

### Problema: Sesiones no se cierran automáticamente

**Verificar:**
1. Trigger está creado y activo
2. Función `enforce_session_limit()` existe
3. Rol del usuario está correctamente en `user_roles`

```sql
-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'enforce_session_limit_trigger';

-- Verificar función
SELECT * FROM pg_proc WHERE proname = 'enforce_session_limit';

-- Verificar rol del usuario
SELECT * FROM user_roles WHERE user_id = '<user_id>';
```

### Problema: IP siempre NULL

**Causa:** API externa de IP puede estar bloqueada.

**Solución:** La IP es opcional y no afecta funcionalidad. Si necesitas IP precisa, considera usar un API route en Next.js que lea `x-forwarded-for` del request.

---

## 📈 Mejoras Futuras (Roadmap)

- [ ] **Notificaciones Push**: Alertar al usuario cuando se detecta nuevo login
- [ ] **Historial de Sesiones**: Ver sesiones pasadas (últimas 30 días)
- [ ] **Bloqueo de IPs**: Permitir al admin bloquear IPs sospechosas
- [ ] **2FA (Two-Factor Auth)**: Autenticación de dos factores opcional
- [ ] **Sesiones de API**: Tracking de llamadas a API por sesión
- [ ] **Dashboard de Actividad**: Gráficos de uso por dispositivo/horario

---

## 📚 Referencias

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [JWT Tokens](https://jwt.io/)

---

**© 2025 Narciso Music Generator - Sistema Interno**

