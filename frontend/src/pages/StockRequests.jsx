import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import { stockRequestService } from '../services/stockRequest.service';
import { vehiclePackageService } from '../services/vehiclePackage.service';
import { useCheckoutCart } from '../context/CheckoutCartContext';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { getStockStatusConfig } from '../utils/stockStatus';
import { formatNumber, formatDate } from '../utils/formatters';
import {
  ShoppingCart,
  Search,
  Zap,
  Package,
  Plus,
  Minus,
  Trash2,
  History,
  ArrowRight,
  X,
  FileText,
  Boxes,
  CheckCircle2,
  Sparkles
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'create' | 'history'
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'create';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Selection Mode inside 'create': 'individual' (Option A) | 'packages' (Option B)
  const [selectionMode, setSelectionMode] = useState('individual');

  // Search state for individual products
  const initialQuery = searchParams.get('q') || '';
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchPage, setSearchPage] = useState(1);
  const searchLimit = 8;

  // Search state for vehicle packages
  const [packageSearchInput, setPackageSearchInput] = useState('');
  const [packageMultipliers, setPackageMultipliers] = useState({});

  // Feedback Toast
  const [feedback, setFeedback] = useState(null);

  // Checkout Cart Context
  const {
    items: cartItems,
    itemsMap,
    totalItems,
    totalUnits,
    addToCart,
    addPackageToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCheckoutCart();

  // History Tab State
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const tabInUrl = searchParams.get('tab');
    if (tabInUrl === 'history' && activeTab !== 'history') {
      setActiveTab('history');
    } else if (!tabInUrl && activeTab !== 'create') {
      setActiveTab('create');
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      setSearchParams({ tab: 'history' });
    } else {
      setSearchParams({});
    }
  };

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryInput);
      setSearchPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [queryInput]);

  // Query: Search Individual Products
  const { data: searchResponse, isLoading: isSearchLoading } = useQuery({
    queryKey: ['stock-request-search', debouncedQuery, searchPage],
    queryFn: () =>
      searchService.searchProducts({
        q: debouncedQuery,
        page: searchPage,
        limit: searchLimit
      }),
    enabled: activeTab === 'create' && selectionMode === 'individual'
  });

  const searchData = searchResponse?.data || { totalProducts: 0, products: [] };
  const searchMeta = searchResponse?.meta || { page: 1, limit: searchLimit, totalPages: 1 };
  const searchProducts = searchData.products || [];

  // Query: Search Vehicle Packages (Option B)
  const { data: packagesResponse, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['stock-request-packages', packageSearchInput],
    queryFn: () =>
      vehiclePackageService.getAll({
        search: packageSearchInput.trim() || undefined,
        isActive: true
      }),
    enabled: activeTab === 'create' && selectionMode === 'packages'
  });

  const availablePackages = packagesResponse?.data || [];

  // Multiplier helper for packages
  const getPackageMultiplier = (pkgId) => packageMultipliers[pkgId] || 1;
  const setPackageMultiplier = (pkgId, val) => {
    setPackageMultipliers((prev) => ({
      ...prev,
      [pkgId]: Math.max(1, Number(val) || 1)
    }));
  };

  // Add complete package to checkout
  const handleAddPackage = async (pkg) => {
    try {
      const mult = getPackageMultiplier(pkg.id);
      const res = await vehiclePackageService.expand(pkg.id, mult);
      const result = addPackageToCart(res.data, mult);

      if (result) {
        setFeedback({
          type: 'success',
          message: `Added ${result.totalUnitsAdded} units (${result.totalItemsInPackage} parts) from "${pkg.name}" (×${mult}) to checkout.`
        });
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to add package'
      });
    }
  };

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
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Checkout Workflow Stepper */}
      {activeTab === 'create' && <CheckoutSteps currentStep={1} />}

      {/* Top Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-slideDown ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              E-Commerce Checkout Workflow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock Request & Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search individual automotive parts or select predefined vehicle packages to add to your checkout dispatch.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Selection & Staging</span>
            {totalItems > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-extrabold">
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('history')}
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

      {/* TAB 1: PRODUCT SEARCH & CART STAGING */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search & Selection (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Option A / Option B Switcher Banner */}
            <div className="p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/70 flex items-center gap-2">
              <button
                onClick={() => setSelectionMode('individual')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectionMode === 'individual'
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Option A — Individual Parts</span>
              </button>
              <button
                onClick={() => setSelectionMode('packages')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectionMode === 'packages'
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span className="flex items-center gap-1.5">
                  Option B — Vehicle Packages
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    Bundles
                  </span>
                </span>
              </button>
            </div>

            {/* MODE 1: OPTION A — INDIVIDUAL PARTS SEARCH */}
            {selectionMode === 'individual' && (
              <>
                {/* Search Input Card */}
                <Card className="p-4 sm:p-5 border border-slate-200/80 bg-white space-y-3.5 shadow-2xs">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Search individual products by name, category, SKU, brand (e.g. 'Car', 'Tyre', 'Michelin')..."
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    {queryInput && (
                      <button
                        onClick={() => setQueryInput('')}
                        className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
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
                      const cartItem = itemsMap[p.id];
                      const inCartQty = cartItem ? cartItem.requestedQuantity : 0;
                      const remainingAvailable = Number(p.quantity) - inCartQty;

                      return (
                        <Card
                          key={p.id}
                          className={`overflow-hidden flex flex-col justify-between border transition-all duration-200 ${
                            cartItem
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

                          {/* Card Footer: Stock Level & Add to Checkout Controls */}
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
                            ) : cartItem ? (
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs">
                                <button
                                  onClick={() => {
                                    if (inCartQty <= 1) {
                                      removeFromCart(p.id);
                                    } else {
                                      updateQuantity(p.id, inCartQty - 1);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Decrease"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2 font-mono font-black text-xs text-indigo-700 min-w-[24px] text-center">
                                  {inCartQty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(p.id, inCartQty + 1)}
                                  disabled={remainingAvailable <= 0}
                                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                                onClick={() => addToCart(p, 1)}
                              >
                                Add to Checkout
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
              </>
            )}

            {/* MODE 2: OPTION B — COMPLETE VEHICLE PACKAGES */}
            {selectionMode === 'packages' && (
              <div className="space-y-4">
                {/* Package Search Input */}
                <Card className="p-4 sm:p-5 border border-slate-200/80 bg-white space-y-3.5 shadow-2xs">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={packageSearchInput}
                      onChange={(e) => setPackageSearchInput(e.target.value)}
                      placeholder="Search predefined vehicle packages (e.g. 'Car Complete Parts Package', 'Maintenance Kit')..."
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    {packageSearchInput && (
                      <button
                        onClick={() => setPackageSearchInput('')}
                        className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Predefined vehicle templates automatically expand all required parts into checkout.
                    </span>
                    <button
                      onClick={() => navigate('/vehicle-packages')}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Manage Packages &rarr;
                    </button>
                  </div>
                </Card>

                {/* Package Cards List */}
                {isPackagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="p-5 space-y-3 animate-pulse border border-slate-200 bg-white">
                        <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                        <div className="h-20 bg-slate-100 rounded-xl"></div>
                      </Card>
                    ))}
                  </div>
                ) : availablePackages.length === 0 ? (
                  <Card className="p-8 border border-slate-200/80 bg-white text-center">
                    <EmptyState
                      icon={Boxes}
                      title="No Vehicle Packages Found"
                      description={`No active vehicle packages matched '${packageSearchInput}'.`}
                      actionLabel="Manage Packages"
                      onAction={() => navigate('/vehicle-packages')}
                    />
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {availablePackages.map((pkg) => {
                      const mult = getPackageMultiplier(pkg.id);
                      const previewItems = pkg.preview_items || [];

                      return (
                        <Card
                          key={pkg.id}
                          className="p-5 border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                                  {pkg.name}
                                </span>
                                <Badge variant="success" size="sm">Template</Badge>
                              </div>
                              {pkg.description && (
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {pkg.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {pkg.item_count} Parts &middot; {pkg.total_parts_quantity} Units / Car
                              </span>
                            </div>
                          </div>

                          {/* Components Preview Table */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Predefined Components in this Package
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {previewItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-bold text-slate-800 block truncate" title={item.name}>
                                      {item.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {item.sku}
                                    </span>
                                  </div>
                                  <div className="font-mono text-right flex-shrink-0">
                                    <span className="font-extrabold text-indigo-700">
                                      {item.requiredQuantity * mult} {item.unit}
                                    </span>
                                    {mult > 1 && (
                                      <span className="block text-[9px] text-slate-400">
                                        ({item.requiredQuantity} × {mult})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Multiplier & Add Complete Package Button */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                              <span className="font-bold text-slate-700">Vehicle Multiplier:</span>
                              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => setPackageMultiplier(pkg.id, mult - 1)}
                                  disabled={mult <= 1}
                                  className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center font-mono font-black text-xs text-indigo-700">
                                  × {mult}
                                </span>
                                <button
                                  onClick={() => setPackageMultiplier(pkg.id, mult + 1)}
                                  className="p-1 rounded text-slate-600 hover:bg-white cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                ({pkg.total_parts_quantity * mult} total units across {mult} vehicle{mult > 1 ? 's' : ''})
                              </span>
                            </div>

                            <Button
                              variant="primary"
                              size="md"
                              icon={ShoppingCart}
                              className="w-full sm:w-auto justify-center"
                              onClick={() => handleAddPackage(pkg)}
                            >
                              Add Complete Package to Checkout
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Checkout Cart Preview (4-5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
            <Card className="p-5 border border-slate-200/80 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 tracking-tight">
                      Checkout Cart
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {totalItems} products staged
                    </span>
                  </div>
                </div>

                {totalItems > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items List */}
              {cartItems.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700">Checkout Cart is Empty</h4>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Select individual parts or add complete vehicle packages from the left to build your dispatch.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate" title={item.name}>
                              {item.name}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-500 font-semibold block">
                              {item.sku} &middot; {item.category}
                            </span>

                            {/* Source Package Tags */}
                            {item.sourcePackages && item.sourcePackages.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.sourcePackages.map((sp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[170px]"
                                    title={sp}
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stepper + Available Indicator */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-xs">
                        <span className="text-[10px] text-slate-500 font-medium">
                          Avail: <strong className="text-slate-900">{item.availableQuantity}</strong> {item.unit}
                        </span>

                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.productId, item.requestedQuantity - 1)}
                            disabled={item.requestedQuantity <= 1}
                            className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-slate-900">
                            {item.requestedQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.requestedQuantity + 1)}
                            className="p-0.5 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Staging Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Distinct Products:</span>
                  <span className="font-bold text-slate-900">{totalItems}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Units Staged:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatNumber(totalUnits)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Action */}
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                disabled={totalItems === 0}
                icon={ArrowRight}
                onClick={() => navigate('/stock-requests/checkout')}
              >
                Proceed to Checkout ({totalItems})
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Floating Bottom Drawer on Mobile when items in cart */}
      {activeTab === 'create' && totalItems > 0 && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-20 flex items-center justify-between gap-3 animate-slideUp">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {totalItems} products selected
            </span>
            <span className="text-[10px] text-indigo-700 font-extrabold">
              {formatNumber(totalUnits)} units staged
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/stock-requests/checkout')}
          >
            Checkout
          </Button>
        </div>
      )}

      {/* TAB 2: REQUEST LEDGER HISTORY */}
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
              onClick={() => handleTabChange('create')}
            >
              Select Products
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
                onAction={() => handleTabChange('create')}
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
                          <span className="font-mono font-extrabold text-indigo-700">
                            {formatNumber(req.total_quantity)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          {formatDate(req.created_at)}
                        </span>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openHistoryDetails(req)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {historyMeta.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  page={historyMeta.page}
                  totalPages={historyMeta.totalPages}
                  totalItems={historyMeta.totalItems}
                  limit={historyMeta.limit}
                  onPageChange={(p) => setHistoryPage(p)}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* DETAIL MODAL FOR HISTORY REQUEST */}
      {selectedHistoryRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Stock Request ${selectedHistoryRequest.request_number}`}
          subtitle={`Created on ${formatDate(selectedHistoryRequest.created_at)}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Status</span>
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
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Products</span>
                <span className="font-bold text-slate-900">{selectedHistoryRequest.total_items} lines</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Units</span>
                <span className="font-mono font-extrabold text-indigo-700">
                  {formatNumber(selectedHistoryRequest.total_quantity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Confirmed At</span>
                <span className="text-slate-700">
                  {selectedHistoryRequest.confirmed_at ? formatDate(selectedHistoryRequest.confirmed_at) : '—'}
                </span>
              </div>
            </div>

            {selectedHistoryRequest.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs">
                <span className="font-bold text-slate-500 block mb-1">Notes:</span>
                <p className="text-slate-800 italic">{selectedHistoryRequest.notes}</p>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Requested Qty</th>
                    <th className="py-2.5 px-3 text-right">Avail at Confirm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedHistoryRequest.items || []).map((item) => (
                    <tr key={item.item_id}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.product_name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{item.sku}</td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                        {item.requested_quantity} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
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
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedHistoryRequest.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmDraftFromHistory(selectedHistoryRequest.id)}
                >
                  Confirm & Deduct Stock
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
