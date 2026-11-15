/**
 * Helper mapping stock status to badge colors and friendly labels
 */
export const getStockStatusConfig = (status) => {
  switch (status) {
    case 'in_stock':
      return {
        label: 'In Stock',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-600'
      };
    case 'low_stock':
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-600'
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-600'
      };
    default:
      return {
        label: status || 'Unknown',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400'
      };
  }
};
