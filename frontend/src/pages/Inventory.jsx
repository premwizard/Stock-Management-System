import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { StockActionModal } from '../components/inventory/StockActionModal';
import { getStockStatusConfig } from '../utils/stockStatus';
import { formatNumber } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  ExternalLink,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Package
} from 'lucide-react';

export default function Inventory() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockInitialAction, setStockInitialAction] = useState('IN');

  // Fetch Categories for Filter Dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getAll(false)
  });
  const categories = categoriesData?.data || [];

  // Fetch Products
  const {
    data: productsData,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['products', { page, limit, search, category, status, sort, order }],
    queryFn: () =>
      productService.getAll({
        page,
        limit,
        search: search.trim() || undefined,
        category: category || undefined,
        status: status !== 'all' ? status : undefined,
        sort,
        order
      })
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta || { page: 1, limit: 15, totalItems: 0, totalPages: 1 };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenStockAction = (prod, action) => {
    setStockModalProduct(prod);
    setStockInitialAction(action);
    setIsStockModalOpen(true);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete '${name}'? This will also remove its inventory and stock movement history.`)) {
      try {
        await productService.delete(id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      } catch (err) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage product specifications, monitor stock levels, and execute warehouse stock movements.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAdd}>
          Add Product
        </Button>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 space-y-3 border border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name, SKU, brand..."
              className="w-full text-xs rounded-xl pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            >
              <option value="created_at">Sort by Date Added</option>
              <option value="name">Sort by Product Name</option>
              <option value="sku">Sort by SKU Code</option>
              <option value="quantity">Sort by Available Stock</option>
            </select>
          </div>

          {/* Order Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex-1 text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{order.toUpperCase() === 'ASC' ? 'Ascending Order' : 'Descending Order'}</span>
            </button>
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Stock' },
            { id: 'in_stock', label: 'In Stock' },
            { id: 'low_stock', label: 'Low Stock' },
            { id: 'out_of_stock', label: 'Out of Stock' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatus(st.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-all cursor-pointer ${
                status === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
          {isFetching && (
            <span className="text-[11px] font-semibold text-slate-400 animate-pulse ml-auto">
              Updating list...
            </span>
          )}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No matching products"
            description="No inventory items match your current filter and search conditions."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setCategory('');
              setStatus('all');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Product & Brand</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Stock Actions</th>
                  <th className="py-3.5 px-4 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const statusConfig = getStockStatusConfig(p.stock_status);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/inventory/${p.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-xs"
                            >
                              {p.name}
                            </Link>
                            <span className="text-slate-500 text-[11px] font-medium block">{p.brand}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200/60">
                          {p.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {p.category_name}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {formatNumber(p.quantity)}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px] font-medium">{p.unit}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenStockAction(p, 'IN')}
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Add Stock (+ IN)"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStockAction(p, 'OUT')}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Remove Stock (- OUT)"
                          >
                            <PackageMinus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStockAction(p, 'ADJUST')}
                            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="Physical Audit Count"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/inventory/${p.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="View Product History"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Product Creation / Editing Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        categories={categories}
      />

      {/* Stock IN / OUT / Adjust Modal */}
      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={stockModalProduct}
        initialAction={stockInitialAction}
      />
    </div>
  );
}
