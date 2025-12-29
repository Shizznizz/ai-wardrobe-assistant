import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Outfit } from '@/lib/types';

import DailyOutfitSection from '@/components/outfits/mix-match/DailyOutfitSection';
import EnhancedWeatherSection from '@/components/outfits/mix-match/EnhancedWeatherSection';
import SuggestedOutfitsSection from '@/components/outfits/mix-match/SuggestedOutfitsSection';
import OliviaRecommendationSection from '@/components/outfits/mix-match/OliviaRecommendationSection';
import CreateOutfitSection from '@/components/outfits/mix-match/CreateOutfitSection';
import OutfitMagicSection from '@/components/outfits/mix-match/OutfitMagicSection';
import CreateOutfitDialog from '@/components/outfits/mix-match/CreateOutfitDialog';
import { useAuth } from '@/hooks/useAuth';
import { useWardrobeData } from '@/hooks/useWardrobeData';
import EnhancedHeroSection from '@/components/shared/EnhancedHeroSection';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';
import MixMatchActions from '@/components/outfits/mix-match/MixMatchActions';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/integrations/supabase/client';

// localStorage keys for persistence
const WEATHER_STORAGE_KEY = 'olivia_weather_preferences';

interface SavedWeatherPrefs {
  temperature: number;
  weatherCondition: string;
  situation: string;
  savedAt: string;
}

function loadWeatherPreferences(): Partial<SavedWeatherPrefs> {
  try {
    const stored = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (stored) {
      const prefs = JSON.parse(stored) as SavedWeatherPrefs;
      // Only use if saved within last 24 hours
      const savedAt = new Date(prefs.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return prefs;
      }
    }
  } catch (e) {
    console.warn('[MixAndMatch] Failed to load weather preferences:', e);
  }
  return {};
}

function saveWeatherPreferences(prefs: Omit<SavedWeatherPrefs, 'savedAt'>) {
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify({
      ...prefs,
      savedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('[MixAndMatch] Failed to save weather preferences:', e);
  }
}

const MixAndMatch = () => {
  const { isAuthenticated, user } = useAuth();
  const { clothingItems, outfits, isLoadingItems, isLoadingOutfits, refreshOutfits } = useWardrobeData();
  
  // Load persisted weather preferences
  const savedPrefs = loadWeatherPreferences();
  
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [temperature, setTemperature] = useState(savedPrefs.temperature ?? 72);
  const [weatherCondition, setWeatherCondition] = useState(savedPrefs.weatherCondition ?? 'clear');
  const [situation, setSituation] = useState(savedPrefs.situation ?? 'casual');
  const [isCreateOutfitDialogOpen, setIsCreateOutfitDialogOpen] = useState(false);
  const [savedToday, setSavedToday] = useState<string[]>([]);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check Supabase availability on mount
  useEffect(() => {
    const client = getSupabaseClient();
    setSupabaseAvailable(!!client);
  }, []);
  
  // Persist weather preferences when they change
  useEffect(() => {
    saveWeatherPreferences({ temperature, weatherCondition, situation });
  }, [temperature, weatherCondition, situation]);
  
  // Scroll to top on page load
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleStyleMe = () => {
    if (clothingItems.length === 0) {
      toast.warning("Please add some clothing items to your wardrobe first");
      return;
    }
    
    setShowRecommendation(true);
    toast.success("Generating outfit recommendations...");
    
    setTimeout(() => {
      const recommendationSection = document.getElementById('olivia-recommendation');
      if (recommendationSection) {
        recommendationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  };

  const handleWeatherUpdate = useCallback((weatherInfo: any) => {
    if (weatherInfo.temperature) {
      setTemperature(weatherInfo.temperature);
    }
    if (weatherInfo.condition) {
      setWeatherCondition(weatherInfo.condition.toLowerCase());
    }
  }, []);

  const handleSituationChange = useCallback((newSituation: string) => {
    setSituation(newSituation);
  }, []);

  const handleSaveOutfit = async (outfit: Outfit) => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      if (user) {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setSupabaseAvailable(false);
          toast.error("Unable to save outfit", {
            description: "Database service is currently unavailable. Your outfit was not saved.",
            duration: 5000
          });
          return;
        }

        const { error } = await supabase
          .from('outfits')
          .insert({
            id: outfit.id,
            name: outfit.name,
            items: outfit.items,
            season: outfit.season,
            occasion: outfit.occasion,
            occasions: outfit.occasions,
            favorite: outfit.favorite,
            times_worn: outfit.timesWorn,
            user_id: user.id,
            date_added: new Date().toISOString()
          });

        if (error) {
          console.error('[MixAndMatch] Error saving outfit to database:', error);
          
          // Provide specific error messages based on error type
          let errorMessage = "Failed to save outfit to your collection.";
          if (error.code === '23505') {
            errorMessage = "This outfit already exists in your collection.";
          } else if (error.code === '42501') {
            errorMessage = "Permission denied. Please try logging in again.";
          } else if (error.message?.includes('network')) {
            errorMessage = "Network error. Please check your connection and try again.";
          }
          
          toast.error("Save failed", {
            description: errorMessage,
            duration: 5000
          });
          return;
        }
        
        // Mark as saved today
        setSavedToday(prev => [...prev, outfit.id]);
      }

      // Refresh outfits data
      if (refreshOutfits) {
        await refreshOutfits();
      }

      toast.success("Outfit saved!", {
        description: `"${outfit.name}" has been added to your collection.`,
        duration: 3000
      });

      // Scroll to outfits section
      const outfitsSection = document.getElementById('saved-outfits-section');
      if (outfitsSection) {
        setTimeout(() => {
          outfitsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (error: any) {
      console.error('[MixAndMatch] Error saving outfit:', error);
      toast.error("Something went wrong", {
        description: error?.message || "Failed to save outfit. Please try again.",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const scrollToOutfits = () => {
    const outfitsSection = document.querySelector('#saved-outfits-section');
    if (outfitsSection) {
      outfitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSuggestAnotherOutfit = () => {
    setShowRecommendation(true);
    toast.info('Creating a new outfit suggestion for you...');
    
    setTimeout(() => {
      if (!showRecommendation) {
        setShowRecommendation(true);
      }
      
      const recommendationSection = document.getElementById('olivia-recommendation');
      if (recommendationSection) {
        recommendationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };
  
  const renderEmptyWardrobeNotice = () => {
    if (!isLoadingItems && clothingItems.length === 0) {
      return (
        <Alert variant="warning" className="mb-6 bg-blue-900/20 border-blue-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Empty Wardrobe</AlertTitle>
          <AlertDescription>
            Add some clothing items to your wardrobe to create outfits.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const renderServiceUnavailableNotice = () => {
    if (!supabaseAvailable) {
      return (
        <Alert className="mb-6 bg-orange-900/20 border-orange-500/50">
          <WifiOff className="h-4 w-4 text-orange-400" />
          <AlertTitle className="text-orange-300">Limited Functionality</AlertTitle>
          <AlertDescription className="text-orange-200/80">
            Some features are temporarily unavailable. You can still browse outfits, but saving won't work until the connection is restored.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const renderSavedTodayBadge = () => {
    if (savedToday.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-50 bg-green-600/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          {savedToday.length} outfit{savedToday.length > 1 ? 's' : ''} saved today
        </span>
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
      {renderSavedTodayBadge()}
      
      <EnhancedHeroSection
        title="Your Daily Style, Curated by Olivia"
        subtitle="Olivia creates outfits that reflect your vibe, wardrobe, and even the weather."
        image={{
          src: "/lovable-uploads/c1e6bf5e-6916-4ef2-b396-c00b6c7086f2.png",
          alt: "Woman in beige linen two-piece with hat"
        }}
        buttons={[
          {
            label: "Let Olivia Style Me Today",
            onClick: handleStyleMe,
            variant: "lavender"
          }
        ]}
        actions={<MixMatchActions 
          onScrollToOutfits={scrollToOutfits} 
          onOpenCreateOutfitDialog={() => setIsCreateOutfitDialogOpen(true)} 
        />}
      />
      
      <div className="container mx-auto px-4 space-y-10 pt-6 pb-20">
        {renderServiceUnavailableNotice()}
        {renderEmptyWardrobeNotice()}
        
        <EnhancedWeatherSection 
          onWeatherUpdate={handleWeatherUpdate}
          onSituationChange={handleSituationChange}
          onTemperatureChange={setTemperature}
          onWeatherConditionChange={setWeatherCondition}
          temperature={temperature}
          weatherCondition={weatherCondition}
        />
        
        <DailyOutfitSection
          clothingItems={clothingItems} 
          currentOutfit={currentOutfit}
          isLoading={isLoadingItems} 
        />
            
        <div id="saved-outfits-section">
          <SuggestedOutfitsSection 
            clothingItems={clothingItems} 
            outfits={outfits}
            weather={{
              temperature,
              condition: weatherCondition
            }}
            isLoading={isLoadingOutfits}
          />
          
          {outfits && outfits.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleSuggestAnotherOutfit}
                variant="outline"
                className="border-purple-500/30 text-white hover:bg-purple-800/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Suggest Another Outfit
              </Button>
            </div>
          )}
        </div>
            
        {showRecommendation && (
          <div id="olivia-recommendation">
            <OliviaRecommendationSection 
              weather={{
                temperature,
                condition: weatherCondition
              }}
              situation={situation}
              clothingItems={clothingItems}
              enableShuffle={true}
            />
          </div>
        )}
            
        <CreateOutfitSection 
          clothingItems={clothingItems}
          isPremium={isAuthenticated}
          isLoading={isLoadingItems}
        />
      </div>
      
      <OutfitMagicSection />
      
      <CreateOutfitDialog
        open={isCreateOutfitDialogOpen}
        onOpenChange={setIsCreateOutfitDialogOpen}
        clothingItems={clothingItems}
        onSave={handleSaveOutfit}
      />
    </div>
  );
};

export default MixAndMatch;
