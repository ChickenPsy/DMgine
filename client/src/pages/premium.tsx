import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { userStore, AppUser } from "@/lib/user-store";
import { updateUserPremiumStatus } from "@/lib/firebase";

export default function Premium() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [user, setUser] = useState<AppUser>(userStore.getUser());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = userStore.subscribe(setUser);
    return unsubscribe;
  }, []);

  const handleUpgrade = async () => {
    if (!user.isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in with Google to upgrade to Premium.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    
    try {
      // Update user premium status in Firestore
      await updateUserPremiumStatus(user.firebaseUser!.uid, true);
      
      // Update local user store
      userStore.upgradeToPremium();
      
      setIsUpgrading(false);
      toast({
        title: "Welcome to Premium! 🎉",
        description: "Your upgrade was successful. Off the Rails Mode is now unlocked!",
      });
    } catch (error) {
      setIsUpgrading(false);
      toast({
        title: "Upgrade failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-800 font-medium flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to DMgine</span>
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">DM</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">gine.com</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          {user.tier === 'premium' ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-12 w-12 text-amber-500" />
                <h2 className="text-5xl md:text-6xl font-black text-slate-800 leading-tight">
                  You're <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">Premium!</span>
                </h2>
              </div>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Enjoy unlimited DM generation and Off the Rails Mode access.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-6 leading-tight">
                Upgrade to{" "}
                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                  Premium
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Unlock Off the Rails Mode, Remove Ads, and Access Your DM History
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Benefits Section */}
          <Card className="bg-white rounded-2xl shadow-xl border border-slate-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Premium Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">Access to Off the Rails Mode</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">No ads, clean interface</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">Save & revisit your DM history</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 font-medium">Premium badge on your profile</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl border-2 border-purple-200">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-2">Premium Plan</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl font-black text-slate-800">$7</span>
                  <span className="text-slate-600 font-medium">/month</span>
                </div>
              </div>

              {user.tier === 'premium' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">You're Premium!</h4>
                  <p className="text-slate-600 mb-6">Welcome to the premium experience</p>
                  <Link href="/">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200">
                      Start Creating Epic DMs
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
                >
                  {isUpgrading ? "Processing..." : "Upgrade for $7/month"}
                </Button>
              )}

              <p className="text-xs text-slate-500 text-center mt-4">
                Cancel anytime. No commitment required.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview */}
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-12">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-slate-800 text-center mb-8">
              What You Get with Off the Rails Mode
            </h3>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <h4 className="font-bold text-slate-700 mb-3">Sample Off the Rails Message:</h4>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-slate-700 italic leading-relaxed">
                  "Listen up, future business partner in crime! I've been professionally stalking your LinkedIn 
                  (totally normal, right?) and I'm convinced we need to collaborate before the robots take over 
                  our jobs. Your recent post about AI in marketing had me nodding so hard I probably looked like 
                  a bobblehead. Want to grab coffee and plot world domination... I mean, discuss synergies?"
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Off the Rails Mode creates wildly entertaining messages that break the rules but somehow work perfectly.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 text-lg font-medium">
            Written by DMgine.com – Direct Messaging, Engineered.
          </p>
        </div>
      </footer>
    </div>
  );
}