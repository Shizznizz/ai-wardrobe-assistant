import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstantOutfitRequest {
  styleVibe: string;
  occasion: string;
  weather: string;
  userId?: string;
}

interface GeneratedOutfit {
  title: string;
  items: string[];
  reasoning: string;
  palette: string[];
  doNotWear: string[];
}

interface InstantOutfitResponse {
  outfits: GeneratedOutfit[];
  meta: {
    model: string;
    generatedAt: string;
  };
  limitReached?: boolean;
  generationsRemaining?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { styleVibe, occasion, weather, userId }: InstantOutfitRequest = await req.json();

    // Rate limiting for logged-in users
    if (userId) {
      const { data: limitData, error: limitsError } = await supabaseClient
        .from('user_chat_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let currentCount = 0;
      let isPremium = false;
      const today = new Date().toDateString();

      if (limitData) {
        isPremium = limitData.is_premium;
        const lastMessageDate = new Date(limitData.last_message_at).toDateString();

        // Reset count if it's a new day
        if (lastMessageDate !== today) {
          currentCount = 0;
        } else {
          currentCount = limitData.message_count;
        }
      }

      // Check if free user has exceeded limit (10 generations/day)
      if (!isPremium && currentCount >= 10) {
        return new Response(
          JSON.stringify({
            error: 'Generation limit reached',
            limitReached: true,
            generationsRemaining: 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          }
        );
      }

      // Update generation count
      const newCount = currentCount + 1;
      if (limitData) {
        await supabaseClient
          .from('user_chat_limits')
          .update({
            message_count: newCount,
            last_message_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabaseClient
          .from('user_chat_limits')
          .insert({
            user_id: userId,
            message_count: 1,
            last_message_at: new Date().toISOString(),
            is_premium: false
          });
      }
    }

    // Build the prompt for OpenAI
    const systemPrompt = `You are a professional fashion stylist AI. Generate exactly 3 diverse outfit combinations based on the user's criteria.

RULES:
- Each outfit must be distinct (different silhouette, different key items)
- No brand names
- Reasoning must be exactly 2 sentences max
- Items should be specific (e.g., "Camel wool coat" not just "coat")
- Palette should be 3-5 colors that work together
- doNotWear should list 2-3 items that would clash with this outfit

Return ONLY valid JSON with this exact structure:
{
  "outfits": [
    {
      "title": "Outfit Name",
      "items": ["item 1", "item 2", "item 3", "item 4"],
      "reasoning": "One sentence about style. One sentence about weather/occasion fit.",
      "palette": ["color1", "color2", "color3"],
      "doNotWear": ["item to avoid 1", "item to avoid 2"]
    }
  ]
}`;

    const userPrompt = `Generate 3 ${styleVibe} outfits for ${occasion} in ${weather} weather.

Style: ${styleVibe}
Occasion: ${occasion}
Weather: ${weather}

Make them diverse - vary the silhouettes, textures, and key pieces.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let parsedOutfits;
    try {
      parsedOutfits = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate response structure
    if (!parsedOutfits.outfits || !Array.isArray(parsedOutfits.outfits)) {
      throw new Error('Invalid outfit structure in response');
    }

    // Ensure exactly 3 outfits
    const outfits = parsedOutfits.outfits.slice(0, 3);

    const result: InstantOutfitResponse = {
      outfits,
      meta: {
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString()
      }
    };

    // Add remaining generations count for logged-in users
    if (userId) {
      const { data: limitData } = await supabaseClient
        .from('user_chat_limits')
        .select('message_count, is_premium')
        .eq('user_id', userId)
        .single();

      if (limitData && !limitData.is_premium) {
        result.generationsRemaining = Math.max(0, 10 - limitData.message_count);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error generating instant outfits:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate outfits',
        fallback: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
