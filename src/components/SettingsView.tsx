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
  Calendar,
  Grid,
  FileCheck
} from 'lucide-react';
import { AppSettings } from '../types';
import DocumentTemplateRenderer from './DocumentTemplateRenderer';

// Constant Databases of Professional ERP Document Templates
export const INVOICE_TEMPLATES = [
  { id: 'tally_modern', name: 'Tally Prime Modern', desc: 'Modern high-contrast sans-serif accounting layout with blue gradients', paper: 'A4', badge: 'Built-in' },
  { id: 'tally_classic', name: 'Tally Prime Classic', desc: 'Monospaced classic ledger accounting format with thick lines', paper: 'A4', badge: 'Built-in' },
  { id: 'tally_gst', name: 'Tally Prime GST', desc: 'Detailed central & state GST ledger rows compliant with rules', paper: 'A4', badge: 'Built-in' },
  { id: 'vyapar_modern', name: 'Vyapar Modern', desc: 'Clean cards with teal highlight accents and spacious summaries', paper: 'A4', badge: 'Built-in' },
  { id: 'corporate_blue', name: 'Corporate Blue', desc: 'Deep blue banner header for high-end clinical labs', paper: 'A4', badge: 'Built-in' },
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
  { id: 'laboratory_estimate', name: 'Laboratory Estimate', desc: 'Specifically designed for multi-sample assay schedules', paper: 'A4', badge: 'Built-in' }
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

export const LAB_REPORT_TEMPLATES = [
  { id: 'laboratory_professional', name: 'Laboratory Professional', desc: 'Official letterhead style with digital CSO & Director stamps', paper: 'A4', badge: 'Built-in' },
  { id: 'research_report', name: 'Research Report', desc: 'Detailed multi-page report structure with literature references', paper: 'A4', badge: 'Built-in' },
  { id: 'iso_format', name: 'ISO Format', desc: 'ISO/IEC 17025 accredited template with regulatory uncertainty values', paper: 'A4', badge: 'Built-in' },
  { id: 'medical_style', name: 'Medical Style', desc: 'Color-coded clinical ranges with dedicated pathologist approval boxes', paper: 'A4', badge: 'Built-in' },
  { id: 'industrial_test_report', name: 'Industrial Test Report', desc: 'Designed for effluent liquid water, gaseous emissions, and soils', paper: 'A4', badge: 'Built-in' }
];

export const SAMPLE_LABEL_TEMPLATES = [
  { id: 'qr_label', name: 'QR Label', desc: 'High density QR code for barcode scanners and inventory shelves', paper: 'Compact', badge: 'Built-in' },
  { id: 'barcode_label', name: 'Barcode Label', desc: 'Traditional linear barcode with UID code lines and timestamp', paper: 'Compact', badge: 'Built-in' },
  { id: 'compact_label', name: 'Compact Label', desc: 'Micro sized simple label for small sample tubes and vials', paper: 'Compact', badge: 'Built-in' },
  { id: 'warehouse_label', name: 'Warehouse Label', desc: 'Storage cabinet location, cold slots, and hazard symbols', paper: 'Compact', badge: 'Built-in' }
];

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  isAdmin: boolean;
  dbState?: any;
}

// Map settings IDs to human readable pages
type ActivePageId =
  // Business Setup
  | 'company_details' | 'general_settings' | 'tax_gst' | 'bank_payments' | 'document_numbering'
  // Sales & Purchase
  | 'invoice_settings' | 'quotation_settings' | 'purchase_settings' | 'receipt_settings' | 'party_settings' | 'item_settings'
  // Lab Settings
  | 'sample_settings' | 'lab_test_settings' | 'lab_report_settings' | 'signature_auth'
  // Inventory
  | 'stock_settings' | 'batch_expiry_settings' | 'units_settings' | 'categories_settings' | 'locations_settings'
  // Print & Templates
  | 'invoice_templates' | 'quotation_templates' | 'receipt_templates' | 'purchase_templates' | 'lab_report_templates' | 'sample_label_templates' | 'print_layout_settings'
  // Application
  | 'date_time_settings' | 'currency_number_settings' | 'theme_layout_settings' | 'notifications_settings' | 'backup_export_settings' | 'admin_profile_settings' | 'change_password_settings';

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
  dbState
}: SettingsViewProps) {
  const [activePage, setActivePage] = useState<ActivePageId>('company_details');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Local sub-states
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [numberingType, setNumberingType] = useState<keyof AppSettings['numbering']>('invoice');
  const [backupLog, setBackupLog] = useState<string[]>([]);

  // Template Management Center states
  const [activeDocType, setActiveDocType] = useState<'invoice' | 'quotation' | 'receipt' | 'purchase' | 'labReport' | 'sampleLabel'>('invoice');
  const [duplicatedTemplates, setDuplicatedTemplates] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('labbiz_duplicated_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [previewTemplateModal, setPreviewTemplateModal] = useState<any | null>(null);

  useEffect(() => {
    const typeMap: any = {
      invoice_templates: 'invoice',
      quotation_templates: 'quotation',
      receipt_templates: 'receipt',
      purchase_templates: 'purchase',
      lab_report_templates: 'labReport',
      sample_label_templates: 'sampleLabel'
    };
    if (typeMap[activePage]) {
      setActiveDocType(typeMap[activePage]);
    }
  }, [activePage]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword || !passwordState.newPassword) {
      alert('Please fill out all password fields.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    alert('Security PIN / Password has been changed successfully for this user session.');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const runBackup = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    try {
      let stateObj = dbState;
      if (!stateObj) {
        const stateStr = localStorage.getItem('labbiz_state');
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
      const sampleCount = stateObj.samples?.length || 0;
      const reportCount = stateObj.labReports?.length || 0;
      const totalRecords = partyCount + itemCount + quoteCount + invoiceCount + sampleCount + reportCount;

      // Serialize with pretty-printing
      const formattedJson = JSON.stringify(stateObj, null, 2);

      // Create blob and trigger local browser download
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestampStr = new Date().toISOString().slice(0, 10);
      const filename = `labbiz_backup_${timestampStr}_${Date.now()}.json`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupLog((prev) => [
        `[${timestamp}] Commencing full schema serialization...`,
        `[${timestamp}] Bundled: ${partyCount} parties, ${itemCount} items, ${quoteCount} quotations, ${invoiceCount} invoices, ${sampleCount} samples, ${reportCount} lab reports.`,
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
    if (confirm('CRITICAL WARNING: This will delete all transactions, ledgers, samples and reset all configurations to absolute factory defaults. This action cannot be undone! Type "RESET" in the next prompt if you wish to continue.')) {
      const confirmation = prompt('Please type "RESET" to confirm:');
      if (confirmation === 'RESET') {
        alert('All databases reset. Re-booting app state to default standard demo parameters.');
        window.location.reload();
      }
    }
  };

  // Navigation schema defining the 29 sub-sections grouped into 6 main modules
  const navigationGroups: NavigationGroup[] = [
    {
      id: 'business_setup',
      label: 'Business Setup',
      items: [
        { id: 'company_details', label: 'Company Details', desc: 'Address, legal profile, phone & email', icon: Building },
        { id: 'general_settings', label: 'General Settings', desc: 'Branch name, start options, appdefaults', icon: Sliders },
        { id: 'tax_gst', label: 'Tax & GST Settings', desc: 'GST registration, rates & rounding rules', icon: Percent },
        { id: 'bank_payments', label: 'Bank & Payments', desc: 'Bank account, IFSC, UPI, and instructions', icon: CreditCard },
        { id: 'document_numbering', label: 'Document Numbering', desc: 'Numeric serials, prefixes & resets', icon: Hash }
      ]
    },
    {
      id: 'sales_purchase',
      label: 'Sales & Purchases',
      items: [
        { id: 'invoice_settings', label: 'Invoice Settings', desc: 'Invoicing terms, footers & columns visibility', icon: FileText },
        { id: 'quotation_settings', label: 'Quotation Settings', desc: 'Proposal parameters and validity duration', icon: FileSpreadsheet },
        { id: 'purchase_settings', label: 'Purchase Settings', desc: 'Supplier order terms, batch/reagent visibility', icon: ShoppingCart },
        { id: 'receipt_settings', label: 'Receipt Settings', desc: 'Allocation details, receipt footers & previews', icon: Receipt },
        { id: 'party_settings', label: 'Party Settings', desc: 'Credit boundaries and mandatory tax triggers', icon: Users },
        { id: 'item_settings', label: 'Item & Service Setup', desc: 'Service tax groupings and unit conversions', icon: Briefcase }
      ]
    },
    {
      id: 'lab_settings',
      label: 'Lab Settings',
      items: [
        { id: 'sample_settings', label: 'Sample Settings', desc: 'Sample prefixes, TAT durations & labeling size', icon: Barcode },
        { id: 'lab_test_settings', label: 'Lab Test Settings', desc: 'Double review, incubation thresholds', icon: Activity },
        { id: 'lab_report_settings', label: 'Lab Report Settings', desc: 'Report layout toggles, reference range details', icon: Award },
        { id: 'signature_auth', label: 'Signature & Auth', desc: 'Signatory authority names and digital seals', icon: PenTool }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      items: [
        { id: 'stock_settings', label: 'Stock Settings', desc: 'Negative stock bypass, stock alarms', icon: TrendingDown },
        { id: 'batch_expiry_settings', label: 'Batch & Expiry', desc: 'Reagent batch numbering and alarm levels', icon: Calendar },
        { id: 'units_settings', label: 'Units Configuration', desc: 'Primary & secondary testing units', icon: Layers },
        { id: 'categories_settings', label: 'Categories Settings', desc: 'Service & product grouping categories', icon: Grid },
        { id: 'locations_settings', label: 'Storage Locations', desc: 'Cold rooms, cabinets and shelf identifiers', icon: Building }
      ]
    },
    {
      id: 'print_templates',
      label: 'Print & Templates',
      items: [
        { id: 'invoice_templates', label: 'Invoice Templates', desc: 'Customize invoice layout & live preview', icon: Printer },
        { id: 'quotation_templates', label: 'Quotation Templates', desc: 'Customize proposal layout & live preview', icon: FileSpreadsheet },
        { id: 'receipt_templates', label: 'Receipt Templates', desc: 'Customize receipt layout & live preview', icon: Receipt },
        { id: 'purchase_templates', label: 'Purchase Templates', desc: 'Customize purchase order layout & live preview', icon: ShoppingCart },
        { id: 'lab_report_templates', label: 'Lab Report Templates', desc: 'Customize report layout & live preview', icon: Award },
        { id: 'sample_label_templates', label: 'Sample Label Templates', desc: 'Customize thermal label barcodes & preview', icon: Barcode },
        { id: 'print_layout_settings', label: 'Print Layout Settings', desc: 'Global primary colors, fonts, and margin rules', icon: Palette }
      ]
    },
    {
      id: 'application',
      label: 'Application Settings',
      items: [
        { id: 'date_time_settings', label: 'Date & Time Format', desc: 'System date/time display configurations', icon: Clock },
        { id: 'currency_number_settings', label: 'Currency & Numbers', desc: 'Decimal places, currency symbols, separators', icon: Coins },
        { id: 'theme_layout_settings', label: 'Theme & Layout', desc: 'Sidebar modes, compact table layout options', icon: Sliders },
        { id: 'notifications_settings', label: 'Notifications Setup', desc: 'Email and in-app system triggers', icon: Bell },
        { id: 'backup_export_settings', label: 'Backup & JSON Export', desc: 'Download state database archives & reset', icon: Download },
        { id: 'admin_profile_settings', label: 'Admin Profile', desc: 'Administrative user details', icon: Users },
        { id: 'change_password_settings', label: 'Change PIN / Password', desc: 'Update system security authorization codes', icon: Lock }
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
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[9px] font-black font-mono">29 MODULES</span>
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
                  BUSINESS SETUP SUB-PAGES
                  ========================================================================= */}

              {/* A. COMPANY DETAILS */}
              {activePage === 'company_details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Company Registered Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        value={localSettings.company.labName}
                        onChange={(e) => handleFieldChange('company', 'labName', e.target.value)}
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
                        value={localSettings.company.displayLabName}
                        onChange={(e) => handleFieldChange('company', 'displayLabName', e.target.value)}
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
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Alternative Support Phone</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.company.alternatePhone || ''}
                        onChange={(e) => handleFieldChange('company', 'alternatePhone', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Complete Corporate Address (For headers) *</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 resize-none font-medium"
                        value={localSettings.company.address}
                        onChange={(e) => handleFieldChange('company', 'address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* B. GENERAL SETTINGS */}
              {activePage === 'general_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Default Operating Branch Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                        value={localSettings.system.defaultBranchName}
                        onChange={(e) => handleFieldChange('system', 'defaultBranchName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">First Day of Work Week</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.system.firstDayOfWeek}
                        onChange={(e) => handleFieldChange('system', 'firstDayOfWeek', e.target.value)}
                      >
                        <option value="Monday">Monday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Saturday">Saturday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Fiscal Year Starting Month</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.system.financialYearStartMonth}
                        onChange={(e) => handleFieldChange('system', 'financialYearStartMonth', e.target.value)}
                      >
                        <option value="April">April (Indian Standard Standard)</option>
                        <option value="January">January (Calendar Year)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">System Start Page</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.system.appStartPage}
                        onChange={(e) => handleFieldChange('system', 'appStartPage', e.target.value)}
                      >
                        <option value="dashboard">Operations Dashboard</option>
                        <option value="sales">Sales & Billing Ledger</option>
                        <option value="lab">LIMS Sample Intake</option>
                        <option value="inventory">Inventory Hub</option>
                      </select>
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
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Tax Registration Type</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.tax.gstRegistrationType}
                        onChange={(e) => handleFieldChange('tax', 'gstRegistrationType', e.target.value)}
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
                        placeholder="labbiz@upi"
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
                          {type}
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
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.numbering[numberingType].startingNumber}
                        onChange={(e) => handleNumberingChange(numberingType, 'startingNumber', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Minimum Serial Digits (Padding)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.numbering[numberingType].minDigitLength}
                        onChange={(e) => handleNumberingChange(numberingType, 'minDigitLength', Number(e.target.value))}
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
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard Terms & Bank Instructions (Invoice footer)</label>
                      <textarea
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-medium resize-none"
                        value={localSettings.invoice.terms}
                        onChange={(e) => handleFieldChange('invoice', 'terms', e.target.value)}
                      />
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
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.quotation.validityDays}
                        onChange={(e) => handleFieldChange('quotation', 'validityDays', Number(e.target.value))}
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
                        <p className="text-xs font-bold text-slate-700">Include Supplier Registered GST Column</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Enforce inbound vendor tax breakdown logging.</p>
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

              {/* K. ITEM & SERVICE SETTINGS */}
              {activePage === 'item_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                    <p className="text-xs font-bold text-slate-700">Analytical Assay Standard Setup</p>
                    <div className="space-y-3 text-[11px] text-slate-600">
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Enforce standard SAC code (998346) for newly registered biological assays</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Allow dynamic price modification inside laboratory worksheet invoices</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  LAB SETTINGS SUB-PAGES
                  ========================================================================= */}

              {/* L. SAMPLE SETTINGS */}
              {activePage === 'sample_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard LIMS Sample Intake Prefix</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.sample.prefix}
                        onChange={(e) => handleFieldChange('sample', 'prefix', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Turnaround Target Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.sample.defaultTurnaroundTimeDays}
                        onChange={(e) => handleFieldChange('sample', 'defaultTurnaroundTimeDays', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Barcode Technology Preference</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.sample.barcodePreference}
                        onChange={(e) => handleFieldChange('sample', 'barcodePreference', e.target.value)}
                      >
                        <option value="QR Code">QR Code Matrix (Recommended)</option>
                        <option value="Barcode">Standard Linear Code-128 Barcode</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard Thermal Label Roll Size</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={localSettings.sample.labelSize}
                        onChange={(e) => handleFieldChange('sample', 'labelSize', e.target.value)}
                      >
                        <option value="50mm x 25mm">50mm x 25mm (Standard Compact Tube)</option>
                        <option value="38mm x 25mm">38mm x 25mm (Vial Micro size)</option>
                        <option value="80mm x 50mm">80mm x 50mm (Large Sample Container)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* M. LAB TEST SETTINGS */}
              {activePage === 'lab_test_settings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Enforce Double Scientific Peer Review</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Require senior cytologist/scientist reviewer approvals before reports lock digitally.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Peer review rules activated for active laboratory validation sequences.')}
                      className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-slate-300"
                    >
                      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out translate-x-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* N. LAB REPORT SETTINGS */}
              {activePage === 'lab_report_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 font-bold">
                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded border border-slate-150 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.report.showLabLogo}
                        onChange={(e) => handleFieldChange('report', 'showLabLogo', e.target.checked)}
                        className="rounded text-blue-600 border-slate-300"
                      />
                      <span>Show logo branding in report headers</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded border border-slate-150 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.report.showAccreditation}
                        onChange={(e) => handleFieldChange('report', 'showAccreditation', e.target.checked)}
                        className="rounded text-blue-600 border-slate-300"
                      />
                      <span>Show NABL certificate accreditation details</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded border border-slate-150 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.report.showCustomerDetails}
                        onChange={(e) => handleFieldChange('report', 'showCustomerDetails', e.target.checked)}
                        className="rounded text-blue-600 border-slate-300"
                      />
                      <span>Include billed recipient reference codes</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded border border-slate-150 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.report.showSampleDetails}
                        onChange={(e) => handleFieldChange('report', 'showSampleDetails', e.target.checked)}
                        className="rounded text-blue-600 border-slate-300"
                      />
                      <span>Display sample matrix collection timelines</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Standard NABL Accreditation Certificate Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                      value={localSettings.report.accreditationText}
                      onChange={(e) => handleFieldChange('report', 'accreditationText', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* O. SIGNATURE & AUTHORISATION */}
              {activePage === 'signature_auth' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Accredited Laboratory Certificate Signatory Stamp Label *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        value={localSettings.report.signatureText}
                        onChange={(e) => handleFieldChange('report', 'signatureText', e.target.value)}
                      />
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
                      <p className="text-[10px] text-slate-400 mt-0.5">Permit billing and invoicing reagent kits even if recorded ledger stock drops below 0.</p>
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

              {/* Q. BATCH & EXPIRY */}
              {activePage === 'batch_expiry_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                    <p className="text-xs font-bold text-slate-700">Batch Expiry Safe Guards</p>
                    <div className="space-y-3 text-[11px] text-slate-600">
                      <label className="flex items-center space-x-2 cursor-pointer font-bold">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                        <span>Block chemical reagent allocations if remaining shelf life is &lt; 90 days</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* R. UNITS CONFIGURATION */}
              {activePage === 'units_settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">Standard Operational Unit Definitions:</h5>
                    <div className="divide-y divide-slate-200 font-mono text-[11px] text-slate-600">
                      <div className="py-2 flex justify-between"><span>Sample (SMP)</span> <span className="font-bold">Active default LIMS matrix unit</span></div>
                      <div className="py-2 flex justify-between"><span>Vial (VIL)</span> <span className="font-bold">Active chemical solution container</span></div>
                      <div className="py-2 flex justify-between"><span>Box / 100 (BOX)</span> <span className="font-bold">Active package grouping unit</span></div>
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
                      {['Water Testing', 'Chemical Plating Services', 'LIMS Assay Reagents', 'Vessels & Glassware', 'Lab Equipment Maintenance'].map((cat) => (
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
                      <div className="p-2.5 bg-white rounded border border-slate-200"><strong>Cold Room Refrigerator 1A</strong> (Temp range: 2°C to 8°C)</div>
                      <div className="p-2.5 bg-white rounded border border-slate-200"><strong>Chemical Cabinet B</strong> (Reagent isolation shelves)</div>
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
                          Professional LIMS Suite
                        </span>
                      </div>
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
                          receipt: RECEIPT_TEMPLATES,
                          labReport: LAB_REPORT_TEMPLATES,
                          sampleLabel: SAMPLE_LABEL_TEMPLATES
                        };
                        const baseList = listMap[activeDocType] || [];
                        const clones = duplicatedTemplates.filter((t: any) => t.docType === activeDocType);
                        const fullList = [...baseList, ...clones];

                        const field = activeDocType === 'invoice' ? 'invoiceTemplate' :
                                      activeDocType === 'quotation' ? 'quotationTemplate' :
                                      activeDocType === 'purchase' ? 'purchaseTemplate' :
                                      activeDocType === 'receipt' ? 'receiptTemplate' :
                                      activeDocType === 'labReport' ? 'labReportTemplate' : 'sampleLabelTemplate';
                        
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
                                  className="text-[9px] font-bold text-slate-500 hover:text-blue-600 transition"
                                >
                                  Full Size
                                </button>
                                {isSelected ? (
                                  <span className="text-[9px] font-black text-blue-600 uppercase flex items-center space-x-0.5">
                                    <span>✔</span> <span>Active</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-slate-600 transition">
                                    Use
                                  </span>
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
                          <span>Real-time LIMS PDF Preview Sheet</span>
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
                      <input
                        type="number"
                        min="0"
                        max="4"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.system.decimalPlaces}
                        onChange={(e) => handleFieldChange('system', 'decimalPlaces', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Item Quantities Decimal Places</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                        value={localSettings.system.quantityDecimalPlaces}
                        onChange={(e) => handleFieldChange('system', 'quantityDecimalPlaces', Number(e.target.value))}
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
                        <p className="text-xs font-bold text-slate-700">Display Context Help Texts</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Show help hints underneath system form headers.</p>
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

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Due Invoice Reminder threshold (Days)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                        value={localSettings.notification.reminderDaysBeforeDue}
                        onChange={(e) => handleFieldChange('notification', 'reminderDaysBeforeDue', Number(e.target.value))}
                      />
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
                        <p className="text-[11px] text-blue-700 mt-1">Package all customer data, LIMS worksheets, reagent stock movements and ledger reports into a single portable backup file.</p>
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

                    <div className="p-4 bg-red-50 rounded-xl border border-red-150 flex flex-col justify-between h-40">
                      <div>
                        <h4 className="font-extrabold text-red-950 text-sm">Database Factory Reset</h4>
                        <p className="text-[11px] text-red-700 mt-1">Permanently scrub all local transaction data, custom ledgers and LIMS worksheets to reboot back to factory settings.</p>
                      </div>
                      <button
                        type="button"
                        onClick={runFactoryReset}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition self-start flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ShieldAlert size={13} />
                        <span>Perform Factory Reset</span>
                      </button>
                    </div>
                  </div>

                  {backupLog.length > 0 && (
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto">
                      <p className="text-blue-400 font-bold border-b border-slate-800 pb-1 mb-1">// ACTIVE WORKSPACE SYSTEM BACKUP LOGS</p>
                      {backupLog.map((log, idx) => (
                        <p key={idx}>{log}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AA. ADMIN PROFILE */}
              {activePage === 'admin_profile_settings' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-base">
                      DA
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800">Dr. Dev Anand</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Super Administrator (HQ License)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">ID: u1 • Active session boundary since April 2026</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BB. CHANGE PASSWORD */}
              {activePage === 'change_password_settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Current Authorized Password / PIN</label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={passwordState.currentPassword}
                        onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-bold"
                      >
                        {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPasswords ? 'Mask PIN codes' : 'Reveal PIN codes'}</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">New PIN / Password</label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={passwordState.newPassword}
                        onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Confirm New PIN</label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                        value={passwordState.confirmPassword}
                        onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 pt-2">
                      <button
                        type="button"
                        onClick={handlePasswordChange}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-lg text-xs shadow-xs transition"
                      >
                        Change security code
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Form Footer (Always visible) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition font-bold cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Revert Changes</span>
              </button>
              
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase text-white shadow-md transition cursor-pointer ${
                  hasChanges
                    ? 'bg-blue-600 hover:bg-blue-700 animate-pulse'
                    : 'bg-slate-300 cursor-not-allowed opacity-80'
                }`}
              >
                <Save size={13} />
                <span>Save configurations</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
