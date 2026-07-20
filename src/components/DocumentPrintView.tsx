import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
import { sendWhatsAppMessage } from '../services/communicationService';

// Global color cache to speed up canvas-based color resolution
const colorCache = new Map<string, string>();

/**
 * Resolves modern CSS colors (like oklch, lch, lab, color-mix) down to standard rgb/rgba
 * using the browser's native Canvas rendering. html2canvas fails on modern colors.
 */
function resolveToRgba(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  
  const lower = colorStr.toLowerCase();
  // Include oklab, oklch, lch, lab, color-mix, light-dark, and generic color() functions
  if (!lower.includes('oklch') && 
      !lower.includes('oklab') && 
      !lower.includes('lch') && 
      !lower.includes('color-mix') && 
      !lower.includes('lab') && 
      !lower.includes('p3') &&
      !lower.includes('light-dark')) {
    return colorStr;
  }
  
  if (colorCache.has(colorStr)) {
    return colorCache.get(colorStr)!;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return colorStr;
    
    // Set fillStyle to the potentially problematic color
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    
    // The browser's Canvas implementation automatically resolves modern colors to RGBA
    const data = ctx.getImageData(0, 0, 1, 1).data;
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const a = Number((data[3] / 255).toFixed(3));
    
    // Return a clean RGB or RGBA string that html2canvas can definitely parse
    const resolved = a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    colorCache.set(colorStr, resolved);
    return resolved;
  } catch (e) {
    return colorStr;
  }
}

interface DocumentPrintViewProps {
  documentType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'report' | 'sample_label' | 'transaction_list' | 'credit_note' | 'sales_return' | 'procurement_order' | 'proforma_invoice' | 'payment_receipt' | 'payment_voucher';
  data: any; 
  settings: AppSettings;
  onClose: () => void;
  onCheckPin?: (action: string, onConfirm: () => void) => void;
  onLogCommunication?: (log: any) => void;
}

const SHARE_PRESETS = [
  {
    id: 'polite_greeting',
    name: 'Polite Greeting',
    template: 'Dear {ClientName},\n\nWe hope you are doing well. Please find attached {DocumentType} No. {DocumentNumber} from {BusinessName} for your review.\n\nTotal Amount: {Amount}\n\nThank you for choosing us!\n\nBest Regards,\n{BusinessName}'
  },
  {
    id: 'due_reminder',
    name: 'Due Reminder',
    template: 'Dear {ClientName},\n\nThis is a friendly reminder that payment for {DocumentType} No. {DocumentNumber} from {BusinessName} is currently due.\n\nAmount due: {Amount}\n\nPlease settle the payment at your earliest convenience.\n\nThank you,\n{BusinessName}'
  },
  {
    id: 'urgent_settlement',
    name: 'Urgent Settlement',
    template: 'URGENT: Outstanding Balance Reminder\n\nDear {ClientName},\n\nWe have not received payment for {DocumentType} No. {DocumentNumber} from {BusinessName}.\n\nPending Amount: {Amount}\n\nPlease process this payment urgently to avoid any service disruption.\n\nRegards,\nAccounts Team, {BusinessName}'
  }
];

export default function DocumentPrintView({
  documentType,
  data,
  settings,
  onClose,
  onCheckPin,
  onLogCommunication
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

  const initialPhone = data?.partyPhone || data?.supplierPhone || data?.mobile || data?.phone || '';
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    }

    let amt = '₹0';
    if (data.total !== undefined) {
      amt = `₹${data.total.toLocaleString()}`;
    } else if (data.amount !== undefined) {
      amt = `₹${data.amount.toLocaleString()}`;
    } else if (data.amountPaid !== undefined) {
      amt = `₹${data.amountPaid.toLocaleString()}`;
    }

    let bizName = settings.company.displayCompanyName || settings.company.companyName || 'BizOps ERP';

    return templateStr
      .replace(/{ClientName}/g, clientName)
      .replace(/{DocumentNumber}/g, docNum)
      .replace(/{Amount}/g, amt)
      .replace(/{DocumentType}/g, docTypeStr)
      .replace(/{BusinessName}/g, bizName);
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

  // Real PDF download helper using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setShareSuccess('Preparing document canvas...');

    try {
      const element = printRef.current;
      if (!element) {
        throw new Error('Print preview element not found.');
      }

      // Confirm quotation data exists and company settings are loaded
      if (!data) {
        throw new Error('Document data is empty.');
      }
      if (!settings) {
        throw new Error('Company settings are not loaded.');
      }

      // Wait for fonts and all images to be fully loaded
      await document.fonts.ready;
      const images = element.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        const htmlImg = img as HTMLImageElement;
        if (htmlImg.complete) return Promise.resolve();
        return new Promise((resolve) => {
          htmlImg.onload = resolve;
          htmlImg.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      // Verify that the element is rendered and has positive dimensions
      const targetElement = element.querySelector('#printed-document-root') || element;
      const rect = targetElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        throw new Error(`Render element has zero dimensions (width: ${rect.width}px, height: ${rect.height}px).`);
      }

      setShareSuccess('Rendering PDF bytes...');

      // Render the element to a canvas
      const canvas = await html2canvas(targetElement as HTMLElement, {
        scale: 2, // High resolution for professional print
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc, clonedElement) => {
          // Robust color sanitization: html2canvas v1.4.1 fails on modern CSS (oklch, color-mix)
          // We iterate through all cloned elements and explicitly resolve colors using original computed styles
          const allCloned = clonedElement.querySelectorAll('*');
          const allOriginal = targetElement.querySelectorAll('*');
          
          // Match and sanitize
          for (let i = 0; i < allCloned.length; i++) {
            const cEl = allCloned[i] as HTMLElement;
            const oEl = allOriginal[i] as HTMLElement;
            if (!oEl || !cEl.style) continue;

            const computed = window.getComputedStyle(oEl);
            const props = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'outlineColor', 'stopColor'];
            
            props.forEach(prop => {
              const cssProp = prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
              const val = computed.getPropertyValue(cssProp);
              
              if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('lch') || val.includes('color-mix') || val.includes('var('))) {
                const resolved = resolveToRgba(val);
                cEl.style.setProperty(cssProp, resolved, 'important');
              }
            });
          }
        }
      });

      // Determine paper size from active template/settings
      const paperSize = settings.print.paperSize || 'A4';

      let orientation: 'portrait' | 'landscape' = 'portrait';
      let format: string | [number, number] = 'a4';
      let pdfWidth = 210; // in mm
      let pdfHeight = 297; // in mm

      if (paperSize === 'A5') {
        format = 'a5';
        pdfWidth = 148;
        pdfHeight = 210;
        if (canvas.width > canvas.height) {
          orientation = 'landscape';
          pdfWidth = 210;
          pdfHeight = 148;
        }
      } else if (paperSize === 'Letter') {
        format = 'letter';
        pdfWidth = 215.9;
        pdfHeight = 279.4;
        if (canvas.width > canvas.height) {
          orientation = 'landscape';
          pdfWidth = 279.4;
          pdfHeight = 215.9;
        }
      } else if (paperSize === '80mm') {
        pdfWidth = 80;
        pdfHeight = (canvas.height / canvas.width) * 80;
        format = [80, pdfHeight];
      } else {
        format = 'a4';
        pdfWidth = 210;
        pdfHeight = 297;
        if (canvas.width > canvas.height) {
          orientation = 'landscape';
          pdfWidth = 297;
          pdfHeight = 210;
        }
      }

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format
      });

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Pass the canvas directly to jsPDF instead of base64 to avoid truncation/corruption
      if (paperSize === '80mm' || imgHeight <= pdfHeight) {
        pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        let position = 0;
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        let heightLeft = imgHeight - pdfHeight;

        while (heightLeft > 0) {
          position = position - pdfHeight;
          pdf.addPage(format, orientation);
          pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      }

      // Obtain output as PDF Blob
      const pdfBlob = pdf.output('blob');

      // ----------------------------------------------------
      // VALIDATE GENERATED PDF BYTES
      // ----------------------------------------------------
      if (!pdfBlob) {
        throw new Error('PDF output is null or undefined.');
      }
      if (pdfBlob.size < 1000) {
        throw new Error(`PDF output size is too small (${pdfBlob.size} bytes).`);
      }
      if (pdfBlob.type !== 'application/pdf') {
        throw new Error(`PDF output content type is invalid (${pdfBlob.type}).`);
      }

      // Check first five bytes are "%PDF-"
      const header = await pdfBlob.slice(0, 5).text();
      if (header !== '%PDF-') {
        console.error('PDF validation failed', {
          type: pdfBlob.type,
          size: pdfBlob.size,
          header
        });
        throw new Error(`PDF signature is corrupt or invalid. Found header: "${header}"`);
      }

      // Log success details in development
      console.log("PDF validation success", {
        type: pdfBlob.type,
        size: pdfBlob.size,
        header,
        templateId: activeTemplate,
        paperFormat: paperSize,
        dimensions: { width: rect.width, height: rect.height }
      });

      // Determine file name
      let docNum = '';
      if (documentType === 'invoice') docNum = data.invoiceNumber || '';
      else if (documentType === 'quotation') docNum = data.quotationNumber || '';
      else if (documentType === 'receipt') docNum = data.receiptNumber || '';
      else if (documentType === 'purchase') docNum = data.purchaseNumber || '';
      else if (documentType === 'report') docNum = data.reportNumber || '';
      else docNum = data.id || 'DOC';

      const fileName = `${documentType}_${docNum}.pdf`;

      // Download PDF
      const objectUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

      setShareSuccess('PDF generated & downloaded!');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      // Log details of failure
      const element = printRef.current;
      const targetElement = element?.querySelector('#printed-document-root') || element;
      const rect = targetElement?.getBoundingClientRect() || { width: 0, height: 0 };
      console.error('PDF generation details:', {
        message: err.message,
        templateId: activeTemplate,
        paperFormat: settings.print.paperSize || 'A4',
        renderWidth: rect.width,
        renderHeight: rect.height
      });
      alert(`PDF generation failed. ${err.message || 'The generated file is invalid.'}`);
      setShareSuccess(null);
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  // WhatsApp sender using customized, compiled text
  const handleShareWhatsApp = () => {
    const doShare = () => {
      const targetPhone = data.phone || data.mobile || '';
      const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(compiledText)}`;
      window.open(url, '_blank');
      
      if (onLogCommunication) {
        onLogCommunication({
          type: 'WhatsApp',
          recipient: data.partyName || 'Unknown',
          recipientNumber: targetPhone,
          status: 'Sent',
          subject: `${documentType.toUpperCase()} Dispatch`,
          content: compiledText,
          direction: 'Outbound'
        });
      }
      
      setShareSuccess('Redirecting to WhatsApp web...');
      setTimeout(() => setShareSuccess(null), 3000);
    };

    if (settings.whatsappSettings.requirePinForShare && onCheckPin) {
      onCheckPin('share_document', doShare);
    } else {
      doShare();
    }
  };

  // Enterprise WhatsApp Business API sender
  const handleShareWhatsAppEnterprise = async () => {
    if (!recipientPhone) {
      alert('Please enter a recipient phone number.');
      return;
    }
    
    setIsSendingWhatsApp(true);
    setShareSuccess('Generating PDF & sending via Enterprise API...');
    
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    else if (documentType === 'quotation') docNum = data.quotationNumber || '';
    else if (documentType === 'receipt') docNum = data.receiptNumber || '';
    else if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    else if (documentType === 'report') docNum = data.reportNumber || '';
    else docNum = data.id || 'DOC';

    const docTypeStr = documentType.charAt(0).toUpperCase() + documentType.slice(1);
    
    try {
      const res = await fetch('/api/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: recipientPhone,
          docType: docTypeStr,
          docNumber: docNum,
          date: data.invoiceDate || data.quotationDate || data.paymentDate || new Date().toISOString().slice(0, 10),
          partyName: data.partyName || data.supplierName || 'Customer',
          amount: data.total || data.amountPaid || data.amount || 0,
          items: data.items || [],
          caption: compiledText
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShareSuccess('Dispatched via Enterprise WhatsApp API successfully!');
      } else {
        alert(`Failed to send: ${result.error || 'Unknown error'}`);
        setShareSuccess(null);
      }
    } catch (err: any) {
      console.error('Enterprise WhatsApp dispatch failed:', err);
      alert(`Error sending: ${err.message || err}`);
      setShareSuccess(null);
    } finally {
      setIsSendingWhatsApp(false);
      setTimeout(() => setShareSuccess(null), 4000);
    }
  };

  // Email sender using customized, compiled text
  const handleShareEmail = () => {
    let docNum = '';
    if (documentType === 'invoice') docNum = data.invoiceNumber || '';
    if (documentType === 'quotation') docNum = data.quotationNumber || '';
    if (documentType === 'receipt') docNum = data.receiptNumber || '';
    if (documentType === 'purchase') docNum = data.purchaseNumber || '';
    if (documentType === 'report') docNum = data.reportNumber || '';

    const subject = `${documentType.toUpperCase()} - ${docNum} from ${settings.company.companyName}`;
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
              disabled={isGeneratingPdf}
              className={`flex items-center space-x-1.5 border px-3 py-1.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                isGeneratingPdf
                  ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Download size={13} />
              <span>{isGeneratingPdf ? 'Preparing PDF...' : 'PDF Download'}</span>
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

              {/* Recipient Phone input */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 919999999999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                {settings.communication?.whatsapp?.enableBusinessApi ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="enterprise-whatsapp-send-btn"
                      onClick={handleShareWhatsAppEnterprise}
                      disabled={isSendingWhatsApp}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer shadow-sm"
                    >
                      <Smartphone size={12} />
                      <span>{isSendingWhatsApp ? 'Sending...' : 'Enterprise Send'}</span>
                    </button>
                    <button
                      type="button"
                      id="standard-whatsapp-send-btn"
                      onClick={handleShareWhatsApp}
                      disabled={isSendingWhatsApp}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer shadow-sm"
                    >
                      <Smartphone size={12} />
                      <span>Standard Share</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="standard-only-whatsapp-send-btn"
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer shadow-sm"
                  >
                    <Smartphone size={13} />
                    <span>Send WhatsApp (Standard)</span>
                  </button>
                )}
                <button
                  type="button"
                  id="send-email-btn"
                  onClick={handleShareEmail}
                  disabled={isSendingWhatsApp}
                  className="w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer border border-slate-700 shadow-sm"
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
