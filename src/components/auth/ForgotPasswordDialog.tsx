import { useState } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export default function ForgotPasswordDialog({ open, onOpenChange, defaultEmail = '' }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Service temporarily unavailable. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('[ForgotPassword] Error:', error);
      // Don't reveal if email exists or not for security
      toast.error('If an account exists with this email, you will receive a reset link.');
      setEmailSent(true); // Still show success for security
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setEmailSent(false);
      setEmail(defaultEmail);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {emailSent ? 'Check your email' : 'Reset your password'}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {emailSent 
              ? "We've sent you a link to reset your password. Please check your inbox and spam folder."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" aria-hidden="true" />
            </div>
            <p className="text-sm text-white/60 text-center">
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/50 border-white/10"
                  autoComplete="email"
                  autoFocus
                  aria-describedby="reset-email-hint"
                />
                <p id="reset-email-hint" className="text-xs text-white/50">
                  Enter the email you used to sign up
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
