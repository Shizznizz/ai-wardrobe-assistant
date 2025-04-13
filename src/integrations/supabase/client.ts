
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClothingItem, Outfit, UserPreferences } from '@/lib/types';
import { toast } from 'sonner';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';

// Initialize Supabase client
export const supabase = createClient(
  'https://aaiyxtbovepseasghtth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaXl4dGJvdmVwc2Vhc2dodHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzcxNDMsImV4cCI6MjA1ODA1MzE0M30.Pq66ZdBT_ZEBnPbXkDe-SVMnMvqoNjcuTo05GcPabL0'
);

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_PREFIX = 'stylebloom_cache_';

// Function to get cached data
const getCachedData = <T>(key: string): { data: T | null, timestamp: number } | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const { data, timestamp } = JSON.parse(cachedItem);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return { data, timestamp };
    }
    
    // Clear expired cache
    localStorage.removeItem(cacheKey);
    return null;
  } catch (err) {
    console.error('Error reading from cache:', err);
    return null;
  }
};

// Function to set cached data
const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (err) {
    console.error('Error writing to cache:', err);
  }
};

// Function to invalidate cache for a specific key
const invalidateCache = (key: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (err) {
    console.error('Error invalidating cache:', err);
  }
};

// Function to save user preferences
export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    // Prepare the data to be saved
    const preferencesData = {
      user_id: userId,
      favorite_colors: preferences.favoriteColors,
      favorite_styles: preferences.favoriteStyles,
      seasonal_preferences: preferences.seasonalPreferences,
      reminder_enabled: preferences.outfitReminders,
      // Convert any other fields as needed
    };

    // Upsert the user preferences (insert if not exists, update if exists)
    const { error } = await supabase
      .from('user_preferences')
      .upsert(preferencesData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error };
    }
    
    // Invalidate user preferences cache
    invalidateCache(`user_preferences_${userId}`);

    return { success: true };
  } catch (err) {
    console.error('Error in saveUserPreferences:', err);
    return { success: false, error: err };
  }
};

// Function to get user preferences with caching
export const getUserPreferences = async (userId: string) => {
  try {
    if (!userId) {
      console.error('No user ID provided for fetching preferences');
      return { success: false, error: 'Authentication required' };
    }
    
    // Try to get cached data first
    const cacheKey = `user_preferences_${userId}`;
    const cachedData = getCachedData<UserPreferences>(cacheKey);
    
    if (cachedData?.data) {
      console.log('Using cached user preferences');
      return { success: true, data: cachedData.data };
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      
      // If the error is "No rows returned", it means the user doesn't have preferences yet
      if (error.code === 'PGRST116') {
        return { success: false, error: null, notFound: true };
      }
      
      return { success: false, error };
    }

    if (!data) {
      return { success: false, notFound: true };
    }

    // Transform the data from the database format to the application format
    const preferences: UserPreferences = {
      favoriteColors: data.favorite_colors || [],
      favoriteStyles: data.favorite_styles || [],
      seasonalPreferences: data.seasonal_preferences || {
        spring: { enabled: true, temperatureRange: [10, 22] },
        summer: { enabled: true, temperatureRange: [20, 35] },
        autumn: { enabled: true, temperatureRange: [8, 20] },
        winter: { enabled: true, temperatureRange: [-5, 10] },
        all: { enabled: true, temperatureRange: [-10, 40] }
      },
      outfitReminders: data.reminder_enabled || false,
      reminderTime: data.reminder_time || '08:00',
      // Map any other fields
    };
    
    // Cache the preferences
    setCachedData(cacheKey, preferences);

    return { success: true, data: preferences };
  } catch (err) {
    console.error('Error in getUserPreferences:', err);
    return { success: false, error: err };
  }
};

// Function to save outfit log
export const saveOutfitLog = async (userId: string, log: Omit<OutfitLog, 'id'>) => {
  try {
    if (!userId) {
      console.error('No user ID provided for saving outfit log');
      return { success: false, error: 'Authentication required' };
    }

    // Prepare the outfit log data
    const outfitLogData = {
      user_id: userId,
      outfit_id: log.outfitId,
      date: log.date instanceof Date ? log.date.toISOString() : log.date,
      time_of_day: log.timeOfDay,
      notes: log.notes || null,
      weather_condition: log.weatherCondition || null,
      temperature: log.temperature || null,
      activity: log.activity || null,
      custom_activity: log.customActivity || null,
      ai_suggested: log.aiSuggested || false
    };

    // Insert the outfit log
    const { data, error } = await supabase
      .from('outfit_logs')
      .insert(outfitLogData)
      .select()
      .single();

    if (error) {
      console.error('Error saving outfit log:', error);
      return { success: false, error };
    }

    // Convert the returned data to the application format
    const savedLog: OutfitLog = {
      id: data.id,
      outfitId: data.outfit_id,
      date: new Date(data.date),
      timeOfDay: data.time_of_day,
      notes: data.notes,
      weatherCondition: data.weather_condition,
      temperature: data.temperature,
      activity: data.activity,
      customActivity: data.custom_activity,
      aiSuggested: data.ai_suggested
    };
    
    // Invalidate outfit logs cache
    invalidateCache(`outfit_logs_${userId}`);

    return { success: true, data: savedLog };
  } catch (err) {
    console.error('Error in saveOutfitLog:', err);
    return { success: false, error: err };
  }
};

// Function to update an outfit log
export const updateOutfitLog = async (userId: string, logId: string, updates: Partial<OutfitLog>) => {
  try {
    if (!userId || !logId) {
      console.error('Missing user ID or log ID for updating outfit log');
      return { success: false, error: 'Missing required information' };
    }

    // Prepare the update data
    const updateData: Record<string, any> = {};
    
    if (updates.outfitId !== undefined) updateData.outfit_id = updates.outfitId;
    if (updates.date !== undefined) {
      updateData.date = updates.date instanceof Date 
        ? updates.date.toISOString() 
        : typeof updates.date === 'string' 
          ? updates.date 
          : new Date(updates.date).toISOString();
    }
    if (updates.timeOfDay !== undefined) updateData.time_of_day = updates.timeOfDay;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if (updates.weatherCondition !== undefined) updateData.weather_condition = updates.weatherCondition || null;
    if (updates.temperature !== undefined) updateData.temperature = updates.temperature || null;
    if (updates.activity !== undefined) updateData.activity = updates.activity || null;
    if (updates.customActivity !== undefined) updateData.custom_activity = updates.customActivity || null;
    if (updates.aiSuggested !== undefined) updateData.ai_suggested = updates.aiSuggested;

    // Update the outfit log
    const { data, error } = await supabase
      .from('outfit_logs')
      .update(updateData)
      .eq('id', logId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating outfit log:', error);
      return { success: false, error };
    }

    // Convert the returned data to the application format
    const updatedLog: OutfitLog = {
      id: data.id,
      outfitId: data.outfit_id,
      date: new Date(data.date),
      timeOfDay: data.time_of_day,
      notes: data.notes,
      weatherCondition: data.weather_condition,
      temperature: data.temperature,
      activity: data.activity,
      customActivity: data.custom_activity,
      aiSuggested: data.ai_suggested
    };
    
    // Invalidate outfit logs cache
    invalidateCache(`outfit_logs_${userId}`);

    return { success: true, data: updatedLog };
  } catch (err) {
    console.error('Error in updateOutfitLog:', err);
    return { success: false, error: err };
  }
};

// Function to get outfit logs for a user with pagination and caching
export const getOutfitLogs = async (userId: string, page = 1, pageSize = 20) => {
  try {
    if (!userId) {
      console.error('No user ID provided for fetching outfit logs');
      return { success: false, error: 'Authentication required' };
    }
    
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Try to get cached data first if it's the first page
    if (page === 1) {
      const cacheKey = `outfit_logs_${userId}`;
      const cachedData = getCachedData<OutfitLog[]>(cacheKey);
      
      if (cachedData?.data) {
        console.log('Using cached outfit logs');
        return { success: true, data: cachedData.data };
      }
    }

    const { data, error, count } = await supabase
      .from('outfit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching outfit logs:', error);
      return { success: false, error };
    }

    // Convert the database format to the application format
    const outfitLogs: OutfitLog[] = data.map(log => ({
      id: log.id,
      outfitId: log.outfit_id,
      date: new Date(log.date),
      timeOfDay: log.time_of_day,
      notes: log.notes,
      weatherCondition: log.weather_condition,
      temperature: log.temperature,
      activity: log.activity,
      customActivity: log.custom_activity,
      aiSuggested: log.ai_suggested
    }));
    
    // Cache only the first page results
    if (page === 1) {
      setCachedData(`outfit_logs_${userId}`, outfitLogs);
    }

    return { 
      success: true, 
      data: outfitLogs,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        pageSize
      }
    };
  } catch (err) {
    console.error('Error in getOutfitLogs:', err);
    return { success: false, error: err };
  }
};

// Function to delete an outfit log
export const deleteOutfitLog = async (userId: string, logId: string) => {
  try {
    if (!userId || !logId) {
      console.error('Missing user ID or log ID for deleting outfit log');
      return { success: false, error: 'Missing required information' };
    }

    const { error } = await supabase
      .from('outfit_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting outfit log:', error);
      return { success: false, error };
    }
    
    // Invalidate outfit logs cache
    invalidateCache(`outfit_logs_${userId}`);

    return { success: true };
  } catch (err) {
    console.error('Error in deleteOutfitLog:', err);
    return { success: false, error: err };
  }
};
