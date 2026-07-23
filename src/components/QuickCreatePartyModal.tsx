import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { Party, PartyType } from '../types';
import { detectSmartPrefill, findExactMatch } from '../utils/searchOrCreate';

interface QuickCreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchText: string;
  defaultType?: PartyType;
  existingParties: Party[];
  onSaveParty: (partyData: Omit<Party, 'id' | 'code' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => void;
  onSelectPartyAfterCreate?: (party: Party) => void;
}

export default function QuickCreatePartyModal({
  isOpen,
  onClose,
  initialSearchText,
  defaultType = 'Customer',
  existingParties,
  onSaveParty
}: QuickCreatePartyModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [type, setType] = useState<PartyType>(defaultType);
  const [gstRegistration, setGstRegistration] = useState<'Registered' | 'Unregistered' | 'Composite'>('Unregistered');
  const [city, setCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const smart = detectSmartPrefill(initialSearchText);
      setName(smart.type === 'name' ? smart.value : initialSearchText);
      setPhone(smart.type === 'phone' ? smart.value : '');
      setEmail(smart.type === 'email' ? smart.value : '');
      setGstNumber(smart.type === 'gst' ? smart.value : '');
      setGstRegistration(smart.type === 'gst' ? 'Registered' : 'Unregistered');
      setType(defaultType);
      setWarning(null);
    }
  }, [isOpen, initialSearchText, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a party name.');
      return;
    }

    // Duplicate check
    const match = findExactMatch(existingParties, name, ['name', 'companyName']);
    if (match) {
      if (!confirm(`A party named "${match.name}" already exists. Are you sure you want to create a duplicate?`)) {
        return;
      }
    }

    onSaveParty({
      name: name.trim(),
      displayName: name.trim(),
      type,
      phone: phone.trim() || 'N/A',
      email: email.trim() || undefined,
      gstRegistration,
      gstNumber: gstNumber.trim() || undefined,
      openingBalance: 0,
      balanceType: type === 'Supplier' ? 'Payable' : 'Receivable',
      billingAddress: billingAddress.trim() || '',
      isActive: true
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Quick Create New Party
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Creating from search: <strong className="text-blue-700">"{initialSearchText}"</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>{warning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                const exact = findExactMatch(existingParties, e.target.value, ['name']);
                if (exact) setWarning(`A party named "${exact.name}" already exists.`);
                else setWarning(null);
              }}
              placeholder="e.g. ABC Traders Pvt Ltd"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Party Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PartyType)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Customer">Customer</option>
                <option value="Supplier">Supplier</option>
                <option value="Both">Customer & Supplier (Both)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile / Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@example.com"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chennai"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GST Registration
              </label>
              <select
                value={gstRegistration}
                onChange={(e) => setGstRegistration(e.target.value as any)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Unregistered">Unregistered Business</option>
                <option value="Registered">Registered (GSTIN)</option>
                <option value="Composite">Composite Scheme</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="33AAAAA0000A1Z5"
                disabled={gstRegistration === 'Unregistered'}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-xs transition cursor-pointer"
            >
              Save Party & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
