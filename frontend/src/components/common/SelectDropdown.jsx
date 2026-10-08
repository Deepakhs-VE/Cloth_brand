import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export const SelectDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  ariaLabel = 'Select an option',
  disabled = false,
  required = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) => {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const enabledOptions = useMemo(() => options.filter((option) => !option.disabled), [options]);
  const selectedOption = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = enabledOptions.findIndex(
      (option) => String(option.value) === String(value)
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, value, enabledOptions]);

  const chooseOption = (option) => {
    if (option?.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (!enabledOptions.length) return;
      if (!open) {
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) =>
        (current + direction + enabledOptions.length) % enabledOptions.length
      );
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      chooseOption(enabledOptions[activeIndex]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-10 flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          open
            ? 'border-amber-500 ring-2 ring-amber-500/15 shadow-md'
            : 'border-slate-200 hover:border-slate-400 shadow-sm'
        } ${buttonClassName}`}
      >
        <span className={selectedOption ? 'text-slate-900 truncate' : 'text-slate-400 truncate'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-[80] mt-2 w-full min-w-max max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 animate-fade-in ${menuClassName}`}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            const enabledIndex = enabledOptions.indexOf(option);
            const isActive = enabledIndex === activeIndex;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => !option.disabled && setActiveIndex(enabledIndex)}
                onClick={() => chooseOption(option)}
                className={`w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl text-xs text-left transition ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : isActive
                    ? 'bg-amber-50 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <span className="whitespace-nowrap">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
