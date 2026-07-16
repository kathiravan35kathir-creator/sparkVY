import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  User,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  isAdmin: boolean;
}

export default function AuditLogsView({
  auditLogs,
  isAdmin
}: AuditLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterAction, setFilterAction] = useState('All');

  // Find unique modules & actions for filter options
  const uniqueModules = Array.from(new Set(auditLogs.map((log) => log.module)));
  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = filterModule === 'All' || log.module === filterModule;
    const matchesAction = filterAction === 'All' || log.action === filterAction;

    return matchesSearch && matchesModule && matchesAction;
  });

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* Top Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">System Audit Trials & Security Logs</h2>
          <p className="text-xs text-slate-500 mt-1">NABL accredited tamper-proof trace history logging all creation, deactivation, and finalization steps.</p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>ISO/IEC 17025 Compliant Trails</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search auditor, changed record..."
            className="pl-8 pr-3 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Module:</span>
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
          >
            <option value="All">All Modules</option>
            {uniqueModules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Action type:</span>
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="All">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit logs listing table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="font-bold text-sm">No trace logs matched your query</p>
              <p className="text-xs">Try clearing some query filter filters above.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                  <th className="p-3">Logged Date & Time</th>
                  <th className="p-3">User Signature</th>
                  <th className="p-3">Action Description</th>
                  <th className="p-3">System Module</th>
                  <th className="p-3">Target Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-500">{log.timestamp}</td>
                    <td className="p-3 font-bold text-slate-800 flex items-center space-x-1.5">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                        {log.user.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{log.user}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      <span className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">
                      {log.recordName}
                      <span className="text-[10px] text-slate-400 ml-1">({log.recordId})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
