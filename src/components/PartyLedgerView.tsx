import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  Plus,
  FileText,
  CheckCircle,
  CreditCard,
  PlusCircle,
  Trash2,
  Paperclip,
  User,
  Phone,
  MapPin,
  TrendingUp,
  Coins,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Share2,
  DollarSign,
  Check,
  FileSpreadsheet,
  ChevronDown,
  Info,
  Building,
  Smartphone,
  MessageSquare,
  X
} from 'lucide-react';
import {
  Party,
  Invoice,
  Purchase,
  Payment,
  CreditNote,
  SalesReturn,
  PartyAdjustment
} from '../types';
import { AppState } from '../data';
import DocumentPrintView from './DocumentPrintView';
import { sendWhatsAppMessage } from '../services/communicationService';

interface PartyLedgerViewProps {
  party: Party;
  onBack: () => void;
  db: AppState;
  isAdmin: boolean;
  onUpdateParty: (id: string, party: Partial<Party>) => void;
  currentUser?: any;
}

type TabType = 'Overview' | 'Ledger' | 'Invoices' | 'Payments' | 'Returns' | 'Credit Notes' | 'Documents' | 'Notes';

export default function PartyLedgerView({
  party,
  onBack,
  db,
  isAdmin,
  onUpdateParty,
  currentUser
}: PartyLedgerViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Ledger');
  
  // For parties of type 'Both', let them toggle between viewing as Customer or Supplier
  const [ledgerMode, setLedgerMode] = useState<'Customer' | 'Supplier'>(
    party.type === 'Supplier' ? 'Supplier' : 'Customer'
  );

  // Filter States
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for Notes & Attachments creation
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Adjustment Form States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<boolean>(false);
  const [adjType, setAdjType] = useState<'Debit' | 'Credit'>('Debit');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjRef, setAdjRef] = useState<string>('');
  const [adjDesc, setAdjDesc] = useState<string>('');

  // Active viewing transaction state for print modal
  const [printingTxn, setPrintingTxn] = useState<any>(null);
  const [printingTxnType, setPrintingTxnType] = useState<any>(null);

  // Dynamic system computer date helpers
  const todayStr = new Date().toISOString().substring(0, 10);

  // -----------------------------------------------------------------
  // 1. DATA AGGREGATION & RUNNING BALANCE LOGIC
  // -----------------------------------------------------------------
  const transactions = useMemo(() => {
    const list: any[] = [];

    // A. Opening Balance row
    // We add it at the start of time. Use createdAt or default.
    list.push({
      id: `ob-${party.id}`,
      date: party.createdAt.substring(0, 10) || '2026-04-01',
      type: 'Opening Balance',
      reference: `OB/${party.code}`,
      description: `Opening Balance Brought Forward`,
      debit: party.balanceType === 'Receivable' ? party.openingBalance : 0,
      credit: party.balanceType === 'Payable' ? party.openingBalance : 0,
      status: 'Settled',
      original: party,
      timestamp: party.createdAt
    });

    // B. Sales Invoices (Debit)
    db.invoices.forEach(inv => {
      if (inv.partyId === party.id && inv.status !== 'Cancelled') {
        list.push({
          id: inv.id,
          date: inv.invoiceDate,
          type: 'Sales Invoice',
          reference: inv.invoiceNumber,
          description: `Sales Invoice Billing`,
          debit: inv.total,
          credit: 0,
          status: inv.status,
          original: inv,
          timestamp: inv.createdAt || inv.invoiceDate + 'T10:00:00Z'
        });
      }
    });

    // C. Purchase Invoices (Credit)
    db.purchases.forEach(p => {
      if (p.partyId === party.id && p.paymentStatus !== 'Cancelled') {
        list.push({
          id: p.id,
          date: p.purchaseDate,
          type: 'Purchase Invoice',
          reference: p.purchaseNumber,
          description: `Procurement Inward Bill`,
          debit: 0,
          credit: p.total,
          status: p.paymentStatus,
          original: p,
          timestamp: p.createdAt || p.purchaseDate + 'T10:00:00Z'
        });
      }
    });

    // D. Payments (In/Out)
    db.payments.forEach(pay => {
      if (pay.partyId === party.id) {
        const isPayIn = pay.paymentType === 'Payment In';
        list.push({
          id: pay.id,
          date: pay.paymentDate,
          type: pay.paymentType, // 'Payment In' or 'Payment Out'
          reference: pay.paymentNumber,
          description: `Payment ${isPayIn ? 'Received' : 'Paid'} via ${pay.paymentMethod}`,
          debit: isPayIn ? 0 : pay.amount,
          credit: isPayIn ? pay.amount : 0,
          status: 'Cleared',
          original: pay,
          timestamp: pay.createdAt || pay.paymentDate + 'T12:00:00Z'
        });
      }
    });

    // E. Credit Notes (Credit)
    db.creditNotes.forEach(cn => {
      if (cn.partyId === party.id && cn.status !== 'Cancelled') {
        list.push({
          id: cn.id,
          date: cn.creditNoteDate,
          type: 'Credit Note',
          reference: cn.creditNoteNumber,
          description: `Credit Note Adjustment: ${cn.reason || 'Returns'}`,
          debit: 0,
          credit: cn.total,
          status: cn.status,
          original: cn,
          timestamp: cn.createdAt || cn.creditNoteDate + 'T14:00:00Z'
        });
      }
    });

    // F. Sales Returns (Credit)
    db.salesReturns.forEach(sr => {
      if (sr.partyId === party.id) {
        list.push({
          id: sr.id,
          date: sr.returnDate,
          type: 'Sales Return',
          reference: sr.returnNumber,
          description: `Sales Return Processing`,
          debit: 0,
          credit: sr.totalReturnAmount,
          status: 'Cleared',
          original: sr,
          timestamp: sr.createdAt || sr.returnDate + 'T14:30:00Z'
        });
      }
    });

    // G. Expenses (Supplier Debit if linked by Vendor Name)
    db.expenses.forEach(exp => {
      if (exp.vendorName?.toLowerCase() === party.name.toLowerCase() || exp.vendorName?.toLowerCase() === party.companyName?.toLowerCase()) {
        list.push({
          id: exp.id,
          date: exp.expenseDate,
          type: 'Expense',
          reference: exp.expenseNumber,
          description: `Linked Operating Expense: ${exp.category}`,
          debit: exp.amount,
          credit: 0,
          status: 'Paid',
          original: exp,
          timestamp: exp.createdAt || exp.expenseDate + 'T11:00:00Z'
        });
      }
    });

    // H. Manual Adjustments
    if (db.adjustments) {
      db.adjustments.forEach(adj => {
        if (adj.partyId === party.id) {
          list.push({
            id: adj.id,
            date: adj.adjustmentDate,
            type: 'Adjustment',
            reference: adj.referenceNumber,
            description: adj.description,
            debit: adj.adjustmentType === 'Debit' ? adj.amount : 0,
            credit: adj.adjustmentType === 'Credit' ? adj.amount : 0,
            status: 'Settled',
            original: adj,
            timestamp: adj.createdAt
          });
        }
      });
    }

    // Sort chronologically by date first, then by timestamp/created time
    list.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.timestamp.localeCompare(b.timestamp);
    });

    // Calculate live running balance column
    let balance = 0;
    list.forEach(item => {
      if (ledgerMode === 'Customer') {
        // Dr-oriented: Debit increases Receivable outstanding, Credit decreases it
        balance += (item.debit - item.credit);
      } else {
        // Cr-oriented: Credit increases Payable outstanding, Debit decreases it
        balance += (item.credit - item.debit);
      }
      item.runningBalance = balance;
    });

    return list;
  }, [party, db, ledgerMode]);

  // Financial summary metrics calculated on-the-fly
  const metrics = useMemo(() => {
    let opening = party.openingBalance;
    let sales = 0;
    let purchases = 0;
    let receipts = 0;
    let payments = 0;
    let deductions = 0;

    transactions.forEach(t => {
      if (t.type === 'Opening Balance') return;
      if (t.type === 'Sales Invoice') sales += t.debit;
      if (t.type === 'Purchase Invoice') purchases += t.credit;
      if (t.type === 'Payment In') receipts += t.credit;
      if (t.type === 'Payment Out') payments += t.debit;
      if (t.type === 'Credit Note' || t.type === 'Sales Return') deductions += t.credit;
    });

    const closingBalance = transactions[transactions.length - 1]?.runningBalance ?? 0;
    const lastTxnDate = transactions[transactions.length - 1]?.date ?? 'No transactions';

    return {
      opening,
      sales,
      purchases,
      receipts,
      payments,
      deductions,
      closingBalance,
      lastTxnDate
    };
  }, [transactions, party]);

  // -----------------------------------------------------------------
  // 2. FILTERING ENGINE FOR VISIBLE ROWS
  // -----------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch = 
          (t.reference && t.reference.toLowerCase().includes(term)) ||
          (t.type && t.type.toLowerCase().includes(term)) ||
          (t.description && t.description.toLowerCase().includes(term)) ||
          (t.status && t.status.toLowerCase().includes(term)) ||
          (t.debit && t.debit.toString().includes(term)) ||
          (t.credit && t.credit.toString().includes(term)) ||
          (t.runningBalance && t.runningBalance.toString().includes(term)) ||
          (t.date && t.date.includes(term)) ||
          (party.name && party.name.toLowerCase().includes(term)) ||
          (party.phone && party.phone.toLowerCase().includes(term)) ||
          (party.gstNumber && party.gstNumber.toLowerCase().includes(term));
        
        if (!matchesSearch) return false;
      }

      // Date Filters
      if (dateFilter !== 'All') {
        const tDate = new Date(t.date);
        const refDate = new Date();

        if (dateFilter === 'Today') {
          if (t.date !== todayStr) return false;
        } else if (dateFilter === 'Yesterday') {
          const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
          if (t.date !== yesterday) return false;
        } else if (dateFilter === 'This Week') {
          refDate.setDate(refDate.getDate() - 7);
          if (tDate < refDate) return false;
        } else if (dateFilter === 'This Month') {
          refDate.setDate(refDate.getDate() - 30);
          if (tDate < refDate) return false;
        } else if (dateFilter === 'This Quarter') {
          refDate.setDate(refDate.getDate() - 90);
          if (tDate < refDate) return false;
        } else if (dateFilter === 'This Year') {
          refDate.setDate(refDate.getDate() - 365);
          if (tDate < refDate) return false;
        } else if (dateFilter === 'Financial Year') {
          // FY is April 1 to March 31
          const currYear = new Date().getFullYear();
          const fyStart = new Date(`${currYear}-04-01`);
          if (tDate < fyStart) return false;
        } else if (dateFilter === 'Custom') {
          if (customStartDate && t.date < customStartDate) return false;
          if (customEndDate && t.date > customEndDate) return false;
        }
      }

      // Transaction Type Filter
      if (txnTypeFilter !== 'All' && t.type !== txnTypeFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'All' && t.status !== statusFilter) {
        return false;
      }

      // Amount Range Filter
      const amt = t.debit || t.credit || 0;
      if (minAmount && amt < parseFloat(minAmount)) return false;
      if (maxAmount && amt > parseFloat(maxAmount)) return false;

      return true;
    });
  }, [transactions, searchTerm, dateFilter, customStartDate, customEndDate, txnTypeFilter, statusFilter, minAmount, maxAmount, party, todayStr]);

  // Calculated totals of the visible rows
  const visibleTotals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    filteredTransactions.forEach(t => {
      debits += t.debit;
      credits += t.credit;
    });
    return { debits, credits };
  }, [filteredTransactions]);

  // -----------------------------------------------------------------
  // 3. ACTIONS & HANDLERS
  // -----------------------------------------------------------------
  // Save Manual Adjustment
  const handleSaveAdjustment = () => {
    if (!adjAmount || isNaN(parseFloat(adjAmount))) {
      alert('Please enter a valid amount');
      return;
    }

    const newAdj: PartyAdjustment = {
      id: `adj-${Date.now()}`,
      partyId: party.id,
      partyName: party.name,
      adjustmentDate: todayStr,
      adjustmentType: adjType,
      amount: parseFloat(adjAmount),
      referenceNumber: adjRef || `ADJ/${party.code}/${Date.now().toString().slice(-4)}`,
      description: adjDesc || `Manual Ledger Adjustment (${adjType})`,
      createdBy: currentUser?.name || 'Operations Team',
      createdAt: new Date().toISOString()
    };

    // Update the parent's app state adjustments
    const currentAdjustments = db.adjustments || [];
    const updatedAdjustments = [...currentAdjustments, newAdj];

    // Trigger update party to force refresh & save
    onUpdateParty(party.id, {
      updatedAt: new Date().toISOString()
    });

    // Side effect: update in Firestore/localStorage via parent container update adjustment callback
    db.adjustments = updatedAdjustments;
    
    // Reset Form
    setAdjAmount('');
    setAdjRef('');
    setAdjDesc('');
    setShowAdjustmentModal(false);
  };

  // Upload Attachment Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const files = e.target?.files || e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const docs = party.documentsList || [];
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: reader.result as string, // base64 URL
        uploadedAt: new Date().toISOString()
      };

      onUpdateParty(party.id, {
        documentsList: [...docs, newDoc]
      });
    };
    reader.readAsDataURL(file);
    setIsDragOver(false);
  };

  // Add Note Handler
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const notes = party.notesList || [];
    const newNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent,
      createdBy: currentUser?.name || 'Authorized Staff',
      createdAt: new Date().toISOString()
    };

    onUpdateParty(party.id, {
      notesList: [newNote, ...notes]
    });
    setNewNoteContent('');
  };

  // Delete Note Handler
  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    const notes = party.notesList || [];
    onUpdateParty(party.id, {
      notesList: notes.filter(n => n.id !== noteId)
    });
  };

  // Delete Document Handler
  const handleDeleteDoc = (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    const docs = party.documentsList || [];
    onUpdateParty(party.id, {
      documentsList: docs.filter(d => d.id !== docId)
    });
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Transaction No', 'Type', 'Description', 'Debit', 'Credit', 'Running Balance', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.reference,
      t.type,
      t.description.replace(/,/g, ' '),
      t.debit,
      t.credit,
      t.runningBalance,
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${party.name.replace(/\s+/g, '_')}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel
  const exportExcel = () => {
    // Generate simple tab separated format that opens natively in excel
    let text = "Company Name:\t" + db.settings.company.companyName + "\n";
    text += "Party Name:\t" + party.name + "\n";
    text += "Ledger Mode:\t" + ledgerMode + "\n";
    text += "Generated At:\t" + new Date().toLocaleString() + "\n\n";
    
    text += "Date\tTransaction No\tType\tDescription\tDebit\tCredit\tRunning Balance\tStatus\n";
    filteredTransactions.forEach(t => {
      text += `${t.date}\t${t.reference}\t${t.type}\t${t.description}\t${t.debit}\t${t.credit}\t${t.runningBalance}\t${t.status}\n`;
    });

    const blob = new Blob([text], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${party.name.replace(/\s+/g, '_')}_ledger.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Ledger standard document preview handler
  const handlePrintLedger = () => {
    const reportData = {
      partyName: party.name,
      partyPhone: party.phone,
      partyGst: party.gstNumber || 'Unregistered',
      partyAddress: party.billingAddress,
      ledgerMode: ledgerMode,
      dateRange: dateFilter === 'Custom' ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}` : dateFilter,
      openingBalance: metrics.opening,
      columns: ['Date', 'Transaction Code', 'Type', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'],
      rows: filteredTransactions.map(t => [
        t.date,
        t.reference,
        t.type,
        t.description,
        t.debit || 0,
        t.credit || 0,
        t.runningBalance
      ]),
      totals: [
        'Total',
        '',
        '',
        `Visible rows: ${filteredTransactions.length}`,
        visibleTotals.debits,
        visibleTotals.credits,
        metrics.closingBalance
      ]
    };

    setPrintingTxnType('party_ledger');
    setPrintingTxn(reportData);
  };

  // Open Document Detail modal in viewer
  const handleViewDocument = (t: any) => {
    if (t.type === 'Sales Invoice') {
      setPrintingTxnType('invoice');
      setPrintingTxn(t.original);
    } else if (t.type === 'Purchase Invoice') {
      setPrintingTxnType('purchase');
      setPrintingTxn(t.original);
    } else if (t.type === 'Credit Note') {
      setPrintingTxnType('credit_note');
      setPrintingTxn(t.original);
    } else if (t.type === 'Payment In' || t.type === 'Payment Out') {
      setPrintingTxnType(t.type === 'Payment In' ? 'payment_receipt' : 'payment_voucher');
      setPrintingTxn(t.original);
    } else if (t.type === 'Sales Return') {
      setPrintingTxnType('sales_return');
      setPrintingTxn(t.original);
    } else {
      alert(`Quick print not supported for transaction type: ${t.type}. Try opening the respective tab.`);
    }
  };

  // Send WhatsApp sharing
  const handleWhatsAppShare = () => {
    const text = `Dear ${party.name},\n\nYour ledger summary with ${db.settings.company.companyName} is compiled below:\n\nOpening Balance: ₹${metrics.opening.toLocaleString()}\nCurrent Outstanding: ₹${metrics.closingBalance.toLocaleString()}\nLast Transaction Date: ${metrics.lastTxnDate}\n\nThank you!\n${db.settings.company.companyName}`;
    sendWhatsAppMessage({ to: party.phone, body: text }, db.settings, (log) => {
      console.log('WhatsApp sharing logged:', log);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="party_ledger_view_root">
      {/* 1. TOP BREADCRUMB & BACK BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            title="Go back to Parties list"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">BizOps CRM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] uppercase font-bold text-slate-500">{party.type} Profile</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{party.name}</h1>
          </div>
        </div>

        {/* Adjustments & Ledger toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {party.type === 'Both' && (
            <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold border border-slate-200">
              <button
                onClick={() => { setLedgerMode('Customer'); setActiveTab('Ledger'); }}
                className={`px-3 py-1.5 rounded-md transition-all ${ledgerMode === 'Customer' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Customer Ledger
              </button>
              <button
                onClick={() => { setLedgerMode('Supplier'); setActiveTab('Ledger'); }}
                className={`px-3 py-1.5 rounded-md transition-all ${ledgerMode === 'Supplier' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Supplier Ledger
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Adjustment</span>
          </button>
          
          <button
            onClick={handlePrintLedger}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
          >
            <Printer size={13} />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. THE GLOWING AMBIENT TOP PARTY SUMMARY CARD */}
      <div className="relative group/party-summary">
        {/* Soft glowing ambient light behind */}
        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl opacity-40 group-hover/party-summary:opacity-80 transition-all duration-300 pointer-events-none" />
        
        <div className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left section: Basic static info (4 columns) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-slate-500">
                  Code: {party.code}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${party.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                  {party.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                {party.companyName && (
                  <p className="text-xs font-semibold text-slate-500">{party.companyName}</p>
                )}
                {party.contactPerson && (
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>Contact: {party.contactPerson}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono font-bold">
                  <Phone size={13} className="text-slate-400" />
                  <span>{party.phone}</span>
                </p>
                {party.email && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{party.email}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 flex items-start gap-1.5">
                  <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{party.billingAddress}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div>
                <span className="block font-bold uppercase text-slate-400">GST Registration</span>
                <strong className="text-slate-600 font-bold">{party.gstRegistration}</strong>
              </div>
              {party.gstNumber && (
                <div>
                  <span className="block font-bold uppercase text-slate-400">GSTIN</span>
                  <strong className="text-slate-600 font-mono font-bold">{party.gstNumber}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Financial widgets grid (8 columns) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4" id="financial_summary_metrics_grid">
            {/* Opening Balance */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Coins size={11} className="text-slate-400" />
                <span>Opening Balance</span>
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-black text-slate-800 font-mono">₹{metrics.opening.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold">
                  Type: {party.balanceType === 'Receivable' ? 'Receivable (Dr)' : 'Payable (Cr)'}
                </span>
              </div>
            </div>

            {/* Total Billing */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={11} className="text-blue-500" />
                <span>Total {ledgerMode === 'Customer' ? 'Invoiced' : 'Procured'}</span>
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-black text-[#2563EB] font-mono">
                  ₹{(ledgerMode === 'Customer' ? metrics.sales : metrics.purchases).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold">
                  Total valid transaction count
                </span>
              </div>
            </div>

            {/* Total Cleared Receipts/Payments */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={11} className="text-emerald-500" />
                <span>Total {ledgerMode === 'Customer' ? 'Received' : 'Paid'}</span>
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-black text-emerald-600 font-mono">
                  ₹{(ledgerMode === 'Customer' ? metrics.receipts : metrics.payments).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold font-mono">
                  Real-time cleared checks
                </span>
              </div>
            </div>

            {/* Sales Returns / Credit Notes */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight size={11} className="text-rose-500" />
                <span>{ledgerMode === 'Customer' ? 'Returns & CN' : 'Procurement Debt Adjustments'}</span>
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-black text-rose-600 font-mono">
                  ₹{metrics.deductions.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold">
                  Returns / adjustments subtracted
                </span>
              </div>
            </div>

            {/* Current Outstanding */}
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3.5 flex flex-col justify-between shadow-[inset_0_1px_4px_rgba(59,130,246,0.05)] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={11} className="text-[#2563EB]" />
                <span>{ledgerMode === 'Customer' ? 'Outstanding due' : 'Payable due'}</span>
              </span>
              <div className="mt-2.5">
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{metrics.closingBalance.toLocaleString()}
                </span>
                <span className="text-[9px] text-blue-600 block mt-0.5 font-black uppercase tracking-wide">
                  Live Closing balance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THE TABS BAR */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap -mb-px space-x-6 text-xs font-bold uppercase tracking-wider">
          {(['Ledger', 'Overview', 'Invoices', 'Payments', 'Returns', 'Credit Notes', 'Documents', 'Notes'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* 4. ACTIVE TAB PANEL CONTENT */}
      <div className="space-y-4">
        {/* ================================================================= */}
        {/* OVERVIEW TAB */}
        {/* ================================================================= */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="overview_tab_panel">
            {/* Quick Metrics */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                  <TrendingUp size={13} className="text-[#2563EB]" />
                  <span>Credit Limit Status</span>
                </h3>
                {party.creditLimit ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className="text-slate-500">Utilized</span>
                      <span className="text-slate-800">
                        ₹{metrics.closingBalance.toLocaleString()} / ₹{party.creditLimit.toLocaleString()}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          metrics.closingBalance / party.creditLimit > 0.9 ? 'bg-rose-500' :
                          metrics.closingBalance / party.creditLimit > 0.7 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (metrics.closingBalance / party.creditLimit) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      {metrics.closingBalance >= party.creditLimit 
                        ? '⛔ Credit limit has been breached. Hold billing!' 
                        : `✅ ₹${(party.creditLimit - metrics.closingBalance).toLocaleString()} credit limit remaining.`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400 italic">No credit limit configured for this account.</p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                  <Clock size={13} className="text-[#2563EB]" />
                  <span>Ledger Activity Insights</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between pb-1 border-b border-slate-50">
                    <span className="text-slate-500">First Transaction Date</span>
                    <strong className="text-slate-700 font-mono">{transactions[0]?.date || 'None'}</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-50">
                    <span className="text-slate-500">Last Transaction Date</span>
                    <strong className="text-slate-700 font-mono">{metrics.lastTxnDate}</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Recorded Entries</span>
                    <strong className="text-slate-700 font-mono">{transactions.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Detail Columns */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 border-b border-slate-100 pb-2">
                <Building size={14} className="text-slate-400" />
                <span>Corporate Business Dossier</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Legal Company Name</span>
                  <strong className="text-slate-800 text-sm">{party.companyName || party.name}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">ERP Customer ID</span>
                  <strong className="text-slate-700 font-mono">{party.code}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">PAN</span>
                  <strong className="text-slate-700 font-mono">{party.pan || 'Not provided'}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Alternate Phone</span>
                  <strong className="text-slate-700 font-mono">{party.alternatePhone || 'None'}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Primary Billing Location</span>
                  <p className="text-slate-700 font-medium">{party.billingAddress}</p>
                </div>
                {party.shippingAddress && (
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Shipping Delivery Address</span>
                    <p className="text-slate-700 font-medium">{party.shippingAddress}</p>
                  </div>
                )}
                {party.notes && (
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">CRM Enrollment Remarks</span>
                    <p className="text-slate-500 italic font-medium bg-slate-50 p-2 rounded">{party.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* LEDGER TAB */}
        {/* ================================================================= */}
        {activeTab === 'Ledger' && (
          <div className="space-y-4 animate-fade-in" id="ledger_tab_panel">
            {/* Control Panel (Search, Filter toggler, Sharing, Downloads) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-96 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Voucher #, Type, Details, Status, Ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 w-full text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                      title="Clear Search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {searchTerm.trim() && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg shrink-0">
                    {filteredTransactions.length} Matching
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${showFilters ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <Filter size={12} />
                  <span>Filters</span>
                </button>

                <button
                  onClick={exportCSV}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                  title="Download Ledger in CSV format"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>

                <button
                  onClick={exportExcel}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                  title="Download Ledger in Excel XLS format"
                >
                  <FileSpreadsheet size={12} className="text-emerald-600" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                  title="Share ledger snapshot via WhatsApp"
                >
                  <MessageSquare size={12} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-slide-down grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Date Filter */}
                <div>
                  <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Date Interval</span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="All">Full History</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="This Quarter">This Quarter</option>
                    <option value="This Year">This Year</option>
                    <option value="Financial Year">Financial Year (FY)</option>
                    <option value="Custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Custom Date inputs */}
                {dateFilter === 'Custom' && (
                  <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">From Date</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">To Date</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono font-bold text-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* Txn Type Filter */}
                <div>
                  <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Transaction Type</span>
                  <select
                    value={txnTypeFilter}
                    onChange={(e) => setTxnTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="All">All Transactions</option>
                    <option value="Opening Balance">Opening Balance</option>
                    <option value="Sales Invoice">Sales Invoice</option>
                    <option value="Purchase Invoice">Purchase Invoice</option>
                    <option value="Payment In">Payment In</option>
                    <option value="Payment Out">Payment Out</option>
                    <option value="Credit Note">Credit Note</option>
                    <option value="Sales Return">Sales Return</option>
                    <option value="Expense">Expense</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>

                {/* Min Amount / Max Amount */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Min Amount</span>
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono text-slate-700"
                    />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Max Amount</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="running_party_ledger_table">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Transaction No</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3 text-right">Debit (Dr)</th>
                      <th className="py-3 px-3 text-right">Credit (Cr)</th>
                      <th className="py-3 px-3 text-right">Running Balance</th>
                      <th className="py-3 px-3 text-center">Row actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, idx) => {
                        const isDrVal = t.debit > 0;
                        const isCrVal = t.credit > 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{t.date}</td>
                            <td className="py-3 px-3 font-bold font-mono text-slate-700">{t.reference}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                t.type === 'Sales Invoice' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                t.type === 'Purchase Invoice' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                t.type === 'Payment In' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                t.type === 'Payment Out' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                t.type === 'Credit Note' || t.type === 'Sales Return' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={t.description}>
                              {t.description}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono ${isDrVal ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
                              {isDrVal ? `₹${t.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono ${isCrVal ? 'text-emerald-600 font-bold' : 'text-slate-300'}`}>
                              {isCrVal ? `₹${t.credit.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold font-mono text-slate-900 bg-slate-50/30">
                              ₹{t.runningBalance.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {t.type !== 'Opening Balance' && (
                                <button
                                  onClick={() => handleViewDocument(t)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded inline-flex items-center"
                                  title="Print or view full document"
                                >
                                  <Eye size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Totals footer */}
                  {filteredTransactions.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-black text-slate-950 border-t border-slate-200">
                        <td colSpan={4} className="py-3 px-3 text-right text-[10px] uppercase font-black tracking-wider">
                          Visible Totals
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          ₹{visibleTotals.debits.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          ₹{visibleTotals.credits.toLocaleString()}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right font-mono font-black text-[#2563EB]">
                          Closing: ₹{metrics.closingBalance.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* INVOICES TAB */}
        {/* ================================================================= */}
        {activeTab === 'Invoices' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 animate-fade-in" id="invoices_tab_panel">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Recorded Sales & Procurement Invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bill Number</th>
                    <th className="py-2.5 px-3">Flow Type</th>
                    <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                    <th className="py-2.5 px-3 text-right">Pending Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => t.type === 'Sales Invoice' || t.type === 'Purchase Invoice').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">No invoices logged for this business yet</td>
                    </tr>
                  ) : (
                    transactions
                      .filter(t => t.type === 'Sales Invoice' || t.type === 'Purchase Invoice')
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500">{inv.date}</td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-700">{inv.reference}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{inv.type}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            ₹{(inv.debit || inv.credit).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                            ₹{(inv.original?.balanceDue || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PAYMENTS TAB */}
        {/* ================================================================= */}
        {activeTab === 'Payments' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 animate-fade-in" id="payments_tab_panel">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Settlement Receipts Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Receipt Number</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount Cleared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => t.type === 'Payment In' || t.type === 'Payment Out').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">No cleared payment receipts found</td>
                    </tr>
                  ) : (
                    transactions
                      .filter(t => t.type === 'Payment In' || t.type === 'Payment Out')
                      .map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500">{pay.date}</td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-700">{pay.reference}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{pay.original?.paymentMethod}</td>
                          <td className="py-3 px-3 text-slate-500">{pay.description}</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
                            ₹{(pay.debit || pay.credit).toLocaleString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* RETURNS TAB */}
        {/* ================================================================= */}
        {activeTab === 'Returns' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 animate-fade-in" id="returns_tab_panel">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Product Sales Returns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Return Number</th>
                    <th className="py-2.5 px-3">Items Count</th>
                    <th className="py-2.5 px-3 text-right">Returned Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => t.type === 'Sales Return').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">No sales returns logged for this party</td>
                    </tr>
                  ) : (
                    transactions
                      .filter(t => t.type === 'Sales Return')
                      .map((ret) => (
                        <tr key={ret.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500">{ret.date}</td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-700">{ret.reference}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{ret.original?.items?.length || 0} items</td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                            ₹{ret.credit.toLocaleString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CREDIT NOTES TAB */}
        {/* ================================================================= */}
        {activeTab === 'Credit Notes' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 animate-fade-in" id="credit_notes_tab_panel">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Adjustments Credit Notes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Note Number</th>
                    <th className="py-2.5 px-3">Invoice Ref</th>
                    <th className="py-2.5 px-3">Adjustment Reason</th>
                    <th className="py-2.5 px-3 text-right">CN Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => t.type === 'Credit Note').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">No credit notes logged</td>
                    </tr>
                  ) : (
                    transactions
                      .filter(t => t.type === 'Credit Note')
                      .map((cn) => (
                        <tr key={cn.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500">{cn.date}</td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-700">{cn.reference}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{cn.original?.invoiceNumber || 'Manual'}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{cn.original?.reason}</td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                            ₹{cn.credit.toLocaleString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENTS TAB */}
        {/* ================================================================= */}
        {activeTab === 'Documents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="documents_tab_panel">
            {/* Drag & Drop Upload field */}
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'border-[#2563EB] bg-blue-50/50' : 'border-slate-300 hover:border-[#2563EB] bg-slate-50'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />
                <Paperclip className="mx-auto text-slate-400 mb-3" size={28} />
                <p className="text-xs font-bold text-slate-700">Drag & Drop files here</p>
                <p className="text-[10px] text-slate-400 mt-1">or Click to search files (Max 5MB)</p>
                <p className="text-[9px] text-slate-400 mt-2 font-mono">Supported: PDF, Excel, PNG, Doc</p>
              </div>
            </div>

            {/* Document attachments list (2 columns) */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Uploaded CRM Attachment Files</h3>
              {party.documentsList && party.documentsList.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {party.documentsList.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-xs border border-slate-100 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                        <FileText size={18} className="text-[#2563EB] shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-700 block truncate" title={doc.name}>{doc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(doc.size / 1024).toFixed(1)} KB • Uploaded {doc.uploadedAt.substring(0, 10)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {doc.url && (
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Download attachment"
                          >
                            <Download size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Delete document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-slate-150 rounded-lg">
                  <p className="text-xs text-slate-400 italic">No attachments or documents uploaded for this client.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NOTES TAB */}
        {/* ================================================================= */}
        {activeTab === 'Notes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="notes_tab_panel">
            {/* New Note Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <PlusCircle size={14} className="text-blue-500" />
                <span>Log CRM Staff Note</span>
              </h3>
              <textarea
                placeholder="Type operational or CRM memo comments..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 h-28"
              />
              <button
                onClick={handleAddNote}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center space-x-1"
              >
                <Plus size={13} />
                <span>Add Note Entry</span>
              </button>
            </div>

            {/* Note logs list (2 columns) */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Internal Memo Activity Feed</h3>
              {party.notesList && party.notesList.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {party.notesList.map((note) => (
                    <div key={note.id} className="border-b border-slate-100 pb-3 flex items-start justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{note.content}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="font-bold text-[#2563EB]">{note.createdBy}</span>
                          <span>•</span>
                          <span className="font-mono">{note.createdAt.replace('T', ' ').substring(0, 16)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded shrink-0 transition-colors"
                        title="Delete note entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-slate-150 rounded-lg">
                  <p className="text-xs text-slate-400 italic">No custom notes logged yet. Use the sidebar input form above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. ADD MANUAL ADJUSTMENT MODAL */}
      {/* ================================================================= */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl w-full max-w-sm mx-4 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Coins size={16} className="text-amber-500" />
                <span>Log Financial Adjustment</span>
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft size={16} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Type toggle */}
              <div>
                <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Adjustment Direction</span>
                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setAdjType('Debit')}
                    className={`py-1.5 rounded-md font-bold transition-all ${adjType === 'Debit' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'}`}
                  >
                    Debit (Increases Outstanding)
                  </button>
                  <button
                    onClick={() => setAdjType('Credit')}
                    className={`py-1.5 rounded-md font-bold transition-all ${adjType === 'Credit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'}`}
                  >
                    Credit (Decreases Outstanding)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Amount (₹)</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Reference */}
              <div>
                <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Reference Number (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. ADJ-001"
                  value={adjRef}
                  onChange={(e) => setAdjRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Adjustment Reason/Memo</span>
                <input
                  type="text"
                  placeholder="e.g. Settlement rounding rebate"
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="bg-amber-50 p-2 border border-amber-100 rounded text-[10px] text-amber-800 font-medium">
                ⚠️ Adjustment entries are posted directly to the party ledger and modify the dynamic running balance instantly.
              </div>

              <button
                onClick={handleSaveAdjustment}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all text-xs"
              >
                Post Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. STANDARD PRINT / PREVIEW MODAL GATEWAY */}
      {/* ================================================================= */}
      {printingTxn && (
        <DocumentPrintView
          documentType={printingTxnType}
          data={printingTxn}
          settings={db.settings}
          onClose={() => setPrintingTxn(null)}
        />
      )}
    </div>
  );
}
