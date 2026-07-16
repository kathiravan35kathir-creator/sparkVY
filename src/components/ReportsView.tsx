import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  ShoppingBag,
  TrendingDown,
  Droplet,
  FlaskConical,
  Clock,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  Users,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { Invoice, Purchase, Expense, Payment, Sample, Item, Party } from '../types';

interface ReportsViewProps {
  invoices: Invoice[];
  purchases: Purchase[];
  expenses: Expense[];
  payments: Payment[];
  samples: Sample[];
  items: Item[];
  parties: Party[];
  isAdmin: boolean;
}

type ReportTab = 'finance' | 'inventory' | 'lims';

export default function ReportsView({
  invoices,
  purchases,
  expenses,
  payments,
  samples,
  items,
  parties,
  isAdmin
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('finance');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [filterPartyId, setFilterPartyId] = useState('All');

  // Helper date filter
  const isWithinRange = (dateStr: string) => {
    return dateStr >= startDate && dateStr <= endDate;
  };

  // 1. FINANCE CALCULATIONS
  const filteredInvoices = invoices.filter((x) => isWithinRange(x.invoiceDate) && (filterPartyId === 'All' || x.partyId === filterPartyId));
  const filteredPurchases = purchases.filter((x) => isWithinRange(x.purchaseDate) && (filterPartyId === 'All' || x.partyId === filterPartyId));
  const filteredExpenses = expenses.filter((x) => isWithinRange(x.expenseDate));

  const totalInvoicedSales = filteredInvoices.reduce((sum, x) => (x.status !== 'Cancelled' ? sum + x.total : sum), 0);
  const totalReceivedSales = filteredInvoices.reduce((sum, x) => (x.status !== 'Cancelled' ? sum + x.amountPaid : sum), 0);
  const totalReceivables = filteredInvoices.reduce((sum, x) => (x.status !== 'Cancelled' ? sum + x.balanceDue : sum), 0);

  const totalPurchasesCost = filteredPurchases.reduce((sum, x) => (x.paymentStatus !== 'Cancelled' ? sum + x.total : sum), 0);
  const totalPurchasesPaid = filteredPurchases.reduce((sum, x) => (x.paymentStatus !== 'Cancelled' ? sum + x.amountPaid : sum), 0);
  const totalPayables = filteredPurchases.reduce((sum, x) => (x.paymentStatus !== 'Cancelled' ? sum + x.balanceDue : sum), 0);

  const totalIndirectExpenses = filteredExpenses.reduce((sum, x) => sum + x.amount, 0);

  const profitOrLoss = totalInvoicedSales - totalPurchasesCost - totalIndirectExpenses;

  // 2. INVENTORY CALCULATIONS
  const physicalItems = items.filter((it) => it.type !== 'Laboratory Service' && it.isActive);
  const lowStockItems = physicalItems.filter((it) => it.currentStock <= it.minimumStock);
  const totalStockValue = physicalItems.reduce((sum, it) => sum + (it.currentStock * it.purchasePrice), 0);

  // 3. LIMS CALCULATIONS
  const filteredSamples = samples.filter((s) => isWithinRange(s.receivedDate) && (filterPartyId === 'All' || s.partyId === filterPartyId));
  const samplesByStatus = {
    Received: filteredSamples.filter((s) => s.status === 'Received').length,
    Testing: filteredSamples.filter((s) => s.status === 'Testing' || s.status === 'Test Assigned').length,
    ReportReady: filteredSamples.filter((s) => s.status === 'Report Ready').length,
    Delivered: filteredSamples.filter((s) => s.status === 'Delivered').length,
    Cancelled: filteredSamples.filter((s) => s.status === 'Cancelled' || s.status === 'Rejected').length
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'finance') {
      csvContent += 'Financial Ledger Summary\n';
      csvContent += `Sales Revenue Billed,₹${totalInvoicedSales.toLocaleString()}\n`;
      csvContent += `Actual Sales Cash Collected,₹${totalReceivedSales.toLocaleString()}\n`;
      csvContent += `Outstanding Receivables,₹${totalReceivables.toLocaleString()}\n`;
      csvContent += `Material Purchases,₹${totalPurchasesCost.toLocaleString()}\n`;
      csvContent += `Purchases Paid,₹${totalPurchasesPaid.toLocaleString()}\n`;
      csvContent += `Outstanding Payables,₹${totalPayables.toLocaleString()}\n`;
      csvContent += `Indirect Expenses,₹${totalIndirectExpenses.toLocaleString()}\n`;
      csvContent += `Net Profit/Loss,₹${profitOrLoss.toLocaleString()}\n`;
    } else if (activeTab === 'inventory') {
      csvContent += 'Inventory Valuation Ledger\n';
      csvContent += 'Material Code,Name,Type,Current Stock,Min Threshold,Estimated Valuation\n';
      physicalItems.forEach((it) => {
        csvContent += `"${it.code}","${it.name}","${it.type}",${it.currentStock},${it.minimumStock},₹${it.currentStock * it.purchasePrice}\n`;
      });
    } else {
      csvContent += 'LIMS Laboratory Performance metrics\n';
      csvContent += 'Sample Code,Sample Name,Customer,Date,Status\n';
      filteredSamples.forEach((s) => {
        csvContent += `"${s.sampleCode}","${s.sampleName}","${s.partyName}","${s.receivedDate}","${s.status}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LabBiz_Business_Report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* Top toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Analytical Business & LIMS Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Audit net margins, cash reserves, inventory valuations, and NABL diagnostic volumes.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date & Filter bounds */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Period:</span>
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Users size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Client/Supplier:</span>
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none"
            value={filterPartyId}
            onChange={(e) => setFilterPartyId(e.target.value)}
          >
            <option value="All">All Parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t border-x transition ${
            activeTab === 'finance'
              ? 'bg-white border-slate-200 text-blue-600 border-t-2 border-t-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
          }`}
        >
          Finance, Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t border-x transition ${
            activeTab === 'inventory'
              ? 'bg-white border-slate-200 text-blue-600 border-t-2 border-t-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
          }`}
        >
          Inventory Valuation & Low Stocks
        </button>
        <button
          onClick={() => setActiveTab('lims')}
          className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t border-x transition ${
            activeTab === 'lims'
              ? 'bg-white border-slate-200 text-blue-600 border-t-2 border-t-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
          }`}
        >
          LIMS Lab Operations
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          {/* Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Sales Revenue (Billed)</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-lg font-black text-slate-800 mt-2">₹{totalInvoicedSales.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 block mt-1">₹{totalReceivedSales.toLocaleString()} cash collected</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Suppliers Material Cost</span>
                <ShoppingBag size={16} className="text-amber-500" />
              </div>
              <p className="text-lg font-black text-slate-800 mt-2">₹{totalPurchasesCost.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 block mt-1">₹{totalPurchasesPaid.toLocaleString()} paid out</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Indirect Expenditures</span>
                <TrendingDown size={16} className="text-red-500" />
              </div>
              <p className="text-lg font-black text-slate-800 mt-2">₹{totalIndirectExpenses.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 block mt-1">Consumables & utility payouts</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Net Operating Margins</span>
                <DollarSign size={16} className={profitOrLoss >= 0 ? 'text-emerald-500' : 'text-red-500'} />
              </div>
              <p className={`text-lg font-black mt-2 ${profitOrLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{profitOrLoss.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">Calculated as (Sales - Purchases - Expenses)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Receivables outstanding panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
              <h3 className="font-extrabold text-slate-800 mb-3 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Receivables Ledger (Client Outstandings)</span>
                <span className="text-red-600 font-black">₹{totalReceivables.toLocaleString()} Due</span>
              </h3>
              <div className="overflow-y-auto max-h-60 divide-y divide-slate-100 text-xs">
                {filteredInvoices.filter((x) => x.balanceDue > 0).map((inv) => (
                  <div key={inv.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">{inv.partyName}</p>
                      <p className="text-[10px] text-slate-400">Invoice: {inv.invoiceNumber} | Due: {inv.dueDate}</p>
                    </div>
                    <span className="font-extrabold text-red-600">₹{inv.balanceDue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payables outstanding panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
              <h3 className="font-extrabold text-slate-800 mb-3 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Payables Ledger (Supplier Outstandings)</span>
                <span className="text-red-600 font-black">₹{totalPayables.toLocaleString()} Due</span>
              </h3>
              <div className="overflow-y-auto max-h-60 divide-y divide-slate-100 text-xs">
                {filteredPurchases.filter((x) => x.balanceDue > 0).map((pur) => (
                  <div key={pur.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">{pur.partyName}</p>
                      <p className="text-[10px] text-slate-400">Purchase ID: {pur.purchaseNumber} | Due: {pur.dueDate}</p>
                    </div>
                    <span className="font-extrabold text-red-600 font-mono">₹{pur.balanceDue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Physical Stocks Asset Value</span>
              <p className="text-lg font-black text-slate-800 mt-1">₹{totalStockValue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1">Valued across {physicalItems.length} warehouse items at purchase cost.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Low stock threshold alerts</span>
              <p className="text-lg font-black text-amber-600 mt-1">{lowStockItems.length} Materials</p>
              <p className="text-[10px] text-slate-400 mt-1">Materials currently resting below safety levels.</p>
            </div>
          </div>

          {/* Low Stock alerting list */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <h3 className="font-extrabold text-slate-800 mb-2 border-b border-slate-100 pb-2">Chemicals & Reagents Safety Levels</h3>
            {lowStockItems.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400 font-semibold">All physical stock levels are perfectly within safety bounds.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <div>
                        <p className="font-bold text-slate-700">{it.name}</p>
                        <p className="text-[10px] text-slate-400">Category: {it.category} | Storage: {it.storageLocation || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">Stock: {it.currentStock} {it.unit}</p>
                      <p className="text-[10px] text-red-500 font-bold">Min Target: {it.minimumStock} {it.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lims' && (
        <div className="space-y-4">
          {/* LIMS KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Total Received</span>
              <p className="text-lg font-black text-slate-800 mt-1">{filteredSamples.length}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Pending Setup</span>
              <p className="text-lg font-black text-amber-600 mt-1">{samplesByStatus.Received}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Under Testing</span>
              <p className="text-lg font-black text-blue-600 mt-1">{samplesByStatus.Testing}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Reports Approved</span>
              <p className="text-lg font-black text-emerald-600 mt-1">{samplesByStatus.ReportReady}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Dispatched / Handed Over</span>
              <p className="text-lg font-black text-slate-700 mt-1">{samplesByStatus.Delivered}</p>
            </div>
          </div>

          {/* Detailed Lab Samples performance log */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <h3 className="font-extrabold text-slate-800 mb-3 border-b border-slate-100 pb-2">Active Analytical Custody Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                    <th className="p-3">Sample Code</th>
                    <th className="p-3">Matrix Name</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Received Date</th>
                    <th className="p-3">Required Assay Tests</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSamples.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-blue-600 font-mono">{s.sampleCode}</td>
                      <td className="p-3 font-semibold text-slate-700">{s.sampleName}</td>
                      <td className="p-3 text-slate-500 font-medium">{s.partyName}</td>
                      <td className="p-3 text-slate-500 font-semibold">{s.receivedDate}</td>
                      <td className="p-3 text-slate-600 font-medium">{s.requiredTestIds.length} Assays</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'Delivered'
                            ? 'bg-slate-100 text-slate-700'
                            : s.status === 'Report Ready'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'Testing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
