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

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Fetch user data for context
    const [
      { data: userPrefs },
      { data: quizResults },
      { data: profile }
    ] = await Promise.all([
      supabaseClient.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabaseClient.from('user_quiz_results').select('*').eq('user_id', userId),
      supabaseClient.from('profiles').select('first_name').eq('id', userId).maybeSingle()
    ])

    // Build context for AI
    let quizContext = ''
    
    if (quizResults && quizResults.length > 0) {
      quizContext += 'Quiz Results:\n'
      quizResults.forEach((result: any) => {
        quizContext += `- ${result.quiz_name}: ${result.result_label}\n`
        if (result.result_value) {
          const value = typeof result.result_value === 'string' 
            ? JSON.parse(result.result_value) 
            : result.result_value
          
          if (value.keyElements) {
            quizContext += `  Key Elements: ${value.keyElements.join(', ')}\n`
          }
          if (value.preferredItems) {
            quizContext += `  Preferred Items: ${value.preferredItems.join(', ')}\n`
          }
          if (value.occasions) {
            quizContext += `  Occasions: ${value.occasions.join(', ')}\n`
          }
          if (value.description) {
            quizContext += `  Description: ${value.description}\n`
          }
        }
      })
    }

    if (userPrefs) {
      quizContext += '\nDerived Style Profile:\n'
      if (userPrefs.quiz_derived_styles) {
        const styles = typeof userPrefs.quiz_derived_styles === 'string'
          ? JSON.parse(userPrefs.quiz_derived_styles)
          : userPrefs.quiz_derived_styles
        if (styles.styleType) quizContext += `- Style Type: ${styles.styleType}\n`
      }
      if (userPrefs.quiz_derived_lifestyle) {
        const lifestyle = typeof userPrefs.quiz_derived_lifestyle === 'string'
          ? JSON.parse(userPrefs.quiz_derived_lifestyle)
          : userPrefs.quiz_derived_lifestyle
        if (lifestyle.lifestyleType) quizContext += `- Lifestyle: ${lifestyle.lifestyleType}\n`
      }
      if (userPrefs.quiz_derived_vibes) {
        const vibes = typeof userPrefs.quiz_derived_vibes === 'string'
          ? JSON.parse(userPrefs.quiz_derived_vibes)
          : userPrefs.quiz_derived_vibes
        if (vibes.vibeProfile) quizContext += `- Vibe: ${vibes.vibeProfile}\n`
      }
      if (userPrefs.quiz_derived_eras) {
        const eras = typeof userPrefs.quiz_derived_eras === 'string'
          ? JSON.parse(userPrefs.quiz_derived_eras)
          : userPrefs.quiz_derived_eras
        if (eras.styleHistory) quizContext += `- Era Influence: ${eras.styleHistory}\n`
      }
      if (userPrefs.favorite_colors && userPrefs.favorite_colors.length > 0) {
        quizContext += `- Favorite Colors: ${userPrefs.favorite_colors.join(', ')}\n`
      }
      if (userPrefs.favorite_styles && userPrefs.favorite_styles.length > 0) {
        quizContext += `- Favorite Styles: ${userPrefs.favorite_styles.join(', ')}\n`
      }
    }

    const userName = profile?.first_name || 'there'

    // Generate summary with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are Olivia Bloom, a warm and insightful personal stylist. Write a personalized style summary for the user based on their quiz results. 

Your summary should:
- Be warm, personal, and encouraging (2-3 short paragraphs max)
- Reference SPECIFIC details from their quiz results
- Highlight what makes their style unique
- Mention how you'll use this info to help them
- Use "you" and "your" - speak directly to them
- Include 1-2 subtle emojis (like ✨ or 💫)
- Keep it concise but meaningful

Do NOT:
- Be generic or vague
- Use bullet points
- Make it too long
- Repeat information they can already see on the page`

    const userPrompt = `Create a personalized style summary for ${userName} based on:

${quizContext || 'No quiz data available yet - write a warm welcome encouraging them to take quizzes to unlock personalized insights.'}

Write the summary now:`

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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error('Failed to generate summary')
    }

    const data = await response.json()
    const summary = data.choices[0].message.content

    console.log('Generated style summary for user:', userId)

    return new Response(
      JSON.stringify({ 
        summary,
        generatedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating style summary:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate summary',
        fallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
