import { useQuery } from '@tanstack/react-query';
import { checkHealth } from './services/api';
import { 
  Activity, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Layers,
  ArrowRight
} from 'lucide-react';

function App() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: checkHealth
  });

  const health = data?.data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/20 backdrop-blur rounded-xl border border-indigo-400/30">
                <Layers className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">StockPulse</h1>
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-medium mt-0.5">
                  Inventory Management & Smart Stock Lookup
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Phase 1 Active
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">System Integration Status</h2>
              <p className="text-sm text-slate-500">
                Verifying full-stack connectivity between React client, Express API, and PostgreSQL.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">Probing backend health endpoint...</p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-rose-700 font-semibold">
                <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                <span>Backend Connection Failed</span>
              </div>
              <p className="text-sm text-rose-600">
                {error?.message || 'Unable to reach backend API. Ensure the server is running on port 5000.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Service Status */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Express API</h3>
                      <p className="text-xs text-slate-500">HTTP REST Service</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Online
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-mono font-medium uppercase text-slate-700">{health?.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="font-mono text-slate-700">{health?.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uptime:</span>
                    <span className="font-mono text-slate-700">{health?.uptimeSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* PostgreSQL Database Status */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">PostgreSQL</h3>
                      <p className="text-xs text-slate-500">Database Pool</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    health?.database?.status === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {health?.database?.status === 'connected' ? 'Connected' : 'Degraded'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pool Status:</span>
                    <span className="font-medium text-emerald-700 font-mono">ACTIVE (Max 20)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Query Latency:</span>
                    <span className="font-mono font-medium text-slate-700">{health?.database?.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Database:</span>
                    <span className="font-mono text-slate-700">inventory_db</span>
                  </div>
                </div>
              </div>

              {/* System Memory & Runtime */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Process Memory</h3>
                    <p className="text-xs text-slate-500">Node.js Engine Metrics</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heap Used:</span>
                    <span className="font-mono text-slate-700">{health?.memoryUsage?.heapUsedMb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resident Set (RSS):</span>
                    <span className="font-mono text-slate-700">{health?.memoryUsage?.rssMb} MB</span>
                  </div>
                </div>
              </div>

              {/* Stack Architecture */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">Client Environment</h3>
                    <p className="text-xs text-slate-500">React + Vite + Tailwind</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="font-mono text-slate-700">{new Date(health?.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vite Proxy:</span>
                    <span className="font-mono text-emerald-700">/api/v1 &rarr; :5000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps Banner */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <div>
                <p className="text-xs font-semibold text-indigo-900">Phase 1 Complete</p>
                <p className="text-xs text-indigo-700">
                  Baseline connectivity verified. Ready for Phase 2: Schema Migrations & Mock Data Seeding.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
