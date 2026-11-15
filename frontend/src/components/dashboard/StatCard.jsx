import { Card } from '../common/Card';
import { formatNumber } from '../../utils/formatters';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  badgeText = null,
  isLoading = false
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      badgeBg: 'bg-indigo-100 text-indigo-700'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100 text-emerald-800'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100 text-amber-800'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badgeBg: 'bg-rose-100 text-rose-800'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100 text-blue-800'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badgeBg: 'bg-purple-100 text-purple-800'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <Card className="p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-md mt-1" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {formatNumber(value)}
              </p>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`p-2.5 rounded-xl border ${scheme.bg} ${scheme.text} ${scheme.border} flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <p className="text-slate-500 text-[11px] font-medium truncate">{subtitle}</p>
        {badgeText && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${scheme.badgeBg}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </Card>
  );
};
