import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  FileText,
  Package,
  BookOpen,
  ArrowRight,
  Sparkles,
  X,
  CreditCard,
  FileSpreadsheet,
  TrendingDown,
  Activity,
  Settings,
  ChevronRight
} from 'lucide-react';
import { AppState } from '../data';
import { formatCurrency } from '../utils/numericUtils';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  db: AppState;
  onNavigateTab: (tabId: string) => void;
  onSelectParty?: (partyId: string) => void;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  query,
  onQueryChange,
  db,
  onNavigateTab,
  onSelectParty
}: CommandPaletteModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on escape key or shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or focus search
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen && !query) return null;

  const trimmedQuery = query.trim().toLowerCase();

  // Navigation Items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard & Metrics', icon: Activity, category: 'Navigation' },
    { id: 'party_ledger', name: 'Party Ledger (Customer & Vendor Ledger)', icon: BookOpen, category: 'Navigation', tag: 'STAR' },
    { id: 'parties', name: 'Parties Registry (Clients & Suppliers)', icon: Users, category: 'Navigation' },
    { id: 'items', name: 'Items & Services Catalog', icon: Package, category: 'Navigation' },
    { id: 'sales', name: 'Sales & Tax Invoices', icon: FileText, category: 'Navigation' },
    { id: 'quotations', name: 'Quotations & Estimates', icon: FileSpreadsheet, category: 'Navigation' },
    { id: 'purchases', name: 'Purchases & Stock In', icon: Package, category: 'Navigation' },
    { id: 'expenses', name: 'Expenses & Overhead Ledger', icon: TrendingDown, category: 'Navigation' },
    { id: 'reports', name: 'Business Analytical Reports', icon: Activity, category: 'Navigation' },
    { id: 'settings', name: 'Settings & Security', icon: Settings, category: 'Navigation' }
  ].filter(item => !trimmedQuery || item.name.toLowerCase().includes(trimmedQuery));

  // Matching Parties
  const matchingParties = db.parties
    .filter(p => !trimmedQuery || p.name.toLowerCase().includes(trimmedQuery) || p.phone?.includes(trimmedQuery) || p.email?.toLowerCase().includes(trimmedQuery))
    .slice(0, 5);

  // Matching Invoices
  const matchingInvoices = db.invoices
    .filter(inv => !trimmedQuery || inv.invoiceNumber.toLowerCase().includes(trimmedQuery) || inv.partyName.toLowerCase().includes(trimmedQuery))
    .slice(0, 5);

  const totalResults = navItems.length + matchingParties.length + matchingInvoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-4 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search size={18} className="text-blue-600 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, search parties, invoices, or jump to modules..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0 focus:ring-0"
          />
          {query ? (
            <button
              onClick={() => onQueryChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X size={16} />
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200/70 border border-slate-300 px-1.5 py-0.5 rounded">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 divide-y divide-slate-100">
          {totalResults === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-slate-700">No matching records found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching by party name, invoice number, or module title.</p>
            </div>
          ) : (
            <>
              {/* Module Navigation */}
              {navItems.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Modules & Views
                  </p>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigateTab(item.id);
                          onClose();
                          onQueryChange('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 transition cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-1.5 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 rounded-lg transition">
                            <Icon size={16} />
                          </div>
                          <span className="text-xs font-bold truncate">{item.name}</span>
                          {item.tag === 'STAR' && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Parties */}
              {matchingParties.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Parties ({matchingParties.length})
                  </p>
                  {matchingParties.map((party) => (
                    <button
                      key={party.id}
                      onClick={() => {
                        if (onSelectParty) onSelectParty(party.id);
                        onNavigateTab('party_ledger');
                        onClose();
                        onQueryChange('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100/80 text-slate-700 transition cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {party.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{party.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{party.type} · {party.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-extrabold font-mono ${(party.currentBalance || 0) > 0 ? 'text-emerald-600' : (party.currentBalance || 0) < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          ₹{Math.abs(party.currentBalance || 0).toLocaleString()} {(party.currentBalance || 0) > 0 ? 'Receivable' : (party.currentBalance || 0) < 0 ? 'Payable' : ''}
                        </p>
                        <p className="text-[9px] text-blue-600 font-bold group-hover:underline">View Ledger →</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {matchingInvoices.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Sales Invoices ({matchingInvoices.length})
                  </p>
                  {matchingInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => {
                        onNavigateTab('sales');
                        onClose();
                        onQueryChange('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100/80 text-slate-700 transition cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <FileText size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 font-mono truncate">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-500 truncate">{inv.partyName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-slate-800">{formatCurrency(inv.total, db.settings)}</p>
                        <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles size={12} className="text-amber-500" />
            <span>BizOps Smart Command Switcher</span>
          </div>
          <div className="flex items-center space-x-3 font-mono">
            <span>Press <kbd className="font-bold text-slate-600 bg-white px-1 border border-slate-200 rounded">ESC</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
