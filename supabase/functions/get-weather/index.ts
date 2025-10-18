import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, country } = await req.json()

    if (!city) {
      throw new Error('City is required')
    }

    // Use Open-Meteo API (free, no API key needed)
    // First, get coordinates for the city
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    
    const geoResponse = await fetch(geoUrl)
    if (!geoResponse.ok) {
      throw new Error('Failed to fetch location data')
    }

    const geoData = await geoResponse.json()
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found')
    }

    const location = geoData.results[0]
    const { latitude, longitude, name, country: countryName } = location

    // Get current weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    
    const weatherResponse = await fetch(weatherUrl)
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data')
    }

    const weatherData = await weatherResponse.json()
    const current = weatherData.current

    // Map weather codes to conditions
    const weatherCodeMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    }

    const weatherCondition = weatherCodeMap[current.weather_code] || 'Unknown'

    return new Response(
      JSON.stringify({
        location: {
          name,
          country: countryName,
          latitude,
          longitude
        },
        current: {
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          condition: weatherCondition,
          weatherCode: current.weather_code,
          timestamp: current.time
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-weather function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})