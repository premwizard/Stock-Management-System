import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCheckoutCart } from '../context/CheckoutCartContext';
import { stockRequestService } from '../services/stockRequest.service';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { formatNumber, formatDate } from '../utils/formatters';
import {
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Package,
  FileCheck
} from 'lucide-react';

export default function CheckoutSummary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    items,
    totalItems,
    totalUnits,
    notes,
    setNotes,
    updateQuantity,
    updateAvailableQuantity,
    removeFromCart,
    clearCart
  } = useCheckoutCart();

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Confirmation Dialog State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Handle live quantity change from checkout table
  const handleQuantityChange = (productId, newQty) => {
    updateQuantity(productId, newQty);
    // Invalidate verification if quantities change
    if (verificationResult) {
      setVerificationResult(null);
    }
  };

  // 1. Stock Verification: POST /api/v1/stock-requests/verify
  const handleVerifyStock = async () => {
    if (items.length === 0) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          requestedQuantity: Number(i.requestedQuantity)
        }))
      };

      const res = await stockRequestService.verifyStock(payload);
      const data = res.data;
      setVerificationResult(data);

      // Update local cart items with latest available quantities from DB
      if (data.items) {
        data.items.forEach((item) => {
          updateAvailableQuantity(item.productId, item.availableQuantity);
        });
      }
    } catch (err) {
      setVerificationError(err.message || 'Stock verification query failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Final Confirmation: Atomic PostgreSQL Transaction
  const handleExecuteConfirmation = async () => {
    if (items.length === 0) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      // Step A: Create draft request
      const createRes = await stockRequestService.create({
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          requestedQuantity: Number(i.requestedQuantity)
        }))
      });

      const draftId = createRes.data.id;

      // Step B: Atomically confirm and deduct stock
      const confirmRes = await stockRequestService.confirm(draftId);
      const confirmed = confirmRes.data;

      // Invalidate relevant TanStack Query caches across app
      queryClient.invalidateQueries({ queryKey: ['stock-requests-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['smart-search'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements-history'] });

      // Clear the cart only on success!
      clearCart();
      setIsConfirmModalOpen(false);
      setCompletedOrder(confirmed);
    } catch (err) {
      // On failure, DO NOT clear cart! Highlight latest ground-truth stock
      setConfirmError(err);
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((e) => {
          if (e.productId && e.availableQuantity !== undefined) {
            updateAvailableQuantity(e.productId, e.availableQuantity);
          }
        });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Item verification status lookup helper
  const getItemVerification = (productId) => {
    if (!verificationResult || !verificationResult.items) return null;
    return verificationResult.items.find((i) => i.productId === productId);
  };

  const isVerifiedAndReady = Boolean(
    verificationResult && verificationResult.verified && !verificationResult.hasInsufficientStock
  );

  // Current step calculation:
  // Step 1: Select
  // Step 2: Review (items in cart)
  // Step 3: Verify (if verified)
  // Step 4: Confirm (if completed)
  const currentStep = completedOrder ? 4 : isVerifiedAndReady ? 3 : 2;

  // Render Receipt on Success
  if (completedOrder) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
        <CheckoutSteps currentStep={4} />

        <Card className="p-6 sm:p-8 border border-emerald-200 bg-white shadow-sm space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Official Dispatch Confirmation
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Stock Request Confirmed & Dispatched
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
                Warehouse inventory balances have been decremented. Audit movements recorded in the system ledger.
              </p>
            </div>
          </div>

          {/* Receipt Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Request Number
              </span>
              <span className="font-mono font-extrabold text-sm text-indigo-700">
                {completedOrder.request_number}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Confirmed At
              </span>
              <span className="font-semibold text-slate-800">
                {formatDate(completedOrder.confirmed_at)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Total Products
              </span>
              <span className="font-mono font-extrabold text-sm text-slate-900">
                {completedOrder.total_items} items
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Units Deducted
              </span>
              <span className="font-mono font-extrabold text-sm text-emerald-700">
                {formatNumber(completedOrder.total_quantity)} units
              </span>
            </div>
          </div>

          {/* Dispatched Line Items Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Dispatched Line Items
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4 text-right">Deducted Units</th>
                    <th className="py-3 px-4 text-right">Available at Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(completedOrder.items || []).map((item) => (
                    <tr key={item.item_id}>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.product_name}</span>
                        <span className="text-[10px] text-slate-400">{item.category_name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                        -{item.requested_quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.available_quantity_at_confirmation !== null
                          ? `${item.available_quantity_at_confirmation} ${item.unit}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {completedOrder.notes && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <span className="font-bold text-slate-500 block mb-1">Dispatch Notes:</span>
              <p className="text-slate-800 italic">{completedOrder.notes}</p>
            </div>
          )}

          {/* Receipt Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/stock-requests"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors text-center"
            >
              Start New Request
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none justify-center"
                onClick={() => navigate('/history')}
              >
                Movement Ledger
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-none justify-center"
                onClick={() => navigate('/inventory')}
              >
                Inventory Catalogue
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render Empty State if no items in checkout cart
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
        <CheckoutSteps currentStep={1} />
        <Card className="p-10 border border-slate-200/80 bg-white text-center">
          <EmptyState
            icon={ShoppingCart}
            title="Your Checkout Cart is Empty"
            description="You haven't added any products to checkout yet. Browse the inventory catalogue to search and select products."
            actionLabel="Browse Catalogue"
            onAction={() => navigate('/stock-requests')}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Checkout Progress Stepper */}
      <CheckoutSteps currentStep={currentStep} />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/stock-requests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Selecting Products</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout Summary & Stock Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review staged quantities, verify real-time warehouse availability, and confirm final stock deduction.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Clear Cart
        </button>
      </div>

      {/* Alerts & Verification Warnings */}
      {verificationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{verificationError}</span>
        </div>
      )}

      {verificationResult && verificationResult.hasInsufficientStock && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Stock Availability Notice</span>
          </div>
          <p className="leading-relaxed">
            One or more items in your cart exceed currently available warehouse stock. Please review the highlighted products below and reduce requested quantities before verifying again.
          </p>
        </div>
      )}

      {isVerifiedAndReady && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">
                Stock Verified Successfully!
              </p>
              <p className="text-emerald-700 text-[11px] mt-0.5">
                All {totalItems} items ({totalUnits} units) are currently available in warehouse storage.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            Ready to Confirm
          </span>
        </div>
      )}

      {/* Main Grid: Products Table + Summary Side Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Summary Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-right">Available</th>
                    <th className="py-3 px-4 text-center">Requested Qty</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const verification = getItemVerification(item.productId);
                    const hasShortage = verification ? !verification.sufficientStock : false;
                    const available = verification ? verification.availableQuantity : item.availableQuantity;

                    return (
                      <tr
                        key={item.productId}
                        className={`transition-colors ${
                          hasShortage ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate max-w-xs">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.brand} &middot; {item.category}
                                </span>
                                {item.sourcePackages && item.sourcePackages.map((sp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 text-[11px]">
                            {item.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          <strong className="text-slate-900">{available}</strong> {item.unit}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.requestedQuantity - 1)}
                              disabled={item.requestedQuantity <= 1}
                              className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.requestedQuantity}
                              onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                              className="w-12 text-center font-mono font-extrabold text-xs text-slate-900 bg-white rounded-lg py-0.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.requestedQuantity + 1)}
                              className="p-1 rounded text-slate-600 hover:bg-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {verification ? (
                            verification.sufficientStock ? (
                              <Badge variant="success">Available</Badge>
                            ) : (
                              <Badge variant="danger">
                                Deficit: {verification.deficit} {item.unit}
                              </Badge>
                            )
                          ) : (
                            <Badge variant="default">Pending Verification</Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove from checkout"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="sm:hidden divide-y divide-slate-100">
              {items.map((item) => {
                const verification = getItemVerification(item.productId);
                const hasShortage = verification ? !verification.sufficientStock : false;
                const available = verification ? verification.availableQuantity : item.availableQuantity;

                return (
                  <div
                    key={item.productId}
                    className={`p-4 space-y-3 ${hasShortage ? 'bg-rose-50/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-500 font-semibold block">
                            {item.sku} &middot; {item.category}
                          </span>
                          {item.sourcePackages && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.sourcePackages.map((sp, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100"
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Available
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {available} {item.unit}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Status
                        </span>
                        {verification ? (
                          verification.sufficientStock ? (
                            <Badge variant="success">Available</Badge>
                          ) : (
                            <Badge variant="danger">Deficit: {verification.deficit}</Badge>
                          )
                        ) : (
                          <Badge variant="default">Unverified</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-slate-600">
                        Requested Quantity:
                      </span>
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.requestedQuantity - 1)}
                          disabled={item.requestedQuantity <= 1}
                          className="p-1 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center font-mono font-bold text-xs text-slate-900">
                          {item.requestedQuantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.requestedQuantity + 1)}
                          className="p-1 rounded text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dispatch Operational Notes */}
          <Card className="p-4 sm:p-5 border border-slate-200/80 bg-white space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Operational Dispatch Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Workshop Service Bay #3, Work Order #8402, Customer invoice #..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </Card>
        </div>

        {/* Right Column: Checkout Summary & Action Card (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <Card className="p-5 sm:p-6 border border-slate-200/80 bg-white shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Order Summary
              </h2>
              <p className="text-xs text-slate-500">
                Review items and verify ground-truth inventory
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Distinct Products:</span>
                <span className="font-bold text-slate-900">{totalItems}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Units to Deduct:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  {formatNumber(totalUnits)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span>Stock Verification:</span>
                {isVerifiedAndReady ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Ready
                  </span>
                ) : verificationResult?.hasInsufficientStock ? (
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Insufficient Stock
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600">Not Verified Yet</span>
                )}
              </div>
            </div>

            {/* Action 1: Verify Stock Button */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                variant={isVerifiedAndReady ? 'outline' : 'primary'}
                size="md"
                className="w-full justify-center"
                icon={isVerifiedAndReady ? CheckCircle2 : ShieldCheck}
                onClick={handleVerifyStock}
                isLoading={isVerifying}
              >
                {isVerifiedAndReady ? 'Re-Verify Ground-Truth Stock' : 'Verify Stock Availability'}
              </Button>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Checks live PostgreSQL inventory records without reserving or altering quantities.
              </p>
            </div>

            {/* Action 2: Confirm & Deduct Stock Button */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                className={`w-full justify-center ${
                  isVerifiedAndReady
                    ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-200'
                    : ''
                }`}
                icon={FileCheck}
                disabled={!isVerifiedAndReady}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Confirm & Deduct Stock
              </Button>

              {!isVerifiedAndReady && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 text-center">
                  Click &ldquo;Verify Stock Availability&rdquo; first to enable final confirmation.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* FINAL CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isConfirming && setIsConfirmModalOpen(false)}
        title="Execute Final Inventory Deduction"
        subtitle="Review final quantities before executing the database transaction."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {confirmError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{confirmError.message}</span>
              </div>
              {confirmError.errors && (
                <ul className="list-disc pl-5 text-[11px] space-y-0.5 pt-1 text-rose-700 font-normal">
                  {confirmError.errors.map((e, idx) => (
                    <li key={idx}>{e.reason || e.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>ACID Transaction Notice:</strong> Confirming this checkout will acquire exclusive row-level locks on the selected inventory items, decrement warehouse quantities, and create immutable <code>OUT</code> stock movement records in PostgreSQL.
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-right">Deduction</th>
                  <th className="py-2.5 px-3 text-right">Projected Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const avail = Number(item.availableQuantity);
                  const req = Number(item.requestedQuantity);
                  const projected = avail - req;
                  return (
                    <tr key={item.productId}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-xs">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-500">{item.sku}</span>
                          {item.sourcePackages && item.sourcePackages.map((sp, idx) => (
                            <span
                              key={idx}
                              className="px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-50 text-indigo-700"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {avail} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        -{req}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                        {projected} {item.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-medium text-slate-600">Final Deductions:</span>
            <span className="font-bold text-slate-900">
              {totalItems} Products &middot; {formatNumber(totalUnits)} Units Total
            </span>
          </div>

          {notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block mb-1">Dispatch Notes:</span>
              <p className="italic text-slate-800">{notes}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteConfirmation}
              isLoading={isConfirming}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Checkout & Deduct Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
