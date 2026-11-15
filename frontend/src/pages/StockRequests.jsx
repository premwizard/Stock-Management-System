import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import { stockRequestService } from '../services/stockRequest.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { getStockStatusConfig } from '../utils/stockStatus';
import { formatNumber, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Zap,
  Package,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'Car',
  'Tyre',
  'Michelin',
  'Brake',
  'Engine Oil',
  'Oil Filter',
  'TYR-001'
];

export default function StockRequests() {
  const queryClient = useQueryClient();

  // Active Tab: 'create' | 'history'
  const [activeTab, setActiveTab] = useState('create');

  // Search state
  const [queryInput, setQueryInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const searchLimit = 8;

  // Staging / Cart State: Map of productId -> { product, requestedQuantity }
  const [stagedItems, setStagedItems] = useState({});
  const [notes, setNotes] = useState('');

  // Modals & Confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // History Tab State
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryInput);
      setSearchPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [queryInput]);

  // Query: Search Products
  const { data: searchResponse, isLoading: isSearchLoading } = useQuery({
    queryKey: ['stock-request-search', debouncedQuery, searchPage],
    queryFn: () =>
      searchService.searchProducts({
        q: debouncedQuery,
        page: searchPage,
        limit: searchLimit
      }),
    enabled: activeTab === 'create'
  });

  const searchData = searchResponse?.data || { totalProducts: 0, products: [] };
  const searchMeta = searchResponse?.meta || { page: 1, limit: searchLimit, totalPages: 1 };
  const searchProducts = searchData.products || [];

  // Query: Stock Requests History
  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['stock-requests-list', historyPage, historyStatus],
    queryFn: () =>
      stockRequestService.getAll({
        page: historyPage,
        limit: 15,
        status: historyStatus !== 'all' ? historyStatus : undefined
      }),
    enabled: activeTab === 'history'
  });

  const historyRequests = historyResponse?.data || [];
  const historyMeta = historyResponse?.meta || { page: 1, limit: 15, totalPages: 1, totalItems: 0 };

  // Cart Calculations
  const stagedList = Object.values(stagedItems);
  const totalDifferentProducts = stagedList.length;
  const totalRequestedUnits = stagedList.reduce(
    (acc, item) => acc + Number(item.requestedQuantity),
    0
  );

  // Add / Increment Product in Cart
  const handleAddToCart = (product, qtyToAdd = 1) => {
    const available = Number(product.quantity) || 0;
    if (available <= 0) return;

    setStagedItems((prev) => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.requestedQuantity : 0;
      const nextQty = Math.min(available, currentQty + qtyToAdd);
      return {
        ...prev,
        [product.id]: {
          product,
          requestedQuantity: Math.max(1, nextQty)
        }
      };
    });
  };

  // Modify Quantity directly
  const handleUpdateQuantity = (productId, newQuantity) => {
    setStagedItems((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const available = Number(existing.product.quantity) || 0;
      const validQty = Math.min(available, Math.max(1, Number(newQuantity) || 1));
      return {
        ...prev,
        [productId]: {
          ...existing,
          requestedQuantity: validQty
        }
      };
    });
  };

  // Remove Product from Cart
  const handleRemoveFromCart = (productId) => {
    setStagedItems((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  // Clear entire staging cart
  const handleClearCart = () => {
    setStagedItems({});
    setNotes('');
    setSubmitError(null);
  };

  // Execute Confirmation & Inventory Deduction
  const handleConfirmRequest = async () => {
    if (stagedList.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create draft request
      const payload = {
        notes: notes.trim() || undefined,
        items: stagedList.map((item) => ({
          productId: item.product.id,
          requestedQuantity: item.requestedQuantity
        }))
      };

      const createRes = await stockRequestService.create(payload);
      const draftId = createRes.data.id;

      // 2. Confirm and deduct stock
      const confirmRes = await stockRequestService.confirm(draftId);
      const confirmed = confirmRes.data;

      // 3. Invalidate TanStack Query caches to reflect updated stock across app
      queryClient.invalidateQueries({ queryKey: ['stock-requests-list'] });
      queryClient.invalidateQueries({ queryKey: ['stock-request-search'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['smart-search'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements-history'] });

      // 4. Update UI State
      setIsConfirmModalOpen(false);
      setConfirmationSuccess(confirmed);
      setStagedItems({});
      setNotes('');
    } catch (err) {
      setSubmitError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm an existing DRAFT from history
  const handleConfirmDraftFromHistory = async (draftId) => {
    try {
      await stockRequestService.confirm(draftId);
      queryClient.invalidateQueries({ queryKey: ['stock-requests-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements-history'] });
      refetchHistory();
      if (selectedHistoryRequest?.id === draftId) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Confirmation failed');
    }
  };

  // Cancel an existing DRAFT from history
  const handleCancelDraftFromHistory = async (draftId) => {
    if (!window.confirm('Are you sure you want to cancel this draft request?')) return;
    try {
      await stockRequestService.cancel(draftId);
      queryClient.invalidateQueries({ queryKey: ['stock-requests-list'] });
      refetchHistory();
      if (selectedHistoryRequest?.id === draftId) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const openHistoryDetails = async (req) => {
    try {
      const full = await stockRequestService.getById(req.id);
      setSelectedHistoryRequest(full.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert(err.message || 'Could not load request details');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Automated Inventory Deduction
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock Request & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search automotive inventory, select required quantities, review availability, and execute atomic transactional deduction.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Request</span>
            {totalDifferentProducts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-extrabold">
                {totalDifferentProducts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Request Ledger</span>
          </button>
        </div>
      </div>

      {/* Confirmation Success Banner */}
      {confirmationSuccess && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Stock Dispatched Successfully!
                </h3>
                <span className="font-mono text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  {confirmationSuccess.request_number}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Deducted {confirmationSuccess.total_quantity} units across {confirmationSuccess.total_items} products. Ground-truth inventory balances and stock movement records have been updated in PostgreSQL.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              to="/history"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <span>View Movement Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setConfirmationSuccess(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: NEW STOCK REQUEST */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search & Product Selection (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Search Input Card */}
            <Card className="p-4 sm:p-5 border border-slate-200/80 bg-white space-y-3.5 shadow-2xs">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search by product name, category, SKU, brand (e.g. 'Car', 'Tyre', 'Michelin', 'Brake')..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                />
                {queryInput && (
                  <button
                    onClick={() => setQueryInput('')}
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Quick Query:
                </span>
                {SUGGESTED_QUERIES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQueryInput(term)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      queryInput.toLowerCase() === term.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/50'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </Card>

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>
                {isSearchLoading ? (
                  'Searching inventory catalog...'
                ) : (
                  <>
                    Showing <strong className="text-slate-900">{searchProducts.length}</strong> of{' '}
                    <strong className="text-slate-900">{formatNumber(searchData.totalProducts)}</strong> matching products
                  </>
                )}
              </span>
              {debouncedQuery && (
                <span className="text-indigo-600 font-semibold">
                  Filtered by: &ldquo;{debouncedQuery}&rdquo;
                </span>
              )}
            </div>

            {/* Search Results Grid */}
            {isSearchLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4 space-y-3 animate-pulse border border-slate-200">
                    <div className="h-28 bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : searchProducts.length === 0 ? (
              <Card className="p-8 border border-slate-200/80 bg-white text-center">
                <EmptyState
                  icon={Search}
                  title="No Matching Products Found"
                  description={`No inventory records matched '${debouncedQuery}'. Try searching for generic automotive keywords like 'Car', 'Tyre', or 'Brake'.`}
                  actionLabel="Clear Search"
                  onAction={() => setQueryInput('')}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchProducts.map((p) => {
                  const statusConfig = getStockStatusConfig(p.stock_status);
                  const isOutOfStock = Number(p.quantity) <= 0;
                  const stagedItem = stagedItems[p.id];
                  const stagedQty = stagedItem ? stagedItem.requestedQuantity : 0;
                  const remainingAvailable = Number(p.quantity) - stagedQty;

                  return (
                    <Card
                      key={p.id}
                      className={`overflow-hidden flex flex-col justify-between border transition-all duration-200 ${
                        stagedItem
                          ? 'border-indigo-400 ring-2 ring-indigo-100 bg-white shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Header Image + Status */}
                        <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-8 h-8" />
                            </div>
                          )}

                          <div className="absolute top-2 right-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${statusConfig.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white shadow-2xs">
                              {p.category}
                            </span>
                          </div>
                        </div>

                        {/* Body Details */}
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200/60">
                              {p.sku}
                            </span>
                            <span className="font-semibold text-slate-600">{p.brand}</span>
                          </div>

                          <h3
                            className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 tracking-tight"
                            title={p.name}
                          >
                            {p.name}
                          </h3>

                          {p.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Stock Level & Quantity Selector */}
                      <div className="p-3.5 pt-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                            Available Units
                          </span>
                          <span className="text-sm font-extrabold font-mono text-slate-900">
                            {formatNumber(p.quantity)}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">{p.unit}</span>
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                            Out of Stock
                          </span>
                        ) : stagedItem ? (
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs">
                            <button
                              onClick={() => {
                                if (stagedQty <= 1) {
                                  handleRemoveFromCart(p.id);
                                } else {
                                  handleUpdateQuantity(p.id, stagedQty - 1);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 font-mono font-black text-xs text-indigo-700 min-w-[24px] text-center">
                              {stagedQty}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(p.id, stagedQty + 1)}
                              disabled={remainingAvailable <= 0}
                              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Plus}
                            onClick={() => handleAddToCart(p, 1)}
                          >
                            Add to Request
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination for Search Results */}
            {searchMeta.totalPages > 1 && (
              <Pagination
                page={searchMeta.page}
                totalPages={searchMeta.totalPages}
                totalItems={searchData.totalProducts}
                limit={searchLimit}
                onPageChange={(newPage) => setSearchPage(newPage)}
              />
            )}
          </div>

          {/* Right Column: Selected Products Staging Drawer (4-5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
            <Card className="p-5 border border-slate-200/80 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 tracking-tight">
                      Selected Products
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {totalDifferentProducts} items staged for dispatch
                    </span>
                  </div>
                </div>

                {totalDifferentProducts > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items List */}
              {stagedList.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700">No Products Selected</h4>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Search from catalogue on the left and select quantities to build your stock request.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {stagedList.map(({ product, requestedQuantity }) => {
                    const available = Number(product.quantity) || 0;
                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-900 truncate" title={product.name}>
                                {product.name}
                              </h4>
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                {product.sku} &middot; {product.category || product.category_name}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors flex-shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stepper + Available Indicator */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-xs">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Avail: <strong className="text-slate-900">{available}</strong> {product.unit}
                          </span>

                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              onClick={() => handleUpdateQuantity(product.id, requestedQuantity - 1)}
                              disabled={requestedQuantity <= 1}
                              className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={available}
                              value={requestedQuantity}
                              onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                              className="w-12 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(product.id, requestedQuantity + 1)}
                              disabled={requestedQuantity >= available}
                              className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Operational Dispatch Notes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Dispatch Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Workshop Service Bay #3, Work Order #8402..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Staging Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Distinct Product Lines:</span>
                  <span className="font-bold text-slate-900">{totalDifferentProducts}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Units to Deduct:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatNumber(totalRequestedUnits)}
                  </span>
                </div>
              </div>

              {/* Confirmation CTA */}
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                disabled={totalDifferentProducts === 0}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Review & Confirm Request
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: REQUEST HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Status Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'CONFIRMED', label: 'Confirmed' },
                { id: 'DRAFT', label: 'Draft' },
                { id: 'CANCELLED', label: 'Cancelled' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setHistoryStatus(tab.id);
                    setHistoryPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    historyStatus === tab.id
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={ShoppingCart}
              onClick={() => setActiveTab('create')}
            >
              New Stock Request
            </Button>
          </div>

          {/* History Table / Cards */}
          <Card className="overflow-hidden border border-slate-200/80 bg-white">
            {isHistoryLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-semibold animate-pulse">
                Loading request ledger records...
              </div>
            ) : historyRequests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Stock Requests Found"
                description="No stock requests have been created matching your selected filter."
                actionLabel="Create Stock Request"
                onAction={() => setActiveTab('create')}
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-4">Request #</th>
                        <th className="py-3.5 px-4">Created Timestamp</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Product Lines</th>
                        <th className="py-3.5 px-4 text-right">Total Units</th>
                        <th className="py-3.5 px-4">Confirmed At</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.request_number}
                            </span>
                            {req.notes && (
                              <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xs">
                                {req.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {formatDate(req.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={
                                req.status === 'CONFIRMED'
                                  ? 'success'
                                  : req.status === 'DRAFT'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                            {req.total_items}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-indigo-700">
                            {formatNumber(req.total_quantity)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {req.confirmed_at ? formatDate(req.confirmed_at) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => openHistoryDetails(req)}
                              >
                                View Details
                              </Button>
                              {req.status === 'DRAFT' && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleConfirmDraftFromHistory(req.id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleCancelDraftFromHistory(req.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards Feed */}
                <div className="md:hidden divide-y divide-slate-100">
                  {historyRequests.map((req) => (
                    <div key={req.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                          {req.request_number}
                        </span>
                        <Badge
                          variant={
                            req.status === 'CONFIRMED'
                              ? 'success'
                              : req.status === 'DRAFT'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">
                            Products
                          </span>
                          <span className="font-bold text-slate-900">{req.total_items} items</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">
                            Total Units
                          </span>
                          <span className="font-mono font-bold text-indigo-700">
                            {formatNumber(req.total_quantity)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Created: {formatDate(req.created_at)}</span>
                        {req.confirmed_at && <span>Confirmed: {formatDate(req.confirmed_at)}</span>}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-center"
                          onClick={() => openHistoryDetails(req)}
                        >
                          View Details
                        </Button>
                        {req.status === 'DRAFT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 justify-center"
                            onClick={() => handleConfirmDraftFromHistory(req.id)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {historyMeta.totalPages > 1 && (
              <Pagination
                page={historyMeta.page}
                totalPages={historyMeta.totalPages}
                totalItems={historyMeta.totalItems}
                limit={historyMeta.limit}
                onPageChange={(p) => setHistoryPage(p)}
              />
            )}
          </Card>
        </div>
      )}

      {/* REVIEW & CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
        title="Confirm Stock Request & Deduct Inventory"
        subtitle="Review the items below before executing transactional stock reduction."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{submitError.message}</span>
              </div>
              {submitError.errors && submitError.errors.length > 0 && (
                <ul className="list-disc pl-5 text-[11px] space-y-0.5 pt-1 text-rose-700 font-normal">
                  {submitError.errors.map((e, idx) => (
                    <li key={idx}>{e.reason || e.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Ground-truth stock deduction:</strong> Confirming this request will immediately deduct the requested units from the warehouse database using row-level transaction locks.
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-right">Requested</th>
                  <th className="py-2.5 px-3 text-right">Projected Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stagedList.map(({ product, requestedQuantity }) => {
                  const avail = Number(product.quantity);
                  const projected = avail - requestedQuantity;
                  return (
                    <tr key={product.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-xs">
                          {product.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{product.sku}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {avail} {product.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        -{requestedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                        {projected} {product.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-medium text-slate-600">Summary:</span>
            <span className="font-bold text-slate-900">
              {totalDifferentProducts} Products &middot; {formatNumber(totalRequestedUnits)} Units Total
            </span>
          </div>

          {notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block mb-1">Dispatch Notes:</span>
              <p className="italic">{notes}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRequest}
              isLoading={isSubmitting}
            >
              Confirm & Deduct Stock
            </Button>
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL FOR HISTORY */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedHistoryRequest?.request_number || 'Stock Request Details'}
        subtitle={`Status: ${selectedHistoryRequest?.status} · Created ${
          selectedHistoryRequest?.created_at ? formatDate(selectedHistoryRequest.created_at) : ''
        }`}
        maxWidth="max-w-2xl"
      >
        {selectedHistoryRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Status</span>
                <Badge
                  variant={
                    selectedHistoryRequest.status === 'CONFIRMED'
                      ? 'success'
                      : selectedHistoryRequest.status === 'DRAFT'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {selectedHistoryRequest.status}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Products</span>
                <span className="font-bold text-slate-900">{selectedHistoryRequest.total_items} items</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Units</span>
                <span className="font-mono font-bold text-indigo-700">
                  {formatNumber(selectedHistoryRequest.total_quantity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Confirmed At</span>
                <span className="text-slate-600">
                  {selectedHistoryRequest.confirmed_at
                    ? formatDate(selectedHistoryRequest.confirmed_at)
                    : 'Unconfirmed'}
                </span>
              </div>
            </div>

            {selectedHistoryRequest.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 block mb-1">Notes:</span>
                <p className="text-slate-700">{selectedHistoryRequest.notes}</p>
              </div>
            )}

            {/* Line items */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name & Category</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Requested Qty</th>
                    <th className="py-2.5 px-3 text-right">Avail at Confirm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedHistoryRequest.items || []).map((item) => (
                    <tr key={item.item_id}>
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/inventory/${item.product_id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-xs"
                        >
                          {item.product_name}
                        </Link>
                        <span className="text-[10px] text-slate-400">{item.category_name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.sku}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {item.requested_quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {item.available_quantity_at_confirmation !== null
                          ? `${item.available_quantity_at_confirmation} ${item.unit}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {selectedHistoryRequest.status === 'DRAFT' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConfirmDraftFromHistory(selectedHistoryRequest.id)}
                  >
                    Confirm & Deduct Now
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancelDraftFromHistory(selectedHistoryRequest.id)}
                  >
                    Cancel Draft
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
