
import React from 'react';
import { motion } from 'framer-motion';
import { Outfit, ClothingItem } from '@/lib/types';
import { Sparkles, Star, AlertCircle } from 'lucide-react';
import OutfitGrid from '@/components/OutfitGrid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SuggestedOutfitsSectionProps {
  outfits: Outfit[];
  clothingItems: ClothingItem[];
  weather?: {
    temperature?: number;
    condition?: string;
  };
  isLoading?: boolean;
}

const SuggestedOutfitsSection = ({ outfits, clothingItems, weather, isLoading }: SuggestedOutfitsSectionProps) => {
  const navigate = useNavigate();

  // Handle edit (would typically open a modal/dialog)
  const handleEdit = (outfit: Outfit) => {
    toast.info(`Viewing outfit: ${outfit.name}`);
  };

  // Handle delete from suggestions (would typically remove from view)
  const handleDelete = (id: string) => {
    toast.info(`Removed from suggestions`);
  };

  // Handle toggle favorite
  const handleToggleFavorite = (id: string) => {
    toast.success(outfits.find(o => o.id === id)?.favorite 
      ? "Removed from favorites" 
      : "Added to favorites");
  };

  // Filter outfits to only show those with valid items
  const validOutfits = outfits.filter(outfit => {
    if (!outfit.items || outfit.items.length === 0) return false;
    
    // Check if at least one item from the outfit exists in the user's wardrobe
    const validItemCount = outfit.items.filter(itemId => 
      clothingItems.some(item => item.id === itemId)
    ).length;
    
    // Only show outfit if at least one item exists
    return validItemCount > 0;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50 backdrop-blur-md p-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-xl font-semibold text-white">Your Saved Outfits</h3>
            </div>
            <p className="text-white/70 text-sm">Loading your outfits...</p>
          </div>
        </div>
        
        <div className="flex justify-center py-10">
          <div className="animate-pulse w-full max-w-md flex flex-col items-center">
            <div className="h-48 w-full bg-slate-700/50 rounded-lg mb-4"></div>
            <div className="h-6 w-1/2 bg-slate-700/50 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-slate-700/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty wardrobe message when no items available
  if (clothingItems.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50 backdrop-blur-md p-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-xl font-semibold text-white">Your Saved Outfits</h3>
            </div>
          </div>
        </div>
        
        <div className="py-16 text-center">
          <AlertCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">I couldn't find your wardrobe. Want help building it?</p>
          <p className="text-white/60 text-sm mb-6">Let's start by adding some clothing items to create amazing outfits.</p>
          <Button 
            onClick={() => navigate('/my-wardrobe')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50 backdrop-blur-md p-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-semibold text-white">Your Saved Outfits</h3>
          </div>
          <p className="text-white/70 text-sm">
            These are outfits you've created using your wardrobe. Tap to edit, try on, or build a new one.
          </p>
        </div>
      </div>
      
      {validOutfits.length > 0 ? (
        <OutfitGrid 
          outfits={validOutfits} 
          clothingItems={clothingItems} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <div className="py-16 text-center">
          <p className="text-white/60">Create your first outfit to see personalized recommendations</p>
        </div>
      )}
      
      {validOutfits.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm flex items-center justify-center gap-1">
            <Star className="h-4 w-4 text-amber-400" />
            Use these saved outfits in the virtual fitting room or share with friends
          </p>
        </div>
      )}
    </div>
  );
};

export default SuggestedOutfitsSection;
