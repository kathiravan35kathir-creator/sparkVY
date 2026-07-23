import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Package, AlertCircle, Check, Lock, ChevronDown } from 'lucide-react';
import { Item } from '../types';
import { normalizeSearchString } from '../utils/searchOrCreate';

export interface ItemSearchSelectProps {
  selectedItemId: string;
  onSelectItem: (item: Item) => void;
  onClearSelection: () => void;
  items: Item[];
  onRequestCreateItem?: (searchText: string) => void;
  canCreateItem?: boolean;
  blockedMessage?: string;
  priceType?: 'sellingPrice' | 'purchasePrice';
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function ItemSearchSelect({
  selectedItemId,
  onSelectItem,
  onClearSelection,
  items,
  onRequestCreateItem,
  canCreateItem = true,
  blockedMessage,
  priceType = 'sellingPrice',
  placeholder = 'Search item by name, code, HSN, barcode...',
  className = '',
  autoFocus = false
}: ItemSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((it) => it.id === selectedItemId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearchString(trimmedQuery);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (!normalizedQuery) return true;
    const name = normalizeSearchString(item.name);
    const code = normalizeSearchString(item.code);
    const barcode = normalizeSearchString(item.barcode);
    const hsn = normalizeSearchString(item.hsnCode);
    const category = normalizeSearchString(item.category);
    const type = normalizeSearchString(item.type);
    const desc = normalizeSearchString(item.description);

    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      barcode.includes(normalizedQuery) ||
      hsn.includes(normalizedQuery) ||
      category.includes(normalizedQuery) ||
      type.includes(normalizedQuery) ||
      desc.includes(normalizedQuery)
    );
  });

  // Find exact match
  const exactMatch = items.find((item) => {
    if (!normalizedQuery) return undefined;
    return (
      normalizeSearchString(item.name) === normalizedQuery ||
      normalizeSearchString(item.code) === normalizedQuery ||
      normalizeSearchString(item.barcode) === normalizedQuery ||
      normalizeSearchString(item.hsnCode) === normalizedQuery
    );
  });

  const hasCreateOption = Boolean(canCreateItem && trimmedQuery && !exactMatch && onRequestCreateItem);
  const totalDropdownItems = filteredItems.length + (hasCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1 < totalDropdownItems ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalDropdownItems - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (!trimmedQuery && highlightedIndex < 0) {
        if (filteredItems.length === 1) {
          onSelectItem(filteredItems[0]);
          setIsOpen(false);
        }
        return;
      }

      // CASE 1: Exact match exists
      if (exactMatch) {
        onSelectItem(exactMatch);
        setIsOpen(false);
        setQuery('');
        return;
      }

      // CASE 2: A search result is highlighted
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        onSelectItem(filteredItems[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
        return;
      }

      // CASE 3: Highlighted index is the "Add New" action or no match & create allowed
      if (
        hasCreateOption &&
        (highlightedIndex === filteredItems.length || highlightedIndex === -1)
      ) {
        onRequestCreateItem?.(trimmedQuery);
        setIsOpen(false);
        setQuery('');
        return;
      }

      // CASE 4: Single filtered result available
      if (filteredItems.length === 1) {
        onSelectItem(filteredItems[0]);
        setIsOpen(false);
        setQuery('');
        return;
      }
    }
  };

  const handleCreateClick = () => {
    if (canCreateItem && onRequestCreateItem && trimmedQuery) {
      onRequestCreateItem(trimmedQuery);
      setIsOpen(false);
      setQuery('');
    }
  };

  // If item is already selected, display selected summary with option to change/clear
  if (selectedItem) {
    const displayPrice = priceType === 'purchasePrice' ? selectedItem.purchasePrice : selectedItem.sellingPrice;
    return (
      <div className={`flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Package size={14} className="text-blue-600 shrink-0" />
          <span className="font-bold text-slate-800 truncate">
            {selectedItem.code ? <span className="font-mono text-slate-500 mr-1">[{selectedItem.code}]</span> : null}
            {selectedItem.name}
          </span>
          <span className="text-[10px] text-slate-600 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            ₹{displayPrice} {selectedItem.unit ? `/ ${selectedItem.unit}` : ''}
          </span>
          {selectedItem.hsnCode && (
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              HSN:{selectedItem.hsnCode}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onClearSelection();
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition cursor-pointer shrink-0"
          title="Change Selected Item"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 pl-8 pr-7 text-xs text-slate-800 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          role="combobox"
          aria-expanded={isOpen}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            title="Clear Search"
          >
            <X size={13} />
          </button>
        ) : (
          <ChevronDown
            size={13}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}
      </div>

      {/* DROPDOWN / SUGGESTION PANEL */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
          {/* EXACT MATCH NOTICE */}
          {exactMatch && (
            <div className="bg-amber-50/90 border-b border-amber-100 p-2 flex items-center gap-2 text-amber-800 text-[11px] font-medium">
              <AlertCircle size={13} className="shrink-0 text-amber-600" />
              <span>
                Exact item match: <strong>"{exactMatch.name}"</strong> ({exactMatch.code})
              </span>
            </div>
          )}

          {/* FILTERED RESULTS */}
          {filteredItems.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Matching Items ({filteredItems.length})</span>
                <span className="text-slate-300">Press Enter to select</span>
              </div>
              {filteredItems.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                const price = priceType === 'purchasePrice' ? item.purchasePrice : item.sellingPrice;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectItem(item);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 truncate">{item.name}</span>
                        {item.code && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            [{item.code}]
                          </span>
                        )}
                        {item.type && item.type.includes('Service') && (
                          <span className="text-[9px] bg-purple-50 text-purple-600 px-1 rounded font-semibold border border-purple-200">
                            Service
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        {item.hsnCode && <span>HSN: {item.hsnCode}</span>}
                        {item.category && <span>Cat: {item.category}</span>}
                        <span>GST: {item.taxRate}%</span>
                        {item.currentStock !== undefined && (
                          <span className={item.currentStock > 0 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            Stock: {item.currentStock} {item.unit || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-slate-900 block text-xs">
                        ₹{price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : trimmedQuery ? (
            <div className="p-3 text-center text-slate-500 text-xs font-medium">
              No matching item found for "{trimmedQuery}".
            </div>
          ) : (
            <div className="p-3 text-center text-slate-400 text-xs font-medium">
              Type to search products or services...
            </div>
          )}

          {/* CREATE NEW ITEM ACTION */}
          {trimmedQuery && !exactMatch && onRequestCreateItem && (
            <div className="p-1.5 bg-slate-50/80 border-t border-slate-100">
              {canCreateItem ? (
                <button
                  type="button"
                  onClick={handleCreateClick}
                  onMouseEnter={() => setHighlightedIndex(filteredItems.length)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer ${
                    highlightedIndex === filteredItems.length ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                  }`}
                >
                  <Plus size={14} className="shrink-0" />
                  <span>Add "{trimmedQuery}" as a new item</span>
                </button>
              ) : (
                <div className="p-2 flex items-center gap-2 text-rose-700 bg-rose-50 rounded-lg text-[11px] font-semibold">
                  <Lock size={13} className="shrink-0 text-rose-500" />
                  <span>
                    {blockedMessage || 'New items can only be created from the Items module.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
