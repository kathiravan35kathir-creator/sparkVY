import { CompanyDetails } from '../types';

/**
 * Resolves the primary Company Logo URL.
 * Checks companyLogoUrl first, then logoUrl.
 */
export function getCompanyLogoUrl(company?: Partial<CompanyDetails> | null): string {
  if (!company) return '';
  const url = company.companyLogoUrl || company.logoUrl || '';
  // Avoid returning stale temporary blob URLs if a permanent HTTP URL exists or if it's invalid
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
export function getCompanyQrCodeUrl(company?: Partial<CompanyDetails> | null): string {
  if (!company) return '';
  return company.companyQrCodeUrl || '';
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
export function getShowQrCodeOnDocuments(company?: Partial<CompanyDetails> | null): boolean {
  if (!company) return false;
  return !!company.showQrCodeOnDocuments;
}

/**
  * Resolves the Company Name.
  */
export function getCompanyName(company?: Partial<CompanyDetails> | null): string {
  if (!company) return 'My Company';
  return company.companyName || company.legalName || 'My Company';
}

