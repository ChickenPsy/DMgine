import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, enableNetwork, connectFirestoreEmulator, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app with comprehensive error handling
let app;
try {
  // Validate configuration before initialization
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
      throw new Error(`Missing required Firebase configuration: ${field}`);
    }
  }
  
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    // App already exists, get the existing one
    const { getApp } = require('firebase/app');
    app = getApp();
    console.log("Using existing Firebase app instance");
  } else {
    console.error("Firebase initialization failed:", error);
    throw new Error(`Firebase configuration error: ${error.message}`);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Ensure we're not connecting to emulator in production
if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("Connected to Firestore emulator");
  } catch (error) {
    console.log("Firestore emulator already connected or not available");
  }
}

// Configure auth persistence for better session handling
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence configured successfully");
  })
  .catch((error) => {
    console.warn("Failed to set auth persistence:", error);
  });

// Enhanced Firestore network management with WebChannel optimization
const initializeFirestoreNetwork = async () => {
  try {
    // First, ensure network is properly disabled and re-enabled to reset connections
    await disableNetwork(db);
    console.log("Firestore network disabled for reset");
    
    // Wait a moment before re-enabling
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Re-enable with retry logic
    const enableFirestoreNetwork = async (retries = 5) => {
      for (let i = 0; i < retries; i++) {
        try {
          await enableNetwork(db);
          console.log("Firestore network enabled successfully");
          return true;
        } catch (error: any) {
          console.warn(`Failed to enable Firestore network (attempt ${i + 1}/${retries}):`, error);
          
          // Handle specific WebChannel errors
          if (error.code === 'failed-precondition' || error.message?.includes('WebChannel')) {
            console.log("WebChannel connection issue detected, retrying with exponential backoff");
          }
          
          if (i === retries - 1) {
            console.error("Failed to enable Firestore network after all retries");
            return false;
          } else {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
      }
      return false;
    };
    
    return await enableFirestoreNetwork();
  } catch (error) {
    console.error("Error initializing Firestore network:", error);
    return false;
  }
};

// Wait for auth state to be ready before initializing Firestore
let networkInitialized = false;
const initializeOnAuth = () => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!networkInitialized) {
      networkInitialized = true;
      unsubscribe(); // Only run once
      
      if (user) {
        console.log("User authenticated, initializing Firestore network");
        await initializeFirestoreNetwork();
      } else {
        console.log("No user authenticated, enabling Firestore network for public access");
        await initializeFirestoreNetwork();
      }
    }
  });
};

// Initialize on load
initializeOnAuth();

// Email/Password Authentication - No provider needed

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  isPremium: boolean;
  createdAt: string;
}

export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    console.log("Firebase config check:", {
      apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
    });

    // Check if Firebase is properly configured
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID) {
      throw new Error('Firebase configuration is missing. Please set VITE_FIREBASE_* environment variables.');
    }

    console.log("Creating account with email:", email);
    
    // Add timeout promise to prevent hanging requests
    const signUpPromise = createUserWithEmailAndPassword(auth, email, password);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Account creation took too long')), 30000);
    });
    
    const result = await Promise.race([signUpPromise, timeoutPromise]) as any;
    const user = result.user;
    
    console.log("Firebase user created:", user.uid);
    
    // Update display name if provided
    if (displayName) {
      console.log("Updating display name:", displayName);
      await updateProfile(user, { displayName });
    }
    
    console.log("Account created successfully:", user.email);
    
    // Create or update user profile in Firestore with timeout
    try {
      const profilePromise = createOrUpdateUserProfile(user);
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore profile creation timeout')), 10000);
      });
      
      await Promise.race([profilePromise, profileTimeoutPromise]);
      console.log("User profile created in Firestore");
    } catch (profileError) {
      console.warn("Failed to create user profile in Firestore, but user account was created:", profileError);
      // Don't throw here - the user account was successfully created
    }
    
    return user;
  } catch (error: any) {
    console.error("Detailed sign-up error:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific Firebase auth errors with better messaging
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password authentication is not enabled for this project.');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Invalid Firebase API key. Please check your configuration.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many account creation attempts. Please try again later.');
    } else if (error.message.includes('Firebase configuration')) {
      throw new Error('Firebase is not properly configured. Please check environment variables.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request took too long. Please check your connection and try again.');
    }
    
    // Fallback error message
    throw new Error(error.message || 'An unexpected error occurred during account creation. Please try again.');
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    console.log("Signing in with email:", email);
    
    // Add timeout for sign-in request
    const signInPromise = signInWithEmailAndPassword(auth, email, password);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Sign-in took too long')), 15000);
    });
    
    const result = await Promise.race([signInPromise, timeoutPromise]) as any;
    const user = result.user;
    
    console.log("Sign-in successful:", user.email);
    
    // Create or update user profile in Firestore with timeout
    try {
      const profilePromise = createOrUpdateUserProfile(user);
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore profile update timeout')), 8000);
      });
      
      await Promise.race([profilePromise, profileTimeoutPromise]);
      console.log("User profile updated in Firestore");
    } catch (profileError) {
      console.warn("Failed to update user profile in Firestore, but sign-in was successful:", profileError);
      // Don't throw here - the sign-in was successful
    }
    
    return user;
  } catch (error: any) {
    console.error("Detailed sign-in error:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific Firebase auth errors with better messaging
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please check your credentials.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request took too long. Please check your connection and try again.');
    }
    
    // Fallback error message
    throw new Error(error.message || 'An unexpected error occurred during sign-in. Please try again.');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log("Sending password reset email to:", email);
    
    // Add timeout for password reset request
    const resetPromise = sendPasswordResetEmail(auth, email);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Password reset took too long')), 10000);
    });
    
    await Promise.race([resetPromise, timeoutPromise]);
    console.log("Password reset email sent successfully");
  } catch (error: any) {
    console.error("Password reset error:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many reset requests. Please try again later.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request took too long. Please check your connection and try again.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
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

// Enhanced Firestore operation with WebChannel error handling
const withFirestoreRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`Firestore operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      // Handle specific WebChannel and connection errors
      if (error.code === 'unavailable' || 
          error.code === 'failed-precondition' || 
          error.message?.includes('WebChannel') ||
          error.message?.includes('transport') ||
          error.message?.includes('RPC')) {
        
        if (i < maxRetries - 1) {
          // Wait with exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          continue;
        }
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// Create or update user profile in Firestore with enhanced error handling
export const createOrUpdateUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    // Check if we're online before attempting Firestore operations
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your connection and try again.');
    }

    // Ensure user is authenticated before Firestore operations
    if (!user.emailVerified && user.email) {
      console.log('User email not verified, but proceeding with profile creation');
    }

    const userData = await withFirestoreRetry(async () => {
      const userDoc = await getDoc(userRef);
      
      const profileData: UserProfile = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        photo: '', // No photo for email/password auth
        isPremium: userDoc.exists() ? userDoc.data().isPremium || false : false,
        createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
      };
      
      // Update Firestore with latest user data
      await setDoc(userRef, profileData, { merge: true });
      
      return profileData;
    });
    
    return userData;
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    
    // Handle specific Firestore errors with user-friendly messages
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      throw new Error('Unable to connect to our servers. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Access denied. Please check your Firestore security rules or sign out and sign in again.');
    } else if (error.message?.includes('WebChannel') || error.message?.includes('transport')) {
      throw new Error('Connection error. Please refresh the page and try again.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    
    throw error;
  }
};

// Get user premium status with enhanced WebChannel error handling
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Check if we're online
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your connection and try again.');
    }

    const result = await withFirestoreRetry(async () => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    });
    
    return result;
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    
    // Handle specific errors with user-friendly messages
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      throw new Error('Unable to connect to our servers. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Access denied. Please check your authentication status.');
    } else if (error.message?.includes('WebChannel') || error.message?.includes('transport')) {
      throw new Error('Connection error. Please refresh the page and try again.');
    }
    
    return null;
  }
};

// Update user premium status with enhanced error handling
export const updateUserPremiumStatus = async (uid: string, isPremium: boolean): Promise<void> => {
  try {
    await withFirestoreRetry(async () => {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isPremium }, { merge: true });
    });
  } catch (error: any) {
    console.error("Error updating premium status:", error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. You may not have access to update this information.');
    } else if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      throw new Error('Unable to connect to our servers. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};