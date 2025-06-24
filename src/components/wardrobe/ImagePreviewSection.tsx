
import { Button } from '@/components/ui/button';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImagePreviewSectionProps {
  imagePreview: string | null;
  isProcessing: boolean;
  backgroundRemovalFailed: boolean;
  onClearImage: () => void;
  onRetryBackgroundRemoval: () => void;
  className?: string;
}

const ImagePreviewSection = ({
  imagePreview,
  isProcessing,
  backgroundRemovalFailed,
  onClearImage,
  onRetryBackgroundRemoval,
  className = ""
}: ImagePreviewSectionProps) => {
  return (
    <div className={`relative ${className}`}>
      {imagePreview && (
        <motion.div 
          className="relative w-full max-w-[300px] mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-600">
            <img 
              src={imagePreview} 
              alt="Clothing item preview" 
              className="w-full h-full object-cover"
            />
            
            {/* Clear button */}
            <button 
              type="button"
              onClick={onClearImage}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-2 text-white transition-colors"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white bg-black/70 px-6 py-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-pulse text-purple-400" />
                    <span className="text-sm font-medium">Removing background...</span>
                  </div>
                  <div className="w-32 h-1 bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retry button */}
          {backgroundRemovalFailed && !isProcessing && (
            <motion.div 
              className="mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetryBackgroundRemoval}
                className="w-full bg-transparent border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Background Removal
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ImagePreviewSection;
