import { supabase } from './supabase';

// Información del dispositivo
export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  isMobile?: boolean;
}

export interface SessionData {
  id: string;
  user_id: string;
  device_info: DeviceInfo;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  created_at: string;
  is_active: boolean;
}

/**
 * Detecta información del dispositivo actual
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') return {};

  const ua = navigator.userAgent;
  
  // Detectar navegador
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detectar sistema operativo
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detectar tipo de dispositivo
  let device = 'Desktop';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isMobile) {
    if (ua.includes('iPad')) device = 'Tablet';
    else device = 'Mobile';
  }

  return { browser, os, device, isMobile };
}

/**
 * Obtiene la IP del cliente (aproximada, desde el cliente)
 * Nota: Para IP real del servidor, usar API route
 */
export async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error obteniendo IP:', error);
    return null;
  }
}

/**
 * Registra una nueva sesión en la base de datos
 * IMPORTANTE: El trigger de BD cerrará automáticamente sesiones antiguas según el rol:
 * - Admin: Permite hasta 3 sesiones simultáneas
 * - Editor/Subscriber: Solo 1 sesión (cierra la anterior automáticamente)
 */
export async function registerSession(userId: string, userRole?: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const deviceInfo = getDeviceInfo();
    const ipAddress = await getClientIP();
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';

    // Calcular fecha de expiración (7 días desde ahora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: session.access_token,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });

    if (error) {
      console.error('Error registrando sesión:', error);
      return false;
    }

    const maxSessions = userRole === 'admin' ? 3 : 1;
    console.log('✅ Sesión registrada:', {
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      role: userRole,
      maxSessions
    });

    return true;
  } catch (error) {
    console.error('Error en registerSession:', error);
    return false;
  }
}

/**
 * Actualiza la última actividad de la sesión actual
 */
export async function updateSessionActivity(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', session.access_token)
      .eq('is_active', true);
  } catch (error) {
    console.error('Error actualizando actividad de sesión:', error);
  }
}

/**
 * Obtiene todas las sesiones activas del usuario
 */
export async function getUserActiveSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo sesiones activas:', error);
    return [];
  }
}

/**
 * Cierra una sesión específica
 */
export async function closeSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;

    console.log('✅ Sesión cerrada:', sessionId);
    return true;
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    return false;
  }
}

/**
 * Cierra todas las sesiones del usuario EXCEPTO la actual
 */
export async function closeOtherSessions(userId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('session_token', session.access_token);

    if (error) throw error;

    console.log('✅ Otras sesiones cerradas');
    return true;
  } catch (error) {
    console.error('Error cerrando otras sesiones:', error);
    return false;
  }
}

/**
 * Cierra TODAS las sesiones del usuario (incluida la actual)
 */
export async function closeAllSessions(userId: string): Promise<boolean> {
  try {
    // 1. Desactivar todas las sesiones en la BD
    const { error: dbError } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    // 2. Cerrar sesión de Supabase Auth (logout global)
    const { error: authError } = await supabase.auth.signOut({ scope: 'global' });
    
    if (authError) throw authError;

    console.log('✅ Todas las sesiones cerradas (logout global)');
    return true;
  } catch (error) {
    console.error('Error cerrando todas las sesiones:', error);
    return false;
  }
}

/**
 * Limpia sesiones inactivas (últimas 24h sin actividad)
 */
export async function cleanupInactiveSessions(userId: string): Promise<void> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .lt('last_activity', cutoffTime.toISOString());

    console.log('✅ Sesiones inactivas limpiadas');
  } catch (error) {
    console.error('Error limpiando sesiones inactivas:', error);
  }
}

/**
 * Verifica si la sesión actual es válida
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data, error } = await supabase
      .from('user_sessions')
      .select('is_active')
      .eq('session_token', session.access_token)
      .single();

    if (error || !data) return false;

    return data.is_active;
  } catch (error) {
    return false;
  }
}

