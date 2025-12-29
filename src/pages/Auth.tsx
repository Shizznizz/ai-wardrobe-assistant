
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const Auth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkUserPreferences();
    }
  }, [isAuthenticated, user]);
  
  const checkUserPreferences = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Auth] Supabase client not available - redirecting to home');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error checking user preferences:', error);
      }

      if (!data) {
        navigate('/quizzes');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('[Auth] Error checking user preferences:', error);
      navigate('/');
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Authentication service is currently unavailable. Please try again later.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('[Auth] Error signing in:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!password) {
      toast.error('Please create a password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Authentication service is currently unavailable. Please try again later.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) throw error;

      toast.success('Account created! Please check your email for verification.');
    } catch (error: any) {
      console.error('[Auth] Error signing up:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">
            Welcome to Olivia
          </CardTitle>
          <CardDescription className="text-center text-white/70">
            Your personal style assistant
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-slate-900/50">
            <TabsTrigger value="signin" aria-label="Switch to sign in form">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" aria-label="Switch to sign up form">
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} aria-label="Sign in form">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                    autoComplete="email"
                    aria-required="true"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-950/50 border-white/10 pr-10"
                      autoComplete="current-password"
                      aria-required="true"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/50 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    aria-label="Open forgot password dialog"
                  >
                    Forgot password?
                  </button>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                  aria-label="Sign in to your account"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Sign In</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} aria-label="Sign up form">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                    autoComplete="email"
                    aria-required="true"
                    aria-describedby="signup-email-hint"
                  />
                  <p id="signup-email-hint" className="sr-only">
                    Enter a valid email address to create your account
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-950/50 border-white/10 pr-10"
                      autoComplete="new-password"
                      aria-required="true"
                      aria-describedby="password-requirements"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/50 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p id="password-requirements" className="sr-only">
                    Password must be at least 6 characters. Use uppercase, numbers, and symbols for a stronger password.
                  </p>
                  <PasswordStrengthIndicator password={password} />
                </div>
                
                <p className="text-xs text-white/60">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                  After creating your account, complete the style quiz to personalize your experience.
                </p>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                  aria-label="Create a new account"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Create Account</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        defaultEmail={email}
      />
    </div>
  );
};

export default Auth;
