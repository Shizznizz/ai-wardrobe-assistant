
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, UserPlus, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { motion } from 'framer-motion';

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
    <div className="relative flex flex-col min-h-[100dvh] items-center justify-center p-4 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px]"
          animate={{ 
            x: [0, -30, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Glass card */}
        <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
          
          {/* Glow border */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative p-8">
            {/* Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-4">
                <Sparkles className="w-8 h-8 text-purple-300" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent mb-2">
                Welcome to Olivia
              </h1>
              <p className="text-white/50 text-sm">
                Your AI-powered style companion
              </p>
            </motion.div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger 
                  value="signin" 
                  aria-label="Switch to sign in form"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-white/10 transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  aria-label="Switch to sign up form"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-white/10 transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} aria-label="Sign in form" className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white/70 text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-300"
                        autoComplete="email"
                        aria-required="true"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white/70 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 pr-12 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-300"
                        autoComplete="current-password"
                        aria-required="true"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors duration-200"
                      aria-label="Open forgot password dialog"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="relative w-full h-12 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 overflow-hidden group"
                      aria-label="Sign in to your account"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/0 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                          <span>Sign In</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} aria-label="Sign up form" className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/70 text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-300"
                        autoComplete="email"
                        aria-required="true"
                        aria-describedby="signup-email-hint"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300" />
                    </div>
                    <p id="signup-email-hint" className="sr-only">
                      Enter a valid email address to create your account
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/70 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 pr-12 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-300"
                        autoComplete="new-password"
                        aria-required="true"
                        aria-describedby="password-requirements"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 -z-10 blur-xl transition-opacity duration-300" />
                    </div>
                    <p id="password-requirements" className="sr-only">
                      Password must be at least 6 characters. Use uppercase, numbers, and symbols for a stronger password.
                    </p>
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  
                  <p className="text-xs text-white/40 leading-relaxed">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                    Complete the style quiz after signup to personalize your experience.
                  </p>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="relative w-full h-12 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:from-blue-500 hover:via-purple-400 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 overflow-hidden group"
                      aria-label="Create a new account"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/0 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
                          <span>Create Account</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-purple-500/30 blur-3xl rounded-full pointer-events-none" />
      </motion.div>

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
