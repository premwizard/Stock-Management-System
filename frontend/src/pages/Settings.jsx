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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          System Settings & Demonstration Guide
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review system health diagnostics, database configurations, and guided demonstration scenarios.
        </p>
      </div>

      {/* Guided Client Demonstration Scenarios Card */}
      <Card className="p-6 space-y-4 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Client Demonstration Quick-Launch Scenarios
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any scenario to jump directly to Smart Search with pre-populated queries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {demoScenarios.map((demo) => (
            <div
              key={demo.query}
              onClick={() => navigate(`/search?q=${encodeURIComponent(demo.query)}`)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {demo.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {demo.description}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  ?q={demo.query}
                </span>
                <span className="font-semibold text-slate-400 group-hover:text-indigo-600">
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
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">PostgreSQL 18 Engine</h3>
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
              Ping
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Database Name:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">inventory_db</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Database Status:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {health?.database?.status === 'connected' ? 'Connected & Healthy' : 'Degraded'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Roundtrip Latency:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {health?.database?.latencyMs} ms
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Full-Text Search Indexing:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                pg_trgm (GIN Indexes Enabled)
              </span>
            </div>
          </div>
        </Card>

        {/* Runtime Architecture */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Application Architecture</h3>
              <p className="text-xs text-slate-500">Node.js Clean Modular Monolith</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Server Mode:</span>
              <span className="font-mono font-semibold uppercase text-slate-800 dark:text-slate-200">
                {health?.environment || 'development'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Server Uptime:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {health?.uptimeSeconds} seconds
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Memory Footprint (RSS):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {health?.memoryUsage?.rssMb} MB
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Client Bundle:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                React 18 &middot; Vite 6 &middot; Tailwind CSS
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Database Reset & Reseed Commands */}
      <Card className="p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Demo Data Reset Instructions</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The database seed process is repeatable without creating duplicate records. To reset the demo warehouse to its baseline state (148 products, 7 categories, and clean initial stock balances), execute:
        </p>
        <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl flex items-center justify-between">
          <span>npm run db:reset</span>
          <span className="text-slate-500 text-[10px]">Drops, Migrates & Reseeds in 2s</span>
        </div>
      </Card>
    </div>
  );
}
