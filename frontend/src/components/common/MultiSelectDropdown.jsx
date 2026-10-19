import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export const MultiSelectDropdown = ({ value = [], onChange, options = [], placeholder = 'Select options', ariaLabel, customOptionLabel = 'Custom / Other' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (option) => onChange(selected.includes(option)
    ? selected.filter((entry) => entry !== option)
    : [...selected, option]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs transition hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900">
        <span className="min-w-0 truncate text-slate-700">{selected.length ? selected.join(', ') : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => {
            const active = selected.includes(option);
            return <button type="button" key={option} onClick={() => toggle(option)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              <span>{option.startsWith('__custom_') ? customOptionLabel : option}</span>{active && <Check className="h-3.5 w-3.5" />}
            </button>;
          })}
        </div>
      )}
    </div>
  );
};
