
import { useState, useEffect } from 'react';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';
import { Outfit, ClothingItem } from '@/lib/types';
import { startOfMonth, endOfMonth, isSameDay, format } from 'date-fns';
import { supabase, getOutfitLogs, saveOutfitLog as saveSBOutfitLog, updateOutfitLog as updateSBOutfitLog, deleteOutfitLog as deleteSBOutfitLog } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useCalendarState(initialOutfits: Outfit[], initialClothingItems: ClothingItem[]) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [outfitLogs, setOutfitLogs] = useState<OutfitLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OutfitLog | null>(null);
  const { user } = useAuth();
  
  // Load outfit logs from Supabase on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadOutfitLogs();
    }
  }, [user]);
  
  const loadOutfitLogs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      console.log('Loading outfit logs for user:', user.id);
      const { success, data, error } = await getOutfitLogs(user.id);
      
      if (success && data) {
        // Ensure all logs have a properly formatted date
        const formattedLogs = data.map((log: any) => ({
          ...log,
          date: new Date(log.date)
        }));
        setOutfitLogs(formattedLogs);
        console.log('Loaded outfit logs from Supabase:', formattedLogs.length);
      } else if (error) {
        console.error('Error loading outfit logs:', error);
        toast.error('Failed to load your outfit logs');
      }
    } catch (error) {
      console.error('Failed to load outfit logs:', error);
      toast.error('Failed to load your outfit logs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate outfit exists and belongs to user
  const validateOutfit = async (outfitId: string): Promise<boolean> => {
    if (!user || outfitId === 'activity') return true;
    
    try {
      // Soft-delete: exclude outfits where deleted_at is set.
      const { data, error } = await supabase
        .from('outfits')
        .select('id')
        .eq('id', outfitId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (error) {
        console.error('Error validating outfit:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Failed to validate outfit:', error);
      return false;
    }
  };
  
  // Add a new outfit log with validation and duplicate prevention
  const addOutfitLog = async (log: Omit<OutfitLog, 'id'>) => {
    try {
      console.log('Adding outfit log:', log);
      
      // Validate outfit exists if it's not an activity
      if (log.outfitId !== 'activity') {
        const isValidOutfit = await validateOutfit(log.outfitId);
        if (!isValidOutfit) {
          toast.error('Selected outfit no longer exists');
          return null;
        }
      }

      // Check for duplicate logs (same outfit, date, and time of day)
      const existingLog = outfitLogs.find(existingLog => 
        isSameDay(new Date(existingLog.date), new Date(log.date)) &&
        existingLog.timeOfDay === log.timeOfDay &&
        existingLog.outfitId === log.outfitId
      );

      if (existingLog) {
        toast.error('This outfit is already logged for this time');
        return null;
      }

      if (!user) {
        toast.error('Please sign in to log outfits');
        return null;
      }

      // Add to Supabase
      console.log('Saving outfit log to Supabase for user:', user.id);
      const { success, data, error } = await saveSBOutfitLog(user.id, log);

      if (!success || error) {
        console.error('Error adding outfit log to Supabase:', error);
        toast.error('Failed to save outfit log');
        return null;
      }

      if (data) {
        // Format the date if necessary
        const formattedData = {
          ...data,
          date: new Date(data.date)
        };

        // Add to state immediately for UI responsiveness
        setOutfitLogs(prev => [...prev, formattedData]);
        console.log('Outfit log saved successfully to Supabase');
        return formattedData;
      }
    } catch (error) {
      console.error('Failed to add outfit log:', error);
      toast.error('Failed to save outfit log');
      return null;
    }
  };
  
  // Update an existing outfit log
  const updateOutfitLog = async (id: string, updates: Partial<OutfitLog>) => {
    try {
      console.log('Updating outfit log:', id, updates);
      
      // Validate outfit if updating outfit ID
      if (updates.outfitId && updates.outfitId !== 'activity') {
        const isValidOutfit = await validateOutfit(updates.outfitId);
        if (!isValidOutfit) {
          toast.error('Selected outfit no longer exists');
          return false;
        }
      }

      if (!user) {
        toast.error('Please sign in to update outfit logs');
        return false;
      }

      // Update in Supabase
      const { success, data, error } = await updateSBOutfitLog(user.id, id, updates);

      if (!success || error) {
        console.error('Error updating outfit log in Supabase:', error);
        toast.error('Failed to update outfit log');
        return false;
      }

      if (data) {
        // Format the date if necessary
        const formattedData = {
          ...data,
          date: new Date(data.date)
        };

        // Update in state
        setOutfitLogs(prev => prev.map(log => log.id === id ? formattedData : log));
        console.log('Outfit log updated successfully in Supabase');
        return true;
      }
    } catch (error) {
      console.error('Failed to update outfit log:', error);
      toast.error('Failed to update outfit log');
      return false;
    }
  };

  // Reassign an outfit in a log with proper validation
  const reassignOutfitLog = async (id: string, newOutfitId: string): Promise<boolean> => {
    try {
      console.log('Reassigning outfit log:', id, 'to outfit:', newOutfitId);
      
      // Validate the new outfit
      if (newOutfitId !== 'activity') {
        const isValidOutfit = await validateOutfit(newOutfitId);
        if (!isValidOutfit) {
          toast.error('Selected outfit no longer exists');
          return false;
        }
      }

      // Find the log to be updated
      const logToUpdate = outfitLogs.find(log => log.id === id);
      if (!logToUpdate) {
        console.error('Log not found for reassignment');
        toast.error('Log not found');
        return false;
      }
      
      // Update with the new outfit ID
      const updates = { outfitId: newOutfitId };
      const success = await updateOutfitLog(id, updates);
      
      if (success) {
        console.log('Outfit reassigned successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to reassign outfit log:', error);
      toast.error('Failed to reassign outfit');
      return false;
    }
  };
  
  // Delete an outfit log
  const deleteOutfitLog = async (id: string) => {
    try {
      console.log('Deleting outfit log:', id);
      
      if (!user) {
        toast.error('Please sign in to delete outfit logs');
        return false;
      }

      // Delete from Supabase
      const { success, error } = await deleteSBOutfitLog(user.id, id);

      if (!success || error) {
        console.error('Error deleting outfit log from Supabase:', error);
        toast.error('Failed to delete outfit log');
        return false;
      }

      console.log('Outfit log deleted successfully from Supabase');

      // Update state immediately for UI responsiveness
      setOutfitLogs(prev => prev.filter(log => log.id !== id));

      return true;
    } catch (error) {
      console.error('Failed to delete outfit log:', error);
      toast.error('Failed to delete outfit log');
      return false;
    }
  };
  
  // Get outfit logs for a specific date
  const getLogsForDay = (day: Date) => {
    return outfitLogs.filter(log => 
      log.date && isSameDay(new Date(log.date), day)
    );
  };
  
  // Handle opening the log dialog
  const handleOpenLogDialog = (date?: Date) => {
    setSelectedDate(date || selectedDate);
    setSelectedLog(null); // Reset selected log when opening dialog for a new entry
    setIsLogDialogOpen(true);
  };
  
  // Handle closing the log dialog
  const handleCloseLogDialog = () => {
    setIsLogDialogOpen(false);
    setSelectedLog(null);
  };
  
  // Handle viewing a log
  const handleViewLog = (log: OutfitLog) => {
    setSelectedLog(log);
  };
  
  // Handle editing a log
  const handleEditLog = (log: OutfitLog) => {
    setSelectedLog(log);
    setIsLogDialogOpen(true);
  };
  
  // Get rarely worn outfits (not worn in the past 30 days)
  const getRarelyWornOutfits = (outfits: Outfit[]) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return outfits.filter(outfit => {
      const logs = outfitLogs.filter(log => log.outfitId === outfit.id);
      
      if (logs.length === 0) return true;
      
      const lastWornLog = logs.reduce((latest, current) => 
        new Date(latest.date) > new Date(current.date) ? latest : current
      );
      
      return new Date(lastWornLog.date) < thirtyDaysAgo;
    });
  };
  
  // Get frequently worn outfits (worn 5+ times)
  const getFrequentlyWornOutfits = (outfits: Outfit[]) => {
    return outfits.filter(outfit => {
      const logs = outfitLogs.filter(log => log.outfitId === outfit.id);
      return logs.length >= 5;
    }).map(outfit => ({
      ...outfit,
      timesWorn: outfitLogs.filter(log => log.outfitId === outfit.id).length
    }));
  };
  
  // Get seasonal outfit suggestions based on location, date, and past logs
  const getSeasonalSuggestions = (outfits: Outfit[], clothingItems: ClothingItem[]) => {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    
    // Determine current season (roughly)
    let currentSeason: 'winter' | 'spring' | 'summer' | 'autumn';
    
    if (month >= 2 && month <= 4) {
      currentSeason = 'spring';
    } else if (month >= 5 && month <= 7) {
      currentSeason = 'summer';
    } else if (month >= 8 && month <= 10) {
      currentSeason = 'autumn';
    } else {
      currentSeason = 'winter';
    }
    
    // Find outfits appropriate for the current season
    const seasonalOutfits = outfits.filter(outfit => 
      outfit.seasons && (outfit.seasons.includes(currentSeason) ||
      outfit.seasons.includes('all'))
    );
    
    // From the seasonal outfits, prioritize those that are rarely worn
    return getRarelyWornOutfits(seasonalOutfits).slice(0, 5);
  };
  
  return {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    isLogDialogOpen,
    outfitLogs,
    isLoading,
    selectedLog,
    handleOpenLogDialog,
    handleCloseLogDialog,
    handleViewLog,
    handleEditLog,
    addOutfitLog,
    updateOutfitLog,
    deleteOutfitLog,
    reassignOutfitLog,
    getLogsForDay,
    getRarelyWornOutfits,
    getFrequentlyWornOutfits,
    getSeasonalSuggestions
  };
}
