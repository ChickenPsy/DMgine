import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { signInWithEmail, signUpWithEmail, resetPassword } from "@/lib/firebase";
import { userStore } from "@/lib/user-store";  
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({});
  const { toast } = useToast();
  
  // Request deduplication and timeout handling
  const requestInProgress = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced form validation
  const validateForm = (email: string, password: string, isSignUp: boolean = false): boolean => {
    const errors: {email?: string; password?: string} = {};
    
    // Email validation
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (isSignUp && password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous requests
    if (requestInProgress.current || isLoading) {
      return;
    }
    
    // Validate form
    if (!validateForm(email, password)) {
      return;
    }

    requestInProgress.current = true;
    setIsLoading(true);
    setValidationErrors({});
    
    // Set timeout for request (10 seconds)
    timeoutRef.current = setTimeout(() => {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        toast({
          title: "Request timeout",
          description: "The sign-in request took too long. Please try again.",
          variant: "destructive",
        });
      }
    }, 10000);

    try {
      const user = await signInWithEmail(email, password);
      
      if (user && requestInProgress.current) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        userStore.setFirebaseUser(user);
        setIsSuccess(true);
        
        toast({
          title: "Welcome back!",
          description: "You're now signed in and ready to create DMs.",
        });
        
        // Small delay to show success state
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 1000);
      }
    } catch (error: any) {
      // Only show error if request is still valid (not timed out)
      if (requestInProgress.current) {
        toast({
          title: "Sign-in failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        
        // Clear timeout if still active
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous requests
    if (requestInProgress.current || isLoading) {
      return;
    }
    
    // Validate form with sign-up specific rules
    if (!validateForm(email, password, true)) {
      return;
    }

    requestInProgress.current = true;
    setIsLoading(true);
    setValidationErrors({});
    
    // Set timeout for request (15 seconds for account creation)
    timeoutRef.current = setTimeout(() => {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        toast({
          title: "Request timeout",
          description: "Account creation took too long. Please try again.",
          variant: "destructive",
        });
      }
    }, 15000);

    try {
      console.log("Starting account creation for:", email);
      const user = await signUpWithEmail(email, password, displayName);
      
      if (user && requestInProgress.current) {
        console.log("Account created successfully:", user.uid);
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        userStore.setFirebaseUser(user);
        setIsSuccess(true);
        
        toast({
          title: "Account created!",
          description: "Welcome! You can now create unlimited DMs.",
        });
        
        // Small delay to show success state
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Account creation failed:", error);
      
      // Only show error if request is still valid (not timed out)
      if (requestInProgress.current) {
        toast({
          title: "Account creation failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        
        // Clear timeout if still active
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous requests
    if (requestInProgress.current || isLoading) {
      return;
    }
    
    if (!email) {
      setValidationErrors({ email: "Email is required" });
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationErrors({ email: "Please enter a valid email address" });
      return;
    }

    requestInProgress.current = true;
    setIsLoading(true);
    setValidationErrors({});
    
    // Set timeout for request
    timeoutRef.current = setTimeout(() => {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        toast({
          title: "Request timeout",
          description: "Password reset took too long. Please try again.",
          variant: "destructive",
        });
      }
    }, 10000);

    try {
      await resetPassword(email);
      
      if (requestInProgress.current) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        toast({
          title: "Reset email sent!",
          description: "Check your email for password reset instructions.",
        });
        setMode('signin');
      }
    } catch (error: any) {
      // Only show error if request is still valid (not timed out)
      if (requestInProgress.current) {
        toast({
          title: "Reset failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (requestInProgress.current) {
        requestInProgress.current = false;
        setIsLoading(false);
        
        // Clear timeout if still active
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setShowPassword(false);
    setIsSuccess(false);
    setValidationErrors({});
    
    // Clean up any ongoing operations
    if (requestInProgress.current) {
      requestInProgress.current = false;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      requestInProgress.current = false;
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {mode === 'signin' && '🔐 Sign In'}
            {mode === 'signup' && '✨ Create Account'}
            {mode === 'forgot' && '🔑 Reset Password'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {mode === 'signin' && (
            <Card className="p-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={`pl-10 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={`pl-10 pr-10 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="w-full"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Success!
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-4 space-y-2 text-sm text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-primary hover:underline"
                >
                  Forgot your password?
                </button>
                <div>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </Card>
          )}

          {mode === 'signup' && (
            <Card className="p-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={`pl-10 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={`pl-10 pr-10 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="w-full"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Account Created!
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-sm text-center">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </Card>
          )}

          {mode === 'forgot' && (
            <Card className="p-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={`pl-10 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="w-full"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Email Sent!
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-sm text-center">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </Card>
          )}
        </div>

        <div className="text-xs text-center text-muted-foreground mt-4">
          By signing up, you agree to our terms of service and privacy policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}