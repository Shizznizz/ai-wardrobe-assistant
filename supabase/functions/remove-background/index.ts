
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModelAttempt {
  name: string;
  url: string;
  status?: number;
  error?: string;
  success?: boolean;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryModelWithRetry(modelUrl: string, modelName: string, fileBuffer: ArrayBuffer, hfApiKey: string, maxRetries = 3): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string; status?: number }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Trying ${modelName} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(modelUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: Array.from(new Uint8Array(fileBuffer))
        })
      });

      console.log(`📊 ${modelName} response status: ${response.status}`);
      console.log(`📋 ${modelName} response headers:`, Object.fromEntries(response.headers.entries()));

      if (response.status === 429) {
        const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry`);
        await delay(waitTime);
        continue;
      }

      if (response.status === 503) {
        const waitTime = 3000 * attempt;
        console.log(`🔧 Service unavailable, waiting ${waitTime}ms before retry`);
        await delay(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${modelName} error (${response.status}): ${errorText}`);
        return { 
          success: false, 
          error: errorText, 
          status: response.status 
        };
      }

      const buffer = await response.arrayBuffer();
      console.log(`✅ ${modelName} successful! Buffer size: ${buffer.byteLength}`);

      if (buffer.byteLength === 0) {
        console.error(`❌ ${modelName} returned empty buffer`);
        return { success: false, error: "Empty response buffer" };
      }

      // Validate image format
      const uint8Array = new Uint8Array(buffer);
      const isPNG = uint8Array.length >= 8 && uint8Array[0] === 0x89 && uint8Array[1] === 0x50;
      const isJPEG = uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xD8;
      
      if (!isPNG && !isJPEG) {
        console.error(`❌ ${modelName} response is not a valid image format`);
        console.error(`📊 First 16 bytes:`, Array.from(uint8Array.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        return { success: false, error: "Invalid image format returned" };
      }

      return { success: true, buffer };

    } catch (error) {
      console.error(`💥 ${modelName} attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      await delay(1000 * attempt);
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const attempts: ModelAttempt[] = [];

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const skipBackgroundRemoval = formData.get("skipBackgroundRemoval") === "true"
    const debugMode = formData.get("debugMode") === "true"
    
    if (!file) {
      console.error('❌ No file provided in request')
      return new Response(
        JSON.stringify({ 
          error: "Missing file",
          debug: debugMode ? { attempts } : undefined
        }), 
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

    const hfApiKey = Deno.env.get("HUGGINGFACE_API_KEY")
    if (!hfApiKey) {
      console.error('❌ HUGGINGFACE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ 
          error: "Hugging Face API key missing",
          debug: debugMode ? { attempts } : undefined
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎯 Processing background removal for file:', file.name, 'Size:', file.size, 'Type:', file.type)

    const fileBuffer = await file.arrayBuffer()
    console.log('📦 File buffer created, size:', fileBuffer.byteLength)
    
    // Updated models - using verified working endpoints
    const models = [
      {
        name: "danielgatis/rembg-new",
        url: "https://api-inference.huggingface.co/models/danielgatis/rembg-new"
      },
      {
        name: "danielgatis/rembg",
        url: "https://api-inference.huggingface.co/models/danielgatis/rembg"
      },
      {
        name: "Xenova/modnet",
        url: "https://api-inference.huggingface.co/models/Xenova/modnet"
      }
    ];

    for (const model of models) {
      const attempt: ModelAttempt = {
        name: model.name,
        url: model.url
      };
      
      const result = await tryModelWithRetry(model.url, model.name, fileBuffer, hfApiKey);
      
      attempt.status = result.status;
      attempt.error = result.error;
      attempt.success = result.success;
      attempts.push(attempt);

      if (result.success && result.buffer) {
        console.log(`🎉 Background removal successful with ${model.name}!`);
        return new Response(result.buffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png",
            "X-Model-Used": model.name,
            "X-Debug-Info": debugMode ? JSON.stringify({ attempts }) : undefined
          }
        });
      }
    }

    // All models failed - return original as fallback
    console.log('🔄 All models failed, returning original image as fallback');
    console.log('📊 Debug info:', JSON.stringify(attempts, null, 2));
    
    const originalBuffer = await file.arrayBuffer();
    
    return new Response(originalBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": file.type,
        "X-Background-Removal": "failed",
        "X-Debug-Info": debugMode ? JSON.stringify({ attempts }) : "Enable debug mode for details"
      }
    });

  } catch (err) {
    console.error('💥 Error in remove-background function:', err)
    console.error('Stack trace:', err.stack)
    return new Response(
      JSON.stringify({ 
        error: `Error: ${err.message}`,
        debug: attempts.length > 0 ? { attempts } : undefined
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
