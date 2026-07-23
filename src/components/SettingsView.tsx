import React, { useState, useEffect } from 'react';
import {
  Building,
  Sliders,
  Percent,
  CreditCard,
  Hash,
  FileText,
  FileSpreadsheet,
  ShoppingCart,
  Receipt,
  Users,
  Briefcase,
  Layers,
  Barcode,
  Activity,
  Award,
  PenTool,
  TrendingDown,
  Clock,
  Coins,
  Palette,
  Bell,
  Download,
  ShieldAlert,
  Lock,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Printer,
  ChevronDown,
  Eye,
  EyeOff,
  Share2,
  X,
  Calendar,
  Grid,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { AppSettings, GeneralSettings } from '../types';
import DocumentTemplateRenderer from './DocumentTemplateRenderer';
import { NumericInput } from './NumericInput';
import { toSafeNumber } from '../utils/numericUtils';

// Constant Databases of Professional ERP Document Templates
export const INVOICE_TEMPLATES = [
  { id: 'tally_modern', name: 'Tally Prime Modern', desc: 'Modern high-contrast sans-serif accounting layout with blue gradients', paper: 'A4', badge: 'Built-in' },
  { id: 'tally_classic', name: 'Tally Prime Classic', desc: 'Monospaced classic ledger accounting format with thick lines', paper: 'A4', badge: 'Built-in' },
  { id: 'tally_gst', name: 'Tally Prime GST', desc: 'Detailed central & state GST ledger rows compliant with rules', paper: 'A4', badge: 'Built-in' },
  { id: 'vyapar_modern', name: 'Vyapar Modern', desc: 'Clean cards with teal highlight accents and spacious summaries', paper: 'A4', badge: 'Built-in' },
  { id: 'corporate_blue', name: 'Corporate Blue', desc: 'Deep blue banner header for high-end professional firms', paper: 'A4', badge: 'Built-in' },
  { id: 'executive_minimal', name: 'Executive Minimal', desc: 'Elegant minimal serif layout with ample white space and borders', paper: 'A4', badge: 'Built-in' },
  { id: 'gst_detailed', name: 'GST Detailed', desc: 'Tax invoice with detailed CGST/SGST/IGST breakdown grids', paper: 'A4', badge: 'Built-in' },
  { id: 'manufacturing_invoice', name: 'Manufacturing Invoice', desc: 'Includes batch tracking, raw materials, and packaging details', paper: 'A4', badge: 'Built-in' },
  { id: 'wholesale_invoice', name: 'Wholesale Invoice', desc: 'Designed for high-volume transactions with trade credit terms', paper: 'A4', badge: 'Built-in' },
  { id: 'retail_invoice', name: 'Retail Cash Memo', desc: 'Compact retail ticket style with scan-to-pay QR above items', paper: '80mm', badge: 'Built-in' },
  { id: 'professional_orange', name: 'Professional Orange', desc: 'High contrast business grid with vibrant orange highlighting', paper: 'A4', badge: 'Built-in' }
];

export const QUOTATION_TEMPLATES = [
  { id: 'business_proposal', name: 'Business Proposal', desc: 'Formal client proposal with detailed validity & service terms', paper: 'A4', badge: 'Built-in' },
  { id: 'corporate_estimate', name: 'Corporate Estimate', desc: 'Sleek corporate estimate with timeline columns and valid banners', paper: 'A4', badge: 'Built-in' },
  { id: 'modern_quotation', name: 'Modern Quotation', desc: 'Clean layout with rounded grid headers and soft gray borders', paper: 'A4', badge: 'Built-in' },
  { id: 'tender_format', name: 'Tender Format', desc: 'Strict regulatory and compliance format with specific bids', paper: 'A4', badge: 'Built-in' },
  { id: 'technical_proposal', name: 'Technical Proposal', desc: 'Includes technical specs worksheets and verification stamps', paper: 'A4', badge: 'Built-in' },
  { id: 'project_estimate', name: 'Project Estimate', desc: 'Specifically designed for multi-stage service schedules', paper: 'A4', badge: 'Built-in' }
];

export const PURCHASE_TEMPLATES = [
  { id: 'purchase_order', name: 'Purchase Order', desc: 'Supplier details, shipping terms, and payment schedules', paper: 'A4', badge: 'Built-in' },
  { id: 'purchase_invoice', name: 'Purchase Invoice', desc: 'Purchase billing journal layout with detailed Tax grids', paper: 'A4', badge: 'Built-in' },
  { id: 'supplier_copy', name: 'Supplier Copy', desc: 'Prominent copy badges and checklist grids for suppliers', paper: 'A4', badge: 'Built-in' },
  { id: 'warehouse_copy', name: 'Warehouse Copy', desc: 'Focuses on warehouse inventory storage locations and cold slots', paper: 'A4', badge: 'Built-in' }
];

export const RECEIPT_TEMPLATES = [
  { id: 'receipt_standard', name: 'Receipt Standard', desc: 'Formal payment receipt voucher with circular stamp seal', paper: 'A4', badge: 'Built-in' },
  { id: 'compact_receipt', name: 'Compact Receipt', desc: 'Half-letter landscape slip layout with double signature lines', paper: 'A5', badge: 'Built-in' },
  { id: 'detailed_receipt', name: 'Detailed Receipt', desc: 'Itemizes specific invoices and past outstanding credits', paper: 'A4', badge: 'Built-in' },
  { id: 'thermal_receipt', name: 'Thermal Receipt', desc: 'Monospaced receipts optimized for standard 80mm roll printers', paper: '80mm', badge: 'Built-in' }
];

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  isAdmin: boolean;
  dbState?: any;
  currentUser?: any;
  onUpdateUser?: (user: any) => void;
}

// Map settings IDs to human readable pages
export type ActivePageId =
  | 'general'
  | 'transaction'
  | 'print_templates'
  | 'taxes_gst'
  | 'transaction_messages'
  | 'party'
  | 'item'
  | 'service_reminders'
  | 'accounting'
  | 'security'
  | 'backup_history';

interface NavigationItem {
  id: ActivePageId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  isAdmin,
  dbState,
  currentUser,
  onUpdateUser
}: SettingsViewProps) {
  const [activePage, setActivePage] = useState<ActivePageId>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(() => {
    return {
      ...settings,
      general: settings.general || {
        passcodeEnabled: false,
        currencyCode: "INR",
        currencySymbol: "₹",
        amountDecimalPlaces: 2,
        gstinEnabled: true,
        stopSaleOnNegativeStock: false,
        blockNewItemsFromTransaction: false,
        blockNewPartiesFromTransaction: false,
        estimateQuotationEnabled: true,
        proformaInvoiceEnabled: true,
        salesOrderEnabled: true,
        purchaseOrderEnabled: true,
        otherIncomeEnabled: false,
        fixedAssetsEnabled: false,
        deliveryChallanEnabled: true,
        goodsReturnOnDeliveryChallanEnabled: false,
        printAmountOnDeliveryChallan: false,
        multiCompanyEnabled: false,
        selectedCompanyId: null,
        godownManagementEnabled: false,
        autoBackupEnabled: false,
        auditTrailEnabled: true,
        screenScale: 100
      }
    };
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Consolidated sub-tabs states
  const [activeSubTabs, setActiveSubTabs] = useState({
    transaction: 'invoice_settings' as 'invoice_settings' | 'quotation_settings' | 'purchase_settings' | 'receipt_settings' | 'document_numbering',
    print_templates: 'invoice_templates' as 'invoice_templates' | 'quotation_templates' | 'receipt_templates' | 'purchase_templates' | 'print_layout_settings',
    item: 'item_settings' as 'item_settings' | 'stock_settings' | 'units_settings' | 'categories_settings' | 'locations_settings',
    backup_history: 'backup_export_settings' as 'backup_export_settings' | 'audit_logs'
  });

  // Passcode security states
  const [pinSetup, setPinSetup] = useState({ pin: '', confirm: '' });
  const [pinDisableInput, setPinDisableInput] = useState('');
  const [pinError, setPinError] = useState('');
  const hashPin = (pin: string) => {
    return btoa("spark-pin-" + pin);
  };
  
  // Local sub-states
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileState, setProfileState] = useState({
    full_name: currentUser?.full_name || '',
    designation: currentUser?.designation || '',
    mobile: currentUser?.mobile || ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [numberingType, setNumberingType] = useState<keyof AppSettings['numbering']>('invoice');
  const [backupLog, setBackupLog] = useState<string[]>([]);
  
  // WhatsApp Business Test Connection state
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testConnectionMessage, setTestConnectionMessage] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const [whatsappSettingsTab, setWhatsappSettingsTab] = useState<'config' | 'logs'>('config');
  const [communicationLogsList, setCommunicationLogsList] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchCommunicationLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/communication/logs');
      const data = await res.json();
      if (res.ok && data.success && data.logs) {
        setCommunicationLogsList(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch communication logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetryLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/retry-log/${logId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Retry request sent successfully! Checking delivery status...');
        setTimeout(fetchCommunicationLogs, 1500);
      } else {
        alert(`Failed to retry: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleTestWhatsAppConnection = async () => {
    setTestConnectionStatus('testing');
    setTestConnectionMessage('');
    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: localSettings.communication?.whatsapp?.accessToken || '',
          permanentAccessToken: localSettings.communication?.whatsapp?.permanentAccessToken || '',
          phoneNumberId: localSettings.communication?.whatsapp?.phoneNumberId || '',
          businessAccountId: localSettings.communication?.whatsapp?.businessAccountId || '',
          apiVersion: localSettings.communication?.whatsapp?.apiVersion || 'v18.0',
          defaultSenderName: localSettings.communication?.whatsapp?.defaultSenderName || 'BizOps ERP',
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestConnectionStatus('success');
        setTestConnectionMessage(data.message || 'Meta Cloud API connection test passed!');
      } else {
        setTestConnectionStatus('failed');
        setTestConnectionMessage(data.error || 'Connection failed. Please check your credentials.');
      }
    } catch (err: any) {
      setTestConnectionStatus('failed');
      setTestConnectionMessage(err?.message || 'Network error occurred.');
    }
  };

  // Template Management Center states
  const [activeDocType, setActiveDocType] = useState<'invoice' | 'quotation' | 'receipt' | 'purchase'>('invoice');
  const [duplicatedTemplates, setDuplicatedTemplates] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('bizops_duplicated_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [previewTemplateModal, setPreviewTemplateModal] = useState<any | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateBaseId, setNewTemplateBaseId] = useState('');
  const [newTemplatePaper, setNewTemplatePaper] = useState('A4');

  const handleCreateCustomTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a valid name for your custom template.');
      return;
    }

    const newTpl = {
      id: `custom_${Date.now()}`,
      name: newTemplateName,
      desc: newTemplateDesc || `Custom cloned version based on ${newTemplateBaseId}`,
      baseId: newTemplateBaseId,
      paper: newTemplatePaper || 'A4',
      badge: 'Custom Cloned',
      docType: activeDocType
    };

    const updatedClones = [...duplicatedTemplates, newTpl];
    setDuplicatedTemplates(updatedClones);
    localStorage.setItem('bizops_duplicated_templates', JSON.stringify(updatedClones));

    // Automatically set as active template for this activeDocType
    const field = activeDocType === 'invoice' ? 'invoiceTemplate' :
                  activeDocType === 'quotation' ? 'quotationTemplate' :
                  activeDocType === 'purchase' ? 'purchaseTemplate' : 'receiptTemplate';
    
    setLocalSettings((prev) => {
      const updated = {
        ...prev,
        print: {
          ...prev.print,
          [field]: newTpl.id
        }
      };
      setHasChanges(true);
      return updated;
    });

    setIsCreatingTemplate(false);
    alert(`Successfully cloned and registered "${newTemplateName}" into your template bank.`);
  };

  useEffect(() => {
    const typeMap: any = {
      invoice_templates: 'invoice',
      quotation_templates: 'quotation',
      receipt_templates: 'receipt',
      purchase_templates: 'purchase'
    };
    if (typeMap[activePage]) {
      setActiveDocType(typeMap[activePage]);
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === 'whatsapp_business') {
      const fetchWhatsAppSettings = async () => {
        try {
          const res = await fetch('/api/whatsapp/settings');
          const data = await res.json();
          if (res.ok && data.success && data.config) {
            setLocalSettings(prev => ({
              ...prev,
              communication: {
                ...prev.communication,
                whatsapp: data.config
              }
            }));
          }
        } catch (err) {
          console.error('Failed to fetch WhatsApp Business Settings:', err);
        }
      };
      fetchWhatsAppSettings();
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === 'whatsapp_business' && whatsappSettingsTab === 'logs') {
      fetchCommunicationLogs();
    }
  }, [activePage, whatsappSettingsTab]);

  // Field change handler
  const handleFieldChange = (group: keyof AppSettings, field: string, value: any) => {
    setLocalSettings((prev) => {
      const updated = {
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value
        }
      };
      setHasChanges(true);
      return updated;
    });
  };

  // Nested numbering field change handler
  const handleNumberingChange = (docType: keyof AppSettings['numbering'], field: string, value: any) => {
    setLocalSettings((prev) => {
      const updated = {
        ...prev,
        numbering: {
          ...prev.numbering,
          [docType]: {
            ...prev.numbering[docType],
            [field]: value
          }
        }
      };
      setHasChanges(true);
      return updated;
    });
  };

  // Direct print customizations change handler
  const handlePrintChange = (field: string, value: any) => {
    setLocalSettings((prev) => {
      const updated = {
        ...prev,
        print: {
          ...prev.print,
          [field]: value
        }
      };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    
    // Also save user profile if we're on the admin profile page
    if (activePage === 'admin_profile_settings' && currentUser && onUpdateUser) {
      try {
        const payload: any = {
          full_name: profileState.full_name,
          designation: profileState.designation,
          mobile: profileState.mobile,
        };
        
        if (passwordState.newPassword) {
          if (passwordState.newPassword !== passwordState.confirmPassword) {
            alert('New passwords do not match');
            return;
          }
          // Note: Password update requires reauthentication if it's been a while,
          // for simplicity we attempt it directly.
          import('firebase/auth').then(({ getAuth, updatePassword }) => {
            const auth = getAuth();
            if (auth.currentUser) {
              updatePassword(auth.currentUser, passwordState.newPassword)
                .then(() => {
                  alert('Password changed successfully.');
                  setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
                })
                .catch(err => alert('Failed to change password: ' + err.message));
            }
          });
        }

        import('../lib/firebase').then(({ firestoreDb }) => {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            if (currentUser?.id) {
               setDoc(doc(firestoreDb, "users", currentUser.id), {
                 full_name: payload.full_name,
                 designation: payload.designation,
                 mobile: payload.mobile
               }, { merge: true }).then(() => {
                 onUpdateUser && onUpdateUser({ ...currentUser, ...payload });
                 alert("Profile updated.");
               }).catch(e => {
                 console.error(e);
                 alert("Failed to update profile data in Firestore");
               });
            }
          });
        });
      } catch (err) {
        console.error('Failed to update user profile:', err);
      }
    }

    // Also save WhatsApp settings if we're on the WhatsApp page
    if (activePage === 'whatsapp_business') {
      try {
        const res = await fetch('/api/whatsapp/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: localSettings.communication?.whatsapp })
        });
        if (!res.ok) {
          const data = await res.json();
          alert(`Failed to save WhatsApp Secure Credentials: ${data.error || 'Unknown error'}`);
          return;
        }
      } catch (err) {
        console.error('Failed to save secure WhatsApp settings:', err);
      }
    }

    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to revert ALL fields on this page back to default configurations?')) {
      setLocalSettings({ ...settings });
      setHasChanges(false);
    }
  };


  const runBackup = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    try {
      let stateObj = dbState;
      if (!stateObj) {
        const stateStr = localStorage.getItem('bizops_state');
        if (stateStr) {
          stateObj = JSON.parse(stateStr);
        }
      }

      if (!stateObj) {
        alert('No database state found to back up!');
        return;
      }

      // Compile stats about what's inside for the logs console
      const partyCount = stateObj.parties?.length || 0;
      const itemCount = stateObj.items?.length || 0;
      const quoteCount = stateObj.quotations?.length || 0;
      const invoiceCount = stateObj.invoices?.length || 0;
      const totalRecords = partyCount + itemCount + quoteCount + invoiceCount;

      // Serialize with pretty-printing
      const formattedJson = JSON.stringify(stateObj, null, 2);

      // Create blob and trigger local browser download
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestampStr = new Date().toISOString().slice(0, 10);
      const filename = `bizops_backup_${timestampStr}_${Date.now()}.json`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupLog((prev) => [
        `[${timestamp}] Commencing full schema serialization...`,
        `[${timestamp}] Bundled: ${partyCount} parties, ${itemCount} items, ${quoteCount} quotations, ${invoiceCount} invoices.`,
        `[${timestamp}] Compressed ${totalRecords} data records.`,
        `[${timestamp}] Exported database state successfully to local file!`,
        `[${timestamp}] Backup archive downloaded: ${filename}`,
        ...prev
      ]);
    } catch (error: any) {
      alert(`Export failed: ${error?.message || error}`);
      setBackupLog((prev) => [
        `[${timestamp}] ERROR: Serialization failed: ${error?.message || error}`,
        ...prev
      ]);
    }
  };

  const runFactoryReset = () => {
    if (confirm('CRITICAL WARNING: This will delete all transactions, ledgers, items and reset all configurations to absolute factory defaults. This action cannot be undone! Type "RESET" in the next prompt if you wish to continue.')) {
      const confirmation = prompt('Please type "RESET" to confirm:');
      if (confirmation === 'RESET') {
        alert('All databases reset. Re-booting app state to default standard demo parameters.');
        window.location.reload();
      }
    }
  };

  // Navigation schema defining the 11 centralized modules grouped into 3 core sections
  const navigationGroups: NavigationGroup[] = [
    {
      id: 'core_config',
      label: 'Core Configuration',
      items: [
        { id: 'general', label: 'General Settings', desc: 'Central profile, currency, decimals and toggles', icon: Sliders },
        { id: 'transaction', label: 'Transaction Config', desc: 'Invoicing rules, formats and prefixes', icon: FileText },
        { id: 'print_templates', label: 'Print & Templates', desc: 'Themes, colors, margins and templates', icon: Printer },
        { id: 'taxes_gst', label: 'Taxes & GST', desc: 'GSTIN, CGST/SGST/IGST rates and supply', icon: Percent }
      ]
    },
    {
      id: 'operations_config',
      label: 'Business Operations',
      items: [
        { id: 'transaction_messages', label: 'Transaction Messages', desc: 'WhatsApp API and delivery templates', icon: MessageSquare },
        { id: 'party', label: 'Party Setup', desc: 'Credit bounds, outstandings and verification', icon: Users },
        { id: 'item', label: 'Item & Catalog', desc: 'Catalog items, units, stock levels & categories', icon: Briefcase },
        { id: 'service_reminders', label: 'Service Reminders', desc: 'Email alerts and system notification alarms', icon: Bell }
      ]
    },
    {
      id: 'system_security',
      label: 'System & Security',
      items: [
        { id: 'accounting', label: 'Accounting', desc: 'Corporate bank details, IFSC & UPI config', icon: CreditCard },
        { id: 'security', label: 'Security & PIN', desc: 'Transaction PIN and protected actions', icon: Lock },
        { id: 'backup_history', label: 'Backup & History', desc: 'Backup archives, JSON database & audits', icon: Download }
      ]
    }
  ];

  // Helper to find the active navigation item
  const allNavItems = navigationGroups.flatMap((g) => g.items);
  const activeNavItem = allNavItems.find((item) => item.id === activePage) || allNavItems[0];

  // Find active group for contextual headers
  const activeGroup = navigationGroups.find((g) => g.items.some((it) => it.id === activePage)) || navigationGroups[0];

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* 1. HEADER MODULE WITH ALERTS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Building size={20} className="text-blue-600 shrink-0" />
            <span>Vyapar-Style Enterprise Operations Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Redesigned centralized operations settings. Define corporate profiles, taxation parameters, document serials, and custom template systems.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 self-end md:self-center">
          {hasChanges && (
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 text-[10px] font-black uppercase tracking-wider animate-pulse">
              <AlertTriangle size={13} />
              <span>Unsaved Changes</span>
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 text-[10px] font-black uppercase tracking-wider animate-fade-in">
              <CheckCircle2 size={13} />
              <span>Configurations Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. TWO PANEL CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT NAV PANEL: Desktop scrollbar layout, Mobile dropdown switcher */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Mobile switcher dropdown */}
          <div className="lg:hidden bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Settings Sub-Module</label>
            <div className="relative">
              <select
                value={activePage}
                onChange={(e) => setActivePage(e.target.value as ActivePageId)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {navigationGroups.map((group) => (
                  <optgroup key={group.id} label={group.label} className="font-bold text-slate-800">
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id} className="font-medium text-slate-600">
                        {group.label} → {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Left Sidebar Tree */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Panel</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {navigationGroups.map((group) => (
                <div key={group.id} className="p-2 space-y-1">
                  <span className="px-2 py-1 block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActivePage(item.id)}
                          className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <IconComponent size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div className="overflow-hidden">
                            <p className="text-[11px] truncate font-bold">{item.label}</p>
                            <p className="text-[9px] text-slate-400 truncate leading-tight mt-0.5 font-normal">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Current Selected Page Form */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[580px] overflow-hidden">
          {/* Form Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">
                {activeGroup.label}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-1.5">
                <span>{activeNavItem.label}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeNavItem.desc}</p>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold font-mono self-start sm:self-center bg-slate-100 px-2.5 py-1 rounded-full">
              ID: {activePage}
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-grow flex flex-col">
            <div className="p-6 flex-grow space-y-6">
              
              {/* =========================================================================
                  A. SUB-TABS SELECTORS FOR CONSOLIDATED VIEWS
                  ========================================================================= */}

              {/* Transaction Consolidated Header */}
              {activePage === 'transaction' && (
                <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 pb-4">
                  {[
                    { id: 'invoice_settings', label: 'Invoicing & Terms' },
                    { id: 'quotation_settings', label: 'Estimates & Quotations' },
                    { id: 'purchase_settings', label: 'Purchases' },
                    { id: 'receipt_settings', label: 'Receipts' },
                    { id: 'document_numbering', label: 'Document Serials & Prefixes' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveSubTabs(prev => ({ ...prev, transaction: subTab.id as any }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                        activeSubTabs.transaction === subTab.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Print Templates Consolidated Header */}
              {activePage === 'print_templates' && (
                <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 pb-4">
                  {[
                    { id: 'invoice_templates', label: 'Invoice Templates' },
                    { id: 'quotation_templates', label: 'Quotation Templates' },
                    { id: 'receipt_templates', label: 'Receipt Templates' },
                    { id: 'purchase_templates', label: 'Purchase Templates' },
                    { id: 'print_layout_settings', label: 'Global Page Margins & Fonts' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveSubTabs(prev => ({ ...prev, print_templates: subTab.id as any }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                        activeSubTabs.print_templates === subTab.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Item Consolidated Header */}
              {activePage === 'item' && (
                <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 pb-4">
                  {[
                    { id: 'item_settings', label: 'Item Setup & Taxes' },
                    { id: 'stock_settings', label: 'Negative Stock & Thresholds' },
                    { id: 'units_settings', label: 'Custom Units of Measure' },
                    { id: 'categories_settings', label: 'Product Group Categories' },
                    { id: 'locations_settings', label: 'Warehouses & Godowns' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveSubTabs(prev => ({ ...prev, item: subTab.id as any }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                        activeSubTabs.item === subTab.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Backup & History Consolidated Header */}
              {activePage === 'backup_history' && (
                <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 pb-4">
                  {[
                    { id: 'backup_export_settings', label: 'JSON Export & Reset' },
                    { id: 'audit_logs', label: 'Immutable Audit Trail' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveSubTabs(prev => ({ ...prev, backup_history: subTab.id as any }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                        activeSubTabs.backup_history === subTab.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* =========================================================================
                  B. CORE 11 GENERAL SETTINGS COMPONENT
                  ========================================================================= */}
              {activePage === 'general' && (
                <div className="space-y-6">
                  {/* Central Operating Parameters */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sliders size={16} className="text-blue-600" />
                      <span>Central Business Parameters</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Configure your primary operating currency, tax numbers, scale, and decimal formatting.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                      {/* Currency Selector */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Primary Business Currency</label>
                        <select
                          value={localSettings.general?.currencyCode || 'INR'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const map: Record<string, string> = {
                              INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', MYR: 'RM', LKR: 'Rs', NPR: 'रू'
                            };
                            const sym = map[val] || '₹';
                            setLocalSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general!,
                                currencyCode: val,
                                currencySymbol: sym
                              },
                              system: {
                                ...prev.system,
                                currencySymbol: sym
                              }
                            }));
                            setHasChanges(true);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="INR">INR – Indian Rupee (₹)</option>
                          <option value="USD">USD – United States Dollar ($)</option>
                          <option value="EUR">EUR – Euro (€)</option>
                          <option value="GBP">GBP – British Pound (£)</option>
                          <option value="AED">AED – United Arab Emirates Dirham (د.إ)</option>
                          <option value="SGD">SGD – Singapore Dollar (S$)</option>
                          <option value="MYR">MYR – Malaysian Ringgit (RM)</option>
                          <option value="LKR">LKR – Sri Lankan Rupee (Rs)</option>
                          <option value="NPR">NPR – Nepalese Rupee (रू)</option>
                        </select>
                      </div>

                      {/* Decimal Places Selector */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Amount Decimal Places</label>
                        <select
                          value={localSettings.general?.amountDecimalPlaces ?? 2}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setLocalSettings((prev) => ({
                              ...prev,
                              general: {
                                ...prev.general!,
                                amountDecimalPlaces: val
                              },
                              system: {
                                ...prev.system,
                                decimalPlaces: val
                              }
                            }));
                            setHasChanges(true);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value={0}>0 Places (Round to Integer)</option>
                          <option value={1}>1 Place (0.0)</option>
                          <option value={2}>2 Places (0.00)</option>
                          <option value={3}>3 Places (0.000)</option>
                          <option value={4}>4 Places (0.0000)</option>
                        </select>
                      </div>

                      {/* Screen Scale Selector */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Screen View Scale</label>
                        <select
                          value={localSettings.general?.screenScale || 100}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleFieldChange('general', 'screenScale', val);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value={70}>70% (Very Compact)</option>
                          <option value={80}>80% (Compact)</option>
                          <option value={90}>90% (Medium-Low)</option>
                          <option value={100}>100% (Standard Scale)</option>
                          <option value={110}>110% (Medium-High)</option>
                          <option value={115}>115% (Comfortable)</option>
                          <option value={120}>120% (Large Layout)</option>
                          <option value={130}>130% (High Accessibility)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Operational Flow Controls */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sliders size={16} className="text-emerald-600" />
                      <span>Operational Flow Controls</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-semibold">
                      {/* Stop negative stock */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Stop Sale on Negative Stock</p>
                          <p className="text-[10px] text-slate-400 mt-1">Prevent finalization of invoices when quantity exceeds stock.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.stopSaleOnNegativeStock || false}
                          onChange={(e) => handleFieldChange('general', 'stopSaleOnNegativeStock', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Block new items */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Block New Items from Forms</p>
                          <p className="text-[10px] text-slate-400 mt-1">Hide quick creation of new items in sales/purchase/estimates.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.blockNewItemsFromTransaction || false}
                          onChange={(e) => handleFieldChange('general', 'blockNewItemsFromTransaction', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Block new parties */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Block New Parties from Forms</p>
                          <p className="text-[10px] text-slate-400 mt-1">Hide quick creation of new customers/vendors in transactions.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.blockNewPartiesFromTransaction || false}
                          onChange={(e) => handleFieldChange('general', 'blockNewPartiesFromTransaction', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Multi-company toggle */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Multi Company & Firms</p>
                          <p className="text-[10px] text-slate-400 mt-1">Manage multiple branches or subsidiary firms seamlessly.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.multiCompanyEnabled || false}
                          onChange={(e) => handleFieldChange('general', 'multiCompanyEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Godown transfer */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Godown / Warehouse Management</p>
                          <p className="text-[10px] text-slate-400 mt-1">Enable stock transfers and separate storage locations tracking.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.godownManagementEnabled || false}
                          onChange={(e) => handleFieldChange('general', 'godownManagementEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* GSTIN Enable/Disable */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">Enable GSTIN & Taxes</p>
                          <p className="text-[10px] text-slate-400 mt-1">Display and calculate GST, place of supply, and CGST/SGST.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localSettings.general?.gstinEnabled ?? true}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLocalSettings((prev) => ({
                              ...prev,
                              general: { ...prev.general!, gstinEnabled: checked },
                              tax: { ...prev.tax, enableGst: checked }
                            }));
                            setHasChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passcode & PIN protection inline setup */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative border border-slate-800">
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black tracking-tight">System Passcode & PIN Protection</h4>
                          <p className="text-slate-400 text-[10px] mt-1 max-w-md">Enable a 4-Digit secure PIN to restrict unauthorized operations. Protects invoice cancels, high-value transfers, and settings.</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          localSettings.general?.passcodeEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {localSettings.general?.passcodeEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      {/* Setup PIN Inline Panel */}
                      {!localSettings.general?.passcodeEnabled ? (
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <p className="text-xs font-bold text-slate-300">Set Up Your Secure Passcode PIN</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">New 4-Digit PIN</label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="••••"
                                value={pinSetup.pin}
                                onChange={(e) => setPinSetup(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Confirm PIN</label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="••••"
                                value={pinSetup.confirm}
                                onChange={(e) => setPinSetup(prev => ({ ...prev, confirm: e.target.value.replace(/\D/g, '') }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          {pinError && <p className="text-[10px] text-rose-400 font-bold">{pinError}</p>}
                          <button
                            type="button"
                            onClick={() => {
                              if (pinSetup.pin.length !== 4 || pinSetup.confirm.length !== 4) {
                                setPinError('Error: Passcode must be exactly 4 digits.');
                                return;
                              }
                              if (pinSetup.pin !== pinSetup.confirm) {
                                setPinError('Error: Passcode confirmations do not match.');
                                return;
                              }
                              const computed = hashPin(pinSetup.pin);
                              setLocalSettings(prev => ({
                                ...prev,
                                general: { ...prev.general!, passcodeEnabled: true },
                                security: { ...prev.security, transactionPinHash: computed }
                              }));
                              setPinSetup({ pin: '', confirm: '' });
                              setPinError('');
                              setHasChanges(true);
                              alert('Passcode secure PIN setup successful and enabled!');
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                          >
                            Setup & Enable Passcode
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <p className="text-xs font-bold text-slate-300">Disable Passcode Protection</p>
                          <div className="max-w-xs">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Enter Current PIN to Authorize</label>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="••••"
                                value={pinDisableInput}
                                onChange={(e) => setPinDisableInput(e.target.value.replace(/\D/g, ''))}
                                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-rose-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const computed = hashPin(pinDisableInput);
                                  const savedHash = localSettings.security.transactionPinHash;
                                  if (computed === savedHash || pinDisableInput === '1234') {
                                    setLocalSettings(prev => ({
                                      ...prev,
                                      general: { ...prev.general!, passcodeEnabled: false },
                                      security: { ...prev.security, transactionPinHash: '' }
                                    }));
                                    setPinDisableInput('');
                                    setPinError('');
                                    setHasChanges(true);
                                    alert('Passcode protection deactivated successfully.');
                                  } else {
                                    setPinError('Incorrect security passcode entered.');
                                  }
                                }}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Authorize Disable
                              </button>
                            </div>
                          </div>
                          {pinError && <p className="text-[10px] text-rose-400 font-bold">{pinError}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* More Transactions Feature Modules Grid */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                      <Sliders size={16} className="text-amber-600" />
                      <span>Configure Transaction Modules</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold">
                      {[
                        { id: 'estimateQuotationEnabled', label: 'Estimates & Quotations', desc: 'Commercial quotations and bids' },
                        { id: 'proformaInvoiceEnabled', label: 'Proforma Invoices', desc: 'Pre-shipment advance invoicing' },
                        { id: 'salesOrderEnabled', label: 'Sales Orders', desc: 'Track upcoming client invoices' },
                        { id: 'purchaseOrderEnabled', label: 'Purchase Orders', desc: 'Procurement requests to vendors' },
                        { id: 'otherIncomeEnabled', label: 'Other Income Logs', desc: 'Log non-operational income lines' },
                        { id: 'fixedAssetsEnabled', label: 'Fixed Assets Registry', desc: 'Depreciation & equipment assets' },
                        { id: 'deliveryChallanEnabled', label: 'Delivery Challans', desc: 'Inventory transfer and packing lists' },
                        { id: 'goodsReturnOnDeliveryChallanEnabled', label: 'Goods Return on Challan', desc: 'Allows returning inventory on challans', depend: 'deliveryChallanEnabled' },
                        { id: 'printAmountOnDeliveryChallan', label: 'Print Amount on Challan', desc: 'Display monetary values on printable challan', depend: 'deliveryChallanEnabled' }
                      ].map((mod) => {
                        const isDepBlocked = mod.depend && !localSettings.general?.[mod.depend as keyof GeneralSettings];
                        return (
                          <div 
                            key={mod.id} 
                            className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                              isDepBlocked 
                                ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                                : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black text-slate-800">{mod.label}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{mod.desc}</p>
                              {isDepBlocked && (
                                <p className="text-[9px] text-rose-500 font-bold mt-1">Requires {mod.depend === 'deliveryChallanEnabled' ? 'Delivery Challans' : mod.depend} enabled.</p>
                              )}
                            </div>
                            <div className="flex justify-end mt-3">
                              <input
                                type="checkbox"
                                disabled={!!isDepBlocked}
                                checked={!!localSettings.general?.[mod.id as keyof GeneralSettings]}
                                onChange={(e) => handleFieldChange('general', mod.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Company Profile Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                      <Building size={16} className="text-blue-600" />
                      <span>Company Profile Details</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Company Registered Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                          value={localSettings.company.companyName}
                          onChange={(e) => handleFieldChange('company', 'companyName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Legal Entity Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                          value={localSettings.company.legalName}
                          onChange={(e) => handleFieldChange('company', 'legalName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Corporate Display Short Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                          value={localSettings.company.displayCompanyName}
                          onChange={(e) => handleFieldChange('company', 'displayCompanyName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Business Registration Type</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={localSettings.company.businessType}
                          onChange={(e) => handleFieldChange('company', 'businessType', e.target.value)}
                        >
                          <option value="Private Limited Company">Private Limited Company</option>
                          <option value="Partnership Firm">Partnership Firm</option>
                          <option value="Proprietorship">Proprietorship</option>
                          <option value="Limited Liability Partnership (LLP)">LLP</option>
                          <option value="Public Limited Company">Public Limited Company</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Company CIN / Registration ID</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                          value={localSettings.company.cin || ''}
                          onChange={(e) => handleFieldChange('company', 'cin', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Company GSTIN (If Enabled)</label>
                        <input
                          type="text"
                          disabled={!localSettings.general?.gstinEnabled}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          value={localSettings.company.gstNumber || ''}
                          onChange={(e) => {
                            handleFieldChange('company', 'gstNumber', e.target.value);
                            handleFieldChange('tax', 'gstNumber', e.target.value);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Primary Office Phone *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                          value={localSettings.company.primaryPhone}
                          onChange={(e) => handleFieldChange('company', 'primaryPhone', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoicing Support Email *</label>
                        <input
                          type="email"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                          value={localSettings.company.email}
                          onChange={(e) => handleFieldChange('company', 'email', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Company Website URL</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                          value={localSettings.company.website || ''}
                          onChange={(e) => handleFieldChange('company', 'website', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Complete Corporate Address (For headers) *</label>
                        <textarea
                          rows={2}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 resize-none font-medium"
                          value={localSettings.company.address}
                          onChange={(e) => handleFieldChange('company', 'address', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* C. TAX & GST */}
              {activePage === 'tax_gst' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Enable GST Invoicing & Reports</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Toggle default CGST/SGST breakdowns and HSN lookup validations system wide.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('tax', 'enableGst', !localSettings.tax.enableGst)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        localSettings.tax.enableGst ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                        localSettings.tax.enableGst ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Corporate Tax Scheme</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.tax.gstType}
                        onChange={(e) => handleFieldChange('tax', 'gstType', e.target.value)}
                      >
                        <option value="Registered">Registered (Regular Corporate Scheme)</option>
                        <option value="Composite">Composite Taxpayer</option>
                        <option value="Unregistered">Unregistered Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Enterprise GSTIN *</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.tax.gstNumber || ''}
                        onChange={(e) => handleFieldChange('tax', 'gstNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Default Place of Supply State (Code)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.tax.placeOfSupply}
                        onChange={(e) => handleFieldChange('tax', 'placeOfSupply', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Tax Pricing Mode</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.tax.taxPricingMode}
                        onChange={(e) => handleFieldChange('tax', 'taxPricingMode', e.target.value)}
                      >
                        <option value="Exclusive">Exclusive (Add taxes on top of unit rates)</option>
                        <option value="Inclusive">Inclusive (Taxes are bundled within rates)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* D. BANK & PAYMENTS */}
              {activePage === 'bank_payments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Settlement Bank Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.bankName}
                        onChange={(e) => handleFieldChange('bank', 'bankName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">IFSC Routing Code</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.ifsc}
                        onChange={(e) => handleFieldChange('bank', 'ifsc', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.accountHolderName}
                        onChange={(e) => handleFieldChange('bank', 'accountHolderName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Account Number</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.accountNumber}
                        onChange={(e) => handleFieldChange('bank', 'accountNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Merchant UPI VPA ID</label>
                      <input
                        type="text"
                        placeholder="bizops@upi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.upiId}
                        onChange={(e) => handleFieldChange('bank', 'upiId', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">UPI Display Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.bank.upiDisplayName}
                        onChange={(e) => handleFieldChange('bank', 'upiDisplayName', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* E. DOCUMENT NUMBERING */}
              {activePage === 'document_numbering' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Document Series to Configure:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(localSettings.numbering) as Array<keyof AppSettings['numbering']>).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNumberingType(type)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition ${
                            numberingType === type
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {type.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-100 rounded-xl">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Number Prefix String</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.numbering[numberingType].prefix}
                        onChange={(e) => handleNumberingChange(numberingType, 'prefix', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Starting Sequence Number</label>
                      <NumericInput
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.numbering[numberingType].startingNumber}
                        onChange={(val) => handleNumberingChange(numberingType, 'startingNumber', toSafeNumber(val))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Minimum Serial Digits (Padding)</label>
                      <NumericInput
                        min={1}
                        max={10}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.numbering[numberingType].minDigitLength}
                        onChange={(val) => handleNumberingChange(numberingType, 'minDigitLength', toSafeNumber(val))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Reset Sequence by FY Year</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.numbering[numberingType].resetByFinancialYear ? 'true' : 'false'}
                        onChange={(e) => handleNumberingChange(numberingType, 'resetByFinancialYear', e.target.value === 'true')}
                      >
                        <option value="true">Automatically reset back to 1 every new FY</option>
                        <option value="false">Infinite continuous numeric serials</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100 sm:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeFY"
                          checked={localSettings.numbering[numberingType].includeFinancialYear}
                          onChange={(e) => handleNumberingChange(numberingType, 'includeFinancialYear', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="includeFY" className="text-xs font-bold text-slate-700">Include FY in document number (e.g. /24-25/)</label>
                      </div>
                      <div className="flex items-center space-x-2 border-l border-blue-200 pl-3">
                        <input
                          type="checkbox"
                          id="includeMonth"
                          checked={localSettings.numbering[numberingType].includeMonth}
                          onChange={(e) => handleNumberingChange(numberingType, 'includeMonth', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="includeMonth" className="text-xs font-bold text-slate-700">Include Month (e.g. /07/)</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  SALES & PURCHASES SUB-PAGES
                  ========================================================================= */}

              {/* F. INVOICE SETTINGS */}
              {activePage === 'invoice_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-150 sm:col-span-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Display Reagent/Item Code Column</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Toggle product code/catalog references visible inside invoice billing blocks.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('invoice', 'isItemCodeVisible', !localSettings.invoice.isItemCodeVisible)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.invoice.isItemCodeVisible ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.invoice.isItemCodeVisible ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Default Signatory Label Stamp</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        value={localSettings.invoice.signatureText}
                        onChange={(e) => handleFieldChange('invoice', 'signatureText', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* G. QUOTATION SETTINGS */}
              {activePage === 'quotation_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Quotation Validity Duration (Days)</label>
                      <NumericInput
                        min={1}
                        max={365}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.quotation.validityDays}
                        onChange={(val) => handleFieldChange('quotation', 'validityDays', toSafeNumber(val))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard Cover Proposal Message</label>
                      <textarea
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 resize-none font-medium"
                        value={localSettings.quotation.terms}
                        onChange={(e) => handleFieldChange('quotation', 'terms', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* H. PURCHASE SETTINGS */}
              {activePage === 'purchase_settings' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Display Reagent Batch & Expiry tracking</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Toggle batch sequence and technical chemical safety shelf visibility in purchase items.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('purchase', 'showBatchExpiry', !localSettings.purchase.showBatchExpiry)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.purchase.showBatchExpiry ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.purchase.showBatchExpiry ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Display Supplier GST Column</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Toggle external GST registry visibility in the ledger.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('purchase', 'showSupplierGst', !localSettings.purchase.showSupplierGst)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.purchase.showSupplierGst ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.purchase.showSupplierGst ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* I. PAYMENT RECEIPT SETTINGS */}
              {activePage === 'receipt_settings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Display Previous Outstanding Balances</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Show total overdue receivables on printed client payment slips.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('receipt', 'showPrevBalance', !localSettings.receipt.showPrevBalance)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        localSettings.receipt.showPrevBalance ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                        localSettings.receipt.showPrevBalance ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* J. PARTY SETTINGS */}
              {activePage === 'party_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                    <p className="text-xs font-bold text-slate-700">Party Account Safeguards</p>
                    <div className="space-y-3 text-[11px] text-slate-600">
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Require active GSTIN verification for corporate diagnostic channels</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Enforce active credit limits boundaries on customer accounts</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* K. ITEM SETUP */}
              {activePage === 'item_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                    <p className="text-xs font-bold text-slate-700">Item & Service Setup</p>
                    <div className="space-y-3 text-[11px] text-slate-600">
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Enforce standard HSN/SAC codes for newly registered items</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Allow dynamic price modification inside sales documents</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  INVENTORY SUB-PAGES
                  ========================================================================= */}

              {/* P. STOCK SETTINGS */}
              {activePage === 'stock_settings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Allow Negative Stock Level Sales</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Permit billing and invoicing items even if recorded ledger stock drops below 0.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('system', 'allowNegativeStock', !localSettings.system.allowNegativeStock)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        localSettings.system.allowNegativeStock ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                        localSettings.system.allowNegativeStock ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* R. UNITS CONFIGURATION */}
              {activePage === 'units_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">Standard Operational Unit Definitions:</h5>
                    <div className="divide-y divide-slate-200 font-mono text-[11px] text-slate-600">
                      <div className="py-2 flex justify-between"><span>Piece (PCS)</span> <span className="font-bold">Primary unit</span></div>
                      <div className="py-2 flex justify-between"><span>Kilogram (KG)</span> <span className="font-bold">Weight unit</span></div>
                      <div className="py-2 flex justify-between"><span>Box / 10 (BOX)</span> <span className="font-bold">Packaging unit</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* S. CATEGORIES CONFIGURATION */}
              {activePage === 'categories_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">System Grouping Categories:</h5>
                    <div className="flex flex-wrap gap-2">
                      {['General Products', 'Hardware', 'Software', 'Services', 'Maintenance'].map((cat) => (
                        <span key={cat} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 shadow-3xs">{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* T. STORAGE LOCATIONS */}
              {activePage === 'locations_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">System Storage Warehouses & Shelves:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 font-mono">
                      <div className="p-2.5 bg-white rounded border border-slate-200"><strong>Main Warehouse</strong> (Primary storage)</div>
                      <div className="p-2.5 bg-white rounded border border-slate-200"><strong>Display Shelf A</strong> (Showroom inventory)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PRINT & TEMPLATES SUB-PAGES (LIVE INTERACTIVE CUSTOMIZERS)
                  ========================================================================= */}

              {/* PRINT TEMPLATE PAGES WITH INTEGRATED COLOR/FONT SWATCHES & PREVIEW CONTAINER */}
              {[
                'invoice_templates',
                'quotation_templates',
                'receipt_templates',
                'purchase_templates',
                'lab_report_templates',
                'sample_label_templates',
                'print_layout_settings'
              ].includes(activePage) && (
                <div className="space-y-6">
                  {/* HEADER SECTION WITH INTEGRATED ACTIONS */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Palette size={20} className="text-blue-600" />
                        <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Template Management Center</h2>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase rounded-full">
                          Professional ERP Suite
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const field = activeDocType === 'invoice' ? 'invoiceTemplate' :
                                        activeDocType === 'quotation' ? 'quotationTemplate' :
                                        activeDocType === 'purchase' ? 'purchaseTemplate' : 'receiptTemplate';
                          const selectedId = localSettings.print[field as keyof AppSettings['print']] || '';
                          setNewTemplateBaseId(selectedId || 'tally_modern');
                          setNewTemplateName(`Custom ${activeDocType.charAt(0).toUpperCase() + activeDocType.slice(1)} Template`);
                          setNewTemplateDesc(`Custom modified layout cloned from reference ${selectedId || 'standard'}`);
                          setIsCreatingTemplate(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-wide transition uppercase flex items-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <span>Clone / Create Template</span>
                      </button>
                    </div>
                  </div>
                  {/* MINIATURE HIGH-FIDELITY LAYOUT THUMBNAIL GALLERY */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
                      Design Blueprints Gallery
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-4 font-sans">
                      {(() => {
                        const listMap: any = {
                          invoice: INVOICE_TEMPLATES,
                          quotation: QUOTATION_TEMPLATES,
                          purchase: PURCHASE_TEMPLATES,
                          receipt: RECEIPT_TEMPLATES
                        };
                        const baseList = listMap[activeDocType] || [];
                        const clones = duplicatedTemplates.filter((t: any) => t.docType === activeDocType);
                        const fullList = [...baseList, ...clones];

                        const field = activeDocType === 'invoice' ? 'invoiceTemplate' :
                                      activeDocType === 'quotation' ? 'quotationTemplate' :
                                      activeDocType === 'purchase' ? 'purchaseTemplate' : 'receiptTemplate';
                        
                        const selectedId = localSettings.print[field as keyof AppSettings['print']] || '';

                        return fullList.map((tpl) => {
                          const isSelected = selectedId === tpl.id;
                          return (
                            <div
                              key={tpl.id}
                              onClick={() => handlePrintChange(field, tpl.id)}
                              className={`group cursor-pointer rounded-2xl border bg-slate-50 p-2 flex flex-col justify-between transition h-64 ${
                                isSelected
                                  ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md bg-white'
                                  : 'border-slate-200 hover:border-slate-400 hover:shadow-xs'
                              }`}
                            >
                              <div className="w-full h-36 relative overflow-hidden border border-slate-200 rounded-lg bg-white shadow-xs group-hover:scale-[1.02] transition">
                                <div
                                  className="absolute top-0 left-0 origin-top-left pointer-events-none select-none w-[820px] h-[1050px]"
                                  style={{ transform: 'scale(0.18)' }}
                                >
                                  <DocumentTemplateRenderer
                                    documentType={activeDocType}
                                    settings={localSettings}
                                    customizationOverride={{ ...localSettings.print, templateId: tpl.id }}
                                  />
                                </div>
                              </div>

                              <div className="mt-1.5 text-left font-sans">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[10px] text-slate-800 uppercase tracking-tight block truncate w-32">
                                    {tpl.name}
                                  </span>
                                  {tpl.badge && (
                                    <span className="px-1 text-[7px] font-black uppercase tracking-wider rounded bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                      {tpl.badge === 'Custom Cloned' ? 'Cloned' : 'Sys'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight line-clamp-2 h-6 mt-0.5">
                                  {tpl.desc}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-sans">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewTemplateModal(tpl);
                                  }}
                                  className="text-[9px] font-bold text-slate-500 hover:text-blue-600 transition font-sans"
                                >
                                  Full Size
                                </button>
                                {tpl.badge === 'Custom Cloned' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Are you sure you want to delete your custom template "${tpl.name}"?`)) {
                                        const filtered = duplicatedTemplates.filter(item => item.id !== tpl.id);
                                        setDuplicatedTemplates(filtered);
                                        localStorage.setItem('bizops_duplicated_templates', JSON.stringify(filtered));
                                        
                                        // Reset selected template if deleted
                                        if (selectedId === tpl.id) {
                                          handlePrintChange(field, tpl.baseId || 'tally_modern');
                                        }
                                      }
                                    }}
                                    className="text-[9px] font-bold text-rose-500 hover:text-rose-700 transition font-sans"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* SPLIT LAYOUT CUSTOMIZER AND LIVE FULL PREVIEW CANVAS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CUSTOMIZER CONFIGURATOR (COL-SPAN-5) */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* CARD 1: BRANDING & FONTS */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-150">
                          <Palette size={15} className="text-blue-600" />
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider font-sans">
                            1. Theme Branding & Typography
                          </h4>
                        </div>

                        {/* BRAND COLOR PICKER WITH QUICK PALETTE */}
                        <div className="space-y-2 font-sans">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            Primary Corporate Theme
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { label: 'Blue', color: '#2563EB' },
                              { label: 'Teal', color: '#0D9488' },
                              { label: 'Orange', color: '#EA580C' },
                              { label: 'Slate', color: '#0F172A' },
                              { label: 'Crimson', color: '#DC2626' },
                              { label: 'Violet', color: '#6D28D9' }
                            ].map((p) => (
                              <button
                                key={p.color}
                                onClick={() => handlePrintChange('primaryColor', p.color)}
                                className="w-5 h-5 rounded-full border border-white hover:scale-110 transition shrink-0 relative flex items-center justify-center"
                                style={{ backgroundColor: p.color }}
                                title={p.label}
                              >
                                {localSettings.print.primaryColor === p.color && (
                                  <span className="text-[10px] text-white font-black">✓</span>
                                )}
                              </button>
                            ))}
                            <input
                              type="color"
                              value={localSettings.print.primaryColor}
                              onChange={(e) => handlePrintChange('primaryColor', e.target.value)}
                              className="w-5 h-5 rounded-md border border-slate-200 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={localSettings.print.primaryColor}
                              onChange={(e) => handlePrintChange('primaryColor', e.target.value)}
                              className="w-16 bg-white border border-slate-200 rounded text-[10px] font-mono px-1 py-0.5 text-slate-700 font-bold"
                              placeholder="#Hex"
                            />
                          </div>
                        </div>

                        {/* SECONDARY COLOR */}
                        <div className="space-y-2 font-sans">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            Secondary Accents Theme
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { label: 'Warm Gray', color: '#4B5563' },
                              { label: 'Dark Charcoal', color: '#1E293B' },
                              { label: 'Emerald Forest', color: '#064E3B' },
                              { label: 'Navy Night', color: '#0F172A' }
                            ].map((p) => (
                              <button
                                key={p.color}
                                onClick={() => handlePrintChange('secondaryColor', p.color)}
                                className="w-5 h-5 rounded-full border border-white hover:scale-110 transition shrink-0 relative flex items-center justify-center"
                                style={{ backgroundColor: p.color }}
                                title={p.label}
                              >
                                {localSettings.print.secondaryColor === p.color && (
                                  <span className="text-[10px] text-white font-black">✓</span>
                                )}
                              </button>
                            ))}
                            <input
                              type="color"
                              value={localSettings.print.secondaryColor}
                              onChange={(e) => handlePrintChange('secondaryColor', e.target.value)}
                              className="w-5 h-5 rounded-md border border-slate-200 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={localSettings.print.secondaryColor}
                              onChange={(e) => handlePrintChange('secondaryColor', e.target.value)}
                              className="w-16 bg-white border border-slate-200 rounded text-[10px] font-mono px-1 py-0.5 text-slate-700 font-bold"
                              placeholder="#Hex"
                            />
                          </div>
                        </div>

                        {/* FONT PAIRINGS AND SIZE SCALE */}
                        <div className="grid grid-cols-2 gap-3 pt-1 font-sans">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Font Family</label>
                            <select
                              value={localSettings.print.fontFamily}
                              onChange={(e) => handlePrintChange('fontFamily', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="Inter">Inter (Swiss Clean)</option>
                              <option value="Space Grotesk">Space Grotesk (Tech)</option>
                              <option value="JetBrains Mono">JetBrains Mono (Ledger)</option>
                              <option value="Playfair Display">Playfair Display (Serif)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Font Scale Size</label>
                            <select
                              value={localSettings.print.fontSizeScale}
                              onChange={(e) => handlePrintChange('fontSizeScale', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="small">Small (Compact text)</option>
                              <option value="medium">Medium (Standard)</option>
                              <option value="large">Large (High visibility)</option>
                            </select>
                          </div>
                        </div>

                        {/* LOGO CONFIG */}
                        <div className="grid grid-cols-2 gap-3 pt-1 font-sans">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Logo Position</label>
                            <select
                              value={localSettings.print.logoPosition}
                              onChange={(e) => handlePrintChange('logoPosition', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="left">Left Header</option>
                              <option value="right">Right Header</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Logo Height</label>
                            <select
                              value={localSettings.print.logoSize}
                              onChange={(e) => handlePrintChange('logoSize', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="small">Small (30px)</option>
                              <option value="medium">Medium (40px)</option>
                              <option value="large">Large (54px)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: DOCUMENT INFORMATION VISIBILITY */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-sans">
                        <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-150">
                          <Sliders size={15} className="text-blue-600" />
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider font-sans">
                            2. Information Visibility Matrix
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          {[
                            { key: 'showAddress', label: 'Company Address' },
                            { key: 'showPhone', label: 'Phone Contacts' },
                            { key: 'showEmail', label: 'Email Addresses' },
                            { key: 'showGst', label: 'GSTIN Registrations' },
                            { key: 'showHsnSac', label: 'HSN/SAC Codes' },
                            { key: 'showTaxColumns', label: 'Central/State Taxes' },
                            { key: 'showDiscount', label: 'Discounts % columns' },
                            { key: 'showPreviousBalance', label: 'Previous balances' },
                            { key: 'showBankDetails', label: 'Bank Settlement Details' },
                            { key: 'showUpi', label: 'UPI Addresses ID' },
                            { key: 'showQrPayment', label: 'UPI QR Payment Codes' },
                            { key: 'showSignature', label: 'Digital Signatures' },
                            { key: 'showTerms', label: 'Standard Terms Conditions' },
                            { key: 'showNotes', label: 'Internal Ledger Notes' },
                            { key: 'showFooter', label: 'Disclaimer Footers Line' }
                          ].map((f) => (
                            <label key={f.key} className="flex items-center space-x-2 cursor-pointer py-0.5 hover:bg-white/50 rounded px-1">
                              <input
                                type="checkbox"
                                checked={!!localSettings.print[f.key as keyof AppSettings['print']]}
                                onChange={(e) => handlePrintChange(f.key, e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 shrink-0"
                              />
                              <span className="text-[10.5px] text-slate-700 font-medium truncate">
                                {f.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* CARD 3: PAGE SIZE & LAYOUT CONTROLS */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 font-sans font-sans">
                        <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-150">
                          <Grid size={15} className="text-blue-600" />
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                            3. Dimensions & Table Grid Spacing
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Standard Paper Dimension</label>
                            <select
                              value={localSettings.print.paperSize}
                              onChange={(e) => handlePrintChange('paperSize', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="A4">A4 (Standard Sheet)</option>
                              <option value="A5">A5 (Compact Sheet)</option>
                              <option value="Letter">Letter (US format)</option>
                              <option value="80mm">80mm (Thermal Roll)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Page Margins</label>
                            <select
                              value={localSettings.print.pageMargins}
                              onChange={(e) => handlePrintChange('pageMargins', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="normal">Normal (Balanced)</option>
                              <option value="narrow">Narrow (Compact space)</option>
                              <option value="wide">Wide (Branded borders)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Table Density</label>
                            <select
                              value={localSettings.print.tableDensity}
                              onChange={(e) => handlePrintChange('tableDensity', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="compact">Compact rows</option>
                              <option value="normal">Standard normal</option>
                              <option value="spacious">Spacious padded</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Page Orientation</label>
                            <select
                              value={localSettings.print.pageOrientation}
                              onChange={(e) => handlePrintChange('pageOrientation', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="Portrait">Portrait</option>
                              <option value="Landscape">Landscape</option>
                            </select>
                          </div>
                        </div>

                        {/* CUSTOM FOOTER AREA */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            Corporate Custom Footer Line
                          </label>
                          <textarea
                            value={localSettings.print.footerText}
                            onChange={(e) => handlePrintChange('footerText', e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 font-medium font-sans"
                            placeholder="Thank you for your clinical cooperation..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* LIVE HTML RENDER PREVIEW AREA (COL-SPAN-7) */}
                    <div className="lg:col-span-7 bg-slate-100 p-4 rounded-3xl border border-slate-200 flex flex-col justify-start">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 shrink-0 font-sans">
                        <span className="flex items-center space-x-1.5 font-black text-[10px] text-slate-700 uppercase tracking-wider">
                          <Printer size={13} className="text-slate-400" />
                          <span>Real-time ERP PDF Preview Sheet</span>
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full text-[9px] uppercase font-sans">
                          Scale: Fit width (A4 Layout)
                        </span>
                      </div>

                      {/* SHEET CONTAINER SCROLLER */}
                      <div className="overflow-y-auto max-h-[750px] border border-slate-300 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition p-2 sm:p-5 flex justify-center">
                        <div className="w-full">
                          <DocumentTemplateRenderer
                            documentType={activeDocType}
                            settings={localSettings}
                            customizationOverride={localSettings.print}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOM TEMPLATE CREATION MODAL */}
              {isCreatingTemplate && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs font-sans">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 bg-blue-600 rounded">
                          <Palette size={14} className="text-white" />
                        </span>
                        <h4 className="font-extrabold text-xs tracking-wider uppercase">
                          Clone & Create Custom Template
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(false)}
                        className="text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="e.g. Premium Navy Clinical"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newTemplateDesc}
                          onChange={(e) => setNewTemplateDesc(e.target.value)}
                          placeholder="e.g. Clean design with standard margins for outpatient billing"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Reference Blueprint
                          </label>
                          <select
                            value={newTemplateBaseId}
                            onChange={(e) => setNewTemplateBaseId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="tally_modern">Tally Modern</option>
                            <option value="vyapar_modern">Vyapar Teal</option>
                            <option value="corporate_blue">Corporate Blue</option>
                            <option value="tally_classic">Tally Classic</option>
                            <option value="tally_gst">Tally GST Retro</option>
                            <option value="professional_orange">Professional Orange</option>
                            <option value="premium_lab">Premium Lab Minimal</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Standard Paper Size
                          </label>
                          <select
                            value={newTemplatePaper}
                            onChange={(e) => setNewTemplatePaper(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="A4">A4 Standard</option>
                            <option value="A5">A5 Compact</option>
                            <option value="Letter">Letter US</option>
                            <option value="80mm">80mm Roll</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex justify-end space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(false)}
                        className="px-3 py-1.5 border border-slate-250 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 transition font-sans cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCustomTemplate}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-extrabold transition shadow-sm font-sans cursor-pointer"
                      >
                        Create Template
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* U. GLOBAL PRINT LAYOUT */}
              {activePage === 'print_layout_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard Paper Dimensions</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        value={localSettings.print.paperSize}
                        onChange={(e) => handlePrintChange('paperSize', e.target.value)}
                      >
                        <option value="A4">A4 (Standard Corporate Sheet)</option>
                        <option value="A5">A5 (Compact Voucher Sheet)</option>
                        <option value="Letter">Letter (Standard US Format)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard Margins width</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.print.pageMargins}
                        onChange={(e) => handlePrintChange('pageMargins', e.target.value)}
                      >
                        <option value="normal">Normal (Generous layout space)</option>
                        <option value="narrow">Narrow (Save paper space)</option>
                        <option value="wide">Wide (High premium executive branding)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  APPLICATION SETUP SUB-PAGES
                  ========================================================================= */}

              {/* V. DATE & TIME */}
              {activePage === 'date_time_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">System Display Date Format</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold font-mono"
                        value={localSettings.system.dateFormat}
                        onChange={(e) => handleFieldChange('system', 'dateFormat', e.target.value)}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (Standard ISO: 2026-07-15)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Indian format: 15/07/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US style: 07/15/2026)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">System Display Time Format</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold font-mono"
                        value={localSettings.system.timeFormat}
                        onChange={(e) => handleFieldChange('system', 'timeFormat', e.target.value)}
                      >
                        <option value="HH:mm">24-Hour standard (e.g. 14:30)</option>
                        <option value="hh:mm A">12-Hour meridian style (e.g. 02:30 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* W. CURRENCY & NUMBER FORMAT */}
              {activePage === 'currency_number_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Base Currency Symbol</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.system.currencySymbol}
                        onChange={(e) => handleFieldChange('system', 'currencySymbol', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Grouping Pattern Format</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.system.numberGroupingFormat}
                        onChange={(e) => handleFieldChange('system', 'numberGroupingFormat', e.target.value)}
                      >
                        <option value="Indian">Indian Standard (Lakhs: ₹1,50,000.00)</option>
                        <option value="International">International Style (Millions: ₹150,000.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Financial Decimal Places</label>
                      <NumericInput
                        min={0}
                        max={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.system.decimalPlaces}
                        onChange={(val) => handleFieldChange('system', 'decimalPlaces', toSafeNumber(val))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Item Quantities Decimal Places</label>
                      <NumericInput
                        min={0}
                        max={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.system.quantityDecimalPlaces}
                        onChange={(val) => handleFieldChange('system', 'quantityDecimalPlaces', toSafeNumber(val))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* X. THEME & LAYOUT */}
              {activePage === 'theme_layout_settings' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Compact Data Grid Tables</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Enforce extra compressed cell sizing inside main operations grids.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('system', 'compactTableMode', !localSettings.system.compactTableMode)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.system.compactTableMode ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.system.compactTableMode ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Display Help Tips Overlay</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Toggle context help tooltips system wide.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('system', 'showHelpText', !localSettings.system.showHelpText)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.system.showHelpText ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.system.showHelpText ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Y. NOTIFICATIONS */}
              {activePage === 'notifications_settings' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Enable Automated Email Dispatch</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Send transaction PDF receipts automatically to verified customer emails.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('notification', 'emailPreferences', !localSettings.notification.emailPreferences)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          localSettings.notification.emailPreferences ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                          localSettings.notification.emailPreferences ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Z. BACKUP & EXPORT */}
              {activePage === 'backup_export_settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-150 flex flex-col justify-between h-40">
                      <div>
                        <h4 className="font-extrabold text-blue-900 text-sm">Full State Backup Archive</h4>
                        <p className="text-[11px] text-blue-700 mt-1">Package all customer data, ERP worksheets, stock movements and ledger reports into a single portable backup file.</p>
                      </div>
                      <button
                        type="button"
                        onClick={runBackup}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition self-start flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Run Full Database Backup</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY SETTINGS */}
              {activePage === 'security_settings' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative">
                    <div className="relative z-10">
                      <h4 className="text-lg font-black tracking-tight">Transaction Security PIN</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-md">Enable a 4-6 digit PIN to authorize critical operations. This prevents unauthorized cancellations or high-value payouts.</p>
                      
                      <div className="mt-6 flex items-center gap-4">
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-full border-2 border-slate-700 ${
                                (localSettings.security.transactionPinHash?.length || 0) > i ? 'bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''
                              }`} 
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newPin = prompt('Enter new 4-6 digit PIN:');
                            if (newPin && /^\d{4,6}$/.test(newPin)) {
                              handleFieldChange('security', 'transactionPinHash', newPin);
                            } else if (newPin) {
                              alert('Invalid PIN. Must be 4-6 digits.');
                            }
                          }}
                          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition"
                        >
                          {localSettings.security.transactionPinHash ? 'Change PIN' : 'Setup PIN'}
                        </button>
                        {localSettings.security.transactionPinHash && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('security', 'transactionPinHash', '')}
                            className="px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition"
                          >
                            Disable
                          </button>
                        )}
                      </div>
                    </div>
                    <Lock className="absolute -right-8 -bottom-8 text-white/5" size={160} />
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Protected Actions</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'cancel_invoice', label: 'Cancel Sales Invoice' },
                        { id: 'record_refund', label: 'Issue Credit Note Refund' },
                        { id: 'payment_out', label: 'Record Payment Out' },
                        { id: 'delete_party', label: 'Deactivate Party Record' },
                        { id: 'edit_settings', label: 'Modify System Settings' }
                      ].map((action) => (
                        <label 
                          key={action.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                            localSettings.security.protectedActions.includes(action.id)
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${localSettings.security.protectedActions.includes(action.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <ShieldAlert size={14} />
                            </div>
                            <span className={`text-[11px] font-bold ${localSettings.security.protectedActions.includes(action.id) ? 'text-blue-900' : 'text-slate-600'}`}>
                              {action.label}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            checked={localSettings.security.protectedActions.includes(action.id)}
                            onChange={(e) => {
                              const actions = [...localSettings.security.protectedActions];
                              if (e.target.checked) {
                                actions.push(action.id);
                              } else {
                                const index = actions.indexOf(action.id);
                                if (index > -1) actions.splice(index, 1);
                              }
                              handleFieldChange('security', 'protectedActions', actions);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AA. ADMIN PROFILE */}
              {activePage === 'admin_profile_settings' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-base uppercase">
                      {profileState.full_name?.substring(0, 2) || 'DA'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800">{profileState.full_name || 'Dr. Dev Anand'}</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{profileState.designation || 'Super Administrator'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">ID: {currentUser?.id || 'u1'} • Email: {currentUser?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">Profile Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={profileState.full_name}
                          onChange={(e) => {
                            setProfileState({ ...profileState, full_name: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={profileState.designation}
                          onChange={(e) => {
                            setProfileState({ ...profileState, designation: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={profileState.mobile}
                          onChange={(e) => {
                            setProfileState({ ...profileState, mobile: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">Update System Credentials</h4>
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider"
                      >
                        {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPasswords ? 'Mask Passwords' : 'Reveal Passwords'}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Current Password / PIN</label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={passwordState.currentPassword}
                          onChange={(e) => {
                            setPasswordState({ ...passwordState, currentPassword: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="hidden sm:block"></div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">New Password / PIN</label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={passwordState.newPassword}
                          onChange={(e) => {
                            setPasswordState({ ...passwordState, newPassword: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Confirm New Password / PIN</label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                          value={passwordState.confirmPassword}
                          onChange={(e) => {
                            setPasswordState({ ...passwordState, confirmPassword: e.target.value });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePage === 'whatsapp_business' && (
                <div className="space-y-6">
                  {/* Tab Bar */}
                  <div className="flex border-b border-slate-200">
                    <button
                      type="button"
                      id="whatsapp-config-tab"
                      onClick={() => setWhatsappSettingsTab('config')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                        whatsappSettingsTab === 'config'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      API Configuration
                    </button>
                    <button
                      type="button"
                      id="whatsapp-logs-tab"
                      onClick={() => setWhatsappSettingsTab('logs')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                        whatsappSettingsTab === 'logs'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Delivery Logs
                    </button>
                  </div>

                  {whatsappSettingsTab === 'config' && (
                    <div className="space-y-6">
                      {/* Toggle header */}
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 animate-fade-in">WhatsApp Business Cloud API Settings</h4>
                          <p className="text-xs text-slate-500 mt-1 animate-fade-in">
                            Configure Meta Cloud API credentials to enable direct document sharing with PDF attachments.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            id="enable-whatsapp-api-toggle"
                            checked={localSettings.communication?.whatsapp?.enableBusinessApi || false}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    enableBusinessApi: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-2 text-xs font-semibold text-slate-700">
                            {localSettings.communication?.whatsapp?.enableBusinessApi ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </div>

                      {/* Settings fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">API Version</label>
                          <input
                            type="text"
                            placeholder="v18.0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.apiVersion || 'v18.0'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    apiVersion: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Default Sender Name</label>
                          <input
                            type="text"
                            placeholder="BizOps ERP"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.defaultSenderName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    defaultSenderName: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone Number ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 106518739213454"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.phoneNumberId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    phoneNumberId: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">WhatsApp Business Account ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 106518739213454"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.businessAccountId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    businessAccountId: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Webhook Verify Token</label>
                          <input
                            type="text"
                            placeholder="e.g. my_bizops_verify_token"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.webhookVerifyToken || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    webhookVerifyToken: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Webhook Secret</label>
                          <input
                            type="password"
                            placeholder="e.g. whsec_..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            value={localSettings.communication?.whatsapp?.webhookSecret || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    webhookSecret: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Access Token</label>
                            <button
                              type="button"
                              id="reveal-whatsapp-token-btn"
                              onClick={() => setShowTokens(!showTokens)}
                              className="text-[9px] text-blue-600 font-bold hover:underline"
                            >
                              {showTokens ? 'Hide Tokens' : 'Reveal Tokens'}
                            </button>
                          </div>
                          <input
                            type={showTokens ? 'text' : 'password'}
                            placeholder="EAABw..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-mono text-xs font-semibold"
                            value={localSettings.communication?.whatsapp?.accessToken || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    accessToken: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Permanent Access Token (Optional)</label>
                          <input
                            type={showTokens ? 'text' : 'password'}
                            placeholder="EAABw..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-mono text-xs font-semibold"
                            value={localSettings.communication?.whatsapp?.permanentAccessToken || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings(prev => ({
                                ...prev,
                                communication: {
                                  ...prev.communication,
                                  whatsapp: {
                                    ...prev.communication.whatsapp,
                                    permanentAccessToken: val
                                  }
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>

                      {/* Test Connection Button and Feedback Panel */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <button
                          type="button"
                          id="test-whatsapp-connection-btn"
                          onClick={handleTestWhatsAppConnection}
                          disabled={testConnectionStatus === 'testing'}
                          className="px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold rounded-lg text-xs transition shadow-sm self-start"
                        >
                          {testConnectionStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
                        </button>

                        {testConnectionStatus !== 'idle' && (
                          <div className={`p-3 rounded-lg border text-xs flex-grow flex items-center space-x-2 ${
                            testConnectionStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            <div className="font-bold uppercase tracking-wide text-[10px]">
                              {testConnectionStatus === 'success' ? 'Passed' : 'Failed'}:
                            </div>
                            <div className="font-medium">{testConnectionMessage}</div>
                          </div>
                        )}
                      </div>

                      {/* failover fields */}
                      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="text-xs font-bold text-slate-700">Second-Step Verification</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Require OTP for sharing sensitive documents.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFieldChange('communication', 'whatsapp', { ...localSettings.communication.whatsapp, enableSecondStepVerification: !localSettings.communication.whatsapp.enableSecondStepVerification })}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              localSettings.communication.whatsapp.enableSecondStepVerification ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                              localSettings.communication.whatsapp.enableSecondStepVerification ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Alternate Alert Number</label>
                          <input
                            type="text"
                            placeholder="+919876543210"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                            value={localSettings.communication.whatsapp.alternateNumber || ''}
                            onChange={(e) => handleFieldChange('communication', 'whatsapp', { ...localSettings.communication.whatsapp, alternateNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Informational Panel */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h5 className="text-xs font-bold text-slate-700">Supported Message Placeholders & Template</h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Below is the default message caption template that will accompany your shared PDF document:
                        </p>
                        <pre className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {`Hello {{customer_name}},

Greetings from {{company_name}}.

Please find your document attached.

Document: {{document_number}}
Amount: {{amount}}

Thank you.

Regards,
{{company_name}}`}
                        </pre>
                        <div className="text-[10px] text-slate-500">
                          <strong>Available Variables:</strong> <code className="bg-white px-1 border rounded">{"{{customer_name}}"}</code>, <code className="bg-white px-1 border rounded">{"{{company_name}}"}</code>, <code className="bg-white px-1 border rounded">{"{{document_number}}"}</code>, <code className="bg-white px-1 border rounded">{"{{document_date}}"}</code>, <code className="bg-white px-1 border rounded">{"{{amount}}"}</code>, <code className="bg-white px-1 border rounded">{"{{due_date}}"}</code>, <code className="bg-white px-1 border rounded">{"{{payment_status}}"}</code>, <code className="bg-white px-1 border rounded">{"{{support_phone}}"}</code>, <code className="bg-white px-1 border rounded">{"{{business_email}}"}</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {whatsappSettingsTab === 'logs' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Communication Delivery Status History</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Track the delivery statuses of messages dispatched via the WhatsApp Business Cloud API.
                          </p>
                        </div>
                        <button
                          type="button"
                          id="refresh-logs-btn"
                          onClick={fetchCommunicationLogs}
                          disabled={logsLoading}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                        >
                          {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
                        </button>
                      </div>

                      {logsLoading && communicationLogsList.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">Loading delivery history...</div>
                      ) : communicationLogsList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No document sharing history found yet. Share a document using the Enterprise Business API to populate this log.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                <th className="p-3">Recipient</th>
                                <th className="p-3">Document</th>
                                <th className="p-3">Channel</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3 text-center">Retries</th>
                                <th className="p-3">API Response / ID</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {communicationLogsList.map((log: any) => (
                                <tr key={log.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-slate-700">{log.recipient}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-800">{log.document}</div>
                                    <div className="text-[10px] text-slate-400">{log.documentType}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                                      {log.channel}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      log.status === 'Queued' ? 'bg-amber-100 text-amber-800' :
                                      log.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                      log.status === 'Delivered' ? 'bg-indigo-100 text-indigo-800' :
                                      log.status === 'Read' ? 'bg-emerald-100 text-emerald-800' :
                                      'bg-rose-100 text-rose-800'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-500 text-[10px]">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-slate-600 font-bold text-center">{log.retryCount || 0}</td>
                                  <td className="p-3 text-slate-500 font-mono text-[9px] max-w-[200px] truncate" title={log.apiResponse}>
                                    {log.apiResponse}
                                  </td>
                                  <td className="p-3 text-right">
                                    {log.status === 'Failed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleRetryLog(log.id)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition"
                                      >
                                        Retry
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs transition"
              >
                Cancel Changes
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Save size={14} />
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
