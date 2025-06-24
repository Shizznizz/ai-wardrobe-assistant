
import { supabase } from '@/integrations/supabase/client';

export interface BackgroundRemovalOptions {
  debugMode?: boolean;
  onProgress?: (message: string) => void;
}

export interface BackgroundRemovalResult {
  success: boolean;
  resultBase64?: string;
  error?: string;
  originalBase64: string;
}

/**
 * Remove background from image using Supabase Edge Function with BRIA-RMBG 1.4
 */
export const removeBackground = async (
  imageBase64: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> => {
  const { debugMode = false, onProgress } = options;

  try {
    if (debugMode) {
      console.log('🔍 Debug: Starting background removal with BRIA-RMBG 1.4');
      console.log('🔍 Debug: Image base64 length:', imageBase64.length);
    }

    onProgress?.('Removing background with AI...');

    const response = await supabase.functions.invoke('remove-background', {
      body: JSON.stringify({ imageBase64 }),
    });

    if (debugMode) {
      console.log('🔍 Debug: Edge function response:', response);
    }

    if (response.error) {
      console.error('Background removal API error:', response.error);
      return {
        success: false,
        error: 'Background removal service unavailable',
        originalBase64: imageBase64
      };
    }

    if (response.data && response.data.resultBase64) {
      const resultBase64 = response.data.resultBase64;
      
      if (debugMode) {
        console.log('🔍 Debug: Successfully received processed image');
        console.log('🔍 Debug: Result base64 length:', resultBase64.length);
      }

      onProgress?.('Background removed successfully!');
      
      return {
        success: true,
        resultBase64,
        originalBase64: imageBase64
      };
    } else {
      console.warn('Invalid response format from background removal service');
      return {
        success: false,
        error: 'Invalid response from background removal service',
        originalBase64: imageBase64
      };
    }
  } catch (error) {
    console.error('Background removal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalBase64: imageBase64
    };
  }
};
