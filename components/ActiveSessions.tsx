'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserActiveSessions, closeSession, closeOtherSessions, type SessionData } from '@/lib/sessionManager';
import { Monitor, Smartphone, Tablet, X, LogOut, AlertCircle } from 'lucide-react';

interface Props {
  userId: string;
  userRole?: string;
}

export default function ActiveSessions({ userId, userRole }: Props) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<string>('');

  useEffect(() => {
    loadSessions();
    getCurrentToken();
  }, [userId]);

  const getCurrentToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentToken(session.access_token);
    }
  };

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const activeSessions = await getUserActiveSessions(userId);
      setSessions(activeSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('¿Cerrar esta sesión?')) return;
    
    const success = await closeSession(sessionId);
    if (success) {
      await loadSessions();
    }
  };

  const handleCloseOtherSessions = async () => {
    if (!confirm('¿Cerrar todas las demás sesiones? Solo permanecerá activa esta sesión.')) return;
    
    const success = await closeOtherSessions(userId);
    if (success) {
      await loadSessions();
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} horas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentSession = (sessionToken: string) => {
    return sessionToken === currentToken;
  };

  const maxSessions = userRole === 'admin' ? 3 : 1;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-800 p-6 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Sesiones Activas</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {sessions.length} de {maxSessions} {maxSessions === 1 ? 'dispositivo permitido' : 'dispositivos permitidos'}
          </p>
        </div>
        
        {sessions.length > 1 && (
          <button
            onClick={handleCloseOtherSessions}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar otras
          </button>
        )}
      </div>

      {/* Alerta de límite */}
      {userRole !== 'admin' && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Límite de sesión única:</strong> Solo puedes tener un dispositivo activo a la vez. 
            Si inicias sesión en otro dispositivo, esta sesión se cerrará automáticamente.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-600">
            No hay sesiones activas
          </div>
        ) : (
          sessions.map((session) => {
            const isCurrent = isCurrentSession(session.session_token);
            const deviceInfo = session.device_info as any;

            return (
              <div
                key={session.id}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      isCurrent 
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {getDeviceIcon(deviceInfo?.device)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-zinc-900 dark:text-white">
                          {deviceInfo?.browser || 'Navegador desconocido'}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                            Esta sesión
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <p>
                          {deviceInfo?.os || 'OS desconocido'} • {deviceInfo?.device || 'Dispositivo desconocido'}
                        </p>
                        {session.ip_address && (
                          <p className="text-xs font-mono">IP: {session.ip_address}</p>
                        )}
                        <p className="text-xs">
                          Última actividad: {formatDate(session.last_activity)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleCloseSession(session.id)}
                      className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cerrar sesión"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

