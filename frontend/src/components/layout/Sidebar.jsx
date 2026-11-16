import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Search,
  ShoppingCart,
  FolderTree,
  History,
  Settings,
  Layers,
  ArrowUpRight,
  X,
  Boxes
} from 'lucide-react';

export const Sidebar = ({ onNavigate, onClose, isMobile = false }) => {
  const mainNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Smart Search', path: '/search', icon: Search, badge: 'FAST', badgeColor: 'bg-indigo-600' },
    { label: 'Stock Request', path: '/stock-requests', icon: ShoppingCart },
    { label: 'Vehicle Packages', path: '/vehicle-packages', icon: Boxes, badge: 'BUNDLES', badgeColor: 'bg-emerald-600' },
    { label: 'Inventory Catalogue', path: '/inventory', icon: Package }
  ];

  const managementItems = [
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Stock Movement Ledger', path: '/history', icon: History }
  ];

  const systemItems = [
    { label: 'Diagnostics & Settings', path: '/settings', icon: Settings }
  ];

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  const renderLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      onClick={handleLinkClick}
      className={({ isActive }) =>
        `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
          isActive
            ? 'bg-indigo-50/90 text-indigo-700 shadow-xs border border-indigo-100 font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <item.icon className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span
          className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md text-white ${
            item.badgeColor || 'bg-indigo-600'
          }`}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between h-full select-none ${
        isMobile ? 'w-72' : 'hidden lg:flex w-64 flex-shrink-0 h-screen sticky top-0 shadow-xs'
      }`}
    >
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <NavLink to="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-sm shadow-indigo-200 group-hover:shadow-md transition-shadow">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  StockPulse
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                Enterprise v1.0
              </span>
            </div>
          </NavLink>

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          {/* Main / Core Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Core Operations
            </p>
            {mainNavItems.map(renderLink)}
          </div>

          {/* Management Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Inventory & Audit
            </p>
            {managementItems.map(renderLink)}
          </div>

          {/* System Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              System
            </p>
            {systemItems.map(renderLink)}
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs">Warehouse Node</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              PostgreSQL 18
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
            Single-source ACID inventory ledger with row-level transaction locks.
          </p>
          <NavLink
            to="/settings"
            onClick={handleLinkClick}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Run diagnostics</span>
            <ArrowUpRight className="w-3 h-3" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
