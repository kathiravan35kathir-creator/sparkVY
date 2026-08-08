import { CompanyDetails } from '../types';

/**
 * Resolves the primary Company Logo URL.
 * Checks companyLogoUrl first, then logoUrl.
 */
export function getCompanyLogoUrl(company?: Partial<CompanyDetails> | null): string {
  if (!company) return '';
  const url = company.companyLogoUrl || company.logoUrl || '';
  return url;
}

/**
 * Resolves the primary Authorized Signature URL.
 * Checks companySignatureUrl first, then signatureUrl, then authorizedSignatureUrl.
 */
export function getCompanySignatureUrl(company?: Partial<CompanyDetails> | null): string {
  if (!company) return '';
  return company.companySignatureUrl || company.signatureUrl || company.authorizedSignatureUrl || '';
}

/**
 * Resolves the Company QR Code URL.
 */
export function getCompanyQrCodeUrl(company?: Partial<CompanyDetails> | null, settings?: any | null): string {
  const compAny = company as any;
  if (compAny) {
    const url = compAny.companyQrCodeUrl || compAny.qrCodeUrl || compAny.qrUrl || compAny.paymentQrUrl || compAny.qr || '';
    if (url) return url;
  }
  if (settings && settings.bank && settings.bank.qrCodeUrl) {
    return settings.bank.qrCodeUrl;
  }
  if (settings && settings.company) {
    const sCompAny = settings.company as any;
    const url = sCompAny.companyQrCodeUrl || sCompAny.qrCodeUrl || sCompAny.qrUrl || sCompAny.paymentQrUrl || '';
    if (url) return url;
  }
  return '';
}

/**
 * Resolves the Company QR Code Type.
 */
export function getCompanyQrCodeType(company?: Partial<CompanyDetails> | null): string {
  if (!company) return 'UPI Payment QR';
  return company.companyQrCodeType || 'UPI Payment QR';
}

/**
 * Resolves whether QR code should be shown on documents.
 */
export function getShowQrCodeOnDocuments(company?: Partial<CompanyDetails> | null, settings?: any | null): boolean {
  if (company && company.showQrCodeOnDocuments !== undefined) {
    return !!company.showQrCodeOnDocuments;
  }
  if (settings && settings.bank && settings.bank.showQrCodeOnInvoice !== undefined) {
    return !!settings.bank.showQrCodeOnInvoice;
  }
  if (settings && settings.company && settings.company.showQrCodeOnDocuments !== undefined) {
    return !!settings.company.showQrCodeOnDocuments;
  }
  // Default to true if a QR code URL exists, to preserve backward compatibility for existing records
  const qrUrl = getCompanyQrCodeUrl(company, settings);
  if (qrUrl) return true;
  return false;
}

/**
  * Resolves the Company Name.
  */
export function getCompanyName(company?: Partial<CompanyDetails> | null): string {
  if (!company) return 'My Company';
  return company.companyName || company.legalName || 'My Company';
}

/**
 * Helper to wait for all images inside a printable document container to fully load before PDF capture/print.
 */
export function waitForDocumentImages(container: HTMLElement, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve) => {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;
    let timer: any = null;

    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        if (timer) clearTimeout(timer);
        resolve();
      }
    };

    timer = setTimeout(() => {
      resolve(); // Timeout fallback to prevent blocking
    }, timeoutMs);

    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;
      if (htmlImg.complete && htmlImg.naturalHeight !== 0) {
        checkDone();
      } else {
        htmlImg.onload = checkDone;
        htmlImg.onerror = checkDone;
      }
    });
  });
}


