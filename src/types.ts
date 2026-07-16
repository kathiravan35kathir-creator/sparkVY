export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
}

export type PartyType = 'Customer' | 'Supplier' | 'Both';
export type BalanceType = 'Receivable' | 'Payable';

export interface Party {
  id: string;
  code: string;
  name: string;
  displayName: string;
  companyName?: string;
  type: PartyType;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstRegistration: 'Registered' | 'Unregistered' | 'Composite';
  gstNumber?: string;
  pan?: string;
  businessType?: string;
  openingBalance: number;
  balanceType: BalanceType;
  currentBalance: number; // calculated balance
  creditLimit?: number;
  billingAddress: string;
  shippingAddress?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemType = 'Inventory Product' | 'Laboratory Service' | 'Chemical' | 'Reagent' | 'Consumable' | 'Equipment';

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  type: ItemType;
  unit: string;
  barcode?: string;
  hsnCode?: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number; // percentage (e.g. 18 for 18%)
  openingStock: number;
  currentStock: number;
  minimumStock: number;
  storageLocation?: string;
  batchTracking: boolean;
  expiryTracking: boolean;
  supplierId?: string; // linked Party
  description?: string;
  isActive: boolean;

  // Lab Service specific fields
  testMethod?: string;
  standardMethod?: string;
  sampleType?: string;
  requiredQuantity?: string;
  turnaroundTimeDays?: number;
  resultUnit?: string;
  referenceRange?: string;
  requiredEquipment?: string[];
  requiredChemicals?: { chemicalId: string; quantityNeeded: number }[];
  reportTemplate?: string;
  instructions?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';

export interface QuotationLineItem {
  id: string;
  itemId: string; // Product or Service
  itemName: string;
  itemCode: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  partyId: string;
  partyName: string;
  quotationDate: string;
  expiryDate: string;
  items: QuotationLineItem[];
  sampleCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  total: number;
  status: QuotationStatus;
  advanceRequirement: number;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
}

export type InvoiceStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  invoiceDate: string;
  dueDate: string;
  relatedQuotationId?: string;
  relatedQuotationNumber?: string;
  relatedSampleId?: string;
  relatedSampleCode?: string;
  relatedLabReportId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  roundOff: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  isLocked: boolean; // finalized
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseLineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  partyId: string; // Supplier
  partyName: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  dueDate: string;
  items: PurchaseLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  storageLocation?: string;
  notes?: string;
  createdAt: string;
}

export type PaymentType = 'Payment In' | 'Payment Out' | 'Advance' | 'Refund' | 'Transfer';
export type PaymentMethod = 'Cash' | 'Bank transfer' | 'UPI' | 'Cheque' | 'Card' | 'Online payment' | 'Other';

export interface PaymentAllocation {
  invoiceId?: string;
  purchaseId?: string;
  allocatedAmount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  partyId?: string;
  partyName?: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  accountId: string; // linked Cash/Bank account
  accountName: string;
  referenceNumber?: string;
  notes?: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  expenseDate: string;
  vendorName?: string;
  amount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  accountId: string; // Cash or Bank
  accountName: string;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
}

export type SamplePriority = 'Normal' | 'High' | 'Urgent';
export type SampleStatus =
  | 'Received'
  | 'Registered'
  | 'Test Assigned'
  | 'Testing'
  | 'Result Entered'
  | 'Under Review'
  | 'Report Ready'
  | 'Delivered'
  | 'Rejected'
  | 'Cancelled';

export interface SampleTimelineEvent {
  id: string;
  status: SampleStatus;
  label: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface Sample {
  id: string;
  sampleCode: string; // e.g. SMP-2026-0001
  partyId: string; // Customer
  partyName: string;
  relatedQuotationId?: string;
  relatedQuotationNumber?: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  sampleName: string;
  sampleType: string; // e.g. Water, Blood, Soil, Chemical
  sampleCategory: string;
  quantity: number;
  unit: string; // e.g. ml, g, tube
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  receivedCondition: string; // e.g. Cool, Sealed, Intact
  storageLocation: string;
  requiredTestIds: string[]; // List of Lab Service Item IDs
  priority: SamplePriority;
  expectedCompletionDate: string;
  customerInstructions?: string;
  internalNotes?: string;
  barcodeData?: string; // QR code data
  status: SampleStatus;
  deliveryStatus?: string; // e.g. Dispatched, Handed Over
  deliveryInfo?: string;
  timeline: SampleTimelineEvent[];
  createdAt: string;
}

export type TestAssignmentStatus =
  | 'Assigned'
  | 'Accepted'
  | 'Started'
  | 'Paused'
  | 'Result Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface ParameterResult {
  id: string;
  parameterName: string;
  method: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending';
}

export interface TestResultRevision {
  id: string;
  submittedBy: string;
  submittedAt: string;
  results: ParameterResult[];
  rawObservation?: string;
  equipmentUsed?: string;
  chemicalsUsed?: { chemicalId: string; quantity: number }[];
  comments?: string;
}

export interface TestAssignment {
  id: string;
  assignmentCode: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  serviceId: string; // Lab Service ID
  serviceName: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedResearcherId?: string;
  assignedResearcherName?: string;
  assignedDate: string;
  dueDate: string;
  priority: SamplePriority;
  requiredEquipment?: string[];
  requiredChemicals?: { chemicalId: string; itemName: string; quantityNeeded: number }[];
  testMethod: string;
  instructions?: string;
  status: TestAssignmentStatus;

  // Active result entry fields
  startDate?: string;
  endDate?: string;
  equipmentUsed?: string[];
  chemicalsUsed?: { chemicalId: string; itemName: string; quantityUsed: number }[];
  rawObservation?: string;
  results: ParameterResult[];
  interpretation?: string;
  conclusion?: string;
  technicianNotes?: string;

  // Review & Approval fields
  reviewerName?: string;
  reviewDate?: string;
  reviewComments?: string;
  revisions: TestResultRevision[];
}

export type LabReportStatus = 'Draft' | 'Under Review' | 'Approved' | 'Delivered' | 'Revised' | 'Cancelled';

export interface LabReport {
  id: string;
  reportNumber: string; // e.g. REP-2026-0001
  partyId: string;
  partyName: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  sampleType: string;
  receivedDate: string;
  reportDate: string;
  reportTitle: string;
  testAssignments: TestAssignment[];
  observations?: string;
  interpretation?: string;
  conclusion?: string;
  disclaimer: string;
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  digitalSignature?: string;
  status: LabReportStatus;
  qrCodeData: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'Purchase In'
  | 'Sale Out'
  | 'Lab Usage'
  | 'Adjustment'
  | 'Return'
  | 'Damaged'
  | 'Expired'
  | 'Transfer';

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  batchNumber?: string;
  expiryDate?: string;
  referenceId?: string; // e.g. purchaseId, testAssignmentId, saleId
  referenceNumber?: string; // e.g. INV-101, PUR-202
  accountId?: string; // if adjustment or return
  user: string;
  notes?: string;
  timestamp: string;
}

export type EquipmentStatus = 'Available' | 'In Use' | 'Under Maintenance' | 'Calibration Due' | 'Out of Service' | 'Retired';

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  vendorName?: string;
  purchaseCost?: number;
  location?: string;
  condition?: string;
  status: EquipmentStatus;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  warrantyExpiry?: string;
  responsibleStaffId?: string;
  responsibleStaffName?: string;
  notes?: string;
}

export interface CashBankAccount {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'UPI' | 'Petty Cash';
  openingBalance: number;
  currentBalance: number;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  isRead: boolean;
  relatedLink?: { module: string; recordId: string };
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string; // e.g. 'Create Party', 'Finalise Invoice', 'Approve Lab Report'
  module: string; // e.g. 'Parties', 'Sales', 'Reports'
  recordId: string;
  recordName: string;
  oldValues?: string;
  newValues?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface DocumentNumberConfig {
  prefix: string;
  startingNumber: number;
  currentNumber: number;
  minDigitLength: number;
  separator: string;
  includeFinancialYear: boolean;
  includeMonth: boolean;
  includeBranchCode: boolean;
  resetByFinancialYear: boolean;
}

export interface AppSettings {
  company: {
    labName: string;
    legalName: string;
    displayLabName: string;
    businessType: string;
    logoUrl?: string;
    secondaryLogoUrl?: string;
    address: string;
    address1: string;
    address2: string;
    city: string;
    district: string;
    state: string;
    postalCode: string;
    country: string;
    primaryPhone: string;
    alternatePhone?: string;
    email: string;
    gstNumber?: string;
    pan?: string;
    cin?: string;
    registrationDate?: string;
    website?: string;
    currency: string;
    timezone: string;
    description?: string;
    footerText?: string;
  };
  invoice: {
    prefix: string;
    numberFormat: string;
    defaultTaxRate: number;
    terms: string;
    footer: string;
    signatureText: string;
    isItemCodeVisible: boolean;
    isDescriptionVisible: boolean;
  };
  quotation: {
    prefix: string;
    validityDays: number;
    terms: string;
    isValidityVisible: boolean;
  };
  purchase: {
    prefix: string;
    terms: string;
    footer: string;
    showSupplierGst: boolean;
    showBatchExpiry: boolean;
  };
  receipt: {
    prefix: string;
    footer: string;
    showAllocation: boolean;
    showPrevBalance: boolean;
  };
  sample: {
    prefix: string;
    defaultTurnaroundTimeDays: number;
    barcodePreference: 'QR Code' | 'Barcode';
    labelSize: string;
    labelCopies: number;
  };
  report: {
    prefix: string;
    header: string;
    footer: string;
    disclaimer: string;
    signatureText: string;
    accreditationText: string;
    showLabLogo: boolean;
    showAccreditation: boolean;
    showCustomerDetails: boolean;
    showSampleDetails: boolean;
    showTestMethod: boolean;
    showReferenceRange: boolean;
    showInterpretation: boolean;
    showConclusion: boolean;
    showDisclaimer: boolean;
    showQrVerification: boolean;
  };
  notification: {
    emailPreferences: boolean;
    inAppPreferences: boolean;
    reminderDaysBeforeDue: number;
  };
  system: {
    dateFormat: string;
    timeFormat: string;
    currencyFormat: string;
    paginationSize: number;
    allowNegativeStock: boolean;
    financialYearStartMonth: string;
    defaultBranchName: string;
    firstDayOfWeek: string;
    currencySymbol: string;
    currencyPosition: 'Prefix' | 'Suffix';
    decimalPlaces: number;
    quantityDecimalPlaces: number;
    numberGroupingFormat: string;
    language: string;
    appStartPage: string;
    sidebarDefaultState: 'expanded' | 'collapsed';
    compactTableMode: boolean;
    showHelpText: boolean;
  };
  tax: {
    enableGst: boolean;
    gstRegistrationType: 'Registered' | 'Unregistered' | 'Composite';
    gstNumber?: string;
    placeOfSupply: string;
    defaultGstRate: number;
    taxPricingMode: 'Inclusive' | 'Exclusive';
    enableCgstSgst: boolean;
    enableIgst: boolean;
    enableCess: boolean;
    showHsnSac: boolean;
    showTaxBreakup: boolean;
    taxRoundingMethod: 'Round Normal' | 'Round Down' | 'Round Up';
    defaultTaxProducts: number;
    defaultTaxServices: number;
    reverseChargeOption: boolean;
    taxInvoiceLabel: string;
    nonGstInvoiceLabel: string;
  };
  bank: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    accountType: string;
    upiId: string;
    upiDisplayName: string;
    qrCodeUrl?: string;
    defaultCashAccount: string;
    defaultBankAccount: string;
    defaultPaymentMethod: string;
    showBankDetailsOnInvoice: boolean;
    showUpiOnInvoice: boolean;
    showQrCodeOnInvoice: boolean;
    paymentInstructions: string;
    receiptFooter: string;
  };
  numbering: {
    quotation: DocumentNumberConfig;
    invoice: DocumentNumberConfig;
    purchase: DocumentNumberConfig;
    receipt: DocumentNumberConfig;
    expense: DocumentNumberConfig;
    sample: DocumentNumberConfig;
    labTest: DocumentNumberConfig;
    labReport: DocumentNumberConfig;
    creditNote: DocumentNumberConfig;
    debitNote: DocumentNumberConfig;
    stockAdjustment: DocumentNumberConfig;
  };
  print: {
    invoiceTemplate: string;
    quotationTemplate: string;
    receiptTemplate: string;
    purchaseTemplate: string;
    labReportTemplate: string;
    sampleLabelTemplate: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSizeScale: 'small' | 'medium' | 'large';
    logoPosition: 'left' | 'center' | 'right';
    logoSize: 'small' | 'medium' | 'large';
    headerAlignment: 'left' | 'center' | 'right';
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showGst: boolean;
    showHsnSac: boolean;
    showTaxColumns: boolean;
    showDiscount: boolean;
    showPreviousBalance: boolean;
    showBankDetails: boolean;
    showUpi: boolean;
    showQrPayment: boolean;
    showSignature: boolean;
    showTerms: boolean;
    showNotes: boolean;
    showFooter: boolean;
    footerText: string;
    paperSize: 'A4' | 'A5' | 'Letter' | '80mm';
    pageOrientation: 'Portrait' | 'Landscape';
    pageMargins: 'narrow' | 'normal' | 'wide';
    tableDensity: 'compact' | 'normal' | 'spacious';
    printCopyLabels: string[];
  };
}
