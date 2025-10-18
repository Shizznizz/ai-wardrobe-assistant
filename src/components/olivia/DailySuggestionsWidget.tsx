import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Check, Cloud, Sun, CloudRain, Snowflake } from 'lucide-react';
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

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className="h-5 w-5 text-blue-400" />;
    if (desc.includes('snow')) return <Snowflake className="h-5 w-5 text-blue-200" />;
    if (desc.includes('cloud')) return <Cloud className="h-5 w-5 text-gray-400" />;
    return <Sun className="h-5 w-5 text-yellow-400" />;
  };

  if (!suggestion || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-20 right-4 z-50 max-w-md w-full sm:w-96"
      >
        <Card className="border-primary/30 shadow-2xl bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Good Morning! ☀️
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {suggestion.weather_context && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border"
              >
                {getWeatherIcon(suggestion.weather_context.description)}
                <div className="flex-1">
                  <p className="text-sm font-medium">Today's Weather</p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.weather_context.description} • {suggestion.weather_context.temperature}°C
                    {suggestion.weather_context.feels_like && 
                      ` • Feels like ${suggestion.weather_context.feels_like}°C`
                    }
                  </p>
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm leading-relaxed text-foreground/90"
            >
              {suggestion.reasoning}
            </motion.div>

            {outfits.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Your Perfect Picks:
                </p>
                <div className="flex flex-col gap-2">
                  {outfits.map((outfit, index) => (
                    <motion.div
                      key={outfit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="group relative text-sm p-3 rounded-lg bg-gradient-to-r from-accent to-accent/50 border border-border hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{outfit.name}</span>
                        {outfit.occasion && (
                          <Badge variant="secondary" className="text-xs">
                            {outfit.occasion}
                          </Badge>
                        )}
                      </div>
                      {outfit.colors && outfit.colors.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {outfit.colors.slice(0, 4).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-2 pt-2"
            >
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Perfect!
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Not today
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailySuggestionsWidget;
