import React, { createContext, useContext } from 'react';
import { CompanyDetails, AppSettings } from '../types';
import { getCompanyLogoUrl, getCompanySignatureUrl, getCompanyName, getCompanyQrCodeUrl, getCompanyQrCodeType, getShowQrCodeOnDocuments } from '../utils/companyBranding';

export interface CompanyBrandingContextType {
  company: Partial<CompanyDetails>;
  companyLogoUrl: string;
  companySignatureUrl: string;
  companyQrCodeUrl: string;
  companyQrCodeType: string;
  showQrCodeOnDocuments: boolean;
  companyName: string;
  brandingUpdatedAt?: string;
  loading: boolean;
  refreshBranding: () => void;
}

const CompanyBrandingContext = createContext<CompanyBrandingContextType | null>(null);

export function CompanyBrandingProvider({
  settings,
  children
}: {
  settings?: AppSettings;
  children: React.ReactNode;
}) {
  const company = (settings?.company || {}) as Partial<CompanyDetails>;
  const companyLogoUrl = getCompanyLogoUrl(company);
  const companySignatureUrl = getCompanySignatureUrl(company);
  const companyQrCodeUrl = getCompanyQrCodeUrl(company);
  const companyQrCodeType = getCompanyQrCodeType(company);
  const showQrCodeOnDocuments = getShowQrCodeOnDocuments(company);
  const companyName = getCompanyName(company);
  const brandingUpdatedAt = company.brandingUpdatedAt;

  const value: CompanyBrandingContextType = {
    company,
    companyLogoUrl,
    companySignatureUrl,
    companyQrCodeUrl,
    companyQrCodeType,
    showQrCodeOnDocuments,
    companyName,
    brandingUpdatedAt,
    loading: false,
    refreshBranding: () => {}
  };

  return (
    <CompanyBrandingContext.Provider value={value}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}

export function useCompanyBranding(): CompanyBrandingContextType {
  const context = useContext(CompanyBrandingContext);
  if (!context) {
    return {
      company: {},
      companyLogoUrl: '',
      companySignatureUrl: '',
      companyQrCodeUrl: '',
      companyQrCodeType: 'UPI Payment QR',
      showQrCodeOnDocuments: false,
      companyName: 'Our Company',
      brandingUpdatedAt: undefined,
      loading: false,
      refreshBranding: () => {}
    };
  }
  return context;
}
