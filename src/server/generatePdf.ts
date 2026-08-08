import { jsPDF } from 'jspdf';
import * as admin from 'firebase-admin';

function getUrlString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    return (val.url || val.downloadURL || val.downloadUrl || val.src || val.path || '').toString().trim();
  }
  return '';
}

export function extractCustomQrUrl(company: any, settings: any): string {
  if (company) {
    const url = getUrlString(company.companyQrCodeUrl) ||
                getUrlString(company.qrCodeUrl) ||
                getUrlString(company.qrUrl) ||
                getUrlString(company.paymentQrUrl) ||
                getUrlString(company.qr);
    if (url) return url;
  }
  if (settings && settings.bank) {
    const url = getUrlString(settings.bank.qrCodeUrl) || getUrlString((settings.bank as any).qr);
    if (url) return url;
  }
  if (settings && settings.company) {
    const sComp = settings.company;
    const url = getUrlString(sComp.companyQrCodeUrl) ||
                getUrlString(sComp.qrCodeUrl) ||
                getUrlString(sComp.qrUrl) ||
                getUrlString(sComp.paymentQrUrl);
    if (url) return url;
  }
  return '';
}

export function extractCompanyLogoUrl(company: any, settings: any): string {
  if (company) {
    const url = getUrlString(company.companyLogoUrl) || getUrlString(company.logoUrl);
    if (url) return url;
  }
  if (settings && settings.company) {
    const url = getUrlString(settings.company.companyLogoUrl) || getUrlString(settings.company.logoUrl);
    if (url) return url;
  }
  return '';
}

export function extractCompanySignatureUrl(company: any, settings: any): string {
  if (company) {
    const url = getUrlString(company.companySignatureUrl) || getUrlString(company.signatureUrl) || getUrlString(company.authorizedSignatureUrl);
    if (url) return url;
  }
  if (settings && settings.company) {
    const url = getUrlString(settings.company.companySignatureUrl) || getUrlString(settings.company.signatureUrl) || getUrlString(settings.company.authorizedSignatureUrl);
    if (url) return url;
  }
  return '';
}

async function fetchImageAsDataUrl(imageUrl: string): Promise<{ dataUrl: string; contentType: string; bytesLength: number }> {
  if (!imageUrl) throw new Error('Empty image URL');

  if (imageUrl.startsWith('data:image/')) {
    const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches) {
      const bytesLength = Buffer.from(matches[2], 'base64').length;
      return { dataUrl: imageUrl, contentType: matches[1], bytesLength };
    }
    return { dataUrl: imageUrl, contentType: 'image/png', bytesLength: imageUrl.length };
  }

  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image server-side: HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  if (!contentType.toLowerCase().includes('image/') && !contentType.toLowerCase().includes('octet-stream')) {
    throw new Error(`URL did not return an image. Content-Type: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error('Image response buffer is 0 bytes');
  }

  const base64 = buffer.toString('base64');
  const safeContentType = contentType.includes('octet-stream') ? 'image/png' : contentType;
  const dataUrl = `data:${safeContentType};base64,${base64}`;

  return { dataUrl, contentType: safeContentType, bytesLength: buffer.length };
}

export async function generateBackendPdf(docType: string, docData: any, settingsData: any): Promise<Buffer> {
  const company = (settingsData?.company || {}) as any;
  const bank = (settingsData?.bank || {}) as any;

  // Resolve assets
  const logoUrl = extractCompanyLogoUrl(company, settingsData);
  const signatureUrl = extractCompanySignatureUrl(company, settingsData);
  const customQrUrl = extractCustomQrUrl(company, settingsData);

  let logoDataUrl = '';
  if (logoUrl) {
    try {
      const logoRes = await fetchImageAsDataUrl(logoUrl);
      logoDataUrl = logoRes.dataUrl;
    } catch (e) {
      console.warn('Backend PDF: Failed to fetch logo image:', logoUrl, e);
    }
  }

  let signatureDataUrl = '';
  if (signatureUrl) {
    try {
      const sigRes = await fetchImageAsDataUrl(signatureUrl);
      signatureDataUrl = sigRes.dataUrl;
    } catch (e) {
      console.warn('Backend PDF: Failed to fetch signature image:', signatureUrl, e);
    }
  }

  let qrDataUrl = '';
  let qrBytesLength = 0;
  let qrContentType = '';

  if (customQrUrl) {
    try {
      const qrRes = await fetchImageAsDataUrl(customQrUrl);
      qrDataUrl = qrRes.dataUrl;
      qrBytesLength = qrRes.bytesLength;
      qrContentType = qrRes.contentType;
      console.log('[BACKEND PDF QR FETCH SUCCESS]', { customQrUrl, qrBytesLength, qrContentType });
    } catch (e: any) {
      console.error('[BACKEND PDF QR FETCH ERROR]', customQrUrl, e);
      throw new Error(`Unable to prepare the company QR Code for PDF. ${e.message || ''}`);
    }
  }

  // Create PDF using jsPDF (A4 dimensions: 595.28 x 841.89 points)
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
  });

  // PAGE & GRID LAYOUT CONSTANTS
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_X = 32;
  const MARGIN_Y = 32;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 531.28 pt

  let y = MARGIN_Y;

  // COLOR PALETTE
  const COLOR_PRIMARY = '#0f172a'; // Slate 900
  const COLOR_ACCENT = '#0284c7';  // Sky 600
  const COLOR_SECONDARY = '#475569'; // Slate 600
  const COLOR_BG_LIGHT = '#f8fafc'; // Slate 50
  const COLOR_BORDER = '#cbd5e1';   // Slate 300
  const COLOR_MUTED = '#94a3b8';    // Slate 400

  // =========================================================================
  // 1. HEADER SECTION
  // =========================================================================
  if (logoDataUrl) {
    try {
      const format = logoDataUrl.includes('image/jpeg') || logoDataUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
      doc.addImage(logoDataUrl, format, MARGIN_X, y, 55, 55);
    } catch (e) {
      console.warn('Failed to embed logo in jsPDF:', e);
    }
  }

  const headerTextX = logoDataUrl ? MARGIN_X + 65 : MARGIN_X;
  const companyNameStr = company.companyName || company.name || 'Your Company Name';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(companyNameStr, headerTextX, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  const gstSubHeader = company.gstin || company.gstNumber ? ` • GSTIN: ${company.gstin || company.gstNumber}` : '';
  doc.text(`BIZOPS ENTERPRISE SYSTEM${gstSubHeader}`, headerTextX, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SECONDARY);

  let compInfoY = y + 36;
  const compAddress = company.address || company.registeredAddress || '';
  if (compAddress) {
    const lines = doc.splitTextToSize(compAddress, 240);
    doc.text(lines, headerTextX, compInfoY);
    compInfoY += lines.length * 11;
  }

  const phoneEmail = [
    company.phone || company.primaryPhone ? `Phone: ${company.phone || company.primaryPhone}` : '',
    company.email ? `Email: ${company.email}` : ''
  ].filter(Boolean).join(' | ');

  if (phoneEmail) {
    doc.text(phoneEmail, headerTextX, compInfoY);
    compInfoY += 12;
  }

  // Right Side: Document Title, Number, Date, Due Date
  const normType = (docType || 'invoice').toLowerCase();
  let documentTitle = 'TAX INVOICE';
  if (normType === 'quotation') documentTitle = 'QUOTATION / ESTIMATE';
  else if (normType === 'receipt') documentTitle = 'RECEIPT VOUCHER';
  else if (normType === 'purchase') documentTitle = 'PURCHASE ORDER';
  else if (normType.includes('proforma')) documentTitle = 'PROFORMA INVOICE';
  else if (normType === 'report') documentTitle = 'ANALYTICS REPORT';
  else if (normType === 'party_ledger') documentTitle = 'PARTY LEDGER STATEMENT';

  let docNumber = docData.invoiceNumber || docData.quotationNumber || docData.receiptNumber || docData.purchaseNumber || docData.proformaNumber || docData.documentNumber || docData.id || 'DOC-001';
  let docDate = docData.invoiceDate || docData.quotationDate || docData.receiptDate || docData.purchaseDate || docData.date || new Date().toISOString().slice(0, 10);
  let dueDate = docData.dueDate || docData.expiryDate || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLOR_ACCENT);
  doc.text(documentTitle, PAGE_WIDTH - MARGIN_X, y + 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(`DOC ID: ${docNumber}`, PAGE_WIDTH - MARGIN_X, y + 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SECONDARY);
  doc.text(`Date: ${docDate}`, PAGE_WIDTH - MARGIN_X, y + 46, { align: 'right' });
  if (dueDate) {
    doc.text(`Due Date: ${dueDate}`, PAGE_WIDTH - MARGIN_X, y + 58, { align: 'right' });
  }

  y = Math.max(compInfoY + 12, y + 68);

  // Divider Line
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 12;

  // =========================================================================
  // 2. BILLED TO / CUSTOMER DETAILS SECTION
  // =========================================================================
  const partyName = docData.partyName || docData.customerName || 'General Billed Client';
  const partyGst = docData.partyGst || docData.gstin || '';
  const partyAddress = docData.partyAddress || docData.address || '';

  const customerBoxHeight = 54;
  doc.setFillColor(COLOR_BG_LIGHT);
  doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, customerBoxHeight, 4, 4, 'F');
  doc.setDrawColor(COLOR_BORDER);
  doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, customerBoxHeight, 4, 4, 'S');

  // Left side: Customer info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text(normType === 'purchase' ? 'VENDOR / SUPPLIER DETAILS:' : 'CUSTOMER BILLED RECIPIENT:', MARGIN_X + 10, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(partyName.slice(0, 48), MARGIN_X + 10, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SECONDARY);
  let pDetails = partyAddress ? partyAddress.slice(0, 65) : '';
  if (partyGst) pDetails += (pDetails ? ' | ' : '') + `GSTIN: ${partyGst}`;
  if (pDetails) {
    doc.text(pDetails, MARGIN_X + 10, y + 40);
  }

  // Right side: References & Status
  const refX = PAGE_WIDTH - MARGIN_X - 180;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text('BIZOPS REFERENCE LOGS:', refX, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SECONDARY);
  const refText = docData.relatedQuotationNumber ? `Ref Quotation: ${docData.relatedQuotationNumber}` : `Ref Doc: ${docNumber}`;
  doc.text(refText, refX, y + 27);

  const statusStr = (docData.status || 'Verified Completed').toUpperCase();
  doc.setFillColor('#e2e8f0');
  doc.roundedRect(refX, y + 33, 110, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor('#334155');
  doc.text(statusStr, refX + 55, y + 43, { align: 'center' });

  y += customerBoxHeight + 14;

  // =========================================================================
  // 3. ITEM TABLE
  // =========================================================================
  const colX = {
    num: MARGIN_X + 6,
    item: MARGIN_X + 28,
    hsn: MARGIN_X + 238,
    qty: MARGIN_X + 298,
    rate: MARGIN_X + 338,
    tax: MARGIN_X + 403,
    amount: PAGE_WIDTH - MARGIN_X - 6
  };

  doc.setFillColor('#1e293b');
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#ffffff');

  doc.text('#', colX.num, y + 14);
  doc.text('SERVICE / ITEM DESCRIPTION', colX.item, y + 14);
  doc.text('HSN/SAC', colX.hsn, y + 14, { align: 'center' });
  doc.text('QTY', colX.qty + 40, y + 14, { align: 'right' });
  doc.text('RATE (₹)', colX.rate + 65, y + 14, { align: 'right' });
  doc.text('TAX %', colX.tax + 45, y + 14, { align: 'right' });
  doc.text('TOTAL CHARGE (₹)', colX.amount, y + 14, { align: 'right' });

  y += 22;

  const items = Array.isArray(docData.items) && docData.items.length > 0 ? docData.items : [
    { itemName: 'General Consulting Services', hsn: '998346', quantity: 1, rate: Number(docData.amount || docData.total || 5000), taxPercent: 18, amount: Number(docData.amount || docData.total || 5900) }
  ];

  doc.setFontSize(8.5);

  items.forEach((item: any, idx: number) => {
    // Page overflow check for long item list
    if (y > PAGE_HEIGHT - MARGIN_Y - 180) {
      doc.addPage();
      y = MARGIN_Y;

      // Repeat table header on new page
      doc.setFillColor('#1e293b');
      doc.rect(MARGIN_X, y, CONTENT_WIDTH, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#ffffff');
      doc.text('#', colX.num, y + 14);
      doc.text('SERVICE / ITEM DESCRIPTION', colX.item, y + 14);
      doc.text('HSN/SAC', colX.hsn, y + 14, { align: 'center' });
      doc.text('QTY', colX.qty + 40, y + 14, { align: 'right' });
      doc.text('RATE (₹)', colX.rate + 65, y + 14, { align: 'right' });
      doc.text('TAX %', colX.tax + 45, y + 14, { align: 'right' });
      doc.text('TOTAL CHARGE (₹)', colX.amount, y + 14, { align: 'right' });
      y += 22;
    }

    const rowBg = idx % 2 === 1 ? COLOR_BG_LIGHT : '#ffffff';
    doc.setFillColor(rowBg);
    doc.rect(MARGIN_X, y, CONTENT_WIDTH, 20, 'F');

    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X, y + 20, PAGE_WIDTH - MARGIN_X, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_PRIMARY);
    doc.text(String(idx + 1), colX.num, y + 13);

    doc.setFont('helvetica', 'bold');
    const nameStr = (item.itemName || item.name || 'Item').slice(0, 36);
    doc.text(nameStr, colX.item, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_SECONDARY);
    doc.text(item.hsn || item.sac || '998346', colX.hsn, y + 13, { align: 'center' });
    doc.text(String(item.quantity || 1), colX.qty + 40, y + 13, { align: 'right' });
    doc.text(Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.rate + 65, y + 13, { align: 'right' });
    doc.text(`${item.taxPercent || 18}%`, colX.tax + 45, y + 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_PRIMARY);
    doc.text(Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.amount, y + 13, { align: 'right' });

    y += 20;
  });

  y += 12;

  // =========================================================================
  // 4. TOTALS CALCULATIONS & NOTES
  // =========================================================================
  const subtotal = Number(docData.subtotal || items.reduce((acc: number, it: any) => acc + (Number(it.rate || 0) * Number(it.quantity || 1)), 0));
  const discountAmount = Number(docData.discountAmount || 0);
  const taxAmount = Number(docData.taxAmount || items.reduce((acc: number, it: any) => acc + ((Number(it.rate || 0) * Number(it.quantity || 1)) * (Number(it.taxPercent || 18) / 100)), 0));
  const total = Number(docData.total || (subtotal - discountAmount + taxAmount));
  const amountPaid = Number(docData.amountPaid || 0);
  const balanceDue = Number(docData.balanceDue || Math.max(0, total - amountPaid));

  const totalsBoxWidth = 210;
  const totalsBoxX = PAGE_WIDTH - MARGIN_X - totalsBoxWidth;

  let totalsSectionHeight = 85;
  if (normType === 'invoice') totalsSectionHeight += 32;

  // Render Ledger Notes if present on left side
  if (docData.notes) {
    const notesWidth = 250;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED);
    doc.text('LEDGER NOTES:', MARGIN_X, y + 10);

    doc.setFillColor(COLOR_BG_LIGHT);
    doc.roundedRect(MARGIN_X, y + 15, notesWidth, 55, 4, 4, 'F');
    doc.setDrawColor(COLOR_BORDER);
    doc.roundedRect(MARGIN_X, y + 15, notesWidth, 55, 4, 4, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_SECONDARY);
    const noteLines = doc.splitTextToSize(String(docData.notes), notesWidth - 16);
    doc.text(noteLines.slice(0, 4), MARGIN_X + 8, y + 28);
  }

  // Totals Breakdown (Right Side)
  let totY = y + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_SECONDARY);

  doc.text('Items Subtotal:', totalsBoxX, totY);
  doc.text(`₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X, totY, { align: 'right' });
  totY += 15;

  if (discountAmount > 0) {
    doc.setTextColor('#059669'); // Emerald 600
    doc.text('Aggregate Discount:', totalsBoxX, totY);
    doc.text(`- ₹ ${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X, totY, { align: 'right' });
    totY += 15;
  }

  doc.setTextColor(COLOR_SECONDARY);
  doc.text(`Accrued GST (${company.gstRate || 18}%):`, totalsBoxX, totY);
  doc.text(`+ ₹ ${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X, totY, { align: 'right' });
  totY += 18;

  // GRAND TOTAL Highlighted Panel
  doc.setFillColor('#f1f5f9');
  doc.roundedRect(totalsBoxX, totY, totalsBoxWidth, 22, 3, 3, 'F');
  doc.setDrawColor(COLOR_BORDER);
  doc.roundedRect(totalsBoxX, totY, totalsBoxWidth, 22, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text('GRAND TOTAL:', totalsBoxX + 8, totY + 15);
  doc.text(`₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X - 8, totY + 15, { align: 'right' });

  totY += 28;

  if (normType === 'invoice') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor('#059669');
    doc.text('Amount Acknowledged:', totalsBoxX, totY);
    doc.text(`₹ ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X, totY, { align: 'right' });
    totY += 15;

    doc.setTextColor('#e11d48'); // Rose 600
    doc.text('Balance Due:', totalsBoxX, totY);
    doc.text(`₹ ${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, PAGE_WIDTH - MARGIN_X, totY, { align: 'right' });
    totY += 18;
  }

  y = Math.max(y + 80, totY + 10);

  // Optional Terms text
  if (docData.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED);
    doc.text('STANDARD TERMS & POLICY:', MARGIN_X, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED);
    const termLines = doc.splitTextToSize(String(docData.terms), CONTENT_WIDTH);
    doc.text(termLines.slice(0, 2), MARGIN_X, y);
    y += termLines.slice(0, 2).length * 10 + 10;
  }

  // =========================================================================
  // 5. UNIFIED PAYMENT FOOTER ROW (Bank Details | Custom QR Code | Signature)
  // =========================================================================
  const FOOTER_ROW_HEIGHT = 110;
  const preferredFooterY = PAGE_HEIGHT - MARGIN_Y - FOOTER_ROW_HEIGHT - 12; // 687.89 pt

  let footerY = y + 15;
  if (footerY < preferredFooterY) {
    // Single-page document: Anchor payment row near bottom of A4 for balanced vertical layout
    footerY = preferredFooterY;
  } else if (footerY + FOOTER_ROW_HEIGHT > PAGE_HEIGHT - MARGIN_Y) {
    // Overflowing document: Start footer row cleanly on a new page
    doc.addPage();
    footerY = MARGIN_Y + 10;
  }

  // Grid widths for 3 unified columns spanning CONTENT_WIDTH (531.28 pt)
  const bankWidth = 245;
  const qrWidth = 125;
  const sigWidth = 145;
  const colGap = 8; // 245 + 8 + 125 + 8 + 145 = 531 pt

  const bankX = MARGIN_X;
  const qrX = bankX + bankWidth + colGap; // 285 pt
  const sigX = qrX + qrWidth + colGap;   // 418 pt

  // -------------------------------------------------------------------------
  // COLUMN 1: Remittance Bank Details
  // -------------------------------------------------------------------------
  doc.setFillColor(COLOR_BG_LIGHT);
  doc.roundedRect(bankX, footerY, bankWidth, FOOTER_ROW_HEIGHT, 4, 4, 'F');
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.roundedRect(bankX, footerY, bankWidth, FOOTER_ROW_HEIGHT, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text('REMITTANCE SETTLEMENT BANK:', bankX + 10, footerY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);

  let bY = footerY + 28;
  const bName = bank.bankName || 'HDFC Bank';
  const bHolder = bank.accountHolderName || bank.accountName || companyNameStr;
  const bAcc = bank.accountNumber || '';
  const bIfsc = bank.ifsc || bank.ifscCode || '';
  const bBranch = bank.branch || bank.branchName || '';
  const bUpi = bank.upiId || bank.upi || '';

  doc.text(`Bank Name: ${bName}`, bankX + 10, bY); bY += 12;
  if (bHolder) { doc.text(`Account Holder: ${bHolder.slice(0, 32)}`, bankX + 10, bY); bY += 12; }
  if (bAcc) { doc.text(`Account No: ${bAcc}`, bankX + 10, bY); bY += 12; }
  if (bIfsc) { doc.text(`IFSC Code: ${bIfsc}`, bankX + 10, bY); bY += 12; }
  if (bBranch) { doc.text(`Branch: ${bBranch.slice(0, 30)}`, bankX + 10, bY); bY += 12; }
  if (bUpi) { doc.text(`UPI ID: ${bUpi}`, bankX + 10, bY); bY += 12; }

  // -------------------------------------------------------------------------
  // COLUMN 2: Custom QR Code
  // -------------------------------------------------------------------------
  doc.setFillColor(COLOR_BG_LIGHT);
  doc.roundedRect(qrX, footerY, qrWidth, FOOTER_ROW_HEIGHT, 4, 4, 'F');
  doc.setDrawColor(COLOR_BORDER);
  doc.roundedRect(qrX, footerY, qrWidth, FOOTER_ROW_HEIGHT, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_SECONDARY);
  doc.text('SCAN & PAY VIA UPI', qrX + (qrWidth / 2), footerY + 14, { align: 'center' });

  if (qrDataUrl) {
    try {
      const qrFormat = qrContentType.includes('jpeg') || qrContentType.includes('jpg') ? 'JPEG' : 'PNG';
      const qrSize = 66; // 66 pt x 66 pt square (~23.3 mm)
      const qrImgX = qrX + (qrWidth - qrSize) / 2; // centered horizontally inside 125pt box
      const qrImgY = footerY + 20;

      doc.addImage(qrDataUrl, qrFormat, qrImgX, qrImgY, qrSize, qrSize);
      console.log('[BACKEND PDF] Custom QR embedded at coordinates:', { x: qrImgX, y: qrImgY, size: qrSize });
    } catch (e) {
      console.error('[BACKEND PDF] Failed to embed custom QR image:', e);
      throw new Error('Unable to prepare the company QR Code for PDF. Failed to embed image into document.');
    }
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED);
    doc.text('No QR Code', qrX + (qrWidth / 2), footerY + 58, { align: 'center' });
  }

  // Label under QR Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_SECONDARY);
  const upiLabel = bUpi ? `UPI: ${bUpi}` : 'Scan with any UPI App';
  doc.text(upiLabel.slice(0, 24), qrX + (qrWidth / 2), footerY + 98, { align: 'center' });

  // -------------------------------------------------------------------------
  // COLUMN 3: Authorized Signature
  // -------------------------------------------------------------------------
  doc.setFillColor(COLOR_BG_LIGHT);
  doc.roundedRect(sigX, footerY, sigWidth, FOOTER_ROW_HEIGHT, 4, 4, 'F');
  doc.setDrawColor(COLOR_BORDER);
  doc.roundedRect(sigX, footerY, sigWidth, FOOTER_ROW_HEIGHT, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);
  const sigCompName = companyNameStr.length > 20 ? companyNameStr.slice(0, 20) + '...' : companyNameStr;
  doc.text(`For ${sigCompName}`, sigX + 10, footerY + 14);

  if (signatureDataUrl) {
    try {
      const sigFormat = signatureDataUrl.includes('jpeg') || signatureDataUrl.includes('jpg') ? 'JPEG' : 'PNG';
      const sigW = 95;
      const sigH = 38;
      const sigImgX = sigX + (sigWidth - sigW) / 2;
      const sigImgY = footerY + 22;

      doc.addImage(signatureDataUrl, sigFormat, sigImgX, sigImgY, sigW, sigH);
    } catch (e) {
      console.warn('Failed to embed signature image in jsPDF:', e);
    }
  }

  // Baseline separator line inside signature box
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(sigX + 15, footerY + 82, sigX + sigWidth - 15, footerY + 82);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text('Authorized Signatory', sigX + (sigWidth / 2), footerY + 96, { align: 'center' });

  // Page Footer Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text('Thank you for your business. • This is a computer generated document.', PAGE_WIDTH / 2, footerY + FOOTER_ROW_HEIGHT + 12, { align: 'center' });

  // Output PDF Buffer
  const arrayBuffer = doc.output('arraybuffer');
  const pdfBuffer = Buffer.from(arrayBuffer);

  console.log('[BACKEND PDF GENERATION COMPLETE]', {
    docType,
    pdfBytesLength: pdfBuffer.length,
    qrDataUrlLength: qrDataUrl.length,
    qrBytesLength
  });

  return pdfBuffer;
}
