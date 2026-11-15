import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Package, History, Menu } from 'lucide-react';

export const MobileBottomNav = ({ onOpenMenu }) => {
  const tabs = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Search', path: '/search', icon: Search, badge: 'PRO' },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Ledger', path: '/history', icon: History }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all relative min-w-[56px] ${
              isActive
                ? 'text-indigo-600 bg-indigo-50/80 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 active:scale-95'
            }`
          }
        >
          <div className="relative">
            <tab.icon className="w-5 h-5 mb-0.5" />
            {tab.badge && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-black bg-indigo-600 text-white">
                {tab.badge}
              </span>
            )}
          </div>
          <span className="truncate max-w-[64px]">{tab.label}</span>
        </NavLink>
      ))}

      {/* More / Menu Drawer Trigger */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 active:scale-95 transition-all min-w-[56px] cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 mb-0.5 text-slate-600" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
