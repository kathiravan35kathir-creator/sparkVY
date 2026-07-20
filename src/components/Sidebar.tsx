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
  Briefcase
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
    if (isAdmin) return true;
    // Staff (non-admin) has access to everything except sensitive system, settings, staff and financial reports
    return ![
      'settings', 'audit_logs', 'staff', 'accounts', 'expenses', 'reports', 'payment_out'
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
        { id: 'settings', name: 'Settings & DB Demo', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      id="sidebar-container"
      className={`bg-[#102A43] text-slate-100 flex flex-col h-screen sticky top-0 transition-all duration-300 border-r border-[#173F63] shrink-0 select-none z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#173F63] bg-[#102A43]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="bg-[#2563EB] text-white px-2 py-0.5 rounded font-black flex items-center justify-center text-xs tracking-wider shadow shrink-0">
              {settings?.company?.displayCompanyName ? settings.company.displayCompanyName.substring(0, 2).toUpperCase() : 'BO'}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[13px] tracking-tight text-white truncate max-w-[130px]" title={settings?.company?.displayCompanyName || settings?.company?.companyName || 'BIZOPS'}>
                {settings?.company?.displayCompanyName || settings?.company?.companyName || 'BIZOPS'}
              </h1>
              <p className="text-[8px] text-blue-400 font-bold tracking-wider uppercase">ERP & CRM</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto bg-[#2563EB] text-white p-1.5 rounded font-bold text-[11px] uppercase">
            {settings?.company?.displayCompanyName ? settings.company.displayCompanyName.substring(0, 2).toUpperCase() : 'BO'}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#173F63] focus:outline-none"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-3.5 scrollbar-thin scrollbar-thumb-slate-800">
        {menuGroups.map((group, groupIdx) => {
          // Filter items based on active role permissions
          const allowedItems = group.items.filter((item) => hasAccess(item.id));
          if (allowedItems.length === 0) return null;

          return (
            <div key={groupIdx} className="mb-3">
              {!collapsed && (
                <p className="px-4 text-[9px] font-bold text-slate-500 tracking-wider mb-1">
                  {group.title}
                </p>
              )}
              <nav className="space-y-0.5 px-2">
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors duration-150 ${
                        isActive
                           ? 'bg-[#173F63] text-white shadow-sm font-semibold'
                           : 'text-slate-300 opacity-80 hover:opacity-100 hover:bg-[#173F63]/50 hover:text-white'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon size={14} className={`${collapsed ? 'mx-auto' : 'mr-2.5'} shrink-0`} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Role Indicator Footer */}
      <div className="p-2 border-t border-[#173F63] bg-[#102A43] text-center">
        {!collapsed ? (
          <div className="bg-[#173F63]/40 py-1.5 px-2 rounded">
            <p className="text-[9px] text-slate-400">Clearance Status</p>
            <p className="text-[11px] font-bold text-amber-400 truncate mt-0.5">{isAdmin ? 'Admin' : 'Staff'}</p>
          </div>
        ) : (
          <div className="h-3 w-3 bg-amber-400 rounded-full mx-auto" title={`Clearance: ${isAdmin ? 'Admin' : 'Staff'}`} />
        )}
      </div>
    </aside>
  );
}
