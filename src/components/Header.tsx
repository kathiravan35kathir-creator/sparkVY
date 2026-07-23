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
  const [currentTime, setCurrentTime] = useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User';
  const initials = userName.substring(0, 2).toUpperCase();

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview > Dashboard';
      case 'parties':
        return 'Business > Parties Registry';
      case 'party_ledger':
        return 'Financials > Party Ledger Hub';
      case 'items':
        return 'Business > Catalog & Services';
      case 'quotations':
        return 'Business > Quotations';
      case 'proforma':
        return 'Sales > Proforma Invoices';
      case 'sales':
        return 'Business > Sales & Tax Invoices';
      case 'returns':
        return 'Sales > Sales Returns';
      case 'credit_notes':
        return 'Sales > Credit Notes';
      case 'procurement':
        return 'Purchases > Procurement Orders';
      case 'purchases':
        return 'Purchases > Goods Stock In';
      case 'payment_in':
        return 'Cash & Bank > Payment Received';
      case 'payment_out':
        return 'Cash & Bank > Payment Sent';
      case 'expenses':
        return 'Business > Expenses Ledger';
      case 'reports':
        return 'Finance > Analytical Business Reports';
      case 'settings':
        return 'System > Settings & Database';
      default:
        return 'Operations Hub';
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/90 h-[60px] sticky top-0 flex items-center justify-between px-4 z-20 shadow-xs select-none">
      {/* Search and Breadcrumbs */}
      <div className="flex items-center space-x-5 flex-1">
        <div className="hidden lg:block">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">
              BizOps Enterprise ERP
            </p>
          </div>
          <p className="text-[12px] font-bold text-slate-800 mt-0.5">{getBreadcrumb()}</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-sm w-full">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search parties, invoices, items..."
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-lg pl-8 pr-12 py-1.5 text-xs focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {globalSearchQuery ? (
            <button
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition"
            >
              Clear
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200 px-1 rounded shadow-xs hidden sm:inline-block">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Right Control Actions */}
      <div className="flex items-center space-x-3">
        {/* Live System Time Badge */}
        {currentTime && (
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100/80 border border-slate-200/80 rounded-md text-[11px] font-mono text-slate-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentTime}</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition border border-transparent hover:border-slate-200"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800">Operational System Dispatch</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        onMarkAllRead();
                        setShowNotificationMenu(false);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-slate-400 font-medium">No active system alerts</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 hover:bg-slate-50/80 transition ${!n.isRead ? 'bg-blue-50/50 border-l-2 border-blue-500' : ''}`}
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <h5 className="text-xs font-bold text-slate-800">{n.title}</h5>
                          {!n.isRead && (
                            <button
                              onClick={() => onMarkNotificationRead(n.id)}
                              className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-200 cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">
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

        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1 hover:bg-slate-100/80 rounded-lg transition border border-transparent hover:border-slate-200 cursor-pointer"
          >
            {currentUser?.profile_photo ? (
              <img src={currentUser.profile_photo} alt={userName} className="h-7 w-7 rounded-full object-cover ring-2 ring-blue-500/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-[11px] font-black font-mono shadow-xs">
                {initials}
              </div>
            )}
            <div className="text-left hidden lg:block pr-1">
              <p className="text-xs font-extrabold text-slate-800 leading-tight">{userName}</p>
              <p className="text-[9.5px] text-slate-500 font-medium">{currentUser?.designation || (currentUser?.isAdmin ? 'Administrator' : 'Staff Member')}</p>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-100">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-bold text-slate-800">{userName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    {currentUser?.isAdmin ? 'Master Administrator' : 'Standard Operator'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold flex items-center justify-between cursor-pointer transition"
                >
                  <span>Sign Out</span>
                  <LogOut size={13} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
