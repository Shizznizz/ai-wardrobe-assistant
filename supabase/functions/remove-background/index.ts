
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
      console.error('No file provided in request')
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
      console.error('HUGGINGFACE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: "Hugging Face API key missing" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing background removal for file:', file.name, 'Size:', file.size)
    console.log('Using API key (first 8 chars):', hfApiKey.substring(0, 8) + '...')

    // Convert file to ArrayBuffer for the request
    const fileBuffer = await file.arrayBuffer()
    
    // Use the correct Hugging Face Inference API endpoint for background removal
    const response = await fetch("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    })

    console.log('Hugging Face response status:', response.status)
    console.log('Hugging Face response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)
      console.error('Response status:', response.status, response.statusText)
      
      // Try alternative model if the first one fails
      console.log('Trying alternative model: silueta/background-removal')
      const altResponse = await fetch("https://api-inference.huggingface.co/models/silueta/background-removal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      })

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error('Alternative model also failed:', altErrorText)
        return new Response(
          JSON.stringify({ error: `Background removal failed: ${errorText}. Alternative model error: ${altErrorText}` }), 
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const altBuffer = await altResponse.arrayBuffer()
      console.log('Alternative model successful, returning PNG, size:', altBuffer.byteLength)
      return new Response(altBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png"
        }
      })
    }

    const buffer = await response.arrayBuffer()
    console.log('Background removal successful, returning PNG, size:', buffer.byteLength)

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
