
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import OutfitPreviewCard from './OutfitPreviewCard';
import { Outfit, ClothingItem } from '@/lib/types';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

interface WeeklyOutfitPlannerProps {
  outfits: Outfit[];
  clothingItems: ClothingItem[];
  outfitLogs: OutfitLog[];
  onAddLog: (log: Omit<OutfitLog, 'id'>) => void;
  loading?: boolean;
}

const WeeklyOutfitPlanner = ({
  outfits,
  clothingItems,
  outfitLogs,
  onAddLog,
  loading = false
}: WeeklyOutfitPlannerProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, { outfit?: Outfit; tip?: string }>>({});

  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfCurrentWeek, index);
    const dayName = format(date, 'EEEE');
    return { date, dayName };
  });

  // Load existing outfit logs for the week
  useEffect(() => {
    if (!loading && outfits.length > 0) {
      loadWeeklyPlan();
    }
  }, [outfitLogs, outfits, loading]);

  const loadWeeklyPlan = () => {
    const plan: Record<string, { outfit?: Outfit; tip?: string }> = {};
    
    weekDays.forEach(({ date, dayName }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingLog = outfitLogs.find(log => 
        format(log.date, 'yyyy-MM-dd') === dateStr
      );
      
      if (existingLog) {
        const outfit = outfits.find(o => o.id === existingLog.outfitId);
        if (outfit) {
          plan[dateStr] = {
            outfit,
            tip: generateStyleTip(outfit, dayName, date)
          };
        }
      }
    });
    
    setWeeklyPlan(plan);
  };

  const generateStyleTip = (outfit: Outfit, dayName: string, date: Date): string => {
    const tips = [
      `Perfect for ${dayName}! This outfit balances comfort with style.`,
      `The color combination will make you feel confident all day.`,
      `Great choice for transitioning from day to evening activities.`,
      `This look captures the perfect seasonal vibe.`,
      `The silhouette is flattering and on-trend.`,
      `These pieces work beautifully together for any occasion.`,
      `A versatile outfit that can be dressed up or down.`,
      `The perfect balance of classic and contemporary style.`
    ];
    
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
    const weekendTips = [
      `Weekend vibes! This relaxed look is perfect for your day off.`,
      `Comfortable yet stylish - ideal for weekend adventures.`,
      `A laid-back look that still keeps you looking put-together.`
    ];
    
    return isWeekend ? 
      weekendTips[Math.floor(Math.random() * weekendTips.length)] :
      tips[Math.floor(Math.random() * tips.length)];
  };

  const autoplanWeek = async () => {
    if (!user) {
      toast.error('You need to be logged in to auto-plan your week');
      return;
    }

    if (loading) {
      toast.error('Please wait for your outfits to load before auto-planning');
      return;
    }

    if (outfits.length < 7) {
      toast.error(`You need at least 7 outfits to auto-plan a week. You currently have ${outfits.length} outfit${outfits.length !== 1 ? 's' : ''}.`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get available outfits (shuffle for variety)
      const availableOutfits = [...outfits].sort(() => Math.random() - 0.5);
      const usedItemIds = new Set<string>();
      const newPlan: Record<string, { outfit?: Outfit; tip?: string }> = {};

      // Try to assign unique outfits to each day
      for (let i = 0; i < weekDays.length; i++) {
        const { date, dayName } = weekDays[i];
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Find an outfit that doesn't reuse items
        const suitableOutfit = availableOutfits.find(outfit => {
          const hasUsedItems = outfit.items.some(itemId => usedItemIds.has(itemId));
          return !hasUsedItems;
        });

        if (suitableOutfit) {
          // Mark items as used
          suitableOutfit.items.forEach(itemId => usedItemIds.add(itemId));
          
          // Add to plan
          newPlan[dateStr] = {
            outfit: suitableOutfit,
            tip: generateStyleTip(suitableOutfit, dayName, date)
          };

          // Save to database
          const logData = {
            outfitId: suitableOutfit.id,
            date,
            timeOfDay: 'all-day' as const,
            notes: `Auto-planned by Olivia for ${dayName}`,
            user_id: user.id,
            aiSuggested: true
          };

          onAddLog(logData);
        }
      }

      setWeeklyPlan(newPlan);
      toast.success('Week planned successfully! Olivia has curated 7 unique looks for you.');
      
    } catch (error) {
      console.error('Error auto-planning week:', error);
      toast.error('Failed to plan your week. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeOutfitFromDay = async (date: Date) => {
    if (!user) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    try {
      // Find and remove the log from database
      const existingLog = outfitLogs.find(log => 
        format(log.date, 'yyyy-MM-dd') === dateStr
      );
      
      if (existingLog) {
        const { error } = await supabase
          .from('outfit_logs')
          .delete()
          .eq('id', existingLog.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      }

      // Update local state
      const newPlan = { ...weeklyPlan };
      delete newPlan[dateStr];
      setWeeklyPlan(newPlan);
      
      toast.success('Outfit removed from your weekly plan');
    } catch (error) {
      console.error('Error removing outfit:', error);
      toast.error('Failed to remove outfit');
    }
  };

  const chooseOutfitForDay = (date: Date) => {
    // This would open an outfit selector dialog
    // For now, we'll show a toast
    toast.info('Outfit selector coming soon! Use the Auto Plan feature for now.');
  };

  if (loading) {
    return (
      <Card className="glass-dark border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className="text-lg text-purple-100/90">Loading your outfits...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Weekly Outfit Planner</CardTitle>
                <p className="text-white/60 text-sm mt-1">
                  Plan your outfits for the week ahead with Olivia's help
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={autoplanWeek}
                disabled={isGenerating || loading || outfits.length < 7}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Auto Plan My Week
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {!loading && outfits.length < 7 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                You need at least 7 outfits in your wardrobe to use the Auto Plan feature. 
                You currently have {outfits.length} outfit{outfits.length !== 1 ? 's' : ''}. 
                Create more outfits in the Mix & Match section to enable weekly planning.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weekDays.map(({ date, dayName }) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayPlan = weeklyPlan[dateStr];
              
              return (
                <OutfitPreviewCard
                  key={dateStr}
                  outfit={dayPlan?.outfit}
                  clothingItems={clothingItems}
                  day={dayName}
                  date={date}
                  onChooseOutfit={() => chooseOutfitForDay(date)}
                  onRemoveOutfit={() => removeOutfitFromDay(date)}
                  oliviaTip={dayPlan?.tip}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyOutfitPlanner;
