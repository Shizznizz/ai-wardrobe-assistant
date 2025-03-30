
import { createClient } from '@supabase/supabase-js';
import { Outfit, ClothingItem, UserPreferences } from '@/lib/types';

// Use direct values for the Supabase URL and anon key
const supabaseUrl = 'https://aaiyxtbovepseasghtth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaXl4dGJvdmVwc2Vhc2dodHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzcxNDMsImV4cCI6MjA1ODA1MzE0M30.Pq66ZdBT_ZEBnPbXkDe-SVMnMvqoNjcuTo05GcPabL0';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper functions for outfit tracking
export const saveOutfitWear = async (userId: string, outfit: Outfit) => {
  // In a real implementation, this would save to a database table
  // For now, we'll just log to console
  console.log(`Saving outfit wear for user ${userId}: ${outfit.name}`);
  
  // Example of how this might be implemented with Supabase
  /* 
  const { data, error } = await supabase
    .from('outfit_wears')
    .insert({
      user_id: userId,
      outfit_id: outfit.id,
      outfit_name: outfit.name,
      date_worn: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error saving outfit wear:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
  */
  
  return { success: true };
};

export const getOutfitHistory = async (userId: string) => {
  // In a real implementation, this would fetch from a database table
  // For now, we'll return a mock response
  console.log(`Fetching outfit history for user ${userId}`);
  
  // Example of how this might be implemented with Supabase
  /*
  const { data, error } = await supabase
    .from('outfit_wears')
    .select('*')
    .eq('user_id', userId)
    .order('date_worn', { ascending: false });
  
  if (error) {
    console.error('Error fetching outfit history:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
  */
  
  return { 
    success: true, 
    data: [] // Mock empty data response
  };
};

// Functions for user preferences
export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
  console.log(`Saving preferences for user ${userId}:`, preferences);

  try {
    // Format the preferences for Supabase storage
    const formattedPreferences = {
      user_id: userId,
      favorite_colors: preferences.favoriteColors,
      favorite_styles: preferences.favoriteStyles,
      seasonal_preferences: preferences.seasonalPreferences,
      reminder_enabled: preferences.outfitReminders,
      occasions_preferences: preferences.occasionPreferences,
      climate_preferences: preferences.climatePreferences,
      personality_tags: preferences.personalityTags
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([formattedPreferences]);

    if (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error saving preferences:', err);
    return { success: false, error: err };
  }
};

export const getUserPreferences = async (userId: string) => {
  console.log(`Fetching preferences for user ${userId}`);

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
      return { success: false, error };
    }

    // If no preferences found, return default values
    if (!data) {
      return { 
        success: true, 
        data: {
          favoriteColors: ['black', 'blue', 'white'],
          favoriteStyles: ['casual', 'minimalist', 'smart casual'],
          personalityTags: ['minimalist', 'casual'],
          seasonalPreferences: {
            spring: { enabled: true, temperatureRange: [10, 22], timeOfYear: [1, 3] },
            summer: { enabled: true, temperatureRange: [20, 35], timeOfYear: [1, 3] },
            autumn: { enabled: true, temperatureRange: [8, 20], timeOfYear: [1, 3] },
            winter: { enabled: true, temperatureRange: [-5, 10], timeOfYear: [1, 3] },
            all: { enabled: true, temperatureRange: [-10, 40] }
          },
          outfitReminders: false,
          reminderTime: '08:00',
          occasionPreferences: ['casual', 'work'],
          climatePreferences: ['temperate_oceanic']
        } 
      };
    }

    // Convert the database format back to our application format
    const appPreferences: UserPreferences = {
      favoriteColors: data.favorite_colors || [],
      favoriteStyles: data.favorite_styles || [],
      seasonalPreferences: data.seasonal_preferences || {
        spring: { enabled: true, temperatureRange: [10, 22], timeOfYear: [1, 3] },
        summer: { enabled: true, temperatureRange: [20, 35], timeOfYear: [1, 3] },
        autumn: { enabled: true, temperatureRange: [8, 20], timeOfYear: [1, 3] },
        winter: { enabled: true, temperatureRange: [-5, 10], timeOfYear: [1, 3] },
        all: { enabled: true, temperatureRange: [-10, 40] }
      },
      outfitReminders: data.reminder_enabled || false,
      reminderTime: data.reminder_time || '08:00',
      occasionPreferences: data.occasions_preferences || [],
      climatePreferences: data.climate_preferences || [],
      personalityTags: data.personality_tags || []
    };

    return { success: true, data: appPreferences };
  } catch (err) {
    console.error('Unexpected error fetching preferences:', err);
    return { success: false, error: err };
  }
};
