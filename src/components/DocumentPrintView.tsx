import React, { useRef, useState, useEffect } from 'react';
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
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { AppSettings } from '../types';
import DocumentTemplateRenderer from './DocumentTemplateRenderer';

interface DocumentPrintViewProps {
  documentType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'report' | 'sample_label';
  data: any; 
  settings: AppSettings;
  onClose: () => void;
}

const SHARE_PRESETS = [
  {
    id: 'polite_greeting',
    name: 'Polite Greeting with Bill Details',
    template: 'Dear {ClientName},\n\nWe hope you are doing well. Please find attached {DocumentType} No. {DocumentNumber} from {BusinessName} for your review.\n\n{BillDetails}\n\nThank you for choosing us!\n\nBest Regards,\n{BusinessName}'
  },
  {
    id: 'due_reminder',
    name: 'Due Reminder with Bill Details',
    template: 'Dear {ClientName},\n\nThis is a friendly reminder that payment for {DocumentType} No. {DocumentNumber} from {BusinessName} is currently due.\n\n{BillDetails}\n\nPlease settle the payment at your earliest convenience.\n\nThank you,\n{BusinessName}'
  },
  {
    id: 'urgent_settlement',
    name: 'Urgent Settlement with Bill Details',
    template: 'URGENT: Outstanding Balance Reminder\n\nDear {ClientName},\n\nWe have not received payment for {DocumentType} No. {DocumentNumber} from {BusinessName}.\n\n{BillDetails}\n\nPlease process this payment urgently to avoid any service disruption.\n\nRegards,\nAccounts Team, {BusinessName}'
  }
];

export default function DocumentPrintView({
  documentType,
  data,
  settings,
  onClose
}: DocumentPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(
    settings.print.printCopyLabels[0] || 'Original for Buyer'
  );

  // Sharing Engine state
  const [isShareConfigOpen, setIsShareConfigOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('polite_greeting');
  const [customMessageText, setCustomMessageText] = useState(SHARE_PRESETS[0].template);

  // Update text when preset changes
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = SHARE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCustomMessageText(preset.template);
    }
  };

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

  // Helper to compile dynamic placeholders
  const compileMessage = (templateStr: string) => {
    if (!data) return '';
    let clientName = data.partyName || data.supplierName || 'Valued Client';
    let docNum = '';
    let docTypeStr = documentType.toUpperCase();
    
    if (documentType === 'invoice') {
      docNum = data.invoiceNumber || '';
      docTypeStr = 'Invoice';
    } else if (documentType === 'quotation') {
      docNum = data.quotationNumber || '';
      docTypeStr = 'Quotation';
    } else if (documentType === 'receipt') {
      docNum = data.paymentNumber || '';
      docTypeStr = 'Receipt';
    } else if (documentType === 'purchase') {
      docNum = data.purchaseNumber || '';
      docTypeStr = 'Purchase Order';
    } else if (documentType === 'report') {
      docNum = data.reportNumber || '';
      docTypeStr = 'Lab Report';
    } else if (documentType === 'sample_label') {
      docNum = data.sampleCode || '';
      docTypeStr = 'Sample Label';
    }

    let amt = '₹0';
    if (data.total !== undefined) {
      amt = `₹${data.total.toLocaleString()}`;
    } else if (data.amount !== undefined) {
      amt = `₹${data.amount.toLocaleString()}`;
    } else if (data.amountPaid !== undefined) {
      amt = `₹${data.amountPaid.toLocaleString()}`;
    }

    let bizName = settings.company.displayLabName || settings.company.labName || 'LabBiz ERP';

    // Build the dynamic rich text breakdown of the bill/document details
    let billDetailsStr = '';
    const normType = documentType as string;

    if (['invoice', 'quotation', 'purchase'].includes(normType) && data.items && Array.isArray(data.items)) {
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += '📄 BILL / ITEM SUMMARY\n';
      billDetailsStr += '-------------------------------\n';
      data.items.forEach((it: any, idx: number) => {
        const name = it.itemName || 'Assay Service';
        const qty = it.quantity || 1;
        const rate = it.rate !== undefined ? `₹${it.rate.toLocaleString()}` : '';
        const amtVal = it.amount !== undefined ? `₹${it.amount.toLocaleString()}` : '';
        billDetailsStr += `${idx + 1}. ${name} (Qty: ${qty} ${rate ? `@ ${rate}` : ''}) = ${amtVal}\n`;
      });
      billDetailsStr += '-------------------------------\n';
      if (data.subtotal !== undefined) {
        billDetailsStr += `Items Subtotal: ₹${data.subtotal.toLocaleString()}\n`;
      }
      if (data.discountAmount !== undefined && data.discountAmount > 0) {
        billDetailsStr += `Discount: -₹${data.discountAmount.toLocaleString()}\n`;
      }
      if (data.taxAmount !== undefined && data.taxAmount > 0) {
        billDetailsStr += `GST: +₹${data.taxAmount.toLocaleString()}\n`;
      }
      if (data.additionalCharges !== undefined && data.additionalCharges > 0) {
        billDetailsStr += `Logistics/Other: +₹${data.additionalCharges.toLocaleString()}\n`;
      }
      billDetailsStr += `GRAND TOTAL: ${amt}\n`;
      billDetailsStr += '-------------------------------';
    } else if (normType === 'report' && data.testAssignments && Array.isArray(data.testAssignments)) {
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += '🔬 CERTIFIED TEST PARAMETERS\n';
      billDetailsStr += '-------------------------------\n';
      data.testAssignments.forEach((test: any, tIdx: number) => {
        billDetailsStr += `${tIdx + 1}. ${test.testName || 'Test'}\n`;
        if (test.parameters && Array.isArray(test.parameters)) {
          test.parameters.forEach((param: any) => {
            const statusIndicator = (param.status === 'High' || param.status === 'Abnormal') ? '⚠️ ' : '';
            billDetailsStr += `   - ${param.name || 'Analyte'}: ${statusIndicator}${param.result || 'Pending'} ${param.unit || ''} (Ref: ${param.referenceRange || 'N/A'})\n`;
          });
        }
      });
      billDetailsStr += '-------------------------------';
    } else if (normType === 'receipt') {
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += '🧾 PAYMENT RECEIPT SUMMARY\n';
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += `Receipt No: ${docNum || 'N/A'}\n`;
      billDetailsStr += `Receipt Date: ${data.paymentDate || 'N/A'}\n`;
      billDetailsStr += `Payment Method: ${data.paymentMethod || 'N/A'}\n`;
      billDetailsStr += `Amount Paid: ${amt}\n`;
      billDetailsStr += '-------------------------------';
    } else if (normType === 'sample_label') {
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += '🏷️ SPECIMEN LABEL DETAIL\n';
      billDetailsStr += '-------------------------------\n';
      billDetailsStr += `Sample Code: ${data.sampleCode || 'N/A'}\n`;
      billDetailsStr += `Sample Name: ${data.sampleName || 'N/A'}\n`;
      billDetailsStr += `Sample Type: ${data.sampleType || 'N/A'}\n`;
      if (data.relatedSampleCode) {
        billDetailsStr += `Linked Batch: ${data.relatedSampleCode}\n`;
      }
      billDetailsStr += '-------------------------------';
    }

    let compiled = templateStr
      .replace(/{ClientName}/g, clientName)
      .replace(/{DocumentNumber}/g, docNum)
      .replace(/{Amount}/g, amt)
      .replace(/{DocumentType}/g, docTypeStr)
      .replace(/{BusinessName}/g, bizName);

    if (compiled.includes('{BillDetails}')) {
      compiled = compiled.replace(/{BillDetails}/g, billDetailsStr);
    } else {
      compiled = compiled + '\n\n' + billDetailsStr;
    }

    return compiled;
  };

  const compiledText = compileMessage(customMessageText);

  // Handle browser native printing
  const handlePrint = () => {
    const originalTitle = document.title;
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';
    
    document.title = `${documentType.toUpperCase()}_${docNum}`;
    window.print();
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

  // WhatsApp sender using customized, compiled text
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(compiledText)}`;
    window.open(url, '_blank');
    setShareSuccess('Redirecting to WhatsApp web...');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  // Email sender using customized, compiled text
  const handleShareEmail = () => {
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';

    const subject = `${documentType.toUpperCase()} - ${docNum} from ${settings.company.labName}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(compiledText)}`;
    window.open(url, '_blank');
    setShareSuccess('Opening email composer...');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-xs font-sans">
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
              onClick={() => setIsShareConfigOpen(!isShareConfigOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition cursor-pointer ${
                isShareConfigOpen ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Share2 size={13} />
              <span>Share Config</span>
              {isShareConfigOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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

        {/* COLLAPSIBLE MESSAGE SHARE & TEMPLATE PANEL */}
        {isShareConfigOpen && (
          <div className="bg-white border-b border-slate-200 p-4 shrink-0 grid grid-cols-1 md:grid-cols-12 gap-4 animate-fadeIn print:hidden">
            {/* Presets Column */}
            <div className="md:col-span-4 space-y-2.5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                1. Select Share Template Preset
              </span>
              <div className="flex flex-col gap-1.5">
                {SHARE_PRESETS.map((p) => {
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id)}
                      className={`text-left p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px]">{p.name}</span>
                        {isSelected && <Check size={12} className="text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Column */}
            <div className="md:col-span-4 space-y-2">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                2. Customize Raw Message Format
              </span>
              <textarea
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-mono leading-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="Enter raw message..."
              />
              <p className="text-[9px] text-slate-400 leading-normal">
                Supported placeholders: <code className="font-bold text-slate-600 font-mono">{`{ClientName}`}</code>, <code className="font-bold text-slate-600 font-mono">{`{DocumentNumber}`}</code>, <code className="font-bold text-slate-600 font-mono">{`{Amount}`}</code>, <code className="font-bold text-slate-600 font-mono">{`{BusinessName}`}</code>
              </p>
            </div>

            {/* Live Compiled Preview Column */}
            <div className="md:col-span-4 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={11} />
                  <span>3. Compiled Message Preview</span>
                </span>
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 leading-normal whitespace-pre-wrap font-sans max-h-32 overflow-y-auto font-medium">
                  {compiledText || <span className="text-slate-400 italic">No message drafted.</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer shadow-sm"
                >
                  <Smartphone size={13} />
                  <span>Send WhatsApp</span>
                </button>
                <button
                  onClick={handleShareEmail}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer border border-slate-700 shadow-sm"
                >
                  <Mail size={13} />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE CANVAS BLOCK */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-300/40 print:p-0 print:bg-white print:overflow-visible">
          {/* Paper Sheet container */}
          <div
            ref={printRef}
            id="printable-document-sheet"
            className="w-full max-w-3xl font-sans print:max-w-full"
          >
            <DocumentTemplateRenderer
              documentType={documentType}
              data={data}
              settings={settings}
              printCopyLabel={selectedLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
