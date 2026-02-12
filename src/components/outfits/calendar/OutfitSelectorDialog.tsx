
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Star, Clock } from 'lucide-react';
import { Outfit } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutfitSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (outfitId: string) => void;
  outfits: Outfit[];
}

const OutfitSelectorDialog = ({ isOpen, onClose, onSubmit, outfits }: OutfitSelectorDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [supabaseOutfits, setSupabaseOutfits] = useState<Outfit[]>([]);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(false);
  const { user } = useAuth();

  // Load outfits from Supabase when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadOutfitsFromSupabase();
    }
  }, [isOpen, user]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedOutfitId('');
    }
  }, [isOpen]);

  const loadOutfitsFromSupabase = async () => {
    if (!user) return;
    
    setIsLoadingOutfits(true);
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading outfits:', error);
        toast.error('Failed to load your outfits');
        return;
      }
      
      // Convert database format to app format
      const formattedOutfits: Outfit[] = data.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        items: outfit.items || [],
        occasions: outfit.occasions || [],
        occasion: outfit.occasion || 'casual',
        season: outfit.season || ['all'],
        seasons: outfit.season || ['all'],
        favorite: outfit.favorite || false,
        timesWorn: outfit.times_worn || 0,
        lastWorn: outfit.last_worn ? new Date(outfit.last_worn) : undefined,
        dateAdded: outfit.date_added ? new Date(outfit.date_added) : new Date(),
        personality_tags: outfit.personality_tags || [],
        color_scheme: outfit.color_scheme,
        colors: outfit.colors || []
      }));
      
      setSupabaseOutfits(formattedOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      toast.error('Failed to load your outfits');
    } finally {
      setIsLoadingOutfits(false);
    }
  };

  // Use Supabase outfits if available, otherwise fall back to props
  const availableOutfits = supabaseOutfits.length > 0 ? supabaseOutfits : outfits;

  const filteredOutfits = availableOutfits.filter(outfit =>
    outfit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outfit.occasions?.some(occasion => occasion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    outfit.personality_tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = () => {
    if (!selectedOutfitId) {
      toast.error('Please select an outfit');
      return;
    }
    
    // Verify the outfit still exists
    const selectedOutfit = availableOutfits.find(o => o.id === selectedOutfitId);
    if (!selectedOutfit) {
      toast.error('Selected outfit no longer exists');
      return;
    }
    
    onSubmit(selectedOutfitId);
    onClose();
  };

  const formatOutfitDisplayInfo = (outfit: Outfit) => {
    const timesWornText = outfit.timesWorn ? ` • worn ${outfit.timesWorn}x` : '';
    const occasionsText = outfit.occasions && outfit.occasions.length > 0 
      ? ` • ${outfit.occasions.slice(0, 2).join(', ')}` 
      : '';
    return `${timesWornText}${occasionsText}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-purple-500/20 text-white max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Select an Outfit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search outfits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Outfit List */}
          <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
            {isLoadingOutfits ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-400">Loading outfits...</div>
              </div>
            ) : filteredOutfits.length > 0 ? (
              <div className="space-y-2 pr-4">
                {filteredOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedOutfitId === outfit.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                    onClick={() => setSelectedOutfitId(outfit.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{outfit.name}</h4>
                          {outfit.favorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatOutfitDisplayInfo(outfit)}
                        </div>
                      </div>
                      {selectedOutfitId === outfit.id && (
                        <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">
                  {searchTerm ? 'No outfits match your search' : 'No outfits available'}
                </p>
                {!searchTerm && availableOutfits.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Create some outfits in Mix & Match first
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedOutfitId || isLoadingOutfits}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Add Outfit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutfitSelectorDialog;
