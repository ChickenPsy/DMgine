# Firebase Integration Code

This document contains the complete Firebase setup and configuration for the DMgine application with Email/Password authentication.

## Firebase Configuration Setup

### 1. Environment Variables
Add these environment variables to your Replit project:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id  
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 2. Firebase Console Setup Instructions

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Click "Add app" and select the Web platform (</>)
4. Register your app with a nickname (e.g., "DMgine Web")
5. Copy the configuration values (apiKey, appId, projectId)

### 3. Enable Email/Password Authentication

1. In the Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password** provider
3. Enable the **Email/Password** option
4. Click **Save**

### 4. Configure Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your Replit development URL (e.g., `https://your-repl-name.your-username.repl.co`)
3. After deployment, add your `.replit.app` domain and any custom domains

### 5. Firestore Database Setup

1. Go to **Firestore Database** in the Firebase Console
2. Click **Create database**
3. Start in **production mode**
4. Choose a location close to your users
5. Set up the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Code Implementation

### Firebase Configuration (`client/src/lib/firebase.ts`)

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "default",
};

// Initialize Firebase app
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    const { getApp } = require('firebase/app');
    app = getApp();
  } else {
    throw error;
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Failed to set auth persistence:", error);
});

// Enable Firestore network
enableNetwork(db).catch((error) => {
  console.warn("Failed to enable Firestore network:", error);
});
```

### Authentication Functions

```typescript
// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    await createOrUpdateUserProfile(user);
    return user;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    }
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    await createOrUpdateUserProfile(user);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please check your credentials.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    }
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    throw error;
  }
};
```

### User Profile Management

```typescript
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  isPremium: boolean;
  createdAt: string;
}

// Create or update user profile in Firestore
export const createOrUpdateUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userDoc = await getDoc(userRef);
    
    const userData: UserProfile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
      photo: '', // No photo for email/password auth
      isPremium: userDoc.exists() ? userDoc.data().isPremium || false : false,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
    };
    
    await setDoc(userRef, userData, { merge: true });
    return userData;
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Get user profile
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

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
```

## React Components

### AuthModal Component (`client/src/components/AuthModal.tsx`)

Complete authentication modal with sign-in, sign-up, and password reset functionality:

- Email/password sign-in form
- Email/password sign-up form with optional display name
- Password reset functionality
- Form validation and error handling
- Responsive design with icons
- Password visibility toggle
- Mode switching between sign-in/sign-up/forgot password

### Integration with Existing Components

The AuthModal is integrated into:

1. **FreemiumModal** - For users hitting usage limits
2. **Home Page** - For general authentication
3. **Premium Page** - For upgrade flow (requires authentication first)

### Upgrade Handler Integration

The upgrade handler now requires users to be authenticated before proceeding to Stripe checkout:

```typescript
// If user is not authenticated, they need to sign in first
if (!currentUser.isAuthenticated) {
  onError?.('Please sign in first to upgrade to Premium.');
  return;
}
```

## Testing the Integration

1. **Sign Up Flow**: Test creating new accounts with email/password
2. **Sign In Flow**: Test signing in with existing credentials
3. **Password Reset**: Test password reset email functionality
4. **Firestore Integration**: Verify user profiles are created/updated
5. **Premium Upgrade**: Test upgrade flow requires authentication
6. **Session Persistence**: Verify users stay signed in across page reloads

## Security Considerations

1. **Firestore Rules**: Only authenticated users can access their own data
2. **Environment Variables**: All Firebase config uses VITE_ prefix for client-side access
3. **Error Handling**: Generic error messages to prevent information disclosure
4. **Input Validation**: Email format and password strength validation
5. **Session Management**: Proper sign-out functionality and session cleanup

## Deployment Notes

1. Update authorized domains in Firebase Console for production URLs
2. Ensure all environment variables are set in production
3. Test authentication flow in production environment
4. Monitor Firebase usage and authentication metrics
5. Set up Firebase security rules for production use

This completes the transition from Google OAuth to Email/Password authentication while maintaining all existing functionality and improving the user experience with more flexible authentication options.