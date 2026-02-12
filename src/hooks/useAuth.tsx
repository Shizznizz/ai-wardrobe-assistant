
import { useState, useEffect, createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/integrations/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // getSupabaseClient() is guaranteed non-null (throws on init failure).
    const supabase = getSupabaseClient();

    // Guard against state updates after unmount or effect re-run.
    let isCurrent = true;

    // Fetches admin role and premium flag from DB in parallel.
    // Returns safe defaults on error so the app never hangs on loading.
    const resolveUserStatus = async (
      userId: string
    ): Promise<{ isAdmin: boolean; isPremium: boolean }> => {
      try {
        const [adminResult, premiumResult] = await Promise.all([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle(),
          // DB-driven premium: uses user_chat_limits.is_premium which is
          // already the source of truth for all edge-function rate limits.
          supabase
            .from('user_chat_limits')
            .select('is_premium')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);

        return {
          isAdmin: adminResult.data !== null,
          isPremium: premiumResult.data?.is_premium === true,
        };
      } catch (error) {
        console.error('Error resolving user status:', error);
        return { isAdmin: false, isPremium: false };
      }
    };

    // Single auth listener — onAuthStateChange fires immediately with the
    // current session (INITIAL_SESSION event in Supabase JS v2), so a
    // separate getSession() call is unnecessary and was previously causing
    // a race condition with duplicate state writes and stale isAdmin.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isCurrent) return;

        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);

        if (session?.user) {
          // Resolve admin + premium BEFORE setting loading=false so that
          // downstream components (ProtectedRoute, AdminDashboard, etc.)
          // never observe stale isAdmin or isPremiumUser on first render.
          resolveUserStatus(session.user.id).then((status) => {
            if (!isCurrent) return;
            setIsAdmin(status.isAdmin);
            setIsPremiumUser(status.isPremium);
            setLoading(false);
          });
        } else {
          setIsPremiumUser(false);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => {
      isCurrent = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error; // Rethrow to handle in the component
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signOut, 
      isAuthenticated,
      isPremiumUser,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
