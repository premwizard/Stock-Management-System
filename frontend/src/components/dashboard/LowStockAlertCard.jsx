import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

export const LowStockAlertCard = ({ items = [], isLoading = false }) => {
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Low Stock & Depleted Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Items requiring replenishment attention
              </p>
            </div>
          </div>
          <Link
            to="/inventory?status=low_stock"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700"
          >
            Manage &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            All inventory levels are currently above minimum stock thresholds!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {items.slice(0, 5).map((item) => (
              <div key={item.product_id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.product_name}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{item.category_name}</span>
                    <span>&bull;</span>
                    <span>Min Threshold: {item.minimum_stock}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {item.quantity === 0 ? (
                    <Badge variant="danger" dot>
                      <AlertCircle className="w-3 h-3" />
                      <span>Out of Stock</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" dot>
                      <span>{item.quantity} left</span>
                    </Badge>
                  )}
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium font-mono">
                    Deficit: -{formatNumber(item.deficit)} {item.unit || 'units'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
        <Link
          to="/inventory"
          className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Open Full Inventory Replenishment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

