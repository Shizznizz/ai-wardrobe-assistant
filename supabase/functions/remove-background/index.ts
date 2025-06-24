
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

    const formData = await req.formData()
    const file = formData.get("file") as File
    const skipBackgroundRemoval = formData.get("skipBackgroundRemoval") === "true"
    const debugMode = formData.get("debugMode") === "true"
    
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

    console.log('🎯 Processing background removal for file:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Convert file to binary for briaai/RMBG-1.4
    const fileArrayBuffer = await file.arrayBuffer()
    const binaryImage = new Uint8Array(fileArrayBuffer)

    console.log('🚀 Trying briaai/RMBG-1.4 model')
    
    const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryImage
    })

    console.log(`📊 briaai/RMBG-1.4 response status: ${response.status}`)
    
    if (debugMode) {
      console.log(`📋 briaai/RMBG-1.4 response headers:`, Object.fromEntries(response.headers.entries()))
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ briaai/RMBG-1.4 error (${response.status}): ${errorText}`)
      
      // Return original image as fallback
      console.log('🔄 Background removal failed, returning original image as fallback')
      const originalBuffer = await file.arrayBuffer()
      
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": file.type,
          "X-Background-Removal": "failed",
          "X-Error": errorText
        }
      })
    }

    const resultBuffer = await response.arrayBuffer()
    console.log(`✅ Background removal successful! Buffer size: ${resultBuffer.byteLength}`)

    if (resultBuffer.byteLength === 0) {
      console.error('❌ Empty response buffer from briaai/RMBG-1.4')
      
      // Return original image as fallback
      const originalBuffer = await file.arrayBuffer()
      return new Response(originalBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": file.type,
          "X-Background-Removal": "failed",
          "X-Error": "Empty response buffer"
        }
      })
    }

    return new Response(resultBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "X-Model-Used": "briaai/RMBG-1.4",
        "X-Background-Removal": "success"
      }
    })

  } catch (err) {
    console.error('💥 Error in remove-background function:', err)
    return new Response(
      JSON.stringify({ error: `Error: ${err.message}` }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
