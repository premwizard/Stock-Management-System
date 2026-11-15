import { Card } from '../common/Card';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, History, ArrowRight } from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export const RecentMovementsCard = ({ movements = [], isLoading = false }) => {
  const getMovementBadge = (type) => {
    switch (type) {
      case 'IN':
        return {
          icon: ArrowDownLeft,
          variant: 'success',
          label: 'Stock IN',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      case 'OUT':
        return {
          icon: ArrowUpRight,
          variant: 'danger',
          label: 'Stock OUT',
          color: 'text-rose-700 bg-rose-50 border-rose-200'
        };
      case 'ADJUSTMENT':
        return {
          icon: RefreshCw,
          variant: 'purple',
          label: 'Adjust',
          color: 'text-purple-700 bg-purple-50 border-purple-200'
        };
      default:
        return {
          icon: RefreshCw,
          variant: 'default',
          label: type,
          color: 'text-slate-700 bg-slate-50 border-slate-200'
        };
    }
  };

  return (
    <Card className="p-6 flex flex-col justify-between border border-slate-200/80">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Stock Movements
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-xs text-slate-500">
                Live transactional warehouse audit trail
              </p>
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>Full Audit Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="h-4 w-40 bg-slate-200 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No stock movements recorded in database yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {movements.slice(0, 6).map((mov) => {
              const badge = getMovementBadge(mov.movement_type);
              const Icon = badge.icon;
              return (
                <div key={mov.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {mov.product_name}
                      </p>

                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {mov.sku}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {mov.reason || 'Inventory modification transaction'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-400 font-medium">
                        {formatNumber(mov.previous_quantity)}
                      </span>
                      <span className="text-slate-300">&rarr;</span>
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {formatNumber(mov.new_quantity)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(mov.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 mt-3">
        <Link
          to="/history"
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/60"
        >
          <span>View All Historical Transactions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
