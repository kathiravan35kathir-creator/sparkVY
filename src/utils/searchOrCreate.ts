/**
 * Search or Create Utility Functions for Spark-VY ERP
 */

export interface PrefillData {
  prefillName?: string;
  prefillPhone?: string;
  prefillEmail?: string;
  prefillGst?: string;
  prefillType?: string; // 'Customer' | 'Supplier' | 'Both'
  prefillCategory?: string;
  prefillCode?: string;
  returnTo?: string;
  selectAfterCreate?: boolean;
  source?: string;
}

/**
 * Safely normalizes strings for comparison by trimming, lowercasing, and collapsing whitespace.
 */
export function normalizeSearchString(str: string | undefined | null): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Smart detection of field prefill type based on string format.
 * - If 10+ digits or phone format -> Phone
 * - If contains '@' and valid email pattern -> Email
 * - If 15 alphanumeric characters matching GST pattern -> GSTIN
 * - Otherwise -> Name
 */
export function detectSmartPrefill(query: string): {
  type: 'phone' | 'email' | 'gst' | 'name';
  value: string;
} {
  const trimmed = query.trim();
  if (!trimmed) return { type: 'name', value: '' };

  // GSTIN check: 15 alphanumeric characters (e.g., 33AAAAA0000A1Z5)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
  if (trimmed.length === 15 && gstRegex.test(trimmed)) {
    return { type: 'gst', value: trimmed.toUpperCase() };
  }

  // Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }

  // Phone number check: 10 to 14 digits (with optional +, spaces, hyphens)
  const cleanDigits = trimmed.replace(/[\s\-\+\(\)]/g, '');
  if (/^\d{10,13}$/.test(cleanDigits)) {
    return { type: 'phone', value: cleanDigits };
  }

  // Default to name
  return { type: 'name', value: trimmed };
}

/**
 * Reads prefill query parameters from window.location.search or window.location.hash
 */
export function getPrefillParamsFromUrl(): PrefillData {
  if (typeof window === 'undefined') return {};
  
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  );

  const getParam = (key: string): string | undefined => {
    return searchParams.get(key) || hashParams.get(key) || undefined;
  };

  return {
    prefillName: getParam('prefillName'),
    prefillPhone: getParam('prefillPhone'),
    prefillEmail: getParam('prefillEmail'),
    prefillGst: getParam('prefillGst'),
    prefillType: getParam('prefillType') || getParam('type'),
    prefillCategory: getParam('prefillCategory'),
    prefillCode: getParam('prefillCode'),
    returnTo: getParam('returnTo'),
    selectAfterCreate: getParam('selectAfterCreate') === 'true',
    source: getParam('source')
  };
}

/**
 * Updates URL search query parameters using URLSearchParams & window.history.pushState
 */
export function updateUrlWithPrefill(tab: string, params: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  url.searchParams.set('action', 'new');

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });

  window.history.pushState({}, '', url.toString());
}

/**
 * Clears prefill search parameters from the current URL cleanly.
 */
export function clearPrefillFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const keysToRemove = [
    'action',
    'prefillName',
    'prefillPhone',
    'prefillEmail',
    'prefillGst',
    'prefillType',
    'prefillCategory',
    'prefillCode',
    'returnTo',
    'selectAfterCreate',
    'source'
  ];

  keysToRemove.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, '', url.toString());
}

/**
 * Generic search filter function over records
 */
export function filterRecords<T>(
  records: T[],
  searchQuery: string,
  searchFields: (keyof T | string)[]
): T[] {
  const normalizedQuery = normalizeSearchString(searchQuery);
  if (!normalizedQuery) return records;

  return records.filter((record) => {
    return searchFields.some((field) => {
      const val = (record as any)[field];
      if (val === undefined || val === null) return false;
      return normalizeSearchString(String(val)).includes(normalizedQuery);
    });
  });
}

/**
 * Finds an exact match in records given a query
 */
export function findExactMatch<T>(
  records: T[],
  searchQuery: string,
  nameFields: (keyof T | string)[]
): T | undefined {
  const normalizedQuery = normalizeSearchString(searchQuery);
  if (!normalizedQuery) return undefined;

  return records.find((record) => {
    return nameFields.some((field) => {
      const val = (record as any)[field];
      if (!val) return false;
      return normalizeSearchString(String(val)) === normalizedQuery;
    });
  });
}
