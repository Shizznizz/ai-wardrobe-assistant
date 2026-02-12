
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { ClothingItem, Outfit } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OutfitCustomizationSectionProps {
  selectedOutfit: Outfit;
  onReplaceItem: (oldItemId: string, newItemId: string) => void;
}

const OutfitCustomizationSection = ({ 
  selectedOutfit,
  onReplaceItem 
}: OutfitCustomizationSectionProps) => {
  const { user } = useAuth();
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentItemToReplace, setCurrentItemToReplace] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch clothing items from user's wardrobe
  useEffect(() => {
    if (user) {
      const fetchClothingItems = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('clothing_items')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);
          
          if (error) {
            console.error('Error fetching clothing items:', error);
            toast.error('Failed to load your wardrobe items');
          } else if (data) {
            // Format the data to match ClothingItem type
            const formattedItems: ClothingItem[] = data.map(item => ({
              id: item.id,
              name: item.name,
              type: item.type,
              imageUrl: item.image_url,
              image: item.image_url,
              color: item.color,
              material: item.material || '',
              season: Array.isArray(item.season) ? item.season : ['all'],
              occasions: Array.isArray(item.occasions) ? item.occasions : ['casual'],
              favorite: item.favorite || false,
              timesWorn: item.times_worn || 0,
              dateAdded: new Date(item.date_added)
            }));
            
            setClothingItems(formattedItems);
          }
        } catch (err) {
          console.error('Exception fetching clothing items:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchClothingItems();
    }
  }, [user]);

  // Get unique item categories from the user's wardrobe
  const categories = React.useMemo(() => {
    const uniqueTypes = new Set<string>(clothingItems.map(item => item.type));
    return ['all', ...Array.from(uniqueTypes)];
  }, [clothingItems]);

  // Toggle item replacement panel
  const toggleItemReplacement = (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
      setCurrentItemToReplace(itemId);
      setSelectedCategory('all');
    }
  };

  // Handle item replacement
  const handleReplaceItem = (newItemId: string) => {
    if (!currentItemToReplace) return;
    
    onReplaceItem(currentItemToReplace, newItemId);
    setExpandedItem(null);
    toast.success('Item replaced successfully!');
  };

  // Get alternatives for the current item
  const getAlternatives = (itemId: string) => {
    // If the user has clicked on a specific type filter
    if (!itemId || !clothingItems.length) return [];
    
    const currentItem = clothingItems.find(item => item.id === itemId);
    if (!currentItem) return [];
    
    return clothingItems.filter(item => {
      // Don't include the current item
      if (item.id === itemId) return false;
      
      // Filter by selected category if not "all"
      if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
      
      // If "all" is selected, match by the current item's type
      if (selectedCategory === 'all' && item.type !== currentItem.type) return false;
      
      return true;
    });
  };

  // Get item details by id
  const getItemById = (itemId: string) => {
    return clothingItems.find(item => item.id === itemId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8 mb-12"
    >
      <Card className="glass-dark border-white/10 overflow-hidden shadow-lg">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            Adjust Your Look
          </h3>
          <p className="text-white/70 mb-6">
            Replace individual items to create your perfect outfit
          </p>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-8 h-8 border-2 border-t-purple-500 border-slate-200/20 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedOutfit.items.map((itemId) => {
                const item = getItemById(itemId);
                if (!item) return null;
                
                const isExpanded = expandedItem === itemId;
                const alternatives = getAlternatives(itemId);
                
                return (
                  <div key={itemId} className="relative">
                    {/* Item display */}
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <div className="aspect-square overflow-hidden relative">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50">
                            {item.type}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute bottom-2 right-2 bg-slate-900/70 text-white border-white/20 hover:bg-slate-800"
                          onClick={() => toggleItemReplacement(itemId)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Replace
                        </Button>
                      </div>
                      <div className="p-2 bg-slate-800/80">
                        <p className="text-white text-xs font-medium truncate">{item.name}</p>
                        <p className="text-white/70 text-xs truncate capitalize">{item.type}</p>
                      </div>
                    </div>
                    
                    {/* Alternatives panel */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-0 left-full ml-2 z-10 w-80 border-white/10 bg-slate-900/95 backdrop-blur-md rounded-lg shadow-xl"
                      >
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-white text-sm font-medium">Replace {item.type}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-white/70"
                              onClick={() => setExpandedItem(null)}
                            >
                              ×
                            </Button>
                          </div>
                          
                          {/* Category Filter */}
                          <div className="mb-3">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-full h-8 text-xs bg-white/5 border-white/10">
                                <SelectValue placeholder="Filter by category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Categories</SelectLabel>
                                  {categories.map(category => (
                                    <SelectItem key={category} value={category} className="capitalize">
                                      {category === 'all' ? 'All Types' : category}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {alternatives.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {alternatives.map(alt => (
                                <div 
                                  key={alt.id} 
                                  className="cursor-pointer group"
                                  onClick={() => handleReplaceItem(alt.id)}
                                >
                                  <div className="aspect-square overflow-hidden rounded-md border border-white/10 mb-1 relative">
                                    {alt.imageUrl ? (
                                      <img 
                                        src={alt.imageUrl} 
                                        alt={alt.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/50">
                                        {alt.type}
                                      </div>
                                    )}
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
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default OutfitCustomizationSection;
