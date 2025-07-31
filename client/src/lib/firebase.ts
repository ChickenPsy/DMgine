import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, enableNetwork } from "firebase/firestore";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'projectId', 'appId'];
  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
      throw new Error(`Missing required Firebase configuration: ${field}`);
    }
  }
};

// Initialize Firebase app
let app;
try {
  validateFirebaseConfig();
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    const { getApp } = require('firebase/app');
    app = getApp();
    console.log("Using existing Firebase app instance");
  } else {
    console.error("Firebase initialization failed:", error);
    throw new Error(`Firebase configuration error: ${error.message}`);
  }
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth persistence (simple, no complex retry logic)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence configured successfully");
  })
  .catch((error) => {
    console.warn("Failed to set auth persistence:", error);
  });

// Simple Firestore network enablement (no complex retry logic)
enableNetwork(db)
  .then(() => {
    console.log("Firestore network enabled successfully");
  })
  .catch((error) => {
    console.warn("Failed to enable Firestore network:", error);
  });

// User Profile interface
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  isPremium: boolean;
  createdAt: string;
}

// Simple sign up function with minimal error handling
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    console.log("Creating account with email:", email);
    
    // Check Firebase configuration
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      throw new Error('Firebase configuration is missing. Please check environment variables.');
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    console.log("Firebase user created:", user.uid);
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user profile in Firestore (simple approach)
    try {
      await createOrUpdateUserProfile(user);
      console.log("User profile created in Firestore");
    } catch (profileError) {
      console.warn("Failed to create user profile in Firestore:", profileError);
      // Don't throw - user account was created successfully
    }
    
    return user;
  } catch (error: any) {
    console.error("Sign-up error:", error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password authentication is not enabled for this project.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred during account creation.');
  }
};

// Simple sign in function
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    console.log("Signing in with email:", email);
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    console.log("Sign-in successful:", user.email);
    
    // Update user profile (simple approach)
    try {
      await createOrUpdateUserProfile(user);
      console.log("User profile updated in Firestore");
    } catch (profileError) {
      console.warn("Failed to update user profile in Firestore:", profileError);
      // Don't throw - sign-in was successful
    }
    
    return user;
  } catch (error: any) {
    console.error("Sign-in error:", error);
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please check your credentials.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred during sign-in.');
  }
};

// Password reset function
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully");
  } catch (error: any) {
    console.error("Password reset error:", error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred.');
  }
};

// Simple sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Simple Firestore operations without complex retry logic
export const createOrUpdateUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userDoc = await getDoc(userRef);
    
    const userData: UserProfile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
      photo: '',
      isPremium: userDoc.exists() ? userDoc.data().isPremium || false : false,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
    };
    
    await setDoc(userRef, userData, { merge: true });
    
    return userData;
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your Firestore security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Unable to connect to the database. Please try again.');
    }
    
    throw error;
  }
};

// Simple get user profile function
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication.');
    }
    
    return null;
  }
};

// Simple update premium status
export const updateUserPremiumStatus = async (uid: string, isPremium: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { isPremium }, { merge: true });
  } catch (error) {
    console.error("Error updating premium status:", error);
    throw error;
  }
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Handle redirect result (simplified)
export const handleRedirectResult = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};