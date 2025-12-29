
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation helpers
function validateBase64Image(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('imageBase64 must be a string');
  }
  
  // Check max size (10MB base64 encoded ~= 13.3MB string)
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB string limit
  if (value.length > MAX_SIZE) {
    throw new Error('Image is too large. Maximum size is 10MB.');
  }
  
  // Validate base64 format
  if (value.startsWith('data:')) {
    const mimeMatch = value.match(/data:([^;]+);base64,(.*)/)
    if (!mimeMatch) {
      throw new Error('Invalid base64 data URL format');
    }
    const mimeType = mimeMatch[1];
    const base64Data = mimeMatch[2];
    
    // Validate MIME type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new Error(`Unsupported image format: ${mimeType}. Supported: JPEG, PNG, WebP`);
    }
    
    // Validate base64 content
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      throw new Error('Invalid base64 encoding');
    }
    
    return value;
  }
  
  // Plain base64 without data URL prefix
  if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
    throw new Error('Invalid base64 encoding');
  }
  
  return value;
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

    const body = await req.json()
    
    // Validate input
    const imageBase64 = validateBase64Image(body.imageBase64);
    
    console.log('🎯 Processing background removal for validated base64 image, size:', imageBase64.length)

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
    const status = err.message?.includes('must be') || err.message?.includes('too large') || err.message?.includes('Unsupported') ? 400 : 500;
    return new Response(
      JSON.stringify({ 
        error: err.message || 'Server error',
        details: err.stack 
      }), 
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
