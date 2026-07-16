import {
  Party,
  Item,
  Quotation,
  Invoice,
  Purchase,
  Payment,
  Expense,
  Sample,
  TestAssignment,
  LabReport,
  StockMovement,
  Equipment,
  CashBankAccount,
  AppNotification,
  AuditLog,
  AppSettings,
  User
} from './types';

export interface AppState {
  users: User[];
  currentUser: User;
  parties: Party[];
  items: Item[];
  quotations: Quotation[];
  invoices: Invoice[];
  purchases: Purchase[];
  payments: Payment[];
  expenses: Expense[];
  samples: Sample[];
  testAssignments: TestAssignment[];
  labReports: LabReport[];
  stockMovements: StockMovement[];
  equipment: Equipment[];
  accounts: CashBankAccount[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  company: {
    labName: 'LabBiz Operations Pvt Ltd',
    legalName: 'LabBiz Operations Private Limited',
    displayLabName: 'LabBiz Operations',
    businessType: 'Private Limited Company',
    logoUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=80&fit=crop&q=80', // elegant medical logo preview
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
    email: 'operations@labbiz.in',
    gstNumber: '29AAAAA1111A1Z1',
    pan: 'AAAAA1111A',
    cin: 'U72200KA2026PTC192834',
    registrationDate: '2026-04-01',
    website: 'https://labbiz.in',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    description: 'NABL Accredited Chemical & Biological Analytical Testing Laboratory providing premier research, clinical, and industrial validation services.',
    footerText: 'Thank you for your business. This is a computer-generated document requiring no physical signature.'
  },
  invoice: {
    prefix: 'INV-2026-',
    numberFormat: '0000',
    defaultTaxRate: 18,
    terms: '1. Payment is due within 15 days of invoice date.\n2. Interest of 1.5% per month will be charged on overdue payments.\n3. Goods once sold cannot be returned.',
    footer: 'Thank you for choosing LabBiz. For billing enquiries, please email finance@labbiz.in.',
    signatureText: 'Authorized Signatory',
    isItemCodeVisible: true,
    isDescriptionVisible: true
  },
  quotation: {
    prefix: 'QT-2026-',
    validityDays: 30,
    terms: '1. Quotation valid for 30 days.\n2. 50% advance required for sample processing.',
    isValidityVisible: true
  },
  purchase: {
    prefix: 'PUR-2026-',
    terms: '1. Subject to physical inspection upon arrival.\n2. Damaged reagents will be rejected.',
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
  sample: {
    prefix: 'SMP-2026-',
    defaultTurnaroundTimeDays: 7,
    barcodePreference: 'QR Code',
    labelSize: '50mm x 25mm',
    labelCopies: 1
  },
  report: {
    prefix: 'REP-2026-',
    header: 'LABBIZ RESEARCH & ANALYTICAL LABORATORY\nAccredited by NABL (ISO/IEC 17025)',
    footer: 'End of Laboratory Test Report. Verified via secure digital signature and QR verification.',
    disclaimer: 'This test report refers only to the specific sample submitted. Reproduction of part of this report without written permission is prohibited.',
    signatureText: 'Chief Scientific Officer / Lab Director',
    accreditationText: 'NABL Certificate No: TC-8492',
    showLabLogo: true,
    showAccreditation: true,
    showCustomerDetails: true,
    showSampleDetails: true,
    showTestMethod: true,
    showReferenceRange: true,
    showInterpretation: true,
    showConclusion: true,
    showDisclaimer: true,
    showQrVerification: true
  },
  notification: {
    emailPreferences: true,
    inAppPreferences: true,
    reminderDaysBeforeDue: 3
  },
  system: {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    currencyFormat: 'INR',
    paginationSize: 10,
    allowNegativeStock: false,
    financialYearStartMonth: 'April',
    defaultBranchName: 'Main Laboratory Center',
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
    accountHolderName: 'LABBIZ OPERATIONS PVT LTD',
    accountNumber: '50200049123849',
    ifsc: 'HDFC0000140',
    branch: 'Electronic City, Bangalore',
    accountType: 'Current Account',
    upiId: 'labbiz@hdfcbank',
    upiDisplayName: 'LabBiz Operations',
    qrCodeUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=120&fit=crop&q=80', // generic placeholder representing QR
    defaultCashAccount: 'acc-1',
    defaultBankAccount: 'acc-2',
    defaultPaymentMethod: 'UPI',
    showBankDetailsOnInvoice: true,
    showUpiOnInvoice: true,
    showQrCodeOnInvoice: true,
    paymentInstructions: 'Please quote the Invoice Number during NEFT transfer. Send payment screenshot to accounts@labbiz.in.',
    receiptFooter: 'This is an official receipt of payment.'
  },
  numbering: {
    quotation: { prefix: 'QT/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    invoice: { prefix: 'INV/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    purchase: { prefix: 'PUR/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    receipt: { prefix: 'REC/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    expense: { prefix: 'EXP/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: false, includeMonth: false, includeBranchCode: false, resetByFinancialYear: false },
    sample: { prefix: 'SMP/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    labTest: { prefix: 'TST/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: false, includeMonth: false, includeBranchCode: false, resetByFinancialYear: false },
    labReport: { prefix: 'REP/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    creditNote: { prefix: 'CN/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    debitNote: { prefix: 'DN/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: true, includeMonth: false, includeBranchCode: false, resetByFinancialYear: true },
    stockAdjustment: { prefix: 'ADJ/', startingNumber: 1, currentNumber: 1, minDigitLength: 5, separator: '', includeFinancialYear: false, includeMonth: false, includeBranchCode: false, resetByFinancialYear: false }
  },
  print: {
    invoiceTemplate: 'tally_modern',
    quotationTemplate: 'corporate_blue',
    receiptTemplate: 'receipt_pro',
    purchaseTemplate: 'tally_classic',
    labReportTemplate: 'premium_lab',
    sampleLabelTemplate: 'sample_label',
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
  }
};

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'superadmin', name: 'Dr. Dev Anand', email: 'dev@labbiz.in', isAdmin: true, isActive: true },
  { id: 'u2', username: 'manager', name: 'Sarah Jenkins', email: 'sarah@labbiz.in', isAdmin: true, isActive: true },
  { id: 'u3', username: 'receptionist', name: 'John Doe', email: 'john@labbiz.in', isAdmin: false, isActive: true },
  { id: 'u4', username: 'technician', name: 'Alan Turing', email: 'alan@labbiz.in', isAdmin: false, isActive: true },
  { id: 'u5', username: 'researcher', name: 'Marie Curie', email: 'marie@labbiz.in', isAdmin: false, isActive: true },
  { id: 'u6', username: 'reviewer', name: 'Richard Feynman', email: 'richard@labbiz.in', isAdmin: false, isActive: true },
  { id: 'u7', username: 'accountant', name: 'Warren Buffett', email: 'warren@labbiz.in', isAdmin: false, isActive: true },
  { id: 'u8', username: 'inventory', name: 'Steve Jobs', email: 'steve@labbiz.in', isAdmin: false, isActive: true }
];

export function getInitialState(): AppState {
  return {
    users: DEFAULT_USERS,
    currentUser: DEFAULT_USERS[0], // starts as Super Admin
    parties: [],
    items: [
      // Standard services & general categories by default
      {
        id: 'srv-1',
        code: 'SRV-001',
        name: 'Water Potability Microbiological Test',
        category: 'Water Testing',
        type: 'Laboratory Service',
        unit: 'Sample',
        purchasePrice: 0,
        sellingPrice: 1500,
        taxRate: 18,
        openingStock: 0,
        currentStock: 0,
        minimumStock: 0,
        isActive: true,
        testMethod: 'IS 10500:2012',
        standardMethod: 'Membrane Filtration',
        sampleType: 'Drinking Water',
        requiredQuantity: '500 ml',
        turnaroundTimeDays: 3,
        resultUnit: 'CFU/100ml',
        referenceRange: 'E.coli: Absent, Total Coliforms: Absent',
        batchTracking: false,
        expiryTracking: false,
        instructions: 'Collect in sterile sodium thiosulfate bottle and keep refrigerated.'
      },
      {
        id: 'srv-2',
        code: 'SRV-002',
        name: 'Soil Nitrogen & Nutrient Profiling',
        category: 'Agricultural Analysis',
        type: 'Laboratory Service',
        unit: 'Sample',
        purchasePrice: 0,
        sellingPrice: 2500,
        taxRate: 18,
        openingStock: 0,
        currentStock: 0,
        minimumStock: 0,
        isActive: true,
        testMethod: 'AOAC 973.48',
        standardMethod: 'Kjeldahl Method',
        sampleType: 'Soil / Compost',
        requiredQuantity: '200 g',
        turnaroundTimeDays: 5,
        resultUnit: 'mg/kg',
        referenceRange: 'Available Nitrogen: 280 - 560 mg/kg',
        batchTracking: false,
        expiryTracking: false,
        instructions: 'Air-dry the soil, sieve through 2mm screen prior to dispatch.'
      }
    ],
    quotations: [],
    invoices: [],
    purchases: [],
    payments: [],
    expenses: [],
    samples: [],
    testAssignments: [],
    labReports: [],
    stockMovements: [],
    equipment: [
      {
        id: 'eq-1',
        equipmentCode: 'EQ-01',
        name: 'Sartorius Digital PH Meter',
        category: 'Electrochemistry',
        manufacturer: 'Sartorius',
        model: 'PH-320',
        serialNumber: 'SR-9412-PH',
        purchaseDate: '2025-01-10',
        purchaseCost: 45000,
        location: 'Biochemistry Bench A',
        condition: 'Good',
        status: 'Available',
        lastCalibrationDate: '2026-06-15',
        nextCalibrationDate: '2026-12-15',
        lastMaintenanceDate: '2026-05-10',
        nextMaintenanceDate: '2026-11-10'
      },
      {
        id: 'eq-2',
        equipmentCode: 'EQ-02',
        name: 'Thermo Scientific Spectrophotometer',
        category: 'Spectroscopy',
        manufacturer: 'Thermo Scientific',
        model: 'Genesys 150',
        serialNumber: 'TH-5021-SP',
        purchaseDate: '2024-03-20',
        purchaseCost: 320000,
        location: 'Analytical Lab Room 2',
        condition: 'Excellent',
        status: 'Available',
        lastCalibrationDate: '2026-04-10',
        nextCalibrationDate: '2026-10-10',
        lastMaintenanceDate: '2026-03-12',
        nextMaintenanceDate: '2026-09-12'
      }
    ],
    accounts: [
      { id: 'acc-1', name: 'Lab Business Petty Cash', type: 'Petty Cash', openingBalance: 15000, currentBalance: 15000 },
      { id: 'acc-2', name: 'ICICI Bank Current Account', type: 'Bank', openingBalance: 450000, currentBalance: 450000 },
      { id: 'acc-3', name: 'UPI HDFC Merchant QR', type: 'UPI', openingBalance: 80000, currentBalance: 80000 }
    ],
    notifications: [
      {
        id: 'n-1',
        title: 'Welcome to LabBiz',
        message: 'Your lab management, billing, and inventory database has been initialized successfully.',
        type: 'success',
        isRead: false,
        timestamp: '2026-07-14T09:00:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'a-1',
        user: 'Dr. Dev Anand',
        role: 'Super Admin',
        action: 'System Initialized',
        module: 'System',
        recordId: 'system',
        recordName: 'LabBiz App',
        timestamp: '2026-07-14T09:00:00Z',
        ipAddress: '127.0.0.1'
      }
    ],
    settings: DEFAULT_SETTINGS
  };
}

export function saveState(state: AppState) {
  localStorage.setItem('labbiz_state', JSON.stringify(state));
}

export function loadState(): AppState {
  const data = localStorage.getItem('labbiz_state');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Ensure key arrays exist
      if (!parsed.currentUser) parsed.currentUser = DEFAULT_USERS[0];
      if (!parsed.users) parsed.users = DEFAULT_USERS;
      
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
          sample: { ...DEFAULT_SETTINGS.sample, ...parsed.settings.sample },
          report: { ...DEFAULT_SETTINGS.report, ...parsed.settings.report },
          notification: { ...DEFAULT_SETTINGS.notification, ...parsed.settings.notification },
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

  // 2. Demo Items (Products and Lab Services)
  const demoItems: Item[] = [
    // Lab Services
    {
      id: 'srv-1',
      code: 'SRV-001',
      name: 'Water Potability Microbiological Test',
      category: 'Water Testing',
      type: 'Laboratory Service',
      unit: 'Sample',
      purchasePrice: 0,
      sellingPrice: 1500,
      taxRate: 18,
      openingStock: 0,
      currentStock: 0,
      minimumStock: 0,
      isActive: true,
      testMethod: 'IS 10500:2012',
      standardMethod: 'Membrane Filtration',
      sampleType: 'Drinking Water',
      requiredQuantity: '500 ml',
      turnaroundTimeDays: 3,
      resultUnit: 'CFU/100ml',
      referenceRange: 'E.coli: Absent, Total Coliforms: Absent',
      batchTracking: false,
      expiryTracking: false,
      instructions: 'Collect in sterile sodium thiosulfate bottle and keep refrigerated.'
    },
    {
      id: 'srv-2',
      code: 'SRV-002',
      name: 'Soil Nitrogen & Nutrient Profiling',
      category: 'Agricultural Analysis',
      type: 'Laboratory Service',
      unit: 'Sample',
      purchasePrice: 0,
      sellingPrice: 2500,
      taxRate: 18,
      openingStock: 0,
      currentStock: 0,
      minimumStock: 0,
      isActive: true,
      testMethod: 'AOAC 973.48',
      standardMethod: 'Kjeldahl Method',
      sampleType: 'Soil / Compost',
      requiredQuantity: '200 g',
      turnaroundTimeDays: 5,
      resultUnit: 'mg/kg',
      referenceRange: 'Available Nitrogen: 280 - 560 mg/kg',
      batchTracking: false,
      expiryTracking: false,
      instructions: 'Air-dry the soil, sieve through 2mm screen prior to dispatch.'
    },
    {
      id: 'srv-3',
      code: 'SRV-003',
      name: 'Heavy Metal Analysis - Arsenic & Lead',
      category: 'Toxicity Screening',
      type: 'Laboratory Service',
      unit: 'Sample',
      purchasePrice: 0,
      sellingPrice: 4200,
      taxRate: 18,
      openingStock: 0,
      currentStock: 0,
      minimumStock: 0,
      isActive: true,
      testMethod: 'EPA Method 200.8',
      standardMethod: 'ICP-MS Analysis',
      sampleType: 'Effluent / Industrial Water / Soil',
      requiredQuantity: '100 ml',
      turnaroundTimeDays: 4,
      resultUnit: 'ppm (mg/L)',
      referenceRange: 'Lead < 0.01 ppm, Arsenic < 0.05 ppm',
      batchTracking: false,
      expiryTracking: false,
      instructions: 'Collect in acid-washed plastic bottle, preserve with nitric acid to pH < 2.'
    },
    // Chemicals (Stock tracked)
    {
      id: 'chem-1',
      code: 'CHM-101',
      name: 'Concentrated Nitric Acid 69%',
      category: 'Mineral Acids',
      type: 'Chemical',
      unit: 'Bottle (500ml)',
      purchasePrice: 1200,
      sellingPrice: 0,
      taxRate: 18,
      openingStock: 10,
      currentStock: 10,
      minimumStock: 3,
      storageLocation: 'Acid Cabinet B-1',
      batchTracking: true,
      expiryTracking: true,
      isActive: true,
      description: 'AR Grade analytical reagent, highly corrosive.'
    },
    {
      id: 'chem-2',
      code: 'CHM-102',
      name: 'Silver Nitrate Powder (Analytical Grade)',
      category: 'Inorganic Salts',
      type: 'Chemical',
      unit: 'Gram (g)',
      purchasePrice: 150,
      sellingPrice: 0,
      taxRate: 18,
      openingStock: 250,
      currentStock: 220,
      minimumStock: 50,
      storageLocation: 'Locked Toxic Safe Shelf C',
      batchTracking: true,
      expiryTracking: true,
      isActive: true,
      description: 'Used for halide titration assays.'
    },
    {
      id: 'item-prod',
      code: 'PRD-201',
      name: 'Sterile Water Sampling Bottles (500ml)',
      category: 'Sampling Consumables',
      type: 'Consumable',
      unit: 'Box of 100',
      purchasePrice: 1800,
      sellingPrice: 2400,
      taxRate: 12,
      openingStock: 8,
      currentStock: 8,
      minimumStock: 2,
      storageLocation: 'Consumable Room Rack 2',
      batchTracking: false,
      expiryTracking: false,
      isActive: true,
      description: 'Pre-treated with sodium thiosulfate tablets for chlorine neutralization.'
    }
  ];

  // 3. Demo Equipment
  const demoEquipment: Equipment[] = [
    {
      id: 'eq-1',
      equipmentCode: 'EQ-01',
      name: 'Sartorius Digital PH Meter',
      category: 'Electrochemistry',
      manufacturer: 'Sartorius',
      model: 'PH-320',
      serialNumber: 'SR-9412-PH',
      purchaseDate: '2025-01-10',
      purchaseCost: 45000,
      location: 'Biochemistry Bench A',
      condition: 'Good',
      status: 'Available',
      lastCalibrationDate: '2026-06-15',
      nextCalibrationDate: '2026-12-15',
      lastMaintenanceDate: '2026-05-10',
      nextMaintenanceDate: '2026-11-10'
    },
    {
      id: 'eq-2',
      equipmentCode: 'EQ-02',
      name: 'Thermo Scientific Spectrophotometer',
      category: 'Spectroscopy',
      manufacturer: 'Thermo Scientific',
      model: 'Genesys 150',
      serialNumber: 'TH-5021-SP',
      purchaseDate: '2024-03-20',
      purchaseCost: 320000,
      location: 'Analytical Lab Room 2',
      condition: 'Excellent',
      status: 'Available',
      lastCalibrationDate: '2026-04-10',
      nextCalibrationDate: '2026-10-10',
      lastMaintenanceDate: '2026-03-12',
      nextMaintenanceDate: '2026-09-12'
    },
    {
      id: 'eq-3',
      equipmentCode: 'EQ-03',
      name: 'Horizontal High-Pressure Steam Autoclave',
      category: 'Sterilization',
      manufacturer: 'Equitron Medical',
      model: 'EQ-80-AUTO',
      serialNumber: 'EQ-8491-X',
      purchaseDate: '2024-06-18',
      purchaseCost: 185000,
      location: 'Sterility Testing Room 1',
      condition: 'Fair',
      status: 'Calibration Due',
      lastCalibrationDate: '2025-07-20',
      nextCalibrationDate: '2026-07-20',
      lastMaintenanceDate: '2026-01-15',
      nextMaintenanceDate: '2026-07-15'
    }
  ];

  // 4. Demo Quotation
  const demoQuotations: Quotation[] = [
    {
      id: 'qt-1',
      quotationNumber: 'QT-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      quotationDate: '2026-07-01',
      expiryDate: '2026-07-31',
      sampleCount: 5,
      items: [
        {
          id: 'qti-1',
          itemId: 'srv-1',
          itemName: 'Water Potability Microbiological Test',
          itemCode: 'SRV-001',
          quantity: 5,
          rate: 1500,
          discountPercent: 10,
          taxPercent: 18,
          taxAmount: 1215,
          amount: 7965 // (7500 - 750) + 1215 = 7965
        }
      ],
      subtotal: 7500,
      discountAmount: 750,
      taxAmount: 1215,
      additionalCharges: 150,
      total: 8115,
      status: 'Accepted',
      advanceRequirement: 4000,
      notes: 'Testing scheduled for batches received in first week of July.',
      termsAndConditions: '1. Deliver samples within 24 hours of collection.\n2. Balance within 15 days of reporting.',
      createdAt: '2026-07-01T10:30:00Z'
    }
  ];

  // 5. Demo Samples
  const demoSamples: Sample[] = [
    {
      id: 'smp-1',
      sampleCode: 'SMP-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      relatedQuotationId: 'qt-1',
      relatedQuotationNumber: 'QT-2026-0001',
      sampleName: 'Raw Groundwater Ingress - Source A',
      sampleType: 'Drinking Water',
      sampleCategory: 'Microbiological Analysis',
      quantity: 1000,
      unit: 'ml',
      receivedDate: '2026-07-12',
      receivedTime: '11:15',
      receivedBy: 'John Doe',
      receivedCondition: 'Cool, Sealed, Glass Container',
      storageLocation: 'Walk-In Chiller Chamber C',
      requiredTestIds: ['srv-1'],
      priority: 'High',
      expectedCompletionDate: '2026-07-15',
      internalNotes: 'Sample must be plated within 6 hours of arrival.',
      status: 'Result Entered',
      timeline: [
        { id: 't1', status: 'Received', label: 'Sample Collected & Arrived', description: 'Sample received from Rajesh Kumar in sterile cooler bag.', user: 'John Doe', timestamp: '2026-07-12T11:15:00Z' },
        { id: 't2', status: 'Registered', label: 'Registered in LIMS', description: 'Unique barcode generated and printed.', user: 'John Doe', timestamp: '2026-07-12T11:45:00Z' },
        { id: 't3', status: 'Test Assigned', label: 'Tests & Staff Assigned', description: 'Assigned to Technician Alan Turing.', user: 'Sarah Jenkins', timestamp: '2026-07-12T13:00:00Z' },
        { id: 't4', status: 'Testing', label: 'Testing Started', description: 'Incubators set and plates prepared.', user: 'Alan Turing', timestamp: '2026-07-12T14:30:00Z' },
        { id: 't5', status: 'Result Entered', label: 'Observations Entered', description: 'Plates counted, E.coli colonies found.', user: 'Alan Turing', timestamp: '2026-07-14T15:00:00Z' }
      ],
      createdAt: '2026-07-12T11:15:00Z'
    },
    {
      id: 'smp-2',
      sampleCode: 'SMP-2026-0002',
      partyId: 'pt-2',
      partyName: 'GreenEarth Organics Farmer Co-op',
      sampleName: 'Soil Sample - Plot B Red Loamy',
      sampleType: 'Soil / Compost',
      sampleCategory: 'Fertility Assessment',
      quantity: 500,
      unit: 'g',
      receivedDate: '2026-07-14',
      receivedTime: '09:30',
      receivedBy: 'John Doe',
      receivedCondition: 'Dry, Sealed Plastic Pouch',
      storageLocation: 'Dry Storage Shelf 3',
      requiredTestIds: ['srv-2'],
      priority: 'Normal',
      expectedCompletionDate: '2026-07-19',
      status: 'Test Assigned',
      timeline: [
        { id: 't11', status: 'Received', label: 'Arrived at Laboratory', description: 'Arrived via courier.', user: 'John Doe', timestamp: '2026-07-14T09:30:00Z' },
        { id: 't12', status: 'Registered', label: 'Registered in LIMS', description: 'Unique barcode generated.', user: 'John Doe', timestamp: '2026-07-14T10:15:00Z' },
        { id: 't13', status: 'Test Assigned', label: 'Assigned to Technician', description: 'Assigned to Alan Turing.', user: 'Sarah Jenkins', timestamp: '2026-07-14T11:30:00Z' }
      ],
      createdAt: '2026-07-14T09:30:00Z'
    }
  ];

  // 6. Demo Test Assignments
  const demoTestAssignments: TestAssignment[] = [
    {
      id: 'ta-1',
      assignmentCode: 'TST-0001',
      sampleId: 'smp-1',
      sampleCode: 'SMP-2026-0001',
      sampleName: 'Raw Groundwater Ingress - Source A',
      serviceId: 'srv-1',
      serviceName: 'Water Potability Microbiological Test',
      assignedTechnicianId: 'u4',
      assignedTechnicianName: 'Alan Turing',
      assignedResearcherId: 'u5',
      assignedResearcherName: 'Marie Curie',
      assignedDate: '2026-07-12',
      dueDate: '2026-07-15',
      priority: 'High',
      requiredEquipment: ['EQ-03'], // Autoclave for sterilization
      requiredChemicals: [{ chemicalId: 'chem-2', itemName: 'Silver Nitrate Powder', quantityNeeded: 2 }],
      testMethod: 'IS 10500:2012',
      status: 'Result Submitted',
      startDate: '2026-07-12 14:30',
      endDate: '2026-07-14 15:00',
      equipmentUsed: ['Horizontal High-Pressure Steam Autoclave'],
      chemicalsUsed: [{ chemicalId: 'chem-2', itemName: 'Silver Nitrate Powder', quantityUsed: 2 }],
      rawObservation: 'Plated 100ml sample on MacConkey agar. Incubated at 37°C for 48 hours. Observed pink colonies.',
      results: [
        { id: 'p1', parameterName: 'Total Coliforms', method: 'IS 15185', resultValue: '18', unit: 'CFU/100ml', referenceRange: 'Absent', status: 'Abnormal' },
        { id: 'p2', parameterName: 'E. coli', method: 'IS 15185', resultValue: '4', unit: 'CFU/100ml', referenceRange: 'Absent', status: 'Critical' }
      ],
      interpretation: 'The water sample contains alarming fecal coliform bacteria, rendering it completely unsafe for direct drinking purposes.',
      conclusion: 'FAIL - Sample violates Drinking Water Specification IS 10500:2012.',
      technicianNotes: 'Duplicate plates showed consistent contamination.',
      revisions: []
    },
    {
      id: 'ta-2',
      assignmentCode: 'TST-0002',
      sampleId: 'smp-2',
      sampleCode: 'SMP-2026-0002',
      sampleName: 'Soil Sample - Plot B Red Loamy',
      serviceId: 'srv-2',
      serviceName: 'Soil Nitrogen & Nutrient Profiling',
      assignedTechnicianId: 'u4',
      assignedTechnicianName: 'Alan Turing',
      assignedResearcherId: 'u5',
      assignedResearcherName: 'Marie Curie',
      assignedDate: '2026-07-14',
      dueDate: '2026-07-19',
      priority: 'Normal',
      testMethod: 'AOAC 973.48',
      status: 'Assigned',
      results: [
        { id: 'p3', parameterName: 'Available Nitrogen (N)', method: 'Kjeldahl', resultValue: 'Pending', unit: 'mg/kg', referenceRange: '280 - 560', status: 'Pending' }
      ],
      revisions: []
    }
  ];

  // 7. Demo Invoices
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
      relatedSampleId: 'smp-1',
      relatedSampleCode: 'SMP-2026-0001',
      items: [
        {
          id: 'invi-1',
          itemId: 'srv-1',
          itemName: 'Water Potability Microbiological Test',
          itemCode: 'SRV-001',
          quantity: 1,
          rate: 1500,
          discountPercent: 0,
          taxPercent: 18,
          taxAmount: 270,
          amount: 1770
        }
      ],
      subtotal: 1500,
      discountAmount: 0,
      taxAmount: 270,
      additionalCharges: 50,
      roundOff: 0,
      total: 1820,
      amountPaid: 1000,
      balanceDue: 820,
      status: 'Partially Paid',
      notes: 'Advance Rs 1000 received. Balance payable on report delivery.',
      isLocked: true,
      createdAt: '2026-07-12T12:00:00Z',
      updatedAt: '2026-07-12T12:00:00Z'
    }
  ];

  // 8. Demo Purchases
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
          itemId: 'chem-1',
          itemName: 'Concentrated Nitric Acid 69%',
          quantity: 5,
          rate: 1200,
          taxPercent: 18,
          taxAmount: 1080,
          amount: 7080,
          batchNumber: 'BCH-NIT-992',
          mfgDate: '2026-03-01',
          expiryDate: '2028-03-01'
        },
        {
          id: 'puri-2',
          itemId: 'chem-2',
          itemName: 'Silver Nitrate Powder (Analytical Grade)',
          quantity: 100,
          rate: 150,
          taxPercent: 18,
          taxAmount: 2700,
          amount: 17700,
          batchNumber: 'BCH-SLV-01',
          mfgDate: '2026-05-10',
          expiryDate: '2029-05-10'
        }
      ],
      subtotal: 21000,
      taxAmount: 3780,
      discountAmount: 1000,
      total: 23780,
      amountPaid: 23780,
      balanceDue: 0,
      paymentStatus: 'Paid',
      storageLocation: 'Chemical Storage Cabin A',
      notes: 'Chemicals unpacked and stored with safety protocols.',
      createdAt: '2026-07-05T15:00:00Z'
    }
  ];

  // 9. Demo Payments (Payment In & Payment Out)
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
      notes: 'Partial advance for raw groundwater sample SMP-0001 testing.',
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

  // 10. Demo Expenses
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
      description: 'Electricity bill for Main Analytical Lab Space (June 2026)',
      isRecurring: true,
      createdAt: '2026-07-04T10:00:00Z'
    },
    {
      id: 'exp-2',
      expenseNumber: 'EXP-2026-0002',
      category: 'Equipment maintenance',
      expenseDate: '2026-07-08',
      vendorName: 'Sartorius Technical Services Ltd',
      amount: 3200,
      taxAmount: 576,
      paymentMethod: 'UPI',
      accountId: 'acc-3',
      accountName: 'UPI HDFC Merchant QR',
      description: 'Routine maintenance of Sartorius pH meter (EQ-01)',
      isRecurring: false,
      createdAt: '2026-07-08T11:20:00Z'
    }
  ];

  // 11. Demo Stock Movements
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
    },
    {
      id: 'mov-3',
      itemId: 'chem-2',
      itemName: 'Silver Nitrate Powder (Analytical Grade)',
      type: 'Lab Usage',
      quantity: -2,
      referenceId: 'ta-1',
      referenceNumber: 'TST-0001',
      user: 'Alan Turing',
      notes: 'Used in Water Coliform Assay testing titration.',
      timestamp: '2026-07-14T15:00:00Z'
    }
  ];

  // 12. Demo Lab Reports
  const demoReports: LabReport[] = [
    {
      id: 'rep-1',
      reportNumber: 'REP-2026-0001',
      partyId: 'pt-1',
      partyName: 'AquaPure Bottlers India',
      sampleId: 'smp-1',
      sampleCode: 'SMP-2026-0001',
      sampleName: 'Raw Groundwater Ingress - Source A',
      sampleType: 'Drinking Water',
      receivedDate: '2026-07-12',
      reportDate: '2026-07-14',
      reportTitle: 'MICROBIOLOGICAL ANALYSIS OF GROUNDWATER',
      testAssignments: [], // will link to ta-1
      observations: 'Microbiological culture plates show severe bacterial colony development. Coliform count exceeds standard values.',
      interpretation: 'The tested sample has active contamination. Direct human consumption is prohibited without standard multi-barrier treatment and chlorination.',
      conclusion: 'FAIL - Not potable as per IS 10500:2012 biological limits.',
      disclaimer: 'This analytical report represents only the sample as received and tested at LabBiz. The lab assumes no liability for sampling unless performed by our staff.',
      preparedBy: 'Alan Turing (Lab Technician)',
      reviewedBy: 'Marie Curie (Researcher)',
      approvedBy: 'Richard Feynman (Reviewer)',
      digitalSignature: 'SIGNED_RICHARD_FEYNMAN_77492',
      status: 'Under Review',
      qrCodeData: 'https://labbiz.in/verify/REP-2026-0001',
      isLocked: false,
      createdAt: '2026-07-14T15:30:00Z',
      updatedAt: '2026-07-14T15:30:00Z'
    }
  ];

  // 13. Audit logs for seed data actions
  const demoAuditLogs: AuditLog[] = [
    { id: 'al-1', user: 'Steve Jobs', role: 'Inventory Staff', action: 'Purchase Registered & Stocks Credited', module: 'Purchases', recordId: 'pur-1', recordName: 'PUR-2026-0001', timestamp: '2026-07-05T15:01:00Z' },
    { id: 'al-2', user: 'John Doe', role: 'Receptionist', action: 'Quotation Accepted by Client', module: 'Quotations', recordId: 'qt-1', recordName: 'QT-2026-0001', timestamp: '2026-07-01T12:00:00Z' },
    { id: 'al-3', user: 'John Doe', role: 'Receptionist', action: 'Sample Registered in LIMS', module: 'Samples', recordId: 'smp-1', recordName: 'SMP-2026-0001', timestamp: '2026-07-12T11:45:00Z' },
    { id: 'al-4', user: 'Alan Turing', role: 'Lab Technician', action: 'Test Observation Submitted', module: 'Lab Tests', recordId: 'ta-1', recordName: 'TST-0001', timestamp: '2026-07-14T15:00:00Z' },
    { id: 'al-5', user: 'Marie Curie', role: 'Researcher', action: 'Drafted Analytical Report', module: 'Lab Reports', recordId: 'rep-1', recordName: 'REP-2026-0001', timestamp: '2026-07-14T15:35:00Z' }
  ];

  // 14. Initial Notifications
  const demoNotifications: AppNotification[] = [
    { id: 'dn-1', title: 'Low Stock Alert', message: 'Item "Concentrated Nitric Acid 69%" is near minimum stock level.', type: 'warning', isRead: false, timestamp: '2026-07-14T16:00:00Z' },
    { id: 'dn-2', title: 'New Test Results Submitted', message: 'Alan Turing has submitted results for TST-0001 water test.', type: 'info', isRead: false, relatedLink: { module: 'Lab Tests', recordId: 'ta-1' }, timestamp: '2026-07-14T15:01:00Z' },
    { id: 'dn-3', title: 'Payment In Registered', message: 'Received Rs 1000 from AquaPure Bottlers India.', type: 'success', isRead: true, timestamp: '2026-07-12T12:05:00Z' }
  ];

  // Calculate account balances from payments, expenses, etc.
  let cashBalance = 15000;
  let bankBalance = 450000;
  let upiBalance = 80000;

  // Apply transactions
  // pay-1 payment in (1000 INR into UPI)
  upiBalance += 1000;
  // pay-2 payment out (23780 INR from Bank)
  bankBalance -= 23780;
  // exp-1 electricity bill (8500 INR from Bank)
  bankBalance -= 8500;
  // exp-2 maintenance bill (3200 INR from UPI)
  upiBalance -= 3200;

  const demoAccounts: CashBankAccount[] = [
    { id: 'acc-1', name: 'Lab Business Petty Cash', type: 'Petty Cash', openingBalance: 15000, currentBalance: cashBalance },
    { id: 'acc-2', name: 'ICICI Bank Current Account', type: 'Bank', openingBalance: 450000, currentBalance: bankBalance },
    { id: 'acc-3', name: 'UPI HDFC Merchant QR', type: 'UPI', openingBalance: 80000, currentBalance: upiBalance }
  ];

  // Link report test assignments
  const matchedReport = { ...demoReports[0] };
  matchedReport.testAssignments = [demoTestAssignments[0]];

  return {
    ...state,
    parties: demoParties,
    items: demoItems,
    quotations: demoQuotations,
    invoices: demoInvoices,
    purchases: demoPurchases,
    payments: demoPayments,
    expenses: demoExpenses,
    samples: demoSamples,
    testAssignments: demoTestAssignments,
    labReports: [matchedReport],
    stockMovements: demoStockMovements,
    equipment: demoEquipment,
    accounts: demoAccounts,
    notifications: [...demoNotifications, ...state.notifications],
    auditLogs: [...demoAuditLogs, ...state.auditLogs]
  };
}
