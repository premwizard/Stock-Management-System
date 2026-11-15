import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, History } from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export const RecentMovementsCard = ({ movements = [], isLoading = false }) => {
  const getMovementBadge = (type) => {
    switch (type) {
      case 'IN':
        return {
          icon: ArrowDownLeft,
          variant: 'success',
          label: 'Stock IN'
        };
      case 'OUT':
        return {
          icon: ArrowUpRight,
          variant: 'danger',
          label: 'Stock OUT'
        };
      case 'ADJUSTMENT':
        return {
          icon: RefreshCw,
          variant: 'warning',
          label: 'Adjust'
        };
      default:
        return {
          icon: RefreshCw,
          variant: 'default',
          label: type
        };
    }
  };

  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Stock Movements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time inventory audit trail
              </p>
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View All &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No stock movements recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {movements.slice(0, 6).map((mov) => {
              const badge = getMovementBadge(mov.movement_type);
              const Icon = badge.icon;
              return (
                <div key={mov.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {mov.product_name}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {mov.sku}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {mov.reason}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(mov.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant={badge.variant}>
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </Badge>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                      {mov.movement_type === 'OUT' ? '-' : '+'}
                      {formatNumber(mov.quantity)} units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

