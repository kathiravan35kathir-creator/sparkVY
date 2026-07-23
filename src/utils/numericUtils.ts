/**
 * Safely converts string, number, null, or undefined to a finite number for calculations.
 * Strips formatting like currency symbols, commas, and whitespace. Returns 0 if empty/invalid.
 */
export function toSafeNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  // Clean currency symbols, commas, spaces, non-numeric except dot and minus
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export interface GlobalSettings {
  currencySymbol: string;
  decimalPlaces: number;
}

export const globalSettings: GlobalSettings = {
  currencySymbol: '₹',
  decimalPlaces: 2
};

export function updateGlobalSettings(symbol: string, decimals: number) {
  globalSettings.currencySymbol = symbol;
  globalSettings.decimalPlaces = decimals;
}

/**
 * Shared currency and decimal formatter.
 * Safely formats a numeric value using the configured currency symbol and decimal places.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  symbol: string = globalSettings.currencySymbol,
  decimalPlaces: number = globalSettings.decimalPlaces
): string {
  const num = toSafeNumber(value);
  // Round to specified decimal places first
  const multiplier = Math.pow(10, decimalPlaces);
  const rounded = Math.round(num * multiplier) / multiplier;
  
  // Format with commas
  const fixedString = rounded.toFixed(decimalPlaces);
  const parts = fixedString.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';
  
  if (symbol === '₹') {
    // Indian formatting (e.g. 1,00,000)
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherParts = integerPart.substring(0, integerPart.length - 3);
    if (otherParts !== '' && otherParts !== '-') {
      lastThree = ',' + lastThree;
    }
    
    // Check if negative
    if (integerPart.startsWith('-')) {
      const cleanInt = integerPart.substring(1);
      let cleanLastThree = cleanInt.substring(cleanInt.length - 3);
      const cleanOtherParts = cleanInt.substring(0, cleanInt.length - 3);
      if (cleanOtherParts !== '') {
        cleanLastThree = ',' + cleanLastThree;
      }
      return `-${symbol}${cleanOtherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + cleanLastThree + decimalPart}`;
    }
    
    const res = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + decimalPart;
    return `${symbol}${res}`;
  } else {
    // International standard (e.g. 1,000,000.00)
    if (integerPart.startsWith('-')) {
      const cleanRes = integerPart.substring(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + decimalPart;
      return `-${symbol}${cleanRes}`;
    }
    const res = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + decimalPart;
    return `${symbol}${res}`;
  }
}

/**
 * Sanitizes input text string according to numeric constraints.
 * Ensures valid character entry, max 1 decimal point, and optional decimal scale.
 */
export function sanitizeNumericInput(
  raw: string,
  options: {
    allowDecimal?: boolean;
    decimalScale?: number;
    allowNegative?: boolean;
  } = {}
): string {
  const { allowDecimal = true, decimalScale, allowNegative = false } = options;
  if (!raw) return '';

  let cleaned = '';
  let hasDecimal = false;
  let hasMinus = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char >= '0' && char <= '9') {
      if (hasDecimal && decimalScale !== undefined) {
        const parts = cleaned.split('.');
        if (parts[1] && parts[1].length >= decimalScale) {
          continue; // exceeds max decimal places
        }
      }
      cleaned += char;
    } else if (char === '-' && allowNegative && i === 0 && !hasMinus) {
      cleaned += char;
      hasMinus = true;
    } else if (char === '.' && allowDecimal && !hasDecimal) {
      cleaned += char;
      hasDecimal = true;
    }
  }

  return cleaned;
}

/**
 * Normalizes pasted numeric text (e.g. "₹1,000.50" -> "1000.50").
 */
export function normalizePastedNumeric(
  raw: string,
  allowDecimal = true,
  allowNegative = false
): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  return sanitizeNumericInput(cleaned, { allowDecimal, allowNegative });
}

