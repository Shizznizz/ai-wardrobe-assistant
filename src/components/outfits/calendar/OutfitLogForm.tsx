
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Outfit, TimeOfDay } from '@/lib/types';
import { OutfitLog } from '../OutfitLogItem';
import { CalendarIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutfitLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  outfits: Outfit[];
  selectedDate: Date;
  onSubmit: (data: Omit<OutfitLog, 'id'>) => void;
  editMode?: boolean;
  initialData?: OutfitLog | null;
}

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'all-day', label: 'All Day' }
];

const OutfitLogForm = ({ 
  isOpen, 
  onClose, 
  outfits, 
  selectedDate, 
  onSubmit,
  editMode = false,
  initialData = null
}: OutfitLogFormProps) => {
  const [date, setDate] = useState<Date>(selectedDate);
  const [outfitId, setOutfitId] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<string>('morning');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [supabaseOutfits, setSupabaseOutfits] = useState<Outfit[]>([]);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState<boolean>(false);
  const { user } = useAuth();

  // Load outfits from Supabase
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
        items: outfit.items,
        occasions: outfit.occasions,
        occasion: outfit.occasion,
        season: outfit.season,
        seasons: outfit.season,
        favorite: outfit.favorite,
        timesWorn: outfit.times_worn,
        lastWorn: outfit.last_worn ? new Date(outfit.last_worn) : undefined,
        dateAdded: outfit.date_added ? new Date(outfit.date_added) : new Date(),
        personality_tags: outfit.personality_tags,
        color_scheme: outfit.color_scheme,
        colors: outfit.colors
      }));
      
      setSupabaseOutfits(formattedOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
      toast.error('Failed to load your outfits');
    } finally {
      setIsLoadingOutfits(false);
    }
  };

  // Load outfits when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadOutfitsFromSupabase();
    }
  }, [isOpen, user]);

  // Populate form with initialData when in edit mode
  useEffect(() => {
    if (initialData && editMode) {
      setDate(new Date(initialData.date));
      setOutfitId(initialData.outfitId || '');
      setTimeOfDay(initialData.timeOfDay || 'morning');
      setNotes(initialData.notes || '');
    } else {
      // Reset form when not in edit mode
      setDate(selectedDate);
      setOutfitId('');
      setTimeOfDay('morning');
      setNotes('');
    }
  }, [initialData, editMode, isOpen, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitId) {
      toast.error('Please select an outfit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const logData: Omit<OutfitLog, 'id'> = {
        outfitId,
        date,
        timeOfDay: timeOfDay as TimeOfDay,
        notes: notes || undefined,
        user_id: user?.id || '',
      };
      
      await onSubmit(logData);
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setOutfitId('');
    setTimeOfDay('morning');
    setNotes('');
  };

  // Use Supabase outfits if available, otherwise fall back to props
  const availableOutfits = supabaseOutfits.length > 0 ? supabaseOutfits : outfits;

  const formatOutfitDisplayName = (outfit: Outfit) => {
    const timesWornText = outfit.timesWorn ? ` (worn ${outfit.timesWorn}x)` : '';
    return `${outfit.name}${timesWornText}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-purple-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {editMode ? 'Edit Outfit Log' : 'Log an Outfit'}
          </DialogTitle>
          
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outfit">Select Outfit</Label>
            <Select 
              value={outfitId} 
              onValueChange={setOutfitId}
              disabled={isLoadingOutfits}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                <SelectValue placeholder={isLoadingOutfits ? "Loading outfits..." : "Select an outfit"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {availableOutfits.length > 0 ? (
                  availableOutfits.map((outfit) => (
                    <SelectItem key={outfit.id} value={outfit.id}>
                      {formatOutfitDisplayName(outfit)}
                    </SelectItem>
                  ))
                ) : !isLoadingOutfits ? (
                  <div className="px-2 py-1.5 text-sm text-slate-400">
                    No outfits available
                  </div>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 text-white justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  className="bg-slate-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeOfDay">Time of Day</Label>
            <Select 
              value={timeOfDay} 
              onValueChange={setTimeOfDay}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select time of day" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {timeOfDayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this outfit..."
              className="min-h-[80px] bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!outfitId || isSubmitting || availableOutfits.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? 'Saving...' : editMode ? 'Update Outfit' : 'Save Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OutfitLogForm;
