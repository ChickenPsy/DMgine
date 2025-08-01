import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { userStore, AppUser } from "@/lib/user-store";
import { handleUpgradeToPremium } from "@/lib/upgrade-handler";

export default function Premium() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [user, setUser] = useState<AppUser>(userStore.getUser());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = userStore.subscribe(setUser);
    return unsubscribe;
  }, []);

  const handleUpgrade = async () => {
    await handleUpgradeToPremium({
      onLoadingChange: setIsUpgrading,
      onError: (error) => {
        toast({
          title: "Upgrade failed",
          description: error,
          variant: "destructive",
        });
      },
      onSuccess: () => {
        // This will be called when redirecting to Stripe, 
        // but user will return to success URL after payment
        console.log("Redirecting to Stripe checkout...");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 font-medium flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Business Assistant</span>
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">DM</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">gine Business</h1>
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
                <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                  You're <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">Premium!</span>
                </h2>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Enjoy unlimited business message generation and premium communication styles.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-slate-100 mb-6 leading-tight">
                Upgrade to{" "}
                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                  Premium
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Choose the plan that fits your business communication needs
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Benefits Section */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Business Features</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Advanced business communication styles</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">No ads, clean interface</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Save & revisit your message history</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Priority customer support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-700">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Professional Plan</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl font-black text-slate-800 dark:text-slate-100">$49</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">/month</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">200 messages/month - Ideal for small teams</p>
              </div>

              {user.tier === 'premium' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">You're Professional!</h4>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">Welcome to the professional experience</p>
                  <Link href="/">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200">
                      Start Creating Business Messages
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
                >
                  {isUpgrading ? "Processing..." : "Upgrade for $49/month"}
                </Button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                Cancel anytime. No commitment required.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* All Business Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Starter Plan */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Starter</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">$19</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">/month</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">50 messages/month</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Perfect for solo entrepreneurs</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">50 professional messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">All standard tones</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Email support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs font-bold px-2 py-1 rounded-full inline-block mb-4">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Professional</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">$49</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">/month</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">200 messages/month</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ideal for small teams</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">200 professional messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Premium communication styles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Message history</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Priority support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Agency</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">$99</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">/month</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Unlimited messages</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">For marketing agencies</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Unlimited messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">All premium features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Team collaboration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">White-label option</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials Section */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 mb-12">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 text-center mb-8">
              What Small Business Owners Say
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-6">
                <p className="text-slate-700 dark:text-slate-300 italic mb-4">
                  "Saves me 2 hours a week on social media outreach. My messages actually get responses now!"
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">- Local Restaurant Owner</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-6">
                <p className="text-slate-700 dark:text-slate-300 italic mb-4">
                  "My influencer partnerships increased 40% with better initial messages. Game changer!"
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">- Boutique Owner</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-6">
                <p className="text-slate-700 dark:text-slate-300 italic mb-4">
                  "Finally sound professional when reaching out to potential clients. Worth every penny."
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">- Consultant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 dark:bg-gray-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 dark:text-slate-300 text-lg font-medium">
            Powered by DMgine Business – Professional Communication, Simplified.
          </p>
        </div>
      </footer>
    </div>
  );
}