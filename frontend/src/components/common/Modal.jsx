import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] overflow-y-auto p-4 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative flex min-h-full items-center justify-center text-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-modal-title"
          className={`pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 ring-black/5 transition-all sm:max-h-[calc(100dvh-3rem)] ${maxWidth} animate-fade-in`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <h3 id="shared-modal-title" className="font-luxury text-base font-semibold leading-6 text-slate-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
