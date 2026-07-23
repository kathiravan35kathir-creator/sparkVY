import {
  Party,
  Item,
  Quotation,
  Invoice,
  Purchase,
  Payment,
  Expense,
  StockMovement,
  CashBankAccount,
  AppNotification,
  AuditLog,
  AppSettings,
  User,
  CommunicationLog,
  ProcurementOrder,
  ProformaInvoice,
  SalesReturn,
  CreditNote,
  Sample,
  PartyAdjustment
} from './types';

export interface AppState {
  users: User[];
  currentUser: User;
  parties: Party[];
  items: Item[];
  quotations: Quotation[];
  invoices: Invoice[];
  purchases: Purchase[];
  procurementOrders: ProcurementOrder[];
  proformaInvoices: ProformaInvoice[];
  salesReturns: SalesReturn[];
  creditNotes: CreditNote[];
  payments: Payment[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  accounts: CashBankAccount[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  communicationLogs: CommunicationLog[];
  samples: Sample[];
  settings: AppSettings;
  adjustments: PartyAdjustment[];
}

const DEFAULT_SETTINGS: AppSettings = {
  company: {
    companyName: 'BizOps Enterprise Pvt Ltd',
    legalName: 'BizOps Enterprise Private Limited',
    displayCompanyName: 'BizOps Enterprise',
    businessType: 'Private Limited Company',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&fit=crop&q=80', // elegant business logo preview
    secondaryLogoUrl: '',
    address: 'Building 4B, Electronic City Phase 1, Bangalore, Karnataka - 560100',
    address1: 'Building 4B, Electronic City Phase 1',
    address2: 'Electronic City Phase 1',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    state: 'Karnataka',
    postalCode: '560100',
    country: 'India',
    primaryPhone: '+91 80 4912 3000',
    alternatePhone: '+91 80 4912 3001',
    email: 'ops@bizops.in',
    gstNumber: '29AAAAA1111A1Z1',
    pan: 'AAAAA1111A',
    cin: 'U72200KA2026PTC192834',
    registrationDate: '2026-04-01',
    website: 'https://bizops.in',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    description: 'Premier enterprise ERP providing billing, inventory, and financial management services.',
    footerText: 'Thank you for your business. This is a computer-generated document requiring no physical signature.'
  },
  invoice: {
    prefix: 'INV-2026-',
    numberFormat: '0000',
    defaultTaxRate: 18,
    terms: '1. Payment is due within 15 days of invoice date.\n2. Interest of 1.5% per month will be charged on overdue payments.\n3. Goods once sold cannot be returned.',
    footer: 'Thank you for choosing our business. For billing enquiries, please email finance@yourcompany.com.',
    signatureText: 'Authorized Signatory',
    isItemCodeVisible: true,
    isDescriptionVisible: true
  },
  quotation: {
    prefix: 'QT-2026-',
    validityDays: 30,
    terms: '1. Quotation valid for 30 days.\n2. 50% advance required for order processing.',
    isValidityVisible: true
  },
  purchase: {
    prefix: 'PUR-2026-',
    terms: '1. Subject to physical inspection upon arrival.\n2. Damaged goods will be rejected.',
    footer: 'Authorized Purchase Manager',
    showSupplierGst: true,
    showBatchExpiry: true
  },
  receipt: {
    prefix: 'REC-2026-',
    footer: 'Thank you for your payment.',
    showAllocation: true,
    showPrevBalance: true
  },
  notification: {
    emailPreferences: true,
    inAppPreferences: true,
    reminderDaysBeforeDue: 3
  },
  security: {
    transactionPinHash: '',
    failedAttempts: 0,
    protectedActions: ['delete_transaction', 'cancel_invoice', 'edit_locked_invoice', 'issue_credit_note', 'record_refund', 'payment_out']
  },
  whatsappSettings: {
    alternateNumberVerification: true,
    requirePinForShare: true,
    saveAlternateNumberOption: false
  },
  quotationTypes: [
    { id: 'standard', enabled: true, name: 'Standard Quotation', prefix: 'QT/', startingNumber: 1, defaultValidityDays: 30, defaultTerms: 'Standard validity 30 days.', allowTax: true, allowDiscount: true },
    { id: 'commercial', enabled: true, name: 'Commercial Quotation', prefix: 'CQ/', startingNumber: 1, defaultValidityDays: 45, defaultTerms: 'Commercial proposal valid for 45 days.', allowTax: true, allowDiscount: true },
    { id: 'laboratory', enabled: true, name: 'Laboratory Estimate', prefix: 'LAB-QT/', startingNumber: 1, defaultValidityDays: 15, defaultTerms: 'Lab estimate valid for 15 days.', allowTax: true, allowDiscount: true }
  ],
  system: {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    currencyFormat: 'INR',
    paginationSize: 10,
    allowNegativeStock: false,
    financialYearStartMonth: 'April',
    defaultBranchName: 'Main Operations Center',
    firstDayOfWeek: 'Monday',
    currencySymbol: '₹',
    currencyPosition: 'Prefix',
    decimalPlaces: 2,
    quantityDecimalPlaces: 0,
    numberGroupingFormat: 'Indian',
    language: 'English',
    appStartPage: 'dashboard',
    sidebarDefaultState: 'expanded',
    compactTableMode: false,
    showHelpText: true
  },
  tax: {
    enableGst: true,
    gstRegistrationType: 'Registered',
    gstNumber: '29AAAAA1111A1Z1',
    placeOfSupply: 'Karnataka (29)',
    defaultGstRate: 18,
    taxPricingMode: 'Exclusive',
    enableCgstSgst: true,
    enableIgst: false,
    enableCess: false,
    showHsnSac: true,
    showTaxBreakup: true,
    taxRoundingMethod: 'Round Normal',
    defaultTaxProducts: 18,
    defaultTaxServices: 18,
    reverseChargeOption: false,
    taxInvoiceLabel: 'TAX INVOICE',
    nonGstInvoiceLabel: 'RETAIL INVOICE'
  },
  bank: {
    bankName: 'HDFC Bank Ltd',
    accountHolderName: 'BIZOPS ENTERPRISE PVT LTD',
    accountNumber: '50200049123849',
    ifsc: 'HDFC0000140',
    branch: 'Electronic City, Bangalore',
    accountType: 'Current Account',
    upiId: 'bizops@hdfcbank',
    upiDisplayName: 'BizOps Operations',
    qrCodeUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=120&fit=crop&q=80', // generic placeholder representing QR
    defaultCashAccount: 'acc-1',
    defaultBankAccount: 'acc-2',
    defaultPaymentMethod: 'UPI',
    showBankDetailsOnInvoice: true,
    showUpiOnInvoice: true,
    showQrCodeOnInvoice: true,
    paymentInstructions: 'Please quote the Invoice Number during NEFT transfer. Send payment screenshot to accounts@bizops.in.',
    receiptFooter: 'This is an official receipt of payment.'
  },
  numbering: {
    quotation: { prefix: 'QT/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    estimateQuotation: { prefix: 'EST/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    invoice: { prefix: 'INV/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    purchase: { prefix: 'PUR/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    receipt: { prefix: 'REC/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    expense: { prefix: 'EXP/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: false, includeMonth: false, includeBranchCode: false, resetByFinancialYear: false },
    procurementOrder: { prefix: 'PO/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    proformaInvoice: { prefix: 'PI/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    salesReturn: { prefix: 'SR/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    creditNote: { prefix: 'CN/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    paymentReceipt: { prefix: 'REC/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    paymentVoucher: { prefix: 'PAY/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    creditNoteNumber: { prefix: 'CN/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    debitNote: { prefix: 'DN/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    stockAdjustment: { prefix: 'ADJ/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: false, includeMonth: false, includeBranchCode: false, resetByFinancialYear: false }
  },
  print: {
    invoiceTemplate: 'tally_modern',
    quotationTemplate: 'corporate_blue',
    receiptTemplate: 'receipt_pro',
    purchaseTemplate: 'tally_classic',
    primaryColor: '#2563EB',
    secondaryColor: '#1E293B',
    fontFamily: 'Inter',
    fontSizeScale: 'medium',
    logoPosition: 'left',
    logoSize: 'medium',
    headerAlignment: 'left',
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showGst: true,
    showHsnSac: true,
    showTaxColumns: true,
    showDiscount: true,
    showPreviousBalance: true,
    showBankDetails: true,
    showUpi: true,
    showQrPayment: true,
    showSignature: true,
    showTerms: true,
    showNotes: true,
    showFooter: true,
    footerText: 'Thank you for your business!',
    paperSize: 'A4',
    pageOrientation: 'Portrait',
    pageMargins: 'normal',
    tableDensity: 'normal',
    printCopyLabels: ['Original for Buyer', 'Duplicate for Transporter']
  },
  communication: {
    whatsapp: {
      enableBusinessApi: false,
      accessToken: '',
      permanentAccessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookVerifyToken: '',
      webhookSecret: '',
      defaultSenderName: 'BizOps ERP',
      apiVersion: 'v18.0'
    }
  }
};

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'superadmin', name: 'BizOps Admin', email: 'admin@bizops.in', isAdmin: true, isActive: true },
  { id: 'u2', username: 'manager', name: 'Sarah Jenkins', email: 'sarah@bizops.in', isAdmin: true, isActive: true },
  { id: 'u3', username: 'receptionist', name: 'John Doe', email: 'john@bizops.in', isAdmin: false, isActive: true },
  { id: 'u4', username: 'sales', name: 'Alan Turing', email: 'alan@bizops.in', isAdmin: false, isActive: true },
  { id: 'u5', username: 'analyst', name: 'Marie Curie', email: 'marie@bizops.in', isAdmin: false, isActive: true },
  { id: 'u6', username: 'supervisor', name: 'Richard Feynman', email: 'richard@bizops.in', isAdmin: false, isActive: true },
  { id: 'u7', username: 'accountant', name: 'Warren Buffett', email: 'warren@bizops.in', isAdmin: false, isActive: true },
  { id: 'u8', username: 'inventory', name: 'Steve Jobs', email: 'steve@bizops.in', isAdmin: false, isActive: true }
];

export function getInitialState(): AppState {
  return {
    users: DEFAULT_USERS,
    currentUser: DEFAULT_USERS[0], // starts as Super Admin
    parties: [],
    items: [],
    quotations: [],
    invoices: [],
    purchases: [],
    procurementOrders: [],
    proformaInvoices: [],
    salesReturns: [],
    creditNotes: [],
    payments: [],
    expenses: [],
    stockMovements: [],
    accounts: [
      { id: 'acc-1', name: 'Petty Cash', type: 'Petty Cash', openingBalance: 15000, currentBalance: 15000 },
      { id: 'acc-2', name: 'Bank Account', type: 'Bank', openingBalance: 450000, currentBalance: 450000 },
      { id: 'acc-3', name: 'UPI/Wallet', type: 'UPI', openingBalance: 80000, currentBalance: 80000 }
    ],
    notifications: [
      {
        id: 'n-1',
        title: 'Welcome',
        message: 'Your business management database has been initialized successfully.',
        type: 'success',
        isRead: false,
        timestamp: '2026-07-14T09:00:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'a-1',
        user: 'BizOps Admin',
        role: 'Super Admin',
        action: 'System Initialized',
        module: 'System',
        recordId: 'system',
        recordName: 'ERP App',
        timestamp: '2026-07-14T09:00:00Z',
        ipAddress: '127.0.0.1'
      }
    ],
    communicationLogs: [],
    samples: [],
    settings: DEFAULT_SETTINGS,
    adjustments: []
  };
}

export function saveState(state: AppState, uid?: string) {
  const key = uid ? `bizops_state_${uid}` : 'bizops_state';
  localStorage.setItem(key, JSON.stringify(state));
}

export function loadState(uid?: string): AppState {
  const key = uid ? `bizops_state_${uid}` : 'bizops_state';
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Ensure key arrays exist
      if (!parsed.currentUser) parsed.currentUser = DEFAULT_USERS[0];
      if (!parsed.users) parsed.users = DEFAULT_USERS;
      if (!parsed.samples) parsed.samples = [];
      if (!parsed.parties) parsed.parties = [];
      if (!parsed.items) parsed.items = [];
      if (!parsed.quotations) parsed.quotations = [];
      if (!parsed.invoices) parsed.invoices = [];
      if (!parsed.purchases) parsed.purchases = [];
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.payments) parsed.payments = [];
      if (!parsed.proformaInvoices) parsed.proformaInvoices = [];
      if (!parsed.procurementOrders) parsed.procurementOrders = [];
      if (!parsed.salesReturns) parsed.salesReturns = [];
      if (!parsed.creditNotes) parsed.creditNotes = [];
      if (!parsed.stockMovements) parsed.stockMovements = [];
      if (!parsed.notifications) parsed.notifications = [];
      if (!parsed.auditLogs) parsed.auditLogs = [];
      if (!parsed.communicationLogs) parsed.communicationLogs = [];
      
      // Ensure all settings blocks exist by merging with DEFAULT_SETTINGS
      if (!parsed.settings) {
        parsed.settings = DEFAULT_SETTINGS;
      } else {
        parsed.settings = {
          company: { ...DEFAULT_SETTINGS.company, ...parsed.settings.company },
          invoice: { ...DEFAULT_SETTINGS.invoice, ...parsed.settings.invoice },
          quotation: { ...DEFAULT_SETTINGS.quotation, ...parsed.settings.quotation },
          purchase: { ...DEFAULT_SETTINGS.purchase, ...parsed.settings.purchase },
          receipt: { ...DEFAULT_SETTINGS.receipt, ...parsed.settings.receipt },
          notification: { ...DEFAULT_SETTINGS.notification, ...parsed.settings.notification },
          security: { ...DEFAULT_SETTINGS.security, ...parsed.settings.security },
          whatsappSettings: { ...DEFAULT_SETTINGS.whatsappSettings, ...parsed.settings.whatsappSettings },
          quotationTypes: parsed.settings.quotationTypes || DEFAULT_SETTINGS.quotationTypes,
          system: { ...DEFAULT_SETTINGS.system, ...parsed.settings.system },
          tax: { ...DEFAULT_SETTINGS.tax, ...parsed.settings.tax },
          bank: { ...DEFAULT_SETTINGS.bank, ...parsed.settings.bank },
          numbering: { ...DEFAULT_SETTINGS.numbering, ...parsed.settings.numbering },
          print: { ...DEFAULT_SETTINGS.print, ...parsed.settings.print },
        };
      }
      return parsed;
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  }
  const initialState = getInitialState();
  saveState(initialState);
  return initialState;
}

export function logAudit(
  state: AppState,
  action: string,
  module: string,
  recordId: string,
  recordName: string,
  oldValues?: any,
  newValues?: any
): AppState {
  const newLog: AuditLog = {
    id: `audit-${Date.now()}`,
    user: state.currentUser.name,
    role: state.currentUser.isAdmin ? 'Admin' : 'Staff',
    action,
    module,
    recordId,
    recordName,
    oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
    newValues: newValues ? JSON.stringify(newValues) : undefined,
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.104'
  };

  const newLogs = [newLog, ...state.auditLogs].slice(0, 500); // limit to 500 logs for client memory
  return { ...state, auditLogs: newLogs };
}

export function notify(
  state: AppState,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'danger',
  relatedLink?: { module: string; recordId: string }
): AppState {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type,
    isRead: false,
    relatedLink,
    timestamp: new Date().toISOString()
  };

  const newNotifications = [newNotif, ...state.notifications];
  return { ...state, notifications: newNotifications };
}

// Extensive seed data loaded when clicking "Load Demo Data"
export function getDemoData(state: AppState): AppState {
  // 1. Demo Parties
  const demoParties: Party[] = [
    {
      id: 'pt-1',
      code: 'PT-001',
      name: 'AquaPure Bottlers India',
      displayName: 'AquaPure Bottlers',
      companyName: 'AquaPure Bottling & Beverages Ltd',
      type: 'Customer',
      contactPerson: 'Mr. Rajesh Kumar',
      phone: '9845012345',
      email: 'quality@aquapure.co.in',
      gstRegistration: 'Registered',
      gstNumber: '29AAACA4912J1Z3',
      pan: 'AAACA4912J',
      businessType: 'Beverage Manufacturing',
      openingBalance: 12000,
      balanceType: 'Receivable',
      currentBalance: 12000,
      creditLimit: 100000,
      billingAddress: 'Plot 42-C, Bidadi Industrial Area, Ramanagara, Karnataka - 562109',
      isActive: true,
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z'
    },
    {
      id: 'pt-2',
      code: 'PT-002',
      name: 'GreenEarth Organics Farmer Co-op',
      displayName: 'GreenEarth Organics',
      companyName: 'GreenEarth Organics Co-operative Society',
      type: 'Customer',
      contactPerson: 'Mrs. Savitha Hegde',
      phone: '9740281234',
      email: 'testing@greenearthorganics.org',
      gstRegistration: 'Unregistered',
      pan: 'BBBBB1122C',
      businessType: 'Agriculture & Agroproducts',
      openingBalance: 0,
      balanceType: 'Receivable',
      currentBalance: 0,
      creditLimit: 30000,
      billingAddress: 'No. 15, APMC Yard, Hassan, Karnataka - 573201',
      isActive: true,
      createdAt: '2026-06-15T11:00:00Z',
      updatedAt: '2026-06-15T11:00:00Z'
    },
    {
      id: 'pt-3',
      code: 'PT-003',
      name: 'Sigma-Aldrich Chemical Distributors',
      displayName: 'Sigma Chemicals',
      companyName: 'Sigma Chemicals & Reagents Distributors',
      type: 'Supplier',
      contactPerson: 'Dr. Vivek Sharma',
      phone: '080-2591000',
      email: 'orders@sigmachem.co.in',
      gstRegistration: 'Registered',
      gstNumber: '29AAABS2910M1ZP',
      pan: 'AAABS2910M',
      businessType: 'Chemical Wholesaler',
      openingBalance: 45000,
      balanceType: 'Payable',
      currentBalance: 45000,
      billingAddress: 'Sigma Tech Park, Whitefield, Bangalore, Karnataka - 560066',
      isActive: true,
      createdAt: '2026-05-20T14:00:00Z',
      updatedAt: '2026-05-20T14:00:00Z'
    }
  ];

  // 2. Demo Items (Products)
  const demoItems: Item[] = [
    {
      id: 'prod-1',
      code: 'PRD-101',
      name: 'Executive Office Chair',
      category: 'Furniture',
      type: 'Product',
      unit: 'Piece (PCS)',
      purchasePrice: 4500,
      sellingPrice: 8500,
      taxRate: 18,
      openingStock: 15,
      currentStock: 15,
      minimumStock: 5,
      storageLocation: 'Warehouse A-1',
      batchTracking: false,
      expiryTracking: false,
      isActive: true,
      description: 'Ergonomic high-back office chair with lumbar support.'
    },
    {
      id: 'prod-2',
      code: 'PRD-102',
      name: 'Dell UltraSharp 27 Monitor',
      category: 'Electronics',
      type: 'Product',
      unit: 'Piece (PCS)',
      purchasePrice: 22000,
      sellingPrice: 35000,
      taxRate: 18,
      openingStock: 8,
      currentStock: 8,
      minimumStock: 2,
      storageLocation: 'Tech Shelf C',
      batchTracking: true,
      expiryTracking: false,
      isActive: true,
      description: '4K resolution professional color-accurate monitor.'
    }
  ];

  // 3. Demo Quotation
  const demoQuotations: Quotation[] = [
    {
      id: 'qt-1',
      stage: 'Final',
      quotationNumber: 'QT-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      quotationDate: '2026-07-01',
      expiryDate: '2026-07-31',
      items: [
        {
          id: 'qti-1',
          itemId: 'prod-1',
          itemName: 'Executive Office Chair',
          itemCode: 'PRD-101',
          quantity: 2,
          rate: 8500,
          discountPercent: 5,
          taxPercent: 18,
          taxAmount: 2907,
          amount: 19057
        }
      ],
      subtotal: 17000,
      discountAmount: 850,
      taxAmount: 2907,
      additionalCharges: 500,
      total: 19557,
      status: 'Accepted',
      advanceRequirement: 5000,
      notes: 'Delivery expected within 3 business days.',
      termsAndConditions: '1. Full payment upon delivery.',
      createdAt: '2026-07-01T10:30:00Z'
    }
  ];

  // 4. Demo Invoices
  const demoInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      invoiceDate: '2026-07-12',
      dueDate: '2026-07-27',
      relatedQuotationId: 'qt-1',
      relatedQuotationNumber: 'QT-2026-0001',
      items: [
        {
          id: 'invi-1',
          itemId: 'prod-1',
          itemName: 'Executive Office Chair',
          itemCode: 'PRD-101',
          quantity: 1,
          rate: 8500,
          discountPercent: 0,
          taxPercent: 18,
          taxAmount: 1530,
          amount: 10030
        }
      ],
      subtotal: 8500,
      discountAmount: 0,
      taxAmount: 1530,
      additionalCharges: 100,
      roundOff: 0,
      total: 10130,
      amountPaid: 5000,
      balanceDue: 5130,
      status: 'Partially Paid',
      notes: 'Advance Rs 5000 received. Balance payable on delivery.',
      isLocked: true,
      createdAt: '2026-07-12T12:00:00Z',
      updatedAt: '2026-07-12T12:00:00Z'
    }
  ];

  // 5. Demo Purchases
  const demoPurchases: Purchase[] = [
    {
      id: 'pur-1',
      purchaseNumber: 'PUR-2026-0001',
      partyId: 'pt-3',
      partyName: 'Sigma-Aldrich Chemical Distributors',
      supplierInvoiceNumber: 'SIG-98492-A',
      purchaseDate: '2026-07-05',
      dueDate: '2026-08-05',
      items: [
        {
          id: 'puri-1',
          itemId: 'prod-2',
          itemName: 'Dell UltraSharp 27 Monitor',
          quantity: 5,
          rate: 22000,
          taxPercent: 18,
          taxAmount: 19800,
          amount: 129800,
          batchNumber: 'SER-DELL-992',
          mfgDate: '2026-03-01',
          expiryDate: ''
        }
      ],
      subtotal: 110000,
      taxAmount: 19800,
      discountAmount: 5000,
      total: 124800,
      amountPaid: 124800,
      balanceDue: 0,
      paymentStatus: 'Paid',
      storageLocation: 'IT Storage Room',
      notes: 'Items received in good condition.',
      createdAt: '2026-07-05T15:00:00Z'
    }
  ];

  // 6. Demo Payments (Payment In & Payment Out)
  const demoPayments: Payment[] = [
    {
      id: 'pay-1',
      paymentNumber: 'PAY-IN-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      paymentType: 'Payment In',
      amount: 1000,
      paymentDate: '2026-07-12',
      paymentMethod: 'UPI',
      accountId: 'acc-3',
      accountName: 'UPI HDFC Merchant QR',
      referenceNumber: 'UPI-61942059124',
      notes: 'Partial advance for order.',
      allocations: [
        { invoiceId: 'inv-1', allocatedAmount: 1000 }
      ],
      createdAt: '2026-07-12T12:05:00Z'
    },
    {
      id: 'pay-2',
      paymentNumber: 'PAY-OUT-2026-0001',
      partyId: 'pt-3',
      partyName: 'Sigma-Aldrich Chemical Distributors',
      paymentType: 'Payment Out',
      amount: 23780,
      paymentDate: '2026-07-05',
      paymentMethod: 'Bank transfer',
      accountId: 'acc-2',
      accountName: 'ICICI Bank Current Account',
      referenceNumber: 'NEFT-ICICI-8491295',
      notes: 'Full payment for Nitric Acid and Silver Nitrate Chemicals.',
      allocations: [
        { purchaseId: 'pur-1', allocatedAmount: 23780 }
      ],
      createdAt: '2026-07-05T15:30:00Z'
    }
  ];

  // 7. Demo Expenses
  const demoExpenses: Expense[] = [
    {
      id: 'exp-1',
      expenseNumber: 'EXP-2026-0001',
      category: 'Electricity',
      expenseDate: '2026-07-04',
      vendorName: 'BESCOM Karnataka',
      amount: 8500,
      taxAmount: 0,
      paymentMethod: 'Bank transfer',
      accountId: 'acc-2',
      accountName: 'ICICI Bank Current Account',
      description: 'Electricity bill for Main Space (June 2026)',
      isRecurring: true,
      createdAt: '2026-07-04T10:00:00Z'
    }
  ];

  // 8. Demo Stock Movements
  const demoStockMovements: StockMovement[] = [
    {
      id: 'mov-1',
      itemId: 'chem-1',
      itemName: 'Concentrated Nitric Acid 69%',
      type: 'Purchase In',
      quantity: 5,
      batchNumber: 'BCH-NIT-992',
      expiryDate: '2028-03-01',
      referenceId: 'pur-1',
      referenceNumber: 'PUR-2026-0001',
      user: 'Steve Jobs',
      notes: 'Added from purchase receipt.',
      timestamp: '2026-07-05T15:00:00Z'
    },
    {
      id: 'mov-2',
      itemId: 'chem-2',
      itemName: 'Silver Nitrate Powder (Analytical Grade)',
      type: 'Purchase In',
      quantity: 100,
      batchNumber: 'BCH-SLV-01',
      expiryDate: '2029-05-10',
      referenceId: 'pur-1',
      referenceNumber: 'PUR-2026-0001',
      user: 'Steve Jobs',
      notes: 'Added from purchase receipt.',
      timestamp: '2026-07-05T15:00:00Z'
    }
  ];

  // 9. Audit logs for seed data actions
  const demoAuditLogs: AuditLog[] = [
    { id: 'al-1', user: 'Steve Jobs', role: 'Inventory Staff', action: 'Purchase Registered & Stocks Credited', module: 'Purchases', recordId: 'pur-1', recordName: 'PUR-2026-0001', timestamp: '2026-07-05T15:01:00Z' },
    { id: 'al-2', user: 'John Doe', role: 'Receptionist', action: 'Quotation Accepted by Client', module: 'Quotations', recordId: 'qt-1', recordName: 'QT-2026-0001', timestamp: '2026-07-01T12:00:00Z' }
  ];

  // 10. Initial Notifications
  const demoNotifications: AppNotification[] = [
    { id: 'dn-1', title: 'Low Stock Alert', message: 'Item "Concentrated Nitric Acid 69%" is near minimum stock level.', type: 'warning', isRead: false, timestamp: '2026-07-14T16:00:00Z' },
    { id: 'dn-3', title: 'Payment In Registered', message: 'Received Rs 1000 from AquaPure Bottlers India.', type: 'success', isRead: true, timestamp: '2026-07-12T12:05:00Z' }
  ];

  // Calculate account balances from payments, expenses, etc.
  let cashBalance = 15000;
  let bankBalance = 450000;
  let upiBalance = 80000;

  // Apply transformations
  return {
    ...state,
    parties: demoParties,
    items: demoItems,
    quotations: demoQuotations,
    invoices: demoInvoices,
    purchases: demoPurchases,
    payments: demoPayments,
    expenses: demoExpenses,
    stockMovements: demoStockMovements,
    adjustments: [],
    auditLogs: [...demoAuditLogs, ...state.auditLogs],
    notifications: [...demoNotifications, ...state.notifications],
    accounts: state.accounts.map(acc => {
      if (acc.id === 'acc-1') return { ...acc, currentBalance: cashBalance };
      if (acc.id === 'acc-2') return { ...acc, currentBalance: bankBalance };
      if (acc.id === 'acc-3') return { ...acc, currentBalance: upiBalance };
      return acc;
    })
  };
}
