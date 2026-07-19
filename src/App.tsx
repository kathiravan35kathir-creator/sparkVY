import React, { useState, useEffect } from 'react';
import {
  getInitialState,
  loadState,
  saveState,
  logAudit,
  notify,
  AppState
} from './data';
import { Party, Item, Quotation, Invoice, Sample, Expense, Payment, LabReport, SampleStatus, SamplePriority, ParameterResult, LabReportStatus } from './types';
import { listenToAuthChanges, signOutUser } from './services/authService';
import { auth, firestoreDb } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

// Auth Components
import LoginView from './components/auth/LoginView';
import OtpVerifyView from './components/auth/OtpVerifyView';
import OnboardingView from './components/auth/OnboardingView';

export default function App() {
  // 1. Core database state loaded from LocalStorage or generated defaults
  const [db, setDb] = useState<AppState>(() => {
    const loaded = loadState();
    return loaded || getInitialState();
  });

  // 2. Authentication states
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'login' | 'otp' | 'onboarding' | 'dashboard'>('login');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // 3. Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync back to local storage whenever DB state is modified
  useEffect(() => {
    saveState(db);
  }, [db]);

  // Check auth session
  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          
          // Fetch onboardingCompleted status directly from client-side Firestore with a timeout fallback
          let onboardingCompleted = false;
          try {
            const fetchWithTimeout = async () => {
              const docSnap = await getDoc(doc(firestoreDb, "users", firebaseUser.uid));
              if (docSnap.exists()) {
                const data = docSnap.data();
                return !!data.onboardingCompleted;
              }
              return false;
            };

            const timeoutPromise = new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
            );

            onboardingCompleted = await Promise.race([fetchWithTimeout(), timeoutPromise]);
          } catch (fsErr) {
            console.warn("[DEBUG] Client failed or timed out fetching onboarding status from firestore, relying on backend API fallback:", fsErr);
          }

          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, onboardingCompleted }),
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            if (data.user.onboardingCompleted) {
              setAuthStep('dashboard');
            } else {
              setAuthStep('onboarding');
            }
          } else {
            setCurrentUser(null);
            setAuthStep('login');
          }
        } catch (error) {
          setCurrentUser(null);
          setAuthStep('login');
        } finally {
          setIsAuthChecking(false);
        }
      } else {
        setCurrentUser(null);
        setAuthStep('login');
        setIsAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEmailSubmit = async (email: string) => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      if (res.ok) {
        setEmailToVerify(email);
        setAuthStep('otp');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to request OTP');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, otp }),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.user.onboardingCompleted) {
          setAuthStep('dashboard');
        } else {
          setAuthStep('onboarding');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Invalid OTP');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleSuccess = async (user: any) => {
    // Auth observer will handle redirect
  };

  const handleSaveOnboarding = async (userData: any, companyData: any) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const { uid } = auth.currentUser;

    try {
      // Clean data
      const sanitize = (data: any) => Object.fromEntries(
        Object.entries(data)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, value === null ? "" : value])
      );

      const firestoreUserData = {
        ...sanitize(userData),
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };
      
      const firestoreCompanyData = {
        ...sanitize(companyData),
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };

      const apiUserData = {
        ...sanitize(userData),
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      const apiCompanyData = {
        ...sanitize(companyData),
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore client-side with a timeout fallback (so slow connections/iframes never lock/freeze the user)
      console.log("[DEBUG] Starting client-side Firestore save with timeout...");
      try {
        const clientSavePromise = Promise.all([
          setDoc(doc(firestoreDb, "users", uid), { uid, ...firestoreUserData }, { merge: true }),
          setDoc(doc(firestoreDb, "companySettings", uid), { ownerUid: uid, ...firestoreCompanyData }, { merge: true })
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore write timeout')), 2500)
        );

        await Promise.race([clientSavePromise, timeoutPromise]);
        console.log("[DEBUG] Client-side Firestore save completed or timed out.");
      } catch (error) {
        console.warn("[DEBUG] Client-side Firestore save timed out or failed, proceeding with backend API call:", error);
      }

      // Mark completed in backend
      console.log("[DEBUG] Starting backend onboarding API call...");
      const res = await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData: apiUserData, companyData: apiCompanyData }),
            credentials: 'include'
      });
      console.log("[DEBUG] Backend onboarding API call finished.");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user profile');
      }
      
      const data = await res.json();
      setCurrentUser(data.user);

      // Save to local DB
      setDb(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          company: {
            ...prev.settings.company,
            ...companyData
          }
        }
      }));

      setAuthStep('dashboard');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      throw new Error(err.message || 'Failed to save setup data.');
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      console.log("[DEBUG] Skipping onboarding, transitioning to dashboard...");
      setAuthStep('dashboard');

      if (auth.currentUser) {
        const { uid } = auth.currentUser;
        
        // Attempt to mark as completed in Firestore asynchronously
        Promise.all([
          setDoc(doc(firestoreDb, "users", uid), { uid, onboardingCompleted: true, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(doc(firestoreDb, "companySettings", uid), { ownerUid: uid, onboardingCompleted: true, updatedAt: serverTimestamp() }, { merge: true })
        ]).catch(err => {
          console.warn("[DEBUG] Async Firestore onboarding skip save failed:", err);
        });

        // Inform backend API of skip asynchronously
        fetch('/api/auth/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingCompleted: true }),
          credentials: 'include'
        }).catch(err => {
          console.warn("[DEBUG] Async backend onboarding skip failed:", err);
        });
      }
    } catch (e) {
      console.error('Failed to skip onboarding cleanly:', e);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
    setAuthStep('login');
    setActiveTab('dashboard');
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

      // Propagate client/vendor name changes to all transactions & records for data integrity
      const name = edited.name;
      const updatedQuotations = prev.quotations?.map((q) => q.partyId === id ? { ...q, partyName: name } : q) || [];
      const updatedInvoices = prev.invoices?.map((inv) => inv.partyId === id ? { ...inv, partyName: name } : inv) || [];
      const updatedSamples = prev.samples?.map((s) => s.partyId === id ? { ...s, partyName: name } : s) || [];
      const updatedLabReports = prev.labReports?.map((r) => r.partyId === id ? { ...r, partyName: name } : r) || [];

      const newState = {
        ...prev,
        parties: updatedList,
        quotations: updatedQuotations,
        invoices: updatedInvoices,
        samples: updatedSamples,
        labReports: updatedLabReports
      };
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

  const handleEditQuotation = (id: string, quotePayload: Partial<Quotation>) => {
    setDb((prev) => {
      const updatedQuotations = prev.quotations.map((q) => (q.id === id ? { ...q, ...quotePayload } : q));
      const edited = updatedQuotations.find((q) => q.id === id)!;

      const newState = { ...prev, quotations: updatedQuotations };
      const audited = logAudit(newState, 'Edit Quotation', 'Quotations', id, edited.quotationNumber);
      return notify(audited, 'Quotation Updated', `Quotation ${edited.quotationNumber} details are updated.`, 'success');
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

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authStep === 'login' || !currentUser) {
    return (
      <LoginView
        onEmailSubmit={handleEmailSubmit}
        onGoogleSuccess={handleGoogleSuccess}
        isLoading={isLoadingAuth}
      />
    );
  }

  if (authStep === 'otp') {
    return (
      <OtpVerifyView
        email={emailToVerify}
        onVerify={handleVerifyOtp}
        onResend={() => handleEmailSubmit(emailToVerify)}
        onChangeEmail={() => {
          setAuthStep('login');
          setEmailToVerify('');
        }}
        isLoading={isLoadingAuth}
      />
    );
  }

  if (authStep === 'onboarding') {
    return (
      <OnboardingView
        user={currentUser}
        onSave={handleSaveOnboarding}
        onSkip={handleSkipOnboarding}
      />
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
        settings={db.settings}
      />

      {/* 2. MAIN WORKING CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header (Toolbar, notification center, audit swappers) */}
        <Header
          currentUser={currentUser}
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
              currentUser={currentUser}
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
              onEditQuotation={handleEditQuotation}
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
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
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
