/**
 * Helper mapping stock status to badge colors and friendly labels
 */
export const getStockStatusConfig = (status) => {
  switch (status) {
    case 'in_stock':
      return {
        label: 'In Stock',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        dotClass: 'bg-emerald-500'
      };
    case 'low_stock':
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        dotClass: 'bg-amber-500'
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        dotClass: 'bg-rose-500'
      };
    default:
      return {
        label: status || 'Unknown',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
  }
};

