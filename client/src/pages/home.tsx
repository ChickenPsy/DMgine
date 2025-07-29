import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2, Crown, User, LogOut, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { FreemiumModal } from "@/components/FreemiumModal";
import { usageTracker } from "@/lib/usage-tracker";
import { userStore, AppUser } from "@/lib/user-store";
import { onAuthStateChange, signOutUser } from "@/lib/firebase";

interface GenerateDmResponse {
  message: string;
  success?: boolean;
  requiresPremium?: boolean;
}

const exampleOutputs = {
  professional: `"Hi Sarah! I noticed your recent post about marketing automation trends. Your insights on customer journey mapping really resonated with me. I'd love to connect and potentially discuss some innovative approaches my team has been exploring. Would you be open to a brief chat sometime this week?"`,
  casual: `"Hey Alex! Really enjoyed your presentation at the tech summit last week. Your approach to scaling B2B partnerships was brilliant. I think there might be some interesting synergies between our companies - would love to grab coffee and explore potential collaboration opportunities."`,
  chaos: `"Listen up, future business partner in crime! I've been stalking your LinkedIn (professionally, obviously) and I'm convinced we need to collaborate before the robots take over our jobs..."`,
};

export default function Home() {
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState<string>("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [currentExample, setCurrentExample] = useState("professional");
  const [showFreemiumModal, setShowFreemiumModal] = useState(false);
  const [user, setUser] = useState<AppUser>(userStore.getUser());
  const { toast } = useToast();

  // Initialize usage tracker and auth
  useEffect(() => {
    const initializeApp = async () => {
      await usageTracker.initialize();
      
      // Check for upgrade success from URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('upgrade') === 'success') {
        userStore.upgradeToPro();
        toast({
          title: "Welcome to Pro! 🎉",
          description: "You now have unlimited DM generation.",
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    initializeApp();

    // Subscribe to user changes
    const unsubscribe = userStore.subscribe(setUser);

    // Setup Firebase auth listener
    const unsubscribeAuth = onAuthStateChange((firebaseUser) => {
      userStore.setFirebaseUser(firebaseUser);
    });

    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, [toast]);

  const canGenerate = () => {
    if (user.tier === 'pro') return true;
    if (user.isAuthenticated) return true; // Authenticated users get 10/day
    return usageTracker.canUseFree(); // Non-authenticated get 3 free
  };

  const generateMutation = useMutation({
    mutationFn: async (data: { target: string; tone: string }) => {
      // Check usage limits before making request
      if (!canGenerate()) {
        throw new Error('Usage limit reached');
      }

      const requestData = { 
        ...data, 
        isPremium: user.tier === 'pro' || tone !== 'chaos' 
      };
      
      const response = await apiRequest("POST", "/generate", requestData);
      return response.json() as Promise<GenerateDmResponse>;
    },
    onSuccess: (data) => {
      if (data.requiresPremium) {
        setShowFreemiumModal(true);
        return;
      }

      setGeneratedMessage(data.message);
      
      // Track usage for non-pro users
      if (user.tier !== 'pro') {
        if (!user.isAuthenticated) {
          usageTracker.incrementFreeUsage();
        }
      }

      toast({
        title: "DM Generated! 🎯",
        description: "Your cold DM is ready to slide into those inboxes.",
      });
    },
    onError: (error) => {
      if (error.message === 'Usage limit reached') {
        setShowFreemiumModal(true);
        return;
      }

      console.error("Error generating DM:", error);
      toast({
        title: "Generation failed",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!target.trim() || !tone) {
      toast({
        title: "Missing information",
        description: "Please fill in both the target person and select a tone.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({ target, tone });
  };

  const copyToClipboard = async () => {
    if (!generatedMessage) return;
    
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast({
        title: "Copied! 📋",
        description: "Your DM is ready to paste.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      userStore.signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUsageDisplay = () => {
    if (user.tier === 'pro') {
      return <Badge className="bg-amber-500 hover:bg-amber-600"><Crown className="w-3 h-3 mr-1" />Pro</Badge>;
    }
    
    if (user.isAuthenticated) {
      return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Signed In</Badge>;
    }
    
    const remaining = usageTracker.getRemainingFreeUses();
    return <Badge variant="outline">{remaining}/3 free</Badge>;
  };

  const isGenerateDisabled = !canGenerate() || generateMutation.isPending || !target.trim() || !tone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">DMgine</h1>
            <span className="text-sm text-muted-foreground">by AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            {getUsageDisplay()}
            
            {user.isAuthenticated && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.firebaseUser?.displayName || user.firebaseUser?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <Link href="/premium">
              <Button variant="outline" size="sm">
                <Crown className="w-4 h-4 mr-2" />
                Go Pro
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Generate Viral Cold DMs
          </h2>
          <p className="text-xl text-muted-foreground mb-2">
            AI-powered messages that actually get replies
          </p>
          {!user.isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              {usageTracker.getRemainingFreeUses()} free generations remaining
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="target" className="text-base font-medium">
                  Who are you reaching out to?
                </Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g., Sarah, a marketing director at a tech startup"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="tone" className="text-base font-medium">
                  Choose your tone
                </Label>
                <Select value={tone} onValueChange={(value) => {
                  setTone(value);
                  setCurrentExample(value);
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select tone style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">
                      💼 Professional - Clean & respectful
                    </SelectItem>
                    <SelectItem value="casual">
                      😊 Casual - Friendly & approachable
                    </SelectItem>
                    <SelectItem value="chaos" disabled={user.tier !== 'pro'}>
                      🔥 Chaos Mode {user.tier !== 'pro' && '(Pro only)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isGenerateDisabled}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {!canGenerate() ? 'Upgrade to Continue' : 'Slide In Smooth'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Output/Example */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {generatedMessage ? "Your Generated DM" : `${currentExample.charAt(0).toUpperCase() + currentExample.slice(1)} Example`}
                </h3>
                {generatedMessage && (
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedMessage || exampleOutputs[currentExample as keyof typeof exampleOutputs]}
                </p>
              </div>
              
              {!generatedMessage && (
                <p className="text-xs text-muted-foreground">
                  This is an example. Fill out the form to generate your personalized DM.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <FreemiumModal 
        isOpen={showFreemiumModal}
        onClose={() => setShowFreemiumModal(false)}
        onSuccess={() => {
          // Retry the generation after successful upgrade/login
          if (target && tone) {
            generateMutation.mutate({ target, tone });
          }
        }}
      />
    </div>
  );
}