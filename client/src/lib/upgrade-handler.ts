import { signInWithEmail } from './firebase';
import { userStore } from './user-store';

export interface UpgradeHandlerOptions {
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

/**
 * Handles the upgrade to premium logic with conditional authentication
 * If user is logged in -> redirect to Stripe checkout
 * If user is not logged in -> sign in first, then redirect to Stripe checkout
 */
export const handleUpgradeToPremium = async (options: UpgradeHandlerOptions = {}) => {
  const { onLoadingChange, onError, onSuccess } = options;
  
  try {
    onLoadingChange?.(true);
    
    const currentUser = userStore.getUser();
    
    // If user is not authenticated, they need to sign in first
    if (!currentUser.isAuthenticated) {
      onLoadingChange?.(false);
      onError?.('Please sign in first to upgrade to Premium.');
      return;
    }
    
    // Now redirect to Stripe checkout
    await redirectToStripeCheckout();
    onSuccess?.();
    
  } catch (error: any) {
    onLoadingChange?.(false);
    console.error('Upgrade handler error:', error);
    onError?.(error.message || 'Failed to process upgrade. Please try again.');
  }
};

/**
 * Creates Stripe checkout session and redirects user
 */
const redirectToStripeCheckout = async () => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: 'price_pro_unlimited',
      successUrl: window.location.origin + '/premium?upgrade=success',
      cancelUrl: window.location.origin + '/premium?upgrade=cancelled',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create checkout session: ${errorText}`);
  }

  const { url } = await response.json();
  
  if (!url) {
    throw new Error('No checkout URL received from server');
  }
  
  // Redirect to Stripe checkout
  window.location.href = url;
};