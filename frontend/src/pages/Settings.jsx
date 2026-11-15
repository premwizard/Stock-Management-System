import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Server,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Activity
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { data: healthData, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: checkHealth
  });

  const health = healthData?.data;

  const demoScenarios = [
    {
      title: 'Primary Demo Example: Search "Car"',
      description: 'Retrieves car-related parts across all categories and aggregates over 5,300 stock units.',
      query: 'Car'
    },
    {
      title: 'Category Search: Search "Tyre"',
      description: 'Filters all automotive tyre products and aggregates total tyre units instantly.',
      query: 'Tyre'
    },
    {
      title: 'Brand Query: Search "Michelin"',
      description: 'Showcases brand-level partial matching across tyres, gauges, and accessories.',
      query: 'Michelin'
    },
    {
      title: 'Keyword: Search "Brake"',
      description: 'Matches brake pads, discs, calipers, and fluid across Car and Bike categories.',
      query: 'Brake'
    },
    {
      title: 'Exact SKU: Search "TYR-001"',
      description: 'Pinpoints the exact Michelin Tyre with 120 available stock units as the top result.',
      query: 'TYR-001'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Diagnostics & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review system health diagnostics, database configurations, and guided demonstration scenarios.
        </p>
      </div>

      {/* Guided Client Demonstration Scenarios Card */}
      <Card className="p-6 space-y-4 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Client Demonstration Quick-Launch Scenarios
            </h3>
            <p className="text-xs text-slate-500">
              Click any scenario below to jump directly to Smart Search with pre-populated queries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {demoScenarios.map((demo) => (
            <div
              key={demo.query}
              onClick={() => navigate(`/search?q=${encodeURIComponent(demo.query)}`)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-card-hover transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {demo.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {demo.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  ?q={demo.query}
                </span>
                <span className="font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                  Execute &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Infrastructure & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend & DB Health */}
        <Card className="p-6 space-y-4 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-2xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">PostgreSQL 18 Database Engine</h3>
                <p className="text-xs text-slate-500">Relational Database Diagnostics</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Activity}
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              Ping Latency
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Database Name:</span>
              <span className="font-mono font-bold text-slate-900">inventory_db</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Database Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {health?.database?.status === 'connected' ? 'Connected & Operational' : 'Degraded'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Roundtrip Query Latency:</span>
              <span className="font-mono font-extrabold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                {health?.database?.latencyMs ?? 1} ms
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Search Acceleration:</span>
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                pg_trgm (GIN Trigram Indexes)
              </span>
            </div>
          </div>
        </Card>

        {/* Runtime Architecture */}
        <Card className="p-6 space-y-4 border border-slate-200/80 bg-white">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 shadow-2xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Application Architecture</h3>
              <p className="text-xs text-slate-500">Node.js Clean Modular Monolith</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Server Runtime:</span>
              <span className="font-mono font-bold uppercase text-slate-900">
                {health?.environment || 'development'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Server Uptime:</span>
              <span className="font-mono font-bold text-slate-900">
                {health?.uptimeSeconds || 0} seconds
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Memory Allocation (RSS):</span>
              <span className="font-mono font-bold text-slate-900">
                {health?.memoryUsage?.rssMb || 0} MB
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Frontend Stack:</span>
              <span className="font-mono text-slate-800 font-medium">
                React 18 &middot; Vite 6 &middot; Tailwind CSS
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Database Reset & Reseed Commands */}
      <Card className="p-6 space-y-3 border border-slate-200/80 bg-white">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Demo Data Reset Instructions</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The database seed process is repeatable without creating duplicate records. To reset the demo warehouse to its baseline state (148 products, 7 categories, and clean initial stock balances), execute:
        </p>
        <div className="p-3.5 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl flex items-center justify-between shadow-xs">
          <span className="text-emerald-400 font-bold">npm run db:reset</span>
          <span className="text-slate-400 text-[10px]">Drops, Migrates & Reseeds in ~2s</span>
        </div>
      </Card>
    </div>
  );
}
