import React, { useState, useEffect } from 'react';
import {
  getInitialState,
  loadState,
  saveState,
  logAudit,
  notify,
  AppState
} from './data';
import { Party, Item, Quotation, Invoice, Expense, Payment, ProformaInvoice, ProformaStatus, ProcurementOrder, ProcurementStatus, SalesReturn, CreditNote, CreditNoteStatus, StockMovement, PaymentMethod, CommunicationLog } from './types';
import { listenToAuthChanges, signOutUser } from './services/authService';
import { auth, firestoreDb } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

import { CompanyBrandingProvider } from './context/CompanyBrandingContext';

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

export function sanitizeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    // If string is a raw image base64 data URL string over 150,000 characters (~110KB),
    // strip it to prevent breaking Firestore's 1MB document limit.
    if (obj.startsWith('data:image/') && obj.length > 150000) {
      console.warn('[Firestore Guard] Stripping oversized image base64 string to keep document under 1MB limit');
      return '';
    }
    return obj;
  }
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(item => item === undefined ? null : sanitizeFirestoreData(item));
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = sanitizeFirestoreData(val);
    }
  }
  return clean;
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
import PartyLedgerHomeView from './components/PartyLedgerHomeView';
import ItemsView from './components/ItemsView';
import QuotationsView from './components/QuotationsView';
import ProformaInvoicesView from './components/ProformaInvoicesView';
import SalesView from './components/SalesView';
import SalesReturnsView from './components/SalesReturnsView';
import CreditNotesView from './components/CreditNotesView';
import ProcurementOrdersView from './components/ProcurementOrdersView';
import PurchasesView from './components/PurchasesView';
import PaymentsView from './components/PaymentsView';
import FinanceView from './components/FinanceView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import TrashView from './components/TrashView';
import SecurityPinDialog from './components/SecurityPinDialog';
import CommandPaletteModal from './components/CommandPaletteModal';
// Auth Components
import LoginView from './components/auth/LoginView';
import OnboardingView from './components/auth/OnboardingView';

export default function App() {
  // Ref to prevent circular updates between onSnapshot listener and state sync effect
  const lastSavedStrRef = React.useRef<string>("");
  // Ref to track if data has been initially hydrated from Firestore
  const isFirestoreLoadedRef = React.useRef<boolean>(false);

  // 1. Core database state loaded from LocalStorage or generated defaults
  const [db, setDb] = useState<AppState>(() => {
    const loaded = loadState();
    return loaded || getInitialState();
  });

  // Security PIN State
  const [pinAction, setPinAction] = useState<{ name: string; onConfirm: () => void } | null>(null);

  const checkPin = (action: string, onConfirm: () => void) => {
    // If passcode is explicitly disabled, bypass immediately
    if (db.settings.generalFeatures?.passcodeEnabled === false) {
      onConfirm();
      return;
    }
    // If passcode is enabled, enforce security checks
    if (db.settings.generalFeatures?.passcodeEnabled || (db.settings.security.protectedActions.includes(action) && db.settings.security.transactionPinHash)) {
      setPinAction({ name: action, onConfirm });
    } else {
      onConfirm();
    }
  };

  // 2. Authentication states
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'login' | 'onboarding' | 'dashboard'>('login');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // 3. Navigation & Search states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Apply Screen Scale globally to document root whenever changed
  useEffect(() => {
    const scale = db.settings.generalFeatures?.screenScale || 100;
    document.documentElement.setAttribute('data-app-scale', String(scale));
    document.documentElement.style.setProperty('--app-scale', String(scale / 100));
  }, [db.settings.generalFeatures?.screenScale]);

  // Direct Route Protection: redirect away from disabled feature tabs
  useEffect(() => {
    const gf = db.settings.generalFeatures;
    if (!gf) return;
    if (activeTab === 'quotations' && gf.estimateQuotationEnabled === false) {
      setActiveTab('dashboard');
    } else if (activeTab === 'proforma' && gf.proformaInvoiceEnabled === false) {
      setActiveTab('dashboard');
    } else if (activeTab === 'procurement' && gf.procurementOrderEnabled === false) {
      setActiveTab('dashboard');
    }
  }, [activeTab, db.settings.generalFeatures]);

  // Sync back to local storage and Firestore whenever DB state is modified
  useEffect(() => {
    if (!currentUser?.id) {
      saveState(db, currentUser?.id);
      return;
    }

    // CRITICAL FIX: Do NOT sync to Firestore until Firestore has finished initial load
    if (!isFirestoreLoadedRef.current) {
      saveState(db, currentUser.id);
      return;
    }

    const serialized = JSON.stringify(db);
    if (serialized !== lastSavedStrRef.current) {
      lastSavedStrRef.current = serialized;
      saveState(db, currentUser.id);

      const syncToFirestore = async () => {
        try {
          await setDoc(doc(firestoreDb, "appData", currentUser.id), sanitizeFirestoreData(db));
        } catch (err) {
          console.error("Failed to sync state to Firestore:", err);
          handleFirestoreError(err, OperationType.WRITE, `appData/${currentUser.id}`);
        }
      };
      syncToFirestore();
    }
  }, [db, currentUser?.id]);

  // Check auth session
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribe = listenToAuthChanges(async (firebaseUser) => {
      // Clean up previous subscription if any
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore directly
          let onboardingCompleted = false;
          let userDocData: any = null;
          try {
            const docSnap = await getDoc(doc(firestoreDb, "users", firebaseUser.uid));
            if (docSnap.exists()) {
              userDocData = docSnap.data();
              onboardingCompleted = !!userDocData.onboardingCompleted;
            } else {
              // Create initial profile for first-time user
              const pendingFullName = localStorage.getItem(`pending_full_name_${firebaseUser.uid}`) || '';
              const initialData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                full_name: firebaseUser.displayName || pendingFullName || '',
                profile_photo: firebaseUser.photoURL || '',
                provider: firebaseUser.providerData[0]?.providerId || 'password',
                onboardingCompleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              await setDoc(doc(firestoreDb, "users", firebaseUser.uid), sanitizeFirestoreData(initialData), { merge: true });
              userDocData = initialData;
            }
          } catch (fsErr) {
            console.warn("[DEBUG] Failed to fetch onboarding status from firestore:", fsErr);
            // Ignore error, onboardingCompleted remains false
          }

          const pendingFullName = localStorage.getItem(`pending_full_name_${firebaseUser.uid}`) || '';
          // Build a client-side user object since we bypass the backend
          const userObj = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: userDocData?.full_name || firebaseUser.displayName || pendingFullName || '',
            profile_photo: userDocData?.profile_photo || firebaseUser.photoURL || '',
            onboardingCompleted: onboardingCompleted,
            isAdmin: true // Simplified for now
          };

          setCurrentUser(userObj);

          // Realtime snapshot listener for ERP data from Firestore
          const appDataRef = doc(firestoreDb, "appData", firebaseUser.uid);
          unsubscribeSnapshot = onSnapshot(appDataRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as AppState;
              const serialized = JSON.stringify(data);
              lastSavedStrRef.current = serialized;
              setDb(data);
              saveState(data, firebaseUser.uid);
              isFirestoreLoadedRef.current = true;
            } else {
              // Document does not exist yet. Initialize from LocalStorage or getInitialState()
              const initialData = loadState(firebaseUser.uid) || getInitialState();
              const serialized = JSON.stringify(initialData);
              lastSavedStrRef.current = serialized;
              setDb(initialData);
              saveState(initialData, firebaseUser.uid);
              isFirestoreLoadedRef.current = true;
              // Save to Firestore so it exists
              setDoc(appDataRef, sanitizeFirestoreData(initialData)).catch(err => {
                console.error("Failed to initialize appData document:", err);
                handleFirestoreError(err, OperationType.WRITE, `appData/${firebaseUser.uid}`);
              });
            }
          }, (err) => {
            console.error("appData onSnapshot error:", err);
            // Fallback to local storage if permission is denied or missing
            const fallbackData = loadState(firebaseUser.uid) || getInitialState();
            setDb(fallbackData);
            isFirestoreLoadedRef.current = true;
          });
          
          if (onboardingCompleted) {
            setAuthStep('dashboard');
          } else {
            setAuthStep('onboarding');
          }
        } catch (error) {
          console.error("Auth check error:", error);
          setCurrentUser(null);
          setAuthStep('login');
        } finally {
          setIsAuthChecking(false);
        }
      } else {
        isFirestoreLoadedRef.current = false;
        lastSavedStrRef.current = "";
        setCurrentUser(null);
        setAuthStep('login');
        setIsAuthChecking(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleGoogleSuccess = async (user: any) => {
    // Auth observer will handle redirect
  };

  const handleSaveOnboarding = async (userData: any, companyData: any) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const { uid, email, displayName, photoURL } = auth.currentUser;

    try {
      // Clean data
      const sanitize = (data: any) => Object.fromEntries(
        Object.entries(data)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, value === null ? "" : value])
      );

      const firestoreUserData = {
        ...sanitize(userData),
        email: email || '',
        full_name: displayName || userData?.full_name || '',
        profile_photo: photoURL || '',
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };
      
      const firestoreCompanyData = {
        ...sanitize(companyData),
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };

      // Save to Firestore directly
      console.log("[DEBUG] Saving onboarding data to Firestore...");
      await Promise.all([
        setDoc(doc(firestoreDb, "users", uid), sanitizeFirestoreData({ uid, ...firestoreUserData }), { merge: true }),
        setDoc(doc(firestoreDb, "companySettings", uid), sanitizeFirestoreData({ ownerUid: uid, ...firestoreCompanyData }), { merge: true })
      ]);
      console.log("[DEBUG] Firestore save completed.");

      // Update local state
      const newUserObj = {
        id: uid,
        email: email || '',
        full_name: firestoreUserData.full_name,
        profile_photo: firestoreUserData.profile_photo,
        onboardingCompleted: true,
        isAdmin: true
      };
      setCurrentUser(newUserObj);

      // Save to local DB (for offline state fallback)
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
        const { uid, email, displayName, photoURL } = auth.currentUser;
        
        // Attempt to mark as completed in Firestore asynchronously
        Promise.all([
          setDoc(doc(firestoreDb, "users", uid), { uid, email: email||'', full_name: displayName||'', profile_photo: photoURL||'', onboardingCompleted: true, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(doc(firestoreDb, "companySettings", uid), { ownerUid: uid, onboardingCompleted: true, updatedAt: serverTimestamp() }, { merge: true })
        ]).catch(err => {
          console.warn("[DEBUG] Async Firestore onboarding skip save failed:", err);
        });

        const newUserObj = {
          id: uid,
          email: email || '',
          full_name: displayName || '',
          profile_photo: photoURL || '',
          onboardingCompleted: true,
          isAdmin: true
        };
        setCurrentUser(newUserObj);
      }
    } catch (e) {
      console.error('Failed to skip onboarding cleanly:', e);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    isFirestoreLoadedRef.current = false;
    lastSavedStrRef.current = "";
    setCurrentUser(null);
    setDb(getInitialState());
    setAuthStep('login');
    setActiveTab('dashboard');
  };

  // Helper to generate next document number
  const generateDocumentNumber = (config: any) => {
    const year = new Date().getFullYear().toString().substring(2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const num = String(config.currentNumber).padStart(config.minDigitLength, '0');
    
    let result = config.prefix;
    if (config.includeFinancialYear) result += `FY${year}/`;
    if (config.includeMonth) result += `${month}/`;
    result += num;
    return result;
  };

  const addAuditLog = (module: string, action: string) => {
    setDb(prev => {
      const newState = logAudit(prev, action, module, 'system', currentUser?.name || 'User');
      return newState;
    });
  };

  const handleAddCommunicationLog = (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => {
    setDb((prev) => {
      const newLog: CommunicationLog = {
        ...log,
        id: `com-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      return { ...prev, communicationLogs: [newLog, ...prev.communicationLogs] };
    });
  };

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

      const newState = {
        ...prev,
        parties: updatedList,
        quotations: updatedQuotations,
        invoices: updatedInvoices
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
      const code = `STK-${String(prev.items.length + 101)}`;

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

  const handleStockAdjustment = (adjustment: {
    itemId: string;
    adjustmentType: 'Adjustment' | 'Purchase In' | 'Sale Out' | 'Damaged' | 'Expired';
    quantity: number;
    notes?: string;
    batchNumber?: string;
    expiryDate?: string;
  }) => {
    setDb((prev) => {
      const item = prev.items.find((i) => i.id === adjustment.itemId);
      if (!item) return prev;

      const delta = adjustment.quantity;
      const nextStock = Math.max(0, item.currentStock + delta);

      const movement: StockMovement = {
        id: `mv-adj-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        type: adjustment.adjustmentType,
        quantity: delta,
        batchNumber: adjustment.batchNumber,
        expiryDate: adjustment.expiryDate,
        referenceNumber: `STK-ADJ-${Date.now().toString().slice(-6)}`,
        user: currentUser?.full_name || currentUser?.name || 'System',
        notes: adjustment.notes || `Stock adjustment for ${item.name}`,
        timestamp: new Date().toISOString()
      };

      const updatedItems = prev.items.map((i) =>
        i.id === item.id ? { ...i, currentStock: nextStock } : i
      );

      const newState = {
        ...prev,
        items: updatedItems,
        stockMovements: [movement, ...(prev.stockMovements || [])]
      };

      const audited = logAudit(newState, 'Adjust Stock', 'Catalog', item.id, item.name);
      return notify(
        audited,
        'Stock Adjusted',
        `Stock for ${item.name} updated to ${nextStock} ${item.unit}. Stock movement logged.`,
        'success'
      );
    });
  };

  // Quotation actions
  const handleAddQuotation = (quotePayload: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => {
    const config = quotePayload.stage === 'Estimate' ? db.settings.numbering.estimateQuotation : db.settings.numbering.quotation;
    const generatedNumber = generateDocumentNumber(config);
    const quotationNumber = quotePayload.stage === 'Estimate' ? `${generatedNumber} Rev 1` : generatedNumber;

    setDb((prev) => {
      const newQuote: Quotation = {
        ...quotePayload,
        id: `quote-${Date.now()}`,
        quotationNumber,
        baseQuotationNumber: generatedNumber,
        revisionNumber: quotePayload.stage === 'Estimate' ? 1 : undefined,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      const newState = { 
        ...prev, 
        quotations: [...prev.quotations, newQuote],
        settings: {
          ...prev.settings,
          numbering: {
            ...prev.settings.numbering,
            [quotePayload.stage === 'Estimate' ? 'estimateQuotation' : 'quotation']: { ...config, currentNumber: config.currentNumber + 1 }
          }
        }
      };
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

  const handleReviseEstimate = (id: string) => {
    setDb((prev) => {
      const original = prev.quotations.find(q => q.id === id);
      if (!original || original.stage !== 'Estimate') return prev;

      const newRev = (original.revisionNumber || 1) + 1;
      const baseNum = original.baseQuotationNumber || original.quotationNumber.split(' ')[0];

      const newQuote: Quotation = {
        ...original,
        id: `quote-${Date.now()}`,
        quotationNumber: `${baseNum} Rev ${newRev}`,
        revisionNumber: newRev,
        baseQuotationNumber: baseNum,
        status: 'Draft', // Reset status
        createdAt: new Date().toISOString().slice(0, 10)
      };

      const updatedOriginal = { ...original, isLocked: true }; // old revision gets locked
      const updatedQuotations = prev.quotations.map(q => q.id === id ? updatedOriginal : q);

      const newState = { ...prev, quotations: [...updatedQuotations, newQuote] };
      const audited = logAudit(newState, 'Revise Estimate', 'Quotations', newQuote.id, newQuote.quotationNumber);
      return notify(audited, 'Estimate Revised', `Created ${newQuote.quotationNumber}.`, 'success');
    });
  };

  const handleConvertEstimateToFinal = (id: string) => {
    setDb((prev) => {
      const original = prev.quotations.find(q => q.id === id);
      if (!original || original.stage !== 'Estimate') return prev;

      const config = prev.settings.numbering.quotation;
      const finalNumber = generateDocumentNumber(config);

      const newQuote: Quotation = {
        ...original,
        id: `quote-${Date.now()}`,
        stage: 'Final',
        quotationNumber: finalNumber,
        originalEstimateId: original.id,
        status: 'Draft',
        revisionNumber: undefined,
        baseQuotationNumber: undefined,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      const updatedOriginal = { ...original, status: 'Converted' as const, isLocked: true };
      const updatedQuotations = prev.quotations.map(q => q.id === id ? updatedOriginal : q);

      const newState = { 
        ...prev, 
        quotations: [...updatedQuotations, newQuote],
        settings: {
          ...prev.settings,
          numbering: {
            ...prev.settings.numbering,
            quotation: { ...config, currentNumber: config.currentNumber + 1 }
          }
        }
      };
      const audited = logAudit(newState, 'Convert Estimate to Final', 'Quotations', newQuote.id, newQuote.quotationNumber);
      return notify(audited, 'Converted to Final Quote', `Created Final Quotation ${newQuote.quotationNumber}.`, 'success');
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
    const config = db.settings.numbering.invoice;
    const invoiceNumber = generateDocumentNumber(config);
    setDb((prev) => {
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

      // Update Stock Movements (Out)
      const movements: StockMovement[] = newInvoice.items.map((item) => ({
        id: `sm-out-${Date.now()}-${item.itemId}`,
        itemId: item.itemId,
        itemName: item.itemName,
        type: 'Sale Out',
        quantity: item.quantity,
        referenceId: newInvoice.id,
        referenceNumber: newInvoice.invoiceNumber,
        user: currentUser?.name || 'System',
        notes: `Sales Invoice to ${newInvoice.partyName}`,
        timestamp: new Date().toISOString()
      }));

      // Update Items currentStock
      const updatedItems = prev.items.map((it) => {
        const line = newInvoice.items.find((li) => li.itemId === it.id);
        if (line) {
          return { ...it, currentStock: it.currentStock - line.quantity };
        }
        return it;
      });

      const newState = { 
        ...prev, 
        invoices: [newInvoice, ...prev.invoices], 
        parties: updatedParties,
        items: updatedItems,
        stockMovements: [...movements, ...prev.stockMovements],
        settings: {
          ...prev.settings,
          numbering: {
            ...prev.settings.numbering,
            invoice: { ...config, currentNumber: config.currentNumber + 1 }
          }
        }
      };
      const audited = logAudit(newState, 'Create Invoice', 'Sales', newInvoice.id, newInvoice.invoiceNumber);
      return notify(audited, 'Bill Registered', `Invoice ${newInvoice.invoiceNumber} generated.`, 'success');
    });
  };

  const handleAddProformaInvoice = (proforma: Omit<ProformaInvoice, 'id' | 'proformaNumber' | 'createdAt' | 'updatedAt'>) => {
    const config = db.settings.numbering.proformaInvoice;
    const proformaNumber = generateDocumentNumber(config);
    const newProforma: ProformaInvoice = {
      ...proforma,
      id: `pi-${Date.now()}`,
      proformaNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDb((prev) => ({
      ...prev,
      proformaInvoices: [newProforma, ...prev.proformaInvoices],
      settings: {
        ...prev.settings,
        numbering: {
          ...prev.settings.numbering,
          proformaInvoice: { ...config, currentNumber: config.currentNumber + 1 }
        }
      }
    }));
    addAuditLog('Sales', `Generated Proforma Invoice ${proformaNumber}`);
  };

  const handleEditProforma = (id: string, updated: Partial<ProformaInvoice>) => {
    setDb((prev) => ({
      ...prev,
      proformaInvoices: prev.proformaInvoices.map((p) =>
        p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p
      )
    }));
    addAuditLog('Sales', `Updated Proforma Invoice ${id}`);
  };

  const handleConvertProformaToInvoice = (proformaId: string) => {
    const proforma = db.proformaInvoices.find(p => p.id === proformaId);
    if (!proforma) return;

    handleAddInvoice({
      partyId: proforma.partyId,
      partyName: proforma.partyName,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      items: proforma.items,
      subtotal: proforma.subtotal,
      discountAmount: proforma.discountAmount,
      taxAmount: proforma.taxAmount,
      additionalCharges: proforma.additionalCharges,
      roundOff: proforma.roundOff,
      total: proforma.total,
      amountPaid: 0,
      balanceDue: proforma.total,
      status: 'Unpaid',
      notes: proforma.notes,
      terms: proforma.terms
    });

    setDb(prev => ({
      ...prev,
      proformaInvoices: prev.proformaInvoices.map(p => p.id === proformaId ? { ...p, status: 'Converted' } : p)
    }));
    addAuditLog('Sales', `Converted Proforma ${proforma.proformaNumber} to Invoice`);
  };

  const handleAddProcurementOrder = (order: Omit<ProcurementOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const config = db.settings.numbering.procurementOrder;
    const orderNumber = generateDocumentNumber(config);
    const newOrder: ProcurementOrder = {
      ...order,
      id: `po-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDb((prev) => ({
      ...prev,
      procurementOrders: [newOrder, ...prev.procurementOrders],
      settings: {
        ...prev.settings,
        numbering: {
          ...prev.settings.numbering,
          procurementOrder: { ...config, currentNumber: config.currentNumber + 1 }
        }
      }
    }));
    addAuditLog('Purchases', `Generated PO ${orderNumber}`);
  };

  const handleAddSalesReturn = (sr: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>) => {
    const config = db.settings.numbering.salesReturn;
    const returnNumber = generateDocumentNumber(config);
    const newReturn: SalesReturn = {
      ...sr,
      id: `sr-${Date.now()}`,
      returnNumber,
      createdAt: new Date().toISOString()
    };

    setDb((prev) => {
      let next = {
        ...prev,
        salesReturns: [newReturn, ...prev.salesReturns],
        settings: {
          ...prev.settings,
          numbering: {
            ...prev.settings.numbering,
            salesReturn: { ...config, currentNumber: config.currentNumber + 1 }
          }
        }
      };

      if (sr.creditNoteIssued) {
        const cnConfig = prev.settings.numbering.creditNote;
        const cnNumber = generateDocumentNumber(cnConfig);
        const newCN: CreditNote = {
          id: `cn-${Date.now()}`,
          creditNoteNumber: cnNumber,
          creditNoteDate: sr.returnDate,
          partyId: sr.partyId,
          partyName: sr.partyName,
          originalInvoiceId: sr.originalInvoiceId,
          originalInvoiceNumber: sr.originalInvoiceNumber,
          salesReturnId: newReturn.id,
          reason: sr.items.map(i => i.reason).join(', '),
          items: sr.items,
          subtotal: sr.items.reduce((a, b) => a + (b.returnQuantity * b.rate), 0),
          taxAmount: sr.items.reduce((a, b) => a + (b.returnQuantity * b.rate * b.taxPercent / 100), 0),
          total: sr.totalReturnAmount,
          adjustedAmount: 0,
          refundAmount: 0,
          status: 'Issued',
          notes: sr.notes,
          createdAt: new Date().toISOString()
        };
        newReturn.creditNoteId = newCN.id;
        next.creditNotes = [newCN, ...prev.creditNotes];
        next.settings.numbering.creditNote.currentNumber += 1;
      }

      // Update Stock Movements (In)
      const movements: StockMovement[] = sr.items.filter(i => i.restockOption).map((item) => ({
        id: `sm-ret-${Date.now()}-${item.itemId}`,
        itemId: item.itemId,
        itemName: item.itemName,
        type: 'Return',
        quantity: item.returnQuantity,
        referenceId: newReturn.id,
        referenceNumber: newReturn.returnNumber,
        user: currentUser?.name || 'System',
        notes: `Sales Return from ${sr.partyName}`,
        timestamp: new Date().toISOString()
      }));

      // Update Items currentStock
      const updatedItems = prev.items.map((it) => {
        const line = sr.items.find((li) => li.itemId === it.id && li.restockOption);
        if (line) {
          return { ...it, currentStock: it.currentStock + line.returnQuantity };
        }
        return it;
      });

      return {
        ...next,
        stockMovements: [...movements, ...prev.stockMovements],
        items: updatedItems
      };
    });
    addAuditLog('Sales', `Recorded Sales Return ${returnNumber}`);
  };

  const handleAddPayment = (payment: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>) => {
    const config = payment.paymentType === 'Payment In' ? db.settings.numbering.paymentReceipt : db.settings.numbering.paymentVoucher;
    const paymentNumber = generateDocumentNumber(config);
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      paymentNumber,
      createdAt: new Date().toISOString()
    };

    setDb((prev) => {
      // Update Party Balance if applicable
      let updatedParties = [...prev.parties];
      if (payment.partyId) {
        updatedParties = prev.parties.map(p => {
          if (p.id === payment.partyId) {
            const adjustment = payment.paymentType === 'Payment In' ? -payment.amount : payment.amount;
            return { ...p, currentBalance: p.currentBalance + adjustment };
          }
          return p;
        });
      }

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        parties: updatedParties,
        settings: {
          ...prev.settings,
          numbering: {
            ...prev.settings.numbering,
            [payment.paymentType === 'Payment In' ? 'paymentReceipt' : 'paymentVoucher']: { ...config, currentNumber: config.currentNumber + 1 }
          }
        }
      };
    });
    addAuditLog('Finance', `Recorded ${payment.paymentType} ${paymentNumber}`);
  };

  const handleFinaliseInvoice = (id: string) => {
    setDb((prev) => {
      const target = prev.invoices.find((inv) => inv.id === id)!;
      const updatedInvoices = prev.invoices.map((inv) => (inv.id === id ? { ...inv, isLocked: true } : inv));

      // Auto reduce stocks for any inventory items on finalise
      let updatedItems = [...prev.items];
      target.items.forEach((line) => {
        updatedItems = updatedItems.map((it) => {
          if (it.id === line.itemId) {
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

  // DUPLICATE AND DELETE SYSTEM HANDLERS
  const handleDeleteQuotation = (id: string) => {
    setDb((prev) => {
      const q = prev.quotations.find(x => x.id === id);
      if (!q) return prev;
      if (q.status === 'Converted') {
        alert("This quotation has already been converted to an invoice. Deletion is blocked to preserve audit history.");
        return prev;
      }
      const updated = prev.quotations.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, quotations: updated };
      const audited = logAudit(newState, 'Delete Quotation', 'Quotations', id, q.quotationNumber);
      return notify(audited, 'Quotation Deleted', `Quotation ${q.quotationNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setDb((prev) => {
      const inv = prev.invoices.find(x => x.id === id);
      if (!inv) return prev;
      
      const hasPayments = inv.amountPaid > 0 || prev.payments.some(p => p.allocations?.some((a: any) => a.invoiceId === id));
      if (hasPayments) {
        alert("This invoice has linked payments. Deletion is blocked. Please reverse or delete the linked payments first.");
        return prev;
      }

      let updatedParties = [...prev.parties];
      let updatedItems = [...prev.items];
      if (inv.status !== 'Cancelled') {
        updatedParties = prev.parties.map((p) =>
          p.id === inv.partyId ? { ...p, currentBalance: Math.max(0, p.currentBalance - inv.total) } : p
        );

        inv.items.forEach((line) => {
          updatedItems = updatedItems.map((it) => {
            if (it.id === line.itemId) {
              return { ...it, currentStock: it.currentStock + line.quantity };
            }
            return it;
          });
        });
      }

      const updated = prev.invoices.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, invoices: updated, parties: updatedParties, items: updatedItems };
      const audited = logAudit(newState, 'Delete Invoice', 'Sales', id, inv.invoiceNumber);
      return notify(audited, 'Invoice Deleted', `Sales Invoice ${inv.invoiceNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteProformaInvoice = (id: string) => {
    setDb((prev) => {
      const pi = prev.proformaInvoices.find(x => x.id === id);
      if (!pi) return prev;
      if (pi.status === 'Converted') {
        alert("This proforma invoice has already been converted to a sales invoice. Deletion is blocked.");
        return prev;
      }
      const updated = prev.proformaInvoices.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, proformaInvoices: updated };
      const audited = logAudit(newState, 'Delete Proforma Invoice', 'Sales', id, pi.proformaNumber);
      return notify(audited, 'Proforma Deleted', `Proforma Invoice ${pi.proformaNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeletePurchase = (id: string) => {
    setDb((prev) => {
      const pur = prev.purchases.find(x => x.id === id);
      if (!pur) return prev;
      if (pur.amountPaid > 0) {
        alert("This purchase invoice has linked payments. Deletion is blocked. Please delete the payment outflow entries first.");
        return prev;
      }

      let updatedParties = prev.parties.map((p) => {
        if (p.id === pur.partyId) {
          return { ...p, currentBalance: Math.max(0, p.currentBalance - pur.balanceDue) };
        }
        return p;
      });

      let updatedItems = [...prev.items];
      pur.items.forEach((line: any) => {
        updatedItems = updatedItems.map((item) => {
          if (item.id === line.itemId) {
            return { ...item, currentStock: Math.max(0, item.currentStock - line.quantity) };
          }
          return item;
        });
      });

      const updated = prev.purchases.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, purchases: updated, parties: updatedParties, items: updatedItems };
      const audited = logAudit(newState, 'Delete Purchase', 'Purchases', id, pur.purchaseNumber);
      return notify(audited, 'Purchase Deleted', `Purchase Invoice ${pur.purchaseNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteProcurementOrder = (id: string) => {
    setDb((prev) => {
      const po = prev.procurementOrders.find(x => x.id === id);
      if (!po) return prev;
      if (po.status === 'Fully Received') {
        alert("This procurement order has been fully received. Deletion is blocked.");
        return prev;
      }
      const updated = prev.procurementOrders.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, procurementOrders: updated };
      const audited = logAudit(newState, 'Delete Procurement Order', 'Purchases', id, po.orderNumber);
      return notify(audited, 'Order Deleted', `Procurement Order ${po.orderNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteSalesReturn = (id: string) => {
    setDb((prev) => {
      const sr = prev.salesReturns.find(x => x.id === id);
      if (!sr) return prev;

      let updatedItems = [...prev.items];
      sr.items.forEach((line: any) => {
        if (line.restockOption) {
          updatedItems = updatedItems.map((it) => {
            if (it.id === line.itemId) {
              return { ...it, currentStock: Math.max(0, it.currentStock - line.returnQuantity) };
            }
            return it;
          });
        }
      });

      if (sr.creditNoteId) {
        const cn = prev.creditNotes.find(x => x.id === sr.creditNoteId);
        if (cn && (cn.refundAmount > 0 || cn.adjustedAmount > 0)) {
          alert("A credit note with adjustments is linked to this return. Deletion is blocked. Revert those adjustments first.");
          return prev;
        }
      }

      const updated = prev.salesReturns.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);

      const updatedCreditNotes = prev.creditNotes.map(cn => cn.salesReturnId === id ? { ...cn, isDeleted: true } : cn);

      const newState = { ...prev, salesReturns: updated, creditNotes: updatedCreditNotes, items: updatedItems };
      const audited = logAudit(newState, 'Delete Sales Return', 'Sales', id, sr.returnNumber);
      return notify(audited, 'Return Deleted', `Sales Return ${sr.returnNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteCreditNote = (id: string) => {
    setDb((prev) => {
      const cn = prev.creditNotes.find(x => x.id === id);
      if (!cn) return prev;
      if (cn.refundAmount > 0 || cn.adjustedAmount > 0) {
        alert("This credit note has been adjusted or refunded. Deletion is blocked. Reverse the adjustments/refunds first.");
        return prev;
      }
      const updated = prev.creditNotes.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, creditNotes: updated };
      const audited = logAudit(newState, 'Delete Credit Note', 'Sales', id, cn.creditNoteNumber);
      return notify(audited, 'Credit Note Deleted', `Credit Note ${cn.creditNoteNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeletePayment = (id: string) => {
    setDb((prev) => {
      const payment = prev.payments.find(x => x.id === id);
      if (!payment) return prev;

      let updatedParties = prev.parties.map(p => {
        if (p.id === payment.partyId) {
          const reverseAdjustment = payment.paymentType === 'Payment In' ? payment.amount : -payment.amount;
          return { ...p, currentBalance: p.currentBalance + reverseAdjustment };
        }
        return p;
      });

      let updatedInvoices = [...prev.invoices];
      if (payment.allocations && payment.allocations.length > 0) {
        payment.allocations.forEach((alloc: any) => {
          updatedInvoices = updatedInvoices.map(inv => {
            if (inv.id === alloc.invoiceId) {
              const paidAmt = Math.max(0, inv.amountPaid - alloc.allocatedAmount);
              const bal = inv.total - paidAmt;
              const status = paidAmt <= 0 ? 'Unpaid' : 'Partially Paid';
              return { ...inv, amountPaid: paidAmt, balanceDue: bal, status };
            }
            return inv;
          });
        });
      }

      const updated = prev.payments.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, payments: updated, parties: updatedParties, invoices: updatedInvoices };
      const audited = logAudit(newState, 'Delete Payment', 'Finance', id, payment.paymentNumber);
      return notify(audited, 'Payment Deleted', `${payment.paymentType} ${payment.paymentNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteExpense = (id: string) => {
    setDb((prev) => {
      const exp = prev.expenses.find(x => x.id === id);
      if (!exp) return prev;
      const updated = prev.expenses.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true, 
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, expenses: updated };
      const audited = logAudit(newState, 'Delete Expense', 'Finance', id, exp.expenseNumber);
      return notify(audited, 'Expense Deleted', `Expense ${exp.expenseNumber} deleted successfully.`, 'success');
    });
  };

  const handleDeleteParty = (id: string) => {
    setDb((prev) => {
      const party = prev.parties.find(x => x.id === id);
      if (!party) return prev;

      const hasTx = 
        prev.invoices.some(x => x.partyId === id && !x.isDeleted) ||
        prev.purchases.some(x => x.partyId === id && !x.isDeleted) ||
        prev.quotations.some(x => x.partyId === id && !x.isDeleted) ||
        prev.proformaInvoices.some(x => x.partyId === id && !x.isDeleted) ||
        prev.procurementOrders.some(x => x.partyId === id && !x.isDeleted) ||
        prev.salesReturns.some(x => x.partyId === id && !x.isDeleted) ||
        prev.creditNotes.some(x => x.partyId === id && !x.isDeleted) ||
        prev.payments.some(x => x.partyId === id && !x.isDeleted);

      if (hasTx) {
        alert("This party cannot be deleted because transactions exist. Use Deactivate/Archive instead.");
        return prev;
      }

      const updated = prev.parties.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true,
        isActive: false,
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, parties: updated };
      const audited = logAudit(newState, 'Delete Party', 'Parties', id, party.name);
      return notify(audited, 'Party Deleted', `Party ${party.name} deleted successfully.`, 'success');
    });
  };

  const handleDeleteItem = (id: string) => {
    setDb((prev) => {
      const item = prev.items.find(x => x.id === id);
      if (!item) return prev;

      const hasTx = 
        prev.invoices.some(x => !x.isDeleted && x.items.some(it => it.itemId === id)) ||
        prev.purchases.some(x => !x.isDeleted && x.items.some((it: any) => it.itemId === id)) ||
        prev.quotations.some(x => !x.isDeleted && x.items.some(it => it.itemId === id)) ||
        prev.proformaInvoices.some(x => !x.isDeleted && x.items.some(it => it.itemId === id)) ||
        prev.procurementOrders.some(x => !x.isDeleted && x.items.some(it => it.itemId === id)) ||
        prev.salesReturns.some(x => !x.isDeleted && x.items.some(it => it.itemId === id)) ||
        prev.creditNotes.some(x => !x.isDeleted && x.items.some(it => it.itemId === id));

      if (hasTx) {
        alert("This item cannot be deleted because it is referenced in transactions. Use Deactivate/Archive instead.");
        return prev;
      }

      const updated = prev.items.map(x => x.id === id ? { 
        ...x, 
        isDeleted: true,
        isActive: false,
        deletedAt: new Date().toISOString(), 
        deletedBy: currentUser?.full_name || currentUser?.name || 'System'
      } : x);
      const newState = { ...prev, items: updated };
      const audited = logAudit(newState, 'Delete Item', 'Catalog', id, item.name);
      return notify(audited, 'Item Deleted', `Item ${item.name} deleted successfully.`, 'success');
    });
  };

  const handleRestoreRecord = (module: string, id: string) => {
    setDb((prev) => {
      let collectionKey = '';

      switch (module) {
        case 'Quotations':
          collectionKey = 'quotations';
          break;
        case 'Sales':
          collectionKey = 'invoices';
          break;
        case 'Proforma Invoices':
          collectionKey = 'proformaInvoices';
          break;
        case 'Purchases':
          collectionKey = 'purchases';
          break;
        case 'Procurement':
          collectionKey = 'procurementOrders';
          break;
        case 'Sales Returns':
          collectionKey = 'salesReturns';
          break;
        case 'Credit Notes':
          collectionKey = 'creditNotes';
          break;
        case 'Payments':
          collectionKey = 'payments';
          break;
        case 'Expenses':
          collectionKey = 'expenses';
          break;
        case 'Parties':
          collectionKey = 'parties';
          break;
        case 'Catalog':
          collectionKey = 'items';
          break;
        default:
          return prev;
      }

      const list = (prev as any)[collectionKey] || [];
      const record = list.find((x: any) => x.id === id);
      if (!record) return prev;

      const updated = list.map((x: any) => x.id === id ? { 
        ...x, 
        isDeleted: false,
        isActive: module === 'Parties' || module === 'Catalog' ? true : x.isActive,
        deletedAt: undefined,
        deletedBy: undefined
      } : x);

      const newState = { ...prev, [collectionKey]: updated };
      const audited = logAudit(newState, 'Restore Record', module, id, record.quotationNumber || record.invoiceNumber || record.proformaNumber || record.purchaseNumber || record.orderNumber || record.returnNumber || record.creditNoteNumber || record.paymentNumber || record.expenseNumber || record.name || '');
      return notify(audited, 'Record Restored', `${module} record restored successfully.`, 'success');
    });
  };
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
        onGoogleSuccess={handleGoogleSuccess}
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
    <CompanyBrandingProvider settings={db.settings}>
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
          globalSearchQuery={globalSearchQuery}
          onGlobalSearchChange={(q) => {
            setGlobalSearchQuery(q);
            if (q) setIsCommandPaletteOpen(true);
          }}
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
              purchases={db.purchases}
              expenses={db.expenses}
              payments={db.payments}
              quotations={db.quotations || []}
              procurementOrders={db.procurementOrders || []}
              proformaInvoices={db.proformaInvoices || []}
              salesReturns={db.salesReturns || []}
              creditNotes={db.creditNotes || []}
              accounts={db.accounts}
              onQuickAction={(actionId) => setActiveTab(actionId)}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
              currentUser={currentUser}
              settings={db.settings}
            />
          )}

          {activeTab === 'parties' && (
            <PartiesView
              parties={db.parties.filter(p => !p.isDeleted)}
              onAddParty={handleAddParty}
              onEditParty={handleEditParty}
              onDeactivateParty={handleDeactivateParty}
              onReactivateParty={handleReactivateParty}
              onDeleteParty={handleDeleteParty}
              isAdmin={currentUser.isAdmin}
              db={db}
              currentUser={currentUser}
              settings={db.settings}
            />
          )}

          {activeTab === 'party_ledger' && (
            <PartyLedgerHomeView
              db={{
                ...db,
                parties: db.parties.filter(p => !p.isDeleted),
                invoices: db.invoices.filter(i => !i.isDeleted),
                purchases: db.purchases.filter(p => !p.isDeleted),
                payments: db.payments.filter(p => !p.isDeleted)
              }}
              isAdmin={currentUser.isAdmin}
              onUpdateParty={handleEditParty}
              currentUser={currentUser}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {(activeTab === 'catalog' || activeTab === 'items') && (
            <ItemsView
              items={db.items.filter(it => !it.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              stockMovements={db.stockMovements || []}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onAdjustStock={handleStockAdjustment}
              onDeactivateItem={(id) => handleEditItem(id, { isActive: false })}
              onReactivateItem={(id) => handleEditItem(id, { isActive: true })}
              onDeleteItem={handleDeleteItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
              invoices={db.invoices.filter(i => !i.isDeleted)}
              purchases={db.purchases.filter(p => !p.isDeleted)}
              quotations={db.quotations.filter(q => !q.isDeleted)}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              quotations={(db.quotations || []).filter(q => !q.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              onAddQuotation={handleAddQuotation}
              onEditQuotation={handleEditQuotation}
              onConvertToInvoice={handleConvertToInvoice}
              onReviseEstimate={handleReviseEstimate}
              onConvertEstimateToFinal={handleConvertEstimateToFinal}
              onDeleteQuotation={handleDeleteQuotation}
              onAddParty={handleAddParty}
              onAddItem={handleAddItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
              onCheckPin={checkPin}
              onLogCommunication={handleAddCommunicationLog}
            />
          )}
          {activeTab === 'proforma' && (
            <ProformaInvoicesView
              proformaInvoices={(db.proformaInvoices || []).filter(p => !p.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              onAddProforma={handleAddProformaInvoice}
              onEditProforma={handleEditProforma}
              onUpdateProformaStatus={(id, status) => setDb(prev => ({ ...prev, proformaInvoices: prev.proformaInvoices.map(p => p.id === id ? { ...p, status } : p) }))}
              onConvertToSalesInvoice={handleConvertProformaToInvoice}
              onDeleteProforma={handleDeleteProformaInvoice}
              onAddParty={handleAddParty}
              onAddItem={handleAddItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
              onCheckPin={checkPin}
            />
          )}
          {activeTab === 'sales' && (
            <SalesView
              invoices={db.invoices.filter(inv => !inv.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              onAddInvoice={handleAddInvoice}
              onFinaliseInvoice={handleFinaliseInvoice}
              onRecordPayment={handleRecordPayment}
              onCancelInvoice={(id) => checkPin('cancel_invoice', () => handleCancelInvoice(id))}
              onDeleteInvoice={handleDeleteInvoice}
              onAddParty={handleAddParty}
              onAddItem={handleAddItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
              onCheckPin={checkPin}
              onLogCommunication={handleAddCommunicationLog}
            />
          )}
          {activeTab === 'returns' && (
            <SalesReturnsView
              salesReturns={(db.salesReturns || []).filter(sr => !sr.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              invoices={db.invoices.filter(inv => !inv.isDeleted)}
              onAddSalesReturn={handleAddSalesReturn}
              onDeleteSalesReturn={handleDeleteSalesReturn}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'credit_notes' && (
            <CreditNotesView
              creditNotes={(db.creditNotes || []).filter(cn => !cn.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              onIssueRefund={(id, amt, acc) => checkPin('record_refund', () => {
                setDb(prev => ({
                  ...prev,
                  creditNotes: prev.creditNotes.map(cn => cn.id === id ? { ...cn, refundAmount: cn.refundAmount + amt, status: (cn.refundAmount + amt + cn.adjustedAmount >= cn.total) ? 'Fully Adjusted' : 'Issued' } : cn)
                }));
                addAuditLog('Finance', `Refunded ₹${amt} from Credit Note`);
              })}
              onAdjustAgainstInvoice={(id, invId, amt) => {
                setDb(prev => ({
                  ...prev,
                  creditNotes: prev.creditNotes.map(cn => cn.id === id ? { ...cn, adjustedAmount: cn.adjustedAmount + amt, status: (cn.adjustedAmount + amt + cn.refundAmount >= cn.total) ? 'Fully Adjusted' : 'Issued' } : cn),
                  invoices: prev.invoices.map(inv => inv.id === invId ? { ...inv, amountPaid: inv.amountPaid + amt, balanceDue: inv.balanceDue - amt, status: (inv.balanceDue - amt <= 0) ? 'Paid' : 'Partially Paid' } : inv)
                }));
                addAuditLog('Finance', `Adjusted ₹${amt} from Credit Note to Invoice`);
              }}
              onDeleteCreditNote={handleDeleteCreditNote}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'procurement' && (
            <ProcurementOrdersView
              procurementOrders={(db.procurementOrders || []).filter(po => !po.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              onAddProcurement={handleAddProcurementOrder}
              onUpdateProcurementStatus={(id, status) => setDb(prev => ({ ...prev, procurementOrders: prev.procurementOrders.map(o => o.id === id ? { ...o, status } : o) }))}
              onConvertToPurchaseInvoice={(id) => {
                const po = db.procurementOrders.find(p => p.id === id);
                if (po) {
                  handleAddPurchase({
                    partyId: po.partyId,
                    partyName: po.partyName,
                    purchaseDate: new Date().toISOString().slice(0, 10),
                    items: po.items,
                    subtotal: po.subtotal,
                    discountAmount: po.discountAmount,
                    taxAmount: po.taxAmount,
                    additionalCharges: po.additionalCharges,
                    roundOff: po.roundOff,
                    total: po.total,
                    amountPaid: 0,
                    balanceDue: po.total,
                    status: 'Unpaid',
                    notes: po.internalNotes || '',
                    terms: po.termsAndConditions || ''
                  });
                  setDb(prev => ({ ...prev, procurementOrders: prev.procurementOrders.map(o => o.id === id ? { ...o, status: 'Fully Received' } : o) }));
                }
              }}
              onDeleteProcurement={handleDeleteProcurementOrder}
              onAddParty={handleAddParty}
              onAddItem={handleAddItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={(db.purchases || []).filter(pur => !pur.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={handleDeletePurchase}
              onAddParty={handleAddParty}
              onAddItem={handleAddItem}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'payment_in' && (
            <PaymentsView
              payments={db.payments.filter(pay => !pay.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              type="Payment In"
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'payment_out' && (
            <PaymentsView
              payments={db.payments.filter(pay => !pay.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              type="Payment Out"
              onAddPayment={(pay) => checkPin('payment_out', () => handleAddPayment(pay))}
              onDeletePayment={handleDeletePayment}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
            />
          )}
          {activeTab === 'expenses' && (
            <FinanceView
              expenses={db.expenses.filter(exp => !exp.isDeleted)}
              payments={db.payments.filter(pay => !pay.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              onAddExpense={handleAddExpense}
              onApproveExpense={handleApproveExpense}
              onDeleteExpense={handleDeleteExpense}
              isAdmin={currentUser.isAdmin}
              settings={db.settings}
              initialTab={activeTab === 'expenses' ? 'expenses' : 'expenses'}
              onCheckPin={checkPin}
              onLogCommunication={handleAddCommunicationLog}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              invoices={db.invoices.filter(i => !i.isDeleted)}
              purchases={db.purchases.filter(p => !p.isDeleted)}
              expenses={db.expenses.filter(e => !e.isDeleted)}
              payments={db.payments.filter(p => !p.isDeleted)}
              items={db.items.filter(it => !it.isDeleted)}
              parties={db.parties.filter(p => !p.isDeleted)}
              quotations={(db.quotations || []).filter(q => !q.isDeleted)}
              isAdmin={currentUser.isAdmin}
              samples={[]}
              settings={db.settings}
            />
          )}

          {activeTab === 'trash' && (
            <TrashView
              db={db}
              onRestoreRecord={handleRestoreRecord}
              isAdmin={currentUser.isAdmin}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={db.settings}
              onUpdateSettings={handleUpdateSettings}
              isAdmin={currentUser.isAdmin}
              dbState={{
                ...db,
                parties: db.parties.filter(p => !p.isDeleted),
                items: db.items.filter(i => !i.isDeleted),
                invoices: db.invoices.filter(i => !i.isDeleted),
                purchases: db.purchases.filter(p => !p.isDeleted),
                expenses: db.expenses.filter(e => !e.isDeleted),
                payments: db.payments.filter(p => !p.isDeleted)
              }}
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
            />
          )}
        </main>
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen || !!globalSearchQuery}
          onClose={() => {
            setIsCommandPaletteOpen(false);
            setGlobalSearchQuery('');
          }}
          query={globalSearchQuery}
          onQueryChange={setGlobalSearchQuery}
          db={db}
          onNavigateTab={(tabId) => setActiveTab(tabId)}
        />
        <SecurityPinDialog
          isOpen={!!pinAction}
          onClose={() => setPinAction(null)}
          onSuccess={() => {
            if (pinAction) {
              pinAction.onConfirm();
              setPinAction(null);
            }
          }}
          pinHash={db.settings.security.transactionPinHash}
          actionName={pinAction?.name || ''}
        />
      </div>
    </div>
  </CompanyBrandingProvider>
  );
}
