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

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
];

/**
 * Helper to get active currency symbol from settings
 */
export function getCurrencySymbol(settings?: any): string {
  return (
    settings?.generalFeatures?.currencySymbol ||
    settings?.system?.currencySymbol ||
    settings?.company?.currencySymbol ||
    settings?.company?.currency ||
    '₹'
  );
}

export function getCurrencyCode(settings?: any): string {
  return (
    settings?.generalFeatures?.currencyCode ||
    settings?.system?.currencyCode ||
    settings?.company?.currency ||
    settings?.system?.currencyFormat ||
    'INR'
  );
}

export function getCurrencyLocale(settings?: any): string {
  return (
    settings?.generalFeatures?.currencyLocale ||
    settings?.system?.currencyLocale ||
    (getCurrencyCode(settings) === 'INR' ? 'en-IN' : 'en-US')
  );
}

/**
 * Helper to get active amount decimal places from settings
 */
export function getAmountDecimals(settings?: any): number {
  return (
    settings?.generalFeatures?.amountDecimalPlaces ??
    settings?.system?.decimalPlaces ??
    2
  );
}

/**
 * Formats a number with dynamic decimal places without symbol
 */
export function formatAmount(
  amount: number | string | null | undefined,
  settings?: any,
  decimalsOverride?: number
): string {
  const num = toSafeNumber(amount);
  const decimals = decimalsOverride ?? getAmountDecimals(settings);
  const locale = getCurrencyLocale(settings);
  const grouping = settings?.system?.numberGroupingFormat || settings?.generalFeatures?.numberGroupingFormat;
  const useLocale = grouping === 'Indian' ? 'en-IN' : locale;

  return num.toLocaleString(useLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a number with currency symbol and dynamic decimal places
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  settings?: any
): string {
  const num = toSafeNumber(amount);
  const symbol = getCurrencySymbol(settings);
  const formattedNum = formatAmount(num, settings);
  
  return `${symbol}${formattedNum}`;
}


