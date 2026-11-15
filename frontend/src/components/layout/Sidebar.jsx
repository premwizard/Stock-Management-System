import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Search,
  FolderTree,
  History,
  Settings,
  Layers
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Smart Search', path: '/search', icon: Search, badge: 'PRO' },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Stock History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 transition-colors duration-150">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-300 dark:shadow-none">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                StockPulse
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                Enterprise
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Stock System v1.0</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">PostgreSQL 18 &middot; Connected</p>
        </div>
      </div>
    </aside>
  );
};

