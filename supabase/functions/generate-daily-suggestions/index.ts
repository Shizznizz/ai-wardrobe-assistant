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

        // Generate outfit suggestions using OpenAI with structured output
        if (openAIApiKey && outfits.length > 0) {
          // Build rich context for better suggestions
          const userStyleContext = `
Style Preferences: ${preferences?.favorite_styles?.join(', ') || 'Not specified'}
Favorite Colors: ${preferences?.favorite_colors?.join(', ') || 'Any'}
Body Type: ${preferences?.body_type || 'Not specified'}
Climate: ${user.preferred_country || 'Not specified'}

Recent Fashion Trends:
${trends.map(t => `- ${t.trend_name}: ${t.description}`).join('\n')}

Available Outfits (${outfits.length} total):
${outfits.map((o, i) => `${i + 1}. ${o.name} (ID: ${o.id}) - ${o.occasion || 'casual'} - Colors: ${o.colors?.join(', ') || 'various'}`).join('\n')}
`;

          const systemPrompt = `You are Olivia Bloom, an expert personal style advisor with deep knowledge of fashion, trends, and individual style preferences.

Today's Context:
Weather: ${weather.description}, ${weather.temperature}°C (Feels like: ${weather.feels_like}°C)
Season: ${new Date().getMonth() < 3 || new Date().getMonth() > 10 ? 'Winter' : new Date().getMonth() < 6 ? 'Spring' : new Date().getMonth() < 9 ? 'Summer' : 'Fall'}

Your task: Suggest 3 perfect outfits for today that:
1. Match the weather conditions perfectly
2. Align with current fashion trends
3. Reflect the user's personal style preferences
4. Are appropriate for typical daily activities

For each suggestion, provide:
- The outfit ID from the available list
- A compelling reason why this outfit is perfect for today
- A style tip or confidence boost

Be warm, encouraging, and fashion-forward in your tone.`;

          try {
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
                  { role: 'user', content: `Here's my style profile and available outfits:\n\n${userStyleContext}\n\nSuggest 3 outfits for today!` }
                ],
                temperature: 0.8,
                max_tokens: 500
              }),
            });

            if (response.ok) {
              const aiData = await response.json();
              const suggestion = aiData.choices[0].message.content;
              
              // Smart outfit selection: prioritize weather-appropriate and recently unworn
              const weatherAppropriate = outfits.filter(o => {
                const temp = weather.temperature;
                if (temp < 10) return o.season?.includes('winter') || o.season?.includes('fall');
                if (temp < 20) return o.season?.includes('spring') || o.season?.includes('fall');
                return o.season?.includes('summer') || o.season?.includes('spring');
              });

              const sortedOutfits = (weatherAppropriate.length > 0 ? weatherAppropriate : outfits)
                .sort((a, b) => {
                  const aWorn = a.last_worn ? new Date(a.last_worn).getTime() : 0;
                  const bWorn = b.last_worn ? new Date(b.last_worn).getTime() : 0;
                  return aWorn - bWorn;
                });

              const suggestedOutfitIds = sortedOutfits
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

              console.log(`Generated suggestions for user ${user.user_id}`);
            } else {
              console.error('OpenAI API error:', response.status);
            }
          } catch (aiError) {
            console.error('Error calling OpenAI:', aiError);
            // Fallback: still create suggestions with smart logic
            const weatherAppropriate = outfits.filter(o => {
              const temp = weather.temperature;
              if (temp < 10) return o.season?.includes('winter') || o.season?.includes('fall');
              if (temp < 20) return o.season?.includes('spring') || o.season?.includes('fall');
              return o.season?.includes('summer') || o.season?.includes('spring');
            });

            const sortedOutfits = (weatherAppropriate.length > 0 ? weatherAppropriate : outfits)
              .sort((a, b) => {
                const aWorn = a.last_worn ? new Date(a.last_worn).getTime() : 0;
                const bWorn = b.last_worn ? new Date(b.last_worn).getTime() : 0;
                return aWorn - bWorn;
              });

            const suggestedOutfitIds = sortedOutfits.slice(0, 3).map(o => o.id);

            await supabase.from('daily_suggestions').insert({
              user_id: user.user_id,
              suggestion_date: new Date().toISOString().split('T')[0],
              outfit_ids: suggestedOutfitIds,
              weather_context: weather,
              reasoning: `Good morning! Based on today's weather (${weather.temperature}°C), here are my top picks for you. These outfits are weather-appropriate and you haven't worn them recently!`,
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
