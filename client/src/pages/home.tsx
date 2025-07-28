import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GenerateDmResponse {
  message: string;
  success: boolean;
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
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: { target: string; tone: string }) => {
      const response = await apiRequest("POST", "/api/generate-dm", data);
      return response.json() as Promise<GenerateDmResponse>;
    },
    onSuccess: (data) => {
      if (data.requiresPremium) {
        toast({
          title: "Premium Feature",
          description: data.message,
          variant: "destructive",
        });
      } else {
        setGeneratedMessage(data.message);
        toast({
          title: "DM Generated!",
          description: "Your message is ready to copy.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate DM. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!target.trim()) {
      toast({
        title: "Missing Information",
        description: "Please tell us who you're messaging.",
        variant: "destructive",
      });
      return;
    }
    if (!tone) {
      toast({
        title: "Missing Information", 
        description: "Please select a tone.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate({ target: target.trim(), tone });
  };

  const copyToClipboard = async () => {
    const textToCopy = generatedMessage || exampleOutputs[currentExample as keyof typeof exampleOutputs];
    try {
      await navigator.clipboard.writeText(textToCopy.replace(/"/g, ''));
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">DM</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">DMgine.com</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-800 font-medium">
              About
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all duration-200">
              Go Premium
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-6 leading-tight">
            Generate{" "}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Epic DMs
            </span>
            <br />
            That Actually Work
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            AI-powered direct messages for LinkedIn, Twitter, and business platforms.
            Stop overthinking, start connecting.
          </p>
        </div>

        {/* DM Generator Card */}
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-8">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-semibold text-slate-700 mb-3">
                    Who are you messaging?
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g., Sarah from marketing, cute person from coffee shop..."
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 font-medium"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-semibold text-slate-700 mb-3">
                    Choose your tone
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 font-medium">
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">💼 Professional</SelectItem>
                      <SelectItem value="casual">💬 Casual</SelectItem>
                      <SelectItem value="chaos">⚠️ Chaos Mode (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Message"
                  )}
                </Button>

                {/* Premium Banner */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Unlock Chaos Mode + No Ads</h4>
                      <p className="text-slate-600 text-sm">Get wildly creative messages that stand out</p>
                    </div>
                    <Button className="bg-yellow-400 text-slate-800 font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-300 transition-colors">
                      $7/mo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="block text-sm font-semibold text-slate-700">
                    Your generated message
                  </Label>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    className="text-purple-600 hover:text-indigo-600 font-medium text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </Button>
                </div>

                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 min-h-[200px] relative">
                  {generateMutation.isPending ? (
                    <div className="flex items-center justify-center min-h-[150px]">
                      <div className="text-center">
                        <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-purple-600" />
                        <p className="text-slate-600 font-medium">AI is generating your message...</p>
                      </div>
                    </div>
                  ) : generatedMessage ? (
                    <div>
                      <p className="mb-4 font-medium text-slate-700">Generated Message:</p>
                      <p className="text-slate-600 leading-relaxed">{generatedMessage}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-4 font-medium text-slate-700">Example: Professional Tone</p>
                      <p className="text-slate-600 leading-relaxed">{exampleOutputs.professional}</p>
                    </div>
                  )}
                </div>

                {/* AdSense Placeholder */}
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <p className="text-gray-500 font-medium">Advertisement</p>
                  <p className="text-gray-400 text-sm mt-1">AdSense placement area</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Outputs Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white shadow-lg border border-slate-200 h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">💼</span>
                <h3 className="font-bold text-slate-800 text-base">Professional</h3>
              </div>
              <p className="text-slate-600 text-sm italic leading-relaxed flex-1">
                "Hi Jessica! Your LinkedIn article on sustainable business practices caught my attention.
                The statistics you shared about ROI improvements were fascinating. I'd love to connect and discuss this further."
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border border-slate-200 h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">💬</span>
                <h3 className="font-bold text-slate-800 text-base">Casual</h3>
              </div>
              <p className="text-slate-600 text-sm italic leading-relaxed flex-1">
                "Hey Alex! Really enjoyed your presentation at the tech summit last week. Your approach to scaling B2B partnerships was brilliant. Would love to grab coffee and explore potential collaboration opportunities."
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 h-full relative">
            <div className="absolute top-2 right-2">
              <span className="bg-yellow-400 text-slate-800 text-xs font-bold px-2 py-1 rounded-full">
                PREMIUM
              </span>
            </div>
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-bold text-slate-800 text-base">Chaos Mode</h3>
              </div>
              <p className="text-slate-600 text-sm italic leading-relaxed blur-sm flex-1">
                "Listen up, future business partner in crime! I've been stalking your LinkedIn
                (professionally, obviously) and I'm convinced we need to collaborate before the robots take over..."
              </p>
              <div className="mt-3">
                <button className="text-purple-600 font-semibold text-sm hover:text-indigo-600 transition-colors">
                  Unlock to see full message →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-12">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-slate-800 text-center mb-8">
              Why DMgine Works So Well
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">AI</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">AI-Powered</h4>
                <p className="text-slate-600 text-sm">Advanced GPT models trained on thousands of successful messages</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">⚡</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Instant Results</h4>
                <p className="text-slate-600 text-sm">Generate perfect messages in seconds, not hours of overthinking</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">3</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Multiple Tones</h4>
                <p className="text-slate-600 text-sm">From professional networking to casual business outreach</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DM</span>
            </div>
            <h3 className="text-xl font-bold">DMgine.com</h3>
          </div>
          <p className="text-slate-400 mb-6 text-lg font-medium">
            Written by DMgine.com – Direct Messaging, Engineered.
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
