import { User } from "firebase/auth";

export type UserTier = 'free' | 'pro';

export interface AppUser {
  firebaseUser: User | null;
  tier: UserTier;
  isAuthenticated: boolean;
}

const USER_TIER_KEY = 'dmgine_user_tier';

export class UserStore {
  private static instance: UserStore;
  private user: AppUser = {
    firebaseUser: null,
    tier: 'free',
    isAuthenticated: false
  };
  private listeners: ((user: AppUser) => void)[] = [];

  private constructor() {
    // Load tier from localStorage on initialization
    const storedTier = localStorage.getItem(USER_TIER_KEY) as UserTier;
    if (storedTier === 'pro' || storedTier === 'free') {
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

  setFirebaseUser(firebaseUser: User | null): void {
    this.user.firebaseUser = firebaseUser;
    this.user.isAuthenticated = !!firebaseUser;
    this.notifyListeners();
  }

  setTier(tier: UserTier): void {
    this.user.tier = tier;
    localStorage.setItem(USER_TIER_KEY, tier);
    this.notifyListeners();
  }

  upgradeToPro(): void {
    this.setTier('pro');
  }

  isPro(): boolean {
    return this.user.tier === 'pro';
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
    this.user.isAuthenticated = false;
    // Keep tier as it might be pro (paid)
    this.notifyListeners();
  }
}

export const userStore = UserStore.getInstance();