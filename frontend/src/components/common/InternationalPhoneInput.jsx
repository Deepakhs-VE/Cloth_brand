import React, { useState } from 'react';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

export const InternationalPhoneInput = ({
  value,
  onChange,
  required = false,
  placeholder = '+91 98765 43210',
  className = '',
}) => {
  const [touched, setTouched] = useState(false);
  const hasValue = Boolean(value);
  const isInvalid = hasValue && !isValidPhoneNumber(value);

  const handleChange = (event) => {
    const nextValue = event.target.value.replace(/[^\d+().\-\s]/g, '');
    onChange(nextValue);
  };

  const handleBlur = () => {
    setTouched(true);
    const parsed = parsePhoneNumberFromString(value || '');
    if (parsed?.isValid()) onChange(parsed.number);
  };

  return (
    <div>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={25}
        required={required}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-invalid={touched && isInvalid}
        className={`international-phone-input ${touched && isInvalid ? 'international-phone-input--invalid' : ''} ${className}`}
      />
      {touched && isInvalid ? (
        <p className="text-[10px] text-rose-600 mt-1">
          Enter a valid international number including the country code.
        </p>
      ) : (
        <p className="text-[10px] text-slate-400 mt-1">
          Include the country code, for example +919876543210.
        </p>
      )}
    </div>
  );
};

export const isPhoneValid = (value, required = false) => {
  if (!value) return !required;
  return isValidPhoneNumber(value);
};
