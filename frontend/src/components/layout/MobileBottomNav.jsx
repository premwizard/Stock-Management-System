import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Package, ShoppingCart, Menu } from 'lucide-react';
import { useCheckoutCart } from '../../context/CheckoutCartContext';

export const MobileBottomNav = ({ onOpenMenu }) => {
  const { totalItems } = useCheckoutCart();

  const tabs = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Inventory', path: '/inventory', icon: Package },
    {
      label: 'Requests',
      path: '/stock-requests',
      icon: ShoppingCart,
      badge: totalItems > 0 ? totalItems : null,
      badgeColor: 'bg-emerald-600'
    },
    { label: 'Search', path: '/search', icon: Search },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] flex items-center justify-around select-none">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative min-w-[54px] min-h-[48px] ${
              isActive
                ? 'text-indigo-600 bg-indigo-50/90 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 active:scale-95'
            }`
          }
        >
          <div className="relative">
            <tab.icon className="w-5 h-5 mb-0.5" />
            {tab.badge && (
              <span className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black text-white shadow-xs ${tab.badgeColor || 'bg-indigo-600'}`}>
                {tab.badge}
              </span>
            )}
          </div>
          <span className="truncate max-w-[62px]">{tab.label}</span>
        </NavLink>
      ))}

      {/* More / Menu Drawer Trigger */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 active:scale-95 transition-all min-w-[54px] min-h-[48px] cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 mb-0.5 text-slate-600" />
        <span>Menu</span>
      </button>
    </nav>
  );
};

