import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import { categoryService } from '../services/category.service';
import { Card } from '../components/common/Card';
import { Pagination } from '../components/common/Pagination';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { StockActionModal } from '../components/inventory/StockActionModal';
import { getStockStatusConfig } from '../utils/stockStatus';
import { formatNumber } from '../utils/formatters';
import {
  Search,
  Zap,
  Sparkles,
  Package,
  Layers,
  Filter,
  LayoutGrid,
  List,
  PackagePlus,
  PackageMinus,
  ExternalLink,
  Clock,
  X
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  { label: 'Car', icon: Sparkles },
  { label: 'Tyre', icon: Sparkles },
  { label: 'Michelin', icon: Sparkles },
  { label: 'Brake', icon: Sparkles },
  { label: 'Engine Oil', icon: Sparkles },
  { label: 'Oil Filter', icon: Sparkles },
  { label: 'Bike Chain', icon: Sparkles },
  { label: 'TYR-001', icon: Zap }
];

export default function SmartSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(16);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAction, setStockAction] = useState('IN');

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryInput);
      setPage(1);
      if (queryInput) {
        setSearchParams({ q: queryInput });
      } else {
        setSearchParams({});
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [queryInput, setSearchParams]);

  // Fetch Categories for Filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getAll(false)
  });
  const categories = categoriesData?.data || [];

  // Smart Search Query
  const {
    data: searchResponse,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['smart-search', { debouncedQuery, category, status, page, limit }],
    queryFn: () =>
      searchService.searchProducts({
        q: debouncedQuery,
        category: category || undefined,
        status: status !== 'all' ? status : undefined,
        page,
        limit
      })
  });

  const searchData = searchResponse?.data || {
    query: '',
    totalProducts: 0,
    totalStockUnits: 0,
    products: []
  };

  const meta = searchResponse?.meta || { page: 1, limit: 16, totalPages: 1, executionTimeMs: 0 };
  const products = searchData.products || [];

  const handleSuggestionClick = (term) => {
    setQueryInput(term);
    setDebouncedQuery(term);
    setPage(1);
    setSearchParams({ q: term });
  };

  const handleClear = () => {
    setQueryInput('');
    setDebouncedQuery('');
    setPage(1);
    setSearchParams({});
  };

  const handleOpenStock = (p, action) => {
    setStockProduct(p);
    setStockAction(action);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Prominent Smart Search Showcase Hero */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white overflow-hidden shadow-xl border border-indigo-900/50">
        {/* Subtle decorative mesh */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Instant Trigram Search Engine
            </span>
            {meta.executionTimeMs > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                {meta.executionTimeMs}ms database roundtrip
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Smart Stock Lookup Engine
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Search by product name, category, SKU, brand, or automotive keywords to instantly calculate available stock totals.
            </p>
          </div>

          {/* Prominent Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search by keyword (e.g. 'Car', 'Tyre', 'Michelin', 'Brake', 'TYR-001')..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all shadow-inner"
              autoFocus
            />
            {queryInput && (
              <button
                onClick={handleClear}
                className="absolute right-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mr-1">
              Popular Searches:
            </span>
            {SUGGESTED_QUERIES.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestionClick(s.label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  queryInput.toLowerCase() === s.label.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/15'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Aggregate Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Matching Products */}
        <Card className="p-5 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Matching Products
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {isLoading ? '...' : formatNumber(searchData.totalProducts)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {debouncedQuery ? `Products matching '${debouncedQuery}'` : 'All catalogue products'}
          </p>
        </Card>

        {/* Total Available Stock Units */}
        <Card className="p-5 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Available Stock
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {isLoading ? '...' : formatNumber(searchData.totalStockUnits)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Aggregated units in warehouse storage
          </p>
        </Card>

        {/* Database Search Latency */}
        <Card className="p-5 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Engine Query Latency
              </span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">
                {isLoading ? '...' : `${meta.executionTimeMs} ms`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            PostgreSQL GIN trigram index execution
          </p>
        </Card>
      </div>

      {/* Filter and View Mode Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/80 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold rounded-xl px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            {[
              { id: 'all', label: 'All' },
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
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  status === st.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle: Grid vs Table */}
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="text-xs font-semibold text-slate-400 animate-pulse hidden sm:inline">
              Updating results...
            </span>
          )}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Results View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3 animate-pulse border border-slate-200">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Products Matched Your Query"
          description={`We couldn't find any products matching '${debouncedQuery}'. Try searching for generic automotive terms like 'Car', 'Tyre', 'Brake', or 'Oil'.`}
          actionLabel="Show All Products"
          onAction={handleClear}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Result Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => {
            const statusConfig = getStockStatusConfig(p.stock_status);
            return (
              <Card
                key={p.id}
                className="overflow-hidden flex flex-col justify-between hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 group border border-slate-200/80 bg-white"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {/* Floating status badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs ${statusConfig.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-[11px] font-bold text-white shadow-xs">
                        {p.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200/60">
                        {p.sku}
                      </span>
                      <span className="font-bold text-slate-600">{p.brand}</span>
                    </div>

                    <Link
                      to={`/inventory/${p.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block tracking-tight"
                      title={p.name}
                    >
                      {p.name}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Stock Level & Quick Actions */}
                <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Available Stock
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {formatNumber(p.quantity)}
                    </span>{' '}
                    <span className="text-xs text-slate-500 font-medium">{p.unit}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenStock(p, 'IN')}
                      className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      title="Quick Stock IN"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenStock(p, 'OUT')}
                      className="p-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      title="Quick Stock OUT"
                    >
                      <PackageMinus className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/inventory/${p.id}`}
                      className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden border border-slate-200/80 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Stock Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const statusConfig = getStockStatusConfig(p.stock_status);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <Link
                          to={`/inventory/${p.id}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-slate-600">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{p.brand}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{p.category}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatNumber(p.quantity)} <span className="text-slate-400 text-xs font-normal">{p.unit}</span>
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
                            onClick={() => handleOpenStock(p, 'IN')}
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Stock IN"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStock(p, 'OUT')}
                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            title="Stock OUT"
                          >
                            <PackageMinus className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/inventory/${p.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-200"
                            title="Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={searchData.totalProducts}
        limit={meta.limit}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Stock Mutation Modal */}
      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={stockProduct}
        initialAction={stockAction}
      />
    </div>
  );
}
