import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  Download,
  Copy,
  PlusCircle,
  ShoppingBag,
  ChevronRight,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText
} from 'lucide-react';
import { ProcurementOrder, Party, Item, PurchaseLineItem, AppSettings, ProcurementStatus } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface ProcurementOrdersViewProps {
  procurementOrders: ProcurementOrder[];
  parties: Party[];
  items: Item[];
  onAddProcurement: (order: Omit<ProcurementOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProcurementStatus: (id: string, status: ProcurementStatus) => void;
  onConvertToPurchaseInvoice: (orderId: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function ProcurementOrdersView({
  procurementOrders,
  parties,
  items,
  onAddProcurement,
  onUpdateProcurementStatus,
  onConvertToPurchaseInvoice,
  isAdmin,
  settings
}: ProcurementOrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<ProcurementOrder | null>(null);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(settings.purchase.terms);
  const [shippingAddress, setShippingAddress] = useState(settings.company.address);
  const [deliveryLocation, setDeliveryLocation] = useState('Main Warehouse');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [internalNotes, setInternalNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(settings.purchase.terms);

  const [lineItems, setLineItems] = useState<{
    itemId: string;
    quantity: number;
    rate: number;
    taxPercent: number;
  }[]>([{ itemId: '', quantity: 1, rate: 0, taxPercent: 18 }]);

  const suppliers = parties.filter((p) => p.type === 'Supplier' || p.type === 'Both');

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'itemId') {
      const selectedItem = items.find((it) => it.id === value);
      if (selectedItem) {
        updated[index].rate = selectedItem.purchasePrice;
        updated[index].taxPercent = selectedItem.taxRate;
      }
    }
    setLineItems(updated);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    const mappedItems: PurchaseLineItem[] = lineItems
      .filter((line) => line.itemId !== '')
      .map((line, idx) => {
        const itemObj = items.find((it) => it.id === line.itemId)!;
        const baseAmount = line.quantity * line.rate;
        const taxVal = baseAmount * (line.taxPercent / 100);
        const finalAmount = baseAmount + taxVal;

        subtotal += baseAmount;
        taxAmount += taxVal;

        return {
          id: `po-line-${Date.now()}-${idx}`,
          itemId: line.itemId,
          itemName: itemObj.name,
          quantity: line.quantity,
          rate: line.rate,
          taxPercent: line.taxPercent,
          taxAmount: parseFloat(taxVal.toFixed(2)),
          amount: parseFloat(finalAmount.toFixed(2))
        };
      });

    const grandTotal = subtotal + taxAmount + Number(additionalCharges);

    return {
      items: mappedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) return alert('Select a supplier');
    const selectedParty = parties.find((p) => p.id === partyId)!;
    const totals = calculateTotals();
    if (totals.items.length === 0) return alert('Add at least one item');

    onAddProcurement({
      partyId,
      partyName: selectedParty.name,
      supplierAddress: selectedParty.billingAddress,
      supplierGstNumber: selectedParty.gstNumber,
      orderDate,
      expectedDeliveryDate,
      referenceNumber,
      paymentTerms,
      shippingAddress,
      deliveryLocation,
      status: 'Draft',
      items: totals.items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: 0,
      additionalCharges: Number(additionalCharges),
      roundOff: 0,
      total: totals.total,
      termsAndConditions,
      internalNotes
    });

    setIsCreating(false);
    setPartyId('');
    setLineItems([{ itemId: '', quantity: 1, rate: 0, taxPercent: 18 }]);
  };

  const filtered = procurementOrders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || o.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isCreating) {
    const totals = calculateTotals();
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Procurement Order</h2>
            <p className="text-xs text-slate-500">Formally request items from suppliers. Stock will only update when items are received.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
              <select required value={partyId} onChange={(e) => setPartyId(e.target.value)} className="w-full border rounded-md p-2 text-xs">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Date</label>
              <input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery</label>
              <input type="date" required value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference No.</label>
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full border rounded-md p-2 text-xs" placeholder="e.g. QU-992" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shipping Address</label>
              <textarea rows={2} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Location</label>
              <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b font-bold uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="p-3 w-1/3">Item</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Rate</th>
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
                      {(line.quantity * line.rate * (1 + line.taxPercent/100)).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded" disabled={lineItems.length === 1}>&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-slate-50 border-t">
              <button type="button" onClick={() => setLineItems([...lineItems, { itemId: '', quantity: 1, rate: 0, taxPercent: 18 }])} className="text-blue-600 font-bold text-xs">+ Add Item Row</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <textarea placeholder="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full border rounded-lg p-3 text-xs h-24" />
              <textarea placeholder="Internal Notes" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="w-full border rounded-lg p-3 text-xs h-24" />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border">
              <div className="flex justify-between text-xs font-medium"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs font-medium"><span>Tax</span><span>₹{totals.taxAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs font-medium">
                <span>Other Charges</span>
                <input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(Number(e.target.value))} className="w-24 border rounded text-right p-1" />
              </div>
              <div className="border-t pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 uppercase">Grand Total Procurement Value</span>
                <span className="text-xl font-bold text-indigo-600">₹{totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white/80 backdrop-blur-sm p-4">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Finalize Procurement Order</button>
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
            <Briefcase size={20} className="text-indigo-600" />
            Procurement Orders
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage official purchase requests to vendors and track material fulfillment.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition">
          <Plus size={14} />
          <span>New Procurement Order</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by number or supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none">
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Partially Received">Partially Received</option>
          <option value="Fully Received">Fully Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">PO Number</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Order Date</th>
              <th className="p-4">Delivery Due</th>
              <th className="p-4 text-right">Total Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-medium">No procurement orders logged.</td></tr>
            ) : (
              filtered.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4 font-mono font-bold text-indigo-900">{po.orderNumber}</td>
                  <td className="p-4 font-bold">{po.partyName}</td>
                  <td className="p-4 font-mono text-slate-500">{po.orderDate}</td>
                  <td className="p-4 font-mono text-slate-500">{po.expectedDeliveryDate}</td>
                  <td className="p-4 text-right font-bold text-slate-900">₹{po.total.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      po.status === 'Fully Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      po.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                      po.status === 'Sent' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      po.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-slate-50 text-slate-500'
                    }`}>{po.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingOrder(po)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Print/Preview"><Printer size={14} /></button>
                      {po.status !== 'Fully Received' && po.status !== 'Cancelled' && (
                        <>
                          <button onClick={() => onUpdateProcurementStatus(po.id, 'Fully Received')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Mark Fully Received"><CheckCircle2 size={14} /></button>
                          <button onClick={() => { if(confirm('Convert to Purchase Invoice? This will increase inventory stock levels and create a payable ledger entry.')) onConvertToPurchaseInvoice(po.id); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Convert to Purchase"><FileText size={14} /></button>
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

      {viewingOrder && (
        <DocumentPrintView
          documentType="procurement_order"
          data={viewingOrder}
          settings={settings}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </div>
  );
}

import { Briefcase } from 'lucide-react';
