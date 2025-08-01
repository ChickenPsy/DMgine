import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Loader2, Crown, User, LogOut, Zap, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { FreemiumModal } from "@/components/FreemiumModal";
import { AuthModal } from "@/components/AuthModal";
import { usageTracker } from "@/lib/usage-tracker";
import { userStore, AppUser } from "@/lib/user-store";
import { onAuthStateChange, signOutUser, signInWithEmail, signUpWithEmail, getUserProfile, handleRedirectResult } from "@/lib/firebase";

interface GenerateDmResponse {
  message: string;
  success?: boolean;
  requiresPremium?: boolean;
}

const exampleOutputs = {
  professional: `"Hi Sarah! I noticed your recent post about marketing automation trends. Your insights on customer journey mapping really resonated with me. I'd love to connect and potentially discuss some innovative approaches my team has been exploring for similar businesses. Would you be open to a brief chat sometime this week?"`,
  friendly: `"Hey Alex! Really enjoyed your presentation at the tech summit last week. Your approach to scaling B2B partnerships was brilliant. I think there might be some interesting synergies between our companies - would love to grab coffee and explore potential collaboration opportunities."`,
  direct: `"Hi Sarah, I help small businesses increase their social media engagement by 40% on average. Based on your recent posts about customer retention challenges, I believe I can help you achieve similar results. Are you available for a 15-minute call this week?"`,
};

export default function Home() {
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState<string>("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [currentExample, setCurrentExample] = useState("professional");
  const [showFreemiumModal, setShowFreemiumModal] = useState(false);
  const [user, setUser] = useState<AppUser>(userStore.getUser());
  
  // New form states for personalization engine
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [messageReason, setMessageReason] = useState("");
  const [optionalHook, setOptionalHook] = useState("");
  const [useCase, setUseCase] = useState("");
  const [platform, setPlatform] = useState("");
  const [language, setLanguage] = useState("English"); // Default to English
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const { toast } = useToast();

  // Initialize usage tracker and auth
  useEffect(() => {
    const initializeApp = async () => {
      await usageTracker.initialize();
      
      // Ensure Firebase auth state is properly restored
      try {
        await handleRedirectResult();
      } catch (error) {
        console.error("Failed to restore auth state:", error);
      }
      
      // Check for upgrade success from URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('upgrade') === 'success') {
        userStore.upgradeToPremium();
        toast({
          title: "Welcome to Premium! 🎉",
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
    const unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        userStore.setFirebaseUser(firebaseUser, profile);
      } else {
        userStore.signOut();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, [toast]);

  const canGenerate = () => {
    if (user.tier === 'premium') return true;
    if (user.isAuthenticated) return usageTracker.canUseDaily(); // Authenticated users get 10/day
    return usageTracker.canUseFree(); // Non-authenticated get 3 free
  };

  const generateMutation = useMutation({
    mutationFn: async (data: { target: string; tone: string }) => {
      // Check usage limits before making request
      if (!canGenerate()) {
        throw new Error('Usage limit reached');
      }

      // Send new personalization data structure
      const requestData = { 
        recipientName,
        recipientRole,
        companyName,
        reason: messageReason,
        customHook: optionalHook,
        tone,
        scenario: useCase,
        platform,
        language,
        isPremium: user.tier === 'premium'
      };
      
      const response = await apiRequest("POST", "/api/generate-dm", requestData);
      return response.json() as Promise<GenerateDmResponse>;
    },
    onSuccess: (data) => {
      if (data.requiresPremium) {
        setShowFreemiumModal(true);
        return;
      }

      setGeneratedMessage(data.message);
      
      // Track usage for non-premium users
      if (user.tier !== 'premium') {
        if (user.isAuthenticated) {
          usageTracker.incrementDailyUsage(user.firebaseUser?.uid);
        } else {
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
    
    // Validate required fields for new form
    if (!recipientName.trim() || !tone) {
      toast({
        title: "Missing information",
        description: "Please fill in the recipient name and select a tone.",
        variant: "destructive",
      });
      return;
    }

    // Construct target from new form fields
    const targetDescription = `${recipientName}${recipientRole ? `, ${recipientRole}` : ''}${companyName ? ` at ${companyName}` : ''}`;
    
    // Update target state for potential retry in FreemiumModal
    setTarget(targetDescription);
    
    generateMutation.mutate({ 
      target: targetDescription, 
      tone
    });
  };

  const copyToClipboard = async () => {
    if (!generatedMessage) return;
    
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast({
        title: "Copied! 📋",
        description: "Your business message is ready to paste.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast({
      title: "Welcome! 🎉",
      description: "You're now signed in and ready to generate professional messages.",
    });
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
    if (user.tier === 'premium') {
      return <Badge className="bg-amber-500 hover:bg-amber-600"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    
    if (user.isAuthenticated) {
      // For authenticated users, show daily usage (10/day)
      const remaining = usageTracker.getRemainingDailyUses();
      return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />{remaining}/10 messages today</Badge>;
    }
    
    const remaining = usageTracker.getRemainingFreeUses();
    return <Badge variant="outline">{remaining}/3 free</Badge>;
  };

  const isGenerateDisabled = !canGenerate() || generateMutation.isPending || !recipientName.trim() || !tone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content - starts immediately */}
      <main className="container mx-auto px-4 pt-8">
        {/* Call to action for non-authenticated users with usage counter */}
        {!user.isAuthenticated && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Sign in for more messages</h3>
                <p className="text-sm text-muted-foreground">Get 10 business outreach messages per day when you sign in</p>
              </div>
              <Button onClick={handleSignIn} variant="default" disabled={isSigningIn}>
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </div>
            {/* Usage counter positioned in bottom-right with proper spacing */}
            <div className="absolute bottom-2 right-6">
              {getUsageDisplay()}
            </div>
          </div>
        )}
        
        {/* Authenticated user dropdown menu positioned top-right when signed in */}
        {user.isAuthenticated && (
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {getUsageDisplay()}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={user.profile?.photo || user.firebaseUser?.photoURL || ''} 
                      alt={user.profile?.name || user.firebaseUser?.displayName || 'User'} 
                    />
                    <AvatarFallback>
                      {(user.profile?.name || user.firebaseUser?.displayName || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.profile?.name || user.firebaseUser?.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.profile?.email || user.firebaseUser?.email}</p>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/premium" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4" />
                    {user.tier === 'premium' ? 'Manage Plan' : 'Upgrade to Premium'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </main>
      
      {/* Hero Content */}
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-8 overflow-visible">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-normal pb-4">
            <span className="gradient-text-dmgine">
              DMgine
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
            Stop Spending Hours Crafting the Perfect Business DM
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your AI social media assistant writes professional outreach messages in seconds - so you can focus on running your business
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-xl"
              onClick={() => {
                document.querySelector('#recipientName')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }}
            >
              🎯 Generate My First Business Message
            </Button>
            <Link href="/premium">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
                See Plans
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" size="lg" className="text-lg px-8 py-6 rounded-xl">
                📚 Blog
              </Button>
            </Link>
          </div>
          

        </div>

        {/* Smart Personalization Engine */}
        <Card className="max-w-4xl mx-auto p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Smart Business Outreach Engine</h2>
            <p className="text-muted-foreground">Tell us about your recipient and business goals, and we'll craft the perfect professional message</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Recipient Info Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">✍️</span>
                </div>
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="text-sm font-medium">
                    Contact Name
                  </Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g., Sarah Johnson"
                    className="rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientRole" className="text-sm font-medium">
                    Their Role/Title
                  </Label>
                  <Input
                    id="recipientRole"
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    placeholder="e.g., Marketing Manager, Business Owner"
                    className="rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., TechCorp Inc."
                    className="rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="messageReason" className="text-sm font-medium">
                    Purpose of Outreach
                  </Label>
                  <Select value={messageReason} onValueChange={setMessageReason}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="influencer-partnership">Influencer Partnership</SelectItem>
                      <SelectItem value="customer-followup">Customer Follow-up</SelectItem>
                      <SelectItem value="brand-collaboration">Brand Collaboration</SelectItem>
                      <SelectItem value="review-response">Review Response</SelectItem>
                      <SelectItem value="client-outreach">Client Outreach</SelectItem>
                      <SelectItem value="thank-you">Thank You Message</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="optionalHook" className="text-sm font-medium">
                  Context/Hook (Optional)
                </Label>
                <Input
                  id="optionalHook"
                  value={optionalHook}
                  onChange={(e) => setOptionalHook(e.target.value)}
                  placeholder="e.g., Loved your Instagram post about your new product launch"
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Tone Selector Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">🤖</span>
                </div>
                <h3 className="text-lg font-semibold">Communication Style</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="toneStyle" className="text-sm font-medium">
                    Professional Tone
                  </Label>
                  <Select value={tone} onValueChange={(value) => {
                    setTone(value);
                    setCurrentExample(value === 'casual' ? 'casual' : 'professional');
                  }}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Business-focused Standard Tones */}
                      <SelectItem value="professional">🧑‍💼 Professional (formal business communication)</SelectItem>
                      <SelectItem value="friendly">😊 Friendly (warm but professional)</SelectItem>
                      <SelectItem value="direct">📍 Direct (straight to the point)</SelectItem>
                      <SelectItem value="empathetic">💙 Appreciative (thank you messages)</SelectItem>
                      <SelectItem value="assertive">💪 Enthusiastic (excited about partnerships)</SelectItem>
                      
                      {/* Advanced Business Tones */}
                      <SelectItem value="funny-weird">😄 Creative & Engaging</SelectItem>
                      <SelectItem value="curious-intrigued">🤔 Curious & Consultative</SelectItem>
                      <SelectItem value="fanboy-mode">🤩 Admiring & Supportive</SelectItem>
                      <SelectItem value="apologetic">😅 Apologetic & Understanding</SelectItem>
                      
                      {/* Premium Business Tones */}
                      <SelectItem value="bold-cocky" disabled={user.tier !== 'premium'}>
                        😈 Bold & Confident {user.tier !== 'premium' && '(Premium)'}
                      </SelectItem>
                      <SelectItem value="flirty-playful" disabled={user.tier !== 'premium'}>
                        😍 Playful & Charming {user.tier !== 'premium' && '(Premium)'}
                      </SelectItem>
                      <SelectItem value="chaotic-evil" disabled={user.tier !== 'premium'}>
                        🧌 Unconventional & Memorable {user.tier !== 'premium' && '(Premium)'}
                      </SelectItem>
                      <SelectItem value="whisper-mode" disabled={user.tier !== 'premium'}>
                        🤫 Subtle & Intriguing {user.tier !== 'premium' && '(Premium)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Use-Case Scenario Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">📄</span>
                </div>
                <h3 className="text-lg font-semibold">Business Scenario</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="useCase" className="text-sm font-medium">
                    Business Use Case
                  </Label>
                  <Select value={useCase} onValueChange={setUseCase}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select use case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="influencer-outreach">Influencer Partnership Outreach</SelectItem>
                      <SelectItem value="customer-service">Customer Follow-up & Service</SelectItem>
                      <SelectItem value="brand-collaboration">Brand Collaboration Request</SelectItem>
                      <SelectItem value="review-management">Professional Review Response</SelectItem>
                      <SelectItem value="lead-generation">Cold Outreach to Potential Clients</SelectItem>
                      <SelectItem value="customer-appreciation">Customer Thank You Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-sm font-medium">
                    Platform
                  </Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">🌐 LinkedIn</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="twitter">🐦 Twitter</SelectItem>
                      <SelectItem value="instagram">📸 Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-8">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-xl py-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isGenerateDisabled}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Generating Your Professional Message...
                  </>
                ) : (
                  <>
                    🎯 Generate Business Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Use Cases Section */}
        <div className="max-w-6xl mx-auto mt-16 mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect for Every Business Situation</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From influencer partnerships to customer follow-ups, our AI crafts the perfect message for your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Influencer Partnership Outreach</h3>
                <p className="text-muted-foreground">
                  Connect with influencers and content creators for brand collaborations and sponsored content opportunities.
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Follow-up Messages</h3>
                <p className="text-muted-foreground">
                  Nurture customer relationships with thoughtful follow-up messages that show you care about their experience.
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Brand Collaboration Requests</h3>
                <p className="text-muted-foreground">
                  Pitch partnerships and cross-promotional opportunities with other businesses in your industry.
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Review Responses</h3>
                <p className="text-muted-foreground">
                  Respond to customer reviews and comments in a professional, branded voice that builds trust.
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Cold Outreach to Potential Clients</h3>
                <p className="text-muted-foreground">
                  Generate compelling first messages to prospects that open doors to new business opportunities.
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🙏</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Thank You Messages</h3>
                <p className="text-muted-foreground">
                  Show appreciation to loyal customers with personalized thank you messages that strengthen relationships.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Generated Message Display */}
        {generatedMessage && (
          <Card className="max-w-4xl mx-auto mt-8 p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Your Professional Message</h3>
                <Button variant="outline" onClick={copyToClipboard} className="rounded-lg">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Message
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-6 rounded-xl border">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {generatedMessage}
                </p>
              </div>
            </div>
          </Card>
        )}
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultMode="signin"
      />
    </div>
  );
}