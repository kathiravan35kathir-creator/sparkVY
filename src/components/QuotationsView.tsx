import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Printer,
  Share2,
  Download,
  Copy,
  ChevronRight,
  Calculator,
  User,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Quotation, QuotationLineItem, Party, Item, QuotationStatus, AppSettings } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface QuotationsViewProps {
  quotations: Quotation[];
  parties: Party[];
  items: Item[];
  onAddQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => void;
  onEditQuotation: (id: string, quotation: Partial<Quotation>) => void;
  onConvertToInvoice: (id: string) => void;
  onReviseEstimate?: (id: string) => void;
  onConvertEstimateToFinal?: (id: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
  onCheckPin?: (action: string, onConfirm: () => void) => void;
  onLogCommunication?: (log: any) => void;
}

export default function QuotationsView({
  quotations,
  parties,
  items,
  onAddQuotation,
  onEditQuotation,
  onConvertToInvoice,
  onReviseEstimate,
  onConvertEstimateToFinal,
  isAdmin,
  settings,
  onCheckPin,
  onLogCommunication
}: QuotationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Active view states
  const [isCreating, setIsCreating] = useState(false);
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  // New Quotation Fields
  const [partyId, setPartyId] = useState('');
  const [quotationStage, setQuotationStage] = useState<'Estimate' | 'Final'>('Estimate');
  const [quotationDate, setQuotationDate] = useState('2026-07-14');
  const [expiryDate, setExpiryDate] = useState('2026-08-14');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [advanceRequirement, setAdvanceRequirement] = useState(0);
  const [notes, setNotes] = useState('Thank you for requesting this proposal. We look forward to working with you.');
  const [terms, setTerms] = useState('1. 50% advance required prior to chemical plating.\n2. Testing results will be delivered within standard TAT.');

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<{
    itemId: string;
    quantity: number;
    rate: number;
    discountPercent: number;
    taxPercent: number;
  }[]>([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);

  const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');

  // Handle line item change
  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate rate & tax if item selection changed
    if (field === 'itemId') {
      const selectedItem = items.find((it) => it.id === value);
      if (selectedItem) {
        updated[index].rate = selectedItem.sellingPrice;
        updated[index].taxPercent = selectedItem.taxRate;
      }
    }
    setLineItems(updated);
  };

  const handleAddLineItemRow = () => {
    setLineItems([...lineItems, { itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);
  };

  const handleRemoveLineItemRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Perform calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let sampleCount = 0;

    const mappedItems: QuotationLineItem[] = lineItems
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
        sampleCount += line.quantity; // mapping qty to sample count for convenience

        return {
          id: `qti-${Date.now()}-${idx}`,
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

    const total = subtotal - discountAmount + taxAmount + Number(additionalCharges);

    return {
      items: mappedItems,
      sampleCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      alert('Please select a Customer.');
      return;
    }
    const selectedParty = parties.find((p) => p.id === partyId)!;
    const { items: mappedItems, sampleCount, subtotal, discountAmount, taxAmount, total } = calculateTotals();

    if (mappedItems.length === 0) {
      alert('Please add at least one valid item to quotation.');
      return;
    }

    onAddQuotation({
      stage: quotationStage,
      partyId,
      partyName: selectedParty.name,
      quotationDate,
      expiryDate,
      items: mappedItems,
      sampleCount,
      subtotal,
      discountAmount,
      taxAmount,
      additionalCharges: Number(additionalCharges),
      total,
      status: 'Sent', // Both stages allow 'Sent'
      advanceRequirement: Number(advanceRequirement),
      notes,
      termsAndConditions: terms
    });

    setIsCreating(false);
    // Reset Form
    setPartyId('');
    setLineItems([{ itemId: '', quantity: 1, rate: 0, discountPercent: 0, taxPercent: 18 }]);
    setAdditionalCharges(0);
    setAdvanceRequirement(0);
  };

  // Filter core list
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isCreating) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Sales & Proposals</span>
              <span className="text-slate-300">/</span>
              <span>Quotations</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">New Quotation</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Draft Professional Quotation Proposal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Line items support both physical products or standard business services.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>

        {/* Full-width Form Layout */}
        <form onSubmit={handleSaveQuotation} className="space-y-8 pb-20">
          
          {/* SECTION 1: Client & Proposal Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Proposal Metadata</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Quotation Stage</label>
                <select
                  value={quotationStage}
                  onChange={(e) => setQuotationStage(e.target.value as 'Estimate' | 'Final')}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold"
                >
                  <option value="Estimate">Estimate Quotation</option>
                  <option value="Final">Final Quotation</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Customer (Client/Org) *</label>
                <select
                  required
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold text-slate-700"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || 'no parent co'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Quotation Date *</label>
                <input
                  type="date"
                  required
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Validity Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Line Items Matrix */}
          <div className="space-y-4 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Line Items & Services Matrix</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="space-y-3">
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-[45%]">Select Item or Service Description</th>
                      <th className="py-2.5 px-3 text-center w-[10%]">Qty / Units</th>
                      <th className="py-2.5 px-3 text-right w-[15%]">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right w-[10%]">Disc %</th>
                      <th className="py-2.5 px-3 text-right w-[10%]">GST %</th>
                      <th className="py-2.5 px-3 text-right w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-2 px-3">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleLineItemChange(idx, 'itemId', e.target.value)}
                            className="w-full border border-slate-150 rounded px-2.5 py-1 text-xs focus:outline-none bg-white text-slate-800 font-semibold"
                          >
                            <option value="">-- Choose Catalog Item --</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.code} - {it.name} [₹{it.sellingPrice}]
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full text-center border border-slate-150 rounded py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={line.rate}
                            onChange={(e) => handleLineItemChange(idx, 'rate', Number(e.target.value))}
                            className="w-full text-right border border-slate-150 rounded py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discountPercent}
                            onChange={(e) => handleLineItemChange(idx, 'discountPercent', Number(e.target.value))}
                            className="w-full text-right border border-slate-150 rounded py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <select
                            value={line.taxPercent}
                            onChange={(e) => handleLineItemChange(idx, 'taxPercent', Number(e.target.value))}
                            className="w-full border border-slate-150 rounded py-1 text-xs font-mono bg-white text-slate-700"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItemRow(idx)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-30"
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
                onClick={handleAddLineItemRow}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition bg-white"
              >
                <PlusCircle size={14} className="text-blue-600" />
                <span>Add another line item row</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Terms & Total Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E5EAF0]">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Quotation Advance Requirement (INR)</label>
                <input
                  type="number"
                  value={advanceRequirement}
                  onChange={(e) => setAdvanceRequirement(Number(e.target.value))}
                  className="w-full md:max-w-xs h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Specify upfront billing deposit needed before processing begins.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Proposal Reference Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border border-[#D8E0EA] rounded-md p-3 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 space-y-3.5">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">Financial Ledger Breakdown</p>
              {(() => {
                const totals = calculateTotals();
                return (
                  <>
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Items Subtotal:</span>
                      <span className="font-mono">₹{totals.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Aggregate Discounts:</span>
                      <span className="font-mono text-emerald-600">- ₹{totals.discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Aggregated CGST & SGST (Taxes):</span>
                      <span className="font-mono text-slate-800">+ ₹{totals.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 items-center">
                      <span>Logistics / Extra charges:</span>
                      <input
                        type="number"
                        value={additionalCharges}
                        onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                        className="w-28 text-right border border-slate-200 rounded px-2.5 py-1 text-xs font-mono bg-white"
                      />
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                      <span className="text-xs font-black text-slate-900 uppercase">Grand Quote Total:</span>
                      <span className="text-xl font-black text-[#163A5F] font-mono">
                        ₹{(totals.total).toLocaleString()}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-40 shadow-lg">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
            >
              Cancel Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition shadow-sm"
            >
              Finalize & Dispatch Proposal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: LIST / GENERAL CATALOG AREA */}
      {!printingQuotation && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Quotations & Business Proposals</h2>
              <p className="text-xs text-slate-500 mt-1">Generate and dispatch professional quotes for products and services to client organizations.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <Plus size={14} />
                <span>Create New Quotation</span>
              </button>
            )}
          </div>

          {/* Search/Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotations by quote number, customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Quotations</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Revised">Revised (Est)</option>
                <option value="Approved">Approved (Est)</option>
                <option value="Accepted">Accepted (Final)</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
                <option value="Converted">Converted to Invoice</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Quote Number</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Quote Date</th>
                    <th className="py-3 px-4 text-center">Items Qty</th>
                    <th className="py-3 px-4 text-right">Quote Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No quotations recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {q.stage === 'Estimate' ? (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">ESTIMATE</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">FINAL</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{q.partyName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{q.quotationDate}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">{q.items.length} lines</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#163A5F]">
                          ₹{q.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'Accepted' || q.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            q.status === 'Converted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            q.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {q.status === 'Converted' ? 'Converted' : q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setPrintingQuotation(q)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="Print Quote PDF"
                            >
                              <Printer size={13} />
                            </button>
                            
                            {/* Duplicate / Revise (For Estimates) */}
                            {isAdmin && q.stage === 'Estimate' && q.status !== 'Converted' && (
                                <button
                                  onClick={() => {
                                      if (confirm(`Create a new revision for ${q.quotationNumber}?`)) {
                                          if (onReviseEstimate) onReviseEstimate(q.id);
                                      }
                                  }}
                                  className="flex items-center space-x-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-extrabold transition"
                                  title="Revise Estimate"
                                >
                                  <span>Revise</span>
                                </button>
                            )}

                            {/* Convert Estimate to Final */}
                            {isAdmin && q.stage === 'Estimate' && q.status !== 'Converted' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Convert Estimate ${q.quotationNumber} to Final Quotation now?`)) {
                                      if (onConvertEstimateToFinal) onConvertEstimateToFinal(q.id);
                                    }
                                  }}
                                  className="flex items-center space-x-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded text-[10px] font-extrabold transition"
                                  title="Convert to Final"
                                >
                                  <span>To Final</span>
                                </button>
                            )}

                            {/* Convert Final to Invoice */}
                            {isAdmin && q.stage === 'Final' && (q.status === 'Sent' || q.status === 'Accepted') && (
                              <button
                                onClick={() => {
                                  if (confirm(`Convert Final Quotation ${q.quotationNumber} to Sales Tax Invoice now?`)) {
                                    onConvertToInvoice(q.id);
                                  }
                                }}
                                className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded text-[10px] font-extrabold transition"
                                title="Convert to Invoice"
                              >
                                <span>To Invoice</span>
                                <ChevronRight size={10} />
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

      {/* SECTION 3: PROFESSIONAL PRINT/PDF PREVIEW */}
      {printingQuotation && (
        <DocumentPrintView
          documentType="quotation"
          data={printingQuotation}
          settings={settings}
          onClose={() => setPrintingQuotation(null)}
          onCheckPin={onCheckPin}
          onLogCommunication={onLogCommunication}
        />
      )}
    </div>
  );
}
