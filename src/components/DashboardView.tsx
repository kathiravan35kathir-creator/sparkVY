import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  Clock,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import {
  Party,
  Item,
  Invoice,
  CashBankAccount,
  Purchase,
  Expense,
  Payment,
  Quotation,
  ProcurementOrder,
  ProformaInvoice,
  SalesReturn,
  CreditNote,
  AppSettings
} from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/numericUtils';

interface DashboardViewProps {
  isAdmin: boolean;
  parties: Party[];
  items: Item[];
  invoices: Invoice[];
  purchases: Purchase[];
  expenses: Expense[];
  payments: Payment[];
  quotations: Quotation[];
  procurementOrders: ProcurementOrder[];
  proformaInvoices: ProformaInvoice[];
  salesReturns: SalesReturn[];
  creditNotes: CreditNote[];
  accounts: CashBankAccount[];
  onQuickAction: (actionId: string) => void;
  onNavigateToTab: (tabId: string) => void;
  currentUser?: any;
  settings?: AppSettings;
}

type DateFilterType = 'Today' | 'Yesterday' | 'Week' | 'Month' | 'Quarter' | 'Year' | 'Custom';
type ActiveChartTab = 'sales_vs_purchase' | 'cash_flow' | 'expenses' | 'products' | 'parties';

export default function DashboardView({
  isAdmin,
  parties,
  items,
  invoices,
  purchases,
  expenses,
  payments,
  quotations,
  procurementOrders,
  proformaInvoices,
  salesReturns,
  creditNotes,
  accounts,
  onQuickAction,
  onNavigateToTab,
  currentUser,
  settings
}: DashboardViewProps) {
  // 1. Date Filtering state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('Month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Chart tab state
  const [activeChartTab, setActiveChartTab] = useState<ActiveChartTab>('sales_vs_purchase');

  // Dynamic system/computer today date
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7); // e.g. '2026-07'

  // Helper to determine if a date falls inside the selected range
  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const start = new Date();
    
    if (dateFilter === 'Today') {
      return dateStr === todayStr;
    } else if (dateFilter === 'Yesterday') {
      return dateStr === yesterdayStr;
    } else if (dateFilter === 'Week') {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === 'Month') {
      start.setDate(now.getDate() - 30);
    } else if (dateFilter === 'Quarter') {
      start.setDate(now.getDate() - 90);
    } else if (dateFilter === 'Year') {
      start.setDate(now.getDate() - 365);
    } else if (dateFilter === 'Custom') {
      if (customStartDate && customEndDate) {
        return dateStr >= customStartDate && dateStr <= customEndDate;
      }
      if (customStartDate) return dateStr >= customStartDate;
      if (customEndDate) return dateStr <= customEndDate;
      return true;
    }
    return d >= start && d <= now;
  };

  // 2. Real-time dynamic KPI calculations
  // Group A: Sales & Purchases
  const rangeInvoices = invoices.filter(i => i.status !== 'Cancelled' && isWithinRange(i.invoiceDate));
  const rangePurchases = purchases.filter(p => p.paymentStatus !== 'Cancelled' && isWithinRange(p.purchaseDate));
  const rangeExpenses = expenses.filter(e => isWithinRange(e.expenseDate));

  const salesVal = rangeInvoices.reduce((sum, i) => sum + i.total, 0);
  const purchaseVal = rangePurchases.reduce((sum, p) => sum + p.total, 0);
  const expenseVal = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profitVal = salesVal - purchaseVal - expenseVal;

  // Today specific indicators
  const todaySalesVal = invoices.filter(i => i.status !== 'Cancelled' && i.invoiceDate === todayStr).reduce((sum, i) => sum + i.total, 0);
  const todayPurchaseVal = purchases.filter(p => p.paymentStatus !== 'Cancelled' && p.purchaseDate === todayStr).reduce((sum, p) => sum + p.total, 0);
  const todayExpenseVal = expenses.filter(e => e.expenseDate === todayStr).reduce((sum, e) => sum + e.amount, 0);
  const todayProfitVal = todaySalesVal - todayPurchaseVal - todayExpenseVal;

  // Monthly specific indicators
  const monthlySalesVal = invoices.filter(i => i.status !== 'Cancelled' && i.invoiceDate.startsWith(currentMonthStr)).reduce((sum, i) => sum + i.total, 0);
  const monthlyPurchaseVal = purchases.filter(p => p.paymentStatus !== 'Cancelled' && p.purchaseDate.startsWith(currentMonthStr)).reduce((sum, p) => sum + p.total, 0);
  const monthlyExpenseVal = expenses.filter(e => e.expenseDate.startsWith(currentMonthStr)).reduce((sum, e) => sum + e.amount, 0);
  const monthlyProfitVal = monthlySalesVal - monthlyPurchaseVal - monthlyExpenseVal;

  // Group B: Liquidity & Outstandings
  const totalReceivables = parties
    .filter(p => p.balanceType === 'Receivable' && p.isActive)
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayables = parties
    .filter(p => p.balanceType === 'Payable' && p.isActive)
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const cashAccs = accounts.filter(a => a.type === 'Cash' || a.type === 'Petty Cash');
  const bankAccs = accounts.filter(a => a.type === 'Bank' || a.type === 'UPI');
  const cashBalance = cashAccs.reduce((sum, a) => sum + a.currentBalance, 0);
  const bankBalance = bankAccs.reduce((sum, a) => sum + a.currentBalance, 0);

  // Group C: Inventory & Operations
  const stockVal = items
    .filter(it => (it.type === 'Product' || it.type === 'Inventory Product') && it.isActive)
    .reduce((sum, it) => sum + it.currentStock * it.purchasePrice, 0);

  const lowStockItems = items.filter(it => it.isActive && it.currentStock <= it.minimumStock);
  const pendingDueInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid');

  // Group D: Commercial Documents
  const pendingQuotations = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent');
  const pendingProcurement = procurementOrders.filter(o => o.status === 'Draft' || o.status === 'Sent' || o.status === 'Partially Received');
  const pendingProforma = proformaInvoices.filter(p => p.status === 'Draft' || p.status === 'Sent');
  const totalSalesReturns = salesReturns.filter(sr => isWithinRange(sr.returnDate)).reduce((sum, sr) => sum + sr.totalReturnAmount, 0);
  const totalCreditNotes = creditNotes.filter(cn => isWithinRange(cn.creditNoteDate) && cn.status !== 'Cancelled').reduce((sum, cn) => sum + cn.total, 0);

  const todayPaymentIn = payments.filter(p => p.paymentDate === todayStr && p.paymentType === 'Payment In').reduce((sum, p) => sum + p.amount, 0);
  const todayPaymentOut = payments.filter(p => p.paymentDate === todayStr && p.paymentType === 'Payment Out').reduce((sum, p) => sum + p.amount, 0);

  // Live calculation hooks for CRM/Ledger Dashboard widgets
  const topCustomersByOutstanding = React.useMemo(() => {
    return [...parties]
      .filter(p => p.balanceType === 'Receivable' && p.isActive && p.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5);
  }, [parties]);

  const topSuppliersByPayable = React.useMemo(() => {
    return [...parties]
      .filter(p => p.balanceType === 'Payable' && p.isActive && p.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5);
  }, [parties]);

  const recentPartyTransactions = React.useMemo(() => {
    const list: any[] = [];
    invoices.forEach(i => {
      if (i.status !== 'Cancelled') {
        list.push({
          id: i.id,
          date: i.invoiceDate,
          type: 'Invoice',
          partyName: i.partyName,
          ref: i.invoiceNumber,
          amount: i.total,
          direction: 'Debit',
          timestamp: i.createdAt || i.invoiceDate + 'T10:00:00Z'
        });
      }
    });
    purchases.forEach(p => {
      if (p.paymentStatus !== 'Cancelled') {
        list.push({
          id: p.id,
          date: p.purchaseDate,
          type: 'Purchase',
          partyName: p.partyName,
          ref: p.purchaseNumber,
          amount: p.total,
          direction: 'Credit',
          timestamp: p.createdAt || p.purchaseDate + 'T10:00:00Z'
        });
      }
    });
    payments.forEach(p => {
      list.push({
        id: p.id,
        date: p.paymentDate,
          type: p.paymentType,
          partyName: p.partyName,
          ref: p.paymentNumber,
          amount: p.amount,
          direction: p.paymentType === 'Payment In' ? 'Credit' : 'Debit',
          timestamp: p.createdAt || p.paymentDate + 'T12:00:00Z'
        });
      });
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return list.slice(0, 5);
  }, [invoices, purchases, payments]);

  const overdueCustomers = React.useMemo(() => {
    return invoices
      .filter(i => (i.status === 'Unpaid' || i.status === 'Partially Paid') && i.dueDate < todayStr && i.balanceDue > 0)
      .map(i => ({
        partyName: i.partyName,
        invoiceNumber: i.invoiceNumber,
        balanceDue: i.balanceDue,
        dueDate: i.dueDate,
        daysOverdue: Math.max(1, Math.round((Date.now() - new Date(i.dueDate).getTime()) / 86400000))
      }))
      .sort((a, b) => b.balanceDue - a.balanceDue)
      .slice(0, 5);
  }, [invoices, todayStr]);

  const overdueSuppliers = React.useMemo(() => {
    return purchases
      .filter(p => (p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partially Paid') && p.dueDate && p.dueDate < todayStr && p.balanceDue > 0)
      .map(p => ({
        partyName: p.partyName,
        purchaseNumber: p.purchaseNumber,
        balanceDue: p.balanceDue,
        dueDate: p.dueDate,
        daysOverdue: Math.max(1, Math.round((Date.now() - new Date(p.dueDate).getTime()) / 86400000))
      }))
      .sort((a, b) => b.balanceDue - a.balanceDue)
      .slice(0, 5);
  }, [purchases, todayStr]);

  const highestOutstandingAccounts = React.useMemo(() => {
    return [...parties]
      .filter(p => p.isActive && p.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5);
  }, [parties]);



  // 4. Dynamic SVG Chart Data Generator
  const getChartDataPoints = () => {
    let startDate = new Date();
    if (dateFilter === 'Today') {
      startDate.setHours(0,0,0,0);
    } else if (dateFilter === 'Yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0,0,0,0);
    } else if (dateFilter === 'Week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateFilter === 'Month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (dateFilter === 'Quarter') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (dateFilter === 'Year') {
      startDate.setDate(startDate.getDate() - 365);
    } else if (dateFilter === 'Custom' && customStartDate) {
      startDate = new Date(customStartDate);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const duration = now.getTime() - startDate.getTime();
    const intervalMs = duration / 5; // 6 points = 5 intervals
    const points = [];

    for (let i = 0; i <= 5; i++) {
      const pointDate = new Date(startDate.getTime() + i * intervalMs);
      const subStart = new Date(startDate.getTime() + (i - 0.5) * intervalMs);
      const subEnd = new Date(startDate.getTime() + (i + 0.5) * intervalMs);

      // Aggregate collections in this sub-interval
      const subInvoices = invoices.filter(inv => {
        if (inv.status === 'Cancelled') return false;
        const d = new Date(inv.invoiceDate);
        return d >= subStart && d <= subEnd;
      });
      const subPurchases = purchases.filter(p => {
        if (p.paymentStatus === 'Cancelled') return false;
        const d = new Date(p.purchaseDate);
        return d >= subStart && d <= subEnd;
      });
      const subPaymentsIn = payments.filter(pay => {
        if (pay.paymentType !== 'Payment In') return false;
        const d = new Date(pay.paymentDate);
        return d >= subStart && d <= subEnd;
      });
      const subPaymentsOut = payments.filter(pay => {
        if (pay.paymentType !== 'Payment Out') return false;
        const d = new Date(pay.paymentDate);
        return d >= subStart && d <= subEnd;
      });

      const sSum = subInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const pSum = subPurchases.reduce((sum, p) => sum + p.total, 0);
      const payInSum = subPaymentsIn.reduce((sum, pay) => sum + pay.amount, 0);
      const payOutSum = subPaymentsOut.reduce((sum, pay) => sum + pay.amount, 0);

      let label = "";
      if (dateFilter === 'Today') {
        label = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (dateFilter === 'Week' || dateFilter === 'Month') {
        label = pointDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        label = pointDate.toLocaleDateString([], { year: '2-digit', month: 'short' });
      }

      points.push({
        label,
        sales: sSum,
        purchase: pSum,
        cashIn: payInSum,
        cashOut: payOutSum
      });
    }
    return points;
  };

  const chartPoints = getChartDataPoints();

  // 5. Categorized Expense Breakdowns
  const getExpenseCategories = () => {
    const categories: { [key: string]: number } = {};
    rangeExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    const totalExp = Object.values(categories).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(categories)
      .map(([name, val]) => ({ name, value: val, percent: Math.round((val / totalExp) * 100) }))
      .sort((a,b) => b.value - a.value);
  };
  const expenseBreakdown = getExpenseCategories();

  // 6. Product Sales Rankings
  const getTopProducts = () => {
    const prodMap: { [key: string]: { name: string, qty: number, rev: number } } = {};
    rangeInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!prodMap[item.itemId]) {
          prodMap[item.itemId] = { name: item.itemName, qty: 0, rev: 0 };
        }
        prodMap[item.itemId].qty += item.quantity;
        prodMap[item.itemId].rev += item.amount;
      });
    });
    return Object.values(prodMap).sort((a,b) => b.rev - a.rev).slice(0, 5);
  };
  const topProducts = getTopProducts();

  // 7. Top Parties (Customers and Suppliers)
  const getTopCustomers = () => {
    const custMap: { [key: string]: { name: string, total: number, count: number } } = {};
    rangeInvoices.forEach(inv => {
      if (!custMap[inv.partyId]) {
        custMap[inv.partyId] = { name: inv.partyName, total: 0, count: 0 };
      }
      custMap[inv.partyId].total += inv.total;
      custMap[inv.partyId].count += 1;
    });
    return Object.values(custMap).sort((a,b) => b.total - a.total).slice(0, 5);
  };
  const topCustomers = getTopCustomers();

  const getTopSuppliers = () => {
    const supMap: { [key: string]: { name: string, total: number, count: number } } = {};
    rangePurchases.forEach(p => {
      if (!supMap[p.partyId]) {
        supMap[p.partyId] = { name: p.partyName, total: 0, count: 0 };
      }
      supMap[p.partyId].total += p.total;
      supMap[p.partyId].count += 1;
    });
    return Object.values(supMap).sort((a,b) => b.total - a.total).slice(0, 5);
  };
  const topSuppliers = getTopSuppliers();

  // Show sections
  const showFinance = isAdmin;

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard_root">


      {/* Custom Date Input Panel */}
      {dateFilter === 'Custom' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-slide-down flex flex-wrap items-center gap-4" id="custom_date_inputs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              id="custom_start_date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              id="custom_end_date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-[10px] text-slate-400">Values are computed in real time from live transactions</p>
        </div>
      )}



      {/* SECTION 1: CORE BUSINESS KPI BENTO-GRID */}
      {showFinance && (
        <div className="space-y-4" id="kpi_grid_container">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Briefcase size={14} />
              <span>Executive Financial Scorecard ({dateFilter})</span>
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm font-bold">
              Dynamic Live View
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Selected Period Sales */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all duration-200" id="kpi_sales">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range Sales</span>
                <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><TrendingUp size={14} /></span>
              </div>
              <p className="text-lg font-black text-[#163A5F] font-mono">{formatCurrency(salesVal, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>{rangeInvoices.length} transactions</span>
                <span className="text-emerald-600 font-bold">Today: {formatCurrency(todaySalesVal, settings)}</span>
              </div>
            </div>

            {/* KPI 2: Selected Period Purchase */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-all duration-200" id="kpi_purchases">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range Purchases</span>
                <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg"><ShoppingBag size={14} /></span>
              </div>
              <p className="text-lg font-black text-[#163A5F] font-mono">{formatCurrency(purchaseVal, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>{rangePurchases.length} bills</span>
                <span className="text-amber-600 font-bold">Today: {formatCurrency(todayPurchaseVal, settings)}</span>
              </div>
            </div>

            {/* KPI 3: Selected Period Profit */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all duration-200" id="kpi_profit">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range Profit</span>
                <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg"><DollarSign size={14} /></span>
              </div>
              <p className={`text-lg font-black font-mono ${profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(profitVal, settings)}
              </p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>Margins: {salesVal > 0 ? Math.round((profitVal / salesVal) * 100) : 0}%</span>
                <span className="text-emerald-600 font-bold">Month Profit: {formatCurrency(monthlyProfitVal, settings)}</span>
              </div>
            </div>

            {/* KPI 4: Selected Period Expenses */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-rose-300 transition-all duration-200" id="kpi_expenses">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range Expenses</span>
                <span className="bg-rose-50 text-rose-600 p-1.5 rounded-lg"><ArrowUpRight size={14} /></span>
              </div>
              <p className="text-lg font-black text-[#163A5F] font-mono">{formatCurrency(expenseVal, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>{rangeExpenses.length} expense lines</span>
                <span className="text-rose-500 font-bold">Today: {formatCurrency(todayExpenseVal, settings)}</span>
              </div>
            </div>

            {/* KPI 5: Outstanding Receivables */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-red-300 transition-all duration-200" id="kpi_receivables">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receivables</span>
                <span className="bg-rose-50 text-rose-600 p-1.5 rounded-lg"><ArrowDownRight size={14} /></span>
              </div>
              <p className="text-lg font-black text-rose-600 font-mono">{formatCurrency(totalReceivables, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>Unpaid Customer balance</span>
                <span className="font-bold">{pendingDueInvoices.length} invoices pending</span>
              </div>
            </div>

            {/* KPI 6: Outstanding Payables */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-all duration-200" id="kpi_payables">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payables</span>
                <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg"><AlertTriangle size={14} /></span>
              </div>
              <p className="text-lg font-black text-amber-600 font-mono">{formatCurrency(totalPayables, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>Owed to active Suppliers</span>
                <span className="font-bold">Overage balance</span>
              </div>
            </div>

            {/* KPI 7: Cash Liquid Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-300 transition-all duration-200" id="kpi_cash">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Register</span>
                <span className="bg-teal-50 text-teal-600 p-1.5 rounded-lg"><CreditCard size={14} /></span>
              </div>
              <p className="text-lg font-black text-[#163A5F] font-mono">{formatCurrency(cashBalance, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>Petty registers & cash drawer</span>
                <span className="text-emerald-600 font-bold">In today: {formatCurrency(todayPaymentIn, settings)}</span>
              </div>
            </div>

            {/* KPI 8: Bank Liquid Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-all duration-200" id="kpi_bank">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Balance</span>
                <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg"><Briefcase size={14} /></span>
              </div>
              <p className="text-lg font-black text-[#163A5F] font-mono">{formatCurrency(bankBalance, settings)}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                <span>UPI & Current Accounts</span>
                <span className="text-rose-500 font-bold">Out today: {formatCurrency(todayPaymentOut, settings)}</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* SECTION 3: ANALYTICS WORKSPACE - LIVE DYNAMIC SVG CHARTS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="analytics_workspace">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={15} className="text-[#2563EB]" />
              <span>ERP Multi-Dimensional Analytics</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Interactive graphs generated dynamically from live Firestore transactional values</p>
          </div>

          {/* Dynamic Chart Workspace Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              id="chart_tab_sales_vs_purchase"
              onClick={() => setActiveChartTab('sales_vs_purchase')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeChartTab === 'sales_vs_purchase'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sales vs Purchases
            </button>
            <button
              id="chart_tab_cash_flow"
              onClick={() => setActiveChartTab('cash_flow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeChartTab === 'cash_flow'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cash Inflow vs Outflow
            </button>
            <button
              id="chart_tab_expenses"
              onClick={() => setActiveChartTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeChartTab === 'expenses'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expense Analysis
            </button>
            <button
              id="chart_tab_products"
              onClick={() => setActiveChartTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeChartTab === 'products'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Top Selling Products
            </button>
            <button
              id="chart_tab_parties"
              onClick={() => setActiveChartTab('parties')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeChartTab === 'parties'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Top Parties
            </button>
          </div>
        </div>

        {/* CHART WORKSPACE RENDER CONTAINER */}
        <div className="h-64 flex flex-col justify-end" id="chart_workspace_container">
          
          {/* TAB 1: SALES VS PURCHASE LINE TREND */}
          {activeChartTab === 'sales_vs_purchase' && (() => {
            const maxVal = Math.max(...chartPoints.map(p => Math.max(p.sales, p.purchase)), 1000);
            const getSvgY = (v: number) => 170 - (v / maxVal) * 140;

            const salesCoords = chartPoints.map((p, idx) => `${idx * 100} ${getSvgY(p.sales)}`).join(' L ');
            const purchaseCoords = chartPoints.map((p, idx) => `${idx * 100} ${getSvgY(p.purchase)}`).join(' L ');

            return (
              <div className="w-full h-full flex flex-col justify-between animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-1 bg-blue-500 rounded-full inline-block" /> Sales Invoices
                    <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block" /> Purchase Bills
                  </span>
                  <span className="font-mono">Max Value: ₹{maxVal.toLocaleString()}</span>
                </div>
                <div className="relative flex-grow h-44">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sales-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="pur-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="170" x2="500" y2="170" stroke="#f1f5f9" strokeWidth="1" />

                    {/* Gradient areas */}
                    <path d={`M 0 170 L ${salesCoords} L 500 170 Z`} fill="url(#sales-grad)" />
                    <path d={`M 0 170 L ${purchaseCoords} L 500 170 Z`} fill="url(#pur-grad)" />

                    {/* Sales Trend Line */}
                    <path d={`M ${salesCoords}`} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Purchase Trend Line */}
                    <path d={`M ${purchaseCoords}`} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

                    {/* Interaction highlights */}
                    {chartPoints.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={idx * 100} cy={getSvgY(p.sales)} r="3.5" fill="#2563EB" stroke="#ffffff" strokeWidth="1.5" className="hover:scale-150 transition-all duration-100" />
                        <circle cx={idx * 100} cy={getSvgY(p.purchase)} r="3" fill="#F59E0B" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono pt-2 border-t border-slate-100 mt-2">
                  {chartPoints.map((p, idx) => (
                    <span key={idx} className="truncate max-w-[70px] text-center">{p.label}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: CASH FLOW BAR CHART (Payment Collection vs Expense/Out) */}
          {activeChartTab === 'cash_flow' && (() => {
            const maxVal = Math.max(...chartPoints.map(p => Math.max(p.cashIn, p.cashOut)), 1000);
            const getSvgY = (v: number) => 170 - (v / maxVal) * 140;

            return (
              <div className="w-full h-full flex flex-col justify-between animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-teal-500 rounded-sm inline-block" /> Cash Inflow (Receipts)
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block" /> Cash Outflow (Vouchers)
                  </span>
                  <span className="font-mono">Max Value: ₹{maxVal.toLocaleString()}</span>
                </div>
                <div className="relative flex-grow h-44">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="170" x2="500" y2="170" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Rendering double bars */}
                    {chartPoints.map((p, idx) => {
                      const xCenter = idx * 100;
                      const yIn = getSvgY(p.cashIn);
                      const yOut = getSvgY(p.cashOut);
                      return (
                        <g key={idx}>
                          {/* Inflow bar */}
                          <rect
                            x={xCenter - 14}
                            y={yIn}
                            width="10"
                            height={Math.max(0, 170 - yIn)}
                            fill="#0d9488"
                            rx="1.5"
                          />
                          {/* Outflow bar */}
                          <rect
                            x={xCenter + 2}
                            y={yOut}
                            width="10"
                            height={Math.max(0, 170 - yOut)}
                            fill="#e11d48"
                            rx="1.5"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono pt-2 border-t border-slate-100 mt-2">
                  {chartPoints.map((p, idx) => (
                    <span key={idx} className="truncate max-w-[70px] text-center">{p.label}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: EXPENSE ANALYSIS CATEGORIES */}
          {activeChartTab === 'expenses' && (
            <div className="w-full h-full flex flex-col justify-between animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                <span>Expense Outlay Distribution by Ledger Category</span>
                <span className="font-mono">Total Period Expenses: ₹{expenseVal.toLocaleString()}</span>
              </div>
              
              {expenseBreakdown.length === 0 ? (
                <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 rounded-xl py-8">
                  <p className="text-xs text-slate-400">No expenses recorded inside this range</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto space-y-3.5 pr-2">
                  {expenseBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{item.name}</span>
                        <span className="font-mono font-bold text-slate-600">
                          ₹{item.value.toLocaleString()} ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2" />
            </div>
          )}

          {/* TAB 4: TOP SELLING PRODUCTS */}
          {activeChartTab === 'products' && (
            <div className="w-full h-full flex flex-col justify-between animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                <span>Products Ranking by Cumulative Invoice Valuation</span>
                <span className="font-bold text-xs bg-[#2563EB] text-white px-2 py-0.5 rounded-full font-mono">Live Rank</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 rounded-xl py-8">
                  <p className="text-xs text-slate-400">No invoice sales recorded inside this range</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                  {topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                      <div className="flex items-center space-x-2.5 truncate max-w-[280px]">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-6 shrink-0 font-mono">
                        <span className="text-slate-400 text-[11px]">{item.qty} units sold</span>
                        <span className="font-bold text-[#163A5F]">₹{item.rev.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2" />
            </div>
          )}

          {/* TAB 5: TOP CLIENTS / SUPPLIERS */}
          {activeChartTab === 'parties' && (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {/* Customers side */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Users size={11} className="text-blue-500" />
                  <span>Top Customers (Sales Billing)</span>
                </span>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1 border-r border-slate-100">
                  {topCustomers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No client billing detected</p>
                  ) : (
                    topCustomers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs pb-1 border-b border-slate-50">
                        <span className="text-slate-700 font-bold truncate max-w-[120px]">{p.name}</span>
                        <span className="font-mono text-emerald-600 font-bold">₹{p.total.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Suppliers side */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Users size={11} className="text-amber-500" />
                  <span>Top Suppliers (Inward Procurement)</span>
                </span>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                  {topSuppliers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No inward bills detected</p>
                  ) : (
                    topSuppliers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs pb-1 border-b border-slate-50">
                        <span className="text-slate-700 font-bold truncate max-w-[120px]">{p.name}</span>
                        <span className="font-mono text-amber-600 font-bold">₹{p.total.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: LIVE LEDGER & OPERATIONS BENTO GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" id="live_ledger_bento_grid">
        
        {/* BENTO CARD 1: OUTSTANDING LEDGER RATIOS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600" />
                <span>Outstanding Balances Leaderboard</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Top ledger accounts with active unpaid credit balances</p>
            </div>
            <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono uppercase">Live DB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Customers (Receivable) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block bg-rose-50/50 py-1 px-2 rounded">
                Top Customers (Receivable)
              </span>
              {topCustomersByOutstanding.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No outstanding client receivables</p>
              ) : (
                <div className="space-y-2">
                  {topCustomersByOutstanding.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-700 truncate max-w-[140px]">{p.name}</span>
                      <span className="font-mono text-rose-600 font-bold">₹{p.currentBalance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Suppliers (Payable) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block bg-emerald-50/50 py-1 px-2 rounded">
                Top Suppliers (Payable)
              </span>
              {topSuppliersByPayable.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No outstanding supplier payables</p>
              ) : (
                <div className="space-y-2">
                  {topSuppliersByPayable.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-700 truncate max-w-[140px]">{p.name}</span>
                      <span className="font-mono text-emerald-600 font-bold">₹{p.currentBalance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateToTab('party_ledger')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1"
            >
              <span>View Full Party Ledger Module</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* BENTO CARD 2: OVERDUE LEDGER ACCOUNTS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>Overdue Invoices & Inward Bills</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Unpaid bills past their standard credit payment due dates</p>
            </div>
            <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-mono uppercase">Overdue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Overdue Customers */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block bg-slate-50 py-1 px-2 rounded">
                Overdue Customers
              </span>
              {overdueCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No overdue client invoices</p>
              ) : (
                <div className="space-y-2">
                  {overdueCustomers.map((inv, idx) => (
                    <div key={idx} className="flex flex-col text-xs pb-1.5 border-b border-slate-50 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 truncate max-w-[120px]">{inv.partyName}</span>
                        <span className="font-mono text-rose-600 font-bold">₹{inv.balanceDue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{inv.invoiceNumber}</span>
                        <span className="text-rose-500 font-bold">Overdue {inv.daysOverdue}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Suppliers */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block bg-slate-50 py-1 px-2 rounded">
                Overdue Suppliers
              </span>
              {overdueSuppliers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No overdue vendor bills</p>
              ) : (
                <div className="space-y-2">
                  {overdueSuppliers.map((p, idx) => (
                    <div key={idx} className="flex flex-col text-xs pb-1.5 border-b border-slate-50 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 truncate max-w-[120px]">{p.partyName}</span>
                        <span className="font-mono text-amber-600 font-bold">₹{p.balanceDue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{p.purchaseNumber}</span>
                        <span className="text-amber-600 font-bold">Overdue {p.daysOverdue}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BENTO CARD 3: RECENT PARTY TRANSACTIONS FEED */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-[#2563EB]" />
                <span>Recent Party Ledger Transactions Feed</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time ledger audit trail showing invoices, purchases, and payments</p>
            </div>
            <span className="text-[9px] font-bold bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded font-mono uppercase">Real-Time</span>
          </div>

          {recentPartyTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No party transactions recorded in the system yet</p>
          ) : (
            <div className="space-y-3">
              {recentPartyTransactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100/50 hover:bg-slate-50/50 p-1.5 rounded-lg transition duration-150">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${tx.direction === 'Debit' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <div>
                      <span className="font-bold text-slate-800 block">{tx.partyName}</span>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tx.type}</span>
                        <span>{tx.ref}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${tx.direction === 'Debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.direction === 'Debit' ? '-' : '+'} ₹{tx.amount.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{tx.direction === 'Debit' ? 'Dr (Debit)' : 'Cr (Credit)'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BENTO CARD 4: OPERATIONS & INVENTORY SAFETY LIST */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={14} className="text-purple-600" />
                <span>Highest Balances & Stock Alerts</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Top total ledger balances and inventory replenishment safety triggers</p>
            </div>
            <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-mono uppercase">Alerts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Highest Outstanding Accounts */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block bg-slate-50 py-1 px-2 rounded">
                Highest Ledger Balances
              </span>
              {highestOutstandingAccounts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active ledger balances</p>
              ) : (
                <div className="space-y-2">
                  {highestOutstandingAccounts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                      <span className="font-mono text-slate-600 font-bold">
                        ₹{p.currentBalance.toLocaleString()} <span className="text-[9px] text-slate-400">{p.balanceType === 'Receivable' ? 'Dr' : 'Cr'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock alerts */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block bg-rose-50 py-1 px-2 rounded">
                Low Stock Triggers
              </span>
              {lowStockItems.length === 0 ? (
                <div className="py-4 flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-lg">
                  <p className="text-xs text-slate-400">All inventory safety safety levels healthy</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                      <span className="font-bold text-slate-700 truncate max-w-[110px]">{item.name}</span>
                      <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                        {item.currentStock} / {item.minimumStock}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 5: RECENT TRANSACTIONS FEED (Sales Bills) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="recent_invoices_section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Transaction Sales Book Feed</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time listing of active invoices recorded across the database</p>
          </div>
          <button
            id="btn_view_all_sales"
            onClick={() => onNavigateToTab('sales')}
            className="text-xs text-[#2563EB] hover:underline font-bold flex items-center space-x-1"
          >
            <span>Open Sales Ledger</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="recent_invoices_table">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Invoice Code</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3">Bill Date</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Amount Paid</th>
                <th className="py-2.5 px-3 text-right">Settlement status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No active invoices found in the ledger database
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 text-xs transition-colors duration-100">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700 truncate max-w-[160px]">{inv.partyName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{inv.invoiceDate}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">₹{inv.total.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 font-bold">₹{inv.amountPaid.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        inv.status === 'Cancelled' ? 'bg-slate-50 text-slate-400 border border-slate-200' :
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
  );
}
