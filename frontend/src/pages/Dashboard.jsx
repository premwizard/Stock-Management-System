import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { StatCard } from '../components/dashboard/StatCard';
import { CategoryDistributionChart } from '../components/dashboard/CategoryDistributionChart';
import { RecentMovementsCard } from '../components/dashboard/RecentMovementsCard';
import { LowStockAlertCard } from '../components/dashboard/LowStockAlertCard';
import {
  Package,
  Layers,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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

  const summary = summaryData?.data || {};
  const distribution = distData?.data || [];
  const movements = movementsData?.data || [];
  const lowStockItems = lowStockData?.data || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time warehouse KPIs, multi-category stock allocation, and transactional audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSummary()}
            isLoading={isSummaryFetching}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Link to="/search">
            <Button variant="secondary" size="sm" icon={Search}>
              Smart Search
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="primary" size="sm" icon={Plus}>
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Products"
          value={summary.totalProducts}
          subtitle="Active SKUs catalogue"
          icon={Package}
          color="indigo"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Total Stock Units"
          value={summary.totalStockUnits}
          subtitle="Sum of warehouse units"
          icon={Layers}
          color="blue"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Categories"
          value={summary.totalCategories}
          subtitle="Product classifications"
          icon={FolderTree}
          color="purple"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="In Stock"
          value={summary.inStockCount}
          subtitle="Above threshold"
          icon={CheckCircle2}
          color="emerald"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Low Stock"
          value={summary.lowStockCount}
          subtitle="Re-order attention needed"
          icon={AlertTriangle}
          color="amber"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Out of Stock"
          value={summary.outOfStockCount}
          subtitle="Zero available stock"
          icon={AlertOctagon}
          color="rose"
          isLoading={isSummaryLoading}
        />
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategoryDistributionChart data={distribution} isLoading={isDistLoading} />
        </div>
        <div className="lg:col-span-1">
          <LowStockAlertCard items={lowStockItems} isLoading={isLowStockLoading} />
        </div>
      </div>

      {/* Recent Activity Table Card */}
      <div className="grid grid-cols-1 gap-6">
        <RecentMovementsCard movements={movements} isLoading={isMovementsLoading} />
      </div>
    </div>
  );
}
