
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "Missing file" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const hfApiKey = Deno.env.get("HUGGINGFACE_API_KEY")
    if (!hfApiKey) {
      return new Response(
        JSON.stringify({ error: "Hugging Face API key missing" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing background removal for file:', file.name, 'Size:', file.size)

    const response = await fetch("https://api-inference.huggingface.co/models/danielgatis/rembg", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`
      },
      body: file.stream()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)
      return new Response(
        JSON.stringify({ error: `Background removal failed: ${errorText}` }), 
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const buffer = await response.arrayBuffer()
    console.log('Background removal successful, returning PNG')

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png"
      }
    })
  } catch (err) {
    console.error('Error in remove-background function:', err)
    return new Response(
      JSON.stringify({ error: `Error: ${err.message}` }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
