import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  CreditCard,
  Download,
  Copy,
  PlusCircle,
  Bookmark,
  ChevronRight,
  User,
  History,
  Lock,
  DollarSign,
  Calendar,
  Trash2,
  X
} from 'lucide-react';
import { Invoice, Party, Item, InvoiceStatus, InvoiceLineItem, PaymentMethod, AppSettings } from '../types';
import DocumentPrintView from './DocumentPrintView';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';

interface SalesViewProps {
  invoices: Invoice[];
  parties: Party[];
  items: Item[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'isLocked' | 'createdAt' | 'updatedAt'>) => void;
  onFinaliseInvoice: (id: string) => void;
  onRecordPayment: (invoiceId: string, amount: number, method: PaymentMethod, accountId: string, notes?: string) => void;
  onCancelInvoice: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
  onCheckPin?: (action: string, onConfirm: () => void) => void;
  onLogCommunication?: (log: any) => void;
}

export default function SalesView({
  invoices,
  parties,
  items,
  onAddInvoice,
  onFinaliseInvoice,
  onRecordPayment,
  onCancelInvoice,
  onDeleteInvoice,
  isAdmin,
  settings,
  onCheckPin,
  onLogCommunication
}: SalesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active view toggles
  const [isCreating, setIsCreating] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-07-14');
  const [dueDate, setDueDate] = useState('2026-07-29');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [notes, setNotes] = useState('Taxes applied under CGST @ 9% & SGST @ 9% local state schedules.');
  const [terms, setTerms] = useState('1. Goods once tested cannot be returned.\n2. Balance due within 15 days of reporting.');

  // Payment Modal Fields
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payAccount, setPayAccount] = useState('acc-3'); // default HDFC UPI
  const [payNotes, setPayNotes] = useState('');

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<{
    itemId: string;
    quantity: number;
    rate: number;
    discountPercent: number;
    taxPercent: number;
  }[]>([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);

  const handleOpenDuplicate = (inv: Invoice) => {
    setPartyId(inv.partyId);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setAdditionalCharges(inv.additionalCharges);
    setNotes(inv.notes || '');
    setTerms(inv.terms || '');
    setLineItems(inv.items.map(it => ({
      itemId: it.itemId,
      quantity: it.quantity,
      rate: it.rate,
      discountPercent: it.discountPercent,
      taxPercent: it.taxPercent
    })));
    setIsCreating(true);
  };

  const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate rate & tax
    if (field === 'itemId') {
      const selectedItem = items.find((it) => it.id === value);
      if (selectedItem) {
        updated[index].rate = selectedItem.sellingPrice;
        updated[index].taxPercent = selectedItem.taxRate;
      }
    }
    setLineItems(updated);
  };

  const handleAddLineRow = () => {
    setLineItems([...lineItems, { itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);
  };

  const handleRemoveLineRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Math totals calculation
  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const mappedItems: InvoiceLineItem[] = lineItems
      .filter((line) => line.itemId !== '')
      .map((line, idx) => {
        const itemObj = items.find((it) => it.id === line.itemId)!;
        const qty = toSafeNumber(line.quantity);
        const rate = toSafeNumber(line.rate);
        const discPct = toSafeNumber(line.discountPercent);
        const taxPct = toSafeNumber(line.taxPercent);

        const baseAmount = qty * rate;
        const discVal = baseAmount * (discPct / 100);
        const netBase = baseAmount - discVal;
        const taxVal = netBase * (taxPct / 100);
        const finalAmount = netBase + taxVal;

        subtotal += baseAmount;
        discountAmount += discVal;
        taxAmount += taxVal;

        return {
          id: `invi-${Date.now()}-${idx}`,
          itemId: line.itemId,
          itemName: itemObj.name,
          itemCode: itemObj.code,
          quantity: qty,
          rate: rate,
          discountPercent: discPct,
          taxPercent: taxPct,
          taxAmount: parseFloat(taxVal.toFixed(2)),
          amount: parseFloat(finalAmount.toFixed(2))
        };
      });

    const grandTotal = subtotal - discountAmount + taxAmount + toSafeNumber(additionalCharges);

    return {
      items: mappedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      alert('Please select a client Customer.');
      return;
    }
    const selectedParty = parties.find((p) => p.id === partyId)!;
    const { items: mappedItems, subtotal, discountAmount, taxAmount, total } = calculateTotals();

    if (mappedItems.length === 0) {
      alert('Please select at least one item row to bill.');
      return;
    }

    onAddInvoice({
      partyId,
      partyName: selectedParty.name,
      invoiceDate,
      dueDate,
      items: mappedItems,
      subtotal,
      discountAmount,
      taxAmount,
      additionalCharges: Number(additionalCharges),
      roundOff: 0,
      total,
      amountPaid: 0, // Recorded via payment allocation after creation
      balanceDue: total,
      status: 'Unpaid',
      notes,
      terms
    });

    setIsCreating(false);
    // Reset fields
    setPartyId('');
    setLineItems([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);
    setAdditionalCharges(0);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    if (payAmount <= 0) {
      alert('Please enter a positive payment amount.');
      return;
    }
    if (payAmount > payingInvoice.balanceDue) {
      alert(`Payment amount (₹${payAmount}) cannot exceed remaining balance due (₹${payingInvoice.balanceDue})`);
      return;
    }

    onRecordPayment(payingInvoice.id, payAmount, payMethod, payAccount, payNotes);
    setPayingInvoice(null);
    setPayAmount(0);
    setPayNotes('');
  };

  // Filter core list
  const filteredInvoices = invoices.filter((i) => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find(p => p.id === i.partyId);
    const matchesSearch =
      !q ||
      (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
      (i.partyName && i.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (party?.alternatePhone && party.alternatePhone.toLowerCase().includes(q)) ||
      (i.relatedQuotationNumber && i.relatedQuotationNumber.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q)) ||
      (i.id && i.id.toLowerCase().includes(q)) ||
      (i.items && i.items.some(it => it.itemName.toLowerCase().includes(q) || it.itemCode.toLowerCase().includes(q)));
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    const matchesDate = (!startDate || i.invoiceDate >= startDate) && (!endDate || i.invoiceDate <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (isCreating) {
    const totals = calculateTotals();
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Sales</span>
              <span className="text-slate-300">/</span>
              <span>Invoices</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">Generate Invoice</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Generate Sales Tax Invoice / Bill
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add products or professional services, configure discount rates, add transport charges, and generate standard tax ledger mappings.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsCreating(false); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Sales Invoices
            </button>
          </div>
        </div>

        {/* Full-width Form Layout */}
        <form onSubmit={handleSaveInvoice} className="space-y-8 pb-20 font-sans">
          
          {/* SECTION 1: Customer Billing & Dates */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Billing Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Customer / Client Party <span className="text-red-500">*</span></label>
                <select
                  required
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                >
                  <option value="">-- Select Client Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Invoice Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono font-semibold"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Due Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono font-semibold"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Dynamic Items & Assay Grid */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Services & Consumables Table</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>

            <div className="border border-[#D8E0EA] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#D8E0EA] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-[40%]">Product or Service Spec</th>
                    <th className="py-3 px-3 text-center w-[12%]">Qty</th>
                    <th className="py-3 px-3 text-right w-[15%]">Unit Rate (₹)</th>
                    <th className="py-3 px-3 text-right w-[11%]">Disc %</th>
                    <th className="py-3 px-3 text-right w-[12%]">GST %</th>
                    <th className="py-3 px-4 text-center w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {lineItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <select
                          required
                          value={line.itemId}
                          onChange={(e) => handleLineItemChange(idx, 'itemId', e.target.value)}
                          className="w-full h-[36px] px-2 bg-white border border-[#D8E0EA] rounded text-xs text-slate-900 focus:outline-none font-bold"
                        >
                          <option value="">-- Choose Catalog Item --</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.code} - {it.name} [₹{it.sellingPrice}]
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-3">
                        <NumericInput
                          value={line.quantity}
                          onChange={(val) => handleLineItemChange(idx, 'quantity', val)}
                          allowDecimal={true}
                          decimalScale={3}
                          min={0}
                          className="w-full h-[36px] text-center bg-white border border-[#D8E0EA] rounded text-xs font-mono font-semibold"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <NumericInput
                          value={line.rate}
                          onChange={(val) => handleLineItemChange(idx, 'rate', val)}
                          allowDecimal={true}
                          decimalScale={2}
                          min={0}
                          className="w-full h-[36px] text-right bg-white border border-[#D8E0EA] rounded text-xs font-mono font-semibold"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <NumericInput
                          value={line.discountPercent}
                          onChange={(val) => handleLineItemChange(idx, 'discountPercent', val)}
                          allowDecimal={true}
                          decimalScale={2}
                          min={0}
                          max={100}
                          className="w-full h-[36px] text-right bg-white border border-[#D8E0EA] rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <select
                          value={line.taxPercent}
                          onChange={(e) => handleLineItemChange(idx, 'taxPercent', Number(e.target.value))}
                          className="w-full h-[36px] px-1 bg-white border border-[#D8E0EA] rounded text-xs font-mono"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineRow(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          disabled={lineItems.length === 1}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddLineRow}
              className="flex items-center space-x-1.5 px-4 py-2 border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 bg-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <PlusCircle size={14} className="text-blue-600" />
              <span>Add Another Item / Service Row</span>
            </button>
          </div>

          {/* SECTION 3: Additional Charges, Ledger Summaries, Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#E5EAF0]">
            {/* Left Column: Notes & Terms */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Invoice Memo Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D8E0EA] rounded-lg text-xs text-slate-800 focus:outline-none transition"
                  placeholder="Describe tax settings, service references, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Terms and Conditions</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D8E0EA] rounded-lg text-xs text-slate-800 focus:outline-none transition font-semibold"
                  placeholder="Default payment due rules, return or backup policies."
                />
              </div>
            </div>

            {/* Right Column: Calculations Breakdown */}
            <div className="lg:col-span-5 bg-slate-50 border border-[#D8E0EA] rounded-xl p-5 space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Ledger Summary</h4>
              <div className="h-px bg-slate-200" />
              
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal Amount:</span>
                <span className="font-mono text-slate-700">₹{totals.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Total Discount (-) :</span>
                <span className="font-mono text-slate-700">₹{totals.discountAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-mono text-slate-700">₹{totals.taxAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1.5">
                <span>Additional Transport / Courier Charges (₹):</span>
                <NumericInput
                  value={additionalCharges}
                  onChange={(val) => setAdditionalCharges(val)}
                  allowDecimal={true}
                  decimalScale={2}
                  min={0}
                  className="w-24 h-[32px] px-2 bg-white border border-[#D8E0EA] rounded text-right text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="h-px bg-slate-200 pt-1" />

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-black text-slate-900 uppercase">Grand Total Invoice Value:</span>
                <span className="text-xl font-black text-[#2563EB] font-mono">
                  ₹{(totals.subtotal - totals.discountAmount + totals.taxAmount + Number(additionalCharges)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions Sticky bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-6 flex items-center justify-between z-40">
            <button
              type="button"
              onClick={() => { setIsCreating(false); }}
              className="px-4 py-2 border border-[#D8E0EA] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Discard Bill
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
            >
              Finalize & Save Sales Bill
            </button>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: LIST / INVOICE BOOK */}
      {!isCreating && !printingInvoice && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Sales Register & Tax Invoices</h2>
              <p className="text-xs text-slate-500 mt-1">Generate GST invoices, accept partial payments, and manage corporate receivables.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBulkPrinting(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-50 transition"
              >
                <Printer size={14} />
                <span>Print All</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <Plus size={14} />
                  <span>Create Sales Invoice</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice by Invoice #, Customer, Mobile, Ref #, Items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
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
                {filteredInvoices.length} Matching
              </span>
            )}
            
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-3">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Clear Dates"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-100 pl-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Invoices</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4 text-right">Invoice Total</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {inv.isLocked && <Lock size={11} className="text-slate-400" title="Locked - Finalized" />}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-800">{inv.partyName}</p>
                            {inv.relatedSampleCode && (
                              <p className="text-[9px] font-mono text-indigo-600 mt-0.5">Sample: {inv.relatedSampleCode}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{inv.invoiceDate}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">
                          ₹{inv.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          ₹{inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600">
                          ₹{inv.balanceDue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            inv.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setPrintingInvoice(inv)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="Print Invoice PDF"
                            >
                              <Printer size={13} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenDuplicate(inv)}
                                className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                title="Duplicate Invoice (Save as New)"
                              >
                                <Copy size={13} />
                              </button>
                            )}

                            {isAdmin && inv.status !== 'Cancelled' && (
                              <>
                                {/* Finalise lock */}
                                {!inv.isLocked && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Lock & finalize invoice ${inv.invoiceNumber}? Editing will be restricted.`)) {
                                        onFinaliseInvoice(inv.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                    title="Lock Invoice"
                                  >
                                    <Lock size={13} />
                                  </button>
                                )}
                                {/* Collect Money */}
                                {inv.balanceDue > 0 && (
                                  <button
                                    onClick={() => {
                                      setPayingInvoice(inv);
                                      setPayAmount(inv.balanceDue);
                                    }}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded text-[10px] font-extrabold transition"
                                    title="Collect Payment In"
                                  >
                                    <DollarSign size={10} />
                                    <span>Record Pay In</span>
                                  </button>
                                )}
                                {/* Cancel */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Cancel invoice ${inv.invoiceNumber}? This will roll back the customer outstandings.`)) {
                                      onCancelInvoice(inv.id);
                                    }
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Cancel Invoice"
                                >
                                  <XCircle size={13} />
                                </button>
                              </>
                            )}

                            {isAdmin && onDeleteInvoice && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete Invoice ${inv.invoiceNumber}? This will soft-delete the record.`)) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                                title="Move to Trash"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}



      {/* SECTION 3: TAX INVOICE PRINT PREVIEW */}
      {printingInvoice && (
        <DocumentPrintView
          documentType="invoice"
          data={printingInvoice}
          settings={settings}
          onClose={() => setPrintingInvoice(null)}
          onCheckPin={onCheckPin}
          onLogCommunication={onLogCommunication}
        />
      )}

      {isBulkPrinting && (
        <DocumentPrintView
          documentType="transaction_list"
          data={{
            title: 'Sales Transaction Register',
            dateRange: `${startDate || 'Start'} to ${endDate || 'End'}`,
            columns: ['Date', 'Invoice #', 'Party', 'Total', 'Paid', 'Balance'],
            rows: filteredInvoices.map(inv => [
              inv.invoiceDate,
              inv.invoiceNumber,
              inv.partyName,
              inv.total,
              inv.amountPaid,
              inv.balanceDue
            ]),
            totals: [
              '',
              'TOTAL',
              '',
              filteredInvoices.reduce((sum, i) => sum + i.total, 0),
              filteredInvoices.reduce((sum, i) => sum + i.amountPaid, 0),
              filteredInvoices.reduce((sum, i) => sum + i.balanceDue, 0)
            ]
          }}
          settings={settings}
          onClose={() => setIsBulkPrinting(false)}
          onCheckPin={onCheckPin}
          onLogCommunication={onLogCommunication}
        />
      )}

      {/* RECORD PAYMENT MODAL DRAWER */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setPayingInvoice(null)} />
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wide">Record Payment Receipt</h4>
              <button onClick={() => setPayingInvoice(null)} className="text-white text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pending Balance</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">{payingInvoice.invoiceNumber}</span>
                </div>
                <span className="text-lg font-black text-rose-600 font-mono">₹{payingInvoice.balanceDue.toLocaleString()}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount In (INR) *</label>
                <NumericInput
                  value={payAmount}
                  onChange={(val) => setPayAmount(val)}
                  allowDecimal={true}
                  decimalScale={2}
                  min={0}
                  max={payingInvoice.balanceDue}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Channel Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                  <option value="Bank transfer">NEFT / Bank Transfer</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Cheque">Physical Cheque</option>
                  <option value="Card">POS Card terminal</option>
                </select>
              </div>

              {/* Ledger Account Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit to Account *</label>
                <select
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="acc-3">UPI HDFC Merchant QR (HDFC UPI)</option>
                  <option value="acc-2">ICICI Bank Current Account (Bank)</option>
                  <option value="acc-1">Business Petty Cash (Petty Cash)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Transaction ID, UTR number, person who paid"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Post Payment In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
