import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  ChevronRight,
  CreditCard,
  History,
  Lock,
  Wallet,
  Calendar,
  User,
  DollarSign,
  FileText,
  X
} from 'lucide-react';
import { Payment, Party, AppSettings, PaymentMethod, PaymentType } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface PaymentsViewProps {
  payments: Payment[];
  parties: Party[];
  type: PaymentType;
  onAddPayment: (payment: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function PaymentsView({
  payments,
  parties,
  type,
  onAddPayment,
  isAdmin,
  settings
}: PaymentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [accountId, setAccountId] = useState('acc-1');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const filteredParties = type === 'Payment In' 
    ? parties.filter(p => p.type === 'Customer' || p.type === 'Both')
    : parties.filter(p => p.type === 'Supplier' || p.type === 'Both');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Enter a positive amount');
    
    const selectedParty = parties.find(p => p.id === partyId);
    const accountName = accountId === 'acc-1' ? 'Petty Cash' : accountId === 'acc-2' ? 'ICICI Bank' : 'HDFC Bank';

    onAddPayment({
      paymentType: type,
      partyId: partyId || undefined,
      partyName: selectedParty?.name,
      amount,
      paymentDate,
      paymentMethod,
      accountId,
      accountName,
      referenceNumber,
      notes,
      allocations: [] // Generic payments might not have direct allocations initially
    });

    setIsCreating(false);
    setAmount(0);
    setPartyId('');
    setNotes('');
  };

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find(party => party.id === p.partyId);
    const matchesType = p.paymentType === type;
    const matchesSearch =
      !q ||
      (p.paymentNumber && p.paymentNumber.toLowerCase().includes(q)) ||
      (p.partyName && p.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (party?.alternatePhone && party.alternatePhone.toLowerCase().includes(q)) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.accountName && p.accountName.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q));

    const matchesDate =
      (!startDate || p.paymentDate >= startDate) &&
      (!endDate || p.paymentDate <= endDate);

    return matchesType && matchesSearch && matchesDate;
  });

  if (isCreating) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Record {type === 'Payment In' ? 'Payment In / Receipt' : 'Payment Out / Voucher'}</h2>
            <p className="text-xs text-slate-500">Record {type === 'Payment In' ? 'money received from customers or other sources' : 'money paid to suppliers or for other purposes'}.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Party (Optional for other {type === 'Payment In' ? 'income' : 'expenses'})</label>
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="w-full border-2 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all">
                <option value="">-- Generic / Other --</option>
                {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name} {p.companyName ? `(${p.companyName})` : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Amount (₹) *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" required min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border-2 rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-slate-900 focus:border-blue-500 outline-none transition-all" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Date *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full border-2 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Method *</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full border-2 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="Bank transfer">Bank Transfer / NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{type === 'Payment In' ? 'Deposit To Account' : 'Pay From Account'} *</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border-2 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all">
                <option value="acc-1">Business Petty Cash</option>
                <option value="acc-2">ICICI Bank Current A/c</option>
                <option value="acc-3">HDFC Merchant UPI</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Reference / Transaction No.</label>
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full border-2 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" placeholder="UTR, Check No, UPI Ref..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Notes / Remarks</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border-2 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" placeholder="Purpose of payment..." />
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${type === 'Payment In' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
              Post {type === 'Payment In' ? 'Receipt' : 'Payment'} Transaction
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {type === 'Payment In' ? <ArrowDownLeft size={20} className="text-emerald-600" /> : <ArrowUpRight size={20} className="text-rose-600" />}
            {type === 'Payment In' ? 'Payment In (Receipts)' : 'Payment Out (Vouchers)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {type === 'Payment In' ? 'Track all money coming into your business accounts.' : 'Track all outgoing payments to vendors and utilities.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkPrinting(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-50 transition"
          >
            <Printer size={14} />
            <span>Print All</span>
          </button>
          <button onClick={() => setIsCreating(true)} className={`flex items-center space-x-1.5 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition ${type === 'Payment In' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
            <Plus size={14} />
            <span>New {type === 'Payment In' ? 'Receipt' : 'Payment'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 shadow-sm items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Payment #, Invoice #, Party, Method, Account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg shrink-0">
            {filteredPayments.length} Matching
          </span>
        )}

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

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">Voucher No.</th>
              <th className="p-4">Party / Source</th>
              <th className="p-4">Date</th>
              <th className="p-4">Method</th>
              <th className="p-4">Account</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filteredPayments.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-medium">No matching records found.</td></tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                  <td className="p-4 font-bold">{p.partyName || 'Generic'}</td>
                  <td className="p-4 font-mono text-slate-500">{p.paymentDate}</td>
                  <td className="p-4 text-slate-600 font-medium">{p.paymentMethod}</td>
                  <td className="p-4 text-slate-500">{p.accountName}</td>
                  <td className={`p-4 text-right font-black text-sm ${type === 'Payment In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{p.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setViewingPayment(p)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Print Receipt"><Printer size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isBulkPrinting && (
        <DocumentPrintView
          documentType="transaction_list"
          data={{
            title: `Payment ${type === 'Payment In' ? 'Receipt' : 'Voucher'} Register`,
            dateRange: `${startDate || 'Start'} to ${endDate || 'End'}`,
            columns: ['Date', 'Voucher #', 'Party', 'Method', 'Account', 'Amount'],
            rows: filteredPayments.map(p => [
              p.paymentDate,
              p.paymentNumber,
              p.partyName || 'Generic',
              p.paymentMethod,
              p.accountName,
              p.amount
            ]),
            totals: [
              '',
              'TOTAL',
              '',
              '',
              '',
              filteredPayments.reduce((sum, p) => sum + p.amount, 0)
            ]
          }}
          settings={settings}
          onClose={() => setIsBulkPrinting(false)}
        />
      )}

      {viewingPayment && (
        <DocumentPrintView
          documentType={type === 'Payment In' ? 'payment_receipt' : 'payment_voucher'}
          data={viewingPayment}
          settings={settings}
          onClose={() => setViewingPayment(null)}
        />
      )}
    </div>
  );
}
