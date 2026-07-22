import React, { useState } from 'react';
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
  Bookmark
} from 'lucide-react';
import { Item, ItemType, Party } from '../types';

interface ItemsViewProps {
  items: Item[];
  parties: Party[];
  onAddItem: (item: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => void;
  onEditItem: (id: string, item: Partial<Item>) => void;
  onDeactivateItem: (id: string) => void;
  onReactivateItem: (id: string) => void;
  isAdmin: boolean;
}

export default function ItemsView({
  items,
  parties,
  onAddItem,
  onEditItem,
  onDeactivateItem,
  onReactivateItem,
  isAdmin
}: ItemsViewProps) {
  // Navigation & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('All');

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
  };

  const handleOpenAdd = () => {
    resetForm();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      alert('Please enter Name and Category');
      return;
    }

    const payload = {
      name,
      category,
      type,
      unit,
      barcode,
      hsnCode,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      taxRate: Number(taxRate),
      openingStock: Number(openingStock),
      minimumStock: Number(minimumStock),
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
    const matchesSearch =
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.category.toLowerCase().includes(searchQuery.toLowerCase());

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
      <div className="space-y-6">
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
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
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
                <input
                  type="number"
                  disabled={isEditMode}
                  value={openingStock}
                  onChange={(e) => setOpeningStock(Number(e.target.value))}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Minimum Buffer / Alert Stock *</label>
                <input
                  type="number"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value))}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Standard Purchase Unit Cost (INR)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
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
          <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-[#E5EAF0] py-3.5 px-6 flex items-center justify-between shadow-md z-40 md:pl-[240px] pl-6">
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

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
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No products found matching query.
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
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Edit Item Details"
                            >
                              <Edit2 size={13} />
                            </button>
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


    </div>
  );
}
