import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Package,
  Download,
  AlertTriangle,
  FileText,
  ChevronRight,
  Bookmark,
  Copy,
  X,
  PackagePlus,
  AlertCircle,
  Sliders,
  History,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { Item, ItemType, Party, AppSettings, StockMovement, Invoice, Purchase, Quotation } from '../types';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';
import {
  getPrefillParamsFromUrl,
  updateUrlWithPrefill,
  clearPrefillFromUrl,
  findExactMatch
} from '../utils/searchOrCreate';
import { SearchOrCreateInput } from './SearchOrCreateInput';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ItemsViewProps {
  items: Item[];
  parties: Party[];
  stockMovements?: StockMovement[];
  onAddItem: (item: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => void;
  onEditItem: (id: string, item: Partial<Item>) => void;
  onAdjustStock?: (adjustment: {
    itemId: string;
    adjustmentType: 'Adjustment' | 'Purchase In' | 'Sale Out' | 'Damaged' | 'Expired';
    quantity: number;
    notes?: string;
    batchNumber?: string;
    expiryDate?: string;
  }) => void;
  onDeactivateItem: (id: string) => void;
  onReactivateItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  isAdmin: boolean;
  settings?: AppSettings;
  invoices?: Invoice[];
  purchases?: Purchase[];
  quotations?: Quotation[];
}

export default function ItemsView({
  items,
  parties,
  stockMovements = [],
  onAddItem,
  onEditItem,
  onAdjustStock,
  onDeactivateItem,
  onReactivateItem,
  onDeleteItem,
  isAdmin,
  invoices = [],
  purchases = [],
  quotations = []
}: ItemsViewProps) {
  // Navigation & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('All');
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  // Form states
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<ItemType>('Inventory Product');
  const [unit, setUnit] = useState('Bottle');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [openingStock, setOpeningStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [storageLocation, setStorageLocation] = useState('');
  const [batchTracking, setBatchTracking] = useState(true);
  const [expiryTracking, setExpiryTracking] = useState(true);
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');

  // Stock Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [adjMode, setAdjMode] = useState<'delta' | 'count'>('delta');
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjCount, setAdjCount] = useState<number>(0);
  const [adjType, setAdjType] = useState<'Adjustment' | 'Purchase In' | 'Sale Out' | 'Damaged' | 'Expired'>('Adjustment');
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjBatch, setAdjBatch] = useState<string>('');
  const [adjExpiry, setAdjExpiry] = useState<string>('');

  // Delete Modal State
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const handleOpenAdjustStock = (item: Item) => {
    setAdjustingItem(item);
    setAdjMode('delta');
    setAdjQty(0);
    setAdjCount(item.currentStock);
    setAdjType('Adjustment');
    setAdjNotes('');
    setAdjBatch(item.barcode || '');
    setAdjExpiry('');
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || !onAdjustStock) return;

    let delta = 0;
    if (adjMode === 'count') {
      delta = adjCount - adjustingItem.currentStock;
    } else {
      delta = adjQty;
    }

    if (delta === 0) {
      alert('Stock adjustment delta is 0. Please enter a non-zero adjustment quantity or new physical count.');
      return;
    }

    onAdjustStock({
      itemId: adjustingItem.id,
      adjustmentType: adjType,
      quantity: delta,
      notes: adjNotes || `Stock adjustment (${adjMode === 'count' ? `Physical Count: ${adjCount}` : `Delta: ${delta > 0 ? '+' : ''}${delta}`})`,
      batchNumber: adjBatch,
      expiryDate: adjExpiry
    });

    setAdjustingItem(null);
  };

  const isItemInUse = (item: Item) => {
    const inInv = invoices.some(inv => inv.items?.some(i => i.itemId === item.id));
    const inPur = purchases.some(pur => pur.items?.some((i: any) => i.itemId === item.id));
    const inQuote = quotations.some(q => q.items?.some(i => i.itemId === item.id));
    return inInv || inPur || inQuote;
  };

  // Check URL prefill query parameters on load
  useEffect(() => {
    const params = getPrefillParamsFromUrl();
    if (params.prefillName) {
      resetForm();
      setName(params.prefillName);
      setPrefillNotice(`Creating a new item from search: "${params.prefillName}"`);
      setIsOpenForm(true);
      clearPrefillFromUrl();
    }
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setType('Inventory Product');
    setUnit('Bottle');
    setBarcode('');
    setHsnCode('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setTaxRate(18);
    setOpeningStock(0);
    setMinimumStock(5);
    setStorageLocation('');
    setBatchTracking(true);
    setExpiryTracking(true);
    setSupplierId('');
    setDescription('');

    setSelectedItemId(null);
    setIsEditMode(false);
    setPrefillNotice(null);
  };

  const handleOpenAdd = (initialName?: string | any) => {
    resetForm();
    if (initialName && typeof initialName === 'string') {
      setName(initialName);
      setPrefillNotice(`Creating a new item from search: "${initialName}"`);
      updateUrlWithPrefill('items', { prefillName: initialName });
    }
    setIsEditMode(false);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (item: Item) => {
    setName(item.name);
    setCategory(item.category);
    setType(item.type);
    setUnit(item.unit);
    setBarcode(item.barcode || '');
    setHsnCode(item.hsnCode || '');
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setTaxRate(item.taxRate);
    setOpeningStock(item.openingStock);
    setMinimumStock(item.minimumStock);
    setStorageLocation(item.storageLocation || '');
    setBatchTracking(item.batchTracking);
    setExpiryTracking(item.expiryTracking);
    setSupplierId(item.supplierId || '');
    setDescription(item.description || '');

    setSelectedItemId(item.id);
    setIsEditMode(true);
    setIsOpenForm(true);
  };

  const handleOpenDuplicate = (item: Item) => {
    setName(item.name + ' (Copy)');
    setCategory(item.category);
    setType(item.type);
    setUnit(item.unit);
    setBarcode(item.barcode || '');
    setHsnCode(item.hsnCode || '');
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setTaxRate(item.taxRate);
    setOpeningStock(item.openingStock);
    setMinimumStock(item.minimumStock);
    setStorageLocation(item.storageLocation || '');
    setBatchTracking(item.batchTracking);
    setExpiryTracking(item.expiryTracking);
    setSupplierId(item.supplierId || '');
    setDescription(item.description || '');

    setSelectedItemId(null); // Save as new
    setIsEditMode(false);
    setIsOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      alert('Please enter Name and Category');
      return;
    }

    // Duplicate check
    const match = findExactMatch(
      items.filter((i) => i.id !== selectedItemId),
      name,
      ['name', 'barcode', 'hsnCode']
    );
    if (match) {
      if (
        !confirm(
          `An item named "${match.name}" already exists in your catalog. Are you sure you want to save a duplicate?`
        )
      ) {
        return;
      }
    }

    const payload = {
      name,
      category,
      type,
      unit,
      barcode,
      hsnCode,
      purchasePrice: toSafeNumber(purchasePrice),
      sellingPrice: toSafeNumber(sellingPrice),
      taxRate: toSafeNumber(taxRate),
      openingStock: toSafeNumber(openingStock),
      minimumStock: toSafeNumber(minimumStock),
      storageLocation,
      batchTracking,
      expiryTracking,
      supplierId,
      description
    };

    if (isEditMode && selectedItemId) {
      onEditItem(selectedItemId, payload);
    } else {
      onAddItem(payload);
    }
    setIsOpenForm(false);
    resetForm();
  };

  // Filter core logic
  const filteredItems = items.filter((it) => {
    // 1. Search Box
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.code && it.code.toLowerCase().includes(q)) ||
      (it.category && it.category.toLowerCase().includes(q)) ||
      (it.barcode && it.barcode.toLowerCase().includes(q)) ||
      (it.hsnCode && it.hsnCode.toLowerCase().includes(q)) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      (it.storageLocation && it.storageLocation.toLowerCase().includes(q)) ||
      (it.type && it.type.toLowerCase().includes(q));

    // 2. Category Filter
    const matchesCategory = filterCategory === 'All' || it.category === filterCategory;

    // 3. Stock Alerts
    let matchesStock = true;
    if (filterStockStatus === 'Low') {
      matchesStock = it.currentStock <= it.minimumStock;
    } else if (filterStockStatus === 'Out') {
      matchesStock = it.currentStock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get unique categories for dropdown filter
  const uniqueCategories = Array.from(
    new Set(
      items.map((it) => it.category)
    )
  );

  // Export CSV of catalog
  const handleExportCSV = () => {
    const headers = 'Code,Product Name,Category,Type,Stock Unit,Current Stock,Min Alert Stock,Purchase Price,Selling Price\n';
    const rows = filteredItems
      .map(
        (it) =>
          `"${it.code}","${it.name}","${it.category}","${it.type}","${it.unit}","${it.currentStock}","${it.minimumStock}","₹${it.purchasePrice}","₹${it.sellingPrice}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Catalog_Products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const suppliers = parties.filter((p) => p.type === 'Supplier' || p.type === 'Both');

  if (isOpenForm) {
    return (
      <div className="space-y-6 pb-20">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Catalog</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">{isEditMode ? 'Edit Item' : 'Add Item'}</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              {isEditMode ? `Edit Catalog Details: ${name}` : `Create New Catalog Product`}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEditMode ? 'Modify and update specifications for this catalog item.' : 'Register a new product inside your inventory.'}
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsOpenForm(false); resetForm(); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>

        {prefillNotice && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <PackagePlus size={16} className="text-blue-600 shrink-0" />
              <span>{prefillNotice}</span>
            </div>
            <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">
              Prefilled
            </span>
          </div>
        )}

        {/* Full-width Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          {/* SECTION 1: Item Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">General Catalog Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Item Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Office Supply or Hardware Item"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Catalog Category <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chemical, Consumable"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Operational Type Classification <span className="text-red-500">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ItemType)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                >
                  <option value="Product">Inventory General Product</option>
                  <option value="Material">Raw Material</option>
                  <option value="Supply">Office / Maintenance Supply</option>
                  <option value="Equipment">Operating Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Stock / Billing Unit <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bottle, Box, Gram"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">GST/Tax Rate (%) <span className="text-red-500">*</span></label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                >
                  <option value="0">GST Nil Rated (0%)</option>
                  <option value="5">GST 5%</option>
                  <option value="12">GST 12%</option>
                  <option value="18">GST 18% (Standard Services)</option>
                  <option value="28">GST 28%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Selling Price (INR, 0 if unused)
                </label>
                <NumericInput
                  required
                  value={sellingPrice}
                  onChange={(val) => setSellingPrice(val)}
                  allowDecimal={true}
                  decimalScale={2}
                  min={0}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">HSN Code (GST Billing)</label>
                <input
                  type="text"
                  placeholder="8-digit HSN code"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Item Barcode (Optional)</label>
                <input
                  type="text"
                  placeholder="Scan or enter code"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Stock Limits */}
          <div className="space-y-4 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">
                Product Stock Limits
              </h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Opening Stock Qty *</label>
                <NumericInput
                  disabled={isEditMode}
                  value={openingStock}
                  onChange={(val) => setOpeningStock(val)}
                  allowDecimal={true}
                  decimalScale={3}
                  min={0}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Minimum Buffer / Alert Stock *</label>
                <NumericInput
                  value={minimumStock}
                  onChange={(val) => setMinimumStock(val)}
                  allowDecimal={true}
                  decimalScale={3}
                  min={0}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Standard Purchase Unit Cost (INR)</label>
                <NumericInput
                  value={purchasePrice}
                  onChange={(val) => setPurchasePrice(val)}
                  allowDecimal={true}
                  decimalScale={2}
                  min={0}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse A, Shelf 1"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Primary Supplier Link</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-medium"
                >
                  <option value="">No linked supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.contactPerson || 'no contact'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex space-x-6 pt-7">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchTracking}
                    onChange={(e) => setBatchTracking(e.target.checked)}
                    className="rounded border-[#D8E0EA] text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Enable Batch Tracking</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiryTracking}
                    onChange={(e) => setExpiryTracking(e.target.checked)}
                    className="rounded border-[#D8E0EA] text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Track Expiry Date</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: Catalog Description */}
          <div className="space-y-4 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Additional Catalog Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Catalog Description / Safety warnings</label>
                <textarea
                  rows={2}
                  placeholder="Add specific handling specifications, purity levels, or general notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[56px] p-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-6 py-3.5 px-6 bg-white border-t border-[#E5EAF0] flex items-center justify-between shadow-md z-20">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs transition"
            >
              Reset Form
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => { setIsOpenForm(false); resetForm(); }}
                className="px-4 py-2 border border-[#D8E0EA] bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isEditMode ? 'Save & Update Catalog Record' : 'Save & Register Item'}
              </button>
            </div>
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">Configure your product catalog, stock items, and consumables.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition bg-white"
          >
            <Download size={14} />
            <span>Export Catalog</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition animate-fade-in"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by Name, SKU, Barcode, HSN, Category, Brand/Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                const exact = findExactMatch(items, searchQuery.trim(), ['name', 'code', 'barcode', 'sku']);
                if (!exact) {
                  e.preventDefault();
                  handleOpenAdd(searchQuery.trim());
                }
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
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
            {filteredItems.length} Matching
          </span>
        )}

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 font-bold">Category</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-700 font-semibold"
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Alert Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 font-bold">Stock levels</span>
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-700 font-semibold"
          >
            <option value="All">All Stock Levels</option>
            <option value="Low">Low Stock Alert</option>
            <option value="Out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ITEMS CATALOG DISPLAY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type / Category</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Purchase Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Alert Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <Package size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {searchQuery.trim()
                            ? `No matching item found for "${searchQuery.trim()}".`
                            : 'No items in catalog yet.'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchQuery.trim()
                            ? 'Would you like to register this as a new catalog product?'
                            : 'Click "Add Product" to create your first item.'}
                        </p>
                      </div>
                      {searchQuery.trim() && isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(searchQuery.trim())}
                          className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Plus size={15} />
                          <span>Add "{searchQuery.trim()}" as a new item</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  const isOut = item.currentStock <= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          {item.storageLocation && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Location: {item.storageLocation}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-600 block">{item.category}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                        ₹{item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#163A5F]">
                        ₹{item.sellingPrice > 0 ? item.sellingPrice.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-block text-[9px] font-extrabold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="inline-block text-[9px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                            ADEQUATE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenAdjustStock(item)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-extrabold flex items-center space-x-1 transition cursor-pointer"
                              title="Adjust Product Stock"
                            >
                              <Sliders size={12} />
                              <span>Adjust</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                              title="Edit Item Details"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => handleOpenDuplicate(item)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded cursor-pointer"
                              title="Duplicate Item (Save as New)"
                            >
                              <Copy size={13} />
                            </button>

                            {onDeleteItem && (
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer"
                                title="Move to Trash"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Adjust Stock Level</h3>
                  <p className="text-xs text-slate-300 font-medium">Item: <span className="text-blue-300 font-bold">{adjustingItem.name}</span> ({adjustingItem.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="p-6 space-y-4 text-xs text-slate-700">
              {/* Current Stock Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                <div>
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Current Recorded Stock</span>
                  <p className="text-lg font-black text-slate-900">{adjustingItem.currentStock} {adjustingItem.unit}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[10px] uppercase">Min Alert Stock</span>
                  <p className="text-sm font-bold text-slate-700">{adjustingItem.minimumStock} {adjustingItem.unit}</p>
                </div>
              </div>

              {/* Adjustment Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjustment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjMode('delta')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition cursor-pointer ${adjMode === 'delta' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Quantity Difference (+ / -)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjMode('count')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition cursor-pointer ${adjMode === 'count' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    New Physical Count
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              {adjMode === 'delta' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Quantity Change (e.g. +10 or -5) *</label>
                  <NumericInput
                    value={adjQty}
                    onChange={(val) => setAdjQty(val)}
                    allowDecimal={true}
                    decimalScale={3}
                    className="w-full h-[40px] px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    New stock level will be: <span className="font-bold text-blue-700">{Math.max(0, adjustingItem.currentStock + adjQty)} {adjustingItem.unit}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Actual Physical Count *</label>
                  <NumericInput
                    value={adjCount}
                    onChange={(val) => setAdjCount(val)}
                    allowDecimal={true}
                    decimalScale={3}
                    min={0}
                    className="w-full h-[40px] px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Adjustment delta: <span className={`font-bold ${adjCount - adjustingItem.currentStock >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{adjCount - adjustingItem.currentStock >= 0 ? '+' : ''}{adjCount - adjustingItem.currentStock} {adjustingItem.unit}</span>
                  </p>
                </div>
              )}

              {/* Adjustment Type / Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Reason / Classification *</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full h-[40px] px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Adjustment">Physical Count Reconciliation</option>
                  <option value="Purchase In">Stock In / Received Excess</option>
                  <option value="Sale Out">Stock Out / Manual Issue</option>
                  <option value="Damaged">Damaged / Spoiled Goods</option>
                  <option value="Expired">Expired Product Removal</option>
                </select>
              </div>

              {/* Batch & Expiry (if enabled) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Batch Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="Batch #"
                    value={adjBatch}
                    onChange={(e) => setAdjBatch(e.target.value)}
                    className="w-full h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={adjExpiry}
                    onChange={(e) => setAdjExpiry(e.target.value)}
                    className="w-full h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks / Remarks Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Audit recount by stock manager, spill clean-up, missing inventory..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <DeleteConfirmationModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={() => {
            if (onDeleteItem && deletingItem) {
              onDeleteItem(deletingItem.id);
              setDeletingItem(null);
            }
          }}
          title="Delete Catalog Item"
          recordType="Catalog Product"
          recordNumber={deletingItem.code || deletingItem.name}
          partyName={deletingItem.name}
          amount={deletingItem.sellingPrice}
          impactSummary={`Item ${deletingItem.name} (${deletingItem.currentStock} ${deletingItem.unit} in stock) will be moved to Trash. Past transaction history remains intact.`}
          isBlocked={isItemInUse(deletingItem)}
          blockedReason={`This item cannot be deleted directly because active invoices, purchases or quotations refer to it. You can deactivate/archive it instead.`}
          alternativeAction={
            isItemInUse(deletingItem)
              ? {
                  label: 'Deactivate Item Instead',
                  onClick: () => {
                    onDeactivateItem(deletingItem.id);
                    setDeletingItem(null);
                  }
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
