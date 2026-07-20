import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  Package,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database,
  FileText
} from 'lucide-react';
import {
  Party,
  Item,
  Invoice,
  CashBankAccount
} from '../types';

interface DashboardViewProps {
  isAdmin: boolean;
  parties: Party[];
  items: Item[];
  invoices: Invoice[];
  accounts: CashBankAccount[];
  onQuickAction: (actionId: string) => void;
  onNavigateToTab: (tabId: string) => void;
  currentUser?: any;
}

export default function DashboardView({
  isAdmin,
  parties,
  items,
  invoices,
  accounts,
  onQuickAction,
  onNavigateToTab,
  currentUser
}: DashboardViewProps) {
  // 1. Calculations for Business KPIs
  const todayStr = '2026-07-14'; // Mock today from system metadata
  const currentMonthStr = '2026-07';

  const todayInvoices = invoices.filter((i) => i.invoiceDate === todayStr);
  const monthlyInvoices = invoices.filter((i) => i.invoiceDate.startsWith(currentMonthStr));

  const todaySalesVal = todayInvoices.reduce((sum, i) => sum + i.total, 0);
  const monthlySalesVal = monthlyInvoices.reduce((sum, i) => sum + i.total, 0);

  const totalReceivables = parties
    .filter((p) => p.balanceType === 'Receivable')
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayables = parties
    .filter((p) => p.balanceType === 'Payable')
    .reduce((sum, p) => sum + p.currentBalance, 0);

  // Stock value
  const stockVal = items
    .filter((it) => it.type === 'Product')
    .reduce((sum, it) => sum + it.currentStock * it.purchasePrice, 0);

  // Account Balances
  const cashAcc = accounts.find((a) => a.type === 'Cash' || a.type === 'Petty Cash');
  const bankAcc = accounts.find((a) => a.type === 'Bank');
  const cashBalance = cashAcc ? cashAcc.currentBalance : 0;
  const bankBalance = bankAcc ? bankAcc.currentBalance : 0;

  // 2. Alerts calculations
  const lowStockItems = items.filter(
    (it) => it.currentStock <= it.minimumStock
  );

  const pendingDueInvoices = invoices.filter((i) => i.status === 'Unpaid' || i.status === 'Partially Paid');

  // Role based section filters
  const showFinance = isAdmin;
  const showInventory = true;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Simulation Banner / Welcome Block */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#2563EB] text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full font-mono">
              INTERNAL BUSINESS SYSTEM
            </span>
            <span className="text-[11px] text-teal-400 font-mono">● Safe Mode</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
            Welcome Back, {currentUser?.full_name || currentUser?.name || 'BizOps Admin'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            You are currently viewing the system under simulated{' '}
            <strong className="text-amber-400 font-mono font-bold">{isAdmin ? 'Admin' : 'Staff'}</strong> clearance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => onQuickAction('create_invoice')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <CreditCard size={14} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BUSINESS FINANCIAL KPIS */}
      {showFinance && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center space-x-1.5">
              <Briefcase size={15} className="text-slate-500" />
              <span>Business Financial Overview</span>
            </h3>
            <button onClick={() => onNavigateToTab('reports')} className="text-xs text-blue-600 hover:underline flex items-center">
              <span>View Financial Reports</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* KPI 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Sales</p>
                <p className="text-lg font-black text-[#163A5F] font-mono mt-1">₹ {monthlySalesVal.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{monthlyInvoices.length} invoices generated</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                <TrendingUp size={18} />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receivables</p>
                <p className="text-lg font-black text-rose-600 font-mono mt-1">₹ {totalReceivables.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Due from customers</p>
              </div>
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg">
                <ArrowDownRight size={18} />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payables</p>
                <p className="text-lg font-black text-amber-600 font-mono mt-1">₹ {totalPayables.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Owed to suppliers</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
                <AlertTriangle size={18} />
              </div>
            </div>

            {/* KPI 7: Stock Value */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between col-span-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Product Stock Valuation</p>
                <p className="text-lg font-black text-[#163A5F] font-mono mt-1">₹ {stockVal.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Asset value in storage</p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
                <Package size={18} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: VISUAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Sales Trend Chart (Mock SVG - High Fidelity & Lightweight) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Sales Trend</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Bi-weekly billing volume (INR)</p>
            </div>
            <span className="text-[10px] font-bold text-[#163A5F] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Calendar size={11} />
              <span>July 2026</span>
            </span>
          </div>

          {/* Render high quality vector chart representing sales trajectory */}
          <div className="h-48 relative flex flex-col justify-end">
            <svg className="w-full h-full pt-4" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area */}
              <path
                d="M 0 150 L 50 120 L 100 115 L 150 90 L 200 95 L 250 60 L 300 70 L 350 45 L 400 40 L 450 35 L 500 15 L 500 150 Z"
                fill="url(#chart-grad)"
              />

              {/* Line */}
              <path
                d="M 0 150 L 50 120 L 100 115 L 150 90 L 200 95 L 250 60 L 300 70 L 350 45 L 400 40 L 450 35 L 500 15"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="150" cy="90" r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="250" cy="60" r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="350" cy="45" r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="500" cy="15" r="4" fill="#0f9d8a" stroke="#ffffff" strokeWidth="1.5" />
            </svg>

            {/* Labels */}
            <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
              <span>July 1</span>
              <span>July 3</span>
              <span>July 6</span>
              <span>July 9</span>
              <span>July 12</span>
              <span>Today (July 14)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ALERTS GRID (Low stock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low stock alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              {lowStockItems.length} alert
            </span>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">All stock levels safe</p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                  <span className="font-bold text-slate-700 truncate max-w-[120px]">{item.name}</span>
                  <span className="font-mono text-red-600 font-bold">
                    {item.currentStock} {item.unit.split(' ')[0]} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice receivables alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Outstanding</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">Receivables</span>
          </div>
          {pendingDueInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">All customer balances cleared</p>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {pendingDueInvoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                  <span className="font-bold text-slate-700 truncate max-w-[100px]">{inv.partyName}</span>
                  <span className="font-mono text-rose-500 font-bold">₹{inv.balanceDue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: RECENTS FEEDS (Recent Invoices) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Transactions / Invoices */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Recent Financial Sales Bills</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Invoicing feed</p>
            </div>
            <button
              onClick={() => onNavigateToTab('sales')}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              Sales Book
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50">
                  <th className="py-2.5 px-3">Bill Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      No invoices recorded
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 4).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 text-xs">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 truncate max-w-[120px]">{inv.partyName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">₹{inv.total.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
