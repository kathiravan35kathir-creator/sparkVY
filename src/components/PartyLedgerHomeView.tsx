import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  Printer,
  Download,
  Share2,
  Mail,
  FileText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  Building,
  Phone,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { Party, PartyType } from '../types';
import { AppState } from '../data';
import PartyLedgerView from './PartyLedgerView';
import StatementGenerationDialog from './StatementGenerationDialog';
import DocumentPrintView from './DocumentPrintView';
import { sendWhatsAppMessage } from '../services/communicationService';

interface PartyLedgerHomeViewProps {
  db: AppState;
  isAdmin: boolean;
  onUpdateParty: (id: string, party: Partial<Party>) => void;
  currentUser?: any;
  onNavigateToTab?: (tab: string) => void;
}

export default function PartyLedgerHomeView({
  db,
  isAdmin,
  onUpdateParty,
  currentUser,
  onNavigateToTab
}: PartyLedgerHomeViewProps) {
  // Navigation State inside module: null = Directory Home, Party object = Detailed Ledger View
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<Party | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All'); // All, Customer, Supplier, Both
  const [balanceFilter, setBalanceFilter] = useState<string>('All'); // All, Outstanding Only, Zero Balance, Negative Balance
  const [statusFilter, setStatusFilter] = useState<string>('Active'); // All, Active, Inactive
  const [selectedWidget, setSelectedWidget] = useState<'top_customers' | 'top_suppliers' | 'recent' | 'overdue' | 'all'>('all');

  // Dialog & Modal States
  const [statementParty, setStatementParty] = useState<Party | null>(null);
  const [printingDoc, setPrintingDoc] = useState<{ party: Party; reportData: any } | null>(null);
  const [whatsAppModalParty, setWhatsAppModalParty] = useState<Party | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');

  // -----------------------------------------------------------------
  // LIVE COMPUTATION: CALCULATE ACCURATE REALTIME PARTY BALANCES
  // -----------------------------------------------------------------
  const partyLedgerSummaries = useMemo(() => {
    return db.parties.map(party => {
      // 1. Opening Balance
      let netBalance = party.balanceType === 'Receivable' ? party.openingBalance : -party.openingBalance;
      let totalSales = 0;
      let totalPurchases = 0;
      let totalPaymentIn = 0;
      let totalPaymentOut = 0;
      let totalCreditNotes = 0;
      let totalSalesReturns = 0;
      let lastTxnDate = party.createdAt.substring(0, 10);

      // 2. Sales Invoices
      db.invoices.forEach(inv => {
        if (inv.partyId === party.id && inv.status !== 'Cancelled') {
          totalSales += inv.total;
          netBalance += inv.total;
          if (inv.invoiceDate > lastTxnDate) lastTxnDate = inv.invoiceDate;
        }
      });

      // 3. Purchase Invoices
      db.purchases.forEach(p => {
        if (p.partyId === party.id && p.paymentStatus !== 'Cancelled') {
          totalPurchases += p.total;
          netBalance -= p.total;
          if (p.purchaseDate > lastTxnDate) lastTxnDate = p.purchaseDate;
        }
      });

      // 4. Payments
      db.payments.forEach(pay => {
        if (pay.partyId === party.id) {
          if (pay.paymentType === 'Payment In') {
            totalPaymentIn += pay.amount;
            netBalance -= pay.amount;
          } else {
            totalPaymentOut += pay.amount;
            netBalance += pay.amount;
          }
          if (pay.paymentDate > lastTxnDate) lastTxnDate = pay.paymentDate;
        }
      });

      // 5. Credit Notes
      db.creditNotes.forEach(cn => {
        if (cn.partyId === party.id) {
          totalCreditNotes += cn.total;
          netBalance -= cn.total;
          if (cn.creditNoteDate && cn.creditNoteDate > lastTxnDate) lastTxnDate = cn.creditNoteDate;
        }
      });

      // 6. Sales Returns
      db.salesReturns.forEach(sr => {
        if (sr.partyId === party.id) {
          totalSalesReturns += sr.totalReturnAmount;
          netBalance -= sr.totalReturnAmount;
          if (sr.returnDate > lastTxnDate) lastTxnDate = sr.returnDate;
        }
      });

      return {
        party,
        netBalance, // Positive = Customer owes us (Receivable), Negative = We owe supplier (Payable)
        totalSales,
        totalPurchases,
        totalPaymentIn,
        totalPaymentOut,
        totalCreditNotes,
        totalSalesReturns,
        lastTxnDate
      };
    });
  }, [db.parties, db.invoices, db.purchases, db.payments, db.creditNotes, db.salesReturns]);

  // Global Financial Metrics
  const globalMetrics = useMemo(() => {
    let totalReceivables = 0;
    let totalPayables = 0;
    let overdueCount = 0;

    partyLedgerSummaries.forEach(s => {
      if (s.netBalance > 0) totalReceivables += s.netBalance;
      if (s.netBalance < 0) totalPayables += Math.abs(s.netBalance);
    });

    // Count overdue customer invoices
    const today = new Date().toISOString().substring(0, 10);
    db.invoices.forEach(inv => {
      if (inv.balanceDue > 0 && inv.dueDate < today && inv.status !== 'Cancelled') {
        overdueCount++;
      }
    });

    return {
      totalReceivables,
      totalPayables,
      totalParties: db.parties.length,
      overdueCount
    };
  }, [partyLedgerSummaries, db.invoices]);

  // Top widgets Data Lists
  const topCustomers = useMemo(() => {
    return [...partyLedgerSummaries]
      .filter(s => s.party.type !== 'Supplier' && s.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance)
      .slice(0, 5);
  }, [partyLedgerSummaries]);

  const topSuppliers = useMemo(() => {
    return [...partyLedgerSummaries]
      .filter(s => s.party.type !== 'Customer' && s.netBalance < 0)
      .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
      .slice(0, 5);
  }, [partyLedgerSummaries]);

  const recentParties = useMemo(() => {
    return [...partyLedgerSummaries]
      .sort((a, b) => b.lastTxnDate.localeCompare(a.lastTxnDate))
      .slice(0, 5);
  }, [partyLedgerSummaries]);

  // Search & Filtered Parties
  const filteredSummaries = useMemo(() => {
    return partyLedgerSummaries.filter(item => {
      const p = item.party;

      // Status filter
      if (statusFilter === 'Active' && !p.isActive) return false;
      if (statusFilter === 'Inactive' && p.isActive) return false;

      // Type filter
      if (typeFilter !== 'All' && p.type !== typeFilter) return false;

      // Balance filter
      if (balanceFilter === 'Outstanding Only' && item.netBalance === 0) return false;
      if (balanceFilter === 'Zero Balance' && item.netBalance !== 0) return false;
      if (balanceFilter === 'Negative Balance' && item.netBalance >= 0) return false;

      // Widget Filter
      if (selectedWidget === 'top_customers' && (p.type === 'Supplier' || item.netBalance <= 0)) return false;
      if (selectedWidget === 'top_suppliers' && (p.type === 'Customer' || item.netBalance >= 0)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCompany = p.companyName?.toLowerCase().includes(query);
        const matchesPhone = p.phone?.toLowerCase().includes(query);
        const matchesGst = p.gstNumber?.toLowerCase().includes(query);
        const matchesCity = p.billingCity?.toLowerCase().includes(query);
        const matchesCode = p.code?.toLowerCase().includes(query);

        // Check if query matches any invoice reference number for this party
        const matchesInvoice = db.invoices.some(inv => inv.partyId === p.id && inv.invoiceNumber.toLowerCase().includes(query));

        if (!matchesName && !matchesCompany && !matchesPhone && !matchesGst && !matchesCity && !matchesCode && !matchesInvoice) {
          return false;
        }
      }

      return true;
    });
  }, [partyLedgerSummaries, statusFilter, typeFilter, balanceFilter, selectedWidget, searchQuery, db.invoices]);

  // Quick Direct Print
  const handleQuickPrintLedger = (partySummary: any) => {
    const p = partySummary.party;
    const reportData = {
      partyName: p.name,
      partyPhone: p.phone,
      partyGst: p.gstNumber || 'Unregistered',
      partyAddress: p.billingAddress,
      ledgerMode: p.type === 'Supplier' ? 'Supplier' : 'Customer',
      dateRange: 'Full History',
      openingBalance: p.openingBalance,
      columns: ['Date', 'Reference', 'Type', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'],
      rows: [],
      totals: ['Total', '', '', `Summary Ledger`, partySummary.totalSales, partySummary.totalPurchases, partySummary.netBalance],
      closingBalance: partySummary.netBalance
    };

    setPrintingDoc({ party: p, reportData });
  };

  // Export Directory CSV
  const handleExportDirectoryCSV = () => {
    const headers = ['Party Code', 'Party Name', 'Type', 'Mobile', 'GST Number', 'Outstanding Balance', 'Credit Limit', 'Last Transaction'];
    const rows = filteredSummaries.map(s => [
      s.party.code,
      s.party.name,
      s.party.type,
      s.party.phone || '',
      s.party.gstNumber || '',
      s.netBalance,
      s.party.creditLimit || 0,
      s.lastTxnDate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Party_Directory_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If a party is selected, render the full detailed PartyLedgerView
  if (selectedPartyForLedger) {
    return (
      <div className="space-y-4">
        {/* Quick Top Switcher Banner */}
        <div className="bg-[#102A43] text-white p-3 rounded-xl flex items-center justify-between border border-[#173F63] shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedPartyForLedger(null)}
              className="bg-[#173F63] hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>← Back to Party Directory</span>
            </button>
            <span className="text-slate-400 text-xs hidden sm:inline">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-300 font-bold">Active Party:</span>
              <span className="text-xs font-extrabold text-white">{selectedPartyForLedger.name}</span>
            </div>
          </div>

          {/* Switch Party Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-300 font-medium hidden md:inline">Switch Party:</span>
            <select
              value={selectedPartyForLedger.id}
              onChange={(e) => {
                const p = db.parties.find(x => x.id === e.target.value);
                if (p) setSelectedPartyForLedger(p);
              }}
              className="bg-[#173F63] text-white text-xs font-bold rounded-lg px-2.5 py-1 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-400"
            >
              {db.parties.map(p => (
                <option key={p.id} value={p.id} className="bg-[#102A43] text-white">
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Party Ledger View */}
        <PartyLedgerView
          party={selectedPartyForLedger}
          onBack={() => setSelectedPartyForLedger(null)}
          db={db}
          isAdmin={isAdmin}
          onUpdateParty={onUpdateParty}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="party_ledger_home_root">
      {/* 1. MODULE TITLE & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#2563EB]">ERP & Ledger Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Instant Statement Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            <span>⭐ Party Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Instantly search, view, print, and share account statements for any customer or supplier in seconds.
          </p>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportDirectoryCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            title="Export Party Directory"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span className="hidden sm:inline">Export Directory</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE FINANCIAL WIDGET CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedWidget(selectedWidget === 'top_customers' ? 'all' : 'top_customers')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            selectedWidget === 'top_customers' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customer Receivables</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-[#163A5F] font-mono mt-2">
            ₹{globalMetrics.totalReceivables.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Receivable Accounts</span>
            <span className="font-bold text-blue-600">{topCustomers.length} Active</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedWidget(selectedWidget === 'top_suppliers' ? 'all' : 'top_suppliers')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            selectedWidget === 'top_suppliers' ? 'border-amber-600 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Supplier Payables</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-rose-700 font-mono mt-2">
            ₹{globalMetrics.totalPayables.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Payable Accounts</span>
            <span className="font-bold text-amber-600">{topSuppliers.length} Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Parties</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-slate-800 font-mono mt-2">
            {globalMetrics.totalParties}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Directory Health</span>
            <span className="font-bold text-indigo-600">100% Live</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Customer Invoices</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 font-mono mt-2">
            {globalMetrics.overdueCount}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Requires Follow-up</span>
            <span className="font-bold text-rose-600">Action Needed</span>
          </div>
        </div>
      </div>

      {/* 3. QUICK LEDGER WIDGET GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Outstanding Customers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Top Outstanding Customers</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Highest Due</span>
          </div>

          <div className="divide-y divide-slate-100 mt-1">
            {topCustomers.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400 italic">No customer outstanding balances.</p>
            ) : (
              topCustomers.map(item => (
                <div key={item.party.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.party.name}</p>
                    <p className="text-[10px] text-slate-500">{item.party.phone || 'No Phone'} • {item.party.billingCity || 'City N/A'}</p>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="text-xs font-black text-rose-600 font-mono">₹{item.netBalance.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">Due</p>
                    </div>
                    <button
                      onClick={() => setSelectedPartyForLedger(item.party)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Open Ledger
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Suppliers Payable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Top Payable Suppliers</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Highest Payable</span>
          </div>

          <div className="divide-y divide-slate-100 mt-1">
            {topSuppliers.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400 italic">No supplier payables recorded.</p>
            ) : (
              topSuppliers.map(item => (
                <div key={item.party.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.party.name}</p>
                    <p className="text-[10px] text-slate-500">{item.party.phone || 'No Phone'} • GST: {item.party.gstNumber || 'N/A'}</p>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="text-xs font-black text-amber-700 font-mono">₹{Math.abs(item.netBalance).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">Payable</p>
                    </div>
                    <button
                      onClick={() => setSelectedPartyForLedger(item.party)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Open Ledger
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Instant Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party by Name, Phone, GSTIN, Invoice #, City, Reference..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types (Customers & Suppliers)</option>
              <option value="Customer">Customers Only</option>
              <option value="Supplier">Suppliers Only</option>
              <option value="Both">Dual Roles (Both)</option>
            </select>

            {/* Balance Filter */}
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Balances</option>
              <option value="Outstanding Only">Outstanding Only (&gt; 0)</option>
              <option value="Zero Balance">Zero Balance (Settled)</option>
              <option value="Negative Balance">Credit / Payable (&lt; 0)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active Accounts</option>
              <option value="Inactive">Inactive Accounts</option>
              <option value="All">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. PARTY DIRECTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Party Directory & Ledger Accounts</h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredSummaries.length} Parties
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Click any row or 'Open Ledger' to view live transactions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Mobile & City</th>
                <th className="py-3 px-3">GSTIN</th>
                <th className="py-3 px-3 text-right">Current Outstanding</th>
                <th className="py-3 px-3 text-right">Credit Limit</th>
                <th className="py-3 px-3">Last Activity</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No matching parties found for search criteria.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map(item => {
                  const p = item.party;
                  const isCustomer = p.type === 'Customer' || p.type === 'Both';
                  const isReceivable = item.netBalance > 0;
                  const isPayable = item.netBalance < 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={(e) => {
                        // Don't trigger if clicked inside action buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        setSelectedPartyForLedger(p);
                      }}
                    >
                      {/* Party Name & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </div>
                        {p.companyName && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building size={10} />
                            <span>{p.companyName}</span>
                          </div>
                        )}
                        <span className="text-[9px] font-mono text-slate-400">Code: {p.code}</span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.type === 'Customer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          p.type === 'Supplier' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {p.type}
                        </span>
                      </td>

                      {/* Contact & City */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-slate-800 font-medium">{p.phone || '—'}</div>
                        <div className="text-[10px] text-slate-400">{p.billingCity || 'City N/A'}</div>
                      </td>

                      {/* GSTIN */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {p.gstNumber || <span className="text-slate-300 italic">Unregistered</span>}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3.5 px-3 text-right">
                        <div className={`font-mono font-black text-sm ${
                          isReceivable ? 'text-rose-600' :
                          isPayable ? 'text-emerald-600' :
                          'text-slate-500'
                        }`}>
                          ₹{Math.abs(item.netBalance).toLocaleString()}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {isReceivable ? 'Dr (Due from Party)' : isPayable ? 'Cr (Payable to Party)' : 'Settled'}
                        </span>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        {p.creditLimit ? `₹${p.creditLimit.toLocaleString()}` : '—'}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                        {item.lastTxnDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} title={p.isActive ? 'Active' : 'Inactive'} />
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedPartyForLedger(p)}
                            className="bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                            title="Open Full Account Ledger"
                          >
                            Open Ledger
                          </button>
                          <button
                            onClick={() => setStatementParty(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Generate Account Statement"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => handleQuickPrintLedger(item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Quick Print Statement"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement Generation Dialog */}
      {statementParty && (
        <StatementGenerationDialog
          party={statementParty}
          db={db}
          isOpen={!!statementParty}
          onClose={() => setStatementParty(null)}
        />
      )}

      {/* Quick Print Document Modal */}
      {printingDoc && (
        <DocumentPrintView
          isOpen={!!printingDoc}
          onClose={() => setPrintingDoc(null)}
          data={printingDoc.reportData}
          documentType="party_ledger"
          settings={db.settings}
        />
      )}
    </div>
  );
}
