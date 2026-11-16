import { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all z-10 animate-slideUp sm:animate-none`}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50/50">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4.5 sm:px-6 py-3.5 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 pb-safe">{children}</div>
      </div>
    </div>
  );
};
