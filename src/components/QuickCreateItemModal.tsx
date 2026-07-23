import React, { useState, useEffect } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { Item, ItemType } from '../types';
import { NumericInput } from './NumericInput';
import { findExactMatch } from '../utils/searchOrCreate';

interface QuickCreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchText: string;
  existingItems: Item[];
  onSaveItem: (itemData: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => void;
}

export default function QuickCreateItemModal({
  isOpen,
  onClose,
  initialSearchText,
  existingItems,
  onSaveItem
}: QuickCreateItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('Pcs');
  const [type, setType] = useState<ItemType>('Inventory Product');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialSearchText || '');
      setCategory('General');
      setUnit('Pcs');
      setType('Inventory Product');
      setSellingPrice(0);
      setPurchasePrice(0);
      setTaxRate(18);
      setOpeningStock(0);
      setMinimumStock(5);
      setWarning(null);
    }
  }, [isOpen, initialSearchText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name.');
      return;
    }

    const match = findExactMatch(existingItems, name, ['name', 'barcode', 'sku']);
    if (match) {
      if (!confirm(`An item named "${match.name}" already exists. Do you want to proceed saving?`)) {
        return;
      }
    }

    onSaveItem({
      name: name.trim(),
      category: category.trim() || 'General',
      type,
      unit: unit.trim() || 'Pcs',
      purchasePrice,
      sellingPrice,
      taxRate,
      openingStock,
      minimumStock,
      storageLocation: '',
      batchTracking: false,
      expiryTracking: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <PackagePlus size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Quick Create New Item
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Creating from search: <strong className="text-blue-700">"{initialSearchText}"</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>{warning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                const match = findExactMatch(existingItems, e.target.value, ['name']);
                if (match) setWarning(`An item named "${match.name}" already exists.`);
                else setWarning(null);
              }}
              placeholder="e.g. Wireless Optical Mouse"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="General / Electronics"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Pcs">Pcs / Pieces</option>
                <option value="Box">Box / Carton</option>
                <option value="Kg">Kg / Kilograms</option>
                <option value="Ltr">Ltr / Litres</option>
                <option value="Mtr">Mtr / Meters</option>
                <option value="Pack">Pack / Set</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (₹)
              </label>
              <NumericInput
                value={sellingPrice}
                onChange={(val) => setSellingPrice(val)}
                allowDecimal={true}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono font-bold text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Cost (₹)
              </label>
              <NumericInput
                value={purchasePrice}
                onChange={(val) => setPurchasePrice(val)}
                allowDecimal={true}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GST Tax %
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-semibold"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opening Stock Qty
              </label>
              <NumericInput
                value={openingStock}
                onChange={(val) => setOpeningStock(val)}
                allowDecimal={true}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min Stock Alert Qty
              </label>
              <NumericInput
                value={minimumStock}
                onChange={(val) => setMinimumStock(val)}
                allowDecimal={true}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-xs transition cursor-pointer"
            >
              Save Item & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
