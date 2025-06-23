
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Outfit, ClothingItem } from '@/lib/types';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define the OutfitContextType to include all required properties
export interface OutfitContextType {
  selectedOutfitId: string | null;
  setSelectedOutfitId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedOutfit: Outfit | null;
  setSelectedOutfit: React.Dispatch<React.SetStateAction<Outfit | null>>;
  isCreatingNewOutfit: boolean;
  setIsCreatingNewOutfit: React.Dispatch<React.SetStateAction<boolean>>;
  isBuilderOpen: boolean;
  setIsBuilderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  outfits: Outfit[];
  setOutfits: React.Dispatch<React.SetStateAction<Outfit[]>>;
  clothingItems: ClothingItem[];
  outfitLogs: OutfitLog[];
  addOutfitLog: (log: Omit<OutfitLog, 'id'>) => Promise<void>;
  loading: boolean;
  updateOutfit: (id: string, updates: Partial<Outfit>) => Promise<boolean>;
}

// Create the context with an initial undefined value
const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

// Define the provider props
interface OutfitProviderProps {
  children: ReactNode;
}

// Create the provider component
export const OutfitProvider = ({ children }: OutfitProviderProps) => {
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isCreatingNewOutfit, setIsCreatingNewOutfit] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [outfitLogs, setOutfitLogs] = useState<OutfitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load outfits from Supabase
  useEffect(() => {
    const loadOutfits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('outfits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedOutfits: Outfit[] = data?.map(outfit => ({
          ...outfit,
          dateAdded: new Date(outfit.date_added),
          lastWorn: outfit.last_worn ? new Date(outfit.last_worn) : undefined,
          seasons: outfit.season || [],
          occasions: outfit.occasions || []
        })) || [];

        setOutfits(formattedOutfits);
      } catch (error) {
        console.error('Error loading outfits:', error);
        toast.error('Failed to load outfits');
      }
    };

    loadOutfits();
  }, [user]);

  // Load clothing items from Supabase
  useEffect(() => {
    const loadClothingItems = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .eq('user_id', user.id)
          .order('date_added', { ascending: false });

        if (error) throw error;

        const formattedItems: ClothingItem[] = data?.map(item => ({
          ...item,
          dateAdded: new Date(item.date_added),
          lastWorn: item.last_worn ? new Date(item.last_worn) : undefined,
          seasons: item.season || [],
          occasions: item.occasions || []
        })) || [];

        setClothingItems(formattedItems);
      } catch (error) {
        console.error('Error loading clothing items:', error);
        toast.error('Failed to load clothing items');
      }
    };

    loadClothingItems();
  }, [user]);

  // Load outfit logs from Supabase
  useEffect(() => {
    const loadOutfitLogs = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('outfit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const formattedLogs: OutfitLog[] = data?.map(log => ({
          ...log,
          date: new Date(log.date)
        })) || [];

        setOutfitLogs(formattedLogs);
      } catch (error) {
        console.error('Error loading outfit logs:', error);
        toast.error('Failed to load outfit logs');
      } finally {
        setLoading(false);
      }
    };

    loadOutfitLogs();
  }, [user]);

  const addOutfitLog = async (log: Omit<OutfitLog, 'id'>) => {
    if (!user) {
      toast.error('Please log in to add outfit logs');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('outfit_logs')
        .insert({
          ...log,
          user_id: user.id,
          date: log.date.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newLog: OutfitLog = {
        ...data,
        date: new Date(data.date)
      };

      setOutfitLogs(prev => [newLog, ...prev]);
      toast.success('Outfit logged successfully');
    } catch (error) {
      console.error('Error adding outfit log:', error);
      toast.error('Failed to log outfit');
    }
  };

  const updateOutfit = async (id: string, updates: Partial<Outfit>): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to update outfits');
      return false;
    }
    
    try {
      // Convert date objects to ISO strings for the database
      const dbUpdates = {
        ...updates,
        date_added: updates.dateAdded ? (updates.dateAdded instanceof Date ? updates.dateAdded.toISOString() : updates.dateAdded) : undefined,
        last_worn: updates.lastWorn ? (updates.lastWorn instanceof Date ? updates.lastWorn.toISOString() : updates.lastWorn) : undefined,
        // Remove properties that aren't in the database schema
        dateAdded: undefined,
        lastWorn: undefined
      };
      
      const { error } = await supabase
        .from('outfits')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setOutfits(prev => prev.map(outfit => 
        outfit.id === id ? { ...outfit, ...updates } : outfit
      ));
      
      toast.success('Outfit updated');
      return true;
    } catch (e) {
      console.error('Error updating outfit:', e);
      toast.error('Failed to update outfit');
      return false;
    }
  };

  // Create the value object to be provided by the context
  const contextValue: OutfitContextType = {
    selectedOutfitId,
    setSelectedOutfitId,
    selectedOutfit,
    setSelectedOutfit,
    isCreatingNewOutfit,
    setIsCreatingNewOutfit,
    isBuilderOpen,
    setIsBuilderOpen,
    outfits,
    setOutfits,
    clothingItems,
    outfitLogs,
    addOutfitLog,
    loading,
    updateOutfit
  };

  return (
    <OutfitContext.Provider value={contextValue}>
      {children}
    </OutfitContext.Provider>
  );
};

// Create a custom hook to use the context
export const useOutfitContext = () => {
  const context = useContext(OutfitContext);
  
  if (context === undefined) {
    throw new Error('useOutfitContext must be used within an OutfitProvider');
  }
  
  return context;
};
