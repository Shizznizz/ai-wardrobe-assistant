
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, subDays, isSameDay } from 'date-fns';
import { Cloud, CloudRain, Sun, Calendar, Check, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Outfit, ClothingItem } from '@/lib/types';
import { OutfitLog } from '@/components/outfits/OutfitLogItem';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { CTAButton } from '@/components/ui/cta-button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import OutfitSelector from '@/components/OutfitSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MissedOpportunitiesProps {
  outfitLogs: OutfitLog[];
  outfits: Outfit[];
  clothingItems?: ClothingItem[];
}

interface MissedOpportunity {
  date: Date;
  weather?: string;
  temperature?: string;
  activity?: string;
  outfitId?: string;
}

const MissedOpportunitiesSection = ({ outfitLogs, outfits, clothingItems = [] }: MissedOpportunitiesProps) => {
  const [missedOpportunities, setMissedOpportunities] = useState<MissedOpportunity[]>([]);
  const [isAssignOutfitOpen, setIsAssignOutfitOpen] = useState(false);
  const [isEmptyWarningOpen, setIsEmptyWarningOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<MissedOpportunity | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Weather conditions for demo
  const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Overcast'];
  const temperatures = ['14°C', '22°C', '18°C', '10°C', '27°C', '5°C'];
  const activities = ['Work', 'Casual Day', 'Dinner', 'Date Night', 'Shopping', 'Workout'];

  // Generate demo missed opportunities - in a real app, this would be based on actual data
  useEffect(() => {
    const today = new Date();
    const missedDates: MissedOpportunity[] = [];
    
    // Look back 30 days
    for (let i = 1; i <= 30; i++) {
      const date = subDays(today, i);
      
      // Check if this date has outfit logs
      const hasLogs = outfitLogs.some(log => 
        log.date && isSameDay(new Date(log.date), date)
      );
      
      // Randomly add some missed opportunities (for demo purposes)
      // In a real app, check against activity data
      if (!hasLogs && Math.random() > 0.8) {
        missedDates.push({
          date,
          weather: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
          temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
          activity: Math.random() > 0.4 ? activities[Math.floor(Math.random() * activities.length)] : undefined
        });
      }
    }
    
    setMissedOpportunities(missedDates.slice(0, 5)); // Limit to 5 items
  }, [outfitLogs]);

  const handleAssignOutfit = (opportunity: MissedOpportunity) => {
    if (!outfits || outfits.length === 0) {
      setIsEmptyWarningOpen(true);
      return;
    }
    
    setSelectedDate(opportunity.date);
    setSelectedOpportunity(opportunity);
    setSelectedOutfitId(opportunity.outfitId || '');
    setIsAssignOutfitOpen(true);
  };

  const handleOutfitSelection = (outfit: Outfit) => {
    setSelectedOutfitId(outfit.id);
  };

  const handleSaveOutfit = () => {
    if (!selectedOutfitId) {
      toast.error("Please select an outfit");
      return;
    }
    
    if (!selectedDate || !selectedOpportunity) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    
    // Update the missed opportunity with the selected outfit
    setMissedOpportunities(prev => 
      prev.map(item => {
        if (isSameDay(item.date, selectedDate)) {
          return { ...item, outfitId: selectedOutfitId };
        }
        return item;
      })
    );
    
    toast.success(`Outfit assigned to ${format(selectedDate, 'MMMM d, yyyy')}`);
    setIsAssignOutfitOpen(false);
  };

  const handleGoToMixAndMatch = () => {
    setIsEmptyWarningOpen(false);
    navigate('/mix-and-match');
  };

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return null;
    
    if (weather.toLowerCase().includes('rain')) {
      return <CloudRain className="h-5 w-5 text-blue-400" />;
    } else if (weather.toLowerCase().includes('cloud')) {
      return <Cloud className="h-5 w-5 text-gray-400" />;
    } else {
      return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getFilteredOutfits = () => {
    if (filterTag === 'all') return outfits;
    
    return outfits.filter(outfit => 
      outfit.occasions && outfit.occasions.some(occasion => 
        occasion.toLowerCase() === filterTag.toLowerCase()
      )
    );
  };

  const getOutfitById = (id: string) => {
    return outfits.find(outfit => outfit.id === id);
  };

  const getOutfitImage = (outfitId: string) => {
    const outfit = getOutfitById(outfitId);
    if (!outfit || !outfit.items || outfit.items.length === 0) return null;
    
    // Get the first item's image
    const firstItemId = outfit.items[0];
    const firstItem = clothingItems.find(item => item.id === firstItemId);
    
    return firstItem?.imageUrl || '/placeholder.svg';
  };

  // If no missed opportunities, show a message
  if (missedOpportunities.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-purple-500/20 shadow-lg backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-4 text-purple-400 opacity-60" />
          <p className="text-purple-200">Great job! You haven't missed any opportunities to log your outfits recently.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missedOpportunities.map((opportunity, index) => (
          <Card 
            key={index}
            className="bg-slate-800/50 border-purple-500/20 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-800/70"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-lg font-medium text-white">
                  {format(opportunity.date, 'EEE, MMM d')}
                </p>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(opportunity.weather)}
                  <span className="text-sm text-white/80">
                    {opportunity.weather}
                    {opportunity.temperature && ` – ${opportunity.temperature}`}
                  </span>
                </div>
              </div>
              
              {opportunity.activity && (
                <div className="mb-3">
                  <span className="text-xs text-purple-300 font-medium uppercase tracking-wide">Activity</span>
                  <p className="text-white/90">{opportunity.activity}</p>
                </div>
              )}
              
              {opportunity.outfitId ? (
                getOutfitById(opportunity.outfitId) ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-purple-500/30">
                        <img
                          src={getOutfitImage(opportunity.outfitId)}
                          alt="Outfit preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white flex items-center gap-1 mb-1">
                          <Check className="h-4 w-4 text-green-400" />
                          <span>Outfit Assigned</span>
                        </p>
                        <p className="text-xs text-purple-300/80">
                          {getOutfitById(opportunity.outfitId)?.name || "Outfit"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-500/20 hover:bg-purple-700/30 hover:border-purple-500/40 text-white"
                      onClick={() => handleAssignOutfit(opportunity)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit Outfit
                    </Button>
                  </div>
                ) : (
                  /* Tombstone: assigned outfit was soft-deleted. */
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Deleted outfit</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-1 bg-purple-800/30 hover:bg-purple-700/40"
                      onClick={() => handleAssignOutfit(opportunity)}
                    >
                      Reassign Outfit
                    </Button>
                  </div>
                )
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="w-full mt-2 bg-purple-800/30 hover:bg-purple-700/40"
                  onClick={() => handleAssignOutfit(opportunity)}
                >
                  Assign Outfit Retroactively
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Outfit Dialog */}
      <Dialog open={isAssignOutfitOpen} onOpenChange={setIsAssignOutfitOpen}>
        <DialogContent className="bg-slate-900 border-purple-500/20 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Assign Outfit for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''} 
              {selectedOpportunity?.activity && ` – ${selectedOpportunity.activity}`}
            </DialogTitle>
            <DialogDescription className="text-white/70 flex items-center gap-2 mt-1">
              {selectedOpportunity?.weather && getWeatherIcon(selectedOpportunity.weather)}
              <span>
                {selectedOpportunity?.weather} 
                {selectedOpportunity?.temperature && ` – ${selectedOpportunity.temperature}`}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setFilterTag}>
              <TabsList className="bg-slate-800/80 border border-white/10">
                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">All</TabsTrigger>
                <TabsTrigger value="casual" className="data-[state=active]:bg-purple-600">Casual</TabsTrigger>
                <TabsTrigger value="work" className="data-[state=active]:bg-purple-600">Work</TabsTrigger>
                <TabsTrigger value="formal" className="data-[state=active]:bg-purple-600">Formal</TabsTrigger>
                <TabsTrigger value="sport" className="data-[state=active]:bg-purple-600">Sport</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="outfits-container">
              <ScrollArea className="h-[350px] rounded-md border border-white/10 p-4">
                <OutfitSelector
                  outfits={getFilteredOutfits()}
                  clothingItems={clothingItems}
                  onSelect={handleOutfitSelection}
                  selectedOutfitId={selectedOutfitId}
                  autoTryOn={false}
                />
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAssignOutfitOpen(false)}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <CTAButton 
              onClick={handleSaveOutfit}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 shadow-lg shadow-pink-500/20"
              icon={<Calendar className="h-4 w-4" />}
              disabled={!selectedOutfitId}
            >
              Save Outfit to {selectedDate ? format(selectedDate, 'MMMM d') : ''}
            </CTAButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* No Outfits Alert */}
      <AlertDialog open={isEmptyWarningOpen} onOpenChange={setIsEmptyWarningOpen}>
        <AlertDialogContent className="bg-slate-900 text-white border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>No Outfits Available</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              You currently have no outfits available. Please create an outfit first before assigning it to this day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleGoToMixAndMatch}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Go to Mix & Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MissedOpportunitiesSection;
