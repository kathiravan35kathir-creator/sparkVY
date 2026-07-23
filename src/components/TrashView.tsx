import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  History,
  Trash2,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Users,
  Package,
  Clock,
  Briefcase,
  Receipt
} from 'lucide-react';
import { AppState } from '../data';

interface TrashViewProps {
  db: AppState;
  onRestoreRecord: (module: string, id: string) => void;
  isAdmin: boolean;
}

export default function TrashView({ db, onRestoreRecord, isAdmin }: TrashViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  // Gather all deleted records
  const deletedRecords: {
    id: string;
    module: string;
    refNumberOrName: string;
    details: string;
    deletedAt?: string;
    deletedBy?: string;
    icon: any;
    colorClass: string;
  }[] = [];

  // Quotations
  (db.quotations || []).forEach(q => {
    if (q.isDeleted) {
      deletedRecords.push({
        id: q.id,
        module: 'Quotations',
        refNumberOrName: q.quotationNumber,
        details: `Customer: ${q.partyName} | Total: ₹${q.total.toLocaleString()}`,
        deletedAt: q.deletedAt,
        deletedBy: q.deletedBy,
        icon: FileSpreadsheet,
        colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100'
      });
    }
  });

  // Invoices (Sales)
  (db.invoices || []).forEach(inv => {
    if (inv.isDeleted) {
      deletedRecords.push({
        id: inv.id,
        module: 'Sales',
        refNumberOrName: inv.invoiceNumber,
        details: `Customer: ${inv.partyName} | Total: ₹${inv.total.toLocaleString()}`,
        deletedAt: inv.deletedAt,
        deletedBy: inv.deletedBy,
        icon: FileText,
        colorClass: 'text-blue-600 bg-blue-50 border-blue-100'
      });
    }
  });

  // Proforma Invoices
  (db.proformaInvoices || []).forEach(pi => {
    if (pi.isDeleted) {
      deletedRecords.push({
        id: pi.id,
        module: 'Proforma Invoices',
        refNumberOrName: pi.proformaNumber,
        details: `Customer: ${pi.partyName} | Total: ₹${pi.total.toLocaleString()}`,
        deletedAt: pi.deletedAt,
        deletedBy: pi.deletedBy,
        icon: FileText,
        colorClass: 'text-teal-600 bg-teal-50 border-teal-100'
      });
    }
  });

  // Purchases
  (db.purchases || []).forEach(pur => {
    if (pur.isDeleted) {
      deletedRecords.push({
        id: pur.id,
        module: 'Purchases',
        refNumberOrName: pur.purchaseNumber,
        details: `Vendor: ${pur.partyName} | Total: ₹${pur.total.toLocaleString()}`,
        deletedAt: pur.deletedAt,
        deletedBy: pur.deletedBy,
        icon: ShoppingBag,
        colorClass: 'text-amber-600 bg-amber-50 border-amber-100'
      });
    }
  });

  // Procurement Orders
  (db.procurementOrders || []).forEach(po => {
    if (po.isDeleted) {
      deletedRecords.push({
        id: po.id,
        module: 'Procurement',
        refNumberOrName: po.orderNumber,
        details: `Vendor: ${po.partyName} | Total: ₹${po.total.toLocaleString()}`,
        deletedAt: po.deletedAt,
        deletedBy: po.deletedBy,
        icon: Briefcase,
        colorClass: 'text-rose-600 bg-rose-50 border-rose-100'
      });
    }
  });

  // Sales Returns
  (db.salesReturns || []).forEach(sr => {
    if (sr.isDeleted) {
      deletedRecords.push({
        id: sr.id,
        module: 'Sales Returns',
        refNumberOrName: sr.returnNumber,
        details: `Customer: ${sr.partyName} | Total: ₹${sr.totalReturnAmount.toLocaleString()}`,
        deletedAt: sr.deletedAt,
        deletedBy: sr.deletedBy,
        icon: RotateCcw,
        colorClass: 'text-pink-600 bg-pink-50 border-pink-100'
      });
    }
  });

  // Credit Notes
  (db.creditNotes || []).forEach(cn => {
    if (cn.isDeleted) {
      deletedRecords.push({
        id: cn.id,
        module: 'Credit Notes',
        refNumberOrName: cn.creditNoteNumber,
        details: `Customer: ${cn.partyName} | Total: ₹${cn.total.toLocaleString()}`,
        deletedAt: cn.deletedAt,
        deletedBy: cn.deletedBy,
        icon: Receipt,
        colorClass: 'text-purple-600 bg-purple-50 border-purple-100'
      });
    }
  });

  // Payments
  (db.payments || []).forEach(p => {
    if (p.isDeleted) {
      deletedRecords.push({
        id: p.id,
        module: 'Payments',
        refNumberOrName: p.paymentNumber,
        details: `${p.paymentType} | Party: ${p.partyName || 'N/A'} | Amount: ₹${p.amount.toLocaleString()}`,
        deletedAt: p.deletedAt,
        deletedBy: p.deletedBy,
        icon: p.paymentType === 'Payment In' ? ArrowDownLeft : ArrowUpRight,
        colorClass: p.paymentType === 'Payment In' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-orange-600 bg-orange-50 border-orange-100'
      });
    }
  });

  // Expenses
  (db.expenses || []).forEach(exp => {
    if (exp.isDeleted) {
      deletedRecords.push({
        id: exp.id,
        module: 'Expenses',
        refNumberOrName: exp.expenseNumber,
        details: `${exp.category} | Paid to: ${exp.vendorName || 'N/A'} | Amount: ₹${exp.amount.toLocaleString()}`,
        deletedAt: exp.deletedAt,
        deletedBy: exp.deletedBy,
        icon: TrendingDown,
        colorClass: 'text-red-600 bg-red-50 border-red-100'
      });
    }
  });

  // Parties
  (db.parties || []).forEach(party => {
    if (party.isDeleted) {
      deletedRecords.push({
        id: party.id,
        module: 'Parties',
        refNumberOrName: party.name,
        details: `Type: ${party.type} | Phone: ${party.phone} | City: ${party.billingAddress?.split(',')[2] || 'N/A'}`,
        deletedAt: party.deletedAt,
        deletedBy: party.deletedBy,
        icon: Users,
        colorClass: 'text-sky-600 bg-sky-50 border-sky-100'
      });
    }
  });

  // Items
  (db.items || []).forEach(item => {
    if (item.isDeleted) {
      deletedRecords.push({
        id: item.id,
        module: 'Catalog',
        refNumberOrName: item.name,
        details: `Code: ${item.code} | Stock: ${item.currentStock} | Price: ₹${item.sellingPrice.toLocaleString()}`,
        deletedAt: item.deletedAt,
        deletedBy: item.deletedBy,
        icon: Package,
        colorClass: 'text-violet-600 bg-violet-50 border-violet-100'
      });
    }
  });

  // Filter records
  const filtered = deletedRecords.filter(r => {
    const matchesSearch = !searchQuery.trim() || 
      r.refNumberOrName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.deletedBy || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModule = filterModule === 'All' || r.module === filterModule;

    return matchesSearch && matchesModule;
  });

  // Modules list
  const modulesList = ['All', 'Parties', 'Catalog', 'Quotations', 'Proforma Invoices', 'Sales', 'Purchases', 'Procurement', 'Sales Returns', 'Credit Notes', 'Payments', 'Expenses'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <History className="text-slate-500" size={22} />
            <span>Trash & Deleted Records Recovery</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and restore soft-deleted ledger profiles, catalog inventory, or transaction records to preserve historical integrity.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, code, customer, details, or deleter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Module</span>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none w-full md:w-auto"
          >
            {modulesList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Record Module</th>
                <th className="py-3 px-4">Identifier / Name</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Deleted At</th>
                <th className="py-3 px-4">Deleted By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No soft-deleted records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const Icon = r.icon;
                  return (
                    <tr key={`${r.module}-${r.id}`} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 border rounded-full text-[10px] font-bold ${r.colorClass}`}>
                          <Icon size={11} />
                          <span>{r.module.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.refNumberOrName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-500 max-w-xs truncate" title={r.details}>{r.details}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{r.deletedAt ? new Date(r.deletedAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-bold">{r.deletedBy || 'System'}</td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to restore this ${r.module} record?`)) {
                                onRestoreRecord(r.module, r.id);
                              }
                            }}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded text-xs font-bold transition shadow-2xs"
                            title="Restore record to active lists"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Admin Only</span>
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
