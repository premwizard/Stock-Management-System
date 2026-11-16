import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AlertTriangle, AlertCircle, ArrowRight, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

export const LowStockAlertCard = ({ items = [], isLoading = false, onRestockClick }) => {
  return (
    <Card className="p-6 flex flex-col justify-between border border-slate-200/80">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/80 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Replenishment Alerts
                </h3>
                {items.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-md">
                    {items.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Products at or below safety stock
              </p>
            </div>
          </div>
          <Link
            to="/inventory?status=low_stock"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                <div className="h-4 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">All Stock Levels Optimal</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No products are currently below their minimum threshold limits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.slice(0, 5).map((item) => {
              const isDepleted = item.quantity === 0;
              const ratio = item.minimum_stock > 0 ? Math.min(100, Math.round((item.quantity / item.minimum_stock) * 100)) : 0;

              return (
                <div key={item.product_id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {item.product_name}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {item.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{item.category_name}</span>
                      <span>&bull;</span>
                      <span>Min: {item.minimum_stock} {item.unit || 'pcs'}</span>
                    </div>

                    {/* Stock level micro-bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isDepleted ? 'bg-rose-500 w-0' : ratio < 50 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {isDepleted ? (
                      <Badge variant="danger" dot>
                        <span>0 left</span>
                      </Badge>
                    ) : (
                      <Badge variant="warning" dot>
                        <span>{item.quantity} left</span>
                      </Badge>
                    )}

                    <span className="text-[10px] text-rose-600 font-bold font-mono">
                      Deficit: -{formatNumber(item.deficit)}
                    </span>

                    {onRestockClick && (
                      <button
                        onClick={() => onRestockClick(item)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 min-h-[32px] active:scale-95 transition-all"
                        title="Stock in inventory"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 mt-3">
        <Link
          to="/inventory?status=low_stock"
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/60"
        >
          <span>View All Depleted & Low Stock SKUs ({items.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
