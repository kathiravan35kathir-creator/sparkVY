import React, { useRef } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  Mail,
  Check,
  Smartphone,
  CheckCircle,
  FileText,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { AppSettings, Invoice, Quotation, Purchase, Payment, Sample, LabReport } from '../types';

interface DocumentPrintViewProps {
  documentType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'report' | 'sample_label';
  data: any; // Can be Invoice | Quotation | Purchase | Payment | Sample | LabReport
  settings: AppSettings;
  onClose: () => void;
}

export default function DocumentPrintView({
  documentType,
  data,
  settings,
  onClose
}: DocumentPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [shareSuccess, setShareSuccess] = React.useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = React.useState<string>(
    settings.print.printCopyLabels[0] || 'Original for Buyer'
  );

  // Get active template name
  const getActiveTemplate = () => {
    switch (documentType) {
      case 'invoice':
        return settings.print.invoiceTemplate;
      case 'quotation':
        return settings.print.quotationTemplate;
      case 'receipt':
        return settings.print.receiptTemplate;
      case 'purchase':
        return settings.print.purchaseTemplate;
      case 'report':
        return settings.print.labReportTemplate;
      case 'sample_label':
        return settings.print.sampleLabelTemplate;
      default:
        return 'tally_modern';
    }
  };

  const activeTemplate = getActiveTemplate();

  // Handle browser native printing
  const handlePrint = () => {
    // Save current title
    const originalTitle = document.title;
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';
    
    document.title = `${documentType.toUpperCase()}_${docNum}`;
    window.print();
    // Restore title
    document.title = originalTitle;
  };

  // Simulated PDF download helper
  const handleDownloadPDF = () => {
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';

    // Create custom download indicator
    const element = document.createElement('a');
    const fileContent = `LabBiz Digital PDF Document\n` +
      `========================\n` +
      `Type: ${documentType.toUpperCase()}\n` +
      `Document No: ${docNum}\n` +
      `Client: ${data.partyName || data.supplierName || 'General'}\n` +
      `Total Amount: ₹${data.total || data.amountPaid || 0}\n` +
      `Date: ${data.invoiceDate || data.quotationDate || data.paymentDate || '2026-07-14'}\n` +
      `Verified via electronic signature.\n\n` +
      `Rendered successfully via ${activeTemplate.toUpperCase()} layout.`;

    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentType}_${docNum}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setShareSuccess('PDF generated & downloaded to device');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  // Dynamic WhatsApp pre-filled text
  const handleShareWhatsApp = () => {
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';

    const text = `Dear Client, here is your ${documentType} from ${settings.company.labName}. Code: ${docNum}. Amount: ₹${data.total || data.amountPaid || 0}. Please review. Thank you!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShareSuccess('Redirecting to WhatsApp web...');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  // Dynamic Email sharing
  const handleShareEmail = () => {
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';

    const subject = `${documentType.toUpperCase()} - ${docNum} from ${settings.company.labName}`;
    const body = `Dear Client,\n\nPlease find attached the ${documentType} details.\n\nDocument Code: ${docNum}\nDate: ${data.invoiceDate || data.quotationDate || '2026-07-14'}\nAmount Due/Paid: ₹${data.total || data.amountPaid || 0}\n\nThank you for choosing ${settings.company.labName}.\n\nBest Regards,\nAccounts Desk`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    setShareSuccess('Opening email composer...');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  const pSettings = settings.print;
  const primaryColor = pSettings.primaryColor || '#2563EB';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-xs">
      {/* Container holding controls and paper sheet */}
      <div className="bg-slate-100 border border-slate-300 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        
        {/* TOP INTERACTIVE COMMAND BAR */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap justify-between items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 bg-blue-600 rounded text-white">
              <Printer size={15} />
            </span>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide uppercase">
                {documentType.replace('_', ' ')} Print Hub
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Active Layout: <strong className="text-blue-400 uppercase">{activeTemplate.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copy selector if defined */}
            {settings.print.printCopyLabels.length > 0 && (
              <select
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-[11px] font-semibold focus:outline-none"
              >
                {settings.print.printCopyLabels.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-blue-600 text-white px-3 py-1.5 rounded text-[11px] font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded text-[11px] font-semibold hover:bg-slate-700 transition cursor-pointer"
            >
              <Download size={13} />
              <span>PDF Download</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-700 text-white rounded text-[11px] font-semibold hover:bg-emerald-600 transition cursor-pointer"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded text-[11px] font-semibold hover:bg-slate-700 transition cursor-pointer"
            >
              <Mail size={13} />
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {shareSuccess && (
          <div className="bg-blue-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center space-x-1.5 animate-pulse shrink-0 print:hidden">
            <CheckCircle size={14} />
            <span>{shareSuccess}</span>
          </div>
        )}

        {/* PRINTABLE CANVAS BLOCK */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-300/40 print:p-0 print:bg-white print:overflow-visible">
          {/* Paper Sheet container */}
          <div
            ref={printRef}
            id="printable-document-sheet"
            className="bg-white text-[#1E293B] shadow-lg border border-slate-200 w-full max-w-3xl min-h-[1050px] p-6 sm:p-10 font-sans relative overflow-hidden print:shadow-none print:border-none print:p-0 print:max-w-full print:min-h-0"
            style={{ fontFamily: settings.print.fontFamily }}
          >
            {/* Header Watermark / Label banner */}
            {selectedLabel && (
              <div className="absolute top-2 right-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest print:top-1 print:right-2">
                {selectedLabel}
              </div>
            )}

            {/* Render selected layout */}
            {activeTemplate === 'tally_classic' && (
              <TallyClassicLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'tally_modern' && (
              <TallyModernLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'corporate_blue' && (
              <CorporateBlueLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'executive_minimal' && (
              <ExecutiveMinimalLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'gst_detailed' && (
              <GSTDetailedLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'compact_business' && (
              <CompactBusinessLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'premium_lab' && (
              <PremiumLabLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'research_report' && (
              <ResearchReportLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'receipt_pro' && (
              <ReceiptProLayout documentType={documentType} data={data} settings={settings} />
            )}
            {activeTemplate === 'thermal_compact' && (
              <ThermalCompactLayout documentType={documentType} data={data} settings={settings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 1. TALLY CLASSIC TEMPLATE
function TallyClassicLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  const isInvoice = documentType === 'invoice';
  return (
    <div className="border-[3px] border-slate-900 p-4 text-[11px] leading-normal font-mono h-full flex flex-col justify-between">
      {/* Top Section */}
      <div>
        <div className="text-center border-b-2 border-slate-950 pb-2">
          <h2 className="text-sm font-black tracking-wider uppercase">{settings.company.legalName}</h2>
          <p className="text-[10px] mt-0.5">{settings.company.address}</p>
          <p className="text-[10px]">GSTIN: {settings.company.gstNumber} | Phone: {settings.company.primaryPhone}</p>
        </div>

        {/* Info Block */}
        <div className="grid grid-cols-2 border-b-2 border-slate-950">
          <div className="p-2 border-r-2 border-slate-950 space-y-1">
            <p className="text-[9px] font-extrabold text-slate-500 uppercase">Party Details / Consignee:</p>
            <p className="font-extrabold text-xs">{data.partyName || data.supplierName || 'General Customer'}</p>
            <p className="text-[10px] text-slate-600">Plot 12, Industrial Area Complex, Karnataka</p>
            <p className="text-[10px]">GSTIN: {data.gstNumber || 'N/A'}</p>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex justify-between">
              <span>Doc No:</span>
              <strong className="font-bold">{data.invoiceNumber || data.quotationNumber || data.purchaseNumber || 'N/A'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Dated:</span>
              <span className="font-bold">{data.invoiceDate || data.quotationDate || '2026-07-14'}</span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span>{data.dueDate || data.expiryDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Place of Supply:</span>
              <span>{settings.tax.placeOfSupply}</span>
            </div>
          </div>
        </div>

        {/* Table items */}
        <table className="w-full text-left border-collapse mt-3 border border-slate-900">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-50 font-bold">
              <th className="p-1.5 border-r border-slate-900">#</th>
              <th className="p-1.5 border-r border-slate-900">Description of Goods/Services</th>
              <th className="p-1.5 border-r border-slate-900 text-center">HSN/SAC</th>
              <th className="p-1.5 border-r border-slate-900 text-center">Qty</th>
              <th className="p-1.5 border-r border-slate-900 text-right">Rate</th>
              <th className="p-1.5 border-r border-slate-900 text-center">GST %</th>
              <th className="p-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {(data.items || []).map((it: any, idx: number) => (
              <tr key={idx}>
                <td className="p-1.5 border-r border-slate-900 text-center">{idx + 1}</td>
                <td className="p-1.5 border-r border-slate-900 font-bold">{it.itemName}</td>
                <td className="p-1.5 border-r border-slate-900 text-center">998346</td>
                <td className="p-1.5 border-r border-slate-900 text-center font-bold">{it.quantity}</td>
                <td className="p-1.5 border-r border-slate-900 text-right font-mono">₹{it.rate.toLocaleString()}</td>
                <td className="p-1.5 border-r border-slate-900 text-center">{it.taxPercent || 18}%</td>
                <td className="p-1.5 text-right font-mono font-bold">₹{it.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Block */}
      <div className="mt-8 border-t-2 border-slate-950 pt-3">
        <div className="flex justify-between items-start">
          <div className="w-2/3 pr-4 space-y-1.5 text-[10px]">
            <p className="font-black uppercase text-slate-500">Terms of Sale & Declaration:</p>
            <p className="whitespace-pre-line text-slate-600 leading-normal">{data.terms || settings.invoice.terms}</p>
          </div>
          <div className="w-1/3 text-right space-y-1 border border-slate-900 p-2 bg-slate-50/50">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹{(data.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax:</span>
              <span className="font-mono">₹{(data.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-900 pt-1 text-xs">
              <span>Total:</span>
              <span className="font-mono">₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 mt-8 border-t border-slate-900 pt-6">
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400">Receiver's Seal & Signature:</p>
            <div className="h-10" />
            <div className="border-t border-dashed border-slate-300 w-36" />
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-slate-400">For {settings.company.legalName}:</p>
            <div className="h-10" />
            <p className="text-[10px] font-bold text-slate-800">{settings.invoice.signatureText}</p>
            <p className="text-[8px] text-slate-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. TALLY MODERN TEMPLATE
function TallyModernLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[12px] leading-relaxed flex flex-col justify-between h-full">
      <div>
        {/* Modern clean corporate header */}
        <div className="flex justify-between items-start border-b border-blue-200 pb-4">
          <div>
            <span className="bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded text-xs">
              LABBIZ SERVICES
            </span>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">{settings.company.legalName}</h1>
            <p className="text-xs text-slate-500 max-w-sm mt-1">{settings.company.address}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-extrabold text-blue-600 uppercase tracking-wider">{documentType.toUpperCase()}</h2>
            <p className="font-mono font-bold text-slate-800 mt-1">Ref: {data.invoiceNumber || data.quotationNumber || data.purchaseNumber || 'N/A'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Date: {data.invoiceDate || data.quotationDate || '2026-07-14'}</p>
          </div>
        </div>

        {/* Party Billing Box */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Consignee</p>
            <h4 className="font-black text-slate-900 text-sm">{data.partyName || data.supplierName || 'General Customer'}</h4>
            <p className="text-slate-500 text-[11px] mt-1">Registered Address, District Complex, Karnataka</p>
            <p className="text-slate-700 mt-1 font-mono">GSTIN: {data.gstNumber || '29AAAAA0000Z1'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 text-right space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Reference</p>
            <p>Payment Mode: <strong className="font-bold text-slate-800">UPI / QR Code</strong></p>
            <p>Time Zone: <span className="font-mono">Asia/Kolkata</span></p>
            <p>Accreditation: <strong className="text-emerald-700">{settings.report.accreditationText}</strong></p>
          </div>
        </div>

        {/* Modern Zebra Table */}
        <table className="w-full text-left mt-6 border-collapse">
          <thead>
            <tr className="border-b border-blue-600 bg-blue-50/50 text-slate-700 text-[10px] font-black uppercase">
              <th className="py-2 px-3">No</th>
              <th className="py-2 px-3">Billed Item / Service Specification</th>
              <th className="py-2 px-3 text-center">Quantity</th>
              <th className="py-2 px-3 text-right">Rate</th>
              <th className="py-2 px-3 text-right">Tax (GST)</th>
              <th className="py-2 px-3 text-right">Line Sum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.items || []).map((it: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-3">
                  <p className="font-bold text-slate-800">{it.itemName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Item Code: {it.itemCode || 'SRV-01'}</p>
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                <td className="py-3 px-3 text-right font-mono">₹{it.rate.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-500">{it.taxPercent || 18}%</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{it.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Totals Block */}
      <div className="mt-8 border-t border-slate-200 pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4">
          <div className="w-full sm:w-1/2">
            <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Invoicing T&C</h5>
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed mt-1">{data.terms || settings.invoice.terms}</p>
          </div>
          <div className="w-full sm:w-1/3 bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Gross Total:</span>
              <span className="font-mono">₹{(data.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (GST):</span>
              <span className="font-mono text-slate-700">+ ₹{(data.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-950">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-600">₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modern Signatures footer */}
        <div className="flex justify-between items-end mt-10">
          <div className="text-center text-[10px] text-slate-400">
            <p className="font-bold text-slate-700">{settings.company.legalName}</p>
            <p className="mt-0.5">Secure QR-Verified Digital Invoicing</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Authorized Desk</p>
            <div className="h-6" />
            <p className="font-extrabold text-xs text-slate-900">{settings.invoice.signatureText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. CORPORATE BLUE TEMPLATE
function CorporateBlueLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[12px] leading-relaxed flex flex-col justify-between h-full">
      <div>
        {/* Striking deep blue header banner */}
        <div className="bg-blue-900 text-white p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">{settings.company.legalName}</h1>
            <p className="text-[11px] text-blue-200 max-w-sm mt-1">{settings.company.address}</p>
            <p className="text-[11px] text-blue-200 mt-0.5">Email: {settings.company.email} | Tel: {settings.company.primaryPhone}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {documentType}
            </span>
            <p className="text-lg font-black font-mono mt-2">{data.invoiceNumber || data.quotationNumber || data.purchaseNumber || 'N/A'}</p>
            <p className="text-[11px] text-blue-200 mt-1">Date: {data.invoiceDate || data.quotationDate || '2026-07-14'}</p>
          </div>
        </div>

        {/* Client Box */}
        <div className="mt-6 grid grid-cols-2 gap-6 p-2">
          <div>
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">BILL TO:</h4>
            <p className="font-extrabold text-sm text-slate-900">{data.partyName || data.supplierName || 'General Client'}</p>
            <p className="text-slate-500 mt-1">Plot 24, Outer Ring Road, Whitefield, Bangalore</p>
            <p className="text-slate-700 font-mono mt-0.5">GSTIN: {data.gstNumber || '29AAAAA0000Z1'}</p>
          </div>
          <div className="text-left sm:text-right">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">ACCERN / REFERENCES:</h4>
            <p className="text-slate-600">Place of Supply: <strong>{settings.tax.placeOfSupply}</strong></p>
            <p className="text-slate-600">Validity Period: <strong>30 Working Days</strong></p>
            <p className="text-slate-600">Verification: <strong className="text-emerald-600">NABL ISO-Certified</strong></p>
          </div>
        </div>

        {/* Minimal Table */}
        <table className="w-full text-left mt-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-blue-900 font-bold text-slate-700">
              <th className="py-2.5 px-1">#</th>
              <th className="py-2.5 px-2">Assay Assay Description</th>
              <th className="py-2.5 px-2 text-center">Qty</th>
              <th className="py-2.5 px-2 text-right">Standard Rate</th>
              <th className="py-2.5 px-2 text-right">Line Sum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.items || []).map((it: any, idx: number) => (
              <tr key={idx}>
                <td className="py-3 px-1 text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-3 px-2">
                  <p className="font-bold text-slate-800">{it.itemName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: 998346</p>
                </td>
                <td className="py-3 px-2 text-center font-bold text-slate-800">{it.quantity}</td>
                <td className="py-3 px-2 text-right font-mono">₹{it.rate.toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">₹{it.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="mt-8 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
          <div className="w-full sm:w-2/3">
            <h5 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Invoicing Directives</h5>
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">{data.terms || settings.invoice.terms}</p>
          </div>
          <div className="w-full sm:w-1/3 bg-slate-50 p-4 rounded-xl border border-blue-100 text-right space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Total:</span>
              <span className="font-mono">₹{(data.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GSTIN Tax:</span>
              <span className="font-mono text-slate-600">+ ₹{(data.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-blue-200 pt-1.5 flex justify-between font-black text-slate-950 text-sm">
              <span>Payable Total:</span>
              <span className="font-mono text-blue-900">₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">Printed via Corporate Blue Template Suite</p>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Authorized Clerk</p>
            <p className="font-extrabold text-xs text-slate-800 mt-1">{settings.invoice.signatureText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. EXECUTIVE MINIMAL TEMPLATE
function ExecutiveMinimalLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[11px] leading-relaxed flex flex-col justify-between h-full font-serif p-2">
      <div>
        {/* B&W ultra clean serif layout */}
        <div className="border-b border-slate-900 pb-4 flex justify-between items-baseline">
          <div>
            <h1 className="text-2xl font-normal uppercase tracking-widest text-slate-900">{settings.company.legalName}</h1>
            <p className="font-sans text-[10px] text-slate-400 uppercase tracking-wider mt-1">{settings.company.address}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-normal uppercase tracking-widest text-slate-500">{documentType}</h2>
          </div>
        </div>

        {/* Ref and Dates */}
        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 py-4 font-sans text-[10px] uppercase tracking-wider">
          <div>
            <span className="text-slate-400 block">Doc Number</span>
            <strong className="text-slate-800 text-xs block mt-0.5">{data.invoiceNumber || data.quotationNumber || data.purchaseNumber || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Inception Date</span>
            <strong className="text-slate-800 text-xs block mt-0.5">{data.invoiceDate || data.quotationDate || '2026-07-14'}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Valid Until</span>
            <strong className="text-slate-800 text-xs block mt-0.5">{data.dueDate || data.expiryDate || 'N/A'}</strong>
          </div>
        </div>

        {/* Parties */}
        <div className="py-6 font-sans">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">Billed Recipient</p>
          <h3 className="text-sm font-bold text-slate-900">{data.partyName || data.supplierName || 'General Recipient'}</h3>
          <p className="text-slate-500 mt-1 max-w-md uppercase tracking-wider text-[9px]">Industrial Plating Center, Sector 12, Karnataka</p>
          <p className="text-slate-700 mt-1 font-mono text-[10px]">GST: {data.gstNumber || 'N/A'}</p>
        </div>

        {/* Minimal Table */}
        <table className="w-full text-left font-sans text-[10px] uppercase tracking-wider">
          <thead>
            <tr className="border-b border-slate-900 text-slate-500">
              <th className="py-2">Ref</th>
              <th className="py-2">Assay Details</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.items || []).map((it: any, idx: number) => (
              <tr key={idx} className="text-slate-700">
                <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3">
                  <p className="font-bold text-slate-800 text-xs normal-case font-serif">{it.itemName}</p>
                </td>
                <td className="py-3 text-center font-mono font-bold">{it.quantity}</td>
                <td className="py-3 text-right font-mono">₹{it.rate.toLocaleString()}</td>
                <td className="py-3 text-right font-mono font-bold text-slate-950">₹{it.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals and conditions */}
      <div className="mt-12 font-sans border-t border-slate-200 pt-6">
        <div className="flex justify-between items-start">
          <div className="w-1/2">
            <h5 className="font-extrabold text-[9px] uppercase tracking-widest text-slate-400 mb-1">Directives</h5>
            <p className="text-[10px] text-slate-500 normal-case font-serif leading-relaxed">{data.terms || settings.invoice.terms}</p>
          </div>
          <div className="w-1/3 text-right space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 uppercase tracking-wider">Subtotal:</span>
              <span>₹{(data.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 uppercase tracking-wider">GST tax:</span>
              <span>+ ₹{(data.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span className="uppercase tracking-wider">Total:</span>
              <span>₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-end text-[9px] uppercase tracking-widest text-slate-400">
          <p>Verified Secure Certificate</p>
          <div className="text-right">
            <p>{settings.invoice.signatureText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. GST DETAILED TEMPLATE (Strict Indian Format)
function GSTDetailedLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  const cgstAmount = (data.taxAmount || 0) / 2;
  const sgstAmount = (data.taxAmount || 0) / 2;
  return (
    <div className="text-[11px] leading-relaxed flex flex-col justify-between h-full border border-slate-300 p-2">
      <div>
        {/* Title Tag */}
        <div className="text-center border-b border-slate-300 pb-3">
          <h1 className="text-lg font-black tracking-widest uppercase text-slate-900">{settings.tax.taxInvoiceLabel}</h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Rules 46 of Central Goods and Services Tax Rules, 2017</p>
        </div>

        {/* GST Grid Profile */}
        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="p-3 border-r border-slate-300 space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Provider / Supplier:</p>
            <h2 className="font-extrabold text-slate-900 text-xs">{settings.company.legalName}</h2>
            <p className="text-slate-500">{settings.company.address}</p>
            <p className="font-bold text-slate-800">GSTIN: <span className="font-mono text-blue-700">{settings.company.gstNumber}</span></p>
            <p className="text-[10px]">PAN: <span className="font-mono">{settings.company.pan}</span></p>
          </div>
          <div className="p-3 space-y-1 text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Document Index:</p>
            <p>Invoice No: <strong className="font-mono text-slate-900">{data.invoiceNumber || 'INV-001'}</strong></p>
            <p>Date of Issue: <strong className="font-mono">{data.invoiceDate || '2026-07-14'}</strong></p>
            <p>Place of Supply: <strong>{settings.tax.placeOfSupply}</strong></p>
            <p>Reverse Charge: <strong>{settings.tax.reverseChargeOption ? 'Yes' : 'No'}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-slate-300 p-3 bg-slate-50/50">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Recipient (Billed To):</p>
            <h3 className="font-extrabold text-slate-900">{data.partyName || 'Corporate Client'}</h3>
            <p className="text-slate-500">SEZ Zone Sector 5, Bangalore Urban, Karnataka</p>
            <p className="font-bold">GSTIN: <span className="font-mono text-blue-700">{data.gstNumber || 'N/A'}</span></p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Consignee (Shipped To):</p>
            <p className="text-slate-800 font-bold">{data.partyName || 'Same as Recipient'}</p>
            <p className="text-slate-500">Same address deliveries</p>
          </div>
        </div>

        {/* GST Column table breakdown */}
        <table className="w-full text-left mt-4 border-collapse border border-slate-300">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
              <th className="p-2 border-r border-slate-300">#</th>
              <th className="p-2 border-r border-slate-300">Description of Service</th>
              <th className="p-2 border-r border-slate-300 text-center">HSN</th>
              <th className="p-2 border-r border-slate-300 text-center">Qty</th>
              <th className="p-2 border-r border-slate-300 text-right">Taxable Value</th>
              <th className="p-2 border-r border-slate-300 text-center">CGST</th>
              <th className="p-2 border-r border-slate-300 text-center">SGST</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data.items || []).map((it: any, idx: number) => {
              const halfTax = (it.taxPercent || 18) / 2;
              const itTaxVal = it.amount - (it.amount / (1 + (it.taxPercent || 18)/100));
              const itTaxableVal = it.amount - itTaxVal;
              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-300">
                    <p className="font-bold text-slate-800">{it.itemName}</p>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">998346</td>
                  <td className="p-2 border-r border-slate-300 text-center font-bold">{it.quantity}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">₹{itTaxableVal.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">
                    {halfTax}%<br /><span className="text-slate-400 text-[8px]">₹{(itTaxVal/2).toFixed(2)}</span>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">
                    {halfTax}%<br /><span className="text-slate-400 text-[8px]">₹{(itTaxVal/2).toFixed(2)}</span>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">₹{it.amount.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GST Split Summary Footer */}
      <div className="mt-6 border-t border-slate-300 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 border border-slate-200 p-2.5 rounded bg-slate-50/50">
            <h5 className="font-extrabold text-[9px] uppercase text-slate-400 mb-1">Company Bank Details</h5>
            <p>Bank: <strong>{settings.bank.bankName}</strong></p>
            <p>A/c Number: <strong className="font-mono">{settings.bank.accountNumber}</strong></p>
            <p>IFSC Code: <strong className="font-mono">{settings.bank.ifsc}</strong></p>
            <p>UPI ID: <strong className="font-mono text-blue-700">{settings.bank.upiId}</strong></p>
          </div>
          <div className="text-right space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Taxable Subtotal Value:</span>
              <span>₹{((data.subtotal || 0) * 0.847).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Central Tax (CGST 9%):</span>
              <span>+ ₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>State Tax (SGST 9%):</span>
              <span>+ ₹{sgstAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-900 pt-1.5 flex justify-between font-black text-slate-950 text-xs">
              <span>Aggregate GST Bill:</span>
              <span className="text-blue-700">₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 pt-4 border-t border-slate-200 text-[9px] text-slate-400">
          <div>
            <p className="font-bold text-slate-600">Declaration Clause:</p>
            <p className="max-w-sm leading-normal">We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.</p>
          </div>
          <div className="text-right">
            <p className="uppercase font-bold">Authorized Signatory for Provider</p>
            <div className="h-6" />
            <p className="font-bold text-slate-700">{settings.invoice.signatureText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. COMPACT BUSINESS TEMPLATE
function CompactBusinessLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[10px] leading-snug flex flex-col justify-between h-full p-1">
      <div>
        <div className="flex justify-between items-center border-b border-slate-300 pb-2">
          <div>
            <h1 className="text-sm font-black uppercase">{settings.company.displayLabName}</h1>
            <p className="text-[9px] text-slate-400">{settings.company.email} | {settings.company.primaryPhone}</p>
          </div>
          <div className="text-right font-mono">
            <p className="font-bold text-slate-800">{data.invoiceNumber || data.quotationNumber || 'N/A'}</p>
            <p className="text-[9px] text-slate-400">{data.invoiceDate || '2026-07-14'}</p>
          </div>
        </div>

        <div className="py-2 border-b border-slate-200 text-slate-600">
          <p>Billed to: <strong>{data.partyName || 'General'}</strong></p>
        </div>

        <table className="w-full text-left mt-3 border-collapse">
          <thead>
            <tr className="border-b border-slate-300 font-bold bg-slate-50 text-slate-500">
              <th className="py-1">Description</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Sum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.items || []).map((it: any, idx: number) => (
              <tr key={idx}>
                <td className="py-1.5 font-bold text-slate-800">{it.itemName}</td>
                <td className="py-1.5 text-center">{it.quantity}</td>
                <td className="py-1.5 text-right font-mono">₹{it.rate}</td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-900">₹{it.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-slate-300 pt-2 space-y-2">
        <div className="flex justify-end font-mono">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>₹{(data.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Rate (18%):</span>
              <span>₹{(data.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-300 pt-1 flex justify-between font-black text-slate-950">
              <span>Total:</span>
              <span>₹{(data.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <p className="text-[8px] text-slate-400 text-center">Generated via Compact Invoicing, LabBiz.</p>
      </div>
    </div>
  );
}

// 7. PREMIUM LAB REPORT TEMPLATE
function PremiumLabLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  // Setup sample test parameters to simulate a real NABL accredited report page!
  const defaultParameters = [
    { name: 'Total Aerobic Microbial Count', method: 'IS 5402 : 2012', result: '1.2 x 10³', unit: 'CFU/ml', limit: 'Max 1.0 x 10⁴ CFU/ml' },
    { name: 'Escherichia coli (E. coli)', method: 'IS 5887 (Part 1) : 1976', result: 'Absent', unit: 'per 25ml', limit: 'Absent / 25ml' },
    { name: 'Salmonella species', method: 'IS 5887 (Part 3) : 1999', result: 'Absent', unit: 'per 25ml', limit: 'Absent / 25ml' },
    { name: 'Yeast and Mould Count', method: 'IS 5403 : 1999', result: '< 10', unit: 'CFU/ml', limit: 'Max 100 CFU/ml' },
    { name: 'Staphylococcus aureus', method: 'IS 5887 (Part 2) : 1976', result: 'Absent', unit: 'per ml', limit: 'Absent / ml' }
  ];

  return (
    <div className="text-[12px] leading-relaxed flex flex-col justify-between h-full font-sans border-t-8 border-blue-600 pt-2">
      <div>
        {/* NABL / ISO Certified Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-lg font-black text-base">
              LB
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight">{settings.company.legalName}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{settings.report.header}</p>
              <p className="text-[10px] text-slate-500">{settings.company.address}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="border border-red-500 rounded p-1 inline-block bg-red-50">
              <span className="text-[9px] font-bold text-red-600 uppercase block">ISO/IEC 17025 Certified</span>
              <span className="text-[9px] text-slate-700 font-mono block">NABL Certificate: TC-8492</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Report Code: <strong className="font-mono text-slate-800">{data.reportNumber || 'REP-2026-0091'}</strong></p>
          </div>
        </div>

        {/* Patient / Customer Metadata block */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-4 text-xs">
          <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-150">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Client / Requestor Information:</p>
            <p className="font-black text-slate-900 text-sm">{data.partyName || 'Apex Bioscience Lab'}</p>
            <p className="text-slate-500 leading-snug">R&D Complex, Whitefield, Bangalore</p>
            <p className="text-slate-500">Contact: {data.primaryPhone || '+91 99000 12345'}</p>
          </div>
          <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Sample Registry Information:</p>
            <p>Sample Name: <strong className="font-sans text-slate-800">{data.sampleName || 'Drinking Tap Water'}</strong></p>
            <p>Batch / Code: <strong>{data.sampleCode || 'SMP-2026-0042'}</strong></p>
            <p>Date Received: <strong>2026-07-10</strong></p>
            <p>Date Analyzed: <strong>2026-07-13</strong></p>
          </div>
        </div>

        {/* Bio-Chemical Parameters assay table */}
        <div className="mt-6">
          <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2.5">Analytical Assay Findings</h3>
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <th className="p-2.5">Parameter Checked</th>
                <th className="p-2.5">Standard Method</th>
                <th className="p-2.5 text-center">Result Found</th>
                <th className="p-2.5 text-center">Unit</th>
                <th className="p-2.5 text-right">Acceptable Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {defaultParameters.map((param, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold font-sans text-slate-800">{param.name}</td>
                  <td className="p-2.5 text-slate-500 text-[11px]">{param.method}</td>
                  <td className={`p-2.5 text-center font-bold text-[13px] ${param.result === 'Absent' ? 'text-emerald-700 font-sans' : 'text-slate-900'}`}>
                    {param.result}
                  </td>
                  <td className="p-2.5 text-center text-slate-600">{param.unit}</td>
                  <td className="p-2.5 text-right text-slate-500 text-[11px] font-sans">{param.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Technical Interpretation Comments */}
        <div className="mt-6 p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-1">
          <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Lab Scientific Interpretation & Opinion:</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed font-serif">
            The sample microbiological counts comply fully with specified standard water guidelines under IS 10500:2012. 
            All standard indicator organisms including E. coli and Salmonella species were undetected, indicating safe biological potability for standard human consumption.
          </p>
        </div>
      </div>

      {/* Signature stamps & QR Code verification */}
      <div className="mt-8 border-t border-slate-300 pt-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3.5">
            <div className="border border-slate-300 p-1 bg-white rounded shrink-0">
              <QrCode size={44} className="text-slate-800" />
            </div>
            <div className="text-[10px] text-slate-400">
              <p className="font-bold text-slate-600">Secure Digital Report Verification</p>
              <p className="max-w-xs mt-0.5 leading-snug">Scan this secure QR code to verify the origin and authenticity of this accredited test report.</p>
            </div>
          </div>

          <div className="text-right space-y-4">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Chief Scientist & Laboratory Director</p>
            <div className="inline-block border border-dashed border-slate-300 p-1 bg-slate-50">
              <span className="font-extrabold text-[10px] text-slate-700 italic block">Dr. Anil Mehta, Ph.D.</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-sans">Digital Seal Stamp Applied</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[9px] text-slate-400 border-t border-slate-100 pt-3 text-center">
          <p>{settings.report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

// 8. RESEARCH REPORT TEMPLATE
function ResearchReportLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[12px] leading-relaxed flex flex-col justify-between h-full font-serif p-4">
      <div>
        {/* Academic / Scientific layout */}
        <div className="text-center border-b-2 border-slate-900 pb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NABL Accredited Research Circular</h2>
          <h1 className="text-xl font-normal text-slate-950 uppercase tracking-wider mt-1.5">{settings.company.legalName}</h1>
          <p className="font-sans text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{settings.report.header}</p>
        </div>

        {/* Report Metadata */}
        <div className="grid grid-cols-4 gap-4 py-4 border-b border-slate-200 text-[10px] uppercase font-sans text-slate-500">
          <div>
            <span>Report Serial:</span>
            <strong className="text-slate-800 block font-serif text-sm font-normal mt-0.5">{data.reportNumber || 'REP-9923'}</strong>
          </div>
          <div>
            <span>Issue Date:</span>
            <strong className="text-slate-800 block font-serif text-sm font-normal mt-0.5">{data.invoiceDate || '2026-07-14'}</strong>
          </div>
          <div>
            <span>Revision No:</span>
            <strong className="text-slate-800 block font-serif text-sm font-normal mt-0.5">Rev-0.2</strong>
          </div>
          <div className="text-right">
            <span>Security Index:</span>
            <strong className="text-slate-800 block font-mono text-[11px] mt-0.5">CONFIDENTIAL</strong>
          </div>
        </div>

        {/* Introduction */}
        <div className="py-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">1. Executive Investigation Abstract</h3>
          <p className="text-slate-700 leading-relaxed font-serif">
            This technical research digest details the chemical/biological assay investigations carried out on sample batch {data.sampleCode || 'SMP-2026-0042'} received on 2026-07-10. 
            The purpose of this analytical research circular is to document standard parameters under safe laboratory controls and provide a verified scientific conclusion for industrial review.
          </p>

          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-sans pt-3">2. Methodology & Instrumentation</h3>
          <p className="text-slate-700 leading-relaxed font-serif">
            Testing was conducted using calibrated instruments under controlled atmospheric standards (22°C, 50% Relative Humidity). 
            Chemical quantification was verified by high-pressure liquid chromatography (HPLC) and atomic absorption spectroscopy (AAS), adhering strictly to validated ISO standards.
          </p>
        </div>
      </div>

      {/* Disclaimers & signatures */}
      <div className="mt-12 pt-6 border-t border-slate-200 font-sans text-[10px]">
        <div className="flex justify-between items-end">
          <div className="space-y-1 max-w-sm text-slate-400">
            <p className="font-bold text-slate-500 uppercase tracking-wider">Research Integrity Assurance</p>
            <p className="text-[9px] leading-normal">{settings.report.disclaimer}</p>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-slate-700 text-xs italic font-serif">Dr. Anil Mehta, Ph.D.</p>
            <p className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Scientific Committee Chair</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. PAYMENT RECEIPT PRO TEMPLATE
function ReceiptProLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="text-[12px] leading-relaxed flex flex-col justify-between h-full p-4 font-mono">
      <div className="border border-double border-slate-900 p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-base font-black uppercase tracking-wide">{settings.company.legalName}</h2>
          <p className="text-[10px]">{settings.company.address}</p>
          <p className="text-xs font-bold bg-slate-900 text-white inline-block px-4 py-1 uppercase tracking-widest mt-3">Payment Receipt Voucher</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-dashed border-slate-400 py-3 text-xs">
          <div>
            <p>Receipt Code: <strong className="font-sans font-bold text-slate-900">{data.receiptNumber || 'REC-2026-0041'}</strong></p>
            <p>Receipt Date: <strong>{data.paymentDate || '2026-07-14'}</strong></p>
          </div>
          <div className="text-right">
            <p>Invoice Ref: <strong>{data.invoiceNumber || 'N/A'}</strong></p>
            <p>Payment Mode: <strong>{data.paymentMethod || 'UPI / NEFT'}</strong></p>
          </div>
        </div>

        <div className="space-y-2">
          <p>Received with thanks from:</p>
          <p className="text-base font-black font-sans text-slate-900 pl-4 border-l-4 border-slate-900">{data.partyName || 'Apex Healthcare Ltd'}</p>
          <p className="mt-4">The Sum of:</p>
          <div className="bg-slate-100 p-3 text-center border border-slate-300 font-sans text-lg font-black text-emerald-800">
            ₹{(data.amountPaid || data.total || 0).toLocaleString()} /-
          </div>
          <p className="text-[10px] text-slate-400 italic">Rupees: One Thousand Five Hundred Only</p>
        </div>

        <div className="grid grid-cols-2 pt-10 text-[10px]">
          <div>
            <p className="text-slate-400">Payment Channel Ledger:</p>
            <p className="font-bold">UPI / Cash / Ledger Credit</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Cashier Signature:</p>
            <div className="h-4" />
            <p className="font-bold border-t border-slate-300 pt-1 text-slate-700">Accounts Officer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 10. THERMAL COMPACT 80MM TEMPLATE
function ThermalCompactLayout({ documentType, data, settings }: { documentType: string; data: any; settings: AppSettings }) {
  return (
    <div className="w-[80mm] mx-auto text-[10px] leading-snug font-mono p-1">
      <div className="text-center space-y-1">
        <h2 className="text-xs font-black uppercase">{settings.company.displayLabName}</h2>
        <p className="text-[8px]">{settings.company.address.substring(0, 45)}...</p>
        <p className="text-[8px]">GSTIN: {settings.company.gstNumber}</p>
        <div className="border-t border-dashed border-slate-900 my-1" />
        <h3 className="font-bold uppercase text-[10px]">{documentType.toUpperCase()}</h3>
        <p>NO: {data.invoiceNumber || data.quotationNumber || 'N/A'}</p>
        <p>Date: {data.invoiceDate || '2026-07-14'}</p>
        <div className="border-t border-dashed border-slate-900 my-1" />
      </div>

      <div className="space-y-0.5">
        <p>Client: <strong className="font-sans font-bold">{data.partyName || 'Apex'}</strong></p>
        <div className="border-t border-dashed border-slate-300 my-1" />
      </div>

      <div className="space-y-1 mt-2">
        {(data.items || []).map((it: any, idx: number) => (
          <div key={idx} className="flex justify-between">
            <span>{it.itemName.substring(0, 18)}.. x{it.quantity}</span>
            <span>₹{it.amount}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-slate-900 my-2" />

      <div className="space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{(data.subtotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-xs">
          <span>GRAND TOTAL:</span>
          <span>₹{(data.total || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-900 my-2 text-center text-[8px] space-y-1">
        <p>Thank you for choosing LabBiz!</p>
        <p>This is a thermal computer bill copy.</p>
      </div>
    </div>
  );
}
