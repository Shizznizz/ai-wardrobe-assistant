
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, SunMedium, Briefcase, Moon, Coffee, Sparkles, Filter, ChevronDown, X } from 'lucide-react';
import { ClothingSeason, ClothingOccasion } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OutfitFiltersProps {
  selectedSeason: ClothingSeason | null;
  selectedOccasion: ClothingOccasion | null;
  showFavoritesOnly: boolean;
  onSeasonChange: (season: ClothingSeason) => void;
  onOccasionChange: (occasion: ClothingOccasion) => void;
  onFavoritesToggle: () => void;
  className?: string;
}

const OutfitFilters = ({
  selectedSeason,
  selectedOccasion,
  showFavoritesOnly,
  onSeasonChange,
  onOccasionChange,
  onFavoritesToggle,
  className
}: OutfitFiltersProps) => {
  // Define proper typed arrays with default values to prevent undefined errors
  const seasons: ClothingSeason[] = ['spring', 'summer', 'autumn', 'winter'];
  const occasions: ClothingOccasion[] = ['casual', 'business', 'party', 'date'];
  
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(!isMobile);
  
  const clearFilters = () => {
    if (selectedSeason) {
      onSeasonChange(selectedSeason);
    }
    if (selectedOccasion) {
      onOccasionChange(selectedOccasion);
    }
    if (showFavoritesOnly) {
      onFavoritesToggle();
    }
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedSeason) count++;
    if (selectedOccasion) count++;
    if (showFavoritesOnly) count++;
    return count;
  };
  
  const activeCount = getActiveFiltersCount();
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const getSeasonIcon = (season: ClothingSeason) => {
    switch (season) {
      case 'spring':
        return <SunMedium className="w-3.5 h-3.5 mr-1.5 text-green-300" />;
      case 'summer':
        return <SunMedium className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />;
      case 'autumn':
        return <SunMedium className="w-3.5 h-3.5 mr-1.5 text-orange-300" />;
      case 'winter':
        return <SunMedium className="w-3.5 h-3.5 mr-1.5 text-blue-300" />;
      default:
        return <SunMedium className="w-3.5 h-3.5 mr-1.5" />;
    }
  };
  
  const getOccasionIcon = (occasion: ClothingOccasion) => {
    switch (occasion) {
      case 'business':
        return <Briefcase className="w-3.5 h-3.5 mr-1.5" />;
      case 'party':
        return <Sparkles className="w-3.5 h-3.5 mr-1.5" />;
      case 'date':
        return <Moon className="w-3.5 h-3.5 mr-1.5" />;
      case 'casual':
        return <Coffee className="w-3.5 h-3.5 mr-1.5" />;
      default:
        return <Coffee className="w-3.5 h-3.5 mr-1.5" />;
    }
  };
  
  return (
    <div className={cn("neo-blur backdrop-blur-sm border border-white/10 rounded-lg shadow-lg mb-6", className)}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-purple-400" />
          <h3 className="font-medium text-white text-sm">Outfit Filters</h3>
          
          {activeCount > 0 && (
            <Badge className="bg-purple-500/50 text-white text-xs">
              {activeCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-7 text-xs text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpanded}
            className="h-7 text-xs md:hidden"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs text-white/60">Season:</span>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((season) => (
                    <Button
                      key={season}
                      variant={selectedSeason === season ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSeasonChange(season)}
                      className={cn(
                        "text-xs h-8",
                        selectedSeason === season ? 
                          "bg-purple-600 hover:bg-purple-700 text-white" : 
                          "border-white/20 text-white hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {getSeasonIcon(season)}
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-white/60">Occasion:</span>
                <div className="flex flex-wrap gap-2">
                  {occasions.map((occasion) => (
                    <Button
                      key={occasion}
                      variant={selectedOccasion === occasion ? "default" : "outline"}
                      size="sm"
                      onClick={() => onOccasionChange(occasion)}
                      className={cn(
                        "text-xs h-8",
                        selectedOccasion === occasion ? 
                          "bg-purple-600 hover:bg-purple-700 text-white" : 
                          "border-white/20 text-white hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {getOccasionIcon(occasion)}
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={onFavoritesToggle}
                className={cn(
                  "text-xs h-8",
                  showFavoritesOnly ? 
                    "bg-pink-600 hover:bg-pink-700 text-white" : 
                    "border-white/20 text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <Heart className={`w-3.5 h-3.5 mr-1.5 ${showFavoritesOnly ? "fill-current" : ""}`} />
                Favorites Only
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OutfitFilters;
