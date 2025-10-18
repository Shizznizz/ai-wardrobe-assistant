import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailySuggestion {
  id: string;
  outfit_ids: string[];
  reasoning: string;
  weather_context: any;
  was_viewed: boolean;
  was_accepted: boolean;
}

const DailySuggestionsWidget = () => {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [outfits, setOutfits] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchTodaySuggestion();
    }
  }, [user]);

  const fetchTodaySuggestion = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .eq('suggestion_date', today)
      .single();

    if (data && !data.was_viewed) {
      setSuggestion(data);
      setIsVisible(true);

      // Fetch the suggested outfits
      const { data: outfitsData } = await supabase
        .from('outfits')
        .select('*')
        .in('id', data.outfit_ids);

      setOutfits(outfitsData || []);

      // Mark as viewed
      await supabase
        .from('daily_suggestions')
        .update({ was_viewed: true })
        .eq('id', data.id);
    }
  };

  const handleAccept = async () => {
    if (!suggestion) return;

    await supabase
      .from('daily_suggestions')
      .update({ was_accepted: true })
      .eq('id', suggestion.id);

    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!suggestion || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50 max-w-md"
      >
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Good Morning! Olivia's Picks
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestion.weather_context && (
              <div className="text-sm text-muted-foreground">
                Today's weather: {suggestion.weather_context.description}, {suggestion.weather_context.temperature}°C
              </div>
            )}

            <div className="text-sm">
              {suggestion.reasoning}
            </div>

            {outfits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested outfits:</p>
                <div className="flex flex-col gap-2">
                  {outfits.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="text-sm p-2 rounded-md bg-accent/50"
                    >
                      {outfit.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                className="flex-1"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Love it!
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Maybe later
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailySuggestionsWidget;
