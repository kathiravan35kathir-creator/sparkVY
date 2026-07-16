import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckSquare,
  Trash2,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void; // Optional delete log
  isAdmin: boolean;
}

export default function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  isAdmin
}: NotificationsViewProps) {
  const [filterUnread, setFilterUnread] = useState(false);

  const filteredList = notifications.filter((n) => {
    return !filterUnread || !n.isRead;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />;
      case 'danger':
        return <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />;
      default:
        return <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* Top Banner Control */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Notification Center & Alerts</h2>
          <p className="text-xs text-slate-500 mt-1">Review auto-triggered reminders for laboratory turnaround limits, customer payments, and reagent safety.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              filterUnread
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {filterUnread ? 'Showing Unread Alerts' : 'Filter Unread'}
          </button>
          <button
            onClick={onMarkAllRead}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
          >
            <CheckSquare size={13} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Main List canvas */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden max-w-4xl">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="mx-auto text-slate-200 mb-3" size={36} />
            <p className="font-bold text-sm">Your alert logs are perfectly empty</p>
            <p className="text-xs mt-1">We will notify you here of upcoming calibrations, low stock levels, and diagnostic delays.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.slice().reverse().map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between space-x-4 transition ${
                  n.isRead ? 'bg-white' : 'bg-blue-50/25 border-l-2 border-blue-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getIcon(n.type)}
                  <div>
                    <h4 className={`text-slate-800 ${n.isRead ? 'font-semibold' : 'font-extrabold'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1.5 flex items-center space-x-1">
                      <Clock size={11} />
                      <span>{n.timestamp}</span>
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Mark as Read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
