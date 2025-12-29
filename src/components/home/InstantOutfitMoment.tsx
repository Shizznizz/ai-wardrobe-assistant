import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Upload, Heart, Loader2, CloudRain, Sun, Cloud, Snowflake } from 'lucide-react';
import {
  generateInstantOutfits,
  InstantOutfit,
  StyleVibe,
  Occasion,
  WeatherCondition
} from '@/services/InstantOutfitService';
import { fetchWeatherData, getIconName } from '@/services/WeatherService';
import { WeatherInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InstantOutfitMomentProps {
  hasWardrobeItems: boolean;
}

const STYLE_VIBES: StyleVibe[] = ['Minimalist', 'Boho Chic', 'Sporty', 'Edgy', 'Classic', 'Romantic'];
const OCCASIONS: Occasion[] = ['Work', 'Casual', 'Date Night', 'Weekend'];
const WEATHER_CONDITIONS: WeatherCondition[] = ['Sunny', 'Rainy', 'Cold', 'Hot'];

const weatherIcons: Record<WeatherCondition, any> = {
  Sunny: Sun,
  Rainy: CloudRain,
  Cold: Snowflake,
  Hot: Sun
};

export default function InstantOutfitMoment({ hasWardrobeItems }: InstantOutfitMomentProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [selectedVibe, setSelectedVibe] = useState<StyleVibe>('Minimalist');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('Casual');
  const [autoWeather, setAutoWeather] = useState<WeatherInfo | null>(null);
  const [manualWeather, setManualWeather] = useState<WeatherCondition | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [generatedOutfits, setGeneratedOutfits] = useState<InstantOutfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<Set<string>>(new Set());

  // Auto-fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Default to a common city for demo
        const weather = await fetchWeatherData('New York', 'US');
        setAutoWeather(weather);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, []);

  // Fetch saved instant outfits for logged-in users
  useEffect(() => {
    const fetchSavedOutfits = async () => {
      if (!isAuthenticated || !user?.id || generatedOutfits.length === 0) {
        return;
      }

      try {
        // Create a unique key for each outfit based on its content
        const outfitKeys = generatedOutfits.map(outfit =>
          `${outfit.styleVibe}|${outfit.occasion}|${outfit.title}`
        );

        // Query saved instant outfits that match current generated outfits
        const { data, error } = await supabase
          .from('instant_outfits_saved')
          .select('id, style_vibe, occasion, title')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching saved instant outfits:', error);
          return;
        }

        // Build a set of saved outfit IDs by matching content
        const savedIds = new Set<string>();
        data?.forEach(saved => {
          const savedKey = `${saved.style_vibe}|${saved.occasion}|${saved.title}`;
          generatedOutfits.forEach(outfit => {
            const outfitKey = `${outfit.styleVibe}|${outfit.occasion}|${outfit.title}`;
            if (outfitKey === savedKey) {
              savedIds.add(outfit.id);
            }
          });
        });

        setSavedOutfits(savedIds);
      } catch (error) {
        console.error('Exception fetching saved outfits:', error);
      }
    };

    fetchSavedOutfits();
  }, [isAuthenticated, user?.id, generatedOutfits]);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const result = await generateInstantOutfits(
        selectedVibe,
        selectedOccasion,
        autoWeather,
        manualWeather || undefined,
        user?.id
      );

      // Handle rate limiting
      if (result.limitReached) {
        if (isAuthenticated) {
          toast.error('Daily generation limit reached!', {
            description: 'Upgrade to premium for unlimited outfit generations.',
            action: {
              label: 'Upgrade',
              onClick: () => navigate('/premium')
            }
          });
        } else {
          toast.error('Daily generation limit reached!', {
            description: `Free users get 3 generations per day. Sign up for more!`,
            action: {
              label: 'Sign Up',
              onClick: () => navigate('/auth')
            }
          });
        }
        return;
      }

      setGeneratedOutfits(result.outfits);

      // Show success message with fallback notice if needed
      if (result.usedFallback) {
        toast.success('3 outfits generated!', {
          description: 'Using curated suggestions (AI temporarily unavailable)'
        });
      } else {
        toast.success('3 AI-powered outfits generated just for you!');
      }

      // Show remaining generations for logged-in users
      if (isAuthenticated && result.generationsRemaining !== undefined) {
        if (result.generationsRemaining <= 2) {
          toast.info(`${result.generationsRemaining} generations remaining today`, {
            description: 'Upgrade to premium for unlimited generations!'
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate outfits:', error);
      toast.error('Failed to generate outfits. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = async (outfitId: string) => {
    if (!isAuthenticated) {
      toast.info('Sign up to save your favorite outfits!', {
        action: {
          label: 'Sign Up',
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    if (!user?.id) {
      toast.error('User not found. Please log in again.');
      return;
    }

    const outfit = generatedOutfits.find(o => o.id === outfitId);
    if (!outfit) {
      toast.error('Outfit not found.');
      return;
    }

    const isSaved = savedOutfits.has(outfitId);

    try {
      if (isSaved) {
        // Unsave: Delete from database
        const { error } = await supabase
          .from('instant_outfits_saved')
          .delete()
          .eq('user_id', user.id)
          .eq('style_vibe', outfit.styleVibe)
          .eq('occasion', outfit.occasion)
          .eq('title', outfit.title);

        if (error) {
          console.error('Error unsaving outfit:', error);
          toast.error('Failed to unsave outfit. Please try again.');
          return;
        }

        // Update local state
        setSavedOutfits(prev => {
          const newSet = new Set(prev);
          newSet.delete(outfitId);
          return newSet;
        });

        toast.success('Outfit removed from your collection.');
      } else {
        // Save: Insert into database
        const { error } = await supabase
          .from('instant_outfits_saved')
          .insert({
            user_id: user.id,
            style_vibe: outfit.styleVibe,
            occasion: outfit.occasion,
            weather: currentWeather,
            title: outfit.title,
            items: outfit.items,
            reasoning: outfit.reasoning
          });

        if (error) {
          console.error('Error saving outfit:', error);
          toast.error('Failed to save outfit. Please try again.');
          return;
        }

        // Update local state
        setSavedOutfits(prev => new Set(prev).add(outfitId));
        toast.success('Outfit saved to your collection!');
      }
    } catch (error) {
      console.error('Exception handling save/unsave:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const currentWeather = manualWeather || (autoWeather ? determineWeatherLabel(autoWeather) : 'Sunny');

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-[#1b013c] to-[#12002f]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-coral-400" />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-coral-400 to-purple-400 bg-clip-text text-transparent">
              Instant Outfit Moment
            </h2>
          </div>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Get 3 personalized outfit ideas in seconds. No wardrobe upload needed—just pick your vibe!
          </p>
        </div>

        {/* Selectors */}
        <div className="space-y-6 mb-8">
          {/* Style Vibe Selector */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Style Vibe
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STYLE_VIBES.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(vibe)}
                  className={cn(
                    'px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium',
                    selectedVibe === vibe
                      ? 'border-coral-400 bg-coral-400/20 text-coral-300'
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10'
                  )}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion Selector */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Occasion
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OCCASIONS.map(occasion => (
                <button
                  key={occasion}
                  onClick={() => setSelectedOccasion(occasion)}
                  className={cn(
                    'px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium',
                    selectedOccasion === occasion
                      ? 'border-coral-400 bg-coral-400/20 text-coral-300'
                      : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10'
                  )}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Selector */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Weather
              {loadingWeather && <span className="text-xs text-white/60 ml-2">(detecting...)</span>}
              {!loadingWeather && autoWeather && !manualWeather && (
                <span className="text-xs text-coral-400 ml-2">
                  (auto: {autoWeather.city})
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WEATHER_CONDITIONS.map(condition => {
                const Icon = weatherIcons[condition];
                const isSelected = manualWeather === condition || (!manualWeather && currentWeather === condition);

                return (
                  <button
                    key={condition}
                    onClick={() => setManualWeather(manualWeather === condition ? null : condition)}
                    className={cn(
                      'px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2',
                      isSelected
                        ? 'border-coral-400 bg-coral-400/20 text-coral-300'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {condition}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-coral transition-all duration-300 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Your Outfits...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate 3 Outfits
              </>
            )}
          </Button>
        </div>

        {/* Generated Outfits */}
        {generatedOutfits.length > 0 && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {generatedOutfits.map(outfit => (
                <Card
                  key={outfit.id}
                  className="bg-white/10 border-white/20 backdrop-blur-sm hover:border-coral-400/50 transition-all duration-300"
                >
                  <CardHeader>
                    <CardTitle className="text-white text-xl">{outfit.title}</CardTitle>
                    <CardDescription className="text-white/70">
                      {outfit.styleVibe} • {outfit.occasion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {outfit.items.map((item, idx) => (
                        <li key={idx} className="text-white/90 text-sm flex items-start gap-2">
                          <span className="text-coral-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-white/70 italic border-t border-white/10 pt-4">
                      "{outfit.reasoning}"
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleSaveOutfit(outfit.id)}
                      variant="outline"
                      className={cn(
                        'w-full transition-all duration-200',
                        savedOutfits.has(outfit.id)
                          ? 'border-coral-400 bg-coral-400/20 text-coral-300 hover:bg-coral-400/10'
                          : 'border-coral-400/30 text-coral-300 hover:bg-coral-400/20 hover:border-coral-400/50'
                      )}
                    >
                      <Heart className={cn('w-4 h-4 mr-2', savedOutfits.has(outfit.id) && 'fill-coral-400')} />
                      {savedOutfits.has(outfit.id) ? 'Unsave' : 'Save Outfit'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Secondary CTA for logged-in users with empty wardrobe */}
            {isAuthenticated && !hasWardrobeItems && (
              <div className="mt-8 text-center p-6 bg-white/5 border border-white/20 rounded-xl backdrop-blur-sm">
                <p className="text-white/90 mb-4">
                  Love these outfits? Upload 5 items from your wardrobe to get even more personalized suggestions!
                </p>
                <Button
                  onClick={() => navigate('/my-wardrobe')}
                  variant="outline"
                  className="border-coral-400/50 text-coral-300 hover:bg-coral-400/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your Wardrobe
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function determineWeatherLabel(weather: WeatherInfo): WeatherCondition {
  const temp = weather.temperature;
  const condition = weather.condition.toLowerCase();

  if (condition.includes('rain') || condition.includes('drizzle')) return 'Rainy';
  if (temp < 10) return 'Cold';
  if (temp > 25) return 'Hot';
  return 'Sunny';
}
