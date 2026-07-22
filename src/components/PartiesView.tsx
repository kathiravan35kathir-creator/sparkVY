import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Copy,
  ChevronRight,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { Party, PartyType, BalanceType } from '../types';
import { AppState } from '../data';
import PartyLedgerView from './PartyLedgerView';

interface PartiesViewProps {
  parties: Party[];
  onAddParty: (party: Omit<Party, 'id' | 'code' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => void;
  onEditParty: (id: string, party: Partial<Party>) => void;
  onDeactivateParty: (id: string) => void;
  onReactivateParty: (id: string) => void;
  isAdmin: boolean;
  db?: AppState;
  currentUser?: any;
}

export default function PartiesView({
  parties,
  onAddParty,
  onEditParty,
  onDeactivateParty,
  onReactivateParty,
  isAdmin,
  db,
  currentUser
}: PartiesViewProps) {
  // Navigation & Search States
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<Party | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('Active');
  const [sortField, setSortField] = useState<keyof Party>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Drawer States
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Detailed view Drawer
  const [viewingParty, setViewingParty] = useState<Party | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [type, setType] = useState<PartyType>('Customer');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstRegistration, setGstRegistration] = useState<'Registered' | 'Unregistered' | 'Composite'>('Unregistered');
  const [gstNumber, setGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<BalanceType>('Receivable');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Split Address States
  const [billingLine1, setBillingLine1] = useState('');
  const [billingLine2, setBillingLine2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('India');

  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingLine2, setShippingLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');

  const [sameAsBilling, setSameAsBilling] = useState(false);

  // GST & Additional States
  const [gstVerified, setGstVerified] = useState<boolean | null>(null);
  const [gstError, setGstError] = useState('');
  const [submitMode, setSubmitMode] = useState<'register' | 'another'>('register');
  const [termsAndNotes, setTermsAndNotes] = useState('');
  const [partyStatus, setPartyStatus] = useState<boolean>(true);

  // Sync Same As Billing
  React.useEffect(() => {
    if (sameAsBilling) {
      setShippingLine1(billingLine1);
      setShippingLine2(billingLine2);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingZip(billingZip);
      setShippingCountry(billingCountry);
    }
  }, [sameAsBilling, billingLine1, billingLine2, billingCity, billingState, billingZip, billingCountry]);

  // Reset form
  const resetForm = () => {
    setName('');
    setDisplayName('');
    setCompanyName('');
    setType('Customer');
    setContactPerson('');
    setPhone('');
    setAlternatePhone('');
    setEmail('');
    setGstRegistration('Unregistered');
    setGstNumber('');
    setPan('');
    setBusinessType('');
    setOpeningBalance(0);
    setBalanceType('Receivable');
    setCreditLimit(50000);
    setBillingAddress('');
    setShippingAddress('');
    setNotes('');
    setBillingLine1('');
    setBillingLine2('');
    setBillingCity('');
    setBillingState('');
    setBillingZip('');
    setBillingCountry('India');
    setShippingLine1('');
    setShippingLine2('');
    setShippingCity('');
    setShippingState('');
    setShippingZip('');
    setShippingCountry('India');
    setSameAsBilling(false);
    setGstVerified(null);
    setGstError('');
    setTermsAndNotes('');
    setPartyStatus(true);
    setSelectedPartyId(null);
    setIsEditMode(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditMode(false);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (party: Party) => {
    setName(party.name);
    setDisplayName(party.displayName);
    setCompanyName(party.companyName || '');
    setType(party.type);
    setContactPerson(party.contactPerson || '');
    setPhone(party.phone);
    setAlternatePhone(party.alternatePhone || '');
    setEmail(party.email || '');
    setGstRegistration(party.gstRegistration);
    setGstNumber(party.gstNumber || '');
    setPan(party.pan || '');
    setBusinessType(party.businessType || '');
    setOpeningBalance(party.openingBalance);
    setBalanceType(party.balanceType);
    setCreditLimit(party.creditLimit || 50000);
    setBillingAddress(party.billingAddress);
    setShippingAddress(party.shippingAddress || '');
    setNotes(party.notes || '');
    setPartyStatus(party.isActive);

    // Parse Address
    const bParts = (party.billingAddress || '').split(',').map(s => s.trim());
    setBillingLine1(bParts[0] || '');
    setBillingLine2(bParts[1] || '');
    setBillingCity(bParts[2] || '');
    setBillingState(bParts[3] || '');
    setBillingZip(bParts[4] || '');
    setBillingCountry(bParts[5] || 'India');

    const sParts = (party.shippingAddress || '').split(',').map(s => s.trim());
    setShippingLine1(sParts[0] || '');
    setShippingLine2(sParts[1] || '');
    setShippingCity(sParts[2] || '');
    setShippingState(sParts[3] || '');
    setShippingZip(sParts[4] || '');
    setShippingCountry(sParts[5] || 'India');

    if (party.billingAddress === party.shippingAddress) {
      setSameAsBilling(true);
    } else {
      setSameAsBilling(false);
    }

    // Set other fields
    if (party.gstNumber) {
      setGstVerified(true);
    }

    setSelectedPartyId(party.id);
    setIsEditMode(true);
    setIsOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !billingLine1) {
      alert('Please fill in Name, Phone, and Billing Address (Line 1) as they are mandatory.');
      return;
    }

    const composedBilling = [billingLine1, billingLine2, billingCity, billingState, billingZip, billingCountry].filter(Boolean).join(', ');
    const composedShipping = [shippingLine1, shippingLine2, shippingCity, shippingState, shippingZip, shippingCountry].filter(Boolean).join(', ');

    const payload = {
      name,
      displayName,
      companyName,
      type,
      contactPerson,
      phone,
      alternatePhone,
      email,
      gstRegistration,
      gstNumber,
      pan,
      businessType,
      openingBalance: Number(openingBalance),
      balanceType,
      creditLimit: Number(creditLimit),
      billingAddress: composedBilling,
      shippingAddress: composedShipping,
      notes,
      isActive: partyStatus
    };

    if (isEditMode && selectedPartyId) {
      onEditParty(selectedPartyId, payload);
      setIsOpenForm(false);
      resetForm();
    } else {
      onAddParty(payload);
      if (submitMode === 'another') {
        resetForm();
        setIsOpenForm(true); // Keep it open
      } else {
        setIsOpenForm(false);
        resetForm();
      }
    }
  };

  // Filter & Sort core logic
  const handleSort = (field: keyof Party) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredParties = parties
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.companyName && p.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = filterType === 'All' || p.type === filterType || p.type === 'Both';
      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'Active' && p.isActive) ||
        (filterStatus === 'Inactive' && !p.isActive);

      return matchSearch && matchType && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal === undefined) return sortAsc ? 1 : -1;
      if (bVal === undefined) return sortAsc ? -1 : 1;

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Code,Name,Company,Type,Phone,Email,GSTIN,Balance,Status\n';
    const rows = filteredParties
      .map(
        (p) =>
          `"${p.code}","${p.name}","${p.companyName || ''}","${p.type}","${p.phone}","${p.email || ''}","${p.gstNumber || ''}","₹${p.currentBalance} ${p.balanceType}","${p.isActive ? 'Active' : 'Inactive'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BizOps_Parties_List_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredParties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);

  // GST Validation helper
  const handleVerifyGST = () => {
    setGstError('');
    if (!gstNumber) {
      setGstError('Please enter a GST number first.');
      setGstVerified(false);
      return;
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber.toUpperCase())) {
      setGstError('Invalid GSTIN format. Must be a 15-character valid Indian GSTIN (e.g., 22AAAAA0000A1Z5).');
      setGstVerified(false);
    } else {
      setGstVerified(true);
      setGstError('');
      if (!pan) {
        const extractedPan = gstNumber.substring(2, 12).toUpperCase();
        setPan(extractedPan);
      }
    }
  };

  if (isOpenForm) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Parties</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">{isEditMode ? 'Edit Party' : 'Add Party'}</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              {isEditMode ? `Edit Party: ${name}` : 'Add New Party'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEditMode ? 'Modify and update registration, tax and financial parameters for this business ledger.' : 'Register a new business party, client, or supplier.'}
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsOpenForm(false); resetForm(); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Party List
            </button>
          </div>
        </div>

        {/* Full-width Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          {/* SECTION 1: Business Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Business Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Party Type <span className="text-red-500">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PartyType)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                >
                  <option value="Customer">Customer (Client/Patient)</option>
                  <option value="Supplier">Supplier (Chemical Vendor/Manufacturer)</option>
                  <option value="Both">Both (Supplier & Customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Party Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!displayName) setDisplayName(e.target.value);
                  }}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Display Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Reddy's"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Corporate / Company Name</label>
                <input
                  type="text"
                  placeholder="Corporate registration name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Primary Mobile Number <span className="text-red-500">*</span></label>
                <div className="flex rounded-md border border-[#D8E0EA] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden bg-white h-[42px] items-center">
                  <span className="bg-slate-50 text-slate-500 text-xs px-3 border-r border-[#D8E0EA] h-full flex items-center font-semibold">+91</span>
                  <input
                    type="text"
                    required
                    placeholder="10 digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border-none focus:outline-none focus:ring-0 font-mono h-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Alternate Mobile Number</label>
                <div className="flex rounded-md border border-[#D8E0EA] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden bg-white h-[42px] items-center">
                  <span className="bg-slate-50 text-slate-500 text-xs px-3 border-r border-[#D8E0EA] h-full flex items-center font-semibold">+91</span>
                  <input
                    type="text"
                    placeholder="Alternate number"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border-none focus:outline-none focus:ring-0 font-mono h-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="reports@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Key Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Quality Officer"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Tax & Financial Information */}
          <div className="space-y-4 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Tax & Financial Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Business Industry / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmaceuticals, Chemical testing"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Business Type</label>
                <select
                  value={companyName ? 'Corporation' : 'Proprietorship'}
                  onChange={() => {}}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                >
                  <option value="Proprietorship">Proprietorship / Individual</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Corporation">Private Limited / Corporation</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">GST Registration Type</label>
                <select
                  value={gstRegistration}
                  onChange={(e) => setGstRegistration(e.target.value as any)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                >
                  <option value="Unregistered">Unregistered Business</option>
                  <option value="Registered">Registered Business (Regular)</option>
                  <option value="Composite">Composite Taxpayer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">GSTIN (GST Number)</label>
                <div className="flex rounded-md border border-[#D8E0EA] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden bg-white h-[42px] items-center">
                  <input
                    type="text"
                    disabled={gstRegistration === 'Unregistered'}
                    placeholder="15-character GSTIN"
                    value={gstNumber}
                    onChange={(e) => { setGstNumber(e.target.value); setGstVerified(null); }}
                    className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border-none focus:outline-none focus:ring-0 font-mono h-full uppercase disabled:bg-slate-50"
                  />
                  {gstRegistration !== 'Unregistered' && (
                    <button
                      type="button"
                      onClick={handleVerifyGST}
                      className={`h-full px-3 text-xs font-bold border-l border-[#D8E0EA] transition cursor-pointer ${
                        gstVerified === true
                          ? 'bg-emerald-50 text-emerald-700'
                          : gstVerified === false
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {gstVerified === true ? 'Verified ✓' : gstVerified === false ? 'Retry ✗' : 'Verify GST'}
                    </button>
                  )}
                </div>
                {gstError && <p className="text-[10px] text-red-500 mt-1 font-semibold">{gstError}</p>}
                {gstVerified === true && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ GSTIN matches regular registration format.</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">PAN Card Number</label>
                <input
                  type="text"
                  placeholder="10-character PAN"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Credit Limit Allowed (INR)</label>
                <input
                  type="number"
                  placeholder="₹ 50,000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Opening Balance (INR)</label>
                <input
                  type="number"
                  disabled={isEditMode}
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Balance Type</label>
                <select
                  disabled={isEditMode}
                  value={balanceType}
                  onChange={(e) => setBalanceType(e.target.value as BalanceType)}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold"
                >
                  <option value="Receivable">Receivable (Customer owes us)</option>
                  <option value="Payable">Payable (We owe Supplier)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Address Information */}
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Address Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Billing Address Subsection */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Billing Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Flat, House no., Building, Company"
                      value={billingLine1}
                      onChange={(e) => setBillingLine1(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Area, Street, Sector, Village"
                      value={billingLine2}
                      onChange={(e) => setBillingLine2(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Town / City"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="State / Province"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      placeholder="6 digit PIN code"
                      value={billingZip}
                      onChange={(e) => setBillingZip(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address Subsection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Shipping Address</h4>
                  <label className="flex items-center space-x-1.5 text-xs text-blue-600 font-bold cursor-pointer hover:underline select-none">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="rounded border-[#D8E0EA] text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Same as Billing</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="Flat, House no., Building, Company"
                      value={shippingLine1}
                      onChange={(e) => setShippingLine1(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="Area, Street, Sector, Village"
                      value={shippingLine2}
                      onChange={(e) => setShippingLine2(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="Town / City"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="State / Province"
                      value={shippingState}
                      onChange={(e) => setShippingState(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="6 digit PIN code"
                      value={shippingZip}
                      onChange={(e) => setShippingZip(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      disabled={sameAsBilling}
                      placeholder="Country"
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Additional Information */}
          <div className="space-y-4 pt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Additional Information</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Internal Reference Notes</label>
                <textarea
                  rows={3}
                  placeholder="Special collection preferences, credit history, corporate notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[72px] p-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Terms & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Specific payment terms, delivery terms..."
                  value={termsAndNotes}
                  onChange={(e) => setTermsAndNotes(e.target.value)}
                  className="w-full min-h-[72px] p-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Party Status</label>
                <select
                  value={partyStatus ? 'Active' : 'Inactive'}
                  onChange={(e) => setPartyStatus(e.target.value === 'Active')}
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-[#E5EAF0] py-3.5 px-6 flex items-center justify-between shadow-md z-40 md:pl-[240px] pl-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs transition"
            >
              Reset Form
            </button>
            <div className="flex space-x-3">
              {!isEditMode && (
                <button
                  type="submit"
                  onClick={() => setSubmitMode('another')}
                  className="px-4 py-2 border border-[#D8E0EA] bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Save & Add Another
                </button>
              )}
              <button
                type="submit"
                onClick={() => setSubmitMode('register')}
                className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isEditMode ? 'Save & Update Party' : 'Save & Register Party'}
              </button>
            </div>
          </div>

        </form>
      </div>
    );
  }

  if (selectedPartyForLedger && db) {
    return (
      <PartyLedgerView
        party={selectedPartyForLedger}
        onBack={() => setSelectedPartyForLedger(null)}
        db={db}
        isAdmin={isAdmin}
        onUpdateParty={(id, updatedFields) => {
          onEditParty(id, updatedFields);
          // Sync local selection state
          setSelectedPartyForLedger(prev => prev ? { ...prev, ...updatedFields } : null);
        }}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Parties Management (CRM & Vendors)</h2>
          <p className="text-xs text-slate-500 mt-1">Manage business clients, corporate partners, and suppliers.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition bg-white"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus size={14} />
              <span>Add New Party</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Type */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Type</span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-700 font-semibold"
          >
            <option value="All">All Types</option>
            <option value="Customer">Customers Only</option>
            <option value="Supplier">Suppliers Only</option>
            <option value="Both">Both (Clients & Vendors)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-700 font-semibold"
          >
            <option value="Active">Active Parties</option>
            <option value="Inactive">Deactivated (Soft-Deleted)</option>
            <option value="All">All Statuses</option>
          </select>
        </div>
      </div>

      {/* PARTIES TABLE COMPONENT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100" onClick={() => handleSort('code')}>
                  <div className="flex items-center space-x-1">
                    <span>Party Code</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-4 select-none cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Party Name</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">GST Profile</th>
                <th className="py-3 px-4 text-right select-none cursor-pointer hover:bg-slate-100" onClick={() => handleSort('currentBalance')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Current Balance</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No matching parties found in the database.
                  </td>
                </tr>
              ) : (
                currentItems.map((party) => (
                  <tr key={party.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{party.code}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <button
                          onClick={() => setSelectedPartyForLedger(party)}
                          className="font-bold text-[#2563EB] hover:underline hover:text-blue-800 text-left cursor-pointer"
                        >
                          {party.name}
                        </button>
                        {party.companyName && <p className="text-[10px] text-slate-400 mt-0.5">{party.companyName}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-700">{party.phone}</p>
                        {party.email && <p className="text-[10px] text-slate-400 mt-0.5">{party.email}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                          party.gstRegistration === 'Registered' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {party.gstRegistration}
                        </span>
                        {party.gstNumber && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{party.gstNumber}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={party.balanceType === 'Receivable' ? 'text-rose-600' : 'text-emerald-600'}>
                        ₹{party.currentBalance.toLocaleString()} {party.balanceType === 'Receivable' ? 'Dr' : 'Cr'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        party.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${party.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{party.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingParty(party)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="View Ledger Profile"
                        >
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(party)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Edit Profile"
                            >
                              <Edit2 size={14} />
                            </button>
                            {party.isActive ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to deactivate (soft-delete) ${party.name}?`)) {
                                    onDeactivateParty(party.id);
                                  }
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Deactivate"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => onReactivateParty(party.id)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                title="Reactivate"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION COMPONENT */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredParties.length)} of {filteredParties.length} parties
            </span>
            <div className="flex space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`px-2.5 py-1 text-xs border rounded font-bold ${
                    currentPage === pg ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>



      {/* DETAIL LEDGER PROFILES DRAWER */}
      {viewingParty && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setViewingParty(null)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">{viewingParty.name}</h3>
                  <p className="text-[10px] text-teal-400 font-mono mt-0.5">LEDGER SUMMARY: {viewingParty.code}</p>
                </div>
                <button onClick={() => setViewingParty(null)} className="text-slate-400 hover:text-white text-lg">
                  &times;
                </button>
              </div>

              {/* Profile Details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Financial Summary Strip */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4.5 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Party Operations Type</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">{viewingParty.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Allowance</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">₹{(viewingParty.creditLimit || 50000).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/50 pt-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Current Outstanding Ledger</span>
                      <span className="text-lg font-black text-slate-950 font-mono mt-1 block">
                        ₹{viewingParty.currentBalance.toLocaleString()}
                      </span>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      viewingParty.balanceType === 'Receivable' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {viewingParty.balanceType === 'Receivable' ? 'DEBIT (Owes us)' : 'CREDIT (We owe)'}
                    </span>
                  </div>
                </div>

                {/* Primary Contacts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">Contact Dossier</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Primary Mobile:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{viewingParty.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Alternate Contact:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{viewingParty.alternatePhone || 'None specified'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium">Official Email ID:</span>
                      <p className="font-mono text-slate-800 mt-0.5">{viewingParty.email || 'None registered'}</p>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 font-bold">Billing & Invoicing Address</h4>
                  <div className="bg-slate-50/70 p-3 rounded-lg text-xs relative text-slate-700 leading-relaxed">
                    {viewingParty.billingAddress}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingParty.billingAddress);
                        alert("Billing address copied!");
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                      title="Copy Address"
                    >
                      <Copy size={13} />
                    </button>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 font-bold">Shipping/Delivery Destination</h4>
                  <div className="bg-slate-50/70 p-3 rounded-lg text-xs relative text-slate-700 leading-relaxed">
                    {viewingParty.shippingAddress || viewingParty.billingAddress}
                  </div>
                </div>

                {/* Notes */}
                {viewingParty.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 font-bold">Staff Operational Notes</h4>
                    <p className="text-xs text-slate-600 bg-amber-50/50 p-3 border border-amber-100 rounded-lg leading-relaxed">
                      {viewingParty.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Footer */}
              <div className="p-4.5 bg-slate-50 border-t border-slate-150 flex justify-between gap-2">
                <button
                  onClick={() => {
                    const p = viewingParty;
                    setViewingParty(null);
                    setSelectedPartyForLedger(p);
                  }}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Open Full Ledger Tab
                </button>
                <button
                  onClick={() => setViewingParty(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition"
                >
                  Close Profile Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
