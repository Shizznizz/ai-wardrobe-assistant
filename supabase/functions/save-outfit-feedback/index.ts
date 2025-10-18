import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { 
      userId, 
      interactionType, 
      rating, 
      feedbackText, 
      outfitData, 
      context,
      wasSuccessful 
    } = await req.json()

    if (!userId || !interactionType) {
      throw new Error('User ID and interaction type are required')
    }

    // Save learning data
    const { data, error } = await supabaseClient
      .from('olivia_learning_data')
      .insert({
        user_id: userId,
        interaction_type: interactionType,
        rating: rating || null,
        feedback_text: feedbackText || null,
        outfit_data: outfitData || {},
        context: context || {},
        was_successful: wasSuccessful !== undefined ? wasSuccessful : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving feedback:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in save-outfit-feedback function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})