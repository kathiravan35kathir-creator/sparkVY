import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Lock,
  Bookmark,
  Award
} from 'lucide-react';

interface StaffRolesViewProps {
  isAdmin: boolean;
}

export default function StaffRolesView({ isAdmin }: StaffRolesViewProps) {
  // Mock staff list
  const [staff, setStaff] = useState([
    { id: 'st-1', name: 'Dr. J. N. Rao', role: 'Super Admin', email: 'director@labbiz.in', mobile: '9900123456', status: 'Active', signRights: true },
    { id: 'st-2', name: 'Savitha Gowda', role: 'Lab Manager', email: 'manager@labbiz.in', mobile: '9900123457', status: 'Active', signRights: true },
    { id: 'st-3', name: 'Ramesh Kumar', role: 'Receptionist', email: 'reception@labbiz.in', mobile: '9900123458', status: 'Active', signRights: false },
    { id: 'st-4', name: 'Dr. Anil Mehta', role: 'Reviewer', email: 'reviewer@labbiz.in', mobile: '9900123459', status: 'Active', signRights: true },
    { id: 'st-5', name: 'Vikas Deshmukh', role: 'Lab Technician', email: 'tech1@labbiz.in', mobile: '9900123460', status: 'Active', signRights: false },
    { id: 'st-6', name: 'Priya Sharma', role: 'Accountant', email: 'accounts@labbiz.in', mobile: '9900123461', status: 'Active', signRights: false },
    { id: 'st-7', name: 'Sandeep Patil', role: 'Inventory Staff', email: 'stores@labbiz.in', mobile: '9900123462', status: 'Active', signRights: false },
  ]);

  // Roles permission matrix
  const permissionsMatrix = [
    { module: 'Parties & CRM', adminOnly: false },
    { module: 'Billing & Invoicing', adminOnly: true },
    { module: 'LIMS Sample Intake', adminOnly: false },
    { module: 'Analytical Worksheets', adminOnly: false },
    { module: 'NABL Report Approval', adminOnly: true },
    { module: 'Physical Reagents & Stock', adminOnly: false },
    { module: 'Expense Ledger & cash books', adminOnly: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Staff Directories & Role Credentials</h2>
        <p className="text-xs text-slate-500 mt-1">Audit security profiles, NABL electronic signature authorization rights, and module view rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Staff Directory list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden lg:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
            <Users size={16} className="text-blue-600" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Registered Officers</h3>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Officer Particulars</th>
                  <th className="py-2.5 px-4">Clearance Role</th>
                  <th className="py-2.5 px-4 text-center">NABL Signatory Rights</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-800">{st.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{st.email} | {st.mobile}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1.5 font-bold text-slate-700">
                        <Shield size={12} className="text-[#2563EB]" />
                        <span>{st.role}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {st.signRights ? (
                        <span className="inline-block text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          AUTHORIZED
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                        <span>{st.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Security Matrix Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
            <Lock size={15} className="text-rose-500" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Access Rights Grid</h3>
          </div>
          <div className="p-4 space-y-4 text-xs">
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              Verification rules enforce absolute separation of accounts ledger, physical reagent cupboards, and analytical results inputs.
            </p>

            <div className="divide-y divide-slate-100">
              {permissionsMatrix.map((item, idx) => {
                const hasAccess = !item.adminOnly || isAdmin;
                return (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.module}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        Allowed clearance: {item.adminOnly ? 'Admin Only' : 'All Staff'}
                      </p>
                    </div>
                    {hasAccess ? (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase shrink-0">
                        GRANTED
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded border border-slate-200 uppercase shrink-0">
                        RESTRICTED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
