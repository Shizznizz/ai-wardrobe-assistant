
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outfit, ClothingItem } from '@/lib/types';
import { createDefaultOutfit } from '@/lib/itemHelpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import OutfitGrid from '@/components/OutfitGrid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutfitSelectionSectionProps {
  fashionCollections: any[];
  clothingItems: ClothingItem[];
  selectedOutfit: Outfit | null;
  isPremiumUser: boolean;
  onSelectOutfit: (outfit: Outfit) => void;
}

const OutfitSelectionSection = ({
  fashionCollections,
  clothingItems,
  selectedOutfit,
  isPremiumUser,
  onSelectOutfit
}: OutfitSelectionSectionProps) => {
  const { isAuthenticated, user } = useAuth();
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [oliviaOutfits, setOliviaOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modified to explicitly check user email for non-premium view
  const isDanielDeurlooEmail = user?.email === 'danieldeurloo@hotmail.com';
  // If you're Daniel, don't get premium features
  const effectivePremiumUser = isPremiumUser || (isAuthenticated && !isDanielDeurlooEmail);
  const [activeCollection, setActiveCollection] = useState('my-outfits');
  
  // Fetch user's outfits from Supabase
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const fetchOutfits = async () => {
        try {
          const { data, error } = await supabase
            .from('outfits')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);
          
          if (error) {
            console.error('Error fetching outfits:', error);
            toast.error('Failed to load your outfits');
          } else {
            console.log('Fetched outfits:', data);
            
            // Convert database outfits to proper Outfit objects
            const formattedOutfits: Outfit[] = Array.isArray(data) ? data.map(dbOutfit => ({
              ...createDefaultOutfit({
                id: dbOutfit.id,
                name: dbOutfit.name,
                items: dbOutfit.items || [],
                season: dbOutfit.season || ['all'],
                seasons: dbOutfit.season || ['all'],
                occasion: dbOutfit.occasion || 'casual',
                occasions: dbOutfit.occasions || ['casual'],
                favorite: dbOutfit.favorite || false,
                timesWorn: dbOutfit.times_worn || 0,
                dateAdded: new Date(dbOutfit.date_added || new Date())
              })
            })) : [];
            
            setUserOutfits(formattedOutfits);
            
            // Create Olivia's picks from user outfits
            const picks = formattedOutfits.length > 0 
              ? formattedOutfits.filter(outfit => outfit.favorite || Math.random() > 0.5).slice(0, 3) 
              : [];
            
            setOliviaOutfits(picks);
          }
        } catch (err) {
          console.error('Exception fetching outfits:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchOutfits();
    }
  }, [user]);

  // Custom collections including user outfits and Olivia's picks
  const collections = [
    { id: 'my-outfits', name: "Your Outfits", outfits: userOutfits, premium: false },
    { id: 'olivia-picks', name: "Olivia's Picks", outfits: oliviaOutfits, premium: false },
    ...fashionCollections.filter(c => c.id !== 'my-outfits')
  ];

  // Filter collections - show premium ones only to premium or authenticated users (except Daniel)
  const visibleCollections = collections.filter(collection => 
    !collection.premium || effectivePremiumUser
  );

  // No need to edit outfits in this view, just handle selection
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
      <h2 className="text-xl font-semibold mb-4">Outfit Collections</h2>
      <ScrollArea className="rounded-md border border-white/[0.15] bg-black/[0.1] backdrop-blur-sm">
        <div className="flex flex-nowrap gap-4 p-3">
          {visibleCollections.map(collection => (
            <motion.button
              key={collection.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200
                ${activeCollection === collection.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white/90'
                }`}
              onClick={() => setActiveCollection(collection.id)}
            >
              {collection.name}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
      
      {visibleCollections.map(collection => (
        <div key={collection.id} className={collection.id === activeCollection ? 'block' : 'hidden'}>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          ) : (
            <OutfitGrid
              outfits={collection.outfits || []} 
              clothingItems={clothingItems}
              onEdit={handleEditOutfit}
              onDelete={handleDeleteOutfit}
              onToggleFavorite={handleToggleFavorite}
              onSelectOutfit={onSelectOutfit}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default OutfitSelectionSection;
