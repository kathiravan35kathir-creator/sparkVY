import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('User closed the Google sign-in popup.');
      return null;
    } else if (error.code === 'auth/network-request-failed') {
      console.error('Network request failed. This may be due to an ad-blocker, VPN, or network restrictions.', error);
      alert('Network request failed. Please check your internet connection or disable ad-blockers.');
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      console.error(`Unauthorized domain: ${currentDomain}. Please add this domain to the Authorized Domains list in Firebase Console.`, error);
      alert(`This domain (${currentDomain}) is not authorized for Firebase Auth. Please add it in your Firebase Console under Authentication > Settings > Authorized domains.`);
    } else {
      console.error('Google sign-in error:', error);
    }
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const listenToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Abstracting email login for future implementation (e.g., OTP via secure backend or Cloud Functions)
export const signInWithEmailRequest = async (email: string) => {
  console.log(`[AUTH SERVICE] Email sign-in requested for: ${email}`);
  throw new Error("Email login is not fully implemented yet on client-side. Use a secure backend/Cloud Function for OTP.");
};