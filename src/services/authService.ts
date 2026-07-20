import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
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
      alert(`Google sign-in error: ${error.message}`);
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

export const signInWithEmail = async (email: string, password?: string) => {
  if (!password) {
    throw new Error('Password is required for email login.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    let message = `Sign in error: ${error.message}`;
    if (error.code === 'auth/user-not-found') {
      message = 'No user found with this email address. Please create an account instead.';
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Incorrect password. Please check your credentials or click "Forgot Password" to reset it.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/user-disabled') {
      message = 'This account has been disabled. Please contact support.';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network request failed. Please check your connection or try again later.';
    }
    alert(message);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password?: string) => {
  if (!password) {
    throw new Error('Password is required for account registration.');
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    let message = `Sign up error: ${error.message}`;
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account already exists with this email address. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak. It must be at least 6 characters long.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network request failed. Please check your connection.';
    }
    alert(message);
    throw error;
  }
};

import { sendPasswordResetEmail } from 'firebase/auth';

export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Password reset link has been sent to your email address!');
  } catch (error: any) {
    console.error('Password reset error:', error);
    let message = `Password reset error: ${error.message}`;
    if (error.code === 'auth/user-not-found') {
      message = 'No account was found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network request failed. Please check your connection.';
    }
    alert(message);
    throw error;
  }
};
