
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClothingItem } from '@/lib/types';
import { analyzeWardrobeGaps } from '@/lib/wardrobe/wardrobeAnalytics';
import RecommendationsCarousel from './RecommendationsCarousel';
import ShoppingSuggestions from './ShoppingSuggestions';
import { Sparkles, ShoppingBag, Plus, TrendingUp, AlertTriangle, Info, Target } from 'lucide-react';

interface EnhancedWardrobeGapsProps {
  items: ClothingItem[];
  onAddItem?: (item: any) => void;
}

const EnhancedWardrobeGaps = ({ items, onAddItem }: EnhancedWardrobeGapsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const analysis = useMemo(() => analyzeWardrobeGaps(items), [items]);

  const handleShowRecommendations = (category: string) => {
    setSelectedCategory(category.toLowerCase());
    setShowRecommendations(true);
  };

  const handleShowShopping = (category: string) => {
    setSelectedCategory(category.toLowerCase());
    setShowShopping(true);
  };

  const handleAddToWardrobe = (item: any) => {
    if (onAddItem) {
      onAddItem({
        name: item.name,
        type: item.name.toLowerCase().includes('shirt') ? 'shirt' : 
              item.name.toLowerCase().includes('blazer') ? 'blazer' :
              item.name.toLowerCase().includes('shoes') ? 'shoes' : 'top',
        color: 'Black',
        season: ['all'],
        occasions: [selectedCategory === 'formal' ? 'formal' : 'casual'],
        favorite: false,
        timesWorn: 0,
        dateAdded: new Date()
      });
    }
    setShowRecommendations(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) return 'text-green-400';
    if (score >= 31) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 71) return 'from-green-500 to-emerald-500';
    if (score >= 31) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getCategoryDescription = (category: string) => {
    const descriptions = {
      'Casual': 'Perfect for everyday activities, weekend outings, and relaxed social gatherings',
      'Formal': 'Essential for business meetings, formal events, and professional occasions',
      'Sporty': 'Ideal for workouts, outdoor activities, and active lifestyle pursuits',
      'Boho': 'Great for festivals, creative environments, and expressing artistic flair',
      'Professional': 'Perfect for work environments, interviews, and business networking',
      'Seasonal': 'Weather-appropriate pieces for different seasons and climates'
    };
    return descriptions[category as keyof typeof descriptions] || 'Versatile pieces for various occasions';
  };

  const getOliviaInsight = () => {
    if (analysis.primaryGap) {
      const gap = analysis.primaryGap;
      const suggestions = gap.missing.slice(0, 2);
      return `Let's boost your ${gap.name} category with ${suggestions.join(' or ')}. This will give you more styling flexibility!`;
    }
    return "Your wardrobe has great potential! A few strategic additions will unlock even more styling possibilities.";
  };

  const getCompletionMessage = (score: number) => {
    const categoryCount = analysis.categories.filter(cat => cat.coverage >= 50).length;
    const totalCategories = analysis.categories.length;
    
    if (score >= 71) {
      return `Excellent! You've mastered ${categoryCount} of ${totalCategories} major styles. You've unlocked Olivia's Auto-Styling power!`;
    } else if (score >= 31) {
      return `Good progress! You've covered ${categoryCount} of ${totalCategories} major styles. Aim for 70% to unlock Olivia's Auto-Styling power.`;
    } else {
      return `Getting started! You've covered ${categoryCount} of ${totalCategories} major styles. Let's build your foundation together.`;
    }
  };

  if (!analysis.primaryGap && analysis.overallScore >= 80) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl backdrop-blur-sm shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Perfect Wardrobe Balance!</h3>
            <p className="text-green-200/80 text-sm">Your wardrobe is well-rounded across all categories.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={analysis.overallScore} className="flex-1 h-3" />
          <span className="text-green-400 font-bold">{Math.round(analysis.overallScore)}%</span>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 space-y-6"
      >
        <Card className="glass-dark border-purple-500/30 overflow-hidden shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white font-bold">⚠️ Wardrobe Gap Analysis</CardTitle>
                <p className="text-purple-200/80 text-sm mt-1">AI-powered insights to complete your style</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            {/* Olivia's Insight */}
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-400/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Olivia's Insight</h4>
                  <p className="text-purple-100/90 text-sm leading-relaxed">{getOliviaInsight()}</p>
                </div>
              </div>
            </div>

            {/* Category Coverage Analysis */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Category Coverage
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.categories.map((category, index) => (
                  <TooltipProvider key={category.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-slate-800/50 rounded-lg border border-white/10 hover:border-purple-400/30 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-white">{category.name}</span>
                            <Badge 
                              variant={category.coverage >= 50 ? "default" : "destructive"}
                              className={category.coverage >= 50 ? "bg-green-600" : "bg-red-600"}
                            >
                              {Math.round(category.coverage)}%
                            </Badge>
                          </div>
                          <Progress 
                            value={category.coverage} 
                            className="h-2 mb-3"
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">
                              {category.items.length} of {category.requiredItems.length} key items
                            </span>
                            <Info className="h-3 w-3 text-white/40" />
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3">
                        <div className="space-y-2">
                          <p className="font-medium">{category.name} Style</p>
                          <p className="text-xs text-gray-300">{getCategoryDescription(category.name)}</p>
                          {category.missing.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-300 mb-1">Missing:</p>
                              <p className="text-xs text-gray-300">{category.missing.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Priority Gap Actions */}
            {analysis.primaryGap && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-400" />
                  Priority Gap: {analysis.primaryGap.name}
                </h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  {getCategoryDescription(analysis.primaryGap.name)}. You're missing: {analysis.primaryGap.missing.slice(0, 3).join(', ')}
                  {analysis.primaryGap.missing.length > 3 && ` and ${analysis.primaryGap.missing.length - 3} more items`}.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => handleShowRecommendations(analysis.primaryGap!.name)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Show AI Recommendations
                  </Button>
                  <Button
                    onClick={() => handleShowShopping(analysis.primaryGap!.name)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 flex-1"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop for Items
                  </Button>
                </div>
              </div>
            )}

            {/* Wardrobe Completion Score */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-white">Wardrobe Completion Score</h4>
                <span className={`text-xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {Math.round(analysis.overallScore)}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={analysis.overallScore} 
                  className="h-4"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${getProgressColor(analysis.overallScore)} rounded-full opacity-20`} />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-2">
                <span>Building (0-30%)</span>
                <span>Growing (31-70%)</span>
                <span>Complete (71-100%)</span>
              </div>
              <p className="text-white/80 text-sm mt-3 leading-relaxed">
                {getCompletionMessage(analysis.overallScore)}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <RecommendationsCarousel
        category={selectedCategory}
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        onAddToWardrobe={handleAddToWardrobe}
      />

      <ShoppingSuggestions
        category={selectedCategory}
        isOpen={showShopping}
        onClose={() => setShowShopping(false)}
      />
    </>
  );
};

export default EnhancedWardrobeGaps;
