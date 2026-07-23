import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, AlertCircle, Check, Lock, ChevronDown } from 'lucide-react';
import {
  normalizeSearchString,
  findExactMatch,
  filterRecords
} from '../utils/searchOrCreate';

export interface SearchOrCreateInputProps<T> {
  value: string;
  onChange: (text: string) => void;
  records: T[];
  searchFields: (keyof T | string)[];
  nameFields?: (keyof T | string)[]; // Fields used to check for exact name match (defaults to searchFields)
  entityLabel: string; // e.g., 'item', 'party', 'customer', 'supplier', 'category', 'unit', 'brand', 'asset'
  placeholder?: string;
  canCreate?: boolean;
  blockedMessage?: string;
  onSelectRecord?: (record: T) => void;
  onCreateNew?: (searchText: string) => void;
  getOptionLabel: (record: T) => string;
  getOptionSublabel?: (record: T) => string | undefined;
  getOptionId?: (record: T) => string;
  className?: string;
  inputClassName?: string;
  showDropdownInListMode?: boolean; // Default false for main list search bars, true for form comboboxes
  selectedRecordId?: string;
  autoFocus?: boolean;
}

export function SearchOrCreateInput<T>({
  value,
  onChange,
  records,
  searchFields,
  nameFields,
  entityLabel,
  placeholder,
  canCreate = true,
  blockedMessage,
  onSelectRecord,
  onCreateNew,
  getOptionLabel,
  getOptionSublabel,
  getOptionId = (rec: any) => rec.id || String(rec),
  className = '',
  inputClassName = '',
  showDropdownInListMode = false,
  selectedRecordId,
  autoFocus = false
}: SearchOrCreateInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedValue = value.trim();
  const effectiveNameFields = nameFields || searchFields;

  // Filter matching records
  const filtered = filterRecords(records, trimmedValue, searchFields);

  // Exact match check
  const exactMatch = findExactMatch(records, trimmedValue, effectiveNameFields);

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

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!trimmedValue && !showDropdownInListMode) return;

    // Total dropdown items = filtered records count + (create option if available ? 1 : 0)
    const hasCreateOption = canCreate && trimmedValue && !exactMatch && onCreateNew;
    const totalItems = filtered.length + (hasCreateOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (!trimmedValue && highlightedIndex < 0) return;

      // CASE 1: Exact match exists
      if (exactMatch && onSelectRecord) {
        onSelectRecord(exactMatch);
        setIsOpen(false);
        return;
      }

      // CASE 2: Item highlighted in dropdown
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length && onSelectRecord) {
        onSelectRecord(filtered[highlightedIndex]);
        setIsOpen(false);
        return;
      }

      // CASE 3: Highlighted index is the Create option
      if (
        hasCreateOption &&
        (highlightedIndex === filtered.length || highlightedIndex === -1)
      ) {
        onCreateNew?.(trimmedValue);
        setIsOpen(false);
        return;
      }

      // CASE 4: No exact match and Create permitted (Enter pressed without highlight)
      if (!exactMatch && canCreate && onCreateNew && trimmedValue) {
        onCreateNew(trimmedValue);
        setIsOpen(false);
        return;
      }

      // CASE 5: Single filtered result
      if (filtered.length === 1 && onSelectRecord) {
        onSelectRecord(filtered[0]);
        setIsOpen(false);
        return;
      }
    }
  };

  const handleCreateClick = () => {
    if (canCreate && onCreateNew && trimmedValue) {
      onCreateNew(trimmedValue);
      setIsOpen(false);
    }
  };

  const formattedPlaceholder =
    placeholder || `Search ${entityLabel}s by name, code, or details...`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={formattedPlaceholder}
          autoFocus={autoFocus}
          className={`w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium ${inputClassName}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
            title="Clear Search"
          >
            <X size={14} />
          </button>
        ) : showDropdownInListMode ? (
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        ) : null}
      </div>

      {/* DROPDOWN / SUGGESTION PANEL */}
      {isOpen && showDropdownInListMode && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
          {/* EXACT MATCH WARNING BANNER */}
          {exactMatch && (
            <div className="bg-amber-50/80 border-b border-amber-100 p-2.5 flex items-center gap-2 text-amber-800 text-[11px] font-medium">
              <AlertCircle size={14} className="shrink-0 text-amber-600" />
              <span>
                A {entityLabel} named <strong>"{getOptionLabel(exactMatch)}"</strong> already exists.
              </span>
            </div>
          )}

          {/* FILTERED RESULTS */}
          {filtered.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching {entityLabel}s ({filtered.length})
              </div>
              {filtered.map((record, index) => {
                const isSelected = selectedRecordId === getOptionId(record);
                const isHighlighted = index === highlightedIndex;
                const label = getOptionLabel(record);
                const sublabel = getOptionSublabel?.(record);

                return (
                  <button
                    key={getOptionId(record)}
                    type="button"
                    onClick={() => {
                      onSelectRecord?.(record);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : isSelected
                        ? 'bg-slate-50 font-bold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{label}</span>
                        {isSelected && (
                          <Check size={12} className="text-emerald-600 shrink-0" />
                        )}
                      </div>
                      {sublabel && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {sublabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : trimmedValue ? (
            <div className="p-3 text-center text-slate-500 text-xs font-medium">
              No matching {entityLabel} found for "{trimmedValue}".
            </div>
          ) : null}

          {/* CREATE NEW ACTION */}
          {trimmedValue && !exactMatch && onCreateNew && (
            <div className="p-1.5 bg-slate-50/80 border-t border-slate-100">
              {canCreate ? (
                <button
                  type="button"
                  onClick={handleCreateClick}
                  onMouseEnter={() => setHighlightedIndex(filtered.length)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer ${
                    highlightedIndex === filtered.length ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                  }`}
                >
                  <Plus size={14} className="shrink-0" />
                  <span>Add "{trimmedValue}" as a new {entityLabel}</span>
                </button>
              ) : (
                <div className="p-2 flex items-center gap-2 text-rose-700 bg-rose-50 rounded-lg text-[11px] font-semibold">
                  <Lock size={13} className="shrink-0 text-rose-500" />
                  <span>
                    {blockedMessage || `New ${entityLabel}s cannot be created from transaction forms according to system settings.`}
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
