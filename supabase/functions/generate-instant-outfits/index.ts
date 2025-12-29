import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function validateRequiredString(value: unknown, fieldName: string, maxLength = 100): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
  return trimmed;
}

function validateOptionalString(value: unknown, fieldName: string, maxLength = 100): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
  return trimmed || undefined;
}

function validateOptionalUUID(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  return value;
}

// Observability helper - structured logging (no PII)
function logEvent(event: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...data
  }));
}

interface InstantOutfitRequest {
  styleVibe: string;
  occasion: string;
  weather: string;
  colorFamily?: string;
  comfortLevel?: string;
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

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    
    // Validate all inputs
    const styleVibe = validateRequiredString(body.styleVibe, 'styleVibe', 50);
    const occasion = validateRequiredString(body.occasion, 'occasion', 100);
    const weather = validateRequiredString(body.weather, 'weather', 50);
    const colorFamily = validateOptionalString(body.colorFamily, 'colorFamily', 50);
    const comfortLevel = validateOptionalString(body.comfortLevel, 'comfortLevel', 30);
    const userId = validateOptionalUUID(body.userId, 'userId');

    let userType = userId ? 'free' : 'logged_out';
    let isPremium = false;

    // Rate limiting for logged-in users
    if (userId) {
      const { data: limitData, error: limitsError } = await supabaseClient
        .from('user_chat_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let currentCount = 0;
      const today = new Date().toDateString();

      if (limitData) {
        isPremium = limitData.is_premium;
        userType = isPremium ? 'premium' : 'free';
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
        logEvent('generation_rate_limited', {
          request_id: requestId,
          user_type: 'free',
          current_count: currentCount,
          limit: 10,
          duration_ms: Date.now() - startTime
        });

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

    // Log request start (after determining user type)
    logEvent('generation_started', {
      request_id: requestId,
      user_type: userType,
      style_vibe: styleVibe,
      occasion,
      weather,
      color_family: colorFamily || 'any',
      comfort_level: comfortLevel || 'any'
    });

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
Weather: ${weather}${colorFamily ? `\nColor Family: ${colorFamily}` : ''}${comfortLevel ? `\nComfort Level: ${comfortLevel}` : ''}

Make them diverse - vary the silhouettes, textures, and key pieces.${colorFamily ? ` Focus on ${colorFamily.toLowerCase()} color palette.` : ''}${comfortLevel ? ` Ensure the fit is ${comfortLevel.toLowerCase()} (${comfortLevel === 'Relaxed' ? 'loose, comfortable, breathable' : comfortLevel === 'Balanced' ? 'moderately fitted, comfortable yet polished' : 'form-fitting, structured, tailored'}).` : ''}`;

    const openaiStartTime = Date.now();
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

      logEvent('openai_call_failed', {
        request_id: requestId,
        status: response.status,
        duration_ms: Date.now() - openaiStartTime
      });

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    logEvent('openai_call_success', {
      request_id: requestId,
      duration_ms: Date.now() - openaiStartTime
    });

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

    logEvent('generation_success', {
      request_id: requestId,
      user_type: userType,
      duration_ms: Date.now() - startTime,
      outfit_count: outfits.length
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    logEvent('generation_failed', {
      request_id: requestId,
      error_message: error.message || 'Unknown error',
      duration_ms: Date.now() - startTime
    });

    console.error('Error generating instant outfits:', error);
    const status = error.message?.includes('must be') || error.message?.includes('cannot be') ? 400 : 500;
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate outfits',
        fallback: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    );
  }
});
