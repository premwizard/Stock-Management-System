import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatNumber } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

export const StockHistory = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [movementType, setMovementType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements-history', { page, limit, movementType }],
    queryFn: () =>
      inventoryService.getMovements({
        page,
        limit,
        movementType: movementType || undefined
      })
  });

  const movements = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, totalItems: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Stock Movement History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable ledger of all stock-in receipts, sales dispatches, and inventory audit counts.
          </p>
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { id: '', label: 'All Movements' },
            { id: 'IN', label: 'Stock IN' },
            { id: 'OUT', label: 'Stock OUT' },
            { id: 'ADJUSTMENT', label: 'Adjustments' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setMovementType(type.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                movementType === type.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="No movements found"
            description="No inventory transactions recorded matching your selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product & Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Units Changed</th>
                  <th className="py-3 px-4 text-right">Stock Transition</th>
                  <th className="py-3 px-4">Operational Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => {
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(m.created_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/inventory/${m.product_id}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate max-w-xs"
                        >
                          {m.product_name}
                        </Link>
                        <span className="text-[11px] text-slate-400">{m.category_name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {m.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            m.movement_type === 'IN'
                              ? 'success'
                              : m.movement_type === 'OUT'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {m.movement_type === 'IN' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : m.movement_type === 'OUT' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          <span>{m.movement_type}</span>
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold ${
                            m.movement_type === 'OUT'
                              ? 'text-rose-600'
                              : m.movement_type === 'IN'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {m.movement_type === 'OUT' ? '-' : '+'}
                          {formatNumber(m.quantity)}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">{m.unit}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span>{formatNumber(m.previous_quantity)}</span> &rarr;{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatNumber(m.new_quantity)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                        {m.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          limit={meta.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Card>
    </div>
  );
};

export default StockHistory;
