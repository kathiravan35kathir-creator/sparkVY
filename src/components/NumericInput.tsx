import React, { useState, useEffect, FocusEvent, ChangeEvent, KeyboardEvent, WheelEvent, ClipboardEvent } from 'react';
import { sanitizeNumericInput, normalizePastedNumeric, toSafeNumber } from '../utils/numericUtils';

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max'> {
  value: number | string | null | undefined;
  onChange: (value: number, rawString: string) => void;
  allowDecimal?: boolean;
  decimalScale?: number;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  selectOnFocus?: boolean;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({
  value,
  onChange,
  allowDecimal = true,
  decimalScale,
  allowNegative = false,
  min,
  max,
  placeholder,
  className = '',
  selectOnFocus = false,
  onBlur,
  onFocus,
  onWheel,
  onPaste,
  disabled,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Helper to format incoming value prop to string
  const formatInitial = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number') {
      if (isNaN(val)) return '';
      return String(val);
    }
    return String(val);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatInitial(value));

  // Sync with value prop when changed externally (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatInitial(value));
    } else {
      // If user is focused, only update if external value changed significantly
      const parsedCurrent = toSafeNumber(displayValue);
      const parsedIncoming = toSafeNumber(value);
      if (parsedCurrent !== parsedIncoming && (value !== '' || displayValue !== '')) {
        setDisplayValue(formatInitial(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeNumericInput(raw, { allowDecimal, decimalScale, allowNegative });
    setDisplayValue(sanitized);

    const numVal = toSafeNumber(sanitized);
    onChange(numVal, sanitized);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (onPaste) onPaste(e);
    if (e.defaultPrevented) return;

    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const normalized = normalizePastedNumeric(pastedText, allowDecimal, allowNegative);
    setDisplayValue(normalized);

    const numVal = toSafeNumber(normalized);
    onChange(numVal, normalized);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (selectOnFocus) {
      e.target.select();
    }
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    let currentNum = toSafeNumber(displayValue);
    let finalStr = displayValue;

    if (displayValue !== '') {
      if (min !== undefined && currentNum < min) {
        currentNum = min;
        finalStr = String(min);
      }
      if (max !== undefined && currentNum > max) {
        currentNum = max;
        finalStr = String(max);
      }
      if (finalStr.endsWith('.')) {
        finalStr = finalStr.slice(0, -1);
      }
      if (finalStr === '-') {
        finalStr = '';
        currentNum = 0;
      }
      setDisplayValue(finalStr);
      onChange(currentNum, finalStr);
    }

    if (onBlur) onBlur(e);
  };

  const handleWheel = (e: WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    if (onWheel) onWheel(e);
  };

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onWheel={handleWheel}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={`numeric-input-field ${className}`}
    />
  );
});

NumericInput.displayName = 'NumericInput';

/** Reusable specialized variants */

export const QuantityInput: React.FC<NumericInputProps> = (props) => (
  <NumericInput allowDecimal={true} decimalScale={3} min={0} {...props} />
);

export const CurrencyInput: React.FC<NumericInputProps> = (props) => (
  <NumericInput allowDecimal={true} decimalScale={2} min={0} {...props} />
);

export const PercentageInput: React.FC<NumericInputProps> = (props) => (
  <NumericInput allowDecimal={true} decimalScale={2} min={0} max={100} {...props} />
);
