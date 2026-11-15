import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Try adjusting your search criteria or add new items.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
        <Icon className="w-8 h-8" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

