import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpgradeToPremium } from "@/lib/upgrade-handler";
import { cn } from "@/lib/utils";

interface UpgradeButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  onUpgradeStart?: () => void;
  onUpgradeComplete?: () => void;
}

/**
 * Reusable upgrade button that handles conditional authentication
 * and redirects to Stripe checkout
 */
export function UpgradeButton({ 
  children = "Upgrade to Premium", 
  className, 
  variant = "default",
  size = "default",
  disabled = false,
  onUpgradeStart,
  onUpgradeComplete,
  ...props 
}: UpgradeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    onUpgradeStart?.();
    
    await handleUpgradeToPremium({
      onLoadingChange: setIsProcessing,
      onError: (error) => {
        toast({
          title: "Upgrade failed",
          description: error,
          variant: "destructive",
        });
      },
      onSuccess: () => {
        onUpgradeComplete?.();
        console.log("Redirecting to Stripe checkout...");
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      variant={variant}
      size={size}
      className={cn("group", className)}
      {...props}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          Processing...
        </>
      ) : (
        <>
          <Crown className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          {children}
        </>
      )}
    </Button>
  );
}