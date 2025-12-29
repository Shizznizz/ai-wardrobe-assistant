import React, { useState, useEffect } from 'react';
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
import { AlertCircle, RefreshCw } from 'lucide-react';
import MixMatchActions from '@/components/outfits/mix-match/MixMatchActions';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/integrations/supabase/client';

const MixAndMatch = () => {
  const { isAuthenticated, user } = useAuth();
  const { clothingItems, outfits, isLoadingItems, isLoadingOutfits, refreshOutfits } = useWardrobeData();
  
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [temperature, setTemperature] = useState(72);
  const [weatherCondition, setWeatherCondition] = useState('clear');
  const [situation, setSituation] = useState('casual');
  const [isCreateOutfitDialogOpen, setIsCreateOutfitDialogOpen] = useState(false);
  
  // Scroll to top on page load
  useEffect(() => {
    // Only scroll to top if not coming from a specific anchor
    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleStyleMe = () => {
    if (clothingItems.length === 0) {
      toast.warning("Please add some clothing items to your wardrobe first");
      return;
    }
    
    setShowRecommendation(true);
    toast.success("Generating outfit recommendations...");
    
    // Scroll to recommendation section
    setTimeout(() => {
      const recommendationSection = document.getElementById('olivia-recommendation');
      if (recommendationSection) {
        recommendationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  };

  // Handle weather section updates
  const handleWeatherUpdate = (weatherInfo: any) => {
    if (weatherInfo.temperature) {
      setTemperature(weatherInfo.temperature);
    }
    if (weatherInfo.condition) {
      setWeatherCondition(weatherInfo.condition.toLowerCase());
    }
  };

  const handleSituationChange = (newSituation: string) => {
    setSituation(newSituation);
  };

  const handleSaveOutfit = async (outfit: Outfit) => {
    try {
      // Save to Supabase if authenticated
      if (user) {
        // Get Supabase client safely
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.warn('[MixAndMatch] Supabase client not available - cannot save outfit');
          toast.error("Unable to save outfit. Database service is currently unavailable.");
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
          toast.error("Failed to save outfit to database. Please try again.");
          return;
        }
      }

      // Refresh outfits data
      if (refreshOutfits) {
        await refreshOutfits();
      }

      toast.success("New outfit created!");

      // Scroll to outfits section
      const outfitsSection = document.getElementById('saved-outfits-section');
      if (outfitsSection) {
        setTimeout(() => {
          outfitsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (error) {
      console.error('[MixAndMatch] Error saving outfit:', error);
      toast.error("Failed to save outfit. Please try again.");
    }
  };
  
  // Function to scroll to outfits section
  const scrollToOutfits = () => {
    const outfitsSection = document.querySelector('#saved-outfits-section');
    if (outfitsSection) {
      outfitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Function to generate a new Olivia recommendation
  const handleSuggestAnotherOutfit = () => {
    setShowRecommendation(true);
    toast.info('Creating a new outfit suggestion for you...');
    
    // Scroll to recommendation section or create it if it doesn't exist yet
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
  
  // Show empty state if no items
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
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
      
      {/* New Magic Section - replaces the ConfidenceSection */}
      <OutfitMagicSection />
      
      {/* Create Outfit Dialog */}
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
