import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { categoryService } from '../services/category.service';
import { StatCard } from '../components/dashboard/StatCard';
import { CategoryDistributionChart } from '../components/dashboard/CategoryDistributionChart';
import { RecentMovementsCard } from '../components/dashboard/RecentMovementsCard';
import { LowStockAlertCard } from '../components/dashboard/LowStockAlertCard';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { StockActionModal } from '../components/inventory/StockActionModal';
import {
  Package,
  Layers,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Search,
  Plus,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Link } from 'react-router-dom';
import { formatNumber } from '../utils/formatters';

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Modals state for fast dashboard actions
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isFetching: isSummaryFetching
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary
  });

  const {
    data: distData,
    isLoading: isDistLoading
  } = useQuery({
    queryKey: ['dashboard-distribution'],
    queryFn: dashboardService.getCategoryDistribution
  });

  const {
    data: movementsData,
    isLoading: isMovementsLoading
  } = useQuery({
    queryKey: ['dashboard-recent-movements'],
    queryFn: () => dashboardService.getRecentMovements(10)
  });

  const {
    data: lowStockData,
    isLoading: isLowStockLoading
  } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => dashboardService.getLowStock(10)
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getAll(false)
  });

  const summary = summaryData?.data || {};
  const distribution = distData?.data || [];
  const movements = movementsData?.data || [];
  const lowStockItems = lowStockData?.data || [];
  const categories = categoriesData?.data || [];

  // Compute Health Metrics
  const totalProducts = summary.totalProducts || 0;
  const inStockCount = summary.inStockCount || 0;
  const lowStockCount = summary.lowStockCount || 0;
  const outOfStockCount = summary.outOfStockCount || 0;

  const inStockPct = totalProducts > 0 ? ((inStockCount / totalProducts) * 100).toFixed(1) : 0;
  const lowStockPct = totalProducts > 0 ? ((lowStockCount / totalProducts) * 100).toFixed(1) : 0;
  const outOfStockPct = totalProducts > 0 ? ((outOfStockCount / totalProducts) * 100).toFixed(1) : 0;

  const handleRestockProduct = (item) => {
    setSelectedStockProduct({
      id: item.product_id,
      name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit
    });
    setIsStockModalOpen(true);
  };

  const handleRefreshAll = () => {
    refetchSummary();
    queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-recent-movements'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-4">
      {/* Top Banner / Executive Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Warehouse Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Zap className="w-3 h-3 text-indigo-600" />
              <span>Real-Time Engine</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated warehouse metrics, single-query smart indexing, and verified PostgreSQL transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            isLoading={isSummaryFetching}
            icon={RefreshCw}
            className="flex-1 sm:flex-initial min-h-[40px] justify-center"
          >
            Refresh
          </Button>
          <Link to="/search" className="flex-1 sm:flex-initial">
            <Button variant="secondary" size="sm" icon={Search} className="w-full sm:w-auto min-h-[40px] justify-center">
              Search
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsProductModalOpen(true)}
            className="flex-1 sm:flex-initial min-h-[40px] justify-center"
          >
            + Product
          </Button>
        </div>
      </div>

      {/* 6 Key Stat Cards Grid: 2 columns on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total SKUs"
          value={summary.totalProducts}
          subtitle="Catalogue items"
          icon={Package}
          color="indigo"
          badgeText="Active"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Stock Volume"
          value={summary.totalStockUnits}
          subtitle="Warehouse units"
          icon={Layers}
          color="blue"
          badgeText="Storage"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Categories"
          value={summary.totalCategories}
          subtitle="Auto divisions"
          icon={FolderTree}
          color="purple"
          badgeText="Divisions"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Healthy Stock"
          value={summary.inStockCount}
          subtitle="Above threshold"
          icon={CheckCircle2}
          color="emerald"
          badgeText={`${inStockPct}%`}
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Low Stock"
          value={summary.lowStockCount}
          subtitle="Replenish"
          icon={AlertTriangle}
          color="amber"
          badgeText={`${lowStockPct}%`}
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Out of Stock"
          value={summary.outOfStockCount}
          subtitle="0 units"
          icon={AlertOctagon}
          color="rose"
          badgeText={`${outOfStockPct}%`}
          isLoading={isSummaryLoading}
        />
      </div>

      {/* Warehouse Health Index Ratio Widget */}
      <Card className="p-4 sm:p-5 border border-slate-200/80 bg-gradient-to-r from-white via-slate-50/50 to-indigo-50/20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Catalogue Health Assessment</h3>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {inStockPct}% Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of active catalogue meeting minimum safety thresholds
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-semibold">
            <Link
              to="/inventory?status=in_stock"
              className="flex items-center gap-1.5 text-emerald-700 hover:underline"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>In Stock: {formatNumber(inStockCount)} ({inStockPct}%)</span>
            </Link>
            <Link
              to="/inventory?status=low_stock"
              className="flex items-center gap-1.5 text-amber-700 hover:underline"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Low: {formatNumber(lowStockCount)} ({lowStockPct}%)</span>
            </Link>
            <Link
              to="/inventory?status=out_of_stock"
              className="flex items-center gap-1.5 text-rose-700 hover:underline"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Depleted: {formatNumber(outOfStockCount)} ({outOfStockPct}%)</span>
            </Link>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full mt-3 sm:mt-4 flex overflow-hidden shadow-inner">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${inStockPct}%` }}
            title={`Healthy: ${inStockPct}%`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${lowStockPct}%` }}
            title={`Low Stock: ${lowStockPct}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${outOfStockPct}%` }}
            title={`Depleted: ${outOfStockPct}%`}
          />
        </div>
      </Card>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2">
          <CategoryDistributionChart data={distribution} isLoading={isDistLoading} />
        </div>
        <div className="lg:col-span-1">
          <LowStockAlertCard
            items={lowStockItems}
            isLoading={isLowStockLoading}
            onRestockClick={handleRestockProduct}
          />
        </div>
      </div>

      {/* Transactional Audit Grid */}
      <div className="grid grid-cols-1 gap-6">
        <RecentMovementsCard movements={movements} isLoading={isMovementsLoading} />
      </div>

      {/* Modals for Fast Operations */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        categories={categories}
      />

      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedStockProduct(null);
        }}
        product={selectedStockProduct}
        initialAction="IN"
      />
    </div>
  );
}
