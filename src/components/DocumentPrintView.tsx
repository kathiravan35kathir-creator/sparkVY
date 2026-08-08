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
import { AppSettings, Party } from '../types';
import DocumentTemplateRenderer from './DocumentTemplateRenderer';
import { waitForDocumentImages, getCompanyQrCodeUrl } from '../utils/companyBranding';
import { sendWhatsAppMessage } from '../services/communicationService';
import WhatsAppShareModal, { WhatsAppDocumentData } from './WhatsAppShareModal';

// Global color cache to speed up canvas-based color resolution
const colorCache = new Map<string, string>();

/**
 * Converts OKLCH colors to RGB using standard color space transformations as a pure JS fallback.
 */
function oklchToRgb(l: number, c: number, h: number, alpha: number): string {
  const hRad = (h * Math.PI) / 180;
  const aVal = c * Math.cos(hRad);
  const bVal = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * aVal + 0.2158037573 * bVal;
  const m_ = l - 0.1055613458 * aVal - 0.0638541728 * bVal;
  const s_ = l - 0.0894841775 * aVal - 0.1291986507 * bVal;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toGamma = (x: number) => {
    if (x <= 0.0031308) return Math.max(0, 12.92 * x);
    return Math.max(0, 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  };

  const r = Math.min(255, Math.max(0, Math.round(toGamma(rLin) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(toGamma(gLin) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(toGamma(bLin) * 255)));

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function parseAndConvertOklch(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\s*\(([^)]+)\)/i);
    if (!match) return 'rgb(0, 0, 0)';

    const content = match[1].trim();
    let mainPartsStr = content;
    let alphaStr: string | null = null;

    if (content.includes('/')) {
      const slashParts = content.split('/');
      mainPartsStr = slashParts[0].trim();
      alphaStr = slashParts[1].trim();
    }

    const parts = mainPartsStr.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return 'rgb(0, 0, 0)';

    let l = parseFloat(parts[0]);
    if (parts[0].endsWith('%')) l = l / 100;

    let c = parseFloat(parts[1]);
    if (parts[1].endsWith('%')) c = (c / 100) * 0.4;

    let h = parseFloat(parts[2]);
    if (isNaN(h)) h = 0;

    let alpha = 1;
    if (alphaStr) {
      alpha = parseFloat(alphaStr);
      if (alphaStr.endsWith('%')) alpha = alpha / 100;
    } else if (parts.length >= 4) {
      alpha = parseFloat(parts[3]);
      if (parts[3].endsWith('%')) alpha = alpha / 100;
    }

    if (isNaN(l)) l = 0;
    if (isNaN(c)) c = 0;
    if (isNaN(alpha)) alpha = 1;

    return oklchToRgb(l, c, h, alpha);
  } catch (e) {
    return 'rgb(0, 0, 0)';
  }
}

function resolveSingleColorToRgba(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  if (colorCache.has(colorStr)) {
    return colorCache.get(colorStr)!;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = colorStr;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const a = Number((data[3] / 255).toFixed(3));

      if (data[3] > 0 || colorStr.toLowerCase().includes('transparent') || colorStr.includes('/ 0')) {
        const resolved = a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
        colorCache.set(colorStr, resolved);
        return resolved;
      }
    }
  } catch (e) {
    // Fallback below
  }

  if (colorStr.toLowerCase().includes('oklch')) {
    const converted = parseAndConvertOklch(colorStr);
    colorCache.set(colorStr, converted);
    return converted;
  }

  const fallback = 'rgba(0, 0, 0, 0)';
  colorCache.set(colorStr, fallback);
  return fallback;
}

/**
 * Replaces modern CSS color functions (oklch, oklab, lch, lab, color-mix, light-dark, color)
 * in any string or declaration (including box-shadow, linear-gradient, style tags)
 * with standard rgb/rgba strings that html2canvas can parse without errors.
 */
function replaceModernColorsInString(input: string): string {
  if (!input || typeof input !== 'string') return input;

  const lower = input.toLowerCase();
  if (
    !lower.includes('oklch') &&
    !lower.includes('oklab') &&
    !lower.includes('lch') &&
    !lower.includes('color-mix') &&
    !lower.includes('lab') &&
    !lower.includes('light-dark') &&
    !lower.includes('color(')
  ) {
    return input;
  }

  const colorFuncRegex = /(?:oklch|oklab|lch|lab|color-mix|light-dark|color)\s*\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;

  return input.replace(colorFuncRegex, (match) => {
    const resolved = resolveSingleColorToRgba(match);
    if (!resolved || resolved.toLowerCase().includes('oklch') || resolved.toLowerCase().includes('oklab')) {
      return 'rgba(0, 0, 0, 0)';
    }
    return resolved;
  });
}

interface DocumentPrintViewProps {
  documentType: 'invoice' | 'quotation' | 'receipt' | 'purchase' | 'report' | 'sample_label' | 'transaction_list' | 'credit_note' | 'sales_return' | 'procurement_order' | 'proforma_invoice' | 'payment_receipt' | 'payment_voucher' | 'party_ledger' | 'estimate_quotation' | 'delivery_challan' | 'account_statement' | (string & {});
  data: any; 
  settings: AppSettings;
  onClose: () => void;
  isOpen?: boolean;
  extraActions?: React.ReactNode;
  onCheckPin?: (action: string, onConfirm: () => void) => void;
  onLogCommunication?: (log: any) => void;
  party?: Party | null;
  parties?: Party[];
  currentUser?: any;
  onEditParty?: (partyId: string, updates: Partial<Party>) => void;
  onAddAuditLog?: (log: any) => void;
  onSaveSettings?: (settings: AppSettings) => void;
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
  extraActions,
  onCheckPin,
  onLogCommunication,
  party,
  parties,
  currentUser,
  onEditParty,
  onAddAuditLog,
  onSaveSettings
}: DocumentPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(
    settings.print.printCopyLabels[0] || 'Original for Buyer'
  );

  // Unified WhatsApp Share Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Sharing Engine state
  const [isShareConfigOpen, setIsShareConfigOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('polite_greeting');
  const [customMessageText, setCustomMessageText] = useState(SHARE_PRESETS[0].template);

  const initialPhone = data?.partyPhone || data?.supplierPhone || data?.mobile || data?.phone || '';
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

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

  // Helper to convert remote image URLs to Data URLs for reliable print & PDF rendering
  const urlToDataUrl = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;

    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.dataUrl) {
          return data.dataUrl;
        }
      }
    } catch (proxyErr) {
      console.warn('Image proxy failed, falling back to fetch/canvas:', url, proxyErr);
    }

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          // tainted
        }
        resolve(url);
      };
      img.onerror = () => {
        fetch(url, { mode: 'cors' })
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(url));
      };
      img.src = url;
    });
  };

  // Handle browser native printing via an isolated iframe with asset synchronization
  const handlePrint = async () => {
    if (isPreparingPrint) return;
    setIsPreparingPrint(true);
    setShareSuccess('Preparing Print...');

    try {
      const element = printRef.current;
      if (!element) {
        throw new Error('Print preview element not found.');
      }

      // Check if running in Capacitor native (Android/iOS)
      let isCapacitorNative = false;
      try {
        const { Capacitor } = await import('@capacitor/core');
        isCapacitorNative = Capacitor.isNativePlatform();
      } catch (e) {
        // Not capacitor
      }

      if (isCapacitorNative) {
        await handleDownloadPDF();
        setIsPreparingPrint(false);
        return;
      }

      // 1. Clone exact working Preview DOM
      const clone = element.cloneNode(true) as HTMLElement;

      // 2. Convert ALL remote images in clone (Logo, QR, Signature) to Base64 Data URLs
      const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
      for (const img of cloneImgs) {
        if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
          const dataUrl = await urlToDataUrl(img.src);
          if (dataUrl && dataUrl.startsWith('data:')) {
            img.src = dataUrl;
          }
        }
      }

      // Check QR image in clone if configured
      const qrInClone = clone.querySelector('img[data-pdf-asset="qr"]') as HTMLImageElement || clone.querySelector('img[alt*="QR"]') as HTMLImageElement;
      if (qrInClone) {
        if (!qrInClone.src || (!qrInClone.src.startsWith('data:') && !qrInClone.src.startsWith('blob:'))) {
          throw new Error('Unable to prepare the uploaded QR Code for printing.');
        }
      }

      // 3. Document title setup
      let docNum = '';
      if (documentType === 'invoice') docNum = data.invoiceNumber || '';
      else if (documentType === 'quotation') docNum = data.quotationNumber || '';
      else if (documentType === 'receipt') docNum = data.receiptNumber || '';
      else if (documentType === 'purchase') docNum = data.purchaseNumber || '';
      else if (documentType === 'report') docNum = data.reportNumber || '';
      else if (documentType === 'party_ledger') docNum = data.partyName || '';
      else docNum = data.documentNumber || data.id || 'DOC';

      const docTitle = `${documentType.toUpperCase()}_${docNum}`;

      // 4. Create isolated hidden print iframe
      const oldIframe = document.getElementById('bizops-print-iframe');
      if (oldIframe && document.body.contains(oldIframe)) {
        document.body.removeChild(oldIframe);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'bizops-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access print iframe document.');
      }

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head><title>${docTitle}</title></head><body></body></html>`);
      iframeDoc.close();

      // Copy stylesheet links and inline style tags from main document head to iframe head
      const styleEls = document.head.querySelectorAll('link[rel="stylesheet"], style');
      styleEls.forEach((styleNode) => {
        iframeDoc.head.appendChild(styleNode.cloneNode(true));
      });

      // Append clean page print override styles
      const customPrintStyle = iframeDoc.createElement('style');
      customPrintStyle.textContent = `
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        *, ::before, ::after {
          box-sizing: border-box !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          width: 210mm !important;
        }
        body * {
          visibility: visible !important;
        }
        #document-print-root, #printable-document-sheet {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          transform: none !important;
          zoom: 1 !important;
          overflow: visible !important;
        }
        #bank-details-section, [data-pdf-asset="qr"], img, table, tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
      `;
      iframeDoc.head.appendChild(customPrintStyle);

      // Append cloned DOM to iframe body
      iframeDoc.body.appendChild(clone);

      // 5. Wait for fonts & images inside iframe
      await iframeDoc.fonts?.ready;

      const iframeImgs = Array.from(iframeDoc.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        iframeImgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          });
        })
      );

      // Verify QR image readiness inside iframe
      const qrInIframe = iframeDoc.querySelector('img[data-pdf-asset="qr"]') as HTMLImageElement || iframeDoc.querySelector('img[alt*="QR"]') as HTMLImageElement;
      if (qrInIframe) {
        let attempts = 0;
        while ((!qrInIframe.complete || qrInIframe.naturalWidth === 0) && attempts < 30) {
          await new Promise((res) => setTimeout(res, 100));
          attempts++;
        }
        if (!qrInIframe.complete || qrInIframe.naturalWidth === 0) {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          throw new Error('Unable to prepare the uploaded QR Code for printing.');
        }
      }

      setShareSuccess('Opening print dialog...');

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print iframe invocation error:', e);
        }

        const cleanup = () => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (e) {}
          setShareSuccess(null);
          setIsPreparingPrint(false);
        };

        if (iframe.contentWindow) {
          iframe.contentWindow.addEventListener('afterprint', cleanup);
        }
        setTimeout(cleanup, 20000);
      }, 300);

    } catch (err: any) {
      console.error('Print preparation error:', err);
      alert(`Unable to prepare this document for printing. ${err.message || ''}`);
      setShareSuccess(null);
      setIsPreparingPrint(false);
    }
  };

  // Deterministic PDF download flow capturing DocumentTemplateRenderer directly
  const handleDownloadPDF = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setShareSuccess('Preparing PDF document...');

    try {
      const element = printRef.current;
      if (!element) {
        throw new Error('Print preview document element not found.');
      }

      if (!data) {
        throw new Error('Document data is empty.');
      }

      // 1. Clone exact working Preview DOM
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '100%';
      clone.style.maxWidth = 'none';
      clone.style.transform = 'none';
      clone.style.zoom = '1';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      clone.style.padding = '0';

      // 2. Convert ALL remote images in clone to Base64 Data URLs
      const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
      for (const img of cloneImgs) {
        if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
          const dataUrl = await urlToDataUrl(img.src);
          if (dataUrl && dataUrl.startsWith('data:')) {
            img.src = dataUrl;
          }
        }
      }

      // Render into an offscreen A4 container
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.position = 'fixed';
      offscreenContainer.style.left = '-9999px';
      offscreenContainer.style.top = '-9999px';
      offscreenContainer.style.width = '210mm';
      offscreenContainer.style.backgroundColor = '#ffffff';
      offscreenContainer.style.transform = 'none';
      offscreenContainer.style.zoom = '1';
      offscreenContainer.style.overflow = 'visible';
      offscreenContainer.style.zIndex = '-9999';

      offscreenContainer.appendChild(clone);
      document.body.appendChild(offscreenContainer);

      // Wait for fonts and all document images inside offscreen container
      await document.fonts.ready;
      await waitForDocumentImages(clone);

      // Check QR image inside clone
      const qrInClone = clone.querySelector('img[data-pdf-asset="qr"]') as HTMLImageElement || clone.querySelector('img[alt*="QR"]') as HTMLImageElement;
      if (qrInClone) {
        let attempts = 0;
        while ((!qrInClone.complete || qrInClone.naturalWidth === 0) && attempts < 30) {
          await new Promise((res) => setTimeout(res, 100));
          attempts++;
        }
        if (!qrInClone.complete || qrInClone.naturalWidth === 0) {
          document.body.removeChild(offscreenContainer);
          throw new Error('Unable to prepare the uploaded QR Code for export.');
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(clone, {
        scale: 2, // High DPI capture for crisp text & graphics
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        windowWidth: 794, // 210mm at 96 DPI
        onclone: (clonedDoc) => {
          // Robust color sanitization for html2canvas compatibility
          try {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((styleTag) => {
              if (styleTag.textContent) {
                styleTag.textContent = replaceModernColorsInString(styleTag.textContent);
              }
            });
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.hasAttribute('style')) {
                const styleAttr = htmlEl.getAttribute('style');
                if (styleAttr) {
                  htmlEl.setAttribute('style', replaceModernColorsInString(styleAttr));
                }
              }
            });
          } catch (e) {
            // ignore
          }
        }
      });

      // Cleanup offscreen element
      document.body.removeChild(offscreenContainer);

      // Determine paper size from settings
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

      if (paperSize === '80mm' || imgHeight <= pdfHeight * 1.12) {
        let finalImgHeight = imgHeight;
        if (finalImgHeight > pdfHeight && finalImgHeight <= pdfHeight * 1.12) {
          finalImgHeight = pdfHeight;
        }
        pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, finalImgHeight, undefined, 'FAST');
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

      const pdfBlob = pdf.output('blob');
      if (!pdfBlob || pdfBlob.size < 100) {
        throw new Error('PDF output is empty or invalid.');
      }

      let docNum = '';
      if (documentType === 'invoice') docNum = data.invoiceNumber || '';
      else if (documentType === 'quotation') docNum = data.quotationNumber || '';
      else if (documentType === 'receipt') docNum = data.receiptNumber || '';
      else if (documentType === 'purchase') docNum = data.purchaseNumber || '';
      else if (documentType === 'report') docNum = data.reportNumber || '';
      else if (documentType === 'party_ledger') docNum = data.partyName || '';
      else docNum = data.documentNumber || data.id || 'DOC';

      const fileName = `${documentType.toUpperCase()}_${docNum || 'export'}.pdf`;

      // Check if running in Capacitor native (Android/iOS)
      let isCapacitorNative = false;
      try {
        const { Capacitor } = await import('@capacitor/core');
        isCapacitorNative = Capacitor.isNativePlatform();
      } catch (e) {
        // Not native
      }

      if (isCapacitorNative) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');

          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const res = reader.result as string;
              const base64 = res.includes(',') ? res.split(',')[1] : res;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          setShareSuccess('PDF saved successfully!');
          await Share.share({
            title: `Export ${fileName}`,
            text: `Generated PDF document ${fileName} from Spark-VY ERP.`,
            url: savedFile.uri,
            dialogTitle: 'Open or Share PDF'
          });
        } catch (nativeErr: any) {
          console.error('Capacitor native error:', nativeErr);
          const blobUrl = URL.createObjectURL(pdfBlob);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        }
      } else {
        const blobUrl = URL.createObjectURL(pdfBlob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }

      setShareSuccess('PDF generated & downloaded!');
    } catch (err: any) {
      console.error('PDF download error:', err);
      alert(`Unable to generate PDF download. ${err.message || ''}`);
      setShareSuccess(null);
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  // Unified WhatsApp Share trigger
  const handleShareWhatsApp = () => {
    setShowWhatsAppModal(true);
  };

  const handleShareWhatsAppEnterprise = () => {
    setShowWhatsAppModal(true);
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
              disabled={isPreparingPrint}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition cursor-pointer ${
                isPreparingPrint
                  ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Printer size={13} />
              <span>{isPreparingPrint ? 'Preparing Print...' : 'Print Sheet'}</span>
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

            {extraActions}

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
            id="document-print-root"
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

      {showWhatsAppModal && (() => {
        let docNum = '';
        if (documentType === 'invoice') docNum = data.invoiceNumber || '';
        else if (documentType === 'quotation') docNum = data.quotationNumber || '';
        else if (documentType === 'receipt') docNum = data.receiptNumber || '';
        else if (documentType === 'purchase') docNum = data.purchaseNumber || '';
        else if (documentType === 'report') docNum = data.reportNumber || '';
        else docNum = data.documentNumber || data.id || 'DOC';

        const formattedDocType = documentType
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        const whatsappDocData: WhatsAppDocumentData = {
          documentType: formattedDocType,
          documentId: data.id || docNum,
          documentNumber: docNum,
          partyId: data.partyId || data.supplierId,
          partyName: data.partyName || data.supplierName || 'Customer',
          savedPhone: recipientPhone || data.phone || data.mobile || data.partyPhone || '',
          pdfFileName: `${formattedDocType.replace(/\s+/g, '_')}_${docNum.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`,
          amount: data.total || data.amountPaid || data.amount || 0,
          date: data.invoiceDate || data.quotationDate || data.paymentDate || new Date().toISOString().slice(0, 10),
          items: data.items || [],
          greetingText: compiledText
        };

        return (
          <WhatsAppShareModal
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            documentData={whatsappDocData}
            settings={settings}
            party={party || null}
            parties={parties}
            currentUser={currentUser}
            onEditParty={onEditParty}
            onAddAuditLog={onAddAuditLog}
            onLogCommunication={onLogCommunication}
            onSaveSettings={onSaveSettings}
          />
        );
      })()}
    </div>
  );
}
