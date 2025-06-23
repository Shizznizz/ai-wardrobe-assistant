
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Heart } from 'lucide-react';

interface ShoppingSuggestionsProps {
  category: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingSuggestions = ({ category, isOpen, onClose }: ShoppingSuggestionsProps) => {
  const mockProducts = [
    {
      name: 'Premium Blazer',
      brand: 'Style Co.',
      price: '$89.99',
      originalPrice: '$120.00',
      image: '/lovable-uploads/56943e49-b4d1-47fe-adf7-ee221134ef60.png',
      rating: 4.8,
      trending: true
    },
    {
      name: 'Classic Dress Shirt',
      brand: 'Elegance',
      price: '$45.99',
      originalPrice: '$65.00',
      image: '/lovable-uploads/5c9492c5-2df1-4f02-8d61-70fd1e57a6af.png',
      rating: 4.6,
      trending: false
    },
    {
      name: 'Leather Loafers',
      brand: 'Comfort+',
      price: '$125.99',
      originalPrice: '$180.00',
      image: '/lovable-uploads/c26c0c8c-7ff3-432a-b79b-1d22494daba6.png',
      rating: 4.9,
      trending: true
    }
  ];

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
                Shop {category.charAt(0).toUpperCase() + category.slice(1)} Items
              </h3>
              <p className="text-purple-200/80 mt-1">
                Curated products to fill your wardrobe gap
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
            {mockProducts.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-dark border-white/10 overflow-hidden group hover:border-purple-400/30 transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.trending && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-500">
                        Trending
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h4 className="font-semibold text-white">{product.name}</h4>
                      <p className="text-sm text-white/60">{product.brand}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-white">{product.price}</span>
                      <span className="text-sm text-white/50 line-through">{product.originalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-white/70">{product.rating}</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Shop Now
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

export default ShoppingSuggestions;
