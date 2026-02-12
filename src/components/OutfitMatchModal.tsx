import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClothingItem, Outfit, ClothingType } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from '@/lib/utils';
import { Shirt, Footprints, Sparkles, ArrowRight, Check, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import WardrobeGrid from '@/components/WardrobeGrid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TrousersIcon } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OutfitMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ClothingItem;
  allItems: ClothingItem[];
}

const OutfitMatchModal = ({ open, onOpenChange, item, allItems }: OutfitMatchModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("tops");
  const [outfitName, setOutfitName] = useState(`Outfit with ${item.name}`);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([item]);
  const [userClothingItems, setUserClothingItems] = useState<ClothingItem[]>(allItems);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user's clothing items from Supabase when component mounts
  useEffect(() => {
    const fetchUserClothingItems = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);
          
        if (error) throw error;
        
        if (data) {
          const formattedItems: ClothingItem[] = data.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            color: item.color,
            material: item.material || '',
            season: item.season || ['all'],
            occasions: item.occasions || ['casual'],
            favorite: item.favorite || false,
            imageUrl: item.image_url,
            image: item.image_url,
            timesWorn: item.times_worn || 0,
            dateAdded: new Date(item.date_added),
            lastWorn: item.last_worn ? new Date(item.last_worn) : undefined,
            userId: user.id
          }));
          
          setUserClothingItems(formattedItems);
        }
      } catch (error) {
        console.error('Error fetching user clothing items:', error);
      }
    };
    
    fetchUserClothingItems();
  }, [user?.id]);
  
  // Enhanced item type categories to include more top types
  const itemTypeCategories = {
    tops: ['shirt', 'sweater', 'hoodie', 't-shirt', 'blouse', 'tank top', 'top', 'polo'],
    bottoms: ['jeans', 'pants', 'shorts', 'skirt', 'trousers'],
    shoes: ['shoes', 'sneakers', 'boots', 'sandals', 'heels'],
    accessories: ['accessories', 'hat', 'jewelry', 'bag', 'scarf']
  };
  
  const getItemCategory = (type: ClothingType): string => {
    for (const [category, types] of Object.entries(itemTypeCategories)) {
      if (types.includes(type.toLowerCase())) {
        return category;
      }
    }
    return "tops"; // Default fallback
  };
  
  const initialCategory = getItemCategory(item.type);
  
  const getCategoryItems = (category: string): ClothingItem[] => {
    // Use userClothingItems instead of allItems to ensure we only show items from the user's wardrobe
    return userClothingItems.filter(i => {
      const types = itemTypeCategories[category as keyof typeof itemTypeCategories];
      return types?.includes(i.type.toLowerCase()) && i.id !== item.id;
    });
  };
  
  const handleToggleSelect = (id: string) => {
    const clickedItem = userClothingItems.find(i => i.id === id);
    if (!clickedItem) return;
    
    const itemCategory = getItemCategory(clickedItem.type);
    
    setSelectedItems(prev => {
      // Check if item is already selected
      const existingItemIndex = prev.findIndex(i => i.id === id);
      
      // If item is already selected, remove it
      if (existingItemIndex !== -1) {
        // Don't allow deselection of the initial item
        if (id === item.id) return prev;
        
        const newItems = [...prev];
        newItems.splice(existingItemIndex, 1);
        return newItems;
      }
      
      // Otherwise handle normal selection logic with category replacement
      const existingItemOfCategoryIndex = prev.findIndex(
        i => i.id !== item.id && getItemCategory(i.type) === itemCategory
      );
      
      if (existingItemOfCategoryIndex !== -1) {
        const newItems = [...prev];
        newItems[existingItemOfCategoryIndex] = clickedItem;
        return newItems;
      }
      
      return [...prev, clickedItem];
    });
  };
  
  const isItemSelected = (id: string): boolean => {
    return selectedItems.some(i => i.id === id);
  };

  const resetModal = () => {
    setSelectedItems([item]);
    setOutfitName(`Outfit with ${item.name}`);
  };
  
  const handleSaveOutfit = async () => {
    const newOutfit: Outfit = {
      id: uuidv4(),
      name: outfitName,
      items: selectedItems.map(i => i.id),
      season: [...new Set(selectedItems.flatMap(i => i.season || []))],
      seasons: [...new Set(selectedItems.flatMap(i => i.season || []))],
      occasion: selectedItems.flatMap(i => i.occasions || [])[0] || 'casual',
      occasions: [...new Set(selectedItems.flatMap(i => i.occasions || []))],
      favorite: false,
      timesWorn: 0,
      dateAdded: new Date(),
      lastWorn: undefined,
      personality_tags: [],
      color_scheme: '',
      colors: []
    };
    
    console.log('New outfit created:', newOutfit);
    
    // Save to Supabase if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('outfits')
          .insert({
            id: newOutfit.id,
            name: newOutfit.name,
            user_id: user.id,
            items: newOutfit.items,
            season: newOutfit.season,
            occasion: newOutfit.occasion,
            occasions: newOutfit.occasions,
            favorite: newOutfit.favorite,
            times_worn: 0,
            date_added: new Date().toISOString()
          });
          
        if (error) throw error;
      } catch (error) {
        console.error('Error saving outfit:', error);
        // Continue with local saving even if database save fails
      }
    }
    
    // Save to local storage for Mix & Match page
    const savedOutfits = JSON.parse(localStorage.getItem('savedOutfits') || '[]');
    
    // Check if this outfit ID already exists (shouldn't happen with uuidv4 but just to be safe)
    const outfitExists = savedOutfits.some((o: Outfit) => o.id === newOutfit.id);
    if (!outfitExists) {
      savedOutfits.push(newOutfit);
      localStorage.setItem('savedOutfits', JSON.stringify(savedOutfits));
    }
    
    toast.success('Outfit created successfully!', {
      description: 'View it in your outfits collection.',
      action: {
        label: 'View Outfits',
        onClick: () => navigate('/mix-and-match')
      }
    });
    
    // Reset the modal after saving
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 text-white border-slate-700 max-h-[90vh] overflow-hidden flex flex-col mt-6 md:mt-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Create Outfit with {item.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex justify-center p-3 bg-slate-800/50 rounded-lg mb-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white text-center truncate">
                {item.name}
              </div>
            </div>
            
            {selectedItems.length > 1 && (
              <div className="flex items-center">
                <ArrowRight className="h-5 w-5 mx-2 text-purple-400" />
                <div className="flex flex-wrap gap-1 max-w-[300px]">
                  {selectedItems.filter(i => i.id !== item.id).map(i => (
                    <div key={i.id} className="relative w-16 h-16 rounded-md overflow-hidden group">
                      <img 
                        src={i.imageUrl} 
                        alt={i.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-0.5 text-[10px] text-white text-center truncate">
                        {i.name}
                      </div>
                      <button 
                        onClick={() => handleToggleSelect(i.id)}
                        className="absolute top-0 right-0 bg-red-500/80 rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove item"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="outfit-name" className="text-sm text-gray-300 mb-1 block">
              Outfit Name
            </label>
            <Input
              id="outfit-name"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <div className="text-sm text-gray-300 mb-2">
            Now select additional items to complete your outfit:
          </div>
          
          <Tabs defaultValue={initialCategory !== getItemCategory(item.type) ? initialCategory : "tops"} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-800 mb-4">
              <TabsTrigger 
                value="tops" 
                onClick={() => setActiveTab("tops")}
                disabled={getItemCategory(item.type) === "tops"}
                className="data-[state=active]:bg-indigo-700"
              >
                <Shirt className="h-4 w-4 mr-1" />
                Tops
              </TabsTrigger>
              <TabsTrigger 
                value="bottoms" 
                onClick={() => setActiveTab("bottoms")}
                disabled={getItemCategory(item.type) === "bottoms"}
                className="data-[state=active]:bg-indigo-700"
              >
                <TrousersIcon className="h-4 w-4 mr-1" />
                Bottoms
              </TabsTrigger>
              <TabsTrigger 
                value="shoes" 
                onClick={() => setActiveTab("shoes")}
                disabled={getItemCategory(item.type) === "shoes"}
                className="data-[state=active]:bg-indigo-700"
              >
                <Footprints className="h-4 w-4 mr-1" />
                Shoes
              </TabsTrigger>
              <TabsTrigger 
                value="accessories" 
                onClick={() => setActiveTab("accessories")}
                disabled={getItemCategory(item.type) === "accessories"}
                className="data-[state=active]:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Access.
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              {["tops", "bottoms", "shoes", "accessories"].map((category) => (
                <TabsContent 
                  key={category} 
                  value={category} 
                  className="flex-1 h-[300px] data-[state=active]:flex flex-col overflow-hidden"
                >
                  <ScrollArea className="flex-1">
                    {getCategoryItems(category).length > 0 ? (
                      <WardrobeGrid
                        items={getCategoryItems(category)}
                        onToggleFavorite={() => {}}
                        onMatchItem={() => {}}
                        compactView={true}
                        selectable={true}
                        selectedItems={selectedItems.map(i => i.id)}
                        onToggleSelect={handleToggleSelect}
                      />
                    ) : (
                      <div className="p-6 text-center text-gray-400">
                        <p>No items found in this category.</p>
                        <Button 
                          variant="outline" 
                          className="mt-2 border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
                          onClick={() => onOpenChange(false)}
                        >
                          Upload New Items
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            <Badge className="bg-purple-600">
              {selectedItems.length} Items
            </Badge>
            {selectedItems.length >= 2 && (
              <Badge variant="outline" className="border-green-500/30 text-green-300">
                <Check className="h-3 w-3 mr-1" /> Ready to save
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={handleSaveOutfit}
            disabled={selectedItems.length < 2}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Outfit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutfitMatchModal;
