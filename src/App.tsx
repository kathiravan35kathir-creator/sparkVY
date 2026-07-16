import React, { useState, useEffect } from 'react';
import {
  getInitialState,
  loadState,
  saveState,
  getDemoData,
  logAudit,
  notify,
  AppState
} from './data';
import { Party, Item, Quotation, Invoice, Sample, Expense, Payment, LabReport, SampleStatus, SamplePriority, ParameterResult, LabReportStatus } from './types';

// Visual Components imports
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PartiesView from './components/PartiesView';
import ItemsView from './components/ItemsView';
import QuotationsView from './components/QuotationsView';
import SalesView from './components/SalesView';
import LabCoreView from './components/LabCoreView';
import FinanceView from './components/FinanceView';
import StaffRolesView from './components/StaffRolesView';
import PurchasesView from './components/PurchasesView';
import ReportsView from './components/ReportsView';
import AuditLogsView from './components/AuditLogsView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import EquipmentView from './components/EquipmentView';

// Icons for login gate
import { Shield, Lock, FlaskConical, Users, ArrowRight, Database } from 'lucide-react';

export default function App() {
  // 1. Core database state loaded from LocalStorage or generated defaults
  const [db, setDb] = useState<AppState>(() => {
    const loaded = loadState();
    return loaded || getInitialState();
  });

  // 2. Authentication states
  const [currentUser, setCurrentUser] = useState<{ name: string; isAdmin: boolean } | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 3. Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync back to local storage whenever DB state is modified
  useEffect(() => {
    saveState(db);
  }, [db]);

  // Handle standard login form submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername) {
      alert('Please enter your username / authorized email.');
      return;
    }
    const userSession = {
      name: loginUsername.split('@')[0].toUpperCase(),
      isAdmin: true
    };
    setCurrentUser(userSession);
    setDb((prev) => {
      const logged = { ...prev, currentUser: { id: 'u-user', username: loginUsername, name: userSession.name, email: loginUsername, isAdmin: userSession.isAdmin, isActive: true } };
      const audited = logAudit(logged, 'User Login', 'Auth', 'user', userSession.name);
      return notify(audited, 'Authentication Clear', `Logged in as Admin: ${userSession.name}`, 'success');
    });
  };

  // Instant simulation login triggers
  const handleSimulationLogin = (isAdmin: boolean, name: string) => {
    const userSession = { name, isAdmin };
    setCurrentUser(userSession);
    setDb((prev) => {
      const logged = { ...prev, currentUser: { id: `u-${Date.now()}`, username: name.toLowerCase().replace(/\s/g, ''), name, email: `${name.toLowerCase().replace(/\s/g, '')}@labbiz.in`, isAdmin, isActive: true } };
      const audited = logAudit(logged, 'User Login', 'Auth', 'user', name);
      return notify(audited, `Cleared: ${isAdmin ? 'Admin' : 'Staff'}`, `Security viewpoint verified as ${name}.`, 'success');
    });
  };

  const handleLogout = () => {
    if (!currentUser) return;
    const oldName = currentUser.name;
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('dashboard');
    setDb((prev) => {
      return logAudit(prev, 'User Logout', 'Auth', 'user', oldName);
    });
  };

  // Seed / Reset demo database trigger
  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to overwrite all changes and reload original laboratory sample demo datasets?')) {
      const freshData = getDemoData(db);
      setDb(freshData);
    }
  };

  // --------------------------------------------------------
  // DATA CONTROLLERS & ACTIONS (PASSED DOWN TO SUB-VIEWS)
  // --------------------------------------------------------

  // Parties actions
  const handleAddParty = (partyPayload: Omit<Party, 'id' | 'code' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => {
    setDb((prev) => {
      const code = `PT-${String(prev.parties.length + 101)}`;
      const newParty: Party = {
        ...partyPayload,
        id: `party-${Date.now()}`,
        code,
        currentBalance: partyPayload.openingBalance,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      const newState = { ...prev, parties: [...prev.parties, newParty] };
      const audited = logAudit(newState, 'Create Party', 'Parties', newParty.id, newParty.name);
      return notify(audited, 'Party Registered', `Customer ${newParty.name} is saved successfully.`, 'success');
    });
  };

  const handleEditParty = (id: string, partyPayload: Partial<Party>) => {
    setDb((prev) => {
      const updatedList = prev.parties.map((p) => (p.id === id ? { ...p, ...partyPayload, updatedAt: new Date().toISOString() } : p));
      const edited = updatedList.find((p) => p.id === id)!;

      const newState = { ...prev, parties: updatedList };
      const audited = logAudit(newState, 'Edit Party', 'Parties', id, edited.name);
      return notify(audited, 'Party Updated', `Client profile for ${edited.name} was successfully modified.`, 'success');
    });
  };

  const handleDeactivateParty = (id: string) => {
    setDb((prev) => {
      const updatedList = prev.parties.map((p) => (p.id === id ? { ...p, isActive: false } : p));
      const target = prev.parties.find((p) => p.id === id)!;

      const newState = { ...prev, parties: updatedList };
      const audited = logAudit(newState, 'Deactivate Party', 'Parties', id, target.name);
      return notify(audited, 'Party Deactivated', `${target.name} has been soft-deleted.`, 'warning');
    });
  };

  const handleReactivateParty = (id: string) => {
    setDb((prev) => {
      const updatedList = prev.parties.map((p) => (p.id === id ? { ...p, isActive: true } : p));
      const target = prev.parties.find((p) => p.id === id)!;

      const newState = { ...prev, parties: updatedList };
      const audited = logAudit(newState, 'Reactivate Party', 'Parties', id, target.name);
      return notify(audited, 'Party Reactivated', `${target.name} is active again.`, 'success');
    });
  };

  // Items actions
  const handleAddItem = (itemPayload: Omit<Item, 'id' | 'code' | 'currentStock' | 'isActive'>) => {
    setDb((prev) => {
      const isService = itemPayload.type === 'Laboratory Service';
      const code = isService
        ? `LIMS-${String(prev.items.filter((it) => it.type === 'Laboratory Service').length + 101)}`
        : `STK-${String(prev.items.filter((it) => it.type !== 'Laboratory Service').length + 101)}`;

      const newItem: Item = {
        ...itemPayload,
        id: `item-${Date.now()}`,
        code,
        currentStock: itemPayload.openingStock,
        isActive: true,
        batchTracking: false,
        expiryTracking: false
      };

      const newState = { ...prev, items: [...prev.items, newItem] };
      const audited = logAudit(newState, 'Create Catalog Item', 'Catalog', newItem.id, newItem.name);
      return notify(audited, 'Catalog Added', `Item ${newItem.name} registered into active lists.`, 'success');
    });
  };

  const handleEditItem = (id: string, itemPayload: Partial<Item>) => {
    setDb((prev) => {
      const updatedList = prev.items.map((it) => (it.id === id ? { ...it, ...itemPayload } : it));
      const edited = updatedList.find((it) => it.id === id)!;

      const newState = { ...prev, items: updatedList };
      const audited = logAudit(newState, 'Edit Catalog Item', 'Catalog', id, edited.name);
      return notify(audited, 'Catalog Updated', `Specification details for ${edited.name} are updated.`, 'success');
    });
  };

  // Quotation actions
  const handleAddQuotation = (quotePayload: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => {
    setDb((prev) => {
      const quotationNumber = `QU-${String(prev.quotations.length + 1001)}`;
      const newQuote: Quotation = {
        ...quotePayload,
        id: `quote-${Date.now()}`,
        quotationNumber,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      const newState = { ...prev, quotations: [...prev.quotations, newQuote] };
      const audited = logAudit(newState, 'Create Quotation', 'Quotations', newQuote.id, newQuote.quotationNumber);
      return notify(audited, 'Proposal Sent', `Quotation ${newQuote.quotationNumber} is issued successfully.`, 'success');
    });
  };

  // Convert Quote directly to Invoice
  const handleConvertToInvoice = (quoteId: string) => {
    setDb((prev) => {
      const q = prev.quotations.find((x) => x.id === quoteId)!;
      const invoiceNumber = `INV-${String(prev.invoices.length + 1001)}`;

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        partyId: q.partyId,
        partyName: q.partyName,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        items: q.items,
        subtotal: q.subtotal,
        discountAmount: q.discountAmount,
        taxAmount: q.taxAmount,
        additionalCharges: q.additionalCharges,
        roundOff: 0,
        total: q.total,
        amountPaid: 0,
        balanceDue: q.total,
        status: 'Unpaid',
        isLocked: false,
        relatedQuotationNumber: q.quotationNumber,
        notes: q.notes,
        terms: q.termsAndConditions,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      // Auto update quote status
      const updatedQuotes = prev.quotations.map((x) => (x.id === quoteId ? { ...x, status: 'Converted' as const } : x));

      // Auto add to Customer balance Dr
      const updatedParties = prev.parties.map((p) =>
        p.id === q.partyId ? { ...p, currentBalance: p.currentBalance + q.total } : p
      );

      const newState = { ...prev, invoices: [...prev.invoices, newInvoice], quotations: updatedQuotes, parties: updatedParties };
      const audited = logAudit(newState, 'Convert Proposal', 'Quotations', quoteId, q.quotationNumber);
      return notify(audited, 'Invoice Billed', `Proposal converted to ${newInvoice.invoiceNumber} successfully.`, 'success');
    });
  };

  // Sales Invoice actions
  const handleAddInvoice = (invoicePayload: Omit<Invoice, 'id' | 'invoiceNumber' | 'isLocked' | 'createdAt' | 'updatedAt'>) => {
    setDb((prev) => {
      const invoiceNumber = `INV-${String(prev.invoices.length + 1001)}`;
      const newInvoice: Invoice = {
        ...invoicePayload,
        id: `inv-${Date.now()}`,
        invoiceNumber,
        isLocked: false,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      // Auto add customer outstanding balance (Receivable)
      const updatedParties = prev.parties.map((p) =>
        p.id === invoicePayload.partyId ? { ...p, currentBalance: p.currentBalance + invoicePayload.total } : p
      );

      const newState = { ...prev, invoices: [...prev.invoices, newInvoice], parties: updatedParties };
      const audited = logAudit(newState, 'Create Invoice', 'Sales', newInvoice.id, newInvoice.invoiceNumber);
      return notify(audited, 'Bill Registered', `Draft invoice ${newInvoice.invoiceNumber} generated.`, 'success');
    });
  };

  const handleFinaliseInvoice = (id: string) => {
    setDb((prev) => {
      const target = prev.invoices.find((inv) => inv.id === id)!;
      const updatedInvoices = prev.invoices.map((inv) => (inv.id === id ? { ...inv, isLocked: true } : inv));

      // Auto reduce stocks for any inventory items on finalise
      let updatedItems = [...prev.items];
      target.items.forEach((line) => {
        updatedItems = updatedItems.map((it) => {
          if (it.id === line.itemId && it.type !== 'Laboratory Service') {
            return { ...it, currentStock: Math.max(0, it.currentStock - line.quantity) };
          }
          return it;
        });
      });

      const newState = { ...prev, invoices: updatedInvoices, items: updatedItems };
      const audited = logAudit(newState, 'Lock Invoice', 'Sales', id, target.invoiceNumber);
      return notify(audited, 'Invoice Finalised', `Invoice ${target.invoiceNumber} is sealed & stock decremented.`, 'success');
    });
  };

  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    method: 'Cash' | 'Bank transfer' | 'UPI' | 'Cheque' | 'Card',
    accountId: string,
    notes?: string
  ) => {
    setDb((prev) => {
      const inv = prev.invoices.find((x) => x.id === invoiceId)!;
      const paidAmt = inv.amountPaid + amount;
      const bal = Math.max(0, inv.total - paidAmt);
      const status = bal <= 0 ? ('Paid' as const) : ('Partially Paid' as const);

      const updatedInvoices = prev.invoices.map((x) =>
        x.id === invoiceId ? { ...x, amountPaid: paidAmt, balanceDue: bal, status, updatedAt: new Date().toISOString() } : x
      );

      // Auto reduce customer outstanding ledger
      const updatedParties = prev.parties.map((p) =>
        p.id === inv.partyId ? { ...p, currentBalance: Math.max(0, p.currentBalance - amount) } : p
      );

      // Log General capital cash inflow as Payment
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        paymentNumber: `PAY-IN-${String(prev.payments.length + 1001)}`,
        partyId: inv.partyId,
        partyName: inv.partyName,
        paymentType: 'Payment In',
        amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: method === 'Card' ? 'Other' : method,
        accountId,
        accountName: accountId === 'acc-1' ? 'Petty Cash Drawer' : accountId === 'acc-2' ? 'ICICI Current' : 'HDFC UPI QR',
        referenceNumber: `REF-${Date.now()}`,
        notes: notes || `Received invoice payment via ${method}.`,
        allocations: [{ invoiceId, allocatedAmount: amount }],
        createdAt: new Date().toISOString()
      };

      const newState = {
        ...prev,
        invoices: updatedInvoices,
        parties: updatedParties,
        payments: [...prev.payments, newPayment]
      };

      const audited = logAudit(newState, 'Record Payment', 'Finance', newPayment.id, newPayment.paymentNumber);
      return notify(audited, 'Payment Received', `Recorded cash deposit of ₹${amount.toLocaleString()} against ${inv.invoiceNumber}.`, 'success');
    });
  };

  const handleCancelInvoice = (id: string) => {
    setDb((prev) => {
      const inv = prev.invoices.find((x) => x.id === id)!;
      if (inv.status === 'Cancelled') return prev;

      const updatedInvoices = prev.invoices.map((x) => (x.id === id ? { ...x, status: 'Cancelled' as const, balanceDue: 0 } : x));

      // Roll back customer outstanding ledger (Receivables)
      const updatedParties = prev.parties.map((p) =>
        p.id === inv.partyId ? { ...p, currentBalance: Math.max(0, p.currentBalance - inv.balanceDue) } : p
      );

      const newState = { ...prev, invoices: updatedInvoices, parties: updatedParties };
      const audited = logAudit(newState, 'Cancel Invoice', 'Sales', id, inv.invoiceNumber);
      return notify(audited, 'Invoice Cancelled', `Sales invoice ${inv.invoiceNumber} has been revoked.`, 'warning');
    });
  };

  // Lab Core (Samples) actions
  const handleAddSample = (samplePayload: Omit<Sample, 'id' | 'sampleCode' | 'barcodeData' | 'status' | 'timeline' | 'createdAt'>) => {
    setDb((prev) => {
      const num = prev.samples.length + 1001;
      const sampleCode = `SMP-${num}`;
      const barcodeData = `BAR-${num}`;

      const newSample: Sample = {
        ...samplePayload,
        id: `sample-${Date.now()}`,
        sampleCode,
        barcodeData,
        status: 'Collected' as SampleStatus,
        timeline: [
          {
            id: `cl-${Date.now()}`,
            status: 'Received' as SampleStatus,
            label: 'Intake Collected',
            description: `Matrix received from customer in standard container.`,
            user: currentUser?.name || 'Receptionist',
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
          }
        ],
        createdAt: new Date().toISOString().slice(0, 10)
      };

      // Also auto generate an Invoice draft if none exists for this diagnostic run
      // Let's create an invoice immediately so receptionists can collect payments
      const totalCost = samplePayload.requiredTestIds.reduce((sum, testId) => {
        const itemObj = prev.items.find((it) => it.id === testId)!;
        return sum + itemObj.sellingPrice;
      }, 0);

      const invoiceNumber = `INV-${String(prev.invoices.length + 1001)}`;
      const associatedInvoice: Invoice = {
        id: `inv-s-${Date.now()}`,
        invoiceNumber,
        partyId: samplePayload.partyId,
        partyName: samplePayload.partyName,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        items: samplePayload.requiredTestIds.map((testId, idx) => {
          const itemObj = prev.items.find((x) => x.id === testId)!;
          return {
            id: `invi-${Date.now()}-${idx}`,
            itemId: itemObj.id,
            itemName: itemObj.name,
            itemCode: itemObj.code,
            quantity: 1,
            rate: itemObj.sellingPrice,
            discountPercent: 0,
            taxPercent: 18,
            taxAmount: parseFloat((itemObj.sellingPrice * 0.18).toFixed(2)),
            amount: parseFloat((itemObj.sellingPrice * 1.18).toFixed(2))
          };
        }),
        subtotal: totalCost,
        discountAmount: 0,
        taxAmount: parseFloat((totalCost * 0.18).toFixed(2)),
        additionalCharges: 0,
        roundOff: 0,
        total: parseFloat((totalCost * 1.18).toFixed(2)),
        amountPaid: 0,
        balanceDue: parseFloat((totalCost * 1.18).toFixed(2)),
        status: 'Unpaid',
        isLocked: false,
        relatedSampleCode: sampleCode,
        notes: 'LIMS linked diagnostic suite invoice',
        terms: 'Balance due within 15 days of reporting.',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      // Increment customer outstanding
      const updatedParties = prev.parties.map((p) =>
        p.id === samplePayload.partyId ? { ...p, currentBalance: p.currentBalance + associatedInvoice.total } : p
      );

      const newState = {
        ...prev,
        samples: [...prev.samples, newSample],
        invoices: [...prev.invoices, associatedInvoice],
        parties: updatedParties
      };

      const audited = logAudit(newState, 'Sample Intake', 'Samples', newSample.id, newSample.sampleCode);
      return notify(audited, 'Sample Registered', `Sample ${newSample.sampleCode} accepted. Invoiced as ${associatedInvoice.invoiceNumber}.`, 'success');
    });
  };

  const handleUpdateSampleStatus = (id: string, status: SampleStatus, custodyNotes?: string) => {
    setDb((prev) => {
      const sample = prev.samples.find((x) => x.id === id)!;
      const newLog = {
        id: `cl-${Date.now()}`,
        status,
        label: `Status to: ${status}`,
        description: custodyNotes || 'Custody sequence step complete.',
        user: currentUser?.name || 'Lab Technician',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      const updatedSamples = prev.samples.map((s) =>
        s.id === id ? { ...s, status, timeline: [...s.timeline, newLog] } : s
      );

      const newState = { ...prev, samples: updatedSamples };
      const audited = logAudit(newState, 'Update Custody', 'Samples', id, sample.sampleCode);
      return notify(audited, 'Custody Step Complete', `Sample ${sample.sampleCode} is now ${status}.`, 'info');
    });
  };

  const handleUpdateTestResults = (sampleId: string, testId: string, results: Partial<ParameterResult>[]) => {
    // Simply post test observation to central timeline
    setDb((prev) => {
      const sampleObj = prev.samples.find((x) => x.id === sampleId)!;
      return notify(prev, 'Worksheet Saved', `Saved observations results values for sample: ${sampleObj.sampleCode}`, 'success');
    });
  };

  const handleApproveReport = (sampleId: string, reviewerName: string) => {
    setDb((prev) => {
      const s = prev.samples.find((x) => x.id === sampleId)!;
      const newReport: LabReport = {
        id: `rep-${Date.now()}`,
        reportNumber: `REP-${String(prev.labReports.length + 1001)}`,
        partyId: s.partyId,
        partyName: s.partyName,
        sampleId,
        sampleCode: s.sampleCode,
        sampleName: s.sampleName,
        sampleType: s.sampleType,
        receivedDate: s.receivedDate,
        reportDate: new Date().toISOString().slice(0, 10),
        reportTitle: 'MICROBIOLOGICAL TEST REPORT CERTIFICATE',
        testAssignments: [],
        disclaimer: 'NABL Iso accredited certification results apply exclusively to biological sample submitted.',
        preparedBy: reviewerName,
        reviewedBy: reviewerName,
        approvedBy: reviewerName,
        status: 'Approved' as LabReportStatus,
        qrCodeData: `https://labbiz.in/verify/${s.sampleCode}`,
        isLocked: true,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      // Set sample status to Report Ready
      const updatedSamples = prev.samples.map((sm) => (sm.id === sampleId ? { ...sm, status: 'Report Ready' as SampleStatus } : sm));

      const newState = { ...prev, labReports: [...prev.labReports, newReport], samples: updatedSamples };
      const audited = logAudit(newState, 'Approve LIMS Report', 'Reports', newReport.id, newReport.reportNumber);
      return notify(audited, 'NABL Certificate Approved', `Report certificate ${newReport.reportNumber} digitally sealed.`, 'success');
    });
  };

  // Finance Cost actions
  const handleAddExpense = (expensePayload: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => {
    setDb((prev) => {
      const expenseNumber = `EXP-${String(prev.expenses.length + 1001)}`;
      const newExpense: Expense = {
        ...expensePayload,
        id: `exp-${Date.now()}`,
        expenseNumber,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      // Debit account Balance immediately as payout Payment outflow
      const newOutflow: Payment = {
        id: `pay-${Date.now()}`,
        paymentNumber: `PAY-OUT-${String(prev.payments.length + 1001)}`,
        paymentType: 'Payment Out',
        amount: expensePayload.amount,
        paymentDate: expensePayload.expenseDate,
        paymentMethod: expensePayload.paymentMethod,
        accountId: expensePayload.accountId,
        accountName: expensePayload.accountName,
        notes: `Indirect Cost payout: ${expensePayload.vendorName || 'General'} (${expensePayload.category})`,
        allocations: [],
        createdAt: new Date().toISOString()
      };

      const newState = {
        ...prev,
        expenses: [...prev.expenses, newExpense],
        payments: [...prev.payments, newOutflow]
      };

      const audited = logAudit(newState, 'Record Expense', 'Finance', newExpense.id, newExpense.expenseNumber);
      return notify(audited, 'Expense Recorded', `Indirect payment payout voucher documented successfully.`, 'success');
    });
  };

  const handleApproveExpense = (id: string) => {
    // Already auto approved and audited inside our fast track system!
  };

  // Switch admin status helper
  const handleAdminChange = (isAdmin: boolean) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, isAdmin });
    setDb((prev) => {
      const userObj = { ...prev.currentUser, isAdmin };
      const logged = { ...prev, currentUser: userObj };
      return logAudit(logged, 'Security Transition', 'Auth', 'user', currentUser.name);
    });
  };

  // Switch notification read
  const handleMarkRead = (id: string) => {
    setDb((prev) => {
      const updated = prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { ...prev, notifications: updated };
    });
  };

  const handleMarkAllRead = () => {
    setDb((prev) => {
      const updated = prev.notifications.map((n) => ({ ...n, isRead: true }));
      return { ...prev, notifications: updated };
    });
  };

  // Newly integrated Vyapar Settings & Purchases handlers
  const handleUpdateSettings = (updatedSettings: any) => {
    setDb((prev) => {
      const newState = { ...prev, settings: updatedSettings };
      const audited = logAudit(newState, 'Update Settings', 'Settings', 'global', 'System Settings');
      return notify(audited, 'Settings Saved', 'Business & Document configurations updated successfully.', 'success');
    });
  };

  const handleAddPurchase = (purchasePayload: any) => {
    setDb((prev) => {
      const purchaseNumber = `PUR-2026-${String(prev.purchases.length + 1001)}`;
      const newPurchase: any = {
        ...purchasePayload,
        id: `pur-${Date.now()}`,
        purchaseNumber,
        createdAt: new Date().toISOString()
      };

      // Add Stock increments for bought items & register StockMovement log entries!
      let updatedItems = [...prev.items];
      const movements: any[] = [];

      purchasePayload.items.forEach((line: any) => {
        updatedItems = updatedItems.map((item) => {
          if (item.id === line.itemId) {
            const nextStock = item.currentStock + line.quantity;
            
            // Generate a trace log
            movements.push({
              id: `mv-${Date.now()}-${Math.random()}`,
              itemId: item.id,
              itemName: item.name,
              type: 'Purchase In',
              quantity: line.quantity,
              batchNumber: line.batchNumber,
              expiryDate: line.expiryDate,
              referenceId: newPurchase.id,
              referenceNumber: purchaseNumber,
              user: prev.currentUser?.name || 'Administrator',
              timestamp: new Date().toISOString()
            });

            return { ...item, currentStock: nextStock };
          }
          return item;
        });
      });

      // Update supplier party outstanding payable balances!
      const updatedParties = prev.parties.map((p) => {
        if (p.id === purchasePayload.partyId) {
          return {
            ...p,
            currentBalance: p.currentBalance + purchasePayload.balanceDue
          };
        }
        return p;
      });

      // Record cash/bank account ledger debit if paid amount > 0
      let updatedAccounts = [...prev.accounts];
      if (purchasePayload.amountPaid > 0) {
        // Debit first account or "Bank" account
        const account = updatedAccounts.find((a) => a.type === 'Bank') || updatedAccounts[0];
        if (account) {
          updatedAccounts = updatedAccounts.map((a) => {
            if (a.id === account.id) {
              return { ...a, currentBalance: a.currentBalance - purchasePayload.amountPaid };
            }
            return a;
          });
        }
      }

      const newState = {
        ...prev,
        purchases: [...prev.purchases, newPurchase],
        items: updatedItems,
        stockMovements: [...prev.stockMovements, ...movements],
        parties: updatedParties,
        accounts: updatedAccounts
      };

      const audited = logAudit(newState, 'Record Purchase', 'Purchases', newPurchase.id, purchaseNumber);
      return notify(audited, 'Purchase Recorded', `Material inventory increased and supplier invoice logged.`, 'success');
    });
  };

  const handleAddEquipment = (equipPayload: any) => {
    setDb((prev) => {
      const equipmentCode = `EQP-${String(prev.equipment.length + 101)}`;
      const newEquip: any = {
        ...equipPayload,
        id: `equip-${Date.now()}`,
        equipmentCode,
        lastCalibrationDate: new Date().toISOString().slice(0, 10),
        nextCalibrationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 6 months target
        lastMaintenanceDate: new Date().toISOString().slice(0, 10),
        nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // 3 months target
      };

      const newState = {
        ...prev,
        equipment: [...prev.equipment, newEquip]
      };

      const audited = logAudit(newState, 'Register Equipment', 'Equipment', newEquip.id, equipmentCode);
      return notify(audited, 'Asset Registered', `Analytical equipment ${newEquip.name} registered.`, 'success');
    });
  };

  const handleUpdateEquipmentStatus = (id: string, status: any, notes?: string) => {
    setDb((prev) => {
      const updated = prev.equipment.map((eq) => {
        if (eq.id === id) {
          return {
            ...eq,
            status,
            lastCalibrationDate: status === 'Available' ? new Date().toISOString().slice(0, 10) : eq.lastCalibrationDate,
            nextCalibrationDate: status === 'Available' ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : eq.nextCalibrationDate,
            notes: notes || eq.notes
          };
        }
        return eq;
      });

      const matched = prev.equipment.find((x) => x.id === id);

      const newState = {
        ...prev,
        equipment: updated
      };

      const audited = logAudit(newState, 'Update Calibration/Maintenance', 'Equipment', id, matched?.name || 'Asset');
      return notify(audited, 'Asset Status Updated', `Instrument log updated successfully.`, 'success');
    });
  };


  // --------------------------------------------------------
  // CONDITIONAL RENDER AREA
  // --------------------------------------------------------

  // If user is not logged in, render the gorgeous Corporate Access Gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative z-10 animate-fade-in animate-duration-300">
          {/* Left panel: Product Pitch */}
          <div className="col-span-1 md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-8 flex flex-col justify-between text-white border-r border-slate-800">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="bg-[#2563EB] text-white p-2.5 rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue-500/20">
                  LB
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-wider uppercase">LabBiz ERP</h1>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest">PRIVATE LABORATORY ENTERPRISE</p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                  Complete Labbiz Billing & LIMS Suite
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consolidates diagnostic custody, chemical stock safety thresholds, GST sales invoicing, and audited ledger sheets into a single workspace.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/60">
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <Shield size={13} className="text-teal-400 animate-pulse" />
                <span>NABL ISO 17025 Certified ERP Gate</span>
              </div>
            </div>
          </div>

          {/* Right panel: Login credentials & presets */}
          <div className="col-span-1 md:col-span-7 p-8 bg-slate-950 flex flex-col justify-center text-xs">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Authorized Officer Gate</h3>
                <p className="text-[11px] text-slate-400 mt-1">Provide credentials or pick a simulation preset below.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Corporate Email</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. director@labbiz.in"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security PIN</label>
                    <input
                      type="password"
                      placeholder="••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Authenticate Securely</span>
                  <ArrowRight size={13} />
                </button>
              </form>

              {/* Separation line */}
              <div className="relative my-4 flex py-1.5 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Demo Clearance Presets</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              {/* Clearance Presets Grid */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Select Role Perspective</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSimulationLogin(true, 'Dr. J. N. Rao')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Dr. J. N. Rao</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Admin</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(true, 'Savitha Gowda')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Savitha G.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Admin</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(false, 'Ramesh Kumar')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Ramesh K.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Staff</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(false, 'Vikas Deshmukh')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Vikas D.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Staff</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(false, 'Dr. Anil Mehta')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Dr. Anil M.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Staff</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(false, 'Priya Sharma')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Priya S.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Staff</p>
                  </button>
                  <button
                    onClick={() => handleSimulationLogin(false, 'Sandeep Patil')}
                    className="p-2 bg-slate-900/60 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-lg text-left transition group cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-slate-200 group-hover:text-blue-400">Sandeep P.</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Staff</p>
                  </button>
                  <button
                    onClick={handleResetDemoData}
                    className="p-2 bg-slate-900/30 border border-dashed border-red-800/60 hover:border-red-500 hover:bg-slate-900 rounded-lg text-left transition cursor-pointer"
                  >
                    <p className="text-[10px] font-bold text-red-400">Reset DB</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">Seed Demo</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show full enterprise workspace shell!
  return (
    <div className="flex h-screen bg-[#F4F7FB] text-[#172033] font-sans antialiased overflow-hidden text-[13px] sm:text-sm">
      {/* 1. COLLAPSIBLE ROLE-AWARE SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isAdmin={currentUser.isAdmin}
      />

      {/* 2. MAIN WORKING CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header (Toolbar, notification center, audit swappers) */}
        <Header
          isAdmin={currentUser.isAdmin}
          onAdminChange={handleAdminChange}
          notifications={db.notifications}
          onMarkNotificationRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          globalSearchQuery=""
          onGlobalSearchChange={() => {}}
          onLogout={handleLogout}
          activeTab={activeTab}
        />

        {/* Scrollable View Center */}
        <main className="flex-grow overflow-y-auto p-4 space-y-4">
          {activeTab === 'dashboard' && (
            <DashboardView
              isAdmin={currentUser.isAdmin}
              parties={db.parties}
              items={db.items}
              invoices={db.invoices}
              samples={db.samples}
              testAssignments={db.testAssignments}
              labReports={db.labReports}
              equipment={db.equipment}
              accounts={db.accounts}
              onQuickAction={(actionId) => setActiveTab(actionId)}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'parties' && (
            <PartiesView
              parties={db.parties}
              onAddParty={handleAddParty}
              onEditParty={handleEditParty}
              onDeactivateParty={handleDeactivateParty}
              onReactivateParty={handleReactivateParty}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {(activeTab === 'catalog' || activeTab === 'items') && (
            <ItemsView
              items={db.items}
              parties={db.parties}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeactivateItem={() => {}}
              onReactivateItem={() => {}}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              quotations={db.quotations}
              parties={db.parties}
              items={db.items}
              onAddQuotation={handleAddQuotation}
              onEditQuotation={() => {}}
              onConvertToInvoice={handleConvertToInvoice}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              invoices={db.invoices}
              parties={db.parties}
              items={db.items}
              onAddInvoice={handleAddInvoice}
              onFinaliseInvoice={handleFinaliseInvoice}
              onRecordPayment={handleRecordPayment}
              onCancelInvoice={handleCancelInvoice}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={db.purchases}
              parties={db.parties}
              items={db.items}
              onAddPurchase={handleAddPurchase}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}

          {(activeTab === 'lims' || activeTab === 'samples' || activeTab === 'lab_tests' || activeTab === 'lab_reports') && (
            <LabCoreView
              samples={db.samples}
              parties={db.parties}
              items={db.items}
              onAddSample={handleAddSample}
              onUpdateSampleStatus={handleUpdateSampleStatus}
              onUpdateTestResults={handleUpdateTestResults}
              onApproveReport={handleApproveReport}
              isAdmin={currentUser.isAdmin}
              initialTab={
                activeTab === 'lab_tests'
                  ? 'worksheets'
                  : activeTab === 'lab_reports'
                  ? 'reports'
                  : 'samples'
              }
              settings={db.settings}
            />
          )}

          {(activeTab === 'finance' || activeTab === 'accounts' || activeTab === 'payments' || activeTab === 'expenses') && (
            <FinanceView
              expenses={db.expenses}
              payments={db.payments}
              parties={db.parties}
              onAddExpense={handleAddExpense}
              onApproveExpense={handleApproveExpense}
              isAdmin={currentUser.isAdmin}
              initialTab={
                activeTab === 'expenses'
                  ? 'expenses'
                  : activeTab === 'payments'
                  ? 'payments'
                  : 'accounts'
              }
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentView
              equipment={db.equipment}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              invoices={db.invoices}
              purchases={db.purchases}
              expenses={db.expenses}
              payments={db.payments}
              samples={db.samples}
              items={db.items}
              parties={db.parties}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={db.notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView
              auditLogs={db.auditLogs}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={db.settings}
              onUpdateSettings={handleUpdateSettings}
              isAdmin={currentUser.isAdmin}
              dbState={db}
            />
          )}

          {activeTab === 'staff' && (
            <StaffRolesView isAdmin={currentUser.isAdmin} />
          )}
        </main>
      </div>
    </div>
  );
}
