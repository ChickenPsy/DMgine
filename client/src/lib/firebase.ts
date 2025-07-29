import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
// Configure OAuth scopes and parameters
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({
  'prompt': 'select_account'
});

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
    });

    // Try popup first, fallback to redirect if it fails
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log("Sign-in successful:", user.email);
      
      // Create or update user profile in Firestore
      await createOrUpdateUserProfile(user);
      
      return user;
    } catch (popupError: any) {
      console.log("Popup failed, trying redirect:", popupError.code);
      
      // If popup fails, use redirect method
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        
        await signInWithRedirect(auth, provider);
        // The redirect will handle the rest, this function won't return normally
        throw new Error('Redirecting to Google sign-in...');
      }
      
      throw popupError;
    }
  } catch (error: any) {
    console.error("Detailed sign-in error:", {
      code: error.code,
      message: error.message,
      customData: error.customData,
      stack: error.stack
    });
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Trying redirect method...');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Trying redirect method...');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open. Trying redirect method...');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Google sign-in.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled for this project.');
    }
    
    throw error;
  }
};

// Handle redirect result on page load
export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("Redirect sign-in successful:", result.user.email);
      
      // Create or update user profile in Firestore
      await createOrUpdateUserProfile(result.user);
      
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error("Redirect result error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Create or update user profile in Firestore
export const createOrUpdateUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
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
};

// Get user premium status
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
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