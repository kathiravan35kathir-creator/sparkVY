export type EquipmentStatus = 'Operational' | 'Under Maintenance' | 'Calibration Due' | 'Faulty' | 'Decommissioned';

export interface BaseDeletedEntity {
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: EquipmentStatus;
  serialNumber?: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  purchaseCost?: number;
  notes?: string;
  condition?: string;
}
export interface Sample {
  id: string;
  sampleCode: string;
  partyId: string;
  partyName: string;
  receivedDate: string;
  status: 'Pending' | 'In Analysis' | 'Completed' | 'Reported';
  tests: string[];
  createdAt: string;
}
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

export interface AlternateWhatsAppNumber {
  id: string;
  number: string;
  label?: string;
  createdAt: string;
  createdBy: string;
}

export interface PhoneHistoryEntry {
  id: string;
  previousNumber: string;
  newNumber: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface Party extends BaseDeletedEntity {
  id: string;
  code: string;
  name: string;
  displayName: string;
  companyName?: string;
  type: PartyType;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  alternateWhatsAppNumbers?: AlternateWhatsAppNumber[];
  phoneHistory?: PhoneHistoryEntry[];
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
  notesList?: Array<{ id: string; content: string; createdBy: string; createdAt: string }>;
  documentsList?: Array<{ id: string; name: string; size: number; type: string; url?: string; uploadedAt: string }>;
}

export type ItemType = 'Inventory Product' | 'Equipment' | 'Asset' | 'Consumable' | 'Material' | 'Supply';

export interface Item extends BaseDeletedEntity {
  id: string;
  code: string;
  name: string;
  category: string;
  type: ItemType | string;
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
}

export type QuotationStage = 'Estimate' | 'Final';
export type QuotationStatus = 'Draft' | 'Sent' | 'Revised' | 'Approved' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted' | 'Cancelled';

export interface QuotationLineItem {
  id: string;
  itemId: string; // Product or Service
  itemName: string;
  itemCode: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
  // Lab specific fields
  sampleDetails?: string;
  testMethod?: string;
  turnaroundTime?: string;
}

export interface Quotation extends BaseDeletedEntity {
  id: string;
  stage: QuotationStage;
  quotationNumber: string; // "EST-0001 Rev 1" or "QT-0001"
  baseQuotationNumber?: string; // "EST-0001"
  revisionNumber?: number;
  originalEstimateId?: string;
  isLocked?: boolean;
  partyId: string;
  partyName: string;
  billingAddress?: string;
  shippingAddress?: string;
  partyGstNumber?: string;
  quotationDate: string;
  expiryDate: string;
  items: QuotationLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  total: number;
  status: QuotationStatus;
  advanceRequirement: number;
  notes?: string;
  termsAndConditions?: string;
  // Lab specific fields
  sampleCollectionCharges?: number;
  reportDeliveryMode?: string;
  accreditationDetails?: string;
  // Commercial fields
  deliveryTerms?: string;
  paymentTerms?: string;
  sampleCount?: number;
  createdAt: string;
}

export type ProformaStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted' | 'Cancelled';

export interface ProformaInvoice extends BaseDeletedEntity {
  id: string;
  proformaNumber: string;
  partyId: string;
  partyName: string;
  billingAddress: string;
  shippingAddress?: string;
  partyGstNumber?: string;
  date: string;
  validUntil: string;
  reference?: string;
  salesperson?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  roundOff: number;
  total: number;
  advanceRequested: number;
  status: ProformaStatus;
  notes?: string;
  terms?: string;
  relatedQuotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProcurementStatus = 'Draft' | 'Sent' | 'Partially Received' | 'Fully Received' | 'Cancelled' | 'Closed';

export interface ProcurementOrder extends BaseDeletedEntity {
  id: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  referenceNumber?: string;
  partyId: string;
  partyName: string;
  supplierAddress?: string;
  supplierGstNumber?: string;
  shippingAddress?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  status: ProcurementStatus;
  items: PurchaseLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  additionalCharges: number;
  roundOff: number;
  total: number;
  termsAndConditions?: string;
  internalNotes?: string;
  authorizedSignature?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SalesReturnReason = 'Damaged item' | 'Wrong item supplied' | 'Quality issue' | 'Excess quantity' | 'Customer cancellation' | 'Expired item' | 'Other';
export type ItemCondition = 'Resalable' | 'Damaged' | 'Expired' | 'Non-stock item';

export interface SalesReturnLineItem extends InvoiceLineItem {
  returnQuantity: number;
  reason: SalesReturnReason;
  condition: ItemCondition;
  restockOption: boolean;
}

export interface SalesReturn extends BaseDeletedEntity {
  id: string;
  returnNumber: string;
  returnDate: string;
  partyId: string;
  partyName: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  items: SalesReturnLineItem[];
  totalReturnAmount: number;
  refundMethod?: PaymentMethod;
  creditNoteIssued: boolean;
  creditNoteId?: string;
  notes?: string;
  createdAt: string;
}

export type CreditNoteStatus = 'Draft' | 'Issued' | 'Partially Adjusted' | 'Fully Adjusted' | 'Refunded' | 'Cancelled';

export interface CreditNote extends BaseDeletedEntity {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  partyId: string;
  partyName: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  salesReturnId?: string;
  reason: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  adjustedAmount: number;
  refundAmount: number;
  status: CreditNoteStatus;
  notes?: string;
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

export interface Invoice extends BaseDeletedEntity {
  id: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  invoiceDate: string;
  dueDate: string;
  relatedQuotationId?: string;
  relatedQuotationNumber?: string;
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
  relatedSampleCode?: string;
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

export interface Purchase extends BaseDeletedEntity {
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

export interface Payment extends BaseDeletedEntity {
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

export interface Expense extends BaseDeletedEntity {
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

export type StockMovementType =
  | 'Purchase In'
  | 'Sale Out'
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
  referenceId?: string; // e.g. purchaseId, saleId
  referenceNumber?: string; // e.g. INV-101, PUR-202
  accountId?: string; // if adjustment or return
  user: string;
  notes?: string;
  timestamp: string;
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
  action: string; // e.g. 'Create Party', 'Finalise Invoice', 'Approve Document'
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
    companyName: string;
    legalName: string;
    displayCompanyName: string;
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
  notification: {
    emailPreferences: boolean;
    inAppPreferences: boolean;
    reminderDaysBeforeDue: number;
  };
  security: {
    transactionPinHash?: string; // salted hash
    failedAttempts: number;
    lockUntil?: string;
    protectedActions: string[]; // e.g. ['delete_transaction', 'cancel_invoice']
  };
  whatsappSettings: {
    alternateNumberVerification: boolean;
    requirePinForShare: boolean;
    saveAlternateNumberOption: boolean;
  };
  quotationTypes: {
    id: string;
    enabled: boolean;
    name: string;
    prefix: string;
    startingNumber: number;
    defaultValidityDays: number;
    defaultTerms: string;
    allowTax: boolean;
    allowDiscount: boolean;
  }[];
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
    quotation: DocumentNumberConfig; // Final Quotation
    estimateQuotation: DocumentNumberConfig; // Estimate Quotation
    invoice: DocumentNumberConfig;
    purchase: DocumentNumberConfig;
    receipt: DocumentNumberConfig;
    expense: DocumentNumberConfig;
    procurementOrder: DocumentNumberConfig;
    proformaInvoice: DocumentNumberConfig;
    salesReturn: DocumentNumberConfig;
    creditNote: DocumentNumberConfig;
    paymentReceipt: DocumentNumberConfig;
    paymentVoucher: DocumentNumberConfig;
    creditNoteNumber: DocumentNumberConfig; // duplicate? wait
    debitNote: DocumentNumberConfig;
    stockAdjustment: DocumentNumberConfig;
  };
  print: {
    invoiceTemplate: string;
    quotationTemplate: string;
    receiptTemplate: string;
    purchaseTemplate: string;
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
  communication: {
    whatsapp: {
      enableBusinessApi: boolean;
      accessToken: string;
      permanentAccessToken: string;
      phoneNumberId: string;
      businessAccountId: string;
      webhookVerifyToken: string;
      webhookSecret: string;
      defaultSenderName: string;
      apiVersion: string;
    };
  };
  generalFeatures?: {
    passcodeEnabled: boolean;
    currencyCode: string;
    currencySymbol: string;
    amountDecimalPlaces: number;
    gstinEnabled: boolean;
    stopSaleOnNegativeStock: boolean;
    blockNewItemsFromTransaction: boolean;
    blockNewPartiesFromTransaction: boolean;
    estimateQuotationEnabled: boolean;
    proformaInvoiceEnabled: boolean;
    salesOrderEnabled: boolean;
    procurementOrderEnabled: boolean;
    otherIncomeEnabled: boolean;
    fixedAssetsEnabled: boolean;
    deliveryChallanEnabled: boolean;
    goodsReturnOnDeliveryChallanEnabled: boolean;
    printAmountOnDeliveryChallan: boolean;
    multiCompanyEnabled: boolean;
    autoBackupEnabled: boolean;
    auditTrailEnabled: boolean;
    godownManagementEnabled: boolean;
    screenScale: number;
  };
}

export interface CommunicationLog {
  id: string;
  type: 'WhatsApp' | 'Email' | 'SMS';
  recipient: string;
  recipientNumber: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  subject: string;
  content: string;
  direction: 'Outbound' | 'Inbound';
  timestamp: string;
}

export interface PartyAdjustment {
  id: string;
  partyId: string;
  partyName: string;
  adjustmentDate: string;
  adjustmentType: 'Debit' | 'Credit';
  amount: number;
  referenceNumber: string;
  description: string;
  createdBy: string;
  createdAt: string;
}
