import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useQueryClient } from '@tanstack/react-query';
import { formatNumber } from '../../utils/formatters';

export const StockActionModal = ({
  isOpen,
  onClose,
  product = null,
  initialAction = 'IN'
}) => {
  const queryClient = useQueryClient();
  const [actionType, setActionType] = useState(initialAction); // 'IN', 'OUT', 'ADJUST'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStock = Number(product?.quantity) || 0;
  const numQuantity = Number(quantity) || 0;

  // Calculate projected new stock
  let projectedStock = currentStock;
  if (actionType === 'IN') {
    projectedStock = currentStock + numQuantity;
  } else if (actionType === 'OUT') {
    projectedStock = Math.max(0, currentStock - numQuantity);
  } else if (actionType === 'ADJUST') {
    projectedStock = Math.max(0, numQuantity);
  }

  const isInvalidOut = actionType === 'OUT' && numQuantity > currentStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || numQuantity <= 0 && actionType !== 'ADJUST') {
      setError('Please enter a valid quantity');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide an operational audit reason');
      return;
    }
    if (isInvalidOut) {
      setError(`Cannot remove ${numQuantity} units. Only ${currentStock} units available.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (actionType === 'IN') {
        await inventoryService.stockIn({
          productId: product.id || product.product_id,
          quantity: numQuantity,
          reason: reason.trim()
        });
      } else if (actionType === 'OUT') {
        await inventoryService.stockOut({
          productId: product.id || product.product_id,
          quantity: numQuantity,
          reason: reason.trim()
        });
      } else if (actionType === 'ADJUST') {
        await inventoryService.adjust({
          productId: product.id || product.product_id,
          newQuantity: numQuantity,
          reason: reason.trim()
        });
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] });

      setQuantity('');
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Stock mutation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Inventory Mutation"
      subtitle={`${product?.name || product?.product_name} (${product?.sku})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* Action Type Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActionType('IN')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              actionType === 'IN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Stock IN</span>
          </button>
          <button
            type="button"
            onClick={() => setActionType('OUT')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              actionType === 'OUT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Stock OUT</span>
          </button>
          <button
            type="button"
            onClick={() => setActionType('ADJUST')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              actionType === 'ADJUST'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit Count</span>
          </button>
        </div>

        {/* Current vs Projected preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Current Available
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {formatNumber(currentStock)} {product?.unit || 'pcs'}
            </span>
          </div>

          <div className="text-slate-400 font-bold">&rarr;</div>

          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Projected Stock
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                isInvalidOut
                  ? 'text-rose-600'
                  : actionType === 'IN'
                  ? 'text-emerald-600'
                  : actionType === 'OUT'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              {formatNumber(projectedStock)} {product?.unit || 'pcs'}
            </span>
          </div>
        </div>

        <Input
          label={actionType === 'ADJUST' ? 'New Target Inventory Count *' : 'Quantity Units *'}
          type="number"
          min={actionType === 'ADJUST' ? '0' : '1'}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={actionType === 'ADJUST' ? 'e.g. 150' : 'e.g. 25'}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Operational Audit Reason *
          </label>
          <textarea
            rows="2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={
              actionType === 'IN'
                ? 'e.g. Supplier replenishment shipment PO #8210'
                : actionType === 'OUT'
                ? 'e.g. Customer workshop installation invoice #9401'
                : 'e.g. Monthly stock cycle count adjustment'
            }
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'IN' ? 'primary' : actionType === 'OUT' ? 'danger' : 'secondary'}
            type="submit"
            isLoading={isSubmitting}
            disabled={isInvalidOut}
          >
            {actionType === 'IN'
              ? 'Confirm Stock IN'
              : actionType === 'OUT'
              ? 'Confirm Stock OUT'
              : 'Save Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

