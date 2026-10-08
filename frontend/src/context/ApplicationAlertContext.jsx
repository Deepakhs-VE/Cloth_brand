import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

const ApplicationAlertContext = createContext(null);

const appearance = {
  error: {
    icon: ShieldAlert,
    iconClass: 'bg-rose-50 text-rose-700 ring-rose-100',
    buttonClass: 'bg-slate-950 hover:bg-slate-800 focus:ring-slate-300',
    defaultTitle: 'Something Went Wrong',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    buttonClass: 'bg-slate-950 hover:bg-slate-800 focus:ring-slate-300',
    defaultTitle: 'Please Check',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    buttonClass: 'bg-slate-950 hover:bg-slate-800 focus:ring-slate-300',
    defaultTitle: 'Success',
  },
  info: {
    icon: Info,
    iconClass: 'bg-blue-50 text-blue-700 ring-blue-100',
    buttonClass: 'bg-slate-950 hover:bg-slate-800 focus:ring-slate-300',
    defaultTitle: 'Notice',
  },
  danger: {
    icon: AlertTriangle,
    iconClass: 'bg-rose-50 text-rose-700 ring-rose-100',
    buttonClass: 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-200',
    defaultTitle: 'Please Confirm',
  },
};

export const ApplicationAlertProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);
  const primaryButtonRef = useRef(null);

  const closeDialog = useCallback((result = false) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const showAlert = useCallback((message, options = {}) => {
    resolverRef.current?.(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        mode: 'alert',
        message,
        type: options.type || 'error',
        title: options.title,
        confirmLabel: options.confirmLabel || 'Got It',
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    resolverRef.current?.(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        mode: 'confirm',
        message,
        type: options.type || 'danger',
        title: options.title,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => primaryButtonRef.current?.focus(), 50);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDialog(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog, closeDialog]);

  const style = appearance[dialog?.type] || appearance.info;
  const Icon = style.icon;

  return (
    <ApplicationAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {dialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/65 backdrop-blur-[2px]"
            onClick={() => closeDialog(false)}
            aria-label="Close dialog"
          />

          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="application-alert-title"
            aria-describedby="application-alert-message"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl animate-fade-in"
          >
            <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-slate-900" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.iconClass}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                    Aura Atelier
                  </p>
                  <h2
                    id="application-alert-title"
                    className="font-luxury text-xl font-bold text-slate-950"
                  >
                    {dialog.title || style.defaultTitle}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p
                id="application-alert-message"
                className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600"
              >
                {dialog.message}
              </p>

              <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                {dialog.mode === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => closeDialog(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {dialog.cancelLabel}
                  </button>
                )}
                <button
                  ref={primaryButtonRef}
                  type="button"
                  onClick={() => closeDialog(true)}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.buttonClass}`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </ApplicationAlertContext.Provider>
  );
};

export const useApplicationAlert = () => {
  const context = useContext(ApplicationAlertContext);
  if (!context) {
    throw new Error('useApplicationAlert must be used within ApplicationAlertProvider');
  }
  return context;
};
