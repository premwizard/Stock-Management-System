export const Badge = ({ children, variant = 'default', dot = false, className = '' }) => {
  const variantStyles = {
    default:
      'bg-slate-100 text-slate-700 border-slate-200/80',
    primary:
      'bg-indigo-50 text-indigo-700 border-indigo-200',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200',
    sky:
      'bg-sky-50 text-sky-700 border-sky-200'
  };

  const dotColors = {
    default: 'bg-slate-500',
    primary: 'bg-indigo-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    purple: 'bg-purple-600',
    sky: 'bg-sky-600'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs select-none ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        ></span>
      )}
      {children}
    </span>
  );
};
