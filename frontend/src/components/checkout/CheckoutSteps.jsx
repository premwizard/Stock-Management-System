import { Check, Search, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  { id: 1, key: 'select', label: 'Select Products', shortLabel: 'Select', icon: Search, path: '/stock-requests' },
  { id: 2, key: 'review', label: 'Review Summary', shortLabel: 'Review', icon: FileText, path: '/stock-requests/checkout' },
  { id: 3, key: 'verify', label: 'Verify Stock', shortLabel: 'Verify', icon: ShieldCheck },
  { id: 4, key: 'confirm', label: 'Deduct Inventory', shortLabel: 'Confirm', icon: CheckCircle2 }
];

export const CheckoutSteps = ({ currentStep = 1 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-4 shadow-2xs">
      <div className="flex items-start justify-between max-w-3xl mx-auto relative">
        {/* Background track line aligned through circle centers */}
        <div className="absolute top-4 sm:top-4.5 left-6 right-6 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute top-4 sm:top-4.5 left-6 h-0.5 bg-indigo-600 transition-all duration-300 z-0"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100))}%`
          }}
        />

        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          const StepCircle = (
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 z-10 ${
                isDone
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isActive
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                  : 'bg-white border-2 border-slate-300 text-slate-400'
              }`}
            >
              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
            </div>
          );

          return (
            <div key={step.id} className="flex flex-col items-center group relative z-10 flex-1 min-w-0">
              {step.path && currentStep > step.id ? (
                <Link to={step.path} className="flex flex-col items-center cursor-pointer max-w-full">
                  {StepCircle}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 mt-1 text-center truncate max-w-full">
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center max-w-full">
                  {StepCircle}
                  <span
                    className={`text-[10px] sm:text-xs font-bold mt-1 text-center truncate max-w-full ${
                      isActive
                        ? 'text-indigo-700 font-extrabold'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

