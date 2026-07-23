import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  CreditCard,
  TrendingDown,
  Boxes,
  Activity,
  UserCheck,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  BookOpen
} from 'lucide-react';
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isAdmin: boolean;
  settings?: any;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  isAdmin,
  settings
}: SidebarProps) {
  // Check permission of current role for sidebar tabs
  const hasAccess = (tab: string): boolean => {
    if (settings?.generalFeatures) {
      if (tab === 'quotations' && settings.generalFeatures.estimateQuotationEnabled === false) return false;
      if (tab === 'proforma' && settings.generalFeatures.proformaInvoiceEnabled === false) return false;
      if (tab === 'procurement' && settings.generalFeatures.procurementOrderEnabled === false) return false;
    }

    if (isAdmin) return true;
    // Staff (non-admin) has access to everything except sensitive system, settings, staff, financial reports and trash
    return ![
      'settings', 'audit_logs', 'staff', 'accounts', 'expenses', 'reports', 'payment_out', 'trash'
    ].includes(tab);
  };

  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'PARTIES & ITEMS',
      items: [
        { id: 'parties', name: 'Parties (Clients/Vendors)', icon: Users },
        { id: 'party_ledger', name: '⭐ Party Ledger', icon: BookOpen },
        { id: 'items', name: 'Items & Services', icon: Package }
      ]
    },
    {
      title: 'SALES',
      items: [
        { id: 'quotations', name: 'Quotations', icon: FileSpreadsheet },
        { id: 'proforma', name: 'Proforma Invoices', icon: ClipboardList },
        { id: 'sales', name: 'Sales & Invoices', icon: FileText },
        { id: 'returns', name: 'Sales Returns', icon: RotateCcw },
        { id: 'credit_notes', name: 'Credit Notes', icon: Receipt }
      ]
    },
    {
      title: 'PURCHASES',
      items: [
        { id: 'procurement', name: 'Procurement Orders', icon: Briefcase },
        { id: 'purchases', name: 'Purchases & Stock In', icon: ShoppingBag }
      ]
    },
    {
      title: 'CASH & BANK',
      items: [
        { id: 'payment_in', name: 'Payment In', icon: ArrowDownLeft },
        { id: 'payment_out', name: 'Payment Out', icon: ArrowUpRight },
        { id: 'expenses', name: 'Expenses', icon: TrendingDown }
      ]
    },
    {
      title: 'REPORTS & SYSTEM',
      items: [
        { id: 'reports', name: 'Business Reports', icon: Activity },
        { id: 'trash', name: 'Trash / Deleted', icon: History },
        { id: 'settings', name: 'Settings & DB', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      id="sidebar-container"
      className={`sidebar-gradient text-slate-100 flex flex-col h-screen sticky top-0 transition-all duration-300 border-r border-slate-800/80 shrink-0 select-none z-30 shadow-xl ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[60px] flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        {!collapsed && (
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white w-7 h-7 rounded-lg font-black flex items-center justify-center text-xs tracking-wider shadow-md shadow-blue-500/20 shrink-0 border border-blue-400/30">
              {settings?.company?.displayCompanyName ? settings.company.displayCompanyName.substring(0, 2).toUpperCase() : 'BO'}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[13px] tracking-tight text-white truncate max-w-[130px]" title={settings?.company?.displayCompanyName || settings?.company?.companyName || 'BIZOPS'}>
                {settings?.company?.displayCompanyName || settings?.company?.companyName || 'BIZOPS'}
              </h1>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[8px] text-blue-400 font-bold tracking-widest uppercase">ERP & CRM</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto bg-gradient-to-tr from-blue-600 to-indigo-500 text-white w-7 h-7 rounded-lg font-bold text-[11px] uppercase flex items-center justify-center shadow-md shadow-blue-500/20">
            {settings?.company?.displayCompanyName ? settings.company.displayCompanyName.substring(0, 2).toUpperCase() : 'BO'}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 focus:outline-none transition-colors border border-transparent hover:border-slate-700/60"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-slate-800 space-y-3">
        {menuGroups.map((group, groupIdx) => {
          // Filter items based on active role permissions
          const allowedItems = group.items.filter((item) => hasAccess(item.id));
          if (allowedItems.length === 0) return null;

          return (
            <div key={groupIdx}>
              {!collapsed && (
                <p className="px-4 text-[9px] font-bold text-slate-500/90 tracking-widest uppercase mb-1.5">
                  {group.title}
                </p>
              )}
              <nav className="space-y-0.5 px-2">
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isFeatured = item.id === 'party_ledger';

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 group relative ${
                        isActive
                           ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white font-semibold border-l-2 border-blue-500 shadow-sm shadow-blue-900/30'
                           : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center min-w-0">
                        <Icon 
                          size={15} 
                          className={`${collapsed ? 'mx-auto' : 'mr-2.5'} shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                            isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`} 
                        />
                        {!collapsed && (
                          <span className="truncate">{item.name.replace('⭐ ', '')}</span>
                        )}
                      </div>
                      
                      {!collapsed && isFeatured && (
                        <span className="ml-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs">
                          NEW
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Role Indicator Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        {!collapsed ? (
          <div className="bg-slate-800/60 py-1.5 px-2.5 rounded-lg border border-slate-700/50 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 font-medium">Clearance Level</p>
              <p className="text-[11px] font-extrabold text-amber-400 truncate">{isAdmin ? 'Administrator' : 'Staff Access'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" title="System Active"></div>
          </div>
        ) : (
          <div className="h-3 w-3 bg-amber-400 rounded-full mx-auto ring-4 ring-amber-400/20" title={`Clearance: ${isAdmin ? 'Admin' : 'Staff'}`} />
        )}
      </div>
    </aside>
  );
}
