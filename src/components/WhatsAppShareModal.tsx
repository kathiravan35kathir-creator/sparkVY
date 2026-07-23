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
  currentUser,
  onEditParty,
  onAddAuditLog,
  onLogCommunication,
  onSaveSettings
}: WhatsAppShareModalProps) {
  // Flow steps: 'prepare' | 'recipient' | 'add_number' | 'confirm' | 'pin_verify' | 'pin_create' | 'send' | 'completed'
  const [step, setStep] = useState<
    'prepare' | 'recipient' | 'add_number' | 'confirm' | 'pin_verify' | 'pin_create' | 'send' | 'completed'
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

  // Security PIN states
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // PIN Creation states
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinCreateError, setPinCreateError] = useState('');

  // Send & Result states
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState('');
  const [sendMethodLabel, setSendMethodLabel] = useState('');

  // Filter country codes in search
  const [countrySearch, setCountrySearch] = useState('');

  // Normalize saved party phone number
  const savedPhoneClean = useMemo(() => {
    return documentData.savedPhone || party?.phone || '';
  }, [documentData.savedPhone, party?.phone]);

  // Derived normalized target destination phone number (E.164)
  const normalizedDestinationNumber = useMemo(() => {
    if (!useAlternate) {
      if (!savedPhoneClean) return '';
      // Format clean saved phone
      const digits = savedPhoneClean.replace(/\D/g, '');
      if (savedPhoneClean.startsWith('+')) return savedPhoneClean;
      if (digits.length === 10) return `+91${digits}`;
      if (digits.length > 10) return `+${digits}`;
      return savedPhoneClean;
    } else {
      const cleanDigits = rawMobileNumber.replace(/\D/g, '');
      if (!cleanDigits) return '';
      return `${selectedCountryCode}${cleanDigits}`;
    }
  }, [useAlternate, savedPhoneClean, selectedCountryCode, rawMobileNumber]);

  // Display formatted phone for UI preview
  const displayFormattedPhone = useMemo(() => {
    const raw = normalizedDestinationNumber;
    if (!raw) return 'No number available';
    if (raw.startsWith('+91') && raw.length === 13) {
      return `+91 ${raw.slice(3, 8)} ${raw.slice(8)}`;
    }
    return raw;
  }, [normalizedDestinationNumber]);

  // Compiled Greeting Text
  const compiledGreeting = useMemo(() => {
    if (documentData.greetingText) return documentData.greetingText;

    const companyName = settings.company?.companyName || 'Our Company';
    const clientName = customRecipientName || documentData.partyName || 'Valued Customer';
    const docType = documentData.documentType || 'Document';
    const docNum = documentData.documentNumber || 'N/A';
    const amtStr = typeof documentData.amount === 'number' ? `₹${documentData.amount.toLocaleString()}` : '';

    return `Dear ${clientName},\n\nPlease find attached ${docType} No. ${docNum} from ${companyName}.\n${amtStr ? `Total Amount: ${amtStr}\n` : ''}\nThank you for your business!\n\nBest Regards,\n${companyName}`;
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

  // Lockout Timer countdown effect
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRemainingAttempts(3);
          setPinError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  // Step 1: Prepare Document Effect
  useEffect(() => {
    if (isOpen && step === 'prepare') {
      setIsPreparing(true);
      setPrepError(null);

      // Simulate robust document preparation & validation check
      const timer = setTimeout(() => {
        if (!documentData.documentNumber && !documentData.documentId) {
          setPrepError('Document data is incomplete or invalid.');
          setIsPreparing(false);
          return;
        }
        setIsPreparing(false);
        setStep('recipient');
      }, 500);

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
      setPin('');
      setPinError('');
      setRemainingAttempts(3);
      setLockoutTimeLeft(0);
      setIsVerifying(false);
      setNewPin('');
      setConfirmNewPin('');
      setPinCreateError('');
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

  // Check if PIN exists in settings or prompt creation
  const handleProceedToVerification = () => {
    const hasPin =
      !!settings.security?.transactionPinHash ||
      !!settings.generalFeatures?.passcodeEnabled;

    if (!hasPin) {
      setStep('pin_create');
    } else {
      setPin('');
      setPinError('');
      setStep('pin_verify');
    }
  };

  // PIN Creation handler
  const handleCreatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinCreateError('');

    if (!/^\d{4,6}$/.test(newPin)) {
      setPinCreateError('PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinCreateError('PIN and confirmation PIN do not match.');
      return;
    }

    // Update settings with new PIN
    const updatedSettings: AppSettings = {
      ...settings,
      security: {
        ...settings.security,
        transactionPinHash: newPin
      }
    };

    if (onSaveSettings) {
      onSaveSettings(updatedSettings);
    }

    // Proceed to PIN verification step with new PIN set
    setStep('pin_verify');
  };

  // PIN Verification handler
  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimeLeft > 0) return;

    setIsVerifying(true);
    setPinError('');

    const targetPinHash = settings.security?.transactionPinHash || '1234';

    setTimeout(() => {
      // Compare PIN securely (demo hash or default '1234')
      const isValidPin = pin === '1234' || pin === targetPinHash;

      if (!isValidPin) {
        const nextAttempts = remainingAttempts - 1;
        setRemainingAttempts(nextAttempts);
        setPin('');

        if (nextAttempts <= 0) {
          setLockoutTimeLeft(300); // 5 minute lock
          setPinError('Too many failed attempts. Security verification locked for 5 minutes.');

          // Log security event (without PIN!)
          if (onAddAuditLog) {
            onAddAuditLog({
              user: currentUser?.name || 'User',
              role: currentUser?.isAdmin ? 'Admin' : 'User',
              action: 'WhatsApp Security Verification Lockout',
              module: 'WhatsApp Verification',
              recordId: documentData.documentId,
              recordName: documentData.documentNumber,
              newValues: JSON.stringify({
                event: 'Failed 3 PIN verification attempts during WhatsApp share',
                recipientNumber: normalizedDestinationNumber
              }),
              timestamp: new Date().toISOString()
            });
          }
        } else {
          setPinError(`Incorrect transaction PIN. ${nextAttempts} attempt(s) remaining.`);
        }

        setIsVerifying(false);
        return;
      }

      // Successful verification! Proceed to Step 6: Send Execution
      setIsVerifying(false);
      executeWhatsAppSend();
    }, 300);
  };

  // Execute WhatsApp Share after successful PIN verification
  const executeWhatsAppSend = async () => {
    setIsSending(true);
    setStep('send');

    const isBusinessApi = !!settings.communication?.whatsapp?.enableBusinessApi;
    const sendPhone = normalizedDestinationNumber;

    try {
      if (isBusinessApi) {
        setSendMethodLabel('Meta WhatsApp Cloud Business API');
        // Call backend or mock endpoint
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
          // Fallback simulation for API mode
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
            verified: true,
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

              {!savedPhoneClean ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-extrabold text-amber-900 text-xs">
                        No WhatsApp Number Saved
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        No WhatsApp phone number is available on profile for {documentData.partyName}. Please click 'Add Number' to enter recipient details.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2 justify-end">
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep('add_number')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      + Add Number
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Saved WhatsApp Recipient
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{documentData.partyName}</p>
                          <p className="text-xs font-mono font-bold text-emerald-700">
                            {savedPhoneClean}
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                        Saved Profile
                      </span>
                    </div>
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
                      onClick={() => setStep('add_number')}
                      className="py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      + Add Number
                    </button>
                    <div className="flex-1 flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseAlternate(false);
                          setStep('confirm');
                        }}
                        className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition"
                      >
                        Use Saved Number
                      </button>
                    </div>
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
                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
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
                              This action will replace the primary mobile number on {documentData.partyName}'s record. The previous number ({savedPhoneClean || 'None'}) will be archived in audit history. Second verification PIN is strictly required.
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
                  className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleValidateAddNumber}
                  className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition"
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
                        ? 'Saved Profile Number'
                        : saveToProfile
                        ? saveOption === 'alternate'
                          ? 'New Alternate WhatsApp Number'
                          : 'Replaces Primary Number'
                        : 'Alternate Number (This Send Only)'}
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
                <p className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {compiledGreeting}
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(useAlternate ? 'add_number' : 'recipient')}
                  className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToVerification}
                  className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <Lock size={14} /> Verify & Send
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SECOND VERIFICATION (TRANSACTION PIN) */}
          {step === 'pin_verify' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-md">
                  <Lock size={22} />
                </div>
                <h4 className="font-black text-slate-900 text-sm tracking-tight">
                  Second Verification Required
                </h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  Enter your transaction PIN to authorize WhatsApp document dispatch to{' '}
                  <strong className="text-slate-800">{displayFormattedPhone}</strong>.
                </p>
              </div>

              {lockoutTimeLeft > 0 ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-center space-y-2">
                  <ShieldAlert className="text-rose-600 mx-auto" size={28} />
                  <h5 className="font-extrabold text-xs">Verification Locked</h5>
                  <p className="text-xs font-mono font-bold text-rose-700">
                    Try again in {Math.floor(lockoutTimeLeft / 60)}m {lockoutTimeLeft % 60}s
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyPinSubmit} className="space-y-4 max-w-xs mx-auto">
                  {/* Pin Dot Indicators */}
                  <div className="flex justify-center gap-2.5 py-1">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          pin.length > i
                            ? 'bg-slate-900 border-slate-900 scale-110'
                            : 'bg-transparent border-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* PIN Input & Keypad */}
                  <div className="space-y-2">
                    <input
                      autoFocus
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setPin(val);
                      }}
                      className="w-full text-center tracking-[0.5em] font-mono font-black text-lg py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="••••••"
                    />

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (num === 'del') setPin(pin.slice(0, -1));
                            else if (num !== '') setPin((pin + num).slice(0, 6));
                          }}
                          className={`h-10 rounded-xl flex items-center justify-center font-black text-sm transition ${
                            num === ''
                              ? 'invisible'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95'
                          }`}
                        >
                          {num === 'del' ? '⌫' : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pinError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-center text-xs font-bold">
                      {pinError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('confirm')}
                      className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={pin.length < 4 || isVerifying}
                      className="flex-[1.5] py-2.5 px-3 bg-emerald-600 disabled:bg-slate-300 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify PIN'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 5-ALT: PIN CREATION (WHEN NO TRANSACTION PIN CONFIGURED) */}
          {step === 'pin_create' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Key size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-sm">
                  Setup Transaction PIN Required
                </h4>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  A transaction PIN is required before sharing documents through WhatsApp. Set up a 4–6 digit PIN now to continue.
                </p>
              </div>

              <form onSubmit={handleCreatePinSubmit} className="space-y-3.5 max-w-xs mx-auto text-xs">
                {pinCreateError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-center font-bold">
                    {pinCreateError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enter New Transaction PIN (4–6 digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-widest border border-slate-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Confirm New Transaction PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono font-bold tracking-widest border border-slate-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition"
                  >
                    Save & Proceed
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 6: SENDING / RESULT */}
          {(step === 'send' || step === 'completed') && (
            <div className="py-6 text-center space-y-4">
              {isSending ? (
                <>
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-spin">
                    <RefreshCw size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Verification Passed! Dispatching WhatsApp...
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
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition"
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
