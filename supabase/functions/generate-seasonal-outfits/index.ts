
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define the Outfit type directly in this file instead of importing it
interface Outfit {
  id: string;
  name: string;
  items: string[];
  seasons?: string[];
  season?: string[] | string;
  occasion?: string;
  occasions?: string[];
  favorite?: boolean;
  dateAdded?: string | Date;
  timesWorn?: number;
  lastWorn?: Date;
  notes?: string;
  tags?: string[];
  colors?: string[];
  thumbnail?: string;
  color_scheme?: string;
  personality_tags?: string[];
  description?: string;
  ai_generated?: boolean;
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

interface WeatherData {
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
  }[];
}

interface Location {
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getCurrentSeason(): Promise<string> {
  const now = new Date();
  const month = now.getMonth();
  
  // Northern hemisphere seasons
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

async function getWeatherData(location?: Location): Promise<{ temp: number, condition: string }> {
  try {
    // Default to New York if no location provided
    const lat = location?.lat || 40.7128;
    const lon = location?.lon || -74.0060;
    
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    
    if (!response.ok) {
      console.error('Weather API error:', await response.text());
      // Default weather data
      return { temp: 20, condition: 'sun' };
    }
    
    const data = await response.json() as WeatherData;
    
    // Map OpenWeather conditions to our simplified conditions
    let condition = 'sun';
    if (data.weather && data.weather.length > 0) {
      const mainCondition = data.weather[0].main.toLowerCase();
      if (mainCondition.includes('rain') || mainCondition.includes('drizzle')) {
        condition = 'rain';
      } else if (mainCondition.includes('snow')) {
        condition = 'snow';
      } else if (mainCondition.includes('cloud')) {
        condition = 'cloud';
      }
    }
    
    return {
      temp: Math.round(data.main.temp),
      condition
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Default values if API fails
    return { temp: 20, condition: 'sun' };
  }
}

async function generateOutfitMetadata(tags: string[], season: string, weatherCondition: string): Promise<{ name: string, description: string }> {
  if (!OPENAI_API_KEY) {
    return { 
      name: `${season.charAt(0).toUpperCase() + season.slice(1)} Look`, 
      description: `A stylish outfit perfect for ${season} weather.`
    };
  }
  
  try {
    const prompt = `Generate a creative style name and brief subtitle for a ${season} outfit based on these tags: ${tags.join(', ')} and current weather: ${weatherCondition}. Return JSON format like: {"name": "Style Name", "description": "Brief subtitle under 10 words"}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate outfit metadata');
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    try {
      // Look for JSON object in the response
      const jsonMatch = content.match(/(\{.*\})/s);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          name: parsedResponse.name || `${season.charAt(0).toUpperCase() + season.slice(1)} Style`,
          description: parsedResponse.description || `Perfect for ${season} weather.`
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      name: `${season.charAt(0).toUpperCase() + season.slice(1)} Style`,
      description: `Perfect for ${season} weather.`
    };
  } catch (error) {
    console.error('Error generating outfit metadata:', error);
    // Default values if API fails
    return {
      name: `${season.charAt(0).toUpperCase() + season.slice(1)} Look`,
      description: `A stylish outfit perfect for ${season} weather.`
    };
  }
}

async function fetchSampleOutfits(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .is('deleted_at', null)
      .limit(20);
      
    if (error) {
      console.error('Error fetching sample outfits:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching sample outfits:', error);
    return [];
  }
}

async function generateSeasonalOutfits(season: string, weather: { temp: number, condition: string }): Promise<Outfit[]> {
  // First check if we already have cached outfits and if they're still fresh (less than 24h old)
  const { data: existingData, error: fetchError } = await supabase
    .from('outfit_usage')
    .select('timestamp')
    .eq('action_type', 'seasonal-cache')
    .order('timestamp', { ascending: false })
    .limit(1);
  
  // Check if cache is fresh (less than 24 hours old)
  const isCacheFresh = existingData && existingData.length > 0 && 
    new Date().getTime() - new Date(existingData[0].timestamp).getTime() < 24 * 60 * 60 * 1000;
    
  if (isCacheFresh) {
    // Fetch cached outfits from outfit_usage table
    const { data: cachedOutfits, error: cacheError } = await supabase
      .from('outfit_usage')
      .select('outfit_id')
      .eq('action_type', 'seasonal-suggestion')
      .order('timestamp', { ascending: false })
      .limit(10);
      
    if (!cacheError && cachedOutfits && cachedOutfits.length > 0) {
      // Get full outfit details for each cached outfit
      const outfitIds = cachedOutfits.map(record => record.outfit_id);
      const { data: outfits, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .in('id', outfitIds)
        .is('deleted_at', null);
        
      if (!outfitsError && outfits && outfits.length > 0) {
        console.log('Returning cached seasonal outfits');
        return outfits;
      }
    }
  }
  
  // If cache isn't fresh or we couldn't fetch cached outfits, generate new ones
  console.log('Generating new seasonal outfits');
  
  // Fetch sample outfits to use as a base
  const sampleOutfits = await fetchSampleOutfits();
  if (!sampleOutfits || sampleOutfits.length === 0) {
    return [];
  }
  
  // Select outfits that match the current season
  const seasonalOutfits = sampleOutfits.filter(outfit => {
    // Convert to array if it's a string
    const seasons = Array.isArray(outfit.season) ? outfit.season : [outfit.season];
    return seasons.includes(season) || seasons.includes('all');
  });
  
  if (seasonalOutfits.length === 0) {
    return sampleOutfits.slice(0, 8); // Fallback if no seasonal outfits
  }
  
  // Generate 8 seasonal outfits with AI-enhanced metadata
  const generatedOutfits: Outfit[] = [];
  
  for (let i = 0; i < Math.min(seasonalOutfits.length, 8); i++) {
    const baseOutfit = seasonalOutfits[i];
    const tags = [
      ...(baseOutfit.occasions || []), 
      ...(baseOutfit.tags || []), 
      season, 
      weather.condition
    ].slice(0, 5); // Take max 5 tags
    
    const metadata = await generateOutfitMetadata(tags, season, weather.condition);
    
    const outfit: Outfit = {
      ...baseOutfit,
      name: metadata.name,
      description: metadata.description,
      ai_generated: true,
      dateAdded: new Date()
    };
    
    generatedOutfits.push(outfit);
    
    // Store the generated outfit in the outfit_usage table for caching
    await supabase
      .from('outfit_usage')
      .insert({
        outfit_id: baseOutfit.id,
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        action_type: 'seasonal-suggestion',
        timestamp: new Date().toISOString()
      });
  }
  
  // Store timestamp to mark when cache was updated
  await supabase
    .from('outfit_usage')
    .insert({
      outfit_id: 'cache-timestamp',
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      action_type: 'seasonal-cache',
      timestamp: new Date().toISOString()
    });
  
  return generatedOutfits;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const locationParam = params.get('location');
    
    let location: Location | undefined;
    if (locationParam) {
      try {
        location = JSON.parse(locationParam);
      } catch (e) {
        console.error('Invalid location param:', e);
      }
    }
    
    const season = await getCurrentSeason();
    const weather = await getWeatherData(location);
    const outfits = await generateSeasonalOutfits(season, weather);
    
    return new Response(
      JSON.stringify({
        outfits,
        season,
        weather,
        lastUpdated: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        refreshAfter: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-seasonal-outfits:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})
