import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { inventoryService } from '../services/inventory.service';
import { categoryService } from '../services/category.service';
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

  // Fetch all categories for edit modal
  const { data: catData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getAll(false)
  });

  const product = productData?.data;
  const inventory = invData?.data;
  const movements = inventory?.recentMovements || [];
  const categories = catData?.data || [];

  if (isProductLoading || isInvLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Product Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/inventory')}>
          Return to Inventory
        </Button>
      </div>
    );
  }

  const statusConfig = getStockStatusConfig(product.stock_status);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => setIsEditModalOpen(true)}
            className="justify-center min-h-[40px]"
          >
            Edit Specs
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowDownLeft}
            onClick={() => {
              setStockAction('IN');
              setIsStockModalOpen(true);
            }}
            className="justify-center min-h-[40px]"
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
            className="justify-center min-h-[40px]"
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
            className="justify-center min-h-[40px]"
          >
            Audit Count
          </Button>
        </div>
      </div>

      {/* Main Product Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image & Key Metrics */}
        <Card className="p-6 space-y-5 lg:col-span-1 border border-slate-200/80 bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-56 rounded-2xl object-cover border border-slate-200 bg-slate-100 shadow-xs"
            />
          ) : (
            <div className="w-full h-56 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200">
              <Package className="w-16 h-16" />
            </div>
          )}

          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-slate-50 border border-indigo-100 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
              Available Inventory Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {formatNumber(product.quantity)}
              </span>
              <span className="text-sm font-bold text-slate-600">
                {product.unit}
              </span>
            </div>
            <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Stock Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Safety Stock Threshold:</span>
              <span className="font-bold text-slate-900">{product.minimum_stock} {product.unit}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Created:</span>
              <span className="font-semibold text-slate-800">{formatDate(product.created_at)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Last Modified:</span>
              <span className="font-semibold text-slate-800">{formatDate(product.updated_at)}</span>
            </div>
          </div>
        </Card>

        {/* Right: Detailed Specification & Movement Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5 border border-slate-200/80 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/60">
                  {product.sku}
                </span>
                <span className="text-xs text-slate-500 font-bold">{product.category_name}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{product.name}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>Brand</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{product.brand}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{product.category_name}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Status Flag</span>
                </div>
                <p className="font-bold text-emerald-700 text-sm">{product.is_active ? 'Active SKU' : 'Inactive'}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Vehicle Compatibility</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                {product.description || 'No detailed specifications or vehicle compatibility attributes registered.'}
              </p>
            </div>
          </Card>

          {/* Product Movement Audit Trail */}
          <Card className="p-6 space-y-4 border border-slate-200/80 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  Stock Movement Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Transactional history for this specific SKU
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {movements.length} Records
              </span>
            </div>

            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No movement transactions logged.</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Units</th>
                        <th className="py-2.5 px-3 text-right">Balance Change</th>
                        <th className="py-2.5 px-3">Audit Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-medium">{formatDate(m.created_at)}</td>
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
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                            {m.movement_type === 'OUT' ? '-' : '+'}
                            {formatNumber(m.quantity)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                            {m.previous_quantity} &rarr;{' '}
                            <span className="font-extrabold text-slate-900">{m.new_quantity}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate font-medium">
                            {m.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards (sm:hidden) */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {movements.map((m) => (
                    <div key={m.id} className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
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
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500">
                          {m.previous_quantity} &rarr;{' '}
                          <span className="font-bold text-slate-900">{m.new_quantity}</span>
                        </span>
                        <span
                          className={`font-mono font-black ${
                            m.movement_type === 'OUT' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {m.movement_type === 'OUT' ? '-' : '+'}
                          {formatNumber(m.quantity)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-medium">
                        {m.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </>
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
        categories={categories}
      />
    </div>
  );
}
