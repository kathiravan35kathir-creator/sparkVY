import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  RotateCcw,
  Receipt,
  PlusCircle,
  ChevronRight,
  Package,
  History,
  Lock,
  ArrowDownLeft,
  CheckCircle2,
  Trash2,
  Copy,
  X
} from 'lucide-react';
import { SalesReturn, Party, Invoice, SalesReturnLineItem, AppSettings, SalesReturnReason, ItemCondition, PaymentMethod, SalesReturnLineItem as SRLineItem } from '../types';
import DocumentPrintView from './DocumentPrintView';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';

interface SalesReturnsViewProps {
  salesReturns: SalesReturn[];
  parties: Party[];
  invoices: Invoice[];
  onAddSalesReturn: (sr: Omit<SalesReturn, 'id' | 'createdAt' | 'returnNumber'>) => void;
  onDeleteSalesReturn?: (id: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function SalesReturnsView({
  salesReturns,
  parties,
  invoices,
  onAddSalesReturn,
  onDeleteSalesReturn,
  isAdmin,
  settings
}: SalesReturnsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingReturn, setViewingReturn] = useState<SalesReturn | null>(null);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [refundMethod, setRefundMethod] = useState<PaymentMethod | ''>('');
  const [issueCreditNote, setIssueCreditNote] = useState(true);
  const [notes, setNotes] = useState('');

  const [returnItems, setReturnItems] = useState<{
    itemId: string;
    itemName: string;
    itemCode: string;
    originalQuantity: number;
    returnQuantity: number;
    rate: number;
    taxPercent: number;
    reason: SalesReturnReason;
    condition: ItemCondition;
    restockOption: boolean;
  }[]>([]);

  const handleOpenDuplicate = (sr: SalesReturn) => {
    setPartyId(sr.partyId);
    setInvoiceId(sr.originalInvoiceId || '');
    setReturnDate(new Date().toISOString().slice(0, 10));
    setRefundMethod(sr.refundMethod || '');
    setIssueCreditNote(sr.creditNoteIssued);
    setNotes(sr.notes || '');
    setReturnItems(sr.items.map(it => ({
      itemId: it.itemId,
      itemName: it.itemName,
      itemCode: it.itemCode,
      originalQuantity: it.quantity,
      returnQuantity: it.returnQuantity,
      rate: it.rate,
      taxPercent: it.taxPercent,
      reason: it.reason,
      condition: it.condition,
      restockOption: it.restockOption
    })));
    setIsCreating(true);
  };

  const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');
  const customerInvoices = invoices.filter(inv => inv.partyId === partyId && inv.status !== 'Cancelled');

  const handleInvoiceSelect = (id: string) => {
    setInvoiceId(id);
    const selectedInvoice = invoices.find(inv => inv.id === id);
    if (selectedInvoice) {
      setReturnItems(selectedInvoice.items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        originalQuantity: item.quantity,
        returnQuantity: 0,
        rate: item.rate,
        taxPercent: item.taxPercent,
        reason: 'Damaged item',
        condition: 'Resalable',
        restockOption: true
      })));
    } else {
      setReturnItems([]);
    }
  };

  const handleReturnItemChange = (idx: number, field: string, value: any) => {
    const updated = [...returnItems];
    if (field === 'returnQuantity') {
      const val = toSafeNumber(value);
      if (val > updated[idx].originalQuantity) return;
      updated[idx].returnQuantity = val;
    } else {
      (updated[idx] as any)[field] = value;
    }
    setReturnItems(updated);
  };

  const calculateTotal = () => {
    return returnItems.reduce((acc, item) => {
      const amount = toSafeNumber(item.returnQuantity) * toSafeNumber(item.rate) * (1 + toSafeNumber(item.taxPercent) / 100);
      return acc + amount;
    }, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) return alert('Select customer');
    const selectedParty = parties.find(p => p.id === partyId)!;
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) return alert('No items selected for return');

    const mappedItems: SRLineItem[] = itemsToReturn.map((item, idx) => ({
      id: `sr-line-${Date.now()}-${idx}`,
      itemId: item.itemId,
      itemName: item.itemName,
      itemCode: item.itemCode,
      quantity: item.originalQuantity,
      rate: item.rate,
      discountPercent: 0,
      taxPercent: item.taxPercent,
      taxAmount: (item.returnQuantity * item.rate * item.taxPercent / 100),
      amount: (item.returnQuantity * item.rate * (1 + item.taxPercent / 100)),
      returnQuantity: item.returnQuantity,
      reason: item.reason,
      condition: item.condition,
      restockOption: item.restockOption
    }));

    onAddSalesReturn({
      partyId,
      partyName: selectedParty.name,
      returnDate,
      originalInvoiceId: invoiceId || undefined,
      originalInvoiceNumber: invoices.find(i => i.id === invoiceId)?.invoiceNumber,
      items: mappedItems,
      totalReturnAmount: calculateTotal(),
      refundMethod: refundMethod || undefined,
      creditNoteIssued: issueCreditNote,
      notes
    });

    setIsCreating(false);
    setPartyId('');
    setInvoiceId('');
    setReturnItems([]);
  };

  const filtered = salesReturns.filter(sr => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find(p => p.id === sr.partyId);
    return (
      !q ||
      (sr.returnNumber && sr.returnNumber.toLowerCase().includes(q)) ||
      (sr.partyName && sr.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (sr.originalInvoiceNumber && sr.originalInvoiceNumber.toLowerCase().includes(q)) ||
      (sr.notes && sr.notes.toLowerCase().includes(q)) ||
      (sr.id && sr.id.toLowerCase().includes(q)) ||
      (sr.items && sr.items.some(it => it.itemName.toLowerCase().includes(q) || (it.reason && it.reason.toLowerCase().includes(q))))
    );
  });

  if (isCreating) {
    const total = calculateTotal();
    return (
      <div className="space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Record Sales Return</h2>
            <p className="text-xs text-slate-500">Return items from customers, issue credit notes, and manage stock reversals.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
              <select required value={partyId} onChange={(e) => { setPartyId(e.target.value); setInvoiceId(''); setReturnItems([]); }} className="w-full border rounded-md p-2 text-xs">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice (Optional)</label>
              <select value={invoiceId} onChange={(e) => handleInvoiceSelect(e.target.value)} className="w-full border rounded-md p-2 text-xs" disabled={!partyId}>
                <option value="">Direct Return (No Invoice)</option>
                {customerInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} (₹{inv.total.toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return Date</label>
              <input type="date" required value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b font-bold uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="p-3 w-1/4">Item</th>
                  <th className="p-3 text-center">Inv Qty</th>
                  <th className="p-3 text-center w-24">Return Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Stock Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Select a customer/invoice to load items for return.</td></tr>
                ) : (
                  returnItems.map((item, idx) => (
                    <tr key={idx} className={item.returnQuantity > 0 ? 'bg-amber-50/30' : ''}>
                      <td className="p-3">
                        <p className="font-bold">{item.itemName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.itemCode}</p>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-400">{item.originalQuantity}</td>
                      <td className="p-3">
                        <NumericInput
                          value={item.returnQuantity}
                          onChange={(val) => handleReturnItemChange(idx, 'returnQuantity', val)}
                          allowDecimal={true}
                          decimalScale={3}
                          min={0}
                          max={item.originalQuantity}
                          className="w-full border rounded p-1 text-center font-bold text-blue-600 font-mono text-xs"
                        />
                      </td>
                      <td className="p-3 text-right font-mono">₹{item.rate.toLocaleString()}</td>
                      <td className="p-3">
                        <select value={item.reason} onChange={(e) => handleReturnItemChange(idx, 'reason', e.target.value)} className="w-full border rounded p-1 text-[10px]">
                          <option value="Damaged item">Damaged</option>
                          <option value="Wrong item supplied">Wrong Item</option>
                          <option value="Quality issue">Quality Issue</option>
                          <option value="Excess quantity">Excess Qty</option>
                          <option value="Expired item">Expired</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select value={item.condition} onChange={(e) => handleReturnItemChange(idx, 'condition', e.target.value)} className="w-full border rounded p-1 text-[10px]">
                          <option value="Resalable">Resalable (Restock)</option>
                          <option value="Damaged">Damaged (No Restock)</option>
                          <option value="Expired">Expired</option>
                          <option value="Non-stock item">Non-stock</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <input type="checkbox" id="issue-cn" checked={issueCreditNote} onChange={(e) => setIssueCreditNote(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="issue-cn" className="text-xs font-bold text-blue-800">Automatically Issue Credit Note for this return</label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-3 text-xs h-24" placeholder="Mention inspection details or special remarks..." />
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-end justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credit Value</span>
              <span className="text-3xl font-black text-blue-600 font-mono">₹{total.toLocaleString()}</span>
              <p className="text-[10px] text-slate-500 mt-1 italic">* Includes applied taxes as per original billing.</p>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-6 py-3.5 px-6 bg-white/90 backdrop-blur-sm border-t border-slate-200 flex items-center justify-end gap-3 z-20 shadow-md">
            <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition active:scale-95">Post Sales Return Record</button>
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
            <RotateCcw size={20} className="text-blue-600" />
            Sales Returns
          </h2>
          <p className="text-xs text-slate-500 mt-1">Track customer returns, reverse stock, and manage credit notes.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition">
          <Plus size={14} />
          <span>New Sales Return</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex gap-3 shadow-sm items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search return #, customer, invoice #, reason, items..."
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
            {filtered.length} Matching
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">Return No.</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Original Invoice</th>
              <th className="p-4 text-right">Return Amount</th>
              <th className="p-4 text-center">Credit Note</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-medium">No matching records found.</td></tr>
            ) : (
              filtered.map((sr) => (
                <tr key={sr.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-blue-900">{sr.returnNumber}</td>
                  <td className="p-4 font-bold">{sr.partyName}</td>
                  <td className="p-4 font-mono text-slate-500">{sr.returnDate}</td>
                  <td className="p-4 font-mono text-slate-500">{sr.originalInvoiceNumber || 'N/A'}</td>
                  <td className="p-4 text-right font-bold text-slate-900">₹{sr.totalReturnAmount.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    {sr.creditNoteIssued ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 size={10} />
                        Issued
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">Not Issued</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setViewingReturn(sr)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Print Return Document"><Printer size={14} /></button>
                      
                      {isAdmin && (
                        <button onClick={() => handleOpenDuplicate(sr)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Duplicate (Save as New)"><Copy size={14} /></button>
                      )}

                      {isAdmin && onDeleteSalesReturn && (
                        <button onClick={() => { if (confirm(`Are you sure you want to delete Sales Return ${sr.returnNumber}?`)) onDeleteSalesReturn(sr.id); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Move to Trash"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingReturn && (
        <DocumentPrintView
          documentType="sales_return"
          data={viewingReturn}
          settings={settings}
          onClose={() => setViewingReturn(null)}
        />
      )}
    </div>
  );
}
