
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
    const skipBackgroundRemoval = formData.get("skipBackgroundRemoval") === "true"
    
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

    // If user wants to skip background removal, return original
    if (skipBackgroundRemoval) {
      console.log('⏭️ Skipping background removal as requested')
      const originalBuffer = await file.arrayBuffer()
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": file.type
        }
      })
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
    
    // Try RMBG-1.4 model (this one is confirmed to work with Inference API)
    console.log('🚀 Trying RMBG-1.4 model')
    const response = await fetch("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    })

    console.log('📊 RMBG-1.4 response status:', response.status)
    console.log('📋 RMBG-1.4 response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ RMBG-1.4 error response:', errorText)
      console.error('📊 Full response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // Try alternative approach with a different model format
      console.log('🔄 Trying alternative model: silueta/background-removal')
      const altResponse = await fetch("https://api-inference.huggingface.co/models/silueta/background-removal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      })

      console.log('📊 Alternative model response status:', altResponse.status)

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error('❌ Alternative model also failed:', altErrorText)
        
        // Return original image as fallback
        console.log('🔄 Returning original image as fallback')
        const originalBuffer = await file.arrayBuffer()
        return new Response(originalBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": file.type
          }
        })
      }

      // Check if alternative response is valid
      const altBuffer = await altResponse.arrayBuffer()
      console.log('✅ Alternative model successful! Image size:', altBuffer.byteLength)
      
      if (altBuffer.byteLength === 0) {
        console.error('❌ Alternative model returned empty buffer')
        const originalBuffer = await file.arrayBuffer()
        return new Response(originalBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": file.type
          }
        })
      }

      return new Response(altBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png"
        }
      })
    }

    const buffer = await response.arrayBuffer()
    console.log('✅ RMBG-1.4 successful! PNG size:', buffer.byteLength)

    // Validate that we actually got image data
    if (buffer.byteLength === 0) {
      console.error('❌ Received empty buffer from RMBG-1.4')
      const originalBuffer = await file.arrayBuffer()
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": file.type
        }
      })
    }

    // Check if buffer looks like a valid image (basic validation)
    const uint8Array = new Uint8Array(buffer)
    const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47
    const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8
    const isWebP = uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50

    if (!isPNG && !isJPEG && !isWebP) {
      console.error('❌ Response does not appear to be a valid image format')
      console.error('📊 First 16 bytes:', Array.from(uint8Array.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))
      
      const originalBuffer = await file.arrayBuffer()
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": file.type
        }
      })
    }

    console.log('🎉 Background removal successful!')
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
