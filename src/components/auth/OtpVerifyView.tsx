import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface OtpVerifyViewProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  isLoading: boolean;
}

export default function OtpVerifyView({ email, onVerify, onResend, onChangeEmail, isLoading }: OtpVerifyViewProps) {
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleResend = () => {
    if (cooldown === 0) {
      onResend();
      setCooldown(60);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <button
          onClick={onChangeEmail}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Change Email</span>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify your email</h1>
          <p className="text-center text-sm text-slate-500 mt-2">
            We sent a 6-digit code to:
          </p>
          <p className="text-center text-sm font-semibold text-slate-800 mt-1">
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
              Enter 6-digit code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={isLoading}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-slate-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isLoading}
            className={`text-xs font-semibold ${cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 cursor-pointer'}`}
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
