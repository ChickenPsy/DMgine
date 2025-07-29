import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
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
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create or update user profile in Firestore
    await createOrUpdateUserProfile(user);
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
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