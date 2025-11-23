'use client';

import { useState } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestAPIPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      const response = await fetch('/api/test-generate');
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({
        success: false,
        logs: [`Error ejecutando test: ${error.message}`],
        criticalError: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Test de API SunoAPI</h1>
          <p className="text-zinc-400">
            Prueba completa de generación de música con logs detallados
          </p>
        </div>

        {/* Run Test Button */}
        <div className="mb-6">
          <button
            onClick={runTest}
            disabled={testing}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
              testing
                ? 'bg-zinc-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-all`}
          >
            {testing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Ejecutando tests...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Ejecutar Test Completo
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`rounded-lg border p-6 ${
              results.success
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-red-500/10 border-red-500/50'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {results.success ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {results.success ? '✅ Test Exitoso' : '❌ Test Fallido'}
                  </h2>
                  {results.summary && (
                    <p className="text-sm text-zinc-400">
                      {results.summary.passed}/{results.summary.totalTests} tests pasados
                    </p>
                  )}
                </div>
              </div>
              
              {results.timestamp && (
                <p className="text-xs text-zinc-500">
                  Ejecutado: {new Date(results.timestamp).toLocaleString()}
                </p>
              )}
            </div>

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Errores Encontrados</h3>
                </div>
                <div className="space-y-3">
                  {results.errors.map((error: any, index: number) => (
                    <div key={index} className="bg-black/30 rounded p-4">
                      <div className="text-red-400 font-semibold mb-2">
                        {error.step}: {error.error}
                      </div>
                      {error.status && (
                        <div className="text-sm text-zinc-400 mb-1">
                          Status Code: {error.status}
                        </div>
                      )}
                      {error.response && (
                        <pre className="text-xs text-zinc-300 bg-black/50 p-3 rounded overflow-auto max-h-40">
                          {JSON.stringify(error.response, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">📋 Logs Detallados</h3>
              <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-auto max-h-[600px]">
                {results.logs?.map((log: string, index: number) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      log.includes('✅')
                        ? 'text-green-400'
                        : log.includes('❌')
                        ? 'text-red-400'
                        : log.includes('⚠️')
                        ? 'text-yellow-400'
                        : log.includes('===')
                        ? 'text-blue-400 font-bold'
                        : log.startsWith(' ')
                        ? 'text-zinc-500 ml-4'
                        : 'text-zinc-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON */}
            <details className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <summary className="text-white font-semibold cursor-pointer">
                🔍 Ver JSON Completo
              </summary>
              <pre className="mt-4 text-xs text-zinc-300 bg-black p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        {!results && !testing && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">ℹ️ Qué hace este test:</h3>
            <ul className="space-y-2 text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">1.</span>
                Verifica que las variables de entorno estén configuradas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">2.</span>
                Prueba la conectividad con SunoAPI.org
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">3.</span>
                Intenta generar una canción de prueba
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">4.</span>
                Consulta el estado de la generación
              </li>
            </ul>
            <p className="mt-4 text-sm text-zinc-500">
              Este test te mostrará exactamente dónde está fallando la integración con SunoAPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


