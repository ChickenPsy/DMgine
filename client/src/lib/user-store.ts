import { User } from "firebase/auth";
import { UserProfile } from "./firebase";

export type UserTier = 'free' | 'premium';

export interface AppUser {
  firebaseUser: User | null;
  profile: UserProfile | null;
  tier: UserTier;
  isAuthenticated: boolean;
}

const USER_TIER_KEY = 'dmgine_user_tier';

export class UserStore {
  private static instance: UserStore;
  private user: AppUser = {
    firebaseUser: null,
    profile: null,
    tier: 'free',
    isAuthenticated: false
  };
  private listeners: ((user: AppUser) => void)[] = [];

  private constructor() {
    // Load tier from localStorage on initialization
    const storedTier = localStorage.getItem(USER_TIER_KEY) as UserTier;
    if (storedTier === 'premium' || storedTier === 'free') {
      this.user.tier = storedTier;
    }
  }

  static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  getUser(): AppUser {
    return { ...this.user };
  }

  setFirebaseUser(firebaseUser: User | null, profile: UserProfile | null = null): void {
    this.user.firebaseUser = firebaseUser;
    this.user.profile = profile;
    this.user.isAuthenticated = !!firebaseUser;
    
    // Update tier based on profile premium status
    if (profile?.isPremium) {
      this.user.tier = 'premium';
    } else {
      this.user.tier = 'free';
    }
    
    this.notifyListeners();
  }

  setTier(tier: UserTier): void {
    this.user.tier = tier;
    localStorage.setItem(USER_TIER_KEY, tier);
    this.notifyListeners();
  }

  upgradeToPremium(): void {
    this.setTier('premium');
  }

  isPremium(): boolean {
    return this.user.tier === 'premium';
  }

  isAuthenticated(): boolean {
    return this.user.isAuthenticated;
  }

  subscribe(listener: (user: AppUser) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getUser()));
  }

  signOut(): void {
    this.user.firebaseUser = null;
    this.user.profile = null;
    this.user.isAuthenticated = false;
    this.user.tier = 'free';
    this.notifyListeners();
  }
}

export const userStore = UserStore.getInstance();