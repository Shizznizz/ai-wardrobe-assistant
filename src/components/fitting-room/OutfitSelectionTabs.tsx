
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Check } from 'lucide-react';
import { ClothingItem, Outfit } from '@/lib/types';
import { createDefaultOutfit } from '@/lib/itemHelpers';
import OutfitGrid from '@/components/OutfitGrid';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutfitSelectionTabsProps {
  fashionCollections: any[];
  clothingItems: ClothingItem[];
  selectedOutfit: Outfit | null;
  isPremiumUser: boolean;
  onSelectOutfit: (outfit: Outfit) => void;
}

const OutfitSelectionTabs = ({
  fashionCollections,
  clothingItems,
  selectedOutfit,
  isPremiumUser,
  onSelectOutfit
}: OutfitSelectionTabsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('your-outfits');
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user's outfits from Supabase
  useEffect(() => {
    if (user) {
      const fetchUserOutfits = async () => {
        setIsLoading(true);
        
        try {
          const { data, error } = await supabase
            .from('outfits')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);
          
          if (error) {
            console.error('Error fetching outfits:', error);
            toast.error('Failed to load your outfits');
            setUserOutfits([]);
          } else if (data) {
            // Format the data to match Outfit type using helper function
            const formattedOutfits: Outfit[] = data.map(outfitData => 
              createDefaultOutfit({
                id: outfitData.id,
                name: outfitData.name || `Outfit ${outfitData.id.slice(0, 4)}`,
                items: outfitData.items || [],
                seasons: outfitData.season || ['all'],
                occasions: outfitData.occasions || [outfitData.occasion || 'casual'],
                favorite: outfitData.favorite || false,
                timesWorn: outfitData.times_worn || 0,
                dateAdded: new Date(outfitData.date_added || outfitData.created_at)
              })
            );
            
            setUserOutfits(formattedOutfits);
          }
        } catch (err) {
          console.error('Exception fetching outfits:', err);
          toast.error("Couldn't load your outfits");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserOutfits();
    }
  }, [user]);
  
  const handleSelectOutfit = (outfit: Outfit) => {
    onSelectOutfit(outfit);
    
    // Scroll to preview section
    setTimeout(() => {
      document.getElementById('result-preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleMockSelectOutfit = () => {
    if (!isPremiumUser) {
      // Show premium upsell or toast
      const previewSection = document.getElementById('preview-section');
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  // Placeholder for editing and delete (not implemented yet)
  const handleEditOutfit = () => {};
  const handleDeleteOutfit = () => {};
  const handleToggleFavorite = () => {};
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <Card className="glass-dark border-white/10 overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            Choose an Outfit to Try On
          </h2>

          <Tabs 
            defaultValue="your-outfits" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
              <TabsTrigger value="your-outfits">Your Outfits</TabsTrigger>
              <TabsTrigger 
                value="ai-suggested"
                disabled={!isPremiumUser}
                className="relative"
              >
                <span>AI Suggested</span>
                {!isPremiumUser && (
                  <span className="absolute right-1 top-1/2 -translate-y-1/2">
                    <Lock className="h-3.5 w-3.5 text-yellow-300/80" />
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="your-outfits">
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                    </div>
                  ) : userOutfits.length > 0 ? (
                    <OutfitGrid
                      outfits={userOutfits}
                      clothingItems={clothingItems}
                      onEdit={handleEditOutfit}
                      onDelete={handleDeleteOutfit}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectOutfit={handleSelectOutfit}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-lg text-white/70">You haven't created any outfits yet.</p>
                      <Button 
                        variant="outline"
                        className="mt-4 border-blue-400/30 text-blue-300 hover:bg-blue-900/20"
                        onClick={() => window.location.href = '/wardrobe/mix-match'}
                      >
                        Go to Mix & Match to create outfits
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-suggested">
              <div className="space-y-4">
                {isPremiumUser ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Premium AI Suggested Outfits */}
                    {fashionCollections.slice(1, 4).map((collection, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx, duration: 0.4 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-purple-400/30 transition-colors h-[420px] flex flex-col"
                      >
                        <div className="aspect-square relative flex-shrink-0">
                          <img 
                            src={collection.image || "/placeholder-outfit.png"} 
                            alt={collection.name} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
                            <h3 className="text-lg font-medium text-white">{collection.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge className="bg-purple-500/70 text-white border-none">AI Generated</Badge>
                              <Badge className="bg-slate-700/70 text-white border-none">{collection.occasion || "Casual"}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                          <p className="text-white/70 text-sm flex-grow">
                            {collection.description || "A perfect combination for your style and preferences."}
                          </p>
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto"
                            onClick={() => handleSelectOutfit(collection.outfit)}
                          >
                            <Check className="mr-2 h-4 w-4" /> Try This On
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8 text-center">
                    <Lock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2 text-white">Premium Feature</h3>
                    <p className="text-white/70 mb-6 max-w-md mx-auto">
                      Unlock AI-suggested outfits personalized to your style preferences and body type with Premium.
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:from-yellow-400 hover:to-amber-500"
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OutfitSelectionTabs;
