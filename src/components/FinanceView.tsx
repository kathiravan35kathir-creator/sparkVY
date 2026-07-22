import React, { useState } from 'react';
import {
  Search,
  Plus,
  DollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Download,
  CheckCircle,
  FileText,
  CreditCard,
  Building,
  User,
  BookOpen,
  Calendar,
  Printer
} from 'lucide-react';
import { Expense, Payment, Party, PaymentMethod, AppSettings } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface FinanceViewProps {
  expenses: Expense[];
  payments: Payment[];
  parties: Party[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => void;
  onApproveExpense: (id: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
  initialTab?: 'expenses' | 'payments';
  onCheckPin?: (action: string, onConfirm: () => void) => void;
  onLogCommunication?: (log: any) => void;
}

export default function FinanceView({
  expenses,
  payments,
  parties,
  onAddExpense,
  onApproveExpense,
  isAdmin,
  settings,
  initialTab,
  onCheckPin,
  onLogCommunication
}: FinanceViewProps) {
  const [activeFinanceTab, setActiveFinanceTab] = useState<'expenses' | 'payments'>(initialTab || 'expenses');

  React.useEffect(() => {
    if (initialTab) {
      setActiveFinanceTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterExpenseCategory, setFilterExpenseCategory] = useState<string>('All');

  // New Expense state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [expenseDate, setExpenseDate] = useState('2026-07-14');
  const [category, setCategory] = useState('Office Consumables');
  const [amount, setAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [linkedAccountId, setLinkedAccountId] = useState('acc-3'); // UPI standard
  const [description, setDescription] = useState('');

  // Auto-calculated Cash & Bank reserves removed

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || amount <= 0) {
      alert('Please fill in Vendor Name and positive Amount.');
      return;
    }

    onAddExpense({
      vendorName,
      expenseDate,
      category,
      amount: Number(amount),
      taxAmount: Number(taxAmount),
      paymentMethod,
      accountId: linkedAccountId,
      accountName: linkedAccountId === 'acc-1' ? 'Petty Cash Drawer' : linkedAccountId === 'acc-2' ? 'ICICI Current' : 'UPI HDFC',
      description,
      isRecurring: false
    });

    setIsAddingExpense(false);
    // Reset Form
    setVendorName('');
    setAmount(0);
    setTaxAmount(0);
    setDescription('');
  };

  // Filter core lists
  const filteredExpenses = expenses.filter((ex) => {
    const matchesSearch =
      (ex.vendorName && ex.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterExpenseCategory === 'All' || ex.category === filterExpenseCategory;
    const matchesDate = (!startDate || ex.expenseDate >= startDate) && (!endDate || ex.expenseDate <= endDate);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.partyName && p.partyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = (!startDate || p.paymentDate >= startDate) && (!endDate || p.paymentDate <= endDate);
    return matchesSearch && matchesDate;
  });

  if (isAddingExpense) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Finance</span>
              <span className="text-slate-300">/</span>
              <span>Expenses</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">Record Expense</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Record Indirect Business Expenditure Voucher
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add indirect expenses like salaries, electricity bills, rent, or consumable supplies. Track and link to your active cash/bank drawers.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsAddingExpense(false); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Finance Dashboard
            </button>
          </div>
        </div>

        {/* Full-width Form Layout */}
        <form onSubmit={handleSaveExpense} className="space-y-8 pb-20 font-sans">
          
          {/* SECTION 1: Expense Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Voucher Specification</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Paid To / Payee Vendor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore Power Supply (BESCOM)"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Expense Voucher Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono font-semibold"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Expenditure Category Class <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Office Consumables">Office Consumables</option>
                  <option value="Salaries & Staff">Salaries & Staff Stipends</option>
                  <option value="Infrastructure Maintenance">Infrastructure maintenance & repairs</option>
                  <option value="Utilities / Electricity">Utilities / Electricity & Water bills</option>
                  <option value="Rent / Maintenance">Rent / Maintenance of premises</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Financial & Bookkeeping linkages */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Financial Accounting Links</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Expense Subtotal Amount (INR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono text-[#D97706]"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tax Amount (GST included)</label>
                <input
                  type="number"
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Deduct Balance From Account <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold text-slate-700"
                  value={linkedAccountId}
                  onChange={(e) => setLinkedAccountId(e.target.value)}
                >
                  <option value="acc-1">Petty Cash Drawer No. 1</option>
                  <option value="acc-2">ICICI Bank Current Account</option>
                  <option value="acc-3">HDFC QR UPI Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Payment Mode</label>
                <select
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="UPI">UPI / QR Transfer</option>
                  <option value="Net Banking">Net Banking NEFT/RTGS</option>
                  <option value="Cash">Cash Currency</option>
                  <option value="Card">Corporate Debit/Credit Card</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Expenditure Description / Voucher Memo Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared electricity utilities bill of June 2026 reference #BESCOM-4924"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions Sticky bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-6 flex items-center justify-between z-40">
            <button
              type="button"
              onClick={() => { setIsAddingExpense(false); }}
              className="px-4 py-2 border border-[#D8E0EA] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Discard
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
            >
              Finalize Expense Voucher
            </button>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Finance, Books & Accounts Ledgers</h2>
          <p className="text-xs text-slate-500 mt-1">Monitor real-time cash/bank registers, approve direct business expenditures, and check GST input sheets.</p>
        </div>
        <div className="flex items-center space-x-2">
          {(activeFinanceTab === 'expenses' || activeFinanceTab === 'payments') && (
            <button
              onClick={() => setIsBulkPrinting(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-50 transition"
            >
              <Printer size={13} />
              <span>Print All</span>
            </button>
          )}
          {activeFinanceTab === 'expenses' && isAdmin && (
            <button
              onClick={() => setIsAddingExpense(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus size={14} />
              <span>Record Business Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* FINANCE AREA TABS */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveFinanceTab('expenses')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeFinanceTab === 'expenses'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Indirect Business Expenses
          </button>
          <button
            onClick={() => setActiveFinanceTab('payments')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeFinanceTab === 'payments'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Consolidated Ledger Cash Flow
          </button>
        </nav>
      </div>

      {/* SECTION 2: INDIRECT EXPENSES MANAGEMENT */}
      {activeFinanceTab === 'expenses' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-3">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-100 pl-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-bold">Category</span>
              <select
                value={filterExpenseCategory}
                onChange={(e) => setFilterExpenseCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Office Consumables">Office Consumables</option>
                <option value="Salaries & Staff">Salaries & Staff</option>
                <option value="Infrastructure Maintenance">Infrastructure Maintenance</option>
                <option value="Utilities / Electricity">Utilities / Electricity</option>
                <option value="Rent / Maintenance">Rent / Maintenance</option>
              </select>
            </div>
          </div>

          {/* Table display */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Expense Date</th>
                    <th className="py-3 px-4">Payee / Vendor</th>
                    <th className="py-3 px-4">Cost Category</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Tax (GST)</th>
                    <th className="py-3 px-4 text-right">Total Outflow</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No indirect cost expenses recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{ex.expenseDate}</td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-800">{ex.vendorName || 'General Payee'}</p>
                            {ex.description && <p className="text-[10px] text-slate-400 mt-0.5">{ex.description}</p>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-sm">
                            {ex.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{ex.paymentMethod}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          {ex.taxAmount > 0 ? `₹${ex.taxAmount}` : 'Exempted'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          ₹{ex.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Approved & Posted
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONSOLIDATED GENERAL LEDGER TIMELINE */}
      {activeFinanceTab === 'payments' && (
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-100 pl-3">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Consolidated list table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction Date</th>
                    <th className="py-3 px-4">Ref Number / UTR</th>
                    <th className="py-3 px-4">Account Ledger</th>
                    <th className="py-3 px-4">Ledger Remarks</th>
                    <th className="py-3 px-4 text-right">Inflow Amount</th>
                    <th className="py-3 px-4 text-right">Outflow Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No financial payments logged inside search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{p.paymentDate}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.referenceNumber || p.paymentNumber}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-600">{p.accountName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <div>
                            <p>{p.notes}</p>
                            {p.partyName && <p className="text-[10px] text-slate-400 font-bold mt-0.5">Partner: {p.partyName}</p>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {p.paymentType === 'Payment In' ? `+ ₹${p.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          {p.paymentType === 'Payment Out' ? `- ₹${p.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isBulkPrinting && (
        <DocumentPrintView
          documentType="transaction_list"
          data={activeFinanceTab === 'expenses' ? {
            title: 'Business Expenditure Register',
            dateRange: `${startDate || 'Start'} to ${endDate || 'End'}`,
            columns: ['Date', 'Vendor', 'Category', 'Method', 'Tax', 'Amount'],
            rows: filteredExpenses.map(ex => [
              ex.expenseDate,
              ex.vendorName,
              ex.category,
              ex.paymentMethod,
              ex.taxAmount,
              ex.amount
            ]),
            totals: [
              '',
              'TOTAL',
              '',
              '',
              filteredExpenses.reduce((sum, ex) => sum + ex.taxAmount, 0),
              filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0)
            ]
          } : {
            title: 'Consolidated Payment Ledger',
            dateRange: `${startDate || 'Start'} to ${endDate || 'End'}`,
            columns: ['Date', 'Reference', 'Account', 'Inflow (+)', 'Outflow (-)'],
            rows: filteredPayments.map(p => [
              p.paymentDate,
              p.referenceNumber || p.paymentNumber,
              p.accountName,
              p.paymentType === 'Payment In' ? p.amount : '-',
              p.paymentType === 'Payment Out' ? p.amount : '-'
            ]),
            totals: [
              '',
              'NET FLOW',
              '',
              filteredPayments.reduce((sum, p) => p.paymentType === 'Payment In' ? sum + p.amount : sum, 0),
              filteredPayments.reduce((sum, p) => p.paymentType === 'Payment Out' ? sum + p.amount : sum, 0)
            ]
          }}
          settings={settings}
          onClose={() => setIsBulkPrinting(false)}
          onCheckPin={onCheckPin}
          onLogCommunication={onLogCommunication}
        />
      )}
    </div>
  );
}
