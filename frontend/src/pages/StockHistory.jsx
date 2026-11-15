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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock Movement History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete immutable ledger of all stock-in receipts, sales dispatches, and inventory audit counts.
          </p>
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs overflow-x-auto no-scrollbar max-w-full">
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
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                movementType === type.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table / Mobile Cards */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="No movements found"
            description="No inventory transactions recorded matching your selected filter."
          />
        ) : (
          <>
            {/* Desktop / Tablet Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Product & Category</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4 text-center">Type</th>
                    <th className="py-3.5 px-4 text-right">Units Changed</th>
                    <th className="py-3.5 px-4 text-right">Stock Transition</th>
                    <th className="py-3.5 px-4">Operational Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(m.created_at)}
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            to={`/inventory/${m.product_id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-xs"
                          >
                            {m.product_name}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-medium">{m.category_name}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200/60">
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
                                : 'purple'
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
                            className={`font-mono font-extrabold ${
                              m.movement_type === 'OUT'
                                ? 'text-rose-600'
                                : m.movement_type === 'IN'
                                ? 'text-emerald-600'
                                : 'text-purple-600'
                            }`}
                          >
                            {m.movement_type === 'OUT' ? '-' : '+'}
                            {formatNumber(m.quantity)}
                          </span>{' '}
                          <span className="text-[11px] text-slate-400">{m.unit}</span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          <span>{formatNumber(m.previous_quantity)}</span> &rarr;{' '}
                          <span className="font-extrabold text-slate-900">
                            {formatNumber(m.new_quantity)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate font-medium">
                          {m.reason?.startsWith('Stock Request') ? (
                            <Link
                              to="/stock-requests"
                              className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900"
                              title="View in Stock Request Ledger"
                            >
                              <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-[11px] font-bold">
                                {m.reason}
                              </span>
                            </Link>
                          ) : (
                            m.reason
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Movement Feed (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100">
              {movements.map((m) => (
                <div key={m.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        m.movement_type === 'IN'
                          ? 'success'
                          : m.movement_type === 'OUT'
                          ? 'danger'
                          : 'purple'
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
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(m.created_at)}
                    </span>
                  </div>

                  <div>
                    <Link
                      to={`/inventory/${m.product_id}`}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors block"
                    >
                      {m.product_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border border-slate-200/60">
                        {m.sku}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{m.category_name}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Units Changed
                      </span>
                      <span
                        className={`font-mono font-black ${
                          m.movement_type === 'OUT'
                            ? 'text-rose-600'
                            : m.movement_type === 'IN'
                            ? 'text-emerald-600'
                            : 'text-purple-600'
                        }`}
                      >
                        {m.movement_type === 'OUT' ? '-' : '+'}
                        {formatNumber(m.quantity)} {m.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Transition
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {formatNumber(m.previous_quantity)} &rarr;{' '}
                        <span className="font-extrabold text-slate-900">
                          {formatNumber(m.new_quantity)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100 font-medium">
                    <span className="font-bold text-slate-500 mr-1">Reason:</span>
                    {m.reason?.startsWith('Stock Request') ? (
                      <Link to="/stock-requests" className="text-indigo-700 font-bold hover:underline">
                        {m.reason}
                      </Link>
                    ) : (
                      m.reason
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
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
