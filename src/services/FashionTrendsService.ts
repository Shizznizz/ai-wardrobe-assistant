import { supabase } from '@/integrations/supabase/client';

export interface FashionTrend {
  id: string;
  season: string;
  trend_name: string;
  description: string;
  colors: string[];
  key_pieces: string[];
  style_tags: string[];
  popularity_score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get current season based on current date
 */
export const getCurrentSeason = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  if (month >= 3 && month <= 5) {
    return `spring_${year}`;
  } else if (month >= 6 && month <= 8) {
    return `summer_${year}`;
  } else if (month >= 9 && month <= 11) {
    return `fall_${year}`;
  } else {
    return `winter_${year}`;
  }
};

/**
 * Get fashion trends for current season
 */
export const getCurrentFashionTrends = async (): Promise<FashionTrend[]> => {
  const currentSeason = getCurrentSeason();
  
  const { data, error } = await supabase
    .from('fashion_trends')
    .select('*')
    .eq('season', currentSeason)
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching fashion trends:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get fashion trends for a specific season
 */
export const getFashionTrendsBySeason = async (season: string): Promise<FashionTrend[]> => {
  const { data, error } = await supabase
    .from('fashion_trends')
    .select('*')
    .eq('season', season)
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching fashion trends:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get all available seasons
 */
export const getAvailableSeasons = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('fashion_trends')
    .select('season')
    .order('season', { ascending: false });

  if (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }

  // Get unique seasons
  const uniqueSeasons = [...new Set(data?.map(item => item.season) || [])];
  return uniqueSeasons;
};

/**
 * Get top fashion trends across all seasons
 */
export const getTopTrends = async (limit: number = 10): Promise<FashionTrend[]> => {
  const { data, error } = await supabase
    .from('fashion_trends')
    .select('*')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top trends:', error);
    throw error;
  }

  return data || [];
};