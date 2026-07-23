import React, { useState, useMemo } from 'react';
import {
  FileText,
  X,
  Calendar,
  Printer,
  Download,
  Share2,
  Mail,
  Check,
  FileSpreadsheet,
  Phone,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react';
import { Party } from '../types';
import { AppState } from '../data';
import DocumentPrintView from './DocumentPrintView';
import { sendWhatsAppMessage } from '../services/communicationService';
import WhatsAppShareModal, { WhatsAppDocumentData } from './WhatsAppShareModal';

interface StatementGenerationDialogProps {
  party: Party;
  db: AppState;
  isOpen: boolean;
  onClose: () => void;
  onLogCommunication?: (log: any) => void;
  onCheckPin?: (action: string, callback: () => void) => void;
}

export default function StatementGenerationDialog({
  party,
  db,
  isOpen,
  onClose,
  onLogCommunication,
  onCheckPin
}: StatementGenerationDialogProps) {
  const [datePreset, setDatePreset] = useState<string>('This Month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeOpening, setIncludeOpening] = useState<boolean>(true);
  const [includeClosing, setIncludeClosing] = useState<boolean>(true);
  const [includeCompanyDetails, setIncludeCompanyDetails] = useState<boolean>(true);
  const [includeGst, setIncludeGst] = useState<boolean>(true);
  const [ledgerMode, setLedgerMode] = useState<'Customer' | 'Supplier'>(
    party.type === 'Supplier' ? 'Supplier' : 'Customer'
  );

  // Ready Generated View State
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // WhatsApp Dialog State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string>(party.phone || '');
  const [whatsappMsg, setWhatsappMsg] = useState<string>('');

  if (!isOpen) return null;

  // Compute preset dates
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    if (preset === 'Today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'This Week') {
      const first = today.getDate() - today.getDay();
      const firstDay = new Date(today.setDate(first)).toISOString().substring(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'This Month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${year}-${month}-01`);
      setEndDate(todayStr);
    } else if (preset === 'This Year') {
      const year = today.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(todayStr);
    } else if (preset === 'Financial Year') {
      const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      setStartDate(`${year}-04-01`);
      setEndDate(`${year + 1}-03-31`);
    } else if (preset === 'All Time') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Compile Statement Logic
  const generateStatementData = () => {
    const list: any[] = [];

    // Opening Balance
    if (includeOpening) {
      list.push({
        id: `ob-${party.id}`,
        date: party.createdAt.substring(0, 10) || '2026-04-01',
        reference: `OB/${party.code}`,
        type: 'Opening Balance',
        description: `Opening Balance Brought Forward`,
        debit: party.balanceType === 'Receivable' ? party.openingBalance : 0,
        credit: party.balanceType === 'Payable' ? party.openingBalance : 0,
        timestamp: party.createdAt
      });
    }

    // Sales Invoices
    db.invoices.forEach(inv => {
      if (inv.partyId === party.id && inv.status !== 'Cancelled') {
        list.push({
          id: inv.id,
          date: inv.invoiceDate,
          reference: inv.invoiceNumber,
          type: 'Sales Invoice',
          description: `Sales Invoice Billing`,
          debit: inv.total,
          credit: 0,
          timestamp: inv.createdAt || inv.invoiceDate + 'T10:00:00Z'
        });
      }
    });

    // Purchase Invoices
    db.purchases.forEach(p => {
      if (p.partyId === party.id && p.paymentStatus !== 'Cancelled') {
        list.push({
          id: p.id,
          date: p.purchaseDate,
          reference: p.purchaseNumber,
          type: 'Purchase Invoice',
          description: `Purchase Billing (${p.supplierInvoiceNumber || 'Direct'})`,
          debit: 0,
          credit: p.total,
          timestamp: p.createdAt || p.purchaseDate + 'T10:00:00Z'
        });
      }
    });

    // Payments
    db.payments.forEach(pay => {
      if (pay.partyId === party.id) {
        const isPayIn = pay.paymentType === 'Payment In';
        list.push({
          id: pay.id,
          date: pay.paymentDate,
          reference: pay.paymentNumber,
          type: isPayIn ? 'Payment In' : 'Payment Out',
          description: `Payment ${isPayIn ? 'Received' : 'Paid'} via ${pay.paymentMethod}`,
          debit: isPayIn ? 0 : pay.amount,
          credit: isPayIn ? pay.amount : 0,
          timestamp: pay.createdAt || pay.paymentDate + 'T12:00:00Z'
        });
      }
    });

    // Credit Notes
    db.creditNotes.forEach(cn => {
      if (cn.partyId === party.id) {
        const cnDate = cn.creditNoteDate || '2026-04-01';
        list.push({
          id: cn.id,
          date: cnDate,
          reference: cn.creditNoteNumber,
          type: 'Credit Note',
          description: `Credit Note Adjustment`,
          debit: 0,
          credit: cn.total,
          timestamp: cn.createdAt || cnDate + 'T12:00:00Z'
        });
      }
    });

    // Sales Returns
    db.salesReturns.forEach(sr => {
      if (sr.partyId === party.id) {
        list.push({
          id: sr.id,
          date: sr.returnDate,
          reference: sr.returnNumber,
          type: 'Sales Return',
          description: `Sales Return Adjustment`,
          debit: 0,
          credit: sr.totalReturnAmount,
          timestamp: sr.createdAt || sr.returnDate + 'T12:00:00Z'
        });
      }
    });

    // Sort chronologically
    list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Date filtering
    const filtered = list.filter(item => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });

    // Compute running balance
    let running = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = filtered.map(t => {
      const d = t.debit || 0;
      const c = t.credit || 0;
      totalDebit += d;
      totalCredit += c;

      if (ledgerMode === 'Customer') {
        running += (d - c);
      } else {
        running += (c - d);
      }

      return [
        t.date,
        t.reference,
        t.type,
        t.description,
        d,
        c,
        running
      ];
    });

    const reportData = {
      partyName: party.name,
      partyPhone: party.phone,
      partyGst: includeGst ? (party.gstNumber || 'Unregistered') : 'N/A',
      partyAddress: party.billingAddress,
      ledgerMode,
      dateRange: datePreset === 'All Time' ? 'All Transactions' : `${startDate || 'Start'} to ${endDate || 'End'} (${datePreset})`,
      openingBalance: includeOpening ? party.openingBalance : 0,
      columns: ['Date', 'Reference', 'Type', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'],
      rows,
      totals: ['Total', '', '', `Total Entries: ${rows.length}`, totalDebit, totalCredit, running],
      closingBalance: running
    };

    setGeneratedData(reportData);
    setShowPrintModal(true);
  };

  // WhatsApp trigger
  const handleOpenWhatsApp = () => {
    if (!generatedData) return;
    const msg = `Dear ${party.name},\n\nPlease find your Account Statement with ${db.settings.company.companyName} for period (${generatedData.dateRange}):\n\nOpening Balance: ₹${generatedData.openingBalance.toLocaleString()}\nClosing Outstanding: ₹${generatedData.closingBalance.toLocaleString()}\nTotal Debit: ₹${generatedData.totals[4].toLocaleString()}\nTotal Credit: ₹${generatedData.totals[5].toLocaleString()}\n\nThank you for your business!`;
    setWhatsappMsg(msg);
    setShowWhatsAppModal(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!generatedData) return;
    const headers = ['Date', 'Reference', 'Type', 'Description', 'Debit', 'Credit', 'Running Balance'];
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...generatedData.rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${party.name.replace(/\s+/g, '_')}_statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!generatedData) return;
    let text = "Company Name:\t" + db.settings.company.companyName + "\n";
    text += "Party Name:\t" + party.name + "\n";
    text += "Statement Period:\t" + generatedData.dateRange + "\n";
    text += "Generated At:\t" + new Date().toLocaleString() + "\n\n";

    text += "Date\tReference\tType\tDescription\tDebit\tCredit\tRunning Balance\n";
    generatedData.rows.forEach((row: any[]) => {
      text += `${row[0]}\t${row[1]}\t${row[2]}\t${row[3]}\t${row[4]}\t${row[5]}\t${row[6]}\n`;
    });

    const blob = new Blob([text], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${party.name.replace(/\s+/g, '_')}_statement.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-[#102A43] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#2563EB] text-white p-2 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Generate Account Statement</h2>
              <p className="text-xs text-blue-300 font-medium">{party.name} ({party.type})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#173F63] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mode selector if Party is 'Both' */}
          {party.type === 'Both' && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLedgerMode('Customer')}
                className={`flex-1 py-2 rounded-lg transition-all ${ledgerMode === 'Customer' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Customer Ledger Statement
              </button>
              <button
                type="button"
                onClick={() => setLedgerMode('Supplier')}
                className={`flex-1 py-2 rounded-lg transition-all ${ledgerMode === 'Supplier' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Supplier Ledger Statement
              </button>
            </div>
          )}

          {/* Date Range Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Select Date Range Interval
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['Today', 'This Week', 'This Month', 'This Year', 'Financial Year', 'All Time'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetChange(preset)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border text-center transition-all ${
                    datePreset === preset
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Dates Input */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setDatePreset('Custom'); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDatePreset('Custom'); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Statement Preferences Checkboxes */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Statement Toggles & Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={includeOpening}
                  onChange={(e) => setIncludeOpening(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Opening Balance</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={includeClosing}
                  onChange={(e) => setIncludeClosing(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Closing Balance Summary</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={includeCompanyDetails}
                  onChange={(e) => setIncludeCompanyDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Company Header & Logo</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={includeGst}
                  onChange={(e) => setIncludeGst(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include GST Number & Tax details</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Target Party Phone:</span>
            <span className="text-xs font-bold text-slate-800 font-mono">{party.phone || 'N/A'}</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={generateStatementData}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <FileText size={14} />
              <span>Generate Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Preview & Delivery Modal */}
      {showPrintModal && generatedData && (
        <DocumentPrintView
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          data={generatedData}
          documentType="party_ledger"
          settings={db.settings}
          onLogCommunication={onLogCommunication}
          extraActions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Send via WhatsApp"
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Export Excel"
              >
                <FileSpreadsheet size={13} />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Export CSV"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>
            </div>
          }
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          documentData={{
            documentType: 'Account Statement',
            documentId: party.id,
            documentNumber: `STATEMENT_${startDate}_${endDate}`,
            partyId: party.id,
            partyName: party.name,
            savedPhone: party.phone,
            pdfFileName: `Account_Statement_${party.name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`,
            amount: generatedData?.closingBalance || 0,
            date: `${startDate} to ${endDate}`,
            greetingText: whatsappMsg
          }}
          settings={db.settings}
          party={party}
          onLogCommunication={onLogCommunication}
        />
      )}
    </div>
  );
}
