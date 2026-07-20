import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  Sliders,
  Check,
  CheckSquare
} from 'lucide-react';
import { AppNotification } from '../types';

interface HeaderProps {
  currentUser: any;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  onLogout: () => void;
  activeTab: string;
}

export default function Header({
  currentUser,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  globalSearchQuery,
  onGlobalSearchChange,
  onLogout,
  activeTab
}: HeaderProps) {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User';
  const initials = userName.substring(0, 2).toUpperCase();

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview > Dashboard';
      case 'parties':
        return 'Business > Parties Registry';
      case 'items':
        return 'Business > Catalog & Services';
      case 'quotations':
        return 'Business > Quotations';
      case 'sales':
        return 'Business > Sales & Tax Invoices';
      case 'purchases':
        return 'Business > Purchases & Receipts';
      case 'payments':
        return 'Business > Cash Payments';
      case 'expenses':
        return 'Business > Expenses Ledger';
      case 'accounts':
        return 'Finance > Cash & Bank Accounts';
      case 'reports':
        return 'Finance > Analytical Business Reports';
      case 'staff':
        return 'System > Staff & Access Controls';
      case 'notifications':
        return 'System > Notifications Dispatch';
      case 'audit_logs':
        return 'System > Detailed Audit Trail';
      case 'settings':
        return 'System > Settings Panel';
      default:
        return 'Operations';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-[60px] sticky top-0 flex items-center justify-between px-4 z-20 shadow-sm select-none">
      {/* Search and Breadcrumbs */}
      <div className="flex items-center space-x-4 flex-1">
        <div className="hidden md:block">
          <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
            Internal Operations System
          </p>
          <p className="text-xs font-semibold text-[#172033] mt-0.5">{getBreadcrumb()}</p>
        </div>

        {/* Global Search */}
        <div className="relative max-w-xs w-full">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search system..."
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md pl-8 pr-4 py-1 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {globalSearchQuery && (
            <button
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-1 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Control Actions / Switchers */}
      <div className="flex items-center space-x-3">
        {/* Notifications Dispatch */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">Operational Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        onMarkAllRead();
                        setShowNotificationMenu(false);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-slate-400">No active notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-slate-50 transition ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <h5 className="text-xs font-bold text-slate-800">{n.title}</h5>
                          {!n.isRead && (
                            <button
                              onClick={() => onMarkNotificationRead(n.id)}
                              className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm hover:bg-blue-200"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1.5">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            {currentUser?.profile_photo ? (
              <img src={currentUser.profile_photo} alt={userName} className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold font-mono">
                {initials}
              </div>
            )}
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-800 leading-3">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{currentUser?.designation || 'Staff'}</p>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Logged in as</p>
                  <p className="text-[11px] text-slate-500 font-mono break-all">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold border-t border-slate-100 flex items-center justify-between"
                >
                  <span>Logout</span>
                  <LogOut size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
