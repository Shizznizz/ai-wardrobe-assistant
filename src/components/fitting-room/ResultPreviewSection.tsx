
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, Download, RefreshCw, Share, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Outfit } from '@/lib/types';
import OliviaRatingSection from '@/components/fitting-room/OliviaRatingSection';

interface ResultPreviewSectionProps {
  finalImage: string | null;
  userPhoto: string | null;
  selectedOutfit: Outfit | null;
  isProcessingTryOn: boolean;
  isUsingOliviaImage: boolean;
  oliviaSuggestion: string;
  onSaveLook: () => void;
  onTryDifferentOutfit: () => void;
  onStartOver: () => void;
}

const ResultPreviewSection = ({
  finalImage,
  userPhoto,
  selectedOutfit,
  isProcessingTryOn,
  isUsingOliviaImage,
  oliviaSuggestion,
  onSaveLook,
  onTryDifferentOutfit,
  onStartOver
}: ResultPreviewSectionProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <Card className="glass-dark border-white/10 overflow-hidden shadow-xl shadow-purple-900/10">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <motion.h2 
              className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isUsingOliviaImage ? "Here's how it looks on Olivia" : "Here's how it looks on you"}
            </motion.h2>
            
            <div className="flex items-center gap-2">
              {finalImage && (
                <>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:shadow-sm"
                    onClick={onSaveLook}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:shadow-sm"
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {/* Processing state */}
            {isProcessingTryOn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="processing"
                className="flex flex-col items-center justify-center min-h-[400px] p-8"
              >
                <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-medium mb-2 text-white">Creating your virtual try-on...</h3>
                <p className="text-white/70 text-center max-w-md">
                  We're generating your personalized outfit preview. This should only take a few seconds.
                </p>
              </motion.div>
            )}
            
            {/* Final image preview */}
            {!isProcessingTryOn && userPhoto && selectedOutfit && finalImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="preview"
                className="rounded-lg overflow-hidden"
              >
                <div className="aspect-auto max-h-[600px] overflow-hidden flex items-center justify-center rounded-lg">
                  <motion.img 
                    src={finalImage} 
                    alt="Virtual try-on result" 
                    className="w-full h-auto object-contain max-h-[600px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex flex-wrap gap-1">
                    {selectedOutfit.seasons?.map(season => (
                      <Badge 
                        key={season} 
                        variant="outline" 
                        className="text-xs bg-blue-900/30 text-blue-200 border-blue-400/30 capitalize"
                      >
                        {season}
                      </Badge>
                    ))}
                    {selectedOutfit.occasions?.map(occasion => (
                      <Badge 
                        key={occasion} 
                        variant="outline" 
                        className="text-xs bg-purple-900/30 text-purple-200 border-purple-400/30 capitalize"
                      >
                        {occasion}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onStartOver}
                      className="text-sm border-white/20 text-white/80 hover:bg-white/5 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Start Over
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onTryDifferentOutfit}
                      className="text-sm border-purple-400/30 text-purple-200 hover:bg-purple-500/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Try Different Outfit
                    </Button>
                  </div>
                </div>
                
                {/* Olivia's Rating Section */}
                {finalImage && selectedOutfit && (
                  <div className="mt-6 p-4 rounded-lg bg-purple-900/20 border border-purple-500/20 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-white mb-1">Olivia's Take</h4>
                        <p className="text-white/80 text-sm">
                          {oliviaSuggestion}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 backdrop-blur-3xl"></div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultPreviewSection;
