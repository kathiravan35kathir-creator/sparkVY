/// <reference types="vite/client" />

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqsVjJEA701Ddgu8twVfTJ6QQNh1Ze3Os",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "spark-vy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "spark-vy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "spark-vy.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "977282297451",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:977282297451:web:baa70c809ae50624dacb2e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9NL95LVNS3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: any = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn("Firebase Analytics is unavailable:", error);
    });
}

// Temporary development-only logs for Firebase connection check
console.log("[FIREBASE] Initialized Project ID:", firebaseConfig.projectId);
console.log("[FIREBASE] Auth Domain:", firebaseConfig.authDomain);
console.log("[FIREBASE] App Initialized:", !!app);
console.log("[FIREBASE] Auth Initialized:", !!auth);
console.log("[FIREBASE] Firestore Initialized:", !!db);

export { app, auth, db, storage, analytics };