import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase";
import { userStore } from "@/lib/user-store";
import { usageTracker } from "@/lib/usage-tracker";
import { useToast } from "@/hooks/use-toast";
import { Crown, Zap, CheckCircle2 } from "lucide-react";

interface FreemiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FreemiumModal({ isOpen, onClose, onSuccess }: FreemiumModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        userStore.setFirebaseUser(user);
        toast({
          title: "Welcome back!",
          description: "You now have 10 free DMs per day.",
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    setIsProcessingPayment(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_pro_unlimited', // We'll create this
          successUrl: window.location.origin + '?upgrade=success',
          cancelUrl: window.location.origin + '?upgrade=cancelled',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const usedCount = usageTracker.getFreeUsageCount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            🎯 You've used {usedCount}/3 free DMs
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center text-sm text-muted-foreground mb-6">
          Sign in or upgrade to keep sliding into those DMs!
        </div>

        <div className="space-y-4">
          {/* Free Option */}
          <Card className="p-4 border-2 border-muted hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-semibold">Continue Free</h3>
                <p className="text-sm text-muted-foreground">10 DMs per day with Google sign-in</p>
              </div>
            </div>
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isLoading || isProcessingPayment}
              className="w-full"
              variant="outline"
            >
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </Card>

          {/* Pro Option */}
          <Card className="p-4 border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <h3 className="font-semibold">Go Premium</h3>
                <p className="text-sm text-muted-foreground">Unlimited DMs forever</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">$4.99</div>
                <div className="text-xs text-muted-foreground">one-time</div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Unlimited DM generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>All off the rails mode features</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </div>
            </div>

            <Button 
              onClick={handleUpgradeToPremium}
              disabled={isLoading || isProcessingPayment}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isProcessingPayment ? "Processing..." : "Upgrade to Premium ($4.99)"}
            </Button>
          </Card>
        </div>

        <div className="text-xs text-center text-muted-foreground mt-4">
          No strings attached. Cancel anytime. 
        </div>
      </DialogContent>
    </Dialog>
  );
}