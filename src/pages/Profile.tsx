import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { useAuth } from '@/hooks/useAuth';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalDetailsSection from '@/components/profile/PersonalDetailsSection';
import LocationSection from '@/components/profile/LocationSection';
import StylePreferencesSection from '@/components/profile/StylePreferencesSection';
import WardrobeBehaviorSection from '@/components/profile/WardrobeBehaviorSection';
import NotificationSection from '@/components/profile/NotificationSection';
import ProfileFooter from '@/components/profile/ProfileFooter';
import { UserPreferences } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AccountSection from '@/components/profile/AccountSection';
import OliviaStyleInsightsSection from '@/components/profile/OliviaStyleInsightsSection';

const Profile = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  
  // Get user preferences from database
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPreferences();
    }
  }, [isAuthenticated, user]);
  
  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      
      // Get user preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error);
        toast.error('Failed to load your profile data');
      } else {
        if (data) {
          // Transform database format to app format
          const preferences: UserPreferences = {
            favoriteColors: data.favorite_colors || [],
            favoriteStyles: data.favorite_styles || [],
            personalityTags: data.personality_tags || [],
            bodyType: data.body_type || 'not-specified',
            seasonalPreferences: data.seasonal_preferences || {
              spring: { enabled: true, temperatureRange: [10, 22] as [number, number] },
              summer: { enabled: true, temperatureRange: [20, 35] as [number, number] },
              autumn: { enabled: true, temperatureRange: [8, 20] as [number, number] },
              winter: { enabled: true, temperatureRange: [-5, 10] as [number, number] },
              all: { enabled: true, temperatureRange: [-10, 40] as [number, number] }
            },
            outfitReminders: data.reminder_enabled || false,
            reminderTime: data.reminder_time || '08:00',
            occasionPreferences: data.occasions_preferences || [],
            climatePreferences: data.climate_preferences || [],
            weatherLocation: data.preferred_city ? {
              city: data.preferred_city,
              country: data.preferred_country || ''
            } : undefined,
            useTrendsGlobal: data.use_trends_global !== undefined ? data.use_trends_global : true,
            useTrendsLocal: data.use_trends_local !== undefined ? data.use_trends_local : true,
            useOnlyWardrobe: data.use_only_wardrobe !== undefined ? data.use_only_wardrobe : false,
            temperatureUnit: data.temperature_unit || 'C',
            weeklyEmailUpdates: data.weekly_email_updates !== undefined ? data.weekly_email_updates : false,
            notifyNewOutfits: data.notify_new_outfits !== undefined ? data.notify_new_outfits : true,
            notifyWeatherChanges: data.notify_weather_changes !== undefined ? data.notify_weather_changes : true,
            pronouns: data.pronouns || 'not-specified',
            appearanceSettings: data.appearance_settings || {
              theme: 'system',
              highContrast: false,
              reduceMotion: false
            }
          };
          setUserPreferences(preferences);
          setOriginalPreferences(JSON.parse(JSON.stringify(preferences))); // Deep copy for comparison
        } else {
          // Set defaults if no preferences exist
          const defaults: UserPreferences = {
            favoriteColors: [],
            favoriteStyles: [],
            personalityTags: [],
            bodyType: 'not-specified',
            seasonalPreferences: {
              spring: { enabled: true, temperatureRange: [10, 22] as [number, number] },
              summer: { enabled: true, temperatureRange: [20, 35] as [number, number] },
              autumn: { enabled: true, temperatureRange: [8, 20] as [number, number] },
              winter: { enabled: true, temperatureRange: [-5, 10] as [number, number] },
              all: { enabled: true, temperatureRange: [-10, 40] as [number, number] }
            },
            outfitReminders: false,
            reminderTime: '08:00',
            occasionPreferences: [],
            climatePreferences: [],
            useTrendsGlobal: true,
            useTrendsLocal: true,
            useOnlyWardrobe: false,
            temperatureUnit: 'C',
            weeklyEmailUpdates: false,
            notifyNewOutfits: true,
            notifyWeatherChanges: true,
            pronouns: 'not-specified',
            appearanceSettings: {
              theme: 'system',
              highContrast: false,
              reduceMotion: false
            }
          };
          setUserPreferences(defaults);
          setOriginalPreferences(JSON.parse(JSON.stringify(defaults))); // Deep copy for comparison
        }
      }
      
      // Also get profile details (first name, last name)
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (!profileError && profileData) {
          setUserPreferences(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              firstName: profileData.first_name || '',
              lastName: profileData.last_name || ''
            };
          });
        }
      }

      // Get quiz results
      await fetchQuizResults();
    } catch (error) {
      console.error("Error in fetchUserPreferences:", error);
      toast.error("Something went wrong loading your profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch quiz results to include in preferences
  const fetchQuizResults = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching quiz results:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Update preferences with quiz results
        setUserPreferences(prev => {
          if (!prev) return prev;
          
          const updatedPrefs = { ...prev };
          
          // Look for the style quiz result specifically
          const styleQuiz = data.find(result => result.quiz_id === 'find-your-style');
          
          if (styleQuiz && styleQuiz.result_value) {
            updatedPrefs.styleQuizResult = {
              ...styleQuiz.result_value,
              completedAt: styleQuiz.created_at,
              styleSummary: styleQuiz.result_value.styleSummary || styleQuiz.result_label
            };
            
            // Extract and merge personality tags if available
            if (styleQuiz.result_value.personalityTags && 
                styleQuiz.result_value.personalityTags.length > 0) {
              // Only add new personality tags that aren't already in the user preferences
              const existingTags = new Set(updatedPrefs.personalityTags || []);
              styleQuiz.result_value.personalityTags.forEach((tag: string) => {
                if (!existingTags.has(tag)) {
                  updatedPrefs.personalityTags = [
                    ...(updatedPrefs.personalityTags || []),
                    tag
                  ];
                }
              });
            }
          }
          
          return updatedPrefs;
        });
      }
    } catch (error) {
      console.error("Error fetching quiz results:", error);
    }
  };
  
  // Check if preferences have changed
  const hasChanges = (): boolean => {
    if (!userPreferences || !originalPreferences) return false;
    return JSON.stringify(userPreferences) !== JSON.stringify(originalPreferences);
  };
  
  const saveProfile = async () => {
    if (!user || !userPreferences) return false;
    
    // Validation for required fields
    if (userPreferences.firstName === '') {
      toast.error('Please enter your first name');
      return false;
    }
    
    setIsSaving(true);
    try {
      // Normalize data to prevent duplicates (case-insensitive)
      userPreferences.favoriteColors = normalizeTags(userPreferences.favoriteColors || []);
      userPreferences.favoriteStyles = normalizeTags(userPreferences.favoriteStyles || []);
      userPreferences.personalityTags = normalizeTags(userPreferences.personalityTags || []);
      userPreferences.occasionPreferences = normalizeTags(userPreferences.occasionPreferences || []);
      
      // Convert preferences to database format
      const preferencesData = {
        user_id: user.id,
        favorite_colors: userPreferences.favoriteColors || [],
        favorite_styles: userPreferences.favoriteStyles || [],
        personality_tags: userPreferences.personalityTags || [],
        body_type: userPreferences.bodyType || 'not-specified',
        seasonal_preferences: userPreferences.seasonalPreferences || {},
        reminder_enabled: userPreferences.outfitReminders || false,
        reminder_time: userPreferences.reminderTime || '08:00',
        occasions_preferences: userPreferences.occasionPreferences || [],
        climate_preferences: userPreferences.climatePreferences || [],
        preferred_city: userPreferences.weatherLocation?.city,
        preferred_country: userPreferences.weatherLocation?.country,
        use_trends_global: userPreferences.useTrendsGlobal,
        use_trends_local: userPreferences.useTrendsLocal,
        use_only_wardrobe: userPreferences.useOnlyWardrobe,
        temperature_unit: userPreferences.temperatureUnit || 'C',
        weekly_email_updates: userPreferences.weeklyEmailUpdates,
        notify_new_outfits: userPreferences.notifyNewOutfits,
        notify_weather_changes: userPreferences.notifyWeatherChanges,
        pronouns: userPreferences.pronouns || 'not-specified',
        appearance_settings: userPreferences.appearanceSettings || {
          theme: 'system',
          highContrast: false,
          reduceMotion: false
        }
      };

      // Check if user has preferences record
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let saveError;
      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update(preferencesData)
          .eq('user_id', user.id);
        
        saveError = error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert([preferencesData]);
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Error saving preferences:', saveError);
        toast.error('Could not save your profile');
        return false;
      }
      
      // Also save profile information (name, pronouns) in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: userPreferences.firstName,
          last_name: userPreferences.lastName,
          pronouns: userPreferences.pronouns
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Could not update your profile details');
        return false;
      }
      
      setOriginalPreferences(JSON.parse(JSON.stringify(userPreferences))); // Update original for change comparison
      toast.success('Profile updated successfully!');
      
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper function to normalize tags and remove duplicates (case-insensitive)
  const normalizeTags = (tags: string[]): string[] => {
    const normalizedTags: string[] = [];
    const lowercaseTags = new Set<string>();
    
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (!lowercaseTags.has(lowerTag)) {
        lowercaseTags.add(lowerTag);
        normalizedTags.push(tag); // Keep original case but avoid duplicates
      }
    }
    
    return normalizedTags;
  };
  
  const renderProfileContent = () => {
    if (!userPreferences) return null;
    
    const profileSections = [
      {
        id: "personal",
        title: "Personal Details",
        content: (
          <PersonalDetailsSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "location",
        title: "Location",
        content: (
          <LocationSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "style",
        title: "Style Preferences",
        content: (
          <StylePreferencesSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "behavior",
        title: "Wardrobe Behavior",
        content: (
          <WardrobeBehaviorSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "notifications",
        title: "Notifications",
        content: (
          <NotificationSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "account",
        title: "Account",
        content: (
          <AccountSection 
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        )
      },
      {
        id: "insights",
        title: "Olivia's Style Insights",
        content: <OliviaStyleInsightsSection />
      }
    ];
    
    // Render as accordions on mobile, tabs on desktop
    if (isMobile) {
      return (
        <>
          <Accordion type="single" collapsible className="w-full">
            {profileSections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="px-4 py-2">{section.title}</AccordionTrigger>
                <AccordionContent className="p-4 space-y-4 pb-8">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      );
    }
    
    // Desktop layout with tabs - fix horizontal scroll
    return (
      <>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-slate-800/50 border-b border-white/10 rounded-t-lg rounded-b-none w-full justify-start overflow-x-hidden">
            {profileSections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex-shrink-0 whitespace-nowrap"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {profileSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="p-6 space-y-4">
              {section.content}
            </TabsContent>
          ))}
        </Tabs>
      </>
    );
  };
  
  if (loading || isLoading) {
    return (
      <Container className="py-10 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="h-10 w-10 animate-spin text-purple-500" />
          <p className="text-lg text-white/70">Loading your profile...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <>
      <Container className="py-10 pb-20">
        <ProfileHeader />
        
        <Card className="relative mt-6 overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-sm">
          {renderProfileContent()}
        </Card>
        
        {userPreferences && (
          <ProfileFooter
            isSaving={isSaving}
            onSave={saveProfile}
            hasChanges={hasChanges()}
          />
        )}
      </Container>
    </>
  );
};

export default Profile;
