
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
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  return value;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function validateMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    throw new Error('messages must be an array');
  }
  if (value.length === 0) {
    throw new Error('messages cannot be empty');
  }
  if (value.length > 50) {
    throw new Error('Too many messages (max 50)');
  }
  
  const allowedRoles = ['user', 'assistant', 'system'];
  
  return value.map((msg, index) => {
    if (typeof msg !== 'object' || msg === null) {
      throw new Error(`messages[${index}] must be an object`);
    }
    if (!allowedRoles.includes(msg.role)) {
      throw new Error(`messages[${index}].role must be 'user', 'assistant', or 'system'`);
    }
    if (typeof msg.content !== 'string') {
      throw new Error(`messages[${index}].content must be a string`);
    }
    if (msg.content.length > 4000) {
      throw new Error(`messages[${index}].content is too long (max 4000 characters)`);
    }
    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content.slice(0, 4000) // Enforce limit
    };
  });
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
    
    // Validate inputs
    const userId = validateUUID(body.userId, 'userId');
    const messages = validateMessages(body.messages);
    
    console.log(`[chat-with-olivia] Processing chat for user: ${userId}, messages: ${messages.length}`);

    // Check user's message limit
    const { data: chatLimits, error: limitsError } = await supabaseClient
      .from('user_chat_limits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    let currentCount = 0
    let isPremium = false
    const today = new Date().toDateString()

    if (chatLimits) {
      isPremium = chatLimits.is_premium
      const lastMessageDate = new Date(chatLimits.last_message_at).toDateString()
      
      // Reset count if it's a new day
      if (lastMessageDate !== today) {
        currentCount = 0
      } else {
        currentCount = chatLimits.message_count
      }
    }

    // Check if free user has exceeded limit
    if (!isPremium && currentCount >= 5) {
      return new Response(
        JSON.stringify({ 
          error: 'Message limit reached',
          limitReached: true,
          messageCount: currentCount
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      )
    }

    // Determine current season
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    let currentSeason = ''
    
    if (month >= 3 && month <= 5) {
      currentSeason = `spring_${year}`
    } else if (month >= 6 && month <= 8) {
      currentSeason = `summer_${year}`
    } else if (month >= 9 && month <= 11) {
      currentSeason = `fall_${year}`
    } else {
      currentSeason = `winter_${year}`
    }

    // Fetch user data for context including learning patterns, calendar, and fashion trends
    const [
      { data: userPrefs },
      { data: clothingItems },
      { data: outfits },
      { data: outfitLogs },
      { data: profile },
      { data: learningData },
      { data: calendarEvents },
      { data: fashionTrends }
    ] = await Promise.all([
      supabaseClient.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabaseClient.from('clothing_items').select('*').eq('user_id', userId).order('favorite', { ascending: false }).order('last_worn', { ascending: true, nullsFirst: false }).limit(50),
      supabaseClient.from('outfits').select('*').eq('user_id', userId).order('favorite', { ascending: false }).order('times_worn', { ascending: false }).limit(15),
      supabaseClient.from('outfit_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5),
      supabaseClient.from('profiles').select('first_name, pronouns').eq('id', userId).maybeSingle(),
      supabaseClient.from('olivia_learning_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabaseClient.from('calendar_events').select('*').eq('user_id', userId).gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(5),
      supabaseClient.from('fashion_trends').select('*').eq('season', currentSeason).order('popularity_score', { ascending: false }).limit(5)
    ])

    // Get live weather if user has location set
    let weatherData = null
    if (userPrefs?.preferred_city) {
      try {
        const weatherResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-weather`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            city: userPrefs.preferred_city,
            country: userPrefs.preferred_country
          })
        })
        
        if (weatherResponse.ok) {
          weatherData = await weatherResponse.json()
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
      }
    }

    // Build enhanced context for Olivia with fashion expertise
    let userContext = `You are Olivia Bloom, the user's personal AI stylist and trusted fashion companion. You are confident, warm, and stylist-grade — think of a Vogue fashion editor and a close friend combined. 

You possess EXPERT FASHION KNOWLEDGE:
- Current trends and how to style them
- Color theory and seasonal palettes  
- Fabric combinations and textures
- Occasion-appropriate dressing
- Body type considerations
- Style movements and fashion history

You know the user's entire wardrobe, favorite colors, style preferences, planned activities, weather, AND current fashion trends. You suggest outfits based on ALL these factors.

Use a friendly and playful tone with high fashion vocabulary. Add emojis sparingly. If the user shares a plan or mood, suggest an outfit without waiting to be asked. Proactively reference their existing outfits and items by name.

When users ask "what is [trend]?" or "explain [style concept]", you educate them and show examples from their own wardrobe.

Avoid generic or repetitive phrases. Every response should feel bespoke and thoughtful.

=== YOUR KNOWLEDGE BASE ===\n\n`
    
    // User basic info
    if (profile?.first_name) {
      userContext += `User's name: ${profile.first_name}\n`
    }
    if (profile?.pronouns && profile.pronouns !== 'not-specified') {
      userContext += `Pronouns: ${profile.pronouns}\n`
    }

    // Location and LIVE weather
    if (weatherData) {
      userContext += `\n=== CURRENT WEATHER ===\n`
      userContext += `Location: ${weatherData.location.name}, ${weatherData.location.country}\n`
      userContext += `Temperature: ${weatherData.current.temperature}°C (feels like ${weatherData.current.feelsLike}°C)\n`
      userContext += `Condition: ${weatherData.current.condition}\n`
      userContext += `Humidity: ${weatherData.current.humidity}%\n`
      userContext += `Wind: ${weatherData.current.windSpeed} km/h\n`
      userContext += `\nIMPORTANT: Use this LIVE weather data when suggesting outfits. Consider temperature, condition, and wind.\n`
    } else if (userPrefs?.preferred_city && userPrefs?.preferred_country) {
      userContext += `Location: ${userPrefs.preferred_city}, ${userPrefs.preferred_country}\n`
    }
    
    if (userPrefs?.favorite_styles && userPrefs.favorite_styles.length > 0) {
      userContext += `Preferred styles: ${userPrefs.favorite_styles.join(', ')}\n`
    }
    
    if (userPrefs?.favorite_colors && userPrefs.favorite_colors.length > 0) {
      userContext += `Favorite colors: ${userPrefs.favorite_colors.join(', ')}\n`
    }

    if (userPrefs?.body_type && userPrefs.body_type !== 'not-specified') {
      userContext += `Body type: ${userPrefs.body_type}\n`
    }

    if (userPrefs?.personality_tags && userPrefs.personality_tags.length > 0) {
      userContext += `Style personality: ${userPrefs.personality_tags.join(', ')}\n`
    }

    if (userPrefs?.climate_preferences && userPrefs.climate_preferences.length > 0) {
      userContext += `Climate preferences: ${userPrefs.climate_preferences.join(', ')}\n`
    }

    // Smart Wardrobe Analysis (prioritized: favorites first, then by last worn)
    if (clothingItems && clothingItems.length > 0) {
      userContext += `\n=== WARDROBE (Smart Sorted) ===\n`
      userContext += `Total: ${clothingItems.length} items (showing favorites and recently unworn items first)\n\n`
      
      // Categorize items
      const favorites = clothingItems.filter(item => item.favorite)
      const recentlyUnworn = clothingItems.filter(item => !item.favorite && item.last_worn)
      const neverWorn = clothingItems.filter(item => !item.last_worn)
      
      if (favorites.length > 0) {
        userContext += `⭐ Favorite pieces (prioritize these):\n`
        favorites.slice(0, 10).forEach(item => {
          const seasons = item.season && item.season.length > 0 ? ` (${item.season.join(', ')})` : ''
          const occasions = item.occasions && item.occasions.length > 0 ? ` - ${item.occasions.join(', ')}` : ''
          const timesWorn = item.times_worn ? ` [worn ${item.times_worn}x]` : ''
          userContext += `  - ${item.name} (${item.type}, ${item.color})${seasons}${occasions}${timesWorn}\n`
        })
      }
      
      if (neverWorn.length > 0) {
        userContext += `\n🆕 Never worn (suggest these!):\n`
        neverWorn.slice(0, 5).forEach(item => {
          const seasons = item.season && item.season.length > 0 ? ` (${item.season.join(', ')})` : ''
          userContext += `  - ${item.name} (${item.type}, ${item.color})${seasons}\n`
        })
      }
      
      if (recentlyUnworn.length > 0) {
        userContext += `\n♻️ Ready for rotation:\n`
        recentlyUnworn.slice(0, 10).forEach(item => {
          const lastWorn = item.last_worn ? new Date(item.last_worn).toLocaleDateString() : 'unknown'
          const seasons = item.season && item.season.length > 0 ? ` (${item.season.join(', ')})` : ''
          userContext += `  - ${item.name} (${item.type}, ${item.color}) - last worn: ${lastWorn}${seasons}\n`
        })
      }
    }

    // Calendar Events - PROACTIVE SUGGESTIONS
    if (calendarEvents && calendarEvents.length > 0) {
      userContext += `\n=== UPCOMING EVENTS ===\n`
      const today = new Date().toDateString()
      const tomorrow = new Date(Date.now() + 86400000).toDateString()
      
      calendarEvents.forEach(event => {
        const eventDate = new Date(event.date)
        const dateStr = eventDate.toDateString()
        let timeframe = ''
        
        if (dateStr === today) {
          timeframe = '🔴 TODAY'
        } else if (dateStr === tomorrow) {
          timeframe = '🟡 TOMORROW'
        } else {
          timeframe = eventDate.toLocaleDateString()
        }
        
        userContext += `${timeframe}: ${event.activity_tag || 'Event'}`
        if (event.notes) {
          userContext += ` - ${event.notes}`
        }
        if (event.outfit_id) {
          userContext += ` (outfit planned)`
        }
        userContext += `\n`
      })
      
      userContext += `\nIMPORTANT: Be proactive! If user asks about today/tomorrow, suggest outfits for their calendar events.\n`
    }

    // Saved outfits
    if (outfits && outfits.length > 0) {
      userContext += `\n=== SAVED OUTFITS ===\n`
      outfits.forEach(outfit => {
        const occasions = outfit.occasions && outfit.occasions.length > 0 ? ` - ${outfit.occasions.join(', ')}` : ''
        const favorite = outfit.favorite ? ' ⭐' : ''
        const timesWorn = outfit.times_worn ? ` (worn ${outfit.times_worn} times)` : ''
        userContext += `- "${outfit.name}"${occasions}${favorite}${timesWorn}\n`
      })
    }

    // Recent outfit history
    if (outfitLogs && outfitLogs.length > 0) {
      userContext += `\nRecent outfit history:\n`
      outfitLogs.forEach(log => {
        const date = new Date(log.date).toLocaleDateString()
        const activity = log.activity || log.custom_activity || 'general wear'
        const weather = log.weather_condition && log.temperature ? ` (${log.weather_condition}, ${log.temperature}°C)` : ''
        userContext += `- ${date}: ${activity}${weather}\n`
      })
    }

    // Current Fashion Trends
    if (fashionTrends && fashionTrends.length > 0) {
      userContext += `\n=== CURRENT FASHION TRENDS (${currentSeason.replace('_', ' ').toUpperCase()}) ===\n`
      fashionTrends.forEach(trend => {
        userContext += `\n📍 ${trend.trend_name} (${trend.popularity_score}/100 popularity)\n`
        userContext += `   ${trend.description}\n`
        
        if (trend.colors && trend.colors.length > 0) {
          userContext += `   Key colors: ${trend.colors.join(', ')}\n`
        }
        
        if (trend.key_pieces && trend.key_pieces.length > 0) {
          userContext += `   Must-have pieces: ${trend.key_pieces.join(', ')}\n`
        }
        
        if (trend.style_tags && trend.style_tags.length > 0) {
          userContext += `   Style vibe: ${trend.style_tags.join(', ')}\n`
        }
      })
      
      userContext += `\nIMPORTANT: Reference these trends when relevant to user's style preferences. If they ask about a trend, explain it and show how items in their wardrobe fit the trend!\n`
    }

    // Learning insights
    if (learningData && learningData.length > 0) {
      userContext += `\n=== LEARNED PREFERENCES ===\n`
      
      // Analyze high-rated patterns
      const highRated = learningData.filter(d => d.rating >= 4)
      if (highRated.length > 0) {
        const styles = highRated.map(d => d.outfit_data?.style).filter(Boolean)
        const colors = highRated.flatMap(d => d.outfit_data?.colors || [])
        
        if (styles.length > 0) {
          userContext += `User loves: ${[...new Set(styles)].slice(0, 3).join(', ')} styles\n`
        }
        if (colors.length > 0) {
          const topColors = [...new Set(colors)].slice(0, 3)
          userContext += `Favorite color combinations: ${topColors.join(', ')}\n`
        }
      }

      // Recent feedback
      const recentFeedback = learningData
        .filter(d => d.feedback_text)
        .slice(0, 3)
        .map(d => d.feedback_text)
      
      if (recentFeedback.length > 0) {
        userContext += `Recent feedback: "${recentFeedback.join('"; "')}"\n`
      }
      
      userContext += `Total interactions tracked: ${learningData.length}\n`
    }

    // Premium status context
    if (isPremium) {
      userContext += `\nPremium member: You have access to advanced styling features and unlimited chat.\n`
    }

    userContext += `\n\n=== YOUR MISSION ===
You are their PROACTIVE personal stylist with COMPLETE fashion intelligence:

📊 Your Data Sources:
- LIVE weather data (use it!)
- Upcoming calendar events (suggest for these!)
- Smart-sorted wardrobe (prioritize favorites and never-worn items)
- Learned preferences from past feedback
- CURRENT FASHION TRENDS (reference when relevant!)

💡 Style Education Mode:
When users ask about fashion concepts or trends:
1. Explain the trend clearly and concisely
2. Share why it's popular right now
3. Show SPECIFIC examples from their wardrobe that fit the trend
4. Suggest how they can incorporate it into their style

Example: "Quiet Luxury is about understated elegance - your camel cashmere sweater and tailored navy trousers are PERFECT quiet luxury pieces!"

👗 Outfit Suggestion Mode:
When users ask "what should I wear today?" or mention plans:
1. Check their calendar for today/tomorrow events
2. Consider the CURRENT weather
3. Reference relevant fashion trends
4. Suggest outfits using their actual wardrobe items (mention by name)
5. Explain WHY each piece works (weather + occasion + trend + their style)
6. Prioritize favorites and items they haven't worn recently

Be conversational, proactive, and fashion-savvy. If you see they have an event today, mention it even if they didn't ask!

After suggesting an outfit, always ask: "How does this outfit sound? Would you like me to adjust anything?" to gather more learning data.`

    // Enhanced smart suggestion triggers including style education
    const latestMessage = messages[messages.length - 1]?.content.toLowerCase() || ''
    const outfitTriggers = [
      'today', 'tomorrow', 'tonight', 'what should i wear', 'outfit', 'dress',
      'dinner', 'lunch', 'meeting', 'date', 'party', 'event', 'shopping', 'interview', 'work',
      'weather', 'weekend', 'going to', 'have a', 'attending', 'planning'
    ]
    
    const educationTriggers = [
      'what is', 'what are', 'explain', 'tell me about', 'how do i', 'how to wear',
      'trend', 'style', 'fashion', 'look', 'aesthetic'
    ]
    
    const shouldSuggestOutfit = outfitTriggers.some(trigger => latestMessage.includes(trigger))
    const shouldEducate = educationTriggers.some(trigger => latestMessage.includes(trigger))
    
    if (shouldEducate) {
      userContext += `\n\n📚 EDUCATION MODE ACTIVATED!\n`
      userContext += `User is asking about a fashion concept or trend. Explain it clearly, then show examples from their wardrobe that fit!\n`
      
      if (fashionTrends && fashionTrends.length > 0) {
        userContext += `Current trends available for reference: ${fashionTrends.map(t => t.trend_name).join(', ')}\n`
      }
    }
    
    if (shouldSuggestOutfit && clothingItems && clothingItems.length > 0) {
      userContext += `\n\n🎯 OUTFIT SUGGESTION ACTIVATED!\n`
      
      if (weatherData) {
        userContext += `- Weather: ${weatherData.current.temperature}°C, ${weatherData.current.condition}\n`
      }
      
      if (calendarEvents && calendarEvents.length > 0) {
        const todayEvents = calendarEvents.filter(e => new Date(e.date).toDateString() === new Date().toDateString())
        if (todayEvents.length > 0) {
          userContext += `- Today's events: ${todayEvents.map(e => e.activity_tag).join(', ')}\n`
        }
      }
      
      if (fashionTrends && fashionTrends.length > 0) {
        userContext += `- Consider these trends: ${fashionTrends.slice(0, 2).map(t => t.trend_name).join(', ')}\n`
      }
      
      userContext += `\nSuggest a COMPLETE outfit using their actual items (by name), considering weather + calendar + trends + learned preferences. Explain your reasoning including any trend references!`
    }

    // Make OpenAI API call with enhanced context
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: userContext },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const openAIData = await openAIResponse.json()
    const reply = openAIData.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    // Update or insert message count
    const newCount = currentCount + 1
    
    if (chatLimits) {
      await supabaseClient
        .from('user_chat_limits')
        .update({
          message_count: newCount,
          last_message_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } else {
      await supabaseClient
        .from('user_chat_limits')
        .insert({
          user_id: userId,
          message_count: newCount,
          last_message_at: new Date().toISOString(),
          is_premium: false
        })
    }

    return new Response(
      JSON.stringify({ 
        reply,
        messageCount: newCount,
        limitReached: !isPremium && newCount >= 5
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in chat-with-olivia function:', error)
    const status = error.message?.includes('must be') || error.message?.includes('cannot be') || error.message?.includes('too long') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Invalid request' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    )
  }
})
