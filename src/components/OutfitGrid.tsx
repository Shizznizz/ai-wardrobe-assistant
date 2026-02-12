
import { useState, useEffect } from 'react';
import { Outfit, ClothingItem } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';
import { toast } from 'sonner';
import { OutfitCard } from './outfits/OutfitCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import OutfitImageGrid from './outfits/OutfitImageGrid';

interface OutfitGridProps {
  outfits: Outfit[];
  onEdit: (outfit: Outfit) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  clothingItems: ClothingItem[];
  onOutfitAddedToCalendar?: (log: OutfitLog) => void;
  onSelectOutfit?: (outfit: Outfit) => void;
  fetchFromSupabase?: boolean;
  refreshData?: () => void;
}

const OutfitGrid = ({ 
  outfits, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  clothingItems,
  onOutfitAddedToCalendar,
  onSelectOutfit,
  fetchFromSupabase = false,
  refreshData
}: OutfitGridProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch outfits from Supabase if fetchFromSupabase is true
  useEffect(() => {
    if (fetchFromSupabase && user) {
      setIsLoading(true);
      const fetchOutfits = async () => {
        try {
          // Soft-delete: exclude rows where deleted_at is set.
          const { data: outfitsData, error: outfitsError } = await supabase
            .from('outfits')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
          
          if (outfitsError) {
            console.error('Error fetching outfits:', outfitsError);
            toast.error('Failed to load your outfits');
            setIsLoading(false);
            return;
          }
          
          setUserOutfits(Array.isArray(outfitsData) ? outfitsData : []);
          setIsLoading(false);
        } catch (err) {
          console.error('Exception fetching outfits:', err);
          setIsLoading(false);
        }
      };
      
      fetchOutfits();
    }
  }, [fetchFromSupabase, user, refreshData]);

  // Use outfits from props or from Supabase
  const displayOutfits = fetchFromSupabase ? userOutfits : outfits;
  const safeOutfits = Array.isArray(displayOutfits) ? displayOutfits : [];
  const safeClothingItems = Array.isArray(clothingItems) ? clothingItems : [];
  
  // Helper function to check if an outfit contains valid items from the user's wardrobe
  const outfitHasValidItems = (outfit: Outfit): boolean => {
    if (!outfit || !Array.isArray(outfit.items) || outfit.items.length === 0) {
      return false;
    }
    
    // Check if at least one item from the outfit exists in the user's wardrobe
    return outfit.items.some(itemId => 
      safeClothingItems.some(item => item && item.id === itemId)
    );
  };
  
  // Filter outfits to only include those with valid items
  const validOutfits = safeOutfits.filter(outfitHasValidItems);
  
  const getClothingItemById = (id: string): ClothingItem | undefined => {
    return safeClothingItems.find(item => item && item.id === id);
  };

  const handlePreviewInFittingRoom = (outfit: Outfit) => {
    if (onSelectOutfit && outfit) {
      onSelectOutfit(outfit);
      return;
    }
    
    if (outfit) {
      localStorage.setItem(user?.id ? `previewOutfit:${user.id}` : 'previewOutfit', JSON.stringify(outfit));
      toast.success('Taking you to the Fitting Room to preview this look...');
      navigate('/fitting-room');
    }
  };

  // Soft-delete: sets deleted_at instead of removing the row.
  const handleDelete = async (id: string) => {
    // Confirmation prompt — prevents accidental deletions.
    if (!window.confirm('Delete this outfit?')) return;

    if (user && fetchFromSupabase) {
      try {
        const { error } = await supabase
          .from('outfits')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserOutfits(prev => prev.filter(outfit => outfit.id !== id));
        toast.success('Outfit deleted successfully');
      } catch (error) {
        console.error('Error deleting outfit:', error);
        toast.error('Failed to delete outfit');
      }
    } else {
      onDelete(id);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (user && fetchFromSupabase) {
      try {
        const outfit = userOutfits.find(o => o.id === id);
        if (!outfit) return;

        const { error } = await supabase
          .from('outfits')
          .update({ favorite: !outfit.favorite })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setUserOutfits(prev => 
          prev.map(outfit => 
            outfit.id === id 
              ? { ...outfit, favorite: !outfit.favorite }
              : outfit
          )
        );
        
        toast.success(outfit.favorite ? 'Removed from favorites' : 'Added to favorites');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
      }
    } else {
      onToggleFavorite(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (validOutfits.length === 0) {
    return (
      <div className="col-span-full p-8 text-center text-white/70">
        <p>No outfits with valid items from your wardrobe found.</p>
        <p className="mt-2 text-sm">Try adding more clothing items to your wardrobe or creating new outfits.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {validOutfits.map((outfit) => {
        if (!outfit) return null;
        
        return (
          <OutfitCard
            key={outfit.id || `outfit-${Math.random()}`}
            outfit={outfit}
            clothingItems={safeClothingItems}
            onEdit={onEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            getClothingItemById={getClothingItemById}
            onOutfitAddedToCalendar={onOutfitAddedToCalendar}
            onPreviewInFittingRoom={handlePreviewInFittingRoom}
          />
        );
      })}
    </div>
  );
};

export default OutfitGrid;
