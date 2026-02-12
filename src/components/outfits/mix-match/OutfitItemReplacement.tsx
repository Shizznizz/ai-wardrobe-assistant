
import { useState, useEffect } from 'react';
import { ClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OutfitItemReplacementProps {
  item: ClothingItem;
  onReplaceItem: (oldItemId: string, newItemId: string) => void;
  category?: string;
}

const OutfitItemReplacement = ({ item, onReplaceItem, category }: OutfitItemReplacementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const fetchAlternatives = async () => {
    if (!user) {
      toast.error("Please sign in to see alternatives");
      return;
    }
    
    setIsLoading(true);
    setIsOpen(true);
    
    try {
      // Get item's category from the item itself if not provided
      const itemCategory = category || item.type;
      
      // Query Supabase for alternatives with the same category/type
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('type', itemCategory)
        .neq('id', item.id)
        .limit(6);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.info(`No alternative ${itemCategory} items found in your wardrobe`);
        setAlternatives([]);
        return;
      }
      
      // Format the data to match ClothingItem type
      const formattedItems: ClothingItem[] = data.map(dbItem => ({
        id: dbItem.id,
        name: dbItem.name,
        type: dbItem.type,
        color: dbItem.color,
        material: dbItem.material || '',
        season: dbItem.season || ['all'],
        occasions: dbItem.occasions || ['casual'],
        favorite: dbItem.favorite || false,
        imageUrl: dbItem.image_url,
        image: dbItem.image_url,
        timesWorn: dbItem.times_worn || 0,
        dateAdded: new Date(dbItem.date_added)
      }));
      
      setAlternatives(formattedItems);
    } catch (err) {
      console.error("Error fetching alternatives:", err);
      toast.error("Couldn't load alternatives");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelect = (alternativeItem: ClothingItem) => {
    onReplaceItem(item.id, alternativeItem.id);
    setIsOpen(false);
    toast.success(`Replaced ${item.name} with ${alternativeItem.name}`);
    
    // Save feedback to Supabase
    if (user) {
      supabase.from('outfit_feedback').insert({
        user_id: user.id,
        item_id: item.id,
        replacement_item_id: alternativeItem.id,
        label: 'replacement',
        outfit_id: 'virtual-try-on',
        timestamp: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Error saving feedback:", error);
      });
    }
  };
  
  return (
    <div className="relative">
      {/* Item display */}
      <div className="rounded-lg overflow-hidden border border-white/10">
        <div className="aspect-square overflow-hidden relative">
          <img 
            src={item.imageUrl || item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2 bg-slate-900/70 text-white border-white/20 hover:bg-slate-800"
            onClick={fetchAlternatives}
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Replace
          </Button>
        </div>
        <div className="p-2 bg-slate-800/80">
          <p className="text-white text-xs font-medium truncate">{item.name}</p>
          <p className="text-white/70 text-xs truncate">{item.type}</p>
        </div>
      </div>
      
      {/* Alternatives panel */}
      {isOpen && (
        <Card className="absolute top-0 left-full ml-2 z-10 w-80 border-white/10 bg-slate-900/95 backdrop-blur-md">
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white text-sm font-medium">Alternative options</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 text-white/70"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 border-2 border-t-purple-500 border-slate-200/20 rounded-full animate-spin"></div>
              </div>
            ) : alternatives.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {alternatives.map(alt => (
                  <div 
                    key={alt.id} 
                    className="cursor-pointer group"
                    onClick={() => handleSelect(alt)}
                  >
                    <div className="aspect-square overflow-hidden rounded-md border border-white/10 mb-1 relative">
                      <img 
                        src={alt.imageUrl || alt.image} 
                        alt={alt.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-white/90 text-xs truncate">{alt.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-xs p-2">No alternatives available. Add more items to your wardrobe.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OutfitItemReplacement;
