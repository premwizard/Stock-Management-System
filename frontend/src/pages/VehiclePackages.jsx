import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { vehiclePackageService } from '../services/vehiclePackage.service';
import { searchService } from '../services/search.service';
import { useCheckoutCart } from '../context/CheckoutCartContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  Edit2,
  Package,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function VehiclePackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addPackageToCart } = useCheckoutCart();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Multiplier per package card: { [packageId]: number }
  const [multipliers, setMultipliers] = useState({});

  // Notification Banner
  const [feedback, setFeedback] = useState(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form State inside Modal
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formComponents, setFormComponents] = useState([]); // Array of { productId, name, sku, unit, requiredQuantity }

  // Component Search inside Modal
  const [productSearchInput, setProductSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  // Query: Fetch Packages
  const { data: packagesResponse, isLoading } = useQuery({
    queryKey: ['vehicle-packages-list', searchQuery, statusFilter],
    queryFn: () =>
      vehiclePackageService.getAll({
        search: searchQuery.trim() || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      })
  });

  const packages = packagesResponse?.data || [];

  // Query: Search Products for Modal Component Selector
  const { data: searchProductResponse, isLoading: isProductSearching } = useQuery({
    queryKey: ['modal-product-search', productSearchInput],
    queryFn: () => searchService.searchProducts({ q: productSearchInput, limit: 6 }),
    enabled: isModalOpen && productSearchInput.trim().length > 1
  });

  const searchProductResults = searchProductResponse?.data?.products || [];

  // Multiplier handler
  const getMultiplier = (pkgId) => multipliers[pkgId] || 1;
  const setMultiplier = (pkgId, val) => {
    setMultipliers((prev) => ({
      ...prev,
      [pkgId]: Math.max(1, Number(val) || 1)
    }));
  };

  // Add package to checkout cart
  const handleAddPackageToCheckout = async (pkg) => {
    try {
      const mult = getMultiplier(pkg.id);
      // Retrieve ground-truth calculated expanded package from backend
      const res = await vehiclePackageService.expand(pkg.id, mult);
      const expanded = res.data;

      const result = addPackageToCart(expanded, mult);
      if (result) {
        setFeedback({
          type: 'success',
          message: `Added ${result.totalUnitsAdded} units (${result.totalItemsInPackage} parts) from "${pkg.name}" (×${mult}) to checkout.`
        });
        setTimeout(() => setFeedback(null), 6000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to add package to checkout'
      });
    }
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setFormComponents([]);
    setProductSearchInput('');
    setIsDropdownOpen(false);
    setSelectedProductToAdd(null);
    setQuantityToAdd(1);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = async (pkg) => {
    try {
      const res = await vehiclePackageService.getById(pkg.id);
      const fullPkg = res.data;
      setEditingPackage(fullPkg);
      setFormName(fullPkg.name);
      setFormDescription(fullPkg.description || '');
      setFormIsActive(fullPkg.is_active);
      setFormComponents(
        (fullPkg.items || []).map((i) => ({
          productId: i.product_id,
          name: i.product_name,
          sku: i.sku,
          unit: i.unit,
          requiredQuantity: i.required_quantity
        }))
      );
      setProductSearchInput('');
      setIsDropdownOpen(false);
      setSelectedProductToAdd(null);
      setQuantityToAdd(1);
      setModalError(null);
      setIsModalOpen(true);
    } catch (err) {
      alert(err.message || 'Could not load package details for editing');
    }
  };

  // Delete Package
  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Are you sure you want to delete package "${pkg.name}"?`)) return;
    try {
      await vehiclePackageService.delete(pkg.id);
      queryClient.invalidateQueries({ queryKey: ['vehicle-packages-list'] });
      setFeedback({ type: 'success', message: `Vehicle package "${pkg.name}" deleted successfully.` });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      alert(err.message || 'Failed to delete package');
    }
  };

  // Add component product inside Modal
  const handleAddComponentToForm = () => {
    if (!selectedProductToAdd) return;
    if (formComponents.some((c) => c.productId === selectedProductToAdd.id)) {
      setModalError('This product is already added as a component');
      return;
    }

    setFormComponents((prev) => [
      ...prev,
      {
        productId: selectedProductToAdd.id,
        name: selectedProductToAdd.name,
        sku: selectedProductToAdd.sku,
        unit: selectedProductToAdd.unit || 'pcs',
        requiredQuantity: Math.max(1, Number(quantityToAdd) || 1)
      }
    ]);

    setSelectedProductToAdd(null);
    setProductSearchInput('');
    setIsDropdownOpen(false);
    setQuantityToAdd(1);
    setModalError(null);
  };

  // Remove component product inside Modal
  const handleRemoveComponentFromForm = (productId) => {
    setFormComponents((prev) => prev.filter((c) => c.productId !== productId));
  };

  // Save Package (Create or Update)
  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Package name is required');
      return;
    }
    if (formComponents.length === 0) {
      setModalError('At least one component product is required in the package');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      isActive: formIsActive,
      items: formComponents.map((c) => ({
        productId: c.productId,
        requiredQuantity: Number(c.requiredQuantity)
      }))
    };

    try {
      if (editingPackage) {
        await vehiclePackageService.update(editingPackage.id, payload);
      } else {
        await vehiclePackageService.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ['vehicle-packages-list'] });
      setIsModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Package "${formName.trim()}" successfully ${editingPackage ? 'updated' : 'created'}!`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setModalError(err.message || 'Failed to save vehicle package');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner / Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-slideDown ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <Boxes className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate('/stock-requests/checkout')}
              className="bg-white"
            >
              Go to Checkout
            </Button>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1 shadow-2xs">
              <Boxes className="w-3 h-3 text-indigo-600" />
              Automated Vehicle Bundles
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Packages & Parts Kits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Predefined vehicle repair kits and maintenance bundles referencing live catalog inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="md"
            icon={ShoppingCart}
            onClick={() => navigate('/stock-requests')}
          >
            Stock Requests
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenCreateModal}
          >
            Create Vehicle Package
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages by name, description, or component..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Packages' },
            { id: 'active', label: 'Active Only' },
            { id: 'inactive', label: 'Inactive' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse border border-slate-200 bg-white">
              <div className="h-6 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-24 bg-slate-100 rounded-xl"></div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
            </Card>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card className="p-10 border border-slate-200 bg-white text-center">
          <EmptyState
            icon={Boxes}
            title="No Vehicle Packages Found"
            description="No packages match your search filters. Create a new vehicle package to bundle required parts together."
            actionLabel="Create Vehicle Package"
            onAction={handleOpenCreateModal}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {packages.map((pkg) => {
            const mult = getMultiplier(pkg.id);
            const previewItems = pkg.preview_items || [];

            return (
              <Card
                key={pkg.id}
                className="overflow-hidden border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={pkg.is_active ? 'success' : 'default'}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {pkg.item_count} Parts
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 tracking-tight line-clamp-1" title={pkg.name}>
                        {pkg.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(pkg)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 hover:text-indigo-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer"
                        title="Edit Package"
                        aria-label="Edit Package"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-500 hover:text-rose-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                        title="Delete Package"
                        aria-label="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  )}

                  {/* Component Breakdown Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Included Components</span>
                      <span className="font-mono text-indigo-700">
                        {pkg.total_parts_quantity} units / vehicle
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {previewItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="font-semibold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                            <span className="font-extrabold text-indigo-700">
                              {item.requiredQuantity} {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (stock: {item.availableQuantity})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Multiplier & Add Action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Vehicle Multiplier:</span>
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        onClick={() => setMultiplier(pkg.id, mult - 1)}
                        disabled={mult <= 1}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        aria-label="Decrease multiplier"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-mono font-black text-xs text-indigo-700">
                        × {mult}
                      </span>
                      <button
                        onClick={() => setMultiplier(pkg.id, mult + 1)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 cursor-pointer"
                        aria-label="Increase multiplier"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center min-h-[44px] font-bold"
                    icon={ShoppingCart}
                    disabled={!pkg.is_active}
                    onClick={() => handleAddPackageToCheckout(pkg)}
                  >
                    Add Complete Package ({pkg.total_parts_quantity * mult} Units)
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingPackage ? 'Edit Vehicle Package' : 'Create Vehicle Package'}
        subtitle="Define a reusable parts bundle template referencing existing catalog products."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePackage} className="space-y-5">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Package Name & Active Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Package Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Car Complete Parts Package"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="formIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                Active in Checkout
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description / Notes
            </label>
            <textarea
              rows="2"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Standard 60,000 km maintenance kit for sedans..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Component Search & Selector */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Select Products as Components
              </span>
              <span className="text-[10px] text-slate-400">Search existing inventory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-7 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearchInput}
                  onChange={(e) => {
                    setProductSearchInput(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (productSearchInput.trim().length > 1) setIsDropdownOpen(true);
                  }}
                  placeholder="Search catalogue (e.g. 'Tyre', 'Brake', 'Filter')..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {productSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearchInput('');
                      setSelectedProductToAdd(null);
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                {/* Dropdown Results */}
                {isDropdownOpen && productSearchInput.trim().length > 1 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                    {isProductSearching ? (
                      <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
                    ) : searchProductResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No matching products found</div>
                    ) : (
                      searchProductResults.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            setSelectedProductToAdd(p);
                            setProductSearchInput(`${p.name} (${p.sku})`);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left p-3 hover:bg-indigo-50/70 active:bg-indigo-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-semibold">
                              {p.sku} &middot; {p.category} &middot; Stock: {p.quantity} {p.unit}
                            </span>
                          </div>
                          <Badge variant="default" size="sm">Select</Badge>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-3 flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 pl-2 uppercase">Qty:</span>
                <input
                  type="number"
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-center font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none py-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center min-h-[40px] font-bold"
                  disabled={!selectedProductToAdd}
                  onClick={handleAddComponentToForm}
                >
                  Add Part
                </Button>
              </div>
            </div>

            {/* Configured Components Table */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                <span>Configured Package Items ({formComponents.length})</span>
                <span>
                  Total Units: {formComponents.reduce((acc, c) => acc + Number(c.requiredQuantity), 0)}
                </span>
              </div>

              {formComponents.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No components added yet. Search products above and click &ldquo;Add Part&rdquo;.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {formComponents.map((comp) => (
                    <div
                      key={comp.productId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 block truncate">{comp.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">{comp.sku}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={comp.requiredQuantity}
                            onChange={(e) => {
                              const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setFormComponents((prev) =>
                                prev.map((item) =>
                                  item.productId === comp.productId
                                    ? { ...item, requiredQuantity: newQty }
                                    : item
                                )
                              );
                            }}
                            className="w-10 text-center font-mono font-extrabold text-xs text-indigo-700 bg-transparent focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">{comp.unit}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveComponentFromForm(comp.productId)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          aria-label="Remove part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              icon={ArrowRight}
              className="w-full sm:w-auto min-h-[44px] justify-center font-bold"
            >
              {editingPackage ? 'Update Package' : 'Save Vehicle Package'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
