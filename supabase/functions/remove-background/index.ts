
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
      console.error('❌ No file provided in request')
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
      console.error('❌ HUGGINGFACE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: "Hugging Face API key missing" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎯 Processing background removal for file:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('🔑 Using API key (first 8 chars):', hfApiKey.substring(0, 8) + '...')

    // Convert file to ArrayBuffer for the request
    const fileBuffer = await file.arrayBuffer()
    console.log('📦 File buffer created, size:', fileBuffer.byteLength)
    
    // Try the primary working model first: U2Net (proven to work)
    console.log('🚀 Trying primary model: Xenova/u2net')
    const response = await fetch("https://api-inference.huggingface.co/models/Xenova/u2net", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    })

    console.log('📊 Primary model response status:', response.status)
    console.log('📋 Primary model response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Primary model error:', errorText)
      console.error('📊 Response status:', response.status, response.statusText)
      
      // Try alternative model: Remove.bg style model
      console.log('🔄 Trying fallback model: Bingsu/remove-bg')
      const altResponse = await fetch("https://api-inference.huggingface.co/models/Bingsu/remove-bg", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      })

      console.log('📊 Fallback model response status:', altResponse.status)

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error('❌ Fallback model also failed:', altErrorText)
        
        // Try one more model as last resort
        console.log('🔄 Trying final fallback: schminitz/yolov5_rembg')
        const finalResponse = await fetch("https://api-inference.huggingface.co/models/schminitz/yolov5_rembg", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfApiKey}`,
            'Content-Type': 'application/octet-stream'
          },
          body: fileBuffer
        })

        if (!finalResponse.ok) {
          const finalErrorText = await finalResponse.text()
          console.error('❌ All models failed. Final error:', finalErrorText)
          return new Response(
            JSON.stringify({ 
              error: `Background removal failed: Primary: ${errorText}, Fallback: ${altErrorText}, Final: ${finalErrorText}` 
            }), 
            { 
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const finalBuffer = await finalResponse.arrayBuffer()
        console.log('✅ Final fallback model successful! PNG size:', finalBuffer.byteLength)
        return new Response(finalBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png"
          }
        })
      }

      const altBuffer = await altResponse.arrayBuffer()
      console.log('✅ Fallback model successful! PNG size:', altBuffer.byteLength)
      return new Response(altBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png"
        }
      })
    }

    const buffer = await response.arrayBuffer()
    console.log('✅ Primary model successful! PNG size:', buffer.byteLength)

    // Validate that we actually got image data
    if (buffer.byteLength === 0) {
      console.error('❌ Received empty buffer from API')
      return new Response(
        JSON.stringify({ error: "Received empty response from background removal API" }), 
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png"
      }
    })
  } catch (err) {
    console.error('💥 Error in remove-background function:', err)
    console.error('Stack trace:', err.stack)
    return new Response(
      JSON.stringify({ error: `Error: ${err.message}` }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
