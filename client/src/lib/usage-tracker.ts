import FingerprintJS from '@fingerprintjs/fingerprintjs';

const USAGE_KEY = 'dmgine_usage';
const DAILY_USAGE_KEY = 'dmgine_daily_usage';
const FINGERPRINT_KEY = 'dmgine_fingerprint';

interface UsageData {
  count: number;
  resetDate: string;
  fingerprint?: string;
}

interface DailyUsageData {
  count: number;
  date: string;
  userId?: string;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private fingerprint: string | null = null;

  private constructor() {}

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize FingerprintJS for soft identity tracking
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      this.fingerprint = result.visitorId;
      
      // Store fingerprint for cross-session tracking
      localStorage.setItem(FINGERPRINT_KEY, this.fingerprint);
    } catch (error) {
      console.warn('Failed to initialize fingerprint:', error);
      // Fallback to stored fingerprint or generate random ID
      this.fingerprint = localStorage.getItem(FINGERPRINT_KEY) || Math.random().toString(36);
      localStorage.setItem(FINGERPRINT_KEY, this.fingerprint);
    }
  }

  private getTodayString(): string {
    return new Date().toDateString();
  }

  private getUsageData(): UsageData {
    const stored = localStorage.getItem(USAGE_KEY);
    if (!stored) {
      return { count: 0, resetDate: this.getTodayString() };
    }

    try {
      const data: UsageData = JSON.parse(stored);
      
      // Reset count if it's a new day
      if (data.resetDate !== this.getTodayString()) {
        return { count: 0, resetDate: this.getTodayString(), fingerprint: this.fingerprint || undefined };
      }
      
      return data;
    } catch {
      return { count: 0, resetDate: this.getTodayString() };
    }
  }

  private saveUsageData(data: UsageData): void {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
  }

  getFreeUsageCount(): number {
    return this.getUsageData().count;
  }

  canUseFree(): boolean {
    return this.getFreeUsageCount() < 3;
  }

  incrementFreeUsage(): number {
    const data = this.getUsageData();
    data.count += 1;
    data.fingerprint = this.fingerprint || undefined;
    this.saveUsageData(data);
    return data.count;
  }

  resetUsage(): void {
    localStorage.removeItem(USAGE_KEY);
    localStorage.removeItem(DAILY_USAGE_KEY);
  }

  // Check if user has reached the free limit
  hasReachedFreeLimit(): boolean {
    return this.getFreeUsageCount() >= 3;
  }

  // Get remaining free uses
  getRemainingFreeUses(): number {
    return Math.max(0, 3 - this.getFreeUsageCount());
  }

  // Daily usage methods for authenticated users
  private getDailyUsageData(): DailyUsageData {
    const stored = localStorage.getItem(DAILY_USAGE_KEY);
    if (!stored) {
      return { count: 0, date: this.getTodayString() };
    }

    try {
      const data: DailyUsageData = JSON.parse(stored);
      
      // Reset count if it's a new day
      if (data.date !== this.getTodayString()) {
        return { count: 0, date: this.getTodayString() };
      }
      
      return data;
    } catch {
      return { count: 0, date: this.getTodayString() };
    }
  }

  private saveDailyUsageData(data: DailyUsageData): void {
    localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(data));
  }

  getDailyUsageCount(): number {
    return this.getDailyUsageData().count;
  }

  canUseDaily(): boolean {
    return this.getDailyUsageCount() < 10;
  }

  incrementDailyUsage(userId?: string): number {
    const data = this.getDailyUsageData();
    data.count += 1;
    data.userId = userId;
    this.saveDailyUsageData(data);
    return data.count;
  }

  getRemainingDailyUses(): number {
    return Math.max(0, 10 - this.getDailyUsageCount());
  }
}

export const usageTracker = UsageTracker.getInstance();