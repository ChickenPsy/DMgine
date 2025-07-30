import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Ensure messagingSenderId is included for complete config
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "default",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth persistence for better session handling in Replit
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Failed to set auth persistence:", error);
});

// Ensure Firestore network is enabled
enableNetwork(db).catch((error) => {
  console.warn("Failed to enable Firestore network:", error);
});

const provider = new GoogleAuthProvider();
// Configure OAuth scopes and parameters
provider.addScope('email');
provider.addScope('profile');
// Optimize for Replit environment - remove custom parameters that might cause issues
// provider.setCustomParameters({
//   'prompt': 'consent'
// });

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  isPremium: boolean;
  createdAt: string;
}

export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log("Firebase config check:", {
      apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      currentDomain: window.location.hostname
    });

    // Check if Firebase is properly configured
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID) {
      throw new Error('Firebase configuration is missing. Please set VITE_FIREBASE_* environment variables.');
    }

    console.log("Starting Google sign-in with popup...");
    
    // Use popup method optimized for Replit environment
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log("Sign-in successful:", user.email);
    
    // Create or update user profile in Firestore
    await createOrUpdateUserProfile(user);
    
    return user;
  } catch (error: any) {
    console.error("Detailed sign-in error:", {
      code: error.code,
      message: error.message,
      customData: error.customData,
      stack: error.stack
    });
    
    // Handle specific Firebase auth errors with better messaging
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in attempt is in progress. Please wait and try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      throw new Error(`This domain (${currentDomain}) is not authorized for Google sign-in. Please add "${currentDomain}" to your Firebase Console > Authentication > Settings > Authorized domains.`);
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled for this project.');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Invalid Firebase API key. Please check your configuration.');
    } else if (error.message.includes('Firebase configuration')) {
      throw new Error('Firebase is not properly configured. Please check environment variables.');
    }
    
    throw error;
  }
};

// Handle redirect result on page load (simplified for popup-only approach)
export const handleRedirectResult = async (): Promise<User | null> => {
  // Since we're using popup-only now, this function just ensures auth state persistence
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Create or update user profile in Firestore with offline handling
export const createOrUpdateUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    // Check if we're online before attempting Firestore operations
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your connection and try again.');
    }

    // Add a small delay to ensure Firebase has fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userDoc = await getDoc(userRef);
    
    const userData: UserProfile = {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      photo: user.photoURL || '',
      isPremium: userDoc.exists() ? userDoc.data().isPremium || false : false,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
    };
    
    // Update Firestore with latest user data
    await setDoc(userRef, userData, { merge: true });
    
    return userData;
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      throw new Error('Unable to connect to our servers. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please sign out and sign in again.');
    }
    
    throw error;
  }
};

// Get user premium status with retry logic and offline handling
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your connection and try again.');
      }

      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      
      retryCount++;
      
      // Handle specific errors
      if (error.code === 'unavailable' && retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      } else if (error.code === 'unavailable') {
        throw new Error('Unable to connect to our servers. Please check your internet connection and try again.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please sign out and sign in again.');
      }
      
      return null;
    }
  }
  
  return null;
};

// Update user premium status
export const updateUserPremiumStatus = async (uid: string, isPremium: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { isPremium }, { merge: true });
  } catch (error) {
    console.error("Error updating premium status:", error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};