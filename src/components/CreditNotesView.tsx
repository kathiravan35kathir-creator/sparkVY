import React, { useState } from 'react';
import {
  Search,
  Plus,
  Printer,
  XCircle,
  Receipt,
  RotateCcw,
  PlusCircle,
  ChevronRight,
  Package,
  History,
  Lock,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';
import { CreditNote, Party, Invoice, AppSettings, CreditNoteStatus } from '../types';
import DocumentPrintView from './DocumentPrintView';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';

interface CreditNotesViewProps {
  creditNotes: CreditNote[];
  parties: Party[];
  onIssueRefund: (cnId: string, amount: number, accountId: string) => void;
  onAdjustAgainstInvoice: (cnId: string, invoiceId: string, amount: number) => void;
  onDeleteCreditNote?: (id: string) => void;
  isAdmin: boolean;
  settings: AppSettings;
}

export default function CreditNotesView({
  creditNotes,
  parties,
  onIssueRefund,
  onAdjustAgainstInvoice,
  onDeleteCreditNote,
  isAdmin,
  settings
}: CreditNotesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingNote, setViewingNote] = useState<CreditNote | null>(null);
  const [adjustingNote, setAdjustingNote] = useState<CreditNote | null>(null);
  const [refundingNote, setRefundingNote] = useState<CreditNote | null>(null);

  const filtered = creditNotes.filter(cn => {
    const q = searchQuery.trim().toLowerCase();
    const party = parties.find(p => p.id === cn.partyId);
    return (
      !q ||
      (cn.creditNoteNumber && cn.creditNoteNumber.toLowerCase().includes(q)) ||
      (cn.partyName && cn.partyName.toLowerCase().includes(q)) ||
      (party?.phone && party.phone.toLowerCase().includes(q)) ||
      (party?.alternatePhone && party.alternatePhone.toLowerCase().includes(q)) ||
      (cn.reason && cn.reason.toLowerCase().includes(q)) ||
      (cn.notes && cn.notes.toLowerCase().includes(q)) ||
      (cn.id && cn.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt size={20} className="text-rose-600" />
            Credit Notes
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage customer credits, adjust against bills, or process refunds.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 flex gap-3 shadow-sm items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search credit note #, customer, phone, reason, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border rounded-lg pl-9 pr-8 py-2 text-xs focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg shrink-0">
            {filtered.length} Matching
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">CN Number</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Total Credit</th>
              <th className="p-4 text-right">Adjusted</th>
              <th className="p-4 text-right">Balance</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-12 text-center text-slate-500 font-medium">No matching records found.</td></tr>
            ) : (
              filtered.map((cn) => {
                const balance = cn.total - cn.adjustedAmount - cn.refundAmount;
                return (
                  <tr key={cn.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 font-mono font-bold text-rose-900">{cn.creditNoteNumber}</td>
                    <td className="p-4 font-bold">{cn.partyName}</td>
                    <td className="p-4 font-mono text-slate-500">{cn.creditNoteDate}</td>
                    <td className="p-4 text-right font-bold text-slate-900">₹{cn.total.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">₹{cn.adjustedAmount.toLocaleString()}</td>
                    <td className="p-4 text-right font-black text-rose-600">₹{balance.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        cn.status === 'Fully Adjusted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        cn.status === 'Issued' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-slate-50 text-slate-500'
                      }`}>{cn.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewingNote(cn)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Print Credit Note"><Printer size={14} /></button>
                        {balance > 0 && (
                          <>
                            <button onClick={() => setAdjustingNote(cn)} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 text-[10px] font-bold hover:bg-blue-100" title="Adjust against Invoice">
                              Adjust
                            </button>
                            <button onClick={() => setRefundingNote(cn)} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 text-[10px] font-bold hover:bg-amber-100" title="Issue Refund">
                              Refund
                            </button>
                          </>
                        )}
                        {isAdmin && onDeleteCreditNote && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete Credit Note ${cn.creditNoteNumber}?`)) {
                                onDeleteCreditNote(cn.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Move to Trash"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {viewingNote && (
        <DocumentPrintView
          documentType="credit_note"
          data={viewingNote}
          settings={settings}
          onClose={() => setViewingNote(null)}
        />
      )}

      {/* Adjust Modal */}
      {adjustingNote && (
        <AdjustCreditNoteModal
          creditNote={adjustingNote}
          onClose={() => setAdjustingNote(null)}
          onAdjust={onAdjustAgainstInvoice}
        />
      )}

      {/* Refund Modal */}
      {refundingNote && (
        <RefundCreditNoteModal
          creditNote={refundingNote}
          onClose={() => setRefundingNote(null)}
          onRefund={onIssueRefund}
        />
      )}
    </div>
  );
}

function AdjustCreditNoteModal({ creditNote, onClose, onAdjust }: { creditNote: CreditNote, onClose: () => void, onAdjust: any }) {
  // Mocking list of unpaid invoices for simplicity in this view - in real app would come from props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Adjust Credit Note {creditNote.creditNoteNumber}</h3>
        <p className="text-xs text-slate-500">This feature would list pending invoices for <b>{creditNote.partyName}</b> and allow selecting one to apply the credit.</p>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800">This adjustment will reduce the customer's outstanding balance on the selected invoice.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50">Close</button>
          <button onClick={() => { alert('Adjustment logic would be triggered here'); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Confirm Adjustment</button>
        </div>
      </div>
    </div>
  );
}

function RefundCreditNoteModal({ creditNote, onClose, onRefund }: { creditNote: CreditNote, onClose: () => void, onRefund: any }) {
  const [amount, setAmount] = useState(creditNote.total - creditNote.adjustedAmount - creditNote.refundAmount);
  const maxRefund = creditNote.total - creditNote.adjustedAmount - creditNote.refundAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Refund Credit Note</h3>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount</label>
          <NumericInput
            value={amount}
            onChange={(val) => setAmount(val)}
            allowDecimal={true}
            decimalScale={2}
            min={0}
            max={maxRefund}
            className="w-full border rounded p-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Payment Account</label>
          <select className="w-full border rounded p-2 text-xs">
            <option>Petty Cash</option>
            <option>HDFC Bank</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
          <button onClick={() => { onRefund(creditNote.id, toSafeNumber(amount), 'acc-1'); onClose(); }} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold">Issue Refund</button>
        </div>
      </div>
    </div>
  );
}
