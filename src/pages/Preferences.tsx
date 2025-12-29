import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { SlidersHorizontal, ArrowLeftIcon, ShieldAlert, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserPreferences, ClothingColor } from '@/lib/types';
import UserPreferencesForm from '@/components/preferences/UserPreferencesForm';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { saveUserPreferences, getUserPreferences } from '@/integrations/supabase/client';
import PageHeader from '@/components/shared/PageHeader';

const Preferences = () => {
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Default preferences
  const defaultPreferences: UserPreferences = {
    favoriteColors: ['black', 'blue', 'white'] as ClothingColor[],
    favoriteStyles: ['casual', 'minimalist', 'smart casual'],
    personalityTags: ['minimalist', 'casual'],
    seasonalPreferences: {
      spring: { 
        enabled: true, 
        temperatureRange: [10, 22]
      },
      summer: { 
        enabled: true, 
        temperatureRange: [20, 35]
      },
      autumn: { 
        enabled: true, 
        temperatureRange: [8, 20]
      },
      winter: { 
        enabled: true, 
        temperatureRange: [-5, 10]
      },
      all: { 
        enabled: true, 
        temperatureRange: [-10, 40]
      }
    },
    outfitReminders: false,
    reminderTime: '08:00',
    occasionPreferences: ['casual', 'work'],
    climatePreferences: ['temperate_oceanic']
  };
  
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  
  // Load user preferences when component mounts
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log("Fetching preferences for user:", user.id);
        const { success, data, error } = await getUserPreferences(user.id);
        
        if (success && data) {
          console.log("Loaded preferences:", data);
          // Set the preferences with proper type casting
          setPreferences({
            ...data,
            favoriteColors: data.favoriteColors as ClothingColor[]
          });
        } else if (error) {
          console.error("Error loading preferences:", error);
          toast.error("Failed to load your preferences");
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
        toast.error("An error occurred while loading your preferences");
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      loadUserPreferences();
    }
  }, [user, authLoading]);

  // Memoize this function to prevent unnecessary re-renders
  // Must be called before any conditional returns (Rules of Hooks)
  const handleSavePreferences = useCallback(async (newPreferences: UserPreferences) => {
    if (!user) {
      toast.error("You need to be logged in to save preferences");
      return;
    }

    try {
      console.log("Saving preferences:", newPreferences);

      // Update local state with proper type casting
      setPreferences({
        ...newPreferences,
        favoriteColors: newPreferences.favoriteColors as ClothingColor[]
      });

      // Save to Supabase
      const { success, error } = await saveUserPreferences(user.id, newPreferences);

      if (success) {
        toast.success("Your preferences have been saved successfully!");
      } else {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save your preferences");
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      toast.error("An error occurred while saving your preferences");
    }
  }, [user]);

  // If user is not logged in, redirect to auth page
  // This conditional render must come AFTER all hooks
  if (!authLoading && !user) {
    toast.error("You need to be logged in to access preferences", {
      id: "auth-required",
    });
    return <Navigate to="/auth" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
          <p className="mt-4 text-lg text-blue-100/90">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <PageHeader
          title="Your Fashion Preferences"
          subtitle="Let me learn your style so I can give you the best outfit recommendations."
          showAvatar={true}
        />
        
        <motion.div 
          className="space-y-10 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="glass-dark rounded-xl border border-white/10 p-6 space-y-6 bg-black/40 backdrop-blur-lg">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                  <p className="text-lg text-blue-100/90">Loading your preferences...</p>
                </div>
              ) : (
                <>
                  <p className="text-lg text-blue-100/90">
                    Set your preferences to help me provide better outfit recommendations. Your selections will be used to tailor fashion suggestions to your personal style.
                  </p>
                  
                  <UserPreferencesForm
                    initialPreferences={preferences}
                    onSave={handleSavePreferences}
                  />
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Preferences;
