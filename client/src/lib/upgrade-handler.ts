import { signInWithGoogle } from './firebase';
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
    
    // If user is not authenticated, sign them in first
    if (!currentUser.isAuthenticated) {
      try {
        const firebaseUser = await signInWithGoogle();
        if (firebaseUser) {
          // Update user store with Firebase user
          userStore.setFirebaseUser(firebaseUser);
          // Small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (signInError: any) {
        onLoadingChange?.(false);
        
        // Handle specific sign-in errors
        if (signInError.message.includes('cancelled') || signInError.message.includes('closed-by-user')) {
          onError?.('Sign-in was cancelled. Please try again to upgrade to Premium.');
          return;
        } else if (signInError.message.includes('blocked')) {
          onError?.('Popup was blocked. Please allow popups and try again.');
          return;
        } else {
          onError?.('Failed to sign in. Please try again.');
          return;
        }
      }
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