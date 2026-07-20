import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  Download,
  Copy,
  PlusCircle,
  FileText,
  ChevronRight,
  ClipboardList,
  Lock,
  ArrowRight
} from 'lucide-react';
import { ProformaInvoice, Party, Item, InvoiceLineItem, AppSettings, ProformaStatus } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface ProformaInvoicesViewProps {
  proformaInvoices: ProformaInvoice[];
  parties: Party[];
  items: Item[];
  onAddProforma: (proforma: Omit<ProformaInvoice, 'id' | 'proformaNumber' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProformaStatus: (id: string, status: ProformaStatus) => void;
  onConvertToSalesInvoice: (proformaId: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function ProformaInvoicesView({
  proformaInvoices,
  parties,
  items,
  onAddProforma,
  onUpdateProformaStatus,
  onConvertToSalesInvoice,
  isAdmin,
  settings
}: ProformaInvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingProforma, setViewingProforma] = useState<ProformaInvoice | null>(null);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [advanceRequested, setAdvanceRequested] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(settings.invoice.terms);

  const [lineItems, setLineItems] = useState<{
    itemId: string;
    quantity: number;
    rate: number;
    discountPercent: number;
    taxPercent: number;
  }[]>([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);

  const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'itemId') {
      const selectedItem = items.find((it) => it.id === value);
      if (selectedItem) {
        updated[index].rate = selectedItem.sellingPrice;
        updated[index].taxPercent = selectedItem.taxRate;
      }
    }
    setLineItems(updated);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const mappedItems: InvoiceLineItem[] = lineItems
      .filter((line) => line.itemId !== '')
      .map((line, idx) => {
        const itemObj = items.find((it) => it.id === line.itemId)!;
        const baseAmount = line.quantity * line.rate;
        const discVal = baseAmount * (line.discountPercent / 100);
        const netBase = baseAmount - discVal;
        const taxVal = netBase * (line.taxPercent / 100);
        const finalAmount = netBase + taxVal;

        subtotal += baseAmount;
        discountAmount += discVal;
        taxAmount += taxVal;

        return {
          id: `pi-line-${Date.now()}-${idx}`,
          itemId: line.itemId,
          itemName: itemObj.name,
          itemCode: itemObj.code,
          quantity: line.quantity,
          rate: line.rate,
          discountPercent: line.discountPercent,
          taxPercent: line.taxPercent,
          taxAmount: parseFloat(taxVal.toFixed(2)),
          amount: parseFloat(finalAmount.toFixed(2))
        };
      });

    const grandTotal = subtotal - discountAmount + taxAmount + Number(additionalCharges);

    return {
      items: mappedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) return alert('Select a customer');
    const selectedParty = parties.find((p) => p.id === partyId)!;
    const totals = calculateTotals();
    if (totals.items.length === 0) return alert('Add at least one item');

    onAddProforma({
      partyId,
      partyName: selectedParty.name,
      billingAddress: selectedParty.billingAddress,
      shippingAddress: selectedParty.shippingAddress,
      partyGstNumber: selectedParty.gstNumber,
      date,
      validUntil,
      reference,
      salesperson,
      items: totals.items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      additionalCharges: Number(additionalCharges),
      roundOff: 0,
      total: totals.total,
      advanceRequested,
      status: 'Draft',
      notes,
      terms
    });

    setIsCreating(false);
    setPartyId('');
    setLineItems([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);
  };

  const filtered = proformaInvoices.filter((i) => {
    const matchesSearch = i.proformaNumber.toLowerCase().includes(searchQuery.toLowerCase()) || i.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isCreating) {
    const totals = calculateTotals();
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Proforma Invoice</h2>
            <p className="text-xs text-slate-500">A Proforma Invoice is not a final tax invoice and does not affect stock or accounting.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
              <select required value={partyId} onChange={(e) => setPartyId(e.target.value)} className="w-full border rounded-md p-2 text-xs">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until</label>
              <input type="date" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b font-bold uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="p-3 w-1/3">Item</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Tax%</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((line, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <select required value={line.itemId} onChange={(e) => handleLineItemChange(idx, 'itemId', e.target.value)} className="w-full border rounded p-1 text-xs">
                        <option value="">Select Item</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <input type="number" required min="1" value={line.quantity} onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))} className="w-full border rounded p-1 text-center" />
                    </td>
                    <td className="p-3">
                      <input type="number" required value={line.rate} onChange={(e) => handleLineItemChange(idx, 'rate', Number(e.target.value))} className="w-full border rounded p-1 text-right" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={line.taxPercent} onChange={(e) => handleLineItemChange(idx, 'taxPercent', Number(e.target.value))} className="w-full border rounded p-1 text-right" />
                    </td>
                    <td className="p-3 text-right font-mono">
                      {(line.quantity * line.rate * (1 - line.discountPercent/100) * (1 + line.taxPercent/100)).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded" disabled={lineItems.length === 1}>&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-slate-50 border-t">
              <button type="button" onClick={() => setLineItems([...lineItems, { itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }])} className="text-blue-600 font-bold text-xs">+ Add Row</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <textarea placeholder="Terms & Conditions" value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full border rounded-lg p-3 text-xs h-24" />
              <textarea placeholder="Internal Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg p-3 text-xs h-24" />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border">
              <div className="flex justify-between text-xs font-medium"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs font-medium"><span>Tax</span><span>₹{totals.taxAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs font-medium">
                <span>Other Charges</span>
                <input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(Number(e.target.value))} className="w-24 border rounded text-right p-1" />
              </div>
              <div className="border-t pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-blue-600">₹{totals.total.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Advance Requested (₹)</label>
                <input type="number" value={advanceRequested} onChange={(e) => setAdvanceRequested(Number(e.target.value))} className="w-full border rounded p-2 text-xs mt-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white/80 backdrop-blur-sm p-4">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700">Save Proforma Invoice</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Proforma Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">Manage formal price proposals and pre-invoice documents.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition">
          <Plus size={14} />
          <span>New Proforma Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by number or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none">
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Converted">Converted</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">Proforma No.</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Total Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400">No proforma invoices found.</td></tr>
            ) : (
              filtered.map((pi) => (
                <tr key={pi.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold">{pi.proformaNumber}</td>
                  <td className="p-4 font-bold">{pi.partyName}</td>
                  <td className="p-4 font-mono text-slate-500">{pi.date}</td>
                  <td className="p-4 text-right font-bold text-slate-900">₹{pi.total.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      pi.status === 'Converted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      pi.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                      pi.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      'bg-slate-50 text-slate-500'
                    }`}>{pi.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setViewingProforma(pi)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Print/Preview"><Printer size={14} /></button>
                      {pi.status !== 'Converted' && pi.status !== 'Cancelled' && (
                        <>
                          <button onClick={() => onUpdateProformaStatus(pi.id, 'Accepted')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Mark Accepted"><ArrowRight size={14} /></button>
                          <button onClick={() => { if(confirm('Convert to Sales Invoice? This will generate a new invoice number and update records.')) onConvertToSalesInvoice(pi.id); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Convert to Invoice"><FileText size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingProforma && (
        <DocumentPrintView
          documentType="proforma_invoice"
          data={viewingProforma}
          settings={settings}
          onClose={() => setViewingProforma(null)}
        />
      )}
    </div>
  );
}
