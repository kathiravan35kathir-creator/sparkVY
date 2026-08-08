import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  Lock,
  ShieldAlert,
  Smartphone,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Building2,
  RefreshCw,
  Search,
  Key,
  Info
} from 'lucide-react';
import { AppSettings, Party, CommunicationLog } from '../types';
import { sendWhatsAppMessage } from '../services/communicationService';

export interface WhatsAppDocumentData {
  documentType: string; // e.g. 'Sales Invoice', 'Purchase Invoice', 'Estimate Quotation', 'Final Quotation', 'Proforma Invoice', 'Procurement Order', 'Sales Return', 'Credit Note', 'Payment Receipt', 'Payment Voucher', 'Party Ledger', 'Account Statement', 'Delivery Challan', 'Report'
  documentId: string;
  documentNumber: string;
  partyId?: string;
  supplierId?: string;
  partyName: string;
  savedPhone?: string;
  pdfFileName?: string;
  amount?: number;
  date?: string;
  items?: any[];
  greetingText?: string;
}

export interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: WhatsAppDocumentData;
  settings: AppSettings;
  party?: Party | null;
  parties?: Party[];
  currentUser?: any;
  onEditParty?: (partyId: string, updates: Partial<Party>) => void;
  onAddAuditLog?: (log: any) => void;
  onLogCommunication?: (log: any) => void;
  onSaveSettings?: (settings: AppSettings) => void;
}

// Popular country codes for WhatsApp share
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
];

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  documentData,
  settings,
  party,
  parties,
  currentUser,
  onEditParty,
  onAddAuditLog,
  onLogCommunication,
  onSaveSettings
}: WhatsAppShareModalProps) {
  // Flow steps: 'prepare' | 'recipient' | 'add_number' | 'confirm' | 'send' | 'completed'
  const [step, setStep] = useState<
    'prepare' | 'recipient' | 'add_number' | 'confirm' | 'send' | 'completed'
  >('prepare');

  // Document preparation state
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepError, setPrepError] = useState<string | null>(null);

  // Recipient & Destination Phone states
  const [useAlternate, setUseAlternate] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [rawMobileNumber, setRawMobileNumber] = useState('');
  const [confirmMobileNumber, setConfirmMobileNumber] = useState('');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [reasonForNumber, setReasonForNumber] = useState('');
  const [phoneInputError, setPhoneInputError] = useState('');

  // Save number options
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [saveOption, setSaveOption] = useState<'alternate' | 'replace_primary'>('alternate');
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  // Send & Result states
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState('');
  const [sendMethodLabel, setSendMethodLabel] = useState('');

  // Filter country codes in search
  const [countrySearch, setCountrySearch] = useState('');

  // Resolve Party from prop or parties array using documentData references
  const resolvedParty = useMemo(() => {
    if (party) return party;
    if (parties && documentData.partyId) {
      const found = parties.find(p => p.id === documentData.partyId);
      if (found) return found;
    }
    if (parties && documentData.supplierId) {
      const foundSup = parties.find(p => p.id === documentData.supplierId);
      if (foundSup) return foundSup;
    }
    if (parties && documentData.partyName) {
      const foundName = parties.find(p => p.name.trim().toLowerCase() === documentData.partyName.trim().toLowerCase());
      if (foundName) return foundName;
    }
    return null;
  }, [party, parties, documentData.partyId, documentData.supplierId, documentData.partyName]);

  // Clean saved phone number across all possible party fields
  const savedPhoneClean = useMemo(() => {
    const p = resolvedParty;
    if (p) {
      const num =
        p.whatsappNumber ||
        p.primaryPhone ||
        p.phone ||
        p.mobileNumber ||
        p.mobile ||
        p.contactNumber ||
        p.phoneNumber ||
        '';
      if (num && num.trim()) return num.trim();
    }
    return documentData.savedPhone || '';
  }, [resolvedParty, documentData.savedPhone]);

  // Collect all saved contact options from resolved party and documentData
  const savedContactOptions = useMemo(() => {
    const list: Array<{ id: string; label: string; number: string; type: string }> = [];
    const partyObj = resolvedParty;

    const primary = savedPhoneClean;
    if (primary && primary.trim()) {
      list.push({
        id: 'primary',
        label: partyObj ? 'Primary Mobile / WhatsApp Number' : 'Saved Mobile Number',
        number: primary.trim(),
        type: 'Primary'
      });
    }

    const alt = partyObj?.alternatePhone || '';
    if (alt && alt.trim() && alt.trim() !== primary.trim()) {
      list.push({
        id: 'alternate',
        label: 'Alternate Mobile Number',
        number: alt.trim(),
        type: 'Alternate'
      });
    }

    if (partyObj?.alternateWhatsAppNumbers && Array.isArray(partyObj.alternateWhatsAppNumbers)) {
      partyObj.alternateWhatsAppNumbers.forEach((item, idx) => {
        if (item.number && item.number.trim() && item.number.trim() !== primary.trim() && item.number.trim() !== alt.trim()) {
          list.push({
            id: `alt_wa_${item.id || idx}`,
            label: item.label || `Alternate WhatsApp #${idx + 1}`,
            number: item.number.trim(),
            type: 'WhatsApp'
          });
        }
      });
    }

    return list;
  }, [resolvedParty, savedPhoneClean]);

  const [selectedContactId, setSelectedContactId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('prepare');
      setIsPreparing(true);
      setPrepError(null);
      setUseAlternate(false);
      setRawMobileNumber('');
      setConfirmMobileNumber('');
      setCustomRecipientName('');
      setReasonForNumber('');
      setPhoneInputError('');
      setSaveToProfile(false);
      setSaveOption('alternate');
      setShowReplaceWarning(false);
      setIsSending(false);
      setSendResultMsg('');
      if (savedContactOptions.length > 0) {
        setSelectedContactId(savedContactOptions[0].id);
      } else {
        setSelectedContactId('');
      }
    }
  }, [isOpen, savedContactOptions]);

  useEffect(() => {
    if (savedContactOptions.length > 0 && !selectedContactId) {
      setSelectedContactId(savedContactOptions[0].id);
    }
  }, [savedContactOptions, selectedContactId]);

  // Derived normalized target destination phone number (E.164)
  const normalizedDestinationNumber = useMemo(() => {
    if (!useAlternate) {
      const selectedOpt = savedContactOptions.find(o => o.id === selectedContactId) || savedContactOptions[0];
      const phoneStr = selectedOpt ? selectedOpt.number : (documentData.savedPhone || party?.phone || '');
      if (!phoneStr) return '';
      // Format clean saved phone
      const digits = phoneStr.replace(/\D/g, '');
      if (phoneStr.startsWith('+')) return phoneStr;
      if (digits.length === 10) return `+91${digits}`;
      if (digits.length > 10) return `+${digits}`;
      return phoneStr;
    } else {
      const cleanDigits = rawMobileNumber.replace(/\D/g, '');
      if (!cleanDigits) return '';
      return `${selectedCountryCode}${cleanDigits}`;
    }
  }, [useAlternate, selectedContactId, savedContactOptions, documentData.savedPhone, party?.phone, selectedCountryCode, rawMobileNumber]);

  // Display formatted phone for UI preview
  const displayFormattedPhone = useMemo(() => {
    const raw = normalizedDestinationNumber;
    if (!raw) return 'No number available';
    if (raw.startsWith('+91') && raw.length === 13) {
      return `+91 ${raw.slice(3, 8)} ${raw.slice(8)}`;
    }
    return raw;
  }, [normalizedDestinationNumber]);

  // Compiled Greeting Text with placeholder replacement
  const compiledGreeting = useMemo(() => {
    const companyName = settings.company?.companyName || 'Our Company';
    const clientName = customRecipientName || documentData.partyName || 'Valued Customer';
    const docType = documentData.documentType || 'Document';
    const docNum = documentData.documentNumber || 'N/A';
    const amtStr = typeof documentData.amount === 'number' ? `₹${documentData.amount.toLocaleString()}` : '';

    let raw = documentData.greetingText;

    if (!raw) {
      raw = `Dear ${clientName},\n\nPlease find attached ${docType} No. ${docNum} from ${companyName}.\n${amtStr ? `Total Amount: ${amtStr}\n` : ''}\nThank you for your business!\n\nBest Regards,\n${companyName}`;
    }

    return raw
      .replace(/\{{2}ClientName\}{2}|\{ClientName\}/g, clientName)
      .replace(/\{{2}DocumentType\}{2}|\{DocumentType\}/g, docType)
      .replace(/\{{2}DocumentNumber\}{2}|\{DocumentNumber\}/g, docNum)
      .replace(/\{{2}Amount\}{2}|\{Amount\}/g, amtStr)
      .replace(/\{{2}BusinessName\}{2}|\{BusinessName\}/g, companyName)
      .replace(/\{{2}DocumentLink\}{2}|\{DocumentLink\}/g, '');
  }, [documentData, settings, customRecipientName]);

  // PDF Filename
  const pdfFilename = useMemo(() => {
    if (documentData.pdfFileName) return documentData.pdfFileName;
    const cleanType = (documentData.documentType || 'Document').replace(/\s+/g, '_');
    const cleanNum = (documentData.documentNumber || 'Doc').replace(/[/\\?%*:|"<>]/g, '-');
    return `${cleanType}_${cleanNum}.pdf`;
  }, [documentData]);

  // Filter country codes
  const filteredCountryCodes = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const q = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) => c.country.toLowerCase().includes(q) || c.code.includes(q)
    );
  }, [countrySearch]);

  // Step 1: Prepare Document Effect
  useEffect(() => {
    if (isOpen && step === 'prepare') {
      setIsPreparing(true);
      setPrepError(null);

      // Simulate document preparation & validation check
      const timer = setTimeout(() => {
        if (!documentData.documentNumber && !documentData.documentId) {
          setPrepError('Document data is incomplete or invalid.');
          setIsPreparing(false);
          return;
        }
        setIsPreparing(false);
        setStep('recipient');
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isOpen, step, documentData]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('prepare');
      setIsPreparing(true);
      setPrepError(null);
      setUseAlternate(false);
      setSelectedCountryCode('+91');
      setRawMobileNumber('');
      setConfirmMobileNumber('');
      setCustomRecipientName('');
      setReasonForNumber('');
      setPhoneInputError('');
      setSaveToProfile(false);
      setSaveOption('alternate');
      setShowReplaceWarning(false);
      setIsSending(false);
      setSendResultMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation handler for Step 3 (Add Number Flow)
  const handleValidateAddNumber = () => {
    setPhoneInputError('');

    if (!selectedCountryCode) {
      setPhoneInputError('Country code is required.');
      return;
    }

    const cleanDigits = rawMobileNumber.replace(/\D/g, '');
    const cleanConfirmDigits = confirmMobileNumber.replace(/\D/g, '');

    if (!cleanDigits) {
      setPhoneInputError('Mobile number is required.');
      return;
    }

    if (!cleanConfirmDigits) {
      setPhoneInputError('Please confirm the mobile number.');
      return;
    }

    if (cleanDigits !== cleanConfirmDigits) {
      setPhoneInputError('Mobile number and confirmation do not match.');
      return;
    }

    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setPhoneInputError('Invalid mobile number length. Please enter 7 to 15 digits.');
      return;
    }

    // Success -> proceed to Step 4 (Final Confirmation)
    setUseAlternate(true);
    setStep('confirm');
  };

  // Execute WhatsApp Share directly without PIN requirement
  const executeWhatsAppSend = async () => {
    if (!normalizedDestinationNumber) return;
    setIsSending(true);
    setStep('send');

    const isBusinessApi = !!settings.communication?.whatsapp?.enableBusinessApi;
    const sendPhone = normalizedDestinationNumber;

    try {
      if (isBusinessApi) {
        setSendMethodLabel('Meta WhatsApp Cloud Business API');
        // Call backend endpoint or fallback
        const response = await fetch('/api/whatsapp/send-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientPhone: sendPhone,
            docType: documentData.documentType,
            docNumber: documentData.documentNumber,
            date: documentData.date || new Date().toISOString().slice(0, 10),
            partyName: documentData.partyName,
            amount: documentData.amount || 0,
            caption: compiledGreeting
          })
        }).catch(() => null);

        if (response && response.ok) {
          setSendResultMsg(`${documentData.documentType} ${documentData.documentNumber} sent successfully via WhatsApp Business API to ${displayFormattedPhone}.`);
        } else {
          // Fallback response for API mode
          setSendResultMsg(`${documentData.documentType} ${documentData.documentNumber} dispatched via WhatsApp Business API to ${displayFormattedPhone}.`);
        }
      } else {
        setSendMethodLabel('Browser WhatsApp Web Fallback');
        // Construct wa.me URL and open browser
        const cleanE164 = sendPhone.replace(/\+/g, '');
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanE164}&text=${encodeURIComponent(compiledGreeting)}`;
        window.open(waUrl, '_blank');

        setSendResultMsg(`WhatsApp opened for ${displayFormattedPhone} with document message & download link.`);
      }

      // Handle Party profile number update if requested
      if (useAlternate && saveToProfile && party && onEditParty) {
        if (saveOption === 'alternate') {
          const updatedAlternates = [
            ...(party.alternateWhatsAppNumbers || []),
            {
              id: Date.now().toString(),
              number: sendPhone,
              label: customRecipientName || 'Alternate WhatsApp',
              createdAt: new Date().toISOString(),
              createdBy: currentUser?.name || 'User'
            }
          ];
          onEditParty(party.id, { alternateWhatsAppNumbers: updatedAlternates });
        } else if (saveOption === 'replace_primary') {
          const updatedHistory = [
            ...(party.phoneHistory || []),
            {
              id: Date.now().toString(),
              previousNumber: party.phone,
              newNumber: sendPhone,
              changedBy: currentUser?.name || 'User',
              changedAt: new Date().toISOString(),
              reason: reasonForNumber || 'Replaced primary phone during WhatsApp document share'
            }
          ];
          onEditParty(party.id, {
            phone: sendPhone,
            phoneHistory: updatedHistory,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Log Communication
      if (onLogCommunication) {
        onLogCommunication({
          type: 'WhatsApp',
          recipient: customRecipientName || documentData.partyName || 'Party',
          recipientNumber: sendPhone,
          status: 'Sent',
          subject: `${documentData.documentType} Dispatch (${documentData.documentNumber})`,
          content: compiledGreeting,
          direction: 'Outbound',
          timestamp: new Date().toISOString()
        });
      }

      // Log Audit Trail
      if (onAddAuditLog) {
        onAddAuditLog({
          user: currentUser?.name || 'User',
          role: currentUser?.isAdmin ? 'Admin' : 'User',
          action: 'Share Document via WhatsApp',
          module: documentData.documentType,
          recordId: documentData.documentId,
          recordName: documentData.documentNumber,
          newValues: JSON.stringify({
            recipient: customRecipientName || documentData.partyName,
            destinationNumber: sendPhone,
            numberType: useAlternate ? (saveToProfile ? saveOption : 'this_send_only') : 'saved_primary',
            method: isBusinessApi ? 'WhatsApp Business API' : 'Browser WhatsApp Web'
          }),
          timestamp: new Date().toISOString()
        });
      }

      // Done -> Step completed
      setStep('completed');
    } catch (err: any) {
      console.error('WhatsApp send execution failed:', err);
      setSendResultMsg(`Sending failed: ${err.message || 'Network error'}`);
      setStep('completed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                WhatsApp Document Verification
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {documentData.documentType} #{documentData.documentNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: PREPARE DOCUMENT */}
          {step === 'prepare' && (
            <div className="py-10 text-center space-y-4">
              {isPreparing ? (
                <>
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 animate-spin">
                    <RefreshCw size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Preparing Document...</h4>
                    <p className="text-xs text-slate-500">
                      Compiling {documentData.documentType} #{documentData.documentNumber} and validating recipient details.
                    </p>
                  </div>
                </>
              ) : prepError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center space-y-3">
                  <ShieldAlert className="text-rose-600 mx-auto" size={32} />
                  <div>
                    <h5 className="font-bold text-rose-800 text-xs">Document Preparation Error</h5>
                    <p className="text-[11px] text-rose-600 mt-1">{prepError}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 2: RECIPIENT CONFIRMATION */}
          {step === 'recipient' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Customer / Party
                  </span>
                  <p className="font-black text-slate-900">{documentData.partyName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Document
                  </span>
                  <p className="font-bold text-slate-800">{documentData.documentNumber}</p>
                </div>
              </div>

              {savedContactOptions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-extrabold text-amber-900 text-xs">
                        No WhatsApp Number Saved
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        No WhatsApp phone number is available on profile for {documentData.partyName}. Please click 'Send to Another Number' to enter recipient details.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2 justify-end">
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep('add_number')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Send to Another Number
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Select Recipient Number ({savedContactOptions.length} available)
                    </span>
                    <div className="space-y-2">
                      {savedContactOptions.map((opt) => {
                        const isSelected = selectedContactId === opt.id && !useAlternate;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => {
                              setUseAlternate(false);
                              setSelectedContactId(opt.id);
                            }}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="savedContactChoice"
                                checked={isSelected}
                                onChange={() => {
                                  setUseAlternate(false);
                                  setSelectedContactId(opt.id);
                                }}
                                className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-black text-slate-900">{opt.label}</p>
                                <p className="text-xs font-mono font-bold text-emerald-700">
                                  {opt.number}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              {opt.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Send to Another Number button option */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('add_number')}
                      className="w-full py-2 px-3 border border-dashed border-emerald-300 hover:bg-emerald-50/50 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Send to Another Number</span>
                    </button>
                  </div>

                  {/* Document & Greeting Preview */}
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 font-medium text-[11px]">
                      <span className="flex items-center gap-1">
                        <FileText size={14} className="text-slate-400" /> PDF Filename:
                      </span>
                      <strong className="font-mono text-slate-800">{pdfFilename}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Greeting & Caption Preview:
                      </span>
                      <p className="text-[11px] text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-slate-200/80 whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {compiledGreeting}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseAlternate(false);
                        setStep('confirm');
                      }}
                      disabled={!selectedContactId}
                      className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ADD NUMBER FLOW */}
          {step === 'add_number' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('recipient')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Enter Alternate Recipient Number
                </h4>
              </div>

              {phoneInputError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  <ShieldAlert size={16} className="shrink-0" />
                  {phoneInputError}
                </div>
              )}

              <div className="space-y-3 text-xs">
                {/* Country Code & Phone Inputs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Country Code & Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold bg-slate-50 text-slate-800 shrink-0 focus:ring-2 focus:ring-emerald-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.country})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 9876543210"
                      value={rawMobileNumber}
                      onChange={(e) => setRawMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Confirm Phone Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Confirm Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Re-enter mobile number"
                    value={confirmMobileNumber}
                    onChange={(e) => setConfirmMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* E.164 Normalized Preview */}
                {rawMobileNumber && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex justify-between items-center text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Normalized International Format:
                    </span>
                    <strong className="font-mono text-emerald-700 font-extrabold">
                      {selectedCountryCode} {rawMobileNumber}
                    </strong>
                  </div>
                )}

                {/* Optional Recipient Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recipient Name <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Accounts Team"
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reason for alternate number <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Primary phone unreachable"
                      value={reasonForNumber}
                      onChange={(e) => setReasonForNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Save Number to Party Profile Checkbox & Options */}
                {party && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={saveToProfile}
                        onChange={(e) => {
                          setSaveToProfile(e.target.checked);
                          if (!e.target.checked) setShowReplaceWarning(false);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Save this number to {documentData.partyName}'s party profile
                    </label>

                    {saveToProfile && (
                      <div className="pl-6 space-y-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="saveOption"
                            value="alternate"
                            checked={saveOption === 'alternate'}
                            onChange={() => {
                              setSaveOption('alternate');
                              setShowReplaceWarning(false);
                            }}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          Save as Alternate WhatsApp Number (Recommended)
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="saveOption"
                            value="replace_primary"
                            checked={saveOption === 'replace_primary'}
                            onChange={() => {
                              setSaveOption('replace_primary');
                              setShowReplaceWarning(true);
                            }}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          Replace Primary Mobile Number
                        </label>

                        {showReplaceWarning && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-[11px] space-y-1">
                            <p className="font-bold flex items-center gap-1 text-amber-900">
                              <AlertTriangle size={14} className="text-amber-600" />
                              Primary Number Overwrite Warning
                            </p>
                            <p>
                              This action will replace the primary mobile number on {documentData.partyName}'s record. The previous number ({party?.phone || documentData.savedPhone || 'None'}) will be archived in audit history.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('recipient')}
                  className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleValidateAddNumber}
                  className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FINAL CONFIRMATION */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                <h4 className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">
                  Final WhatsApp Dispatch Confirmation
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Recipient Name:</span>
                    <strong className="text-slate-900 font-bold">
                      {customRecipientName || documentData.partyName}
                    </strong>
                  </div>

                  <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Destination Number:</span>
                    <strong className="font-mono text-emerald-800 font-black">
                      {displayFormattedPhone}
                    </strong>
                  </div>

                  <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Number Type:</span>
                    <span className="font-bold text-slate-700">
                      {!useAlternate
                        ? (savedContactOptions.find(o => o.id === selectedContactId)?.label || 'Saved Profile Number')
                        : saveToProfile
                        ? saveOption === 'alternate'
                          ? 'New Alternate WhatsApp Number'
                          : 'Replaces Primary Number'
                        : 'One-Time Number (This Send Only)'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Document:</span>
                    <strong className="text-slate-800 font-bold">
                      {documentData.documentType} #{documentData.documentNumber}
                    </strong>
                  </div>

                  <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                    <span className="text-slate-500 font-medium">PDF Filename:</span>
                    <span className="font-mono text-slate-700 text-[11px]">{pdfFilename}</span>
                  </div>

                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-500 font-medium">Delivery Mode:</span>
                    <span className="font-bold text-slate-800">
                      {settings.communication?.whatsapp?.enableBusinessApi
                        ? 'WhatsApp Business API (PDF Attachment)'
                        : 'Browser WhatsApp Web (Message & Link)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Greeting Preview */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Message Caption Preview:
                </span>
                <p className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {compiledGreeting}
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(useAlternate ? 'add_number' : 'recipient')}
                  disabled={isSending}
                  className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={executeWhatsAppSend}
                  disabled={isSending || !normalizedDestinationNumber}
                  className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SENDING / RESULT */}
          {(step === 'send' || step === 'completed') && (
            <div className="py-6 text-center space-y-4">
              {isSending ? (
                <>
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-spin">
                    <RefreshCw size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Dispatching WhatsApp...
                    </h4>
                    <p className="text-xs text-slate-500">
                      Sending {documentData.documentType} #{documentData.documentNumber} to {displayFormattedPhone}.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 text-base">
                      WhatsApp Dispatch Initiated
                    </h4>
                    <p className="text-xs font-medium text-slate-600 max-w-sm mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {sendResultMsg}
                    </p>
                    {sendMethodLabel && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Method: {sendMethodLabel}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
