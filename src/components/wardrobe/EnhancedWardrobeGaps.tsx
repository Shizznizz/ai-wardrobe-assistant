
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ClothingItem } from '@/lib/types';
import { analyzeWardrobeGaps } from '@/lib/wardrobe/wardrobeAnalytics';
import RecommendationsCarousel from './RecommendationsCarousel';
import ShoppingSuggestions from './ShoppingSuggestions';
import { Sparkles, ShoppingBag, Plus, TrendingUp, AlertCircle } from 'lucide-react';

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
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!analysis.primaryGap && analysis.overallScore >= 80) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl backdrop-blur-sm"
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
        <Card className="glass-dark border-purple-500/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Wardrobe Gap Analysis</CardTitle>
                <p className="text-purple-200/80 text-sm mt-1">AI-powered insights to complete your style</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Insights Summary */}
            <div className="space-y-3">
              {analysis.insights.map((insight, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-white/90 text-sm leading-relaxed"
                >
                  {insight}
                </motion.p>
              ))}
            </div>

            {/* Category Coverage Analysis */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Category Coverage
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.categories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-800/50 rounded-lg border border-white/10"
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
                      className="h-2 mb-2"
                    />
                    <p className="text-xs text-white/60">
                      {category.items.length} of {category.requiredItems.length} key items
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Primary Gap Actions */}
            {analysis.primaryGap && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Priority Gap: {analysis.primaryGap.name}</h4>
                <p className="text-white/80 text-sm">
                  Missing: {analysis.primaryGap.missing.slice(0, 3).join(', ')}
                  {analysis.primaryGap.missing.length > 3 && ` and ${analysis.primaryGap.missing.length - 3} more`}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => handleShowRecommendations(analysis.primaryGap!.name)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1"
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

            {/* Overall Completion Score */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">Wardrobe Completion Score</h4>
                <span className={`text-xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {Math.round(analysis.overallScore)}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={analysis.overallScore} 
                  className="h-4"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-2">
                <span>Needs Work</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
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
