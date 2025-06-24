
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY')

    if (!HUGGINGFACE_API_KEY) {
      console.error('❌ HUGGINGFACE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: "Hugging Face API key missing" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { imageBase64 } = await req.json()
    
    if (!imageBase64) {
      console.error('❌ No imageBase64 provided in request')
      return new Response(
        JSON.stringify({ error: "Missing imageBase64" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎯 Processing background removal for base64 image, size:', imageBase64.length)

    // Extract MIME type from base64 data URL
    let mimeType = 'image/png' // default
    let base64Data = imageBase64
    
    if (imageBase64.startsWith('data:')) {
      const mimeMatch = imageBase64.match(/data:([^;]+);base64,(.*)/)
      if (mimeMatch) {
        mimeType = mimeMatch[1]
        base64Data = mimeMatch[2]
        console.log('📋 Detected MIME type:', mimeType)
      }
    }

    // Validate supported formats
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
      console.error('❌ Unsupported image format:', mimeType)
      return new Response(
        JSON.stringify({ error: `Unsupported image format: ${mimeType}` }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert base64 to binary for Hugging Face API
    let binaryImage: Uint8Array
    try {
      binaryImage = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      console.log('📦 Converted to binary, size:', binaryImage.length, 'bytes')
    } catch (error) {
      console.error('❌ Failed to decode base64:', error)
      return new Response(
        JSON.stringify({ error: "Invalid base64 data" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🚀 Calling briaai/RMBG-1.4 model')
    
    const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryImage
    })

    console.log(`📊 briaai/RMBG-1.4 response status: ${response.status}`)
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ briaai/RMBG-1.4 error (${response.status}): ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: `Background removal failed: ${response.status} - ${errorText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: errorText
          }
        }), 
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const resultBuffer = await response.arrayBuffer()
    console.log(`✅ Background removal successful! Buffer size: ${resultBuffer.byteLength}`)

    if (resultBuffer.byteLength === 0) {
      console.error('❌ Empty response buffer from briaai/RMBG-1.4')
      return new Response(
        JSON.stringify({ error: "Empty response from background removal service" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert result to base64 with PNG MIME type (briaai/RMBG-1.4 returns PNG)
    const resultBase64Data = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)))
    const resultBase64 = `data:image/png;base64,${resultBase64Data}`

    console.log('🎉 Returning processed image, base64 size:', resultBase64.length)

    return new Response(
      JSON.stringify({ resultBase64 }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (err) {
    console.error('💥 Error in remove-background function:', err)
    return new Response(
      JSON.stringify({ 
        error: `Server error: ${err.message}`,
        details: err.stack 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
