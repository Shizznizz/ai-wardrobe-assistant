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

    // Fetch last 50 learning interactions
    const { data: learningData, error } = await supabaseClient
      .from('olivia_learning_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching learning data:', error)
      throw error
    }

    // Analyze patterns
    const insights: string[] = []
    
    if (!learningData || learningData.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: ['User is new - no patterns detected yet. Building initial style profile...'],
          patternCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pattern 1: High-rated outfit styles
    const highRatedOutfits = learningData.filter(d => 
      d.interaction_type === 'outfit_rating' && d.rating >= 4
    )
    
    if (highRatedOutfits.length >= 3) {
      const styles = highRatedOutfits
        .map(d => d.outfit_data?.style)
        .filter(Boolean)
      
      const styleCounts = styles.reduce((acc, style) => {
        acc[style] = (acc[style] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]
      if (topStyle) {
        insights.push(`User consistently rates ${topStyle[0]} outfits highly (${topStyle[1]} times)`)
      }
    }

    // Pattern 2: Color preferences
    const colorPreferences = learningData
      .filter(d => d.rating >= 4 && d.outfit_data?.colors)
      .flatMap(d => d.outfit_data.colors || [])
    
    if (colorPreferences.length >= 5) {
      const colorCounts = colorPreferences.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const topColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([color]) => color)
      
      if (topColors.length > 0) {
        insights.push(`User prefers outfits with ${topColors.join(' and ')} colors`)
      }
    }

    // Pattern 3: Weather preferences
    const weatherData = learningData
      .filter(d => d.rating >= 4 && d.context?.temperature)
      .map(d => ({
        temp: d.context.temperature,
        outfit: d.outfit_data
      }))
    
    if (weatherData.length >= 5) {
      const avgTemp = weatherData.reduce((sum, d) => sum + (parseFloat(d.temp) || 0), 0) / weatherData.length
      if (avgTemp > 20) {
        insights.push(`User enjoys lighter, breathable outfits in warm weather (avg ${avgTemp.toFixed(0)}°C)`)
      } else if (avgTemp < 15) {
        insights.push(`User prefers layered, cozy outfits in cooler weather (avg ${avgTemp.toFixed(0)}°C)`)
      }
    }

    // Pattern 4: Occasion preferences
    const occasions = learningData
      .filter(d => d.rating >= 4 && d.context?.occasion)
      .map(d => d.context.occasion)
    
    if (occasions.length >= 3) {
      const occasionCounts = occasions.reduce((acc, occ) => {
        acc[occ] = (acc[occ] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const topOccasion = Object.entries(occasionCounts).sort((a, b) => b[1] - a[1])[0]
      if (topOccasion) {
        insights.push(`User frequently rates ${topOccasion[0]} outfits highly`)
      }
    }

    // Pattern 5: Rejection patterns
    const rejectedOutfits = learningData.filter(d => 
      d.interaction_type === 'outfit_rejected' || d.rating === 1
    )
    
    if (rejectedOutfits.length >= 3) {
      const rejectedStyles = rejectedOutfits
        .map(d => d.outfit_data?.style)
        .filter(Boolean)
      
      const rejectionCounts = rejectedStyles.reduce((acc, style) => {
        acc[style] = (acc[style] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const mostRejected = Object.entries(rejectionCounts).sort((a, b) => b[1] - a[1])[0]
      if (mostRejected) {
        insights.push(`User tends to avoid ${mostRejected[0]} style outfits`)
      }
    }

    // Pattern 6: Success rate
    const totalRatings = learningData.filter(d => d.interaction_type === 'outfit_rating')
    if (totalRatings.length >= 5) {
      const avgRating = totalRatings.reduce((sum, d) => sum + (d.rating || 0), 0) / totalRatings.length
      if (avgRating >= 4) {
        insights.push(`User is highly satisfied with outfit suggestions (${avgRating.toFixed(1)}/5 avg rating)`)
      } else if (avgRating < 3) {
        insights.push(`User preferences are still being learned - adapting recommendations`)
      }
    }

    return new Response(
      JSON.stringify({ 
        insights,
        patternCount: learningData.length,
        analysisDate: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-user-patterns function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})