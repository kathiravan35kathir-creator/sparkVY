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
  BookOpen
} from 'lucide-react';
import { Expense, Payment, Party, PaymentMethod } from '../types';

interface FinanceViewProps {
  expenses: Expense[];
  payments: Payment[];
  parties: Party[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => void;
  onApproveExpense: (id: string) => void;
  isAdmin: boolean;
  initialTab?: 'accounts' | 'expenses' | 'payments';
}

export default function FinanceView({
  expenses,
  payments,
  parties,
  onAddExpense,
  onApproveExpense,
  isAdmin,
  initialTab
}: FinanceViewProps) {
  const [activeFinanceTab, setActiveFinanceTab] = useState<'accounts' | 'expenses' | 'payments'>(initialTab || 'accounts');

  React.useEffect(() => {
    if (initialTab) {
      setActiveFinanceTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpenseCategory, setFilterExpenseCategory] = useState<string>('All');

  // New Expense state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [expenseDate, setExpenseDate] = useState('2026-07-14');
  const [category, setCategory] = useState('Lab Consumables');
  const [amount, setAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [linkedAccountId, setLinkedAccountId] = useState('acc-3'); // UPI standard
  const [description, setDescription] = useState('');

  // Auto-calculated Cash & Bank reserves based on payments (Inflow vs Outflow)
  // Petty Cash (acc-1): Starts at 15000 in demo
  const cashReserve = payments
    .filter((p) => p.accountId === 'acc-1')
    .reduce((sum, p) => (p.paymentType === 'Payment In' ? sum + p.amount : sum - p.amount), 15000);

  // ICICI Bank (acc-2): Starts at 450000 in demo
  const iciciReserve = payments
    .filter((p) => p.accountId === 'acc-2')
    .reduce((sum, p) => (p.paymentType === 'Payment In' ? sum + p.amount : sum - p.amount), 450000);

  // HDFC UPI (acc-3): Starts at 80000 in demo
  const hdfcReserve = payments
    .filter((p) => p.accountId === 'acc-3')
    .reduce((sum, p) => (p.paymentType === 'Payment In' ? sum + p.amount : sum - p.amount), 80000);

  const totalLiquidity = cashReserve + iciciReserve + hdfcReserve;

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
    return matchesSearch && matchesCategory;
  });

  const filteredPayments = payments.filter((p) => {
    return (
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.partyName && p.partyName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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
              Record Indirect Lab Expenditure Voucher
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add indirect expenses like salaries, electricity bills, rent, or consumable chemicals. Track and link to your active cash/bank drawers.
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
                  <option value="Lab Consumables">Lab Consumables (Filters, Tips)</option>
                  <option value="Salaries & Staff">Salaries & Staff Stipends</option>
                  <option value="Equipment Calibration">Equipment Calibration & repairs</option>
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
          <p className="text-xs text-slate-500 mt-1">Monitor real-time cash/bank registers, approve direct lab expenditures, and check GST input sheets.</p>
        </div>
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

      {/* FINANCE AREA TABS */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveFinanceTab('accounts')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeFinanceTab === 'accounts'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Cash & Bank Registers
          </button>
          <button
            onClick={() => setActiveFinanceTab('expenses')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeFinanceTab === 'expenses'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Indirect Lab Expenses
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

      {/* SECTION 1: DYNAMIC CASH & BANK RETAINERS DISPLAY */}
      {activeFinanceTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Liquidity */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Net Cash Reserves</span>
                <p className="text-2xl font-black font-mono mt-2">₹{totalLiquidity.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-teal-400 font-bold mt-4 flex items-center space-x-1">
                <span>● LIQUID CAPITAL SECURED</span>
              </p>
            </div>

            {/* ICICI Bank Current */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ICICI Bank Current</span>
                  <p className="text-xl font-black text-slate-900 font-mono mt-2">₹{iciciReserve.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                  <Building size={16} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-4">A/C: 104209123000 (ICICI-004)</p>
            </div>

            {/* HDFC UPI Merchant */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">HDFC QR UPI Merchant</span>
                  <p className="text-xl font-black text-slate-900 font-mono mt-2">₹{hdfcReserve.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 text-purple-700 p-2 rounded-lg">
                  <CreditCard size={16} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-4">UPI: labbiz@hdfcmerchant</p>
            </div>

            {/* Cash in Hand */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lab Business Petty Cash</span>
                  <p className="text-xl font-black text-slate-900 font-mono mt-2">₹{cashReserve.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-4">Locked Drawer No. 1 Reserves</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 leading-relaxed gap-3">
            <div className="flex items-center space-x-2.5">
              <BookOpen size={16} className="text-[#2563EB]" />
              <span>Real-time Labbiz sync monitors all client invoice collections (debits) and vendor reagent chemical outlays (credits).</span>
            </div>
            <button
              onClick={() => setActiveFinanceTab('payments')}
              className="text-xs font-bold text-blue-600 hover:underline shrink-0"
            >
              Audit capital cash trails &rarr;
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: INDIRECT EXPENSES MANAGEMENT */}
      {activeFinanceTab === 'expenses' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search indirect expenses by vendor name, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-bold">Category</span>
              <select
                value={filterExpenseCategory}
                onChange={(e) => setFilterExpenseCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Lab Consumables">Lab Consumables</option>
                <option value="Salaries & Staff">Salaries & Staff</option>
                <option value="Equipment Calibration">Equipment Calibration</option>
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions ledger by UTR, reference invoice, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
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

    </div>
  );
}
