import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting fashion trends sync...');

    if (!openAIApiKey) {
      console.log('No OpenAI API key - skipping AI-powered trend discovery');
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped - no API key' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine current and upcoming seasons
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let currentSeason = '';
    let nextSeason = '';
    
    if (month >= 3 && month <= 5) {
      currentSeason = `spring_${year}`;
      nextSeason = `summer_${year}`;
    } else if (month >= 6 && month <= 8) {
      currentSeason = `summer_${year}`;
      nextSeason = `fall_${year}`;
    } else if (month >= 9 && month <= 11) {
      currentSeason = `fall_${year}`;
      nextSeason = `winter_${year}`;
    } else {
      currentSeason = `winter_${year}`;
      nextSeason = `spring_${year + 1}`;
    }

    console.log(`Syncing trends for: ${currentSeason} and ${nextSeason}`);

    // Get existing trends to avoid duplicates
    const { data: existingTrends } = await supabase
      .from('fashion_trends')
      .select('trend_name, season');

    const existingTrendNames = new Set(
      existingTrends?.map(t => `${t.trend_name}-${t.season}`) || []
    );

    // Use OpenAI to discover current fashion trends
    const systemPrompt = `You are a fashion trend analyst with deep knowledge of:
- Runway shows (Paris, Milan, New York, London Fashion Weeks)
- Street style movements
- Designer collections
- Social media fashion trends (TikTok, Instagram)
- Celebrity and influencer style
- Sustainable and ethical fashion movements
- Vintage and archival fashion revivals

Your task: Identify 10 REAL, CURRENT fashion trends for ${currentSeason.replace('_', ' ')} and ${nextSeason.replace('_', ' ')}.

CRITICAL RULES:
- Only trends that are ACTUALLY happening in 2025/2026
- Mix of runway trends and street style
- Include specific details: key colors, fabrics, silhouettes
- Range from high fashion to accessible trends
- Include both bold and subtle movements

Return a JSON array of exactly 10 trends with this structure:
{
  "trends": [
    {
      "trend_name": "Specific trend name (2-4 words)",
      "season": "spring_2025 or summer_2025 etc",
      "description": "Clear, detailed description (30-50 words). Explain WHAT it is, WHY it's trending, HOW to wear it.",
      "colors": ["color1", "color2", "color3"],
      "key_pieces": ["piece1", "piece2", "piece3"],
      "style_tags": ["tag1", "tag2", "tag3"],
      "popularity_score": 75-95 (realistic score based on actual trend momentum)
    }
  ]
}`;

    const userPrompt = `Discover 10 current fashion trends:
- 5 trends for ${currentSeason.replace('_', ' ')}
- 5 trends for ${nextSeason.replace('_', ' ')}

Focus on:
1. What designers showed in recent collections
2. What street style photographers are capturing
3. What fashion editors are writing about
4. What's trending on fashion TikTok/Instagram
5. Sustainable and inclusive fashion movements

Make them SPECIFIC and ACTIONABLE. Avoid generic trends like "oversized blazers" - instead "Boyfriend Blazers with Rolled Sleeves" or "Deconstructed Tailoring".`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.8,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const aiData = await response.json();
      const trendsData = JSON.parse(aiData.choices[0].message.content);
      
      console.log(`AI discovered ${trendsData.trends?.length || 0} trends`);

      // Filter out duplicates and insert new trends
      const newTrends = trendsData.trends.filter((trend: any) => {
        const key = `${trend.trend_name}-${trend.season}`;
        return !existingTrendNames.has(key);
      });

      if (newTrends.length > 0) {
        const { data, error } = await supabase
          .from('fashion_trends')
          .insert(newTrends)
          .select();

        if (error) {
          console.error('Error inserting trends:', error);
          throw error;
        }

        console.log(`✅ Added ${newTrends.length} new fashion trends`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            added: newTrends.length,
            skipped: trendsData.trends.length - newTrends.length,
            trends: data
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('No new trends to add (all exist already)');
        return new Response(
          JSON.stringify({ 
            success: true, 
            added: 0,
            message: 'All trends already exist'
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (aiError) {
      console.error('Error calling OpenAI:', aiError);
      throw aiError;
    }

  } catch (error) {
    console.error('Error in sync-fashion-trends:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
