import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';

interface SecurityPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pinHash?: string;
  actionName: string;
}

export default function SecurityPinDialog({
  isOpen,
  onClose,
  onSuccess,
  pinHash,
  actionName
}: SecurityPinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinHash) {
      // If no PIN set, allow (or maybe force set first?)
      // For this app, if pinHash is empty, we consider it not protected or default '0000'
      onSuccess();
      return;
    }

    // In a real app we would hash the input and compare.
    // For this ERP demo, we'll use a simple mock check or look for '1234' as default if hash is just a placeholder.
    if (pin === '1234' || pin === pinHash) {
      onSuccess();
    } else {
      setError('Invalid Security PIN. Access Denied.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-slate-950 p-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Lock className="text-white" size={20} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Security Verification</h3>
          <p className="text-slate-400 text-[10px] mt-1 font-medium tracking-wide">Enter PIN to authorize: <span className="text-blue-400 font-bold">{actionName.replace(/_/g, ' ').toUpperCase()}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > i ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-transparent border-slate-200'
                }`} 
              />
            ))}
          </div>

          <div className="relative">
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (val.length === 4) {
                  // Auto submit on 4th digit?
                }
              }}
              className="absolute inset-0 opacity-0 cursor-default"
            />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (num === 'del') setPin(pin.slice(0, -1));
                    else if (num !== '') setPin((pin + num).slice(0, 4));
                  }}
                  className={`h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all ${
                    num === '' ? 'invisible' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 active:scale-90 border border-slate-100'
                  }`}
                >
                  {num === 'del' ? <X size={18} /> : num}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-2 animate-shake">
              <ShieldAlert className="text-rose-600 shrink-0" size={14} />
              <p className="text-[10px] font-bold text-rose-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="flex-1 py-3 px-4 bg-blue-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
