
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
 * Remove background from image using Supabase Edge Function
 */
export const removeBackground = async (
  imageBase64: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> => {
  const { debugMode = false, onProgress } = options;

  try {
    if (debugMode) {
      console.log('🔍 Debug: Sending image to background removal, size:', imageBase64.length);
    }

    onProgress?.('Removing background...');

    const response = await supabase.functions.invoke('remove-background', {
      body: JSON.stringify({ imageBase64 }),
    });

    if (debugMode) {
      console.log('🔍 Debug: Background removal response:', response);
    }

    if (response.error) {
      console.error('Background removal failed:', response.error);
      return {
        success: false,
        error: 'API request failed',
        originalBase64: imageBase64
      };
    }

    if (response.data && response.data.resultBase64) {
      const resultBase64 = response.data.resultBase64;
      
      if (debugMode) {
        console.log('🔍 Debug: Received processed image, size:', resultBase64.length);
      }

      onProgress?.('Background removed successfully!');
      
      return {
        success: true,
        resultBase64,
        originalBase64: imageBase64
      };
    } else {
      console.error('Invalid response format from background removal');
      return {
        success: false,
        error: 'Invalid response format',
        originalBase64: imageBase64
      };
    }
  } catch (error) {
    console.error('Background removal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      originalBase64: imageBase64
    };
  }
};
