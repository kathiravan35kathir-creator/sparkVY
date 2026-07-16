import React from 'react';
import { AppSettings } from '../types';
import {
  ShieldAlert,
  FileText,
  CheckCircle,
  QrCode,
  Check,
  Building,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Printer,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export interface DocumentTemplateRendererProps {
  documentType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'labReport' | 'sampleLabel' | 'report' | 'sample_label';
  data?: any; // The document object
  settings: AppSettings;
  customizationOverride?: any;
  printCopyLabel?: string;
}

// Highly realistic demo data when no specific document data is passed
const getDemoData = (type: string, company: any) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const dueStr = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  switch (type) {
    case 'invoice':
      return {
        invoiceNumber: 'INV/2026/1024',
        invoiceDate: dateStr,
        dueDate: dueStr,
        partyName: 'Apex Diagnostic Distributors Ltd',
        partyGst: '29AAACD4912K1Z9',
        partyAddress: 'Plot 42-C, Bidadi Industrial Area, Ramanagara, Karnataka - 562109',
        relatedSampleCode: 'SMP/2026/0491',
        relatedQuotationNumber: 'QT/2026/0184',
        status: 'Unpaid',
        items: [
          { id: '1', itemName: 'Water Potability Microbiological Test Suite', itemCode: 'SRV-001', hsn: '998346', quantity: 2, rate: 1500, discountPercent: 5, taxPercent: 18, taxAmount: 513, amount: 3363 },
          { id: '2', itemName: 'Heavy Metals Contaminant Analysis (ICP-MS)', itemCode: 'SRV-024', hsn: '998346', quantity: 1, rate: 4500, discountPercent: 0, taxPercent: 18, taxAmount: 810, amount: 5310 },
          { id: '3', itemName: 'NABL Sterile Sample Carrier Box (Small)', itemCode: 'EQ-044', hsn: '392310', quantity: 1, rate: 850, discountPercent: 10, taxPercent: 12, taxAmount: 91.8, amount: 856.8 }
        ],
        subtotal: 7650,
        discountAmount: 235,
        taxAmount: 1414.8,
        additionalCharges: 150,
        total: 8979.8,
        amountPaid: 3000,
        balanceDue: 5979.8,
        terms: '1. Payment is due within 15 days of invoice date.\n2. Interest of 1.5% per month will be charged on overdue payments.\n3. Goods once sold cannot be returned.',
        notes: 'Includes expedited lab courier logistics fees and custom sample preservation kit.'
      };
    case 'quotation':
      return {
        quotationNumber: 'QT/2026/0184',
        quotationDate: dateStr,
        expiryDate: dueStr,
        partyName: 'BioShield Pharma Solutions',
        partyGst: '29AAAPB8271M1Z5',
        partyAddress: 'Block F, Brigade Tech Park, Whitefield, Bangalore, KA - 560066',
        status: 'Sent',
        items: [
          { id: '1', itemName: 'In-Vitro Biocompatibility Cytotoxicity Assay', itemCode: 'SRV-055', hsn: '998346', quantity: 1, rate: 12500, discountPercent: 10, taxPercent: 18, taxAmount: 2025, amount: 13275 },
          { id: '2', itemName: 'Sterility Validation Testing (USP 71)', itemCode: 'SRV-091', hsn: '998346', quantity: 3, rate: 3500, discountPercent: 0, taxPercent: 18, taxAmount: 1890, amount: 12390 }
        ],
        subtotal: 23000,
        discountAmount: 1250,
        taxAmount: 3915,
        additionalCharges: 400,
        total: 26065,
        terms: '1. Quotation validity is exactly 30 days from document issue.\n2. 50% advance mobilization fee required prior to test worksheet setup.',
        notes: 'Estimated turnaround time is 7 working days from sample intake validation.'
      };
    case 'receipt':
      return {
        paymentNumber: 'REC/2026/0402',
        paymentDate: dateStr,
        partyName: 'Apex Diagnostic Distributors Ltd',
        amount: 3000,
        paymentMethod: 'UPI',
        accountName: 'UPI HDFC Merchant QR',
        notes: 'Partial advance against invoice INV/2026/1024.'
      };
    case 'purchase':
      return {
        purchaseNumber: 'PUR/2026/0082',
        purchaseDate: dateStr,
        partyName: 'HiMedia Reagents & Chemicals Pvt Ltd',
        partyGst: '27AAACH0291K1Z2',
        partyAddress: 'A-516, Swastik Chambers, Chembur, Mumbai, MH - 400071',
        status: 'Ordered',
        items: [
          { id: '1', itemName: 'MacConkey Agar Media dehydrated (500g)', itemCode: 'RG-102', hsn: '382100', quantity: 5, rate: 1240, discountPercent: 15, taxPercent: 18, taxAmount: 948.6, amount: 6218.6 },
          { id: '2', itemName: 'Disposable Sterile Petri Dishes 90mm (Box/500)', itemCode: 'RG-344', hsn: '392690', quantity: 2, rate: 2200, discountPercent: 10, taxPercent: 18, taxAmount: 712.8, amount: 4672.8 }
        ],
        subtotal: 10600,
        discountAmount: 1370,
        taxAmount: 1661.4,
        total: 10891.4,
        balanceDue: 10891.4,
        terms: '1. Deliver only fresh stock with expiry date > 18 months.\n2. Supply technical validation certificates alongside MSDS data.'
      };
    case 'labReport':
    case 'report':
      return {
        reportNumber: 'REP/2026/1209',
        reportDate: dateStr,
        sampleCode: 'SMP/2026/0491',
        sampleName: 'Industrial Effluent Water Sample',
        sampleType: 'Liquid Effluent',
        partyName: 'Apex Diagnostic Distributors Ltd',
        receivedDate: dateStr,
        status: 'Approved',
        preparedBy: 'Dr. Alan Turing (Senior Microbiologist)',
        reviewedBy: 'Sarah Jenkins (Quality Manager)',
        approvedBy: 'Dr. Dev Anand (Lab Director)',
        disclaimer: 'This analytical report applies strictly to the sample collected and presented by the customer. Test certified under NABL ISO/IEC 17025 accredited standard protocols.',
        testAssignments: [
          {
            testName: 'Microbiological Analysis Suite',
            parameters: [
              { name: 'Total Coliform Count', result: '180', unit: 'CFU/100ml', referenceRange: '< 50 (Standard Industrial)', status: 'High', method: 'IS 16225 Membrane Filtration' },
              { name: 'Escherichia coli', result: 'Detected', unit: 'Presence/100ml', referenceRange: 'Absent (Standard Industrial)', status: 'Abnormal', method: 'IS 5887 Part 1' },
              { name: 'Salmonella species', result: 'Absent', unit: 'Presence/250ml', referenceRange: 'Absent (Standard Industrial)', status: 'Normal', method: 'ISO 6579' }
            ]
          },
          {
            testName: 'Physico-Chemical Validation',
            parameters: [
              { name: 'pH Value at 25°C', result: '8.42', unit: 'pH Units', referenceRange: '6.50 - 8.50', status: 'Normal', method: 'APHA 4500-H+ B' },
              { name: 'Total Dissolved Solids (TDS)', result: '1450', unit: 'mg/L', referenceRange: '< 2100 (Standard Industrial)', status: 'Normal', method: 'APHA 2540 C' }
            ]
          }
        ]
      };
    case 'sampleLabel':
    case 'sample_label':
      return {
        sampleCode: 'SMP/2026/0491',
        sampleName: 'Industrial Effluent Water Sample',
        sampleType: 'Liquid Effluent',
        partyName: 'Apex Diagnostic Distributors Ltd',
        receivedDate: dateStr,
        barcodeData: 'SMP/2026/0491'
      };
    default:
      return {};
  }
};

export default function DocumentTemplateRenderer({
  documentType,
  data,
  settings,
  customizationOverride,
  printCopyLabel
}: DocumentTemplateRendererProps) {
  const company = settings.company;
  
  // Normalize types from other calling views
  const normType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'labReport' | 'sampleLabel' = 
    documentType === 'report' ? 'labReport' :
    documentType === 'sample_label' ? 'sampleLabel' :
    (documentType as any);

  const docData = data || getDemoData(normType, company);

  // Read template ID from the correct settings key
  const defaultTemplateMap: any = {
    invoice: settings.print.invoiceTemplate || 'tally_modern',
    quotation: settings.print.quotationTemplate || 'corporate_blue',
    receipt: settings.print.receiptTemplate || 'receipt_pro',
    purchase: settings.print.purchaseTemplate || 'tally_classic',
    labReport: settings.print.labReportTemplate || 'premium_lab',
    sampleLabel: settings.print.sampleLabelTemplate || 'sample_label'
  };

  const docTemplateId = customizationOverride?.templateId || defaultTemplateMap[normType];
  const printSettings = settings.print;

  // Customization fields (merging global print settings with override if present)
  const primaryColor = customizationOverride?.primaryColor || printSettings.primaryColor || '#2563EB';
  const secondaryColor = customizationOverride?.secondaryColor || printSettings.secondaryColor || '#1E293B';
  const fontFamily = customizationOverride?.fontFamily || printSettings.fontFamily || 'Inter';
  const fontSizeScale = customizationOverride?.fontSizeScale || printSettings.fontSizeScale || 'medium';
  const logoPosition = customizationOverride?.logoPosition || printSettings.logoPosition || 'left';
  const logoSize = customizationOverride?.logoSize || printSettings.logoSize || 'medium';
  const headerAlignment = customizationOverride?.headerAlignment || printSettings.headerAlignment || 'left';
  const showAddress = customizationOverride?.showAddress !== undefined ? customizationOverride.showAddress : printSettings.showAddress;
  const showPhone = customizationOverride?.showPhone !== undefined ? customizationOverride.showPhone : printSettings.showPhone;
  const showEmail = customizationOverride?.showEmail !== undefined ? customizationOverride.showEmail : printSettings.showEmail;
  const showGst = customizationOverride?.showGst !== undefined ? customizationOverride.showGst : printSettings.showGst;
  const showHsnSac = customizationOverride?.showHsnSac !== undefined ? customizationOverride.showHsnSac : printSettings.showHsnSac;
  const showTaxColumns = customizationOverride?.showTaxColumns !== undefined ? customizationOverride.showTaxColumns : printSettings.showTaxColumns;
  const showDiscount = customizationOverride?.showDiscount !== undefined ? customizationOverride.showDiscount : printSettings.showDiscount;
  const showPreviousBalance = customizationOverride?.showPreviousBalance !== undefined ? customizationOverride.showPreviousBalance : printSettings.showPreviousBalance;
  const showBankDetails = customizationOverride?.showBankDetails !== undefined ? customizationOverride.showBankDetails : printSettings.showBankDetails;
  const showUpi = customizationOverride?.showUpi !== undefined ? customizationOverride.showUpi : printSettings.showUpi;
  const showQrPayment = customizationOverride?.showQrPayment !== undefined ? customizationOverride.showQrPayment : printSettings.showQrPayment;
  const showSignature = customizationOverride?.showSignature !== undefined ? customizationOverride.showSignature : printSettings.showSignature;
  const showTerms = customizationOverride?.showTerms !== undefined ? customizationOverride.showTerms : printSettings.showTerms;
  const showNotes = customizationOverride?.showNotes !== undefined ? customizationOverride.showNotes : printSettings.showNotes;
  const showFooter = customizationOverride?.showFooter !== undefined ? customizationOverride.showFooter : printSettings.showFooter;
  const footerText = customizationOverride?.footerText || printSettings.footerText || company.footerText || 'Thank you for your business.';
  const paperSize = customizationOverride?.paperSize || printSettings.paperSize || 'A4';
  const pageMargins = customizationOverride?.pageMargins || printSettings.pageMargins || 'normal';
  const tableDensity = customizationOverride?.tableDensity || printSettings.tableDensity || 'normal';

  // Apply default color adjustments for specific themed templates
  let finalPrimaryColor = primaryColor;
  let finalSecondaryColor = secondaryColor;
  if (docTemplateId === 'professional_orange') {
    finalPrimaryColor = '#EA580C'; // High contrast professional orange
  } else if (docTemplateId === 'vyapar_modern') {
    finalPrimaryColor = '#0D9488'; // Vyapar Teal style
  } else if (docTemplateId === 'corporate_blue') {
    finalPrimaryColor = '#1D4ED8'; // Corporate Rich Blue
  } else if (docTemplateId === 'tally_classic' || docTemplateId === 'tally_gst') {
    finalPrimaryColor = '#0F172A'; // Retro Charcoal/Black for Tally look
    finalSecondaryColor = '#334155';
  }

  // Font setup
  let fontClass = 'font-sans';
  if (fontFamily === 'JetBrains Mono' || docTemplateId === 'tally_classic' || docTemplateId === 'tally_gst') {
    fontClass = 'font-mono';
  } else if (fontFamily === 'Space Grotesk') {
    fontClass = 'font-sans tracking-tight';
  } else if (fontFamily === 'Playfair Display' || docTemplateId === 'executive_minimal') {
    fontClass = 'serif';
  }

  // Size scale setups
  let baseTextSize = 'text-xs';
  let titleTextSize = 'text-lg';
  let subtitleTextSize = 'text-[11px]';
  if (fontSizeScale === 'small') {
    baseTextSize = 'text-[11px]';
    titleTextSize = 'text-base';
    subtitleTextSize = 'text-[10px]';
  } else if (fontSizeScale === 'large') {
    baseTextSize = 'text-sm';
    titleTextSize = 'text-xl';
    subtitleTextSize = 'text-xs';
  }

  // Table density padding
  let tablePadding = 'py-2 px-3';
  if (tableDensity === 'compact') {
    tablePadding = 'py-1 px-1.5';
  } else if (tableDensity === 'spacious') {
    tablePadding = 'py-3.5 px-4';
  }

  // Margin spacing
  let marginClass = 'p-6';
  if (pageMargins === 'narrow') {
    marginClass = 'p-3 sm:p-4';
  } else if (pageMargins === 'wide') {
    marginClass = 'p-8 sm:p-12';
  }

  // Custom styles for dynamic colors
  const primaryText = { color: finalPrimaryColor };
  const primaryBg = { backgroundColor: finalPrimaryColor };
  const primaryBorder = { borderColor: finalPrimaryColor };
  const secondaryText = { color: finalSecondaryColor };
  const secondaryBg = { backgroundColor: finalSecondaryColor };

  // Determine standard title label
  let documentTitle = 'Document';
  if (normType === 'invoice') {
    documentTitle = settings.tax?.taxInvoiceLabel || 'Tax Invoice';
    if (docTemplateId === 'retail_invoice') documentTitle = 'Retail Cash Memo';
    if (docTemplateId === 'wholesale_invoice') documentTitle = 'Wholesale Tax Invoice';
  } else if (normType === 'quotation') {
    documentTitle = 'Quotation Proposal';
    if (docTemplateId === 'business_proposal') documentTitle = 'Business proposal';
    if (docTemplateId === 'corporate_estimate') documentTitle = 'Commercial Estimate';
  } else if (normType === 'receipt') {
    documentTitle = 'Official Payment Receipt';
  } else if (normType === 'purchase') {
    documentTitle = 'Purchase Order';
    if (docTemplateId === 'supplier_copy') documentTitle = 'Purchase Order (Supplier Copy)';
    if (docTemplateId === 'warehouse_copy') documentTitle = 'Purchase Requisition (Warehouse Copy)';
  } else if (normType === 'labReport') {
    documentTitle = docData.reportTitle || 'Laboratory Test Report';
    if (docTemplateId === 'research_report') documentTitle = 'Research & Technical Report';
    if (docTemplateId === 'iso_format') documentTitle = 'NABL Accredited Certificate of Test';
  } else if (normType === 'sampleLabel') {
    documentTitle = 'LIMS Sample Specimen';
  }

  // -----------------------------------------------------------------
  // SPECIFIC SUB-RENDERS FOR LAB LABELS (Thermal/Small format)
  // -----------------------------------------------------------------
  if (normType === 'sampleLabel') {
    return (
      <div
        id="printed-document-root"
        className={`bg-white border-2 border-slate-900 rounded-lg p-3 max-w-sm mx-auto flex flex-col items-center justify-between text-slate-900 font-mono text-center relative overflow-hidden`}
        style={{ width: paperSize === '80mm' ? '280px' : '320px', minHeight: '180px' }}
      >
        <div className="w-full border-b border-dashed border-slate-300 pb-1 mb-1 flex justify-between items-center text-[9px]">
          <span className="font-black uppercase text-slate-500">LabBiz Specimen Label</span>
          <span className="font-bold text-blue-600">{docData.receivedDate}</span>
        </div>

        <div className="font-sans font-black text-xs text-slate-800 break-words w-full px-1">
          {docData.sampleName}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
          Type: {docData.sampleType}
        </div>

        {/* Dynamic Template QR / Barcode style */}
        <div className="my-1.5 flex flex-col items-center">
          {docTemplateId === 'barcode_label' ? (
            // Barcode Layout
            <div className="flex items-center space-x-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <div className="w-0.5 h-6 bg-slate-900" />
              <div className="w-1 h-6 bg-slate-900" />
              <div className="w-0.5 h-6 bg-slate-900" />
              <div className="w-1.5 h-6 bg-slate-900" />
              <div className="w-0.5 h-6 bg-slate-900" />
              <div className="w-2 h-6 bg-slate-900" />
              <div className="w-0.5 h-6 bg-slate-900" />
              <div className="w-1 h-6 bg-slate-900" />
              <div className="w-0.5 h-6 bg-slate-900" />
            </div>
          ) : docTemplateId === 'warehouse_label' ? (
            <div className="flex items-center justify-between space-x-3 text-[9px] bg-amber-50 p-1.5 border border-amber-200 text-amber-800 rounded">
              <AlertCircle size={14} className="text-amber-600 animate-pulse shrink-0" />
              <span className="font-black uppercase tracking-wider">Storage Slot: COLD-ROOM 1A</span>
            </div>
          ) : (
            // Default QR code Layout
            <div className="p-1 bg-slate-50 rounded border border-slate-200">
              <QrCode size={32} className="text-slate-800" />
            </div>
          )}
          <span className="text-[10px] font-black tracking-widest mt-1 text-slate-800">{docData.sampleCode}</span>
        </div>

        <div className="text-[9px] text-slate-400 font-sans tracking-wide truncate max-w-full">
          Ref: {docData.partyName}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER FULL SIZE DOCUMENTS (Invoices, Quotations, Lab Reports, etc.)
  // -----------------------------------------------------------------
  return (
    <div
      id="printed-document-root"
      className={`bg-white text-slate-800 shadow-sm relative border border-slate-100 ${fontClass} ${baseTextSize} ${marginClass} flex flex-col justify-between`}
      style={{
        width: '100%',
        maxWidth: '820px',
        minHeight: paperSize === 'A5' ? '580px' : '1050px',
        margin: '0 auto',
        fontFamily: fontFamily === 'Playfair Display' || docTemplateId === 'executive_minimal' ? 'serif' : undefined
      }}
    >
      {/* Print labels watermark */}
      {printCopyLabel && (
        <div className="absolute top-2 right-4 print:block hidden text-[9px] font-black uppercase text-slate-400 tracking-wider">
          * {printCopyLabel} *
        </div>
      )}

      <div>
        {/* =========================================================================
            HEADER STYLE OVERRIDES FOR ALL 32 TEMPLATES
            ========================================================================= */}
        
        {/* RETRO TALLY BOX LAYOUT (tally_classic / tally_gst) */}
        {(docTemplateId === 'tally_classic' || docTemplateId === 'tally_gst') ? (
          <div className="border-2 border-slate-900 p-4 mb-4 font-mono">
            <div className="text-center border-b border-slate-900 pb-2 mb-3">
              <h2 className="text-sm font-black tracking-widest uppercase text-slate-950">{documentTitle}</h2>
              <p className="text-[9px] tracking-wide text-slate-500">(INDIAN GST LEDGER FORMAT)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-7 space-y-1">
                <h1 className="font-extrabold text-sm text-slate-950 uppercase">{company.legalName || company.labName}</h1>
                {showAddress && <p className="text-[10px] text-slate-600 leading-tight">{company.address}</p>}
                <div className="text-[10px] text-slate-500 pt-0.5">
                  {showPhone && <span>PHONE: {company.primaryPhone} </span>}
                  {showEmail && <span>| EMAIL: {company.email} </span>}
                  {showGst && company.gstNumber && <p className="font-bold text-slate-900 mt-0.5">GSTIN: {company.gstNumber}</p>}
                </div>
              </div>
              <div className="sm:col-span-5 sm:border-l sm:border-slate-300 sm:pl-4 space-y-0.5 text-[10px]">
                <p className="font-bold text-slate-950">Voucher No: <span className="text-xs">{docData.invoiceNumber || docData.quotationNumber || docData.paymentNumber || docData.purchaseNumber || docData.reportNumber}</span></p>
                <p>Dated: <strong>{docData.invoiceDate || docData.quotationDate || docData.paymentDate || docData.purchaseDate || docData.reportDate}</strong></p>
                {(docData.dueDate || docData.expiryDate) && (
                  <p>Settlement Period: <strong>{docData.dueDate || docData.expiryDate}</strong></p>
                )}
                {docData.relatedSampleCode && (
                  <p>LIMS Batch No: <strong className="text-blue-600">{docData.relatedSampleCode}</strong></p>
                )}
              </div>
            </div>
          </div>
        ) : docTemplateId === 'executive_minimal' ? (
          /* EXECUTIVE MINIMAL LAYOUT */
          <div className="border-b border-slate-200 pb-4 mb-5">
            <div className="flex flex-col sm:flex-row justify-between items-baseline mb-3">
              <h1 className="font-serif font-black text-xl tracking-tight text-slate-900 uppercase">
                {company.displayLabName || company.labName}
              </h1>
              <span className="text-xs font-light tracking-widest text-slate-400 uppercase">
                {documentTitle}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-slate-500">
              <div>
                {showAddress && <p className="leading-relaxed">{company.address}</p>}
                <div className="flex flex-wrap items-center gap-x-3 mt-1 text-slate-700">
                  {showPhone && <span>Tel: {company.primaryPhone}</span>}
                  {showEmail && <span>Email: {company.email}</span>}
                  {showGst && company.gstNumber && <span className="font-mono text-slate-500 font-bold">GSTIN: {company.gstNumber}</span>}
                </div>
              </div>
              <div className="sm:text-right space-y-0.5">
                <p className="text-xs font-bold text-slate-900">
                  REFERENCE: {docData.invoiceNumber || docData.quotationNumber || docData.paymentNumber || docData.purchaseNumber || docData.reportNumber}
                </p>
                <p>Issued: <span className="font-mono text-slate-700">{docData.invoiceDate || docData.quotationDate || docData.paymentDate || docData.purchaseDate || docData.reportDate}</span></p>
              </div>
            </div>
          </div>
        ) : docTemplateId === 'corporate_blue' ? (
          /* CORPORATE BLUE BORDERED HEADER */
          <div className="border-b-4 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4" style={primaryBorder}>
            <div>
              <div className="flex items-center space-x-2">
                {company.logoUrl && (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="object-contain bg-slate-50 border border-slate-100 rounded-lg p-0.5"
                    style={{ height: logoSize === 'small' ? '30px' : logoSize === 'large' ? '54px' : '40px' }}
                  />
                )}
                <div>
                  <h1 className="font-black text-base tracking-wide uppercase text-slate-900">{company.displayLabName || company.labName}</h1>
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400" style={primaryText}>
                    {company.businessType} • REG CO: {company.cin || 'U12000KA2026PTC'}
                  </p>
                </div>
              </div>

              {showAddress && <p className="text-[11px] text-slate-500 mt-2 max-w-md leading-relaxed">{company.address}</p>}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-400 text-[10px]">
                {showPhone && (
                  <span className="flex items-center space-x-1 text-slate-600">
                    <Phone size={10} className="text-slate-400" />
                    <span>{company.primaryPhone}</span>
                  </span>
                )}
                {showEmail && (
                  <span className="flex items-center space-x-1 text-slate-600">
                    <Mail size={10} className="text-slate-400" />
                    <span>{company.email}</span>
                  </span>
                )}
                {showGst && company.gstNumber && (
                  <span className="px-1.5 bg-blue-50 text-blue-700 rounded-sm font-bold font-mono text-[9px] border border-blue-100">
                    GSTIN: {company.gstNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase text-white rounded-md mb-1" style={primaryBg}>
                {documentTitle}
              </span>
              <p className="font-mono font-bold text-slate-800 text-xs">
                NO: {docData.invoiceNumber || docData.quotationNumber || docData.paymentNumber || docData.purchaseNumber || docData.reportNumber}
              </p>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                <p>Dated: <strong>{docData.invoiceDate || docData.quotationDate || docData.paymentDate || docData.purchaseDate || docData.reportDate}</strong></p>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD HIGH CONTRAST MODERN HEADER (Vyapar, Professional Orange, GST Detailed, Lab Report etc) */
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="text-white px-2.5 py-1 rounded-md font-black text-sm shrink-0 uppercase tracking-widest" style={primaryBg}>
                  {company.labName?.slice(0, 2) || 'LB'}
                </div>
                <div>
                  <h1 className="font-extrabold text-base text-slate-900 tracking-wide uppercase">{company.labName}</h1>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                    LIMS CLINICAL SYSTEM {company.gstNumber ? `• GSTIN: ${company.gstNumber}` : ''}
                  </p>
                </div>
              </div>
              {showAddress && <p className="text-[11px] text-slate-500 mt-2 max-w-sm leading-relaxed">{company.address}</p>}
              <div className="text-[10px] text-slate-500 mt-1 flex space-x-3">
                {showPhone && <span>Phone: {company.primaryPhone}</span>}
                {showEmail && <span>Email: {company.email}</span>}
              </div>
            </div>
            <div className="sm:text-right mt-1 sm:mt-0">
              <h2 className="text-base font-black text-slate-950 tracking-wide uppercase" style={primaryText}>{documentTitle}</h2>
              <p className="text-[11px] font-bold text-slate-700 font-mono mt-0.5">
                DOC ID: {docData.invoiceNumber || docData.quotationNumber || docData.paymentNumber || docData.purchaseNumber || docData.reportNumber}
              </p>
              <div className="text-[10px] text-slate-400 mt-1 font-medium font-mono">
                <p>Date: <strong className="text-slate-800">{docData.invoiceDate || docData.quotationDate || docData.paymentDate || docData.purchaseDate || docData.reportDate}</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            RECIPIENT / REQUISITION DETAILS SECTION
            ========================================================================= */}
        {normType !== 'receipt' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
            <div className="sm:col-span-7 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {normType === 'purchase' ? 'Vendor / Chemical Supplier Details:' : 'Customer Billed Recipient:'}
              </h4>
              <p className="text-xs font-black text-slate-900">{docData.partyName || 'General Client walking'}</p>
              <p className="text-[11px] text-slate-600 leading-normal mt-0.5 whitespace-pre-line">
                {docData.partyAddress || 'Building 4B, Electronic City, Bangalore, KA'}
              </p>
              {docData.partyGst && (
                <p className="text-[9px] font-black text-slate-500 font-mono mt-1 uppercase" style={primaryText}>
                  GSTIN/Unique Id: {docData.partyGst}
                </p>
              )}
            </div>

            <div className="sm:col-span-5 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1 text-[10px] text-slate-600">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">LIMS Reference Logs:</h4>
                {docData.relatedSampleCode && (
                  <p className="flex justify-between"><span>Linked Sample UID:</span> <strong className="font-mono text-slate-800">{docData.relatedSampleCode}</strong></p>
                )}
                {docData.relatedQuotationNumber && (
                  <p className="flex justify-between"><span>Against Quotation Ref:</span> <strong className="font-mono text-slate-800">{docData.relatedQuotationNumber}</strong></p>
                )}
                {docData.sampleCode && (
                  <p className="flex justify-between"><span>Sample Specimen UID:</span> <strong className="font-mono text-slate-800">{docData.sampleCode}</strong></p>
                )}
                {docData.sampleType && (
                  <p className="flex justify-between"><span>Sample Physical Matrix:</span> <strong className="text-slate-800">{docData.sampleType}</strong></p>
                )}
              </div>
              <div className="pt-2 text-right">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 border border-slate-300">
                  {docData.status || 'Verified Completed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            RECEIPT VOUCHER SPECIFIC BLOCK
            ========================================================================= */}
        {normType === 'receipt' && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-5 text-center space-y-3">
            <div className="max-w-md mx-auto space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-200">
                Official Transaction Voucher
              </span>
              <p className="text-xs text-slate-500">
                Acknowledged with thanks from <strong className="text-slate-900">{docData.partyName}</strong>
              </p>
              <p className="text-2xl font-black text-slate-950 tracking-tight font-mono">
                ₹{docData.amount?.toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                Rupees Three Thousand Only
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-3 border-t border-slate-200 text-[11px] text-left">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Payment Mode</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{docData.paymentMethod}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Credited Account Ledger</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{docData.accountName}</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TABLE OF ITEMS (INVOICES / QUOTATIONS / PURCHASES)
            ========================================================================= */}
        {['invoice', 'quotation', 'purchase'].includes(normType) && docData.items && (
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 bg-slate-50 tracking-wider">
                  <th className={`${tablePadding} w-8`}>#</th>
                  <th className={tablePadding}>Assay Service / Item Code</th>
                  {showHsnSac && <th className={`${tablePadding} text-center w-20`}>HSN/SAC</th>}
                  <th className={`${tablePadding} text-center w-12`}>Qty</th>
                  <th className={`${tablePadding} text-right w-20`}>Rate</th>
                  {showDiscount && <th className={`${tablePadding} text-right w-16`}>Disc %</th>}
                  {showTaxColumns && <th className={`${tablePadding} text-right w-16`}>GST</th>}
                  <th className={`${tablePadding} text-right w-24`}>Total Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {docData.items.map((it: any, idx: number) => (
                  <tr key={it.id || idx}>
                    <td className={`${tablePadding} font-mono text-[10px] text-slate-400`}>{idx + 1}</td>
                    <td className={tablePadding}>
                      <p className="font-bold text-slate-900">{it.itemName}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Code: {it.itemCode}</p>
                    </td>
                    {showHsnSac && <td className={`${tablePadding} text-center font-mono text-slate-600`}>{it.hsn || '998346'}</td>}
                    <td className={`${tablePadding} text-center font-mono font-bold text-slate-800`}>{it.quantity}</td>
                    <td className={`${tablePadding} text-right font-mono`}>₹{it.rate?.toLocaleString()}</td>
                    {showDiscount && <td className={`${tablePadding} text-right font-mono text-emerald-600`}>{it.discountPercent || 0}%</td>}
                    {showTaxColumns && <td className={`${tablePadding} text-right font-mono text-slate-500`}>{it.taxPercent || 18}%</td>}
                    <td className={`${tablePadding} text-right font-mono font-bold text-slate-900`}>₹{it.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================================================
            TABLE OF CLINICAL ASSAYS (LAB REPORTS)
            ========================================================================= */}
        {normType === 'labReport' && docData.testAssignments && (
          <div className="space-y-4 mb-5">
            <div className="text-white px-3 py-1.5 rounded flex justify-between items-center text-[9px] font-black uppercase tracking-wider" style={primaryBg}>
              <span>Chemical & Biological Parameter Results Certification</span>
              <span className="text-blue-200 font-mono">NABL ISO/IEC 17025 Worksheets</span>
            </div>

            {docData.testAssignments.map((test: any, tIdx: number) => (
              <div key={tIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">{test.testName}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-black uppercase text-[8px] border border-emerald-200">
                    NABL ACCREDITED PARAMETER
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase bg-slate-50/50">
                      <th className="py-1.5 px-3">#</th>
                      <th className="py-1.5 px-3">Analyte Tested</th>
                      <th className="py-1.5 px-3 text-center">Observed Value</th>
                      <th className="py-1.5 px-3">Unit</th>
                      <th className="py-1.5 px-3">Regulatory Reference Limits</th>
                      <th className="py-1.5 px-3">Testing Standard Protocols</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[10.5px] text-slate-700">
                    {test.parameters.map((param: any, pIdx: number) => {
                      const isHigh = param.status === 'High' || param.status === 'Abnormal';
                      return (
                        <tr key={pIdx}>
                          <td className="py-1.5 px-3 font-mono text-[9px] text-slate-400">{pIdx + 1}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{param.name}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                              isHigh ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-800'
                            }`}>
                              {param.result}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 font-medium text-slate-600">{param.unit}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-500">{param.referenceRange}</td>
                          <td className="py-1.5 px-3 text-slate-400 italic font-mono text-[9px]">{param.method}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
            TOTAL CALCULATIONS CONTAINER (INVOICES / QUOTATIONS / PURCHASES)
            ========================================================================= */}
        {['invoice', 'quotation', 'purchase'].includes(normType) && (
          <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-5 pt-3 border-t border-slate-200">
            {/* Notes / Bank details on left */}
            <div className="flex-1 space-y-3 text-[11px] w-full">
              {showBankDetails && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-150">LIMS Remittance Settlement Bank:</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600 font-medium">
                    <p>Bank: <strong className="text-slate-800">{settings.bank?.bankName || 'HDFC Bank'}</strong></p>
                    <p>Account Holder: <strong className="text-slate-800">{settings.bank?.accountHolderName || company.labName}</strong></p>
                    <p>A/C Number: <strong className="text-slate-800 font-mono">{settings.bank?.accountNumber || '50200049123849'}</strong></p>
                    <p>IFSC: <strong className="text-slate-800 font-mono">{settings.bank?.ifsc || 'HDFC0000140'}</strong></p>
                  </div>
                </div>
              )}

              {showNotes && docData.notes && (
                <div>
                  <h5 className="font-black text-slate-700 uppercase tracking-wide text-[9px] mb-1">Ledger Notes:</h5>
                  <p className="text-slate-500 italic bg-slate-50/50 p-2 rounded border border-slate-150 leading-relaxed whitespace-pre-line">
                    {docData.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations summaries on right */}
            <div className="w-60 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Items Subtotal:</span>
                <span className="font-mono text-slate-700">₹{docData.subtotal?.toLocaleString()}</span>
              </div>

              {showDiscount && docData.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Aggregate Discount:</span>
                  <span className="font-mono">- ₹{docData.discountAmount?.toLocaleString()}</span>
                </div>
              )}

              {showTaxColumns && docData.taxAmount > 0 && (
                <div className="space-y-1 pt-1">
                  {docTemplateId === 'tally_gst' || docTemplateId === 'gst_detailed' ? (
                    // Detailed central and state taxes splits
                    <>
                      <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                        <span>CGST (9%):</span>
                        <span>+ ₹{(docData.taxAmount / 2)?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[10px] pb-1 border-b border-dashed border-slate-200">
                        <span>SGST (9%):</span>
                        <span>+ ₹{(docData.taxAmount / 2)?.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Accrued GST (18%):</span>
                      <span className="font-mono text-slate-700">+ ₹{docData.taxAmount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {docData.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Logistics/Expedite Charge:</span>
                  <span className="font-mono text-slate-700">+ ₹{docData.additionalCharges?.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-slate-900 pt-1.5 flex justify-between font-black text-xs text-slate-950 uppercase tracking-wide">
                <span>Grand Aggregate Total:</span>
                <span className="font-mono text-sm" style={primaryText}>₹{docData.total?.toLocaleString()}</span>
              </div>

              {normType === 'invoice' && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Amount Acknowledged:</span>
                    <span className="font-mono">₹{docData.amountPaid?.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-black text-rose-600 text-xs">
                    <span>Balance Due Recurrent:</span>
                    <span className="font-mono">₹{docData.balanceDue?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          QR CODES & SECURITY DIGITAL SIGNATURE FOOTERS
          ========================================================================= */}
      <div className="border-t border-slate-200 pt-4 mt-4 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* UPI QR Payment Block */}
          <div className="sm:col-span-4 text-center sm:text-left">
            {showQrPayment && settings.bank?.upiId && (
              <div className="inline-flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-150">
                <div className="p-1 bg-white rounded border border-slate-200 shrink-0">
                  <QrCode size={40} className="text-slate-800" />
                </div>
                <div className="text-[9px] text-left">
                  <p className="font-black text-slate-800 uppercase tracking-wider">UPI SCAN TO PAY</p>
                  <p className="font-mono text-slate-500 font-bold">{settings.bank.upiId}</p>
                  <p className="text-[8px] text-slate-400 font-bold">Acc: {settings.bank.upiDisplayName || company.labName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Business Terms Policy */}
          <div className="sm:col-span-5 text-slate-500 text-[9.5px] leading-tight">
            {showTerms && docData.terms && (
              <>
                <p className="font-black text-slate-700 uppercase tracking-wide text-[8.5px] mb-1">Standard Terms & Policy:</p>
                <p className="whitespace-pre-line text-slate-400 leading-tight">{docData.terms}</p>
              </>
            )}
          </div>

          {/* Signatory Authority */}
          <div className="sm:col-span-3 text-center flex flex-col justify-end items-center h-16">
            {showSignature && (
              <>
                <div className="h-8 flex items-center justify-center">
                  <div className="border border-dashed border-blue-400/80 bg-blue-50/50 text-blue-600 rounded-sm font-black text-[8px] tracking-widest px-1.5 py-0.5 uppercase rotate-[-2deg]">
                    ★ LabBiz Secured ★
                  </div>
                </div>
                <div className="border-t border-slate-300 w-full pt-1 text-[8.5px] text-slate-400 uppercase tracking-widest font-black">
                  {normType === 'labReport' ? settings.report?.signatureText || 'Reviewing Scientist' : settings.invoice?.signatureText || 'Authorized Signatory'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Unified footer address line */}
        {showFooter && footerText && (
          <div className="text-center text-[9px] text-slate-400 mt-4 pt-2 border-t border-slate-100 uppercase tracking-wider font-semibold">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
}
