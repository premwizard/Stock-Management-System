import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Database, Sparkles, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';

export const Navbar = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState('');

  // Fetch summary to show real-time low-stock alert count in bell
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
    staleTime: 1000 * 30
  });

  const lowStockCount = summaryData?.data?.lowStockCount || 0;
  const outOfStockCount = summaryData?.data?.outOfStockCount || 0;
  const totalAlerts = lowStockCount + outOfStockCount;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Search SKUs, parts... (Press Enter)"
            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl pl-8 sm:pl-9 pr-8 sm:pr-14 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
          />
          <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-1 pointer-events-none">
            <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
              /
            </span>
          </div>
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-2 flex-shrink-0">
        {/* DB Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">PostgreSQL Active</span>
        </div>

        {/* Smart Search Quick Action */}
        <button
          onClick={() => navigate('/search')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Smart Lookup</span>
        </button>

        {/* Notifications / Alerts Pill */}
        <button
          onClick={() => navigate('/inventory?status=low_stock')}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 relative transition-colors cursor-pointer"
          title={totalAlerts > 0 ? `${totalAlerts} items require attention` : 'No active alerts'}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full leading-none shadow-xs">
              {totalAlerts}
            </span>
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            AG
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-bold text-slate-800 leading-tight">Warehouse Admin</p>
            <p className="text-[10px] text-slate-500 font-medium">Operations Center</p>
          </div>
        </div>
      </div>
    </header>
  );
};
