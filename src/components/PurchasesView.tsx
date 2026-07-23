import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ShoppingBag,
  Download,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Printer,
  Copy,
  X,
  UserPlus,
  PackagePlus,
  FilePlus
} from 'lucide-react';
import { Purchase, Party, Item, PurchaseLineItem, AppSettings } from '../types';
import DocumentPrintView from './DocumentPrintView';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';
import QuickCreatePartyModal from './QuickCreatePartyModal';
import QuickCreateItemModal from './QuickCreateItemModal';

interface PurchasesViewProps {
  purchases: Purchase[];
  parties: Party[];
  items: Item[];
  onAddPurchase: (purchasePayload: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => void;
  onDeletePurchase?: (id: string) => void;
  onAddParty?: (party: Omit<Party, 'id' | 'code' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => void;
  onAddItem?: (item: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function PurchasesView({
  purchases,
  parties,
  items,
  onAddPurchase,
  onDeletePurchase,
  onAddParty,
  onAddItem,
  isAdmin,
  settings
}: PurchasesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [printingPurchase, setPrintingPurchase] = useState<Purchase | null>(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  // Quick Create Modals
  const [isQuickPartyOpen, setIsQuickPartyOpen] = useState(false);
  const [quickPartySearchText, setQuickPartySearchText] = useState('');
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [quickItemSearchText, setQuickItemSearchText] = useState('');
  const [activeItemLineIdx, setActiveItemLineIdx] = useState<number | null>(null);

  // Supplier list filter (Supplier or Both)
  const suppliers = parties.filter((p) => p.type === 'Supplier' || p.type === 'Both' && p.isActive);
  // Item list filter (Physical stock items, not services)
  const buyableItems = items.filter((it) => it.type !== 'Laboratory Service' && it.isActive);

  // Form Fields State
  const [partyId, setPartyId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [storageLocation, setStorageLocation] = useState('Central Store A');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<Omit<PurchaseLineItem, 'id' | 'taxAmount' | 'amount'>[]>([
    { itemId: '', itemName: '', quantity: 1, rate: 0, taxPercent: 18 }
  ]);

  const handleOpenDuplicate = (p: Purchase) => {
    setPartyId(p.partyId);
    setSupplierInvoiceNumber(p.supplierInvoiceNumber ? p.supplierInvoiceNumber + ' (Copy)' : '');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setStorageLocation(p.storageLocation || 'Central Store A');
    setNotes(p.notes || '');
    setAmountPaid(0);
    setLineItems(p.items.map(it => ({
      itemId: it.itemId,
      itemName: it.itemName,
      quantity: it.quantity,
      rate: it.rate,
      taxPercent: it.taxPercent,
      batchNumber: it.batchNumber,
      expiryDate: it.expiryDate
    })));
    setIsAdding(true);
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { itemId: '', itemName: '', quantity: 1, rate: 0, taxPercent: 18 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = lineItems.map((item, i) => {
      if (i === idx) {
        let name = item.itemName;
        let rate = item.rate;
        let taxPercent = item.taxPercent;
        if (field === 'itemId') {
          const matched = buyableItems.find((x) => x.id === val);
          name = matched ? matched.name : '';
          rate = matched ? matched.purchasePrice : 0;
          taxPercent = matched ? matched.taxRate : 18;
        }
        return {
          ...item,
          [field]: val,
          itemName: name,
          rate: field === 'itemId' ? rate : field === 'rate' ? val : item.rate,
          taxPercent: field === 'itemId' ? taxPercent : field === 'taxPercent' ? val : item.taxPercent,
          quantity: field === 'quantity' ? val : item.quantity
        };
      }
      return item;
    });
    setLineItems(updated);
  };

  // Live total calculations
  const subtotal = lineItems.reduce((sum, item) => sum + toSafeNumber(item.quantity) * toSafeNumber(item.rate), 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + (toSafeNumber(item.quantity) * toSafeNumber(item.rate) * (toSafeNumber(item.taxPercent) / 100)), 0);
  const discountAmount = 0; // Simple flat
  const total = parseFloat((subtotal + taxAmount - discountAmount).toFixed(2));
  const safeAmountPaid = toSafeNumber(amountPaid);
  const balanceDue = parseFloat((total - safeAmountPaid).toFixed(2));
  const paymentStatus = balanceDue <= 0 ? 'Paid' : safeAmountPaid > 0 ? 'Partially Paid' : 'Unpaid';

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      alert('Please select a supplier.');
      return;
    }
    if (lineItems.some((line) => !line.itemId)) {
      alert('Please select valid catalog items for all lines.');
      return;
    }

    const supplierObj = suppliers.find((s) => s.id === partyId)!;

    // Build finalized items
    const purchaseLines: PurchaseLineItem[] = lineItems.map((line, idx) => {
      const q = toSafeNumber(line.quantity);
      const r = toSafeNumber(line.rate);
      const t = toSafeNumber(line.taxPercent);
      const lineSub = q * r;
      const lineTax = parseFloat((lineSub * (t / 100)).toFixed(2));
      return {
        id: `pl-${Date.now()}-${idx}`,
        itemId: line.itemId,
        itemName: line.itemName,
        quantity: q,
        rate: r,
        taxPercent: t,
        taxAmount: lineTax,
        amount: parseFloat((lineSub + lineTax).toFixed(2)),
        batchNumber: line.batchNumber,
        mfgDate: line.mfgDate,
        expiryDate: line.expiryDate
      };
    });

    onAddPurchase({
      partyId,
      partyName: supplierObj.name,
      supplierInvoiceNumber,
      purchaseDate,
      dueDate,
      items: purchaseLines,
      subtotal,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount,
      total,
      amountPaid: safeAmountPaid,
      balanceDue,
      paymentStatus,
      storageLocation,
      notes
    });

    // Reset Form
    setIsAdding(false);
    setPartyId('');
    setSupplierInvoiceNumber('');
    setAmountPaid(0);
    setNotes('');
    setLineItems([{ itemId: '', itemName: '', quantity: 1, rate: 0, taxPercent: 18 }]);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Purchase ID,Supplier,Date,Total,Amount Paid,Balance Due,Status\n';
    purchases.forEach((p) => {
      csvContent += `"${p.purchaseNumber}","${p.partyName}","${p.purchaseDate}",${p.total},${p.amountPaid},${p.balanceDue},"${p.paymentStatus}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BizOps_Purchases_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find(party => party.id === p.partyId);
    const matchesSearch =
      !q ||
      (p.purchaseNumber && p.purchaseNumber.toLowerCase().includes(q)) ||
      (p.partyName && p.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (party?.alternatePhone && party.alternatePhone.toLowerCase().includes(q)) ||
      (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.items && p.items.some(it => it.itemName.toLowerCase().includes(q) || (it.batchNumber && it.batchNumber.toLowerCase().includes(q))));

    const matchesStatus = filterStatus === 'All' || p.paymentStatus === filterStatus;
    const matchesDate = (!startDate || p.purchaseDate >= startDate) && (!endDate || p.purchaseDate <= endDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (isAdding) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Finance</span>
              <span className="text-slate-300">/</span>
              <span>Purchases</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">Record Inbound Purchase</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Record Supplier Purchase Bill & Inbound Stock
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Register inbound purchases, inventory items, and handle accounts payable. This will automatically increase physical stock levels.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsAdding(false); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Purchase Ledger
            </button>
          </div>
        </div>

        {/* Full-width Form Layout */}
        <form onSubmit={handleSavePurchase} className="space-y-8 pb-20">
          
          {/* SECTION 1: Supplier & Billing Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Supplier & Invoice Details</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">Active Supplier <span className="text-red-500">*</span></label>
                  {onAddParty && !(settings?.generalFeatures?.blockNewPartiesFromTransaction) && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPartySearchText('');
                        setIsQuickPartyOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>+ Quick New Supplier</span>
                    </button>
                  )}
                </div>
                <select
                  required
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {(settings?.generalFeatures?.blockNewPartiesFromTransaction) && (
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    ⚠️ Party creation from purchase forms is disabled in settings.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Supplier Bill / Invoice No.</label>
                <input
                  type="text"
                  placeholder="e.g. GST-4902-BL"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Purchase Date</label>
                <input
                  type="date"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold font-mono"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Payment Due Date</label>
                <input
                  type="date"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold font-mono"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Purchase Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Purchase Items / Stock Materials</h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Material Line</span>
              </button>
            </div>
            <div className="h-px bg-[#E5EAF0] w-full mt-1" />

            <div className="space-y-3.5">
              {lineItems.map((line, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/65 p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-end font-sans">
                  <div className="col-span-1 md:col-span-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Product / Material Name</label>
                      {onAddItem && !(settings?.generalFeatures?.blockNewItemsFromTransaction) && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveItemLineIdx(idx);
                            setQuickItemSearchText('');
                            setIsQuickItemOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <PackagePlus size={13} />
                          <span>+ Quick New Item</span>
                        </button>
                      )}
                    </div>
                    <select
                      required
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                      value={line.itemId}
                      onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                    >
                      <option value="">-- Select Active Material --</option>
                      {buyableItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.unit})
                        </option>
                      ))}
                    </select>
                    {(settings?.generalFeatures?.blockNewItemsFromTransaction) && (
                      <p className="text-[10px] text-amber-700 mt-1 font-medium">
                        ⚠️ Item creation from purchase forms is disabled in settings.
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Inbound Qty</label>
                    <NumericInput
                      value={line.quantity}
                      onChange={(val) => handleLineChange(idx, 'quantity', val)}
                      allowDecimal={true}
                      decimalScale={3}
                      min={0}
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Buy Rate (₹)</label>
                    <NumericInput
                      value={line.rate}
                      onChange={(val) => handleLineChange(idx, 'rate', val)}
                      allowDecimal={true}
                      decimalScale={2}
                      min={0}
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Rate (%)</label>
                    <NumericInput
                      value={line.taxPercent}
                      onChange={(val) => handleLineChange(idx, 'taxPercent', val)}
                      allowDecimal={true}
                      decimalScale={2}
                      min={0}
                      max={100}
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Code</label>
                      <input
                        type="text"
                        placeholder="BATCH-ID"
                        className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                        value={line.batchNumber || ''}
                        onChange={(e) => handleLineChange(idx, 'batchNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full h-[40px] px-2 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                        value={line.expiryDate || ''}
                        onChange={(e) => handleLineChange(idx, 'expiryDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lineItems.length === 1}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 hover:border-red-200 transition disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Storage, Payment, calculations */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Storage & Financial Accounting</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
              <div className="col-span-1 lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Storage Facility Location / Room</label>
                    <input
                      type="text"
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount Paid (INR) *</label>
                    <NumericInput
                      value={amountPaid}
                      onChange={(val) => setAmountPaid(val)}
                      allowDecimal={true}
                      decimalScale={2}
                      min={0}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono text-emerald-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Administrative & Processing Notes</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="E.g. Verified package seal, logged temperature on arrival..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="col-span-1 lg:col-span-5 bg-slate-50 border border-[#D8E0EA] p-5 rounded-xl space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Voucher Summary</p>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Material Subtotal:</span>
                    <span className="text-slate-800 font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">CGST + SGST (Integrated):</span>
                    <span className="text-slate-800 font-bold">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>Grand Total Bill:</span>
                    <span className="text-lg">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-600">
                    <span>Voucher Amount Paid:</span>
                    <span>₹{amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-red-600 border-t border-dashed border-slate-200 pt-2">
                    <span>Accounts Payable Outstanding:</span>
                    <span>₹{balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions sticky bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-6 flex items-center justify-between z-40">
            <button
              type="button"
              onClick={() => { setIsAdding(false); }}
              className="px-4 py-2 border border-[#D8E0EA] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Discard
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
            >
              Register & Finalize Stock-In
            </button>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Suppliers Purchases & Stock Inbound</h2>
          <p className="text-xs text-slate-500 mt-1">Book items, materials, and equipment purchases. Auto-adds warehouse stock quantities.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkPrinting(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-xs hover:bg-slate-50 transition"
          >
            <Printer size={13} />
            <span>Print All</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
            title="Download CSV report of all purchase records"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus size={14} />
            <span>Record Inbound Purchase</span>
          </button>
        </div>
      </div>

      {/* Main List Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* List Table panel */}
          <div className="col-span-1 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
              <div className="relative max-w-sm w-full flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search purchase #, supplier, ref #, items..."
                  className="pl-9 pr-8 py-1.5 w-full bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  {filteredPurchases.length} Matching
                </span>
              )}

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <Calendar size={13} className="text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-300">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                <select
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Invoices</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredPurchases.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FilePlus size={24} />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">
                    {searchQuery.trim()
                      ? `No purchase bills found matching "${searchQuery.trim()}".`
                      : 'No inbound purchase bills registered'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery.trim()
                      ? 'Would you like to record a new purchase bill for this query?'
                      : 'Click "Record Inbound Purchase" to log inventory stock increments.'}
                  </p>
                  {searchQuery.trim() && isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAdding(true)}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Record Inbound Purchase Bill</span>
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                      <th className="p-3">Inbound Code</th>
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3">Inbound Date</th>
                      <th className="p-3 text-right">Invoice Sum</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedPurchase(p)}>
                        <td className="p-3 font-bold text-blue-600 font-mono">{p.purchaseNumber}</td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-700">{p.partyName}</p>
                          {p.supplierInvoiceNumber && (
                            <p className="text-[10px] text-slate-400 font-mono">Ref: {p.supplierInvoiceNumber}</p>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{p.purchaseDate}</td>
                        <td className="p-3 text-right font-bold text-slate-700">₹{p.total.toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold text-red-600">₹{p.balanceDue.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <ChevronRight size={14} className="text-slate-400 inline" />
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Detail Canvas */}
          <div className="col-span-1 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            {selectedPurchase ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">
                      {selectedPurchase.purchaseNumber}
                    </span>
                    <h3 className="font-extrabold text-slate-800 mt-1">{selectedPurchase.partyName}</h3>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setPrintingPurchase(selectedPurchase)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded border border-slate-200"
                      title="Print Receipt"
                    >
                      <Printer size={13} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenDuplicate(selectedPurchase)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded border border-indigo-200"
                        title="Duplicate Purchase (Save as New)"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                    {isAdmin && onDeletePurchase && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete Purchase Invoice ${selectedPurchase.purchaseNumber}?`)) {
                            onDeletePurchase(selectedPurchase.id);
                            setSelectedPurchase(null);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded border border-rose-200"
                        title="Move to Trash"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 block font-semibold">Inbound Date:</span>
                    <strong className="text-slate-700">{selectedPurchase.purchaseDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Due Date:</span>
                    <strong className="text-slate-700">{selectedPurchase.dueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Location:</span>
                    <strong className="text-slate-700">{selectedPurchase.storageLocation || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Reference Bill:</span>
                    <strong className="text-slate-700 font-mono">{selectedPurchase.supplierInvoiceNumber || 'N/A'}</strong>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoiced Materials</p>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/30">
                    {selectedPurchase.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-700">{it.itemName}</p>
                          <p className="text-[10px] text-slate-400">
                            Qty: {it.quantity} × ₹{it.rate} ({it.taxPercent}% Tax)
                          </p>
                          {it.batchNumber && (
                            <p className="text-[9px] text-blue-500 font-bold font-mono">
                              Batch: {it.batchNumber} {it.expiryDate ? `| Exp: ${it.expiryDate}` : ''}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-800">₹{it.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Panel */}
                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Subtotal:</span>
                    <span className="font-bold text-slate-700">₹{selectedPurchase.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Tax Charges (GST):</span>
                    <span className="font-bold text-slate-700">₹{selectedPurchase.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="font-extrabold text-slate-800">Grand Total:</span>
                    <span className="font-black text-slate-800">₹{selectedPurchase.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5 text-slate-600 font-semibold">
                    <span>Paid Amount:</span>
                    <span className="text-emerald-600 font-bold">₹{selectedPurchase.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Outstanding Due:</span>
                    <span>₹{selectedPurchase.balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                <p className="font-bold">Select a purchase bill</p>
                <p className="text-xs mt-0.5">Click any list row to view detailed item breakdowns and batch certificates.</p>
              </div>
            )}
          </div>
        </div>
      {printingPurchase && (
        <DocumentPrintView
          documentType="purchase"
          data={printingPurchase}
          settings={settings}
          onClose={() => setPrintingPurchase(null)}
        />
      )}

      {isBulkPrinting && (
        <DocumentPrintView
          documentType="transaction_list"
          data={{
            title: 'Purchase Transaction Register',
            dateRange: `${startDate || 'Start'} to ${endDate || 'End'}`,
            columns: ['Date', 'Purchase #', 'Supplier', 'Total', 'Paid', 'Balance'],
            rows: filteredPurchases.map(p => [
              p.purchaseDate,
              p.purchaseNumber,
              p.partyName,
              p.total,
              p.amountPaid,
              p.balanceDue
            ]),
            totals: [
              '',
              'TOTAL',
              '',
              filteredPurchases.reduce((sum, p) => sum + p.total, 0),
              filteredPurchases.reduce((sum, p) => sum + p.amountPaid, 0),
              filteredPurchases.reduce((sum, p) => sum + p.balanceDue, 0)
            ]
          }}
          settings={settings}
          onClose={() => setIsBulkPrinting(false)}
        />
      )}

      {/* Quick Create Party Modal */}
      {isQuickPartyOpen && onAddParty && (
        <QuickCreatePartyModal
          isOpen={isQuickPartyOpen}
          onClose={() => setIsQuickPartyOpen(false)}
          defaultType="Supplier"
          initialSearchText={quickPartySearchText}
          existingParties={parties}
          onSaveParty={(newParty) => {
            onAddParty(newParty);
            setIsQuickPartyOpen(false);
            setTimeout(() => {
              const created = parties.find(p => p.name.toLowerCase() === newParty.name.toLowerCase());
              if (created) setPartyId(created.id);
            }, 50);
          }}
        />
      )}

      {/* Quick Create Item Modal */}
      {isQuickItemOpen && onAddItem && (
        <QuickCreateItemModal
          isOpen={isQuickItemOpen}
          onClose={() => {
            setIsQuickItemOpen(false);
            setActiveItemLineIdx(null);
          }}
          initialSearchText={quickItemSearchText}
          existingItems={items}
          onSaveItem={(newItem) => {
            onAddItem(newItem);
            setIsQuickItemOpen(false);
            if (activeItemLineIdx !== null) {
              setTimeout(() => {
                const created = items.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                if (created) {
                  setLineItems(prev => prev.map((l, idx) => idx === activeItemLineIdx ? {
                    ...l,
                    itemId: created.id,
                    purchasePrice: created.purchasePrice || created.sellingPrice,
                    taxPercent: created.taxRate ?? 18
                  } : l));
                }
              }, 50);
            }
            setActiveItemLineIdx(null);
          }}
        />
      )}
    </div>
  );
}
