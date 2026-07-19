import React, { useState } from 'react';
import { User, AppSettings } from '../../types';

interface OnboardingViewProps {
  user: Partial<User>;
  onSave: (userData: any, companyData: any) => Promise<void>;
  onSkip?: () => void;
}

export default function OnboardingView({ user, onSave, onSkip }: OnboardingViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // User fields
  const [fullName, setFullName] = useState(user.name || (user as any).full_name || '');
  const [displayName, setDisplayName] = useState((user as any).displayName || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Company fields
  const [legalName, setLegalName] = useState('');
  const [displayBusinessName, setDisplayBusinessName] = useState('');
  const [laboratoryName, setLaboratoryName] = useState('');
  const [businessType, setBusinessType] = useState('Private Limited');
  const [industry, setIndustry] = useState('Diagnostic Laboratory');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [alternatePhoneCompany, setAlternatePhoneCompany] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user.email || '');
  const [website, setWebsite] = useState('');
  const [gstType, setGstType] = useState('Registered');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [fyStartMonth, setFyStartMonth] = useState('April');
  const [currency, setCurrency] = useState('INR');
  const [defaultTax, setDefaultTax] = useState('18');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (country === 'India') {
      if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ''))) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (postalCode && !/^\d{6}$/.test(postalCode)) {
        setError('Please enter a valid 6-digit Indian pincode.');
        return;
      }
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        setError('Please enter a valid GST number format.');
        return;
      }
      if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        setError('Please enter a valid PAN number format.');
        return;
      }
    }

    if (website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(website)) {
      setError('Please enter a valid website URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        full_name: fullName,
        display_name: displayName,
        mobile_number: mobileNumber,
        alternate_mobile_number: alternateMobile,
        designation,
        preferred_language: language,
        timezone: timezone
      }, {
        legalName,
        displayLabName: displayBusinessName,
        labName: laboratoryName || displayBusinessName,
        businessType,
        industry_sector: industry,
        address1,
        address2,
        city,
        district,
        state,
        postalCode,
        country,
        primaryPhone,
        alternatePhone: alternatePhoneCompany,
        email: businessEmail,
        website,
        gstNumber,
        pan: panNumber,
        cin: cinNumber,
        financialYearStartMonth: fyStartMonth,
        currency,
        timezone: timezone,
        defaultTax: parseFloat(defaultTax)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save setup data.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Complete Your Setup</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add your profile and company information to start using LabBiz.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-8">
          {/* User Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
              User Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input value={user.email || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number *</label>
                <input required value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alternate Mobile</label>
                <input value={alternateMobile} onChange={e => setAlternateMobile(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation</label>
                <input value={designation} onChange={e => setDesignation(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time Zone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
              Company Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legal Business Name *</label>
                <input required value={legalName} onChange={e => setLegalName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Business Name *</label>
                <input required value={displayBusinessName} onChange={e => setDisplayBusinessName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Laboratory Name (Optional)</label>
                <input value={laboratoryName} onChange={e => setLaboratoryName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Type *</label>
                <select required value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="LLP">LLP</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Educational Institution">Educational Institution</option>
                  <option value="Research Institution">Research Institution</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry / Sector *</label>
                <select required value={industry} onChange={e => setIndustry(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="Research Laboratory">Research Laboratory</option>
                  <option value="Diagnostic Laboratory">Diagnostic Laboratory</option>
                  <option value="Chemical Testing">Chemical Testing</option>
                  <option value="Water Testing">Water Testing</option>
                  <option value="Food Testing">Food Testing</option>
                  <option value="Pharmaceutical Research">Pharmaceutical Research</option>
                  <option value="Material Testing">Material Testing</option>
                  <option value="Environmental Testing">Environmental Testing</option>
                  <option value="Educational Research">Educational Research</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 1 *</label>
                <input required value={address1} onChange={e => setAddress1(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 2</label>
                <input value={address2} onChange={e => setAddress2(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">City *</label>
                <input required value={city} onChange={e => setCity(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">District</label>
                <input value={district} onChange={e => setDistrict(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State *</label>
                <input required value={state} onChange={e => setState(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Postal Code *</label>
                <input required value={postalCode} onChange={e => setPostalCode(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country *</label>
                <select required value={country} onChange={e => setCountry(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Phone *</label>
                <input required value={primaryPhone} onChange={e => setPrimaryPhone(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alternate Phone</label>
                <input value={alternatePhoneCompany} onChange={e => setAlternatePhoneCompany(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Email *</label>
                <input required type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Website</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Tax & Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
              Tax & Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">GST Registration</label>
                <select value={gstType} onChange={e => setGstType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="Registered">Registered</option>
                  <option value="Unregistered">Unregistered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">GST Number</label>
                <input value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">PAN Number</label>
                <input value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">CIN / Reg Number</label>
                <input value={cinNumber} onChange={e => setCinNumber(e.target.value.toUpperCase())} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Application Defaults */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
              Application Defaults
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Financial Year Start *</label>
                <select required value={fyStartMonth} onChange={e => setFyStartMonth(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="April">April</option>
                  <option value="January">January</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Currency *</label>
                <select required value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Tax Rate (%)</label>
                <input type="number" value={defaultTax} onChange={e => setDefaultTax(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer py-2 px-4 border border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 shadow-sm"
              >
                Skip Setup & Go to Dashboard →
              </button>
            )}
          </div>
          <button
            form="onboarding-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
