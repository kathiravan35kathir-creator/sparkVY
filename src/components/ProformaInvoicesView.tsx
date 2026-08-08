import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Printer,
  Copy,
  PlusCircle,
  FileText,
  Lock,
  ArrowRight,
  Trash2,
  X,
  UserPlus,
  PackagePlus,
  FilePlus,
  CheckCircle2,
  Edit3,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CreditCard,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ProformaInvoice, Party, Item, InvoiceLineItem, AppSettings, ProformaStatus } from '../types';
import DocumentPrintView from './DocumentPrintView';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';
import QuickCreatePartyModal from './QuickCreatePartyModal';
import QuickCreateItemModal from './QuickCreateItemModal';
import ItemSearchSelect from './ItemSearchSelect';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ProformaInvoicesViewProps {
  proformaInvoices: ProformaInvoice[];
  parties: Party[];
  items: Item[];
  onAddProforma: (proforma: Omit<ProformaInvoice, 'id' | 'proformaNumber' | 'createdAt' | 'updatedAt'>) => void;
  onEditProforma?: (id: string, updated: Partial<ProformaInvoice>) => void;
  onUpdateProformaStatus: (id: string, status: ProformaStatus) => void;
  onConvertToSalesInvoice: (proformaId: string) => void;
  onDeleteProforma?: (id: string) => void;
  onAddParty?: (party: Omit<Party, 'id' | 'code' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => void;
  onAddItem?: (item: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => void;
  isAdmin: boolean;
  settings: AppSettings;
  onCheckPin?: (action: string, onConfirm: () => void) => void;
}

export default function ProformaInvoicesView({
  proformaInvoices,
  parties,
  items,
  onAddProforma,
  onEditProforma,
  onUpdateProformaStatus,
  onConvertToSalesInvoice,
  onDeleteProforma,
  onAddParty,
  onAddItem,
  isAdmin,
  settings,
  onCheckPin
}: ProformaInvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProformaId, setEditingProformaId] = useState<string | null>(null);
  const [viewingProforma, setViewingProforma] = useState<ProformaInvoice | null>(null);
  const [deletingProforma, setDeletingProforma] = useState<ProformaInvoice | null>(null);

  // Quick Create Modals
  const [isQuickPartyOpen, setIsQuickPartyOpen] = useState(false);
  const [quickPartySearchText, setQuickPartySearchText] = useState('');
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [quickItemSearchText, setQuickItemSearchText] = useState('');
  const [activeItemLineIdx, setActiveItemLineIdx] = useState<number | null>(null);

  // Form Fields
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [advanceRequested, setAdvanceRequested] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(settings.invoice?.terms || '1. This is a Proforma Invoice, not a final tax invoice.\n2. Prices are valid until the specified expiration date.\n3. Advance payment is required prior to shipment or dispatch.');

  const [lineItems, setLineItems] = useState<{
    itemId: string;
    description?: string;
    hsnCode?: string;
    quantity: number;
    unit?: string;
    rate: number;
    discountPercent: number;
    taxPercent: number;
  }[]>([
    { itemId: '', description: '', hsnCode: '', quantity: 1, unit: 'Pcs', rate: 0, discountPercent: 0, taxPercent: 18 }
  ]);

  const [pendingCreatedItemName, setPendingCreatedItemName] = useState<string | null>(null);

  useEffect(() => {
    if (pendingCreatedItemName && activeItemLineIdx !== null) {
      const created = items.find(
        (i) => i.name.trim().toLowerCase() === pendingCreatedItemName.trim().toLowerCase()
      );
      if (created) {
        setLineItems((prev) =>
          prev.map((l, idx) =>
            idx === activeItemLineIdx
              ? {
                  ...l,
                  itemId: created.id,
                  description: created.description || '',
                  hsnCode: created.hsnCode || '',
                  quantity: l.quantity > 0 ? l.quantity : 1,
                  unit: created.unit || 'Pcs',
                  rate: created.sellingPrice,
                  taxPercent: created.taxRate ?? 18
                }
              : l
          )
        );
        setPendingCreatedItemName(null);
        setActiveItemLineIdx(null);
      }
    }
  }, [items, pendingCreatedItemName, activeItemLineIdx]);

  const resetForm = () => {
    setIsCreating(false);
    setEditingProformaId(null);
    setPartyId('');
    setDate(new Date().toISOString().slice(0, 10));
    setValidUntil(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setReference('');
    setSalesperson('');
    setAdditionalCharges(0);
    setAdvanceRequested(0);
    setNotes('');
    setTerms(settings.invoice?.terms || '1. This is a Proforma Invoice, not a final tax invoice.\n2. Prices are valid until the specified expiration date.\n3. Advance payment is required prior to shipment or dispatch.');
    setLineItems([
      { itemId: '', description: '', hsnCode: '', quantity: 1, unit: 'Pcs', rate: 0, discountPercent: 0, taxPercent: 18 }
    ]);
  };

  const startEditProforma = (pi: ProformaInvoice) => {
    setEditingProformaId(pi.id);
    setPartyId(pi.partyId);
    setDate(pi.date);
    setValidUntil(pi.validUntil);
    setReference(pi.reference || '');
    setSalesperson(pi.salesperson || '');
    setAdditionalCharges(pi.additionalCharges || 0);
    setAdvanceRequested(pi.advanceRequested || 0);
    setNotes(pi.notes || '');
    setTerms(pi.terms || settings.invoice?.terms || '');
    setLineItems(
      pi.items.map((it) => ({
        itemId: it.itemId,
        description: (it as any).description || '',
        hsnCode: (it as any).hsnCode || '',
        quantity: it.quantity,
        unit: (it as any).unit || 'Pcs',
        rate: it.rate,
        discountPercent: it.discountPercent,
        taxPercent: it.taxPercent
      }))
    );
    setIsCreating(true);
  };

  const handleOpenDuplicate = (pi: ProformaInvoice) => {
    setEditingProformaId(null);
    setPartyId(pi.partyId);
    setDate(new Date().toISOString().slice(0, 10));
    setValidUntil(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setReference(pi.reference ? `${pi.reference} (Copy)` : 'Copy');
    setSalesperson(pi.salesperson || '');
    setAdditionalCharges(pi.additionalCharges || 0);
    setAdvanceRequested(pi.advanceRequested || 0);
    setNotes(pi.notes || '');
    setTerms(pi.terms || settings.invoice?.terms || '');
    setLineItems(
      pi.items.map((it) => ({
        itemId: it.itemId,
        description: (it as any).description || '',
        hsnCode: (it as any).hsnCode || '',
        quantity: it.quantity,
        unit: (it as any).unit || 'Pcs',
        rate: it.rate,
        discountPercent: it.discountPercent,
        taxPercent: it.taxPercent
      }))
    );
    setIsCreating(true);
  };

  const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');
  const selectedParty = parties.find((p) => p.id === partyId);

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'itemId') {
      const selectedItem = items.find((it) => it.id === value);
      if (selectedItem) {
        updated[index].rate = selectedItem.sellingPrice;
        updated[index].taxPercent = selectedItem.taxRate ?? 18;
        updated[index].hsnCode = selectedItem.hsnCode || '';
        updated[index].unit = selectedItem.unit || 'Pcs';
        updated[index].description = selectedItem.description || '';
      }
    }
    setLineItems(updated);
  };

  const handleAddLineRow = () => {
    setLineItems([
      ...lineItems,
      { itemId: '', description: '', hsnCode: '', quantity: 1, unit: 'Pcs', rate: 0, discountPercent: 0, taxPercent: 18 }
    ]);
  };

  const handleRemoveLineRow = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    } else {
      setLineItems([
        { itemId: '', description: '', hsnCode: '', quantity: 1, unit: 'Pcs', rate: 0, discountPercent: 0, taxPercent: 18 }
      ]);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const mappedItems: InvoiceLineItem[] = lineItems
      .filter((line) => line.itemId !== '')
      .map((line, idx) => {
        const itemObj = items.find((it) => it.id === line.itemId);
        const itemName = itemObj ? itemObj.name : 'Custom Item';
        const itemCode = itemObj ? itemObj.code : '';

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
          itemName,
          itemCode,
          description: line.description,
          hsnCode: line.hsnCode || itemObj?.hsnCode,
          unit: line.unit || itemObj?.unit || 'Pcs',
          quantity: line.quantity,
          rate: line.rate,
          discountPercent: line.discountPercent,
          taxPercent: line.taxPercent,
          taxAmount: parseFloat(taxVal.toFixed(2)),
          amount: parseFloat(finalAmount.toFixed(2))
        };
      });

    const taxableAmount = subtotal - discountAmount;
    const rawTotal = taxableAmount + taxAmount + toSafeNumber(additionalCharges);
    const roundOff = (settings.tax as any)?.enableRoundOff ? parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2)) : 0;
    const grandTotal = Math.round(rawTotal * 100) / 100 + roundOff;
    const remainingBalance = Math.max(0, grandTotal - toSafeNumber(advanceRequested));

    return {
      items: mappedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxableAmount: parseFloat(taxableAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      roundOff,
      total: parseFloat(grandTotal.toFixed(2)),
      advanceRequested: toSafeNumber(advanceRequested),
      remainingBalance: parseFloat(remainingBalance.toFixed(2))
    };
  };

  const handleSave = (e: React.FormEvent, targetStatus: ProformaStatus = 'Sent') => {
    e.preventDefault();
    if (!partyId) return alert('Please select a customer for this Proforma Invoice.');
    
    const partyObj = parties.find((p) => p.id === partyId);
    if (!partyObj) return alert('Selected customer not found.');

    const totals = calculateTotals();
    if (totals.items.length === 0) return alert('Please add at least one valid product or service line item.');

    const proformaPayload = {
      partyId,
      partyName: partyObj.name,
      billingAddress: partyObj.billingAddress || '',
      shippingAddress: partyObj.shippingAddress || partyObj.billingAddress || '',
      partyGstNumber: partyObj.gstNumber || '',
      date,
      validUntil,
      reference,
      salesperson,
      items: totals.items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      additionalCharges: toSafeNumber(additionalCharges),
      roundOff: totals.roundOff,
      total: totals.total,
      advanceRequested: totals.advanceRequested,
      status: targetStatus,
      notes,
      terms
    };

    if (editingProformaId && onEditProforma) {
      onEditProforma(editingProformaId, proformaPayload);
    } else {
      onAddProforma(proformaPayload);
    }

    resetForm();
  };

  const filtered = proformaInvoices.filter((i) => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find((p) => p.id === i.partyId);
    const matchesSearch =
      !q ||
      (i.proformaNumber && i.proformaNumber.toLowerCase().includes(q)) ||
      (i.partyName && i.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (party?.alternatePhone && party.alternatePhone.toLowerCase().includes(q)) ||
      (i.reference && i.reference.toLowerCase().includes(q)) ||
      (i.salesperson && i.salesperson.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q)) ||
      (i.id && i.id.toLowerCase().includes(q)) ||
      (i.items &&
        i.items.some((it) => it.itemName.toLowerCase().includes(q) || it.itemCode.toLowerCase().includes(q)));

    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const companyBank: any = settings.company || {};

  if (isCreating) {
    const totals = calculateTotals();
    const isEditing = Boolean(editingProformaId);
    const existingPi = isEditing ? proformaInvoices.find((p) => p.id === editingProformaId) : null;

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Sales</span>
              <span className="text-slate-300">/</span>
              <span>Proforma Invoices</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">
                {isEditing ? `Edit ${existingPi?.proformaNumber || 'Proforma'}` : 'New Proforma Invoice'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <FilePlus className="text-blue-600" size={22} />
              <span>{isEditing ? `Edit Proforma Invoice: ${existingPi?.proformaNumber}` : 'Issue Formal Proforma Invoice'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create a non-fiscal pre-billing agreement with standard terms, tax breakdown, and requested advance payment.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Back to Proforma List
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSave(e, 'Sent')} className="space-y-8">
          {/* SECTION 1: Document & Customer Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                <span>1. Customer & Document Information</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {isEditing ? existingPi?.proformaNumber : 'Auto-Generated Proforma #'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Customer Selector */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Customer / Client <span className="text-rose-500">*</span>
                  </label>
                  {onAddParty && !(settings?.generalFeatures?.blockNewPartiesFromTransaction) && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPartySearchText('');
                        setIsQuickPartyOpen(true);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>+ Quick Customer</span>
                    </button>
                  )}
                </div>

                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>

                {/* Selected Customer Details Card */}
                {selectedParty ? (
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm font-extrabold text-slate-900 block">{selectedParty.name}</strong>
                        {selectedParty.companyName && (
                          <span className="text-slate-500 text-[11px] font-medium">{selectedParty.companyName}</span>
                        )}
                      </div>
                      {selectedParty.gstNumber && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          GSTIN: {selectedParty.gstNumber}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600 border-t border-slate-200/60">
                      <div>
                        <span className="font-bold text-slate-400 block uppercase text-[9px]">Billing Address:</span>
                        <p className="mt-0.5 whitespace-pre-line leading-relaxed">{selectedParty.billingAddress || 'No billing address provided'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block uppercase text-[9px]">Contact Details:</span>
                        <p className="mt-0.5 font-mono">Phone: {selectedParty.phone || 'N/A'}</p>
                        {selectedParty.email && <p className="font-mono">Email: {selectedParty.email}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs bg-slate-50/50">
                    Select a customer to automatically populate GSTIN, Billing, and Shipping addresses.
                  </div>
                )}
              </div>

              {/* Document Details Inputs */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proforma Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valid Until Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / PO #</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-89210 or Quote Ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salesperson / Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={salesperson}
                    onChange={(e) => setSalesperson(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Items & Service Line Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PackagePlus size={16} className="text-blue-600" />
                <span>2. Products & Services Line Items</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">{lineItems.length} Row(s)</span>
            </div>

            {/* Overflow Visible Wrapper for Dropdown Popping Out */}
            <div className="border border-slate-200 rounded-xl overflow-visible bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-8">#</th>
                    <th className="py-3 px-4 w-[36%]">Item / Service Description</th>
                    <th className="py-3 px-2 w-[10%]">HSN/SAC</th>
                    <th className="py-3 px-2 text-center w-[10%]">Qty</th>
                    <th className="py-3 px-2 text-right w-[12%]">Rate (₹)</th>
                    <th className="py-3 px-2 text-right w-[8%]">Disc %</th>
                    <th className="py-3 px-2 text-right w-[9%]">GST %</th>
                    <th className="py-3 px-3 text-right w-[12%]">Amount (₹)</th>
                    <th className="py-3 px-2 text-center w-8">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {lineItems.map((line, idx) => {
                    const baseAmt = line.quantity * line.rate;
                    const discAmt = baseAmt * (line.discountPercent / 100);
                    const taxAmt = (baseAmt - discAmt) * (line.taxPercent / 100);
                    const totalLineAmt = baseAmt - discAmt + taxAmt;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50" style={{ zIndex: 100 - idx, position: 'relative' }}>
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px] font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <ItemSearchSelect
                            selectedItemId={line.itemId}
                            onSelectItem={(selectedItem) => {
                              const updated = [...lineItems];
                              updated[idx] = {
                                ...updated[idx],
                                itemId: selectedItem.id,
                                rate: selectedItem.sellingPrice,
                                taxPercent: selectedItem.taxRate ?? 18,
                                hsnCode: selectedItem.hsnCode || '',
                                unit: selectedItem.unit || 'Pcs',
                                description: selectedItem.description || ''
                              };
                              setLineItems(updated);
                            }}
                            onClearSelection={() => {
                              const updated = [...lineItems];
                              updated[idx] = {
                                ...updated[idx],
                                itemId: '',
                                rate: 0,
                                hsnCode: '',
                                description: ''
                              };
                              setLineItems(updated);
                            }}
                            items={items}
                            onRequestCreateItem={(searchText) => {
                              setActiveItemLineIdx(idx);
                              setQuickItemSearchText(searchText);
                              setIsQuickItemOpen(true);
                            }}
                            canCreateItem={Boolean(onAddItem && !(settings?.generalFeatures?.blockNewItemsFromTransaction))}
                            placeholder="Search product name, code, SKU..."
                          />
                          {line.itemId && (
                            <input
                              type="text"
                              placeholder="Line description / notes (optional)"
                              value={line.description || ''}
                              onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                              className="w-full mt-1.5 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600 bg-slate-50/60 focus:bg-white placeholder:text-slate-400"
                            />
                          )}
                        </td>

                        <td className="py-3 px-2">
                          <input
                            type="text"
                            placeholder="HSN"
                            value={line.hsnCode || ''}
                            onChange={(e) => handleLineItemChange(idx, 'hsnCode', e.target.value)}
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-mono text-[11px] text-slate-700 bg-white"
                          />
                        </td>

                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center gap-1">
                            <NumericInput
                              value={line.quantity}
                              onChange={(val) => handleLineItemChange(idx, 'quantity', val)}
                              allowDecimal={true}
                              decimalScale={2}
                              min={0.01}
                              className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-mono text-xs font-bold text-slate-900 bg-white"
                            />
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{line.unit || 'Pcs'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-right">
                          <NumericInput
                            value={line.rate}
                            onChange={(val) => handleLineItemChange(idx, 'rate', val)}
                            allowDecimal={true}
                            decimalScale={2}
                            min={0}
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-right font-mono text-xs font-bold text-slate-900 bg-white"
                          />
                        </td>

                        <td className="py-3 px-2 text-right">
                          <NumericInput
                            value={line.discountPercent}
                            onChange={(val) => handleLineItemChange(idx, 'discountPercent', val)}
                            allowDecimal={true}
                            decimalScale={2}
                            min={0}
                            max={100}
                            className="w-full border border-slate-200 rounded px-1 py-1 text-right font-mono text-xs text-slate-700 bg-white"
                          />
                        </td>

                        <td className="py-3 px-2 text-right">
                          <select
                            value={line.taxPercent}
                            onChange={(e) => handleLineItemChange(idx, 'taxPercent', Number(e.target.value))}
                            className="w-full border border-slate-200 rounded px-1 py-1 font-mono text-xs text-slate-800 bg-white"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{totalLineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Line Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddLineRow}
              className="flex items-center space-x-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <PlusCircle size={15} className="text-blue-600" />
              <span>Add Another Item / Service Line</span>
            </button>
          </div>

          {/* SECTION 3: Totals, Terms, Notes & Bank Information */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Terms, Notes, Bank info */}
            <div className="lg:col-span-7 space-y-6">
              {/* Terms & Conditions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Terms & Conditions</h4>
                <textarea
                  placeholder="Enter terms & conditions for this proforma..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-24 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Internal / Customer Notes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notes & Remarks</h4>
                <textarea
                  placeholder="Internal remarks or customer notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Company Bank Account Info Box */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-blue-400" />
                    <span>Company Payment Bank Details</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Included on Document</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Bank Name:</span>
                    <strong>{companyBank.bankName || 'HDFC Bank Ltd.'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Account Holder:</span>
                    <strong>{companyBank.accountHolder || companyBank.companyName || 'Business Enterprise'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Account Number:</span>
                    <strong>{companyBank.accountNumber || '50200012345678'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">IFSC Code:</span>
                    <strong>{companyBank.ifscCode || 'HDFC0001234'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Calculations Breakdown */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Payment Summary & Totals
              </h4>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Total Discount:</span>
                    <span className="font-mono">-₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span>Taxable Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total GST / Tax:</span>
                  <span className="font-mono font-bold text-slate-900">₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-medium text-slate-700">Other / Freight Charges (₹):</span>
                  <NumericInput
                    value={additionalCharges}
                    onChange={(val) => setAdditionalCharges(val)}
                    allowDecimal={true}
                    decimalScale={2}
                    min={0}
                    className="w-28 border border-slate-300 rounded p-1.5 text-right font-mono text-xs font-bold text-slate-900 bg-white"
                  />
                </div>

                {totals.roundOff !== 0 && (
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Round Off:</span>
                    <span className="font-mono">{totals.roundOff > 0 ? `+₹${totals.roundOff}` : `-₹${Math.abs(totals.roundOff)}`}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-900 pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-slate-900">Proforma Grand Total:</span>
                  <span className="text-2xl font-black text-blue-600 font-mono">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Advance Requested Box */}
                <div className="pt-3 mt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Advance Requested (₹)</label>
                  <NumericInput
                    value={advanceRequested}
                    onChange={(val) => setAdvanceRequested(val)}
                    allowDecimal={true}
                    decimalScale={2}
                    min={0}
                    max={totals.total}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white"
                  />
                  <div className="flex justify-between items-center text-[11px] font-bold pt-1">
                    <span className="text-slate-500">Indicative Balance Due:</span>
                    <span className="font-mono text-slate-900">₹{totals.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR - CONSTRAINED INSIDE MAIN FORM CONTAINER AREA */}
          <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleSave(e, 'Draft')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>{isEditing ? 'Update Proforma Invoice' : 'Save Proforma Invoice'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick Create Party Modal */}
        {isQuickPartyOpen && onAddParty && (
          <QuickCreatePartyModal
            isOpen={isQuickPartyOpen}
            onClose={() => setIsQuickPartyOpen(false)}
            defaultType="Customer"
            initialSearchText={quickPartySearchText}
            existingParties={parties}
            onSaveParty={(newParty) => {
              onAddParty(newParty);
              setIsQuickPartyOpen(false);
              setTimeout(() => {
                const created = parties.find((p) => p.name.trim().toLowerCase() === newParty.name.trim().toLowerCase());
                if (created) setPartyId(created.id);
              }, 100);
            }}
          />
        )}

        {/* Quick Create Item Modal */}
        {isQuickItemOpen && onAddItem && (
          <QuickCreateItemModal
            isOpen={isQuickItemOpen}
            onClose={() => setIsQuickItemOpen(false)}
            initialSearchText={quickItemSearchText}
            existingItems={items}
            onSaveItem={(newItem) => {
              onAddItem(newItem);
              setIsQuickItemOpen(false);
              setPendingCreatedItemName(newItem.name);
            }}
          />
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Proforma Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">Issue non-fiscal price proposals, estimates, and preliminary bills before formal sales invoicing.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Proforma Invoice</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 shadow-xs items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Proforma #, Customer Name, Phone, Ref, Notes, Line Items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs font-medium focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none w-full sm:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Converted">Converted</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Proforma Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">Proforma No.</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Valid Until</th>
              <th className="p-4 text-right">Total Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <FilePlus size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {searchQuery.trim()
                          ? `No proforma invoices found matching "${searchQuery.trim()}".`
                          : 'No proforma invoices generated yet.'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery.trim()
                          ? 'Try adjusting your search criteria or clear filters.'
                          : 'Click "New Proforma Invoice" to issue a formal price quote.'}
                      </p>
                    </div>
                    {searchQuery.trim() && isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setIsCreating(true);
                        }}
                        className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Plus size={15} />
                        <span>Create New Proforma Invoice</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((pi) => (
                <tr key={pi.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4 font-mono font-extrabold text-blue-600">{pi.proformaNumber}</td>
                  <td className="p-4 font-bold text-slate-900">{pi.partyName}</td>
                  <td className="p-4 font-mono text-slate-500">{pi.date}</td>
                  <td className="p-4 font-mono text-slate-500">{pi.validUntil || '—'}</td>
                  <td className="p-4 text-right font-mono font-extrabold text-slate-900">
                    ₹{pi.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                        pi.status === 'Converted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pi.status === 'Draft'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : pi.status === 'Accepted'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : pi.status === 'Sent'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {pi.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      {/* Print / Preview */}
                      <button
                        type="button"
                        onClick={() => setViewingProforma(pi)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Print / PDF Preview"
                      >
                        <Printer size={15} />
                      </button>

                      {/* Edit */}
                      {isAdmin && pi.status !== 'Converted' && (
                        <button
                          type="button"
                          onClick={() => startEditProforma(pi)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Proforma"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}

                      {/* Duplicate */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenDuplicate(pi)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Duplicate (Save as New)"
                        >
                          <Copy size={15} />
                        </button>
                      )}

                      {/* Mark Accepted / Convert */}
                      {pi.status !== 'Converted' && pi.status !== 'Cancelled' && (
                        <>
                          {pi.status !== 'Accepted' && (
                            <button
                              type="button"
                              onClick={() => onUpdateProformaStatus(pi.id, 'Accepted')}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Mark as Accepted by Client"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Convert Proforma ${pi.proformaNumber} into a Sales Tax Invoice? This will generate a new Tax Invoice and log stock/accounting entries.`)) {
                                onConvertToSalesInvoice(pi.id);
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Convert to Sales Tax Invoice"
                          >
                            <FileText size={15} />
                          </button>
                        </>
                      )}

                      {/* Delete */}
                      {isAdmin && onDeleteProforma && (
                        <button
                          type="button"
                          onClick={() => setDeletingProforma(pi)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 size={15} />
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

      {/* Print View Modal */}
      {viewingProforma && (
        <DocumentPrintView
          documentType="proforma_invoice"
          data={viewingProforma}
          settings={settings}
          parties={parties}
          onClose={() => setViewingProforma(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProforma && (
        <DeleteConfirmationModal
          isOpen={!!deletingProforma}
          onClose={() => setDeletingProforma(null)}
          onConfirm={() => {
            if (onDeleteProforma && deletingProforma) {
              const performDelete = () => {
                onDeleteProforma(deletingProforma.id);
                setDeletingProforma(null);
              };
              if (onCheckPin) {
                onCheckPin('delete_record', performDelete);
              } else {
                performDelete();
              }
            }
          }}
          title="Delete Proforma Invoice"
          recordType="Proforma Invoice"
          recordNumber={deletingProforma.proformaNumber}
          partyName={deletingProforma.partyName}
          date={deletingProforma.date}
          amount={deletingProforma.total ?? 0}
          impactSummary={`Proforma Invoice ${deletingProforma.proformaNumber} for ₹${(deletingProforma.total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be moved to Trash. This is a non-posting document and will not affect stock or ledger accounts.`}
          isBlocked={deletingProforma.status === 'Converted'}
          blockedReason={`This Proforma Invoice has already been converted to a Sales Invoice and cannot be deleted directly.`}
        />
      )}
    </div>
  );
}
