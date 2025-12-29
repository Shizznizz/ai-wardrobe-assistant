import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation helpers
function validateUUID(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  // UUID v4 format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  return value;
}

function validateInteractionType(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('interactionType must be a string');
  }
  const allowed = ['outfit_suggested', 'outfit_accepted', 'outfit_rejected', 'feedback_given', 'rating_given', 'item_swapped', 'chat'];
  if (!allowed.includes(value)) {
    throw new Error(`interactionType must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function validateRating(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number') {
    throw new Error('rating must be a number');
  }
  if (value < 1 || value > 5 || !Number.isInteger(value)) {
    throw new Error('rating must be an integer between 1 and 5');
  }
  return value;
}

function validateOptionalString(value: unknown, fieldName: string, maxLength = 1000): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
  return value.trim();
}

function validateOptionalObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  // Validate JSON size (max 50KB)
  const jsonStr = JSON.stringify(value);
  if (jsonStr.length > 50 * 1024) {
    throw new Error(`${fieldName} is too large (max 50KB)`);
  }
  return value as Record<string, unknown>;
}

function validateOptionalBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'boolean') {
    throw new Error('wasSuccessful must be a boolean');
  }
  return value;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    
    // Validate all inputs
    const userId = validateUUID(body.userId, 'userId');
    const interactionType = validateInteractionType(body.interactionType);
    const rating = validateRating(body.rating);
    const feedbackText = validateOptionalString(body.feedbackText, 'feedbackText', 1000);
    const outfitData = validateOptionalObject(body.outfitData, 'outfitData');
    const context = validateOptionalObject(body.context, 'context');
    const wasSuccessful = validateOptionalBoolean(body.wasSuccessful);

    console.log(`[save-outfit-feedback] Saving feedback for user: ${userId}, type: ${interactionType}`);

    // Save learning data
    const { data, error } = await supabaseClient
      .from('olivia_learning_data')
      .insert({
        user_id: userId,
        interaction_type: interactionType,
        rating: rating,
        feedback_text: feedbackText,
        outfit_data: outfitData,
        context: context,
        was_successful: wasSuccessful
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Error saving feedback:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: { id: data.id, created_at: data.created_at }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in save-outfit-feedback function:', error)
    const status = error.message?.includes('must be') || error.message?.includes('too large') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Invalid request' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    )
  }
})
