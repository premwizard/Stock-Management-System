import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { inventoryService } from '../services/inventory.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StockActionModal } from '../components/inventory/StockActionModal';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { getStockStatusConfig } from '../utils/stockStatus';
import { formatNumber, formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Edit2,
  Calendar,
  Building,
  Tag
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState('IN');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch product metadata
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ['product-details', id],
    queryFn: () => productService.getById(id)
  });

  // Fetch inventory & movements
  const { data: invData, isLoading: isInvLoading } = useQuery({
    queryKey: ['inventory-details', id],
    queryFn: () => inventoryService.getByProductId(id)
  });

  const product = productData?.data;
  const inventory = invData?.data;
  const movements = inventory?.recentMovements || [];

  if (isProductLoading || isInvLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Product Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/inventory')}>
          Return to Inventory
        </Button>
      </div>
    );
  }

  const statusConfig = getStockStatusConfig(product.stock_status);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Specifications
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowDownLeft}
            onClick={() => {
              setStockAction('IN');
              setIsStockModalOpen(true);
            }}
          >
            Stock IN
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={ArrowUpRight}
            onClick={() => {
              setStockAction('OUT');
              setIsStockModalOpen(true);
            }}
          >
            Stock OUT
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              setStockAction('ADJUST');
              setIsStockModalOpen(true);
            }}
          >
            Adjust
          </Button>
        </div>
      </div>

      {/* Main Product Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image & Key Metrics */}
        <Card className="p-6 space-y-5 lg:col-span-1">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-56 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
            />
          ) : (
            <div className="w-full h-56 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Package className="w-16 h-16" />
            </div>
          )}

          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Current Available Inventory
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {formatNumber(product.quantity)}
              </span>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {product.unit}
              </span>
            </div>
            <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Stock Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-400">Min. Threshold:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{product.minimum_stock} {product.unit}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-400">Created:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(product.created_at)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Modified:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(product.updated_at)}</span>
            </div>
          </div>
        </Card>

        {/* Right: Detailed Specification & Movement Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {product.sku}
                </span>
                <span className="text-xs text-slate-500 font-medium">{product.category_name}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{product.name}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Brand</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{product.brand}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{product.category_name}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Status Flag</span>
                </div>
                <p className="font-semibold text-emerald-600 text-xs">{product.is_active ? 'Active SKU' : 'Inactive'}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Usage</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {product.description || 'No detailed description available.'}
              </p>
            </div>
          </Card>

          {/* Product Movement Audit Trail */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Stock Movement Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Transaction history for this specific SKU
                </p>
              </div>
            </div>

            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No movement transactions logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Units</th>
                      <th className="py-2.5 px-3 text-right">Balance Change</th>
                      <th className="py-2.5 px-3">Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              m.movement_type === 'IN'
                                ? 'success'
                                : m.movement_type === 'OUT'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {m.movement_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {m.movement_type === 'OUT' ? '-' : '+'}
                          {formatNumber(m.quantity)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                          {m.previous_quantity} &rarr;{' '}
                          <span className="font-bold text-slate-700 dark:text-slate-200">{m.new_quantity}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {m.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Action Modals */}
      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={product}
        initialAction={stockAction}
      />

      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        categories={[]}
      />
    </div>
  );
}
