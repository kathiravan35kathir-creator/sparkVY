/// <reference types="vite/client" />

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

import firebaseConfig from "../../firebase-applet-config.json";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

console.log("[DEBUG] measurementId:", config.measurementId);

const app = getApps().length ? getApp() : initializeApp(config);

const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const storage = getStorage(app);

let analytics: any = null;

if (typeof window !== "undefined" && config.measurementId && typeof config.measurementId === 'string' && config.measurementId.trim() !== "") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log("[FIREBASE] Analytics initialized");
      }
    })
    .catch((error) => {
      console.warn("Firebase Analytics is unavailable:", error);
    });
} else if (typeof window !== "undefined") {
  console.log("[FIREBASE] Analytics skipped: Missing measurementId");
}

// Temporary development-only logs for Firebase connection check
console.log("[FIREBASE] Initialized Project ID:", config.projectId);
console.log("[FIREBASE] Auth Domain:", config.authDomain);
console.log("[FIREBASE] Using fallback config:", !import.meta.env.VITE_FIREBASE_API_KEY);
console.log("[FIREBASE] App Initialized:", !!app);
console.log("[FIREBASE] Auth Initialized:", !!auth);
console.log("[FIREBASE] Firestore Initialized:", !!db);

export { app, auth, db as firestoreDb, storage, analytics };