
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
    const supabase = getSupabaseClient();

    // If Supabase is not configured, set loading to false and return
    if (!supabase) {
      console.warn('[Auth] Supabase client not available - auth features disabled');
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);

        // Handle premium status - Daniel should be treated as normal user
        // All other authenticated users get premium features
        if (session?.user) {
          const isDanielDeurloo = session.user.email === 'danieldeurloo@hotmail.com';
          setIsPremiumUser(!isDanielDeurloo);

          // Check admin status via user_roles table (not profiles.is_admin)
          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin')
                .maybeSingle();

              setIsAdmin(data !== null);
            } catch (error) {
              console.error('Error fetching admin status:', error);
              setIsAdmin(false);
            }
          }, 0);
        } else {
          setIsPremiumUser(false);
          setIsAdmin(false);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);

      // Set premium status based on email for existing session
      if (session?.user) {
        const isDanielDeurloo = session.user.email === 'danieldeurloo@hotmail.com';
        setIsPremiumUser(!isDanielDeurloo);

        // Check admin status via user_roles table (not profiles.is_admin)
        setTimeout(async () => {
          try {
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'admin')
              .maybeSingle();

            setIsAdmin(data !== null);
          } catch (error) {
            console.error('Error fetching admin status:', error);
            setIsAdmin(false);
          }
        }, 0);
      }

      setLoading(false);
    }).catch(error => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Auth] Cannot sign out - Supabase client not available');
      return;
    }

    try {
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
