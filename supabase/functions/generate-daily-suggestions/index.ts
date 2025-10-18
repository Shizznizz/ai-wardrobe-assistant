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

    console.log('Starting daily suggestions generation...');

    // Get all users with preferences
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('user_id, preferred_city, preferred_country, reminder_enabled')
      .eq('reminder_enabled', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Processing ${users?.length || 0} users with reminders enabled`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users || []) {
      try {
        // Fetch user data
        const [wardrobeRes, outfitsRes, prefsRes, weatherRes, trendsRes] = await Promise.all([
          supabase.from('clothing_items').select('*').eq('user_id', user.user_id),
          supabase.from('outfits').select('*').eq('user_id', user.user_id),
          supabase.from('user_preferences').select('*').eq('user_id', user.user_id).single(),
          fetch(`${supabaseUrl}/functions/v1/get-weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              city: user.preferred_city || 'Amsterdam',
              country: user.preferred_country || 'NL'
            })
          }).then(r => r.json()),
          supabase.from('fashion_trends').select('*').limit(5)
        ]);

        const wardrobe = wardrobeRes.data || [];
        const outfits = outfitsRes.data || [];
        const preferences = prefsRes.data;
        const weather = weatherRes;
        const trends = trendsRes.data || [];

        // Find unworn items for reminders
        const unwornItems = wardrobe.filter(item => 
          !item.last_worn || 
          (new Date().getTime() - new Date(item.last_worn).getTime()) > 30 * 24 * 60 * 60 * 1000
        );

        // Create smart reminders for unworn items
        if (unwornItems.length > 0) {
          const reminders = unwornItems.slice(0, 3).map(item => ({
            user_id: user.user_id,
            reminder_type: 'unworn_item',
            item_id: item.id,
            message: `You haven't worn your ${item.color} ${item.type} in a while. Want to style it today?`,
            priority: 6,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }));

          await supabase.from('smart_reminders').insert(reminders);
        }

        // Generate outfit suggestions using OpenAI
        if (openAIApiKey && outfits.length > 0) {
          const systemPrompt = `You are Olivia Bloom, a personal style advisor. Generate 3 outfit suggestions for today.
          
Weather: ${weather.description}, ${weather.temperature}°C
User preferences: ${JSON.stringify(preferences?.favorite_styles || [])}
Current trends: ${trends.map(t => t.trend_name).join(', ')}

Available outfits: ${outfits.map(o => o.name).join(', ')}

Return ONLY outfit IDs from the available outfits list, separated by commas. Also provide brief reasoning.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Generate my daily outfit suggestions' }
              ],
              temperature: 0.7,
              max_tokens: 300
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const suggestion = aiData.choices[0].message.content;
            
            // Extract outfit IDs (simplified - in production would need better parsing)
            const suggestedOutfitIds = outfits
              .slice(0, 3)
              .map(o => o.id);

            // Save daily suggestion
            await supabase.from('daily_suggestions').insert({
              user_id: user.user_id,
              suggestion_date: new Date().toISOString().split('T')[0],
              outfit_ids: suggestedOutfitIds,
              weather_context: weather,
              reasoning: suggestion,
              was_viewed: false,
              was_accepted: false
            });
          }
        }

        processedCount++;
        console.log(`Processed user ${user.user_id}`);

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        errorCount++;
      }
    }

    console.log(`Daily suggestions complete: ${processedCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
