'use client';

import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface GenerationModalProps {
  isOpen: boolean;
  logs: string[];
  status: 'generating' | 'success' | 'error';
  onClose: () => void;
  onCancel: () => void;
}

export default function GenerationModal({
  isOpen,
  logs,
  status,
  onClose,
  onCancel
}: GenerationModalProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando se añaden logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            {status === 'generating' && (
              <>
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <h2 className="text-xl font-bold text-white">Generando Música...</h2>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-white">¡Generación Completada!</h2>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Error en la Generación</h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/30">
          <div className="space-y-2 font-mono text-sm">
            {logs.map((log, index) => {
              // Detectar tipo de log por prefijo
              const isError = log.includes('❌') || log.includes('Error') || log.includes('FAILED');
              const isSuccess = log.includes('✅') || log.includes('SUCCESS');
              const isInfo = log.includes('📤') || log.includes('📊') || log.includes('🎵');
              const isWarning = log.includes('⚠️') || log.includes('PENDING') || log.includes('TEXT_SUCCESS');
              
              let colorClass = 'text-zinc-400';
              if (isError) colorClass = 'text-red-400';
              else if (isSuccess) colorClass = 'text-green-400';
              else if (isInfo) colorClass = 'text-blue-400';
              else if (isWarning) colorClass = 'text-yellow-400';

              return (
                <div key={index} className={`${colorClass} leading-relaxed`}>
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-700">
          <div className="text-sm text-zinc-400">
            {status === 'generating' && (
              <span>⏳ Procesando... Esto puede tomar 1-2 minutos</span>
            )}
            {status === 'success' && (
              <span className="text-green-400">🎉 Canción guardada en tu biblioteca</span>
            )}
            {status === 'error' && (
              <span className="text-red-400">💥 Algo salió mal, revisa los logs arriba</span>
            )}
          </div>

          <div className="flex gap-3">
            {status === 'generating' && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                Cancelar Generación
              </button>
            )}
            {(status === 'success' || status === 'error') && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


