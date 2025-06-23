
import { useState, useEffect } from 'react';
import { ClothingItem, Outfit } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useWardrobeData = () => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load user's clothing items from Supabase
  const loadClothingItems = async () => {
    // Wait until user is fully available
    if (!user?.id) {
      console.log('User ID not available for loading clothing items');
      return;
    }
    
    setIsLoadingItems(true);
    try {
      // First try clothing_items table
      const { data: clothingData, error: clothingError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (clothingError) {
        console.error('Error loading from clothing_items:', clothingError);
        
        // Fallback to wardrobe_items table
        const { data: wardrobeData, error: wardrobeError } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', user.id);
          
        if (wardrobeError) {
          console.error('Error loading from wardrobe_items:', wardrobeError);
          throw wardrobeError;
        }
        
        // Handle wardrobe_items data format
        if (wardrobeData && wardrobeData.length > 0) {
          const formattedItems: ClothingItem[] = wardrobeData.map(item => {
            const itemData = item.item_data || {};
            return {
              id: item.id,
              name: itemData.name || 'Unknown Item',
              type: itemData.type || 'clothing',
              color: itemData.color || 'unknown',
              material: itemData.material || '',
              season: itemData.season || ['all'],
              occasions: itemData.occasions || ['casual'],
              imageUrl: itemData.imageUrl || itemData.image_url,
              image: itemData.imageUrl || itemData.image_url,
              favorite: itemData.favorite || false,
              timesWorn: itemData.timesWorn || 0,
              lastWorn: itemData.lastWorn ? new Date(itemData.lastWorn) : undefined,
              dateAdded: item.created_at ? new Date(item.created_at) : new Date()
            };
          });
          setClothingItems(formattedItems);
        } else {
          setClothingItems([]);
        }
      } else {
        // Handle clothing_items data format
        if (clothingData && clothingData.length > 0) {
          const formattedItems: ClothingItem[] = clothingData.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            color: item.color,
            material: item.material,
            season: item.season,
            occasions: item.occasions,
            imageUrl: item.image_url,
            image: item.image_url,
            favorite: item.favorite,
            timesWorn: item.times_worn,
            lastWorn: item.last_worn ? new Date(item.last_worn) : undefined,
            dateAdded: item.date_added ? new Date(item.date_added) : new Date()
          }));
          setClothingItems(formattedItems);
        } else {
          setClothingItems([]);
        }
      }
    } catch (error) {
      console.error('Error loading clothing items:', error);
      setClothingItems([]);
      toast.error('Failed to load your wardrobe items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Load user's outfits from Supabase
  const loadOutfits = async () => {
    // Wait until user is fully available
    if (!user?.id) {
      console.log('User ID not available for loading outfits');
      return;
    }
    
    setIsLoadingOutfits(true);
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Convert database format to app format
      const formattedOutfits: Outfit[] = data.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        items: outfit.items,
        occasions: outfit.occasions,
        occasion: outfit.occasion,
        season: outfit.season,
        seasons: outfit.season, // For backward compatibility
        favorite: outfit.favorite,
        timesWorn: outfit.times_worn,
        lastWorn: outfit.last_worn ? new Date(outfit.last_worn) : undefined,
        dateAdded: outfit.date_added ? new Date(outfit.date_added) : new Date(),
        personality_tags: outfit.personality_tags,
        color_scheme: outfit.color_scheme,
        colors: outfit.colors
      }));
      
      setOutfits(formattedOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      toast.error('Failed to load your outfits');
    } finally {
      setIsLoadingOutfits(false);
    }
  };

  // Add a new clothing item to Supabase
  const addClothingItem = async (newItem: Omit<ClothingItem, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to add items');
      return null;
    }
    
    try {
      // Format for database storage
      const dbItem = {
        user_id: user.id,
        name: newItem.name,
        type: newItem.type,
        color: newItem.color,
        material: newItem.material,
        season: newItem.season || ['all'],
        occasions: newItem.occasions || ['casual'],
        image_url: newItem.image || newItem.imageUrl,
        favorite: newItem.favorite || false,
        times_worn: newItem.timesWorn || 0,
        last_worn: newItem.lastWorn,
        date_added: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('clothing_items')
        .insert(dbItem)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format the returned item for the app
      const formattedItem: ClothingItem = {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        material: data.material,
        season: data.season,
        occasions: data.occasions,
        imageUrl: data.image_url,
        image: data.image_url,
        favorite: data.favorite,
        timesWorn: data.times_worn,
        lastWorn: data.last_worn ? new Date(data.last_worn) : undefined,
        dateAdded: data.date_added ? new Date(data.date_added) : new Date()
      };
      
      setClothingItems(prev => [...prev, formattedItem]);
      return formattedItem;
    } catch (error) {
      console.error('Error adding clothing item:', error);
      toast.error('Failed to add item to your wardrobe');
      return null;
    }
  };

  // Add a new outfit to Supabase
  const addOutfit = async (newOutfit: Omit<Outfit, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to create outfits');
      return null;
    }
    
    try {
      // Format for database storage
      const dbOutfit = {
        user_id: user.id,
        name: newOutfit.name,
        items: newOutfit.items,
        season: newOutfit.season || newOutfit.seasons || ['all'],
        occasions: newOutfit.occasions,
        occasion: newOutfit.occasion || 'casual',
        favorite: newOutfit.favorite || false,
        times_worn: newOutfit.timesWorn || 0,
        last_worn: newOutfit.lastWorn,
        date_added: new Date().toISOString(),
        personality_tags: newOutfit.personality_tags,
        color_scheme: newOutfit.color_scheme,
        colors: newOutfit.colors
      };
      
      const { data, error } = await supabase
        .from('outfits')
        .insert(dbOutfit)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format the returned outfit for the app
      const formattedOutfit: Outfit = {
        id: data.id,
        name: data.name,
        items: data.items,
        occasions: data.occasions,
        occasion: data.occasion,
        season: data.season,
        seasons: data.season,
        favorite: data.favorite,
        timesWorn: data.times_worn,
        lastWorn: data.last_worn ? new Date(data.last_worn) : undefined,
        dateAdded: data.date_added ? new Date(data.date_added) : new Date(),
        personality_tags: data.personality_tags,
        color_scheme: data.color_scheme,
        colors: data.colors
      };
      
      setOutfits(prev => [...prev, formattedOutfit]);
      return formattedOutfit;
    } catch (error) {
      console.error('Error creating outfit:', error);
      toast.error('Failed to create outfit');
      return null;
    }
  };

  // Delete a clothing item from Supabase
  const deleteClothingItem = async (itemId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setClothingItems(prev => prev.filter(item => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      toast.error('Failed to delete item');
      return false;
    }
  };

  // Delete an outfit from Supabase
  const deleteOutfit = async (outfitId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
      return true;
    } catch (error) {
      console.error('Error deleting outfit:', error);
      toast.error('Failed to delete outfit');
      return false;
    }
  };

  // Update clothing item in Supabase
  const updateClothingItem = async (itemId: string, updates: Partial<ClothingItem>) => {
    if (!user) return false;
    
    try {
      // Format updates for database
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.material !== undefined) dbUpdates.material = updates.material;
      if (updates.season !== undefined) dbUpdates.season = updates.season;
      if (updates.occasions !== undefined) dbUpdates.occasions = updates.occasions;
      if (updates.image !== undefined) dbUpdates.image_url = updates.image;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.favorite !== undefined) dbUpdates.favorite = updates.favorite;
      if (updates.timesWorn !== undefined) dbUpdates.times_worn = updates.timesWorn;
      if (updates.lastWorn !== undefined) dbUpdates.last_worn = updates.lastWorn;
      
      const { error } = await supabase
        .from('clothing_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setClothingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating clothing item:', error);
      toast.error('Failed to update item');
      return false;
    }
  };

  // Update outfit in Supabase
  const updateOutfit = async (outfitId: string, updates: Partial<Outfit>) => {
    if (!user) return false;
    
    try {
      // Format updates for database
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.items !== undefined) dbUpdates.items = updates.items;
      if (updates.season !== undefined) dbUpdates.season = updates.season;
      if (updates.seasons !== undefined) dbUpdates.season = updates.seasons;
      if (updates.occasions !== undefined) dbUpdates.occasions = updates.occasions;
      if (updates.occasion !== undefined) dbUpdates.occasion = updates.occasion;
      if (updates.favorite !== undefined) dbUpdates.favorite = updates.favorite;
      if (updates.timesWorn !== undefined) dbUpdates.times_worn = updates.timesWorn;
      if (updates.lastWorn !== undefined) dbUpdates.last_worn = updates.lastWorn;
      if (updates.personality_tags !== undefined) dbUpdates.personality_tags = updates.personality_tags;
      if (updates.color_scheme !== undefined) dbUpdates.color_scheme = updates.color_scheme;
      if (updates.colors !== undefined) dbUpdates.colors = updates.colors;
      
      const { error } = await supabase
        .from('outfits')
        .update(dbUpdates)
        .eq('id', outfitId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? { ...outfit, ...updates } : outfit
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating outfit:', error);
      toast.error('Failed to update outfit');
      return false;
    }
  };

  // Load data when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Loading wardrobe data for user:', user.id);
      loadClothingItems();
      loadOutfits();
    } else {
      // Clear data when logged out or user not ready
      setClothingItems([]);
      setOutfits([]);
    }
  }, [isAuthenticated, user?.id]);

  return {
    clothingItems,
    outfits,
    isLoadingItems,
    isLoadingOutfits,
    addClothingItem,
    addOutfit,
    deleteClothingItem,
    deleteOutfit,
    updateClothingItem,
    updateOutfit,
    refreshItems: loadClothingItems,
    refreshOutfits: loadOutfits
  };
};
