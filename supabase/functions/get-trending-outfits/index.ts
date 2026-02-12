
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to get trending outfits based on user interactions
async function getTrendingOutfits() {
  // Get current date and date 24 hours ago
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Weight factors for different action types
  const actionWeights = {
    'tried': 3,  // Highest weight for trying on an outfit
    'liked': 2,  // Medium weight for liking
    'shared': 2  // Medium weight for sharing
  };
  
  try {
    // First try to get interactions from the last 24 hours
    const { data: recentData, error: recentError } = await supabase
      .from('outfit_usage')
      .select('outfit_id, action_type')
      .gte('timestamp', dayAgo.toISOString())
      .not('action_type', 'eq', 'seasonal-suggestion')
      .not('action_type', 'eq', 'seasonal-cache');
      
    if (recentError) {
      console.error('Error fetching recent outfit usage:', recentError);
      return [];
    }
    
    // If we don't have enough recent data, expand to a week
    let usageData = recentData;
    if (!usageData || usageData.length < 10) {
      const { data: weekData, error: weekError } = await supabase
        .from('outfit_usage')
        .select('outfit_id, action_type')
        .gte('timestamp', weekAgo.toISOString())
        .not('action_type', 'eq', 'seasonal-suggestion')
        .not('action_type', 'eq', 'seasonal-cache');
        
      if (!weekError) {
        usageData = weekData;
      }
    }
    
    // If we still don't have data, return empty array
    if (!usageData || usageData.length === 0) {
      console.log('No usage data found, returning empty array');
      return [];
    }
    
    // Calculate weighted popularity scores for each outfit
    const scores: Record<string, number> = {};
    
    usageData.forEach(record => {
      const { outfit_id, action_type } = record;
      if (!outfit_id) return;
      
      // Calculate weight based on action type
      const weight = actionWeights[action_type as keyof typeof actionWeights] || 1;
      
      // Add to score
      scores[outfit_id] = (scores[outfit_id] || 0) + weight;
    });
    
    // Sort outfits by score and get top 10
    const topOutfitIds = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);
      
    // Fetch complete outfit details
    if (topOutfitIds.length === 0) {
      return [];
    }
    
    const { data: outfits, error: outfitsError } = await supabase
      .from('outfits')
      .select('*')
      .in('id', topOutfitIds)
      .is('deleted_at', null);
    
    if (outfitsError) {
      console.error('Error fetching outfit details:', outfitsError);
      return [];
    }
    
    // Sort outfits by popularity score
    return (outfits || []).sort((a, b) => {
      const scoreA = scores[a.id] || 0;
      const scoreB = scores[b.id] || 0;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('Error getting trending outfits:', error);
    return [];
  }
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
    const trendingOutfits = await getTrendingOutfits();
    
    return new Response(
      JSON.stringify({
        outfits: trendingOutfits,
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-trending-outfits function:', error);
    
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
