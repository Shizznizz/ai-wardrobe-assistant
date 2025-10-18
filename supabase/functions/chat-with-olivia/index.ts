
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

    const { messages, userId } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

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

    // Fetch user data for context including learning patterns
    const [
      { data: userPrefs },
      { data: clothingItems },
      { data: outfits },
      { data: outfitLogs },
      { data: profile },
      { data: learningData }
    ] = await Promise.all([
      supabaseClient.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabaseClient.from('clothing_items').select('*').eq('user_id', userId).limit(25),
      supabaseClient.from('outfits').select('*').eq('user_id', userId).limit(10),
      supabaseClient.from('outfit_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5),
      supabaseClient.from('profiles').select('first_name, pronouns').eq('id', userId).maybeSingle(),
      supabaseClient.from('olivia_learning_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    ])

    // Build enhanced context for Olivia
    let userContext = `You are Olivia Bloom, the user's personal AI stylist and trusted fashion companion. You are confident, warm, and stylist-grade — think of a Vogue fashion editor and a close friend combined. You know the user's entire wardrobe, favorite colors, style preferences, planned activities, and weather. You suggest outfits based on those factors.

Use a friendly and playful tone, but with clarity and high fashion vocabulary. Add emojis sparingly, where it adds charm. If the user shares a plan or mood, suggest an outfit without waiting to be asked. Proactively reference their existing outfits and items by name.

Avoid generic or repetitive phrases. Every response should feel bespoke and thoughtful.

Here is what you know about this user:\n\n`
    
    // User basic info
    if (profile?.first_name) {
      userContext += `User's name: ${profile.first_name}\n`
    }
    if (profile?.pronouns && profile.pronouns !== 'not-specified') {
      userContext += `Pronouns: ${profile.pronouns}\n`
    }

    // Location and preferences
    if (userPrefs?.preferred_city && userPrefs?.preferred_country) {
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

    // Wardrobe items
    if (clothingItems && clothingItems.length > 0) {
      userContext += `\nCurrent wardrobe (${clothingItems.length} items):\n`
      clothingItems.forEach(item => {
        const seasons = item.season && item.season.length > 0 ? ` (${item.season.join(', ')})` : ''
        const occasions = item.occasions && item.occasions.length > 0 ? ` - ${item.occasions.join(', ')}` : ''
        const favorite = item.favorite ? ' ⭐' : ''
        userContext += `- ${item.name} (${item.type}, ${item.color})${seasons}${occasions}${favorite}\n`
      })
    }

    // Saved outfits
    if (outfits && outfits.length > 0) {
      userContext += `\nSaved outfits (${outfits.length} total):\n`
      outfits.slice(0, 5).forEach(outfit => {
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

    // Learning insights
    if (learningData && learningData.length > 0) {
      userContext += `\n\n=== LEARNED PREFERENCES ===\n`
      
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
Based on this complete profile, provide highly personalized styling advice. When users mention plans, activities, weather, or occasions, proactively suggest complete outfits using their actual wardrobe items. Reference specific pieces by name and explain why they work together based on their learned preferences. Be their personal stylist who truly knows their style evolution and wardrobe inside out.

After suggesting an outfit, always ask: "How does this outfit sound? Would you like me to adjust anything?" to gather more learning data.`

    // Detect smart suggestion triggers in the latest user message
    const latestMessage = messages[messages.length - 1]?.content.toLowerCase() || ''
    const suggestionTriggers = [
      'dinner', 'lunch', 'meeting', 'date', 'party', 'event', 'shopping', 'interview', 'work',
      'weather', 'tomorrow', 'tonight', 'weekend', 'going to', 'have a', 'attending'
    ]
    
    const shouldSuggestOutfit = suggestionTriggers.some(trigger => latestMessage.includes(trigger))
    
    if (shouldSuggestOutfit && clothingItems && clothingItems.length > 0) {
      userContext += `\n\nIMPORTANT: The user just mentioned plans or activities. Proactively suggest a complete outfit using their actual wardrobe items, explaining why each piece works for their situation.`
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
