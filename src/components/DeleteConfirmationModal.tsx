import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Archive, CheckCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  recordType: string;
  recordNumber: string;
  partyName?: string;
  date?: string;
  amount?: number;
  impactSummary?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  alternativeAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  recordType,
  recordNumber,
  partyName,
  date,
  amount,
  impactSummary,
  isBlocked = false,
  blockedReason,
  alternativeAction
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${isBlocked ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isBlocked ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {isBlocked ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${isBlocked ? 'text-amber-900' : 'text-rose-950'}`}>
                {isBlocked ? 'Deletion Blocked' : title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {recordType}: <span className="font-bold text-slate-800">{recordNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Record summary card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 font-medium">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Record Details</span>
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-extrabold">{recordType}</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900">{recordNumber}</p>
            {partyName && <p className="text-slate-600">Party: <span className="font-bold text-slate-900">{partyName}</span></p>}
            <div className="flex justify-between text-slate-500 text-[11px] pt-1">
              {date && <span>Date: {date}</span>}
              {amount !== undefined && amount !== null && <span className="font-bold text-slate-900 font-mono">Total: ₹{Number(amount || 0).toLocaleString()}</span>}
            </div>
          </div>

          {/* Blocked Reason or Impact Summary */}
          {isBlocked ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldAlert size={15} />
                <span>Cannot Delete Record</span>
              </p>
              <p>{blockedReason || 'This record is referenced by other active transactions and cannot be deleted directly.'}</p>
            </div>
          ) : (
            impactSummary && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-blue-600" />
                  <span>Automatic System Reversals</span>
                </p>
                <p>{impactSummary}</p>
              </div>
            )
          )}

          {!isBlocked && (
            <p className="text-slate-500 text-[11px]">
              This record will be soft-deleted and moved to Trash, remaining available for audit logs and restoration.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          {isBlocked ? (
            alternativeAction && (
              <button
                type="button"
                onClick={() => {
                  alternativeAction.onClick();
                  onClose();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Archive size={14} />
                <span>{alternativeAction.label}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Confirm Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
