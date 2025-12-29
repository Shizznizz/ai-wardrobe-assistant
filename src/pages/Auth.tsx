
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if the user is new (check if they have preferences)
      checkUserPreferences();
    }
  }, [isAuthenticated, user]);
  
  const checkUserPreferences = async () => {
    if (!user) return;

    // Get Supabase client safely
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

      // If user has no preferences, redirect to quiz
      if (!data) {
        navigate('/quizzes');
      } else {
        // User has preferences, redirect to home
        navigate('/');
      }
    } catch (error) {
      console.error('[Auth] Error checking user preferences:', error);
      navigate('/');
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    // Get Supabase client safely
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Authentication service is currently unavailable. Please check your configuration.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Authentication state is handled by the useAuth hook
      // Redirection is handled by the useEffect above
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error('[Auth] Error signing in:', error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    // Get Supabase client safely
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Authentication service is currently unavailable. Please check your configuration.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      toast.success("Account created! Please check your email for verification.");
      // The redirection will be handled by the useEffect above after auth state changes
    } catch (error: any) {
      console.error('[Auth] Error signing up:', error);
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">Welcome to Olivia</CardTitle>
          <CardDescription className="text-center text-white/70">
            Your personal style assistant
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-slate-900/50">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/50 border-white/10"
                  />
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
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Create Account
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
