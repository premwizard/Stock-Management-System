export const Select = ({
  label,
  error,
  options = [],
  className = '',
  id,
  placeholder = 'Select an option',
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-xl border text-sm py-2.5 px-3.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-600 focus:ring-indigo-100 shadow-xs'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
    </div>
  );
};
