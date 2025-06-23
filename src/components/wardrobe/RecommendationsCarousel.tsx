
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus, ShoppingBag } from 'lucide-react';
import { getMockRecommendations } from '@/lib/wardrobe/wardrobeAnalytics';

interface RecommendationsCarouselProps {
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToWardrobe: (item: any) => void;
}

const RecommendationsCarousel = ({ 
  category, 
  isOpen, 
  onClose, 
  onAddToWardrobe 
}: RecommendationsCarouselProps) => {
  const recommendations = getMockRecommendations(category);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-purple-500/20 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {category.charAt(0).toUpperCase() + category.slice(1)} Recommendations
              </h3>
              <p className="text-purple-200/80 mt-1">
                Curated picks to complete your wardrobe
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-dark border-white/10 overflow-hidden group hover:border-purple-400/30 transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-2">{item.name}</h4>
                    <p className="text-sm text-white/70 mb-4">{item.description}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onAddToWardrobe(item)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Wardrobe
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecommendationsCarousel;
