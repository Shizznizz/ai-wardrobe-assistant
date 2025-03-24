
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import WardrobeGrid from '@/components/WardrobeGrid';
import OliviaBloomAdvisor from '@/components/OliviaBloomAdvisor';
import OliviaBloomAssistant from '@/components/OliviaBloomAssistant';
import UploadModal from '@/components/UploadModal';
import { ClothingItem } from '@/lib/types';
import { sampleClothingItems, sampleOutfits, sampleUserPreferences } from '@/lib/wardrobeData';
import { toast } from 'sonner';
import { Confetti } from '@/components/ui/confetti';
import { ArrowUpDown, Info, Shirt, Sparkles } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Wardrobe = () => {
  const [items, setItems] = useState<ClothingItem[]>(sampleClothingItems);
  const [showUploadTip, setShowUploadTip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasAddedItem, setHasAddedItem] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'favorites' | 'most-worn' | 'color' | 'most-matched' | 'weather-fit' | 'not-recent'>('newest');
  const [showCompactView, setShowCompactView] = useState(false);
  const { user } = useAuth();

  const handleUpload = (newItem: ClothingItem) => {
    setItems(prev => [newItem, ...prev]);
    toast.success('New item added to your wardrobe!');
    setShowUploadTip(true);
    
    if (!hasAddedItem) {
      setShowConfetti(true);
      setHasAddedItem(true);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, favorite: !item.favorite } 
          : item
      )
    );
    
    const item = items.find(item => item.id === id);
    if (item) {
      const action = !item.favorite ? 'added to' : 'removed from';
      toast.success(`${item.name} ${action} favorites`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  useEffect(() => {
    if (window.location.hash === '#upload') {
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
        const uploadButton = document.getElementById('upload-button');
        if (uploadButton) {
          uploadButton.click();
        }
      }
    }
  }, []);

  const getOliviaTip = () => {
    if (items.length <= 3) {
      return "I see you're just starting to build your wardrobe! Try adding a few essential pieces like a versatile top, a pair of jeans, and shoes to start creating outfits.";
    } else if (items.filter(item => item.favorite).length === 0) {
      return "Don't forget to mark your favorite pieces! This helps me understand your style preferences when suggesting outfits.";
    } else {
      return "Great addition to your wardrobe! I've updated your style profile. Why not try matching this with other pieces to create a new outfit?";
    }
  };

  // Sort items based on selected option
  const sortedItems = [...items].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case 'favorites':
        return Number(b.favorite) - Number(a.favorite);
      case 'most-worn':
        return b.timesWorn - a.timesWorn;
      case 'color':
        return a.color.localeCompare(b.color);
      case 'most-matched':
        // Placeholder for most-matched logic
        return b.timesWorn - a.timesWorn; // Using timesWorn as a placeholder
      case 'weather-fit':
        // Placeholder for weather-fit logic
        // Prioritize seasonal items that match current weather
        const currentSeason: 'winter' | 'spring' | 'summer' | 'autumn' = 'spring'; // This would be dynamically determined
        return b.seasons.includes(currentSeason) ? -1 : 1;
      case 'not-recent':
        // Placeholder for not-recently-worn logic
        return a.timesWorn - b.timesWorn; // Reverse of most-worn
      default:
        return 0;
    }
  });

  // Get personalized greeting if user is logged in
  const getPersonalizedGreeting = () => {
    if (user?.user_metadata?.name) {
      return `Hi ${user.user_metadata.name}, here's your wardrobe`;
    }
    return "My Wardrobe";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
      <Header />
      
      {showConfetti && (
        <Confetti 
          duration={2000}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <motion.div 
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div id="upload-section" variants={itemVariants} className="flex flex-col">
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  {getPersonalizedGreeting()}
                </h1>
                <p className="mt-2 text-gray-300 text-sm md:text-base font-light">
                  Your digital closet, always in style
                </p>
              </div>
              <div id="upload-button">
                <UploadModal onUpload={handleUpload} />
              </div>
            </div>
            
            {/* Sorting Controls */}
            <div className="flex justify-between items-center mt-4 mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Sort by:</span>
                <ToggleGroup type="single" value={sortOption} onValueChange={(value) => value && setSortOption(value as any)}>
                  <ToggleGroupItem value="newest" size="sm" className="text-xs h-8">Newest</ToggleGroupItem>
                  <ToggleGroupItem value="favorites" size="sm" className="text-xs h-8">Favorites</ToggleGroupItem>
                  <ToggleGroupItem value="most-worn" size="sm" className="text-xs h-8">Most Worn</ToggleGroupItem>
                  <ToggleGroupItem value="color" size="sm" className="text-xs h-8">By Color</ToggleGroupItem>
                  <ToggleGroupItem value="most-matched" size="sm" className="text-xs h-8">Most Matched</ToggleGroupItem>
                  <ToggleGroupItem value="weather-fit" size="sm" className="text-xs h-8">Weather Fit</ToggleGroupItem>
                  <ToggleGroupItem value="not-recent" size="sm" className="text-xs h-8">Not Recent</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="compact-view" 
                          checked={showCompactView} 
                          onCheckedChange={setShowCompactView} 
                        />
                        <Label htmlFor="compact-view" className="text-sm text-gray-300">
                          Compact View
                        </Label>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Show simplified view with fewer tags and smaller images</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </motion.div>
          
          {items.length <= 2 ? (
            <motion.div variants={itemVariants} className="mb-6">
              <Card className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/20">
                <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-purple-300" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold mb-2">Let's start building your dream wardrobe!</h3>
                    <p className="text-gray-300 mb-4">Upload your favorite pieces to create fabulous outfit combinations.</p>
                    <UploadModal buttonText="Add Your First Item" onUpload={handleUpload} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
          
          <motion.div variants={itemVariants} className="glass-dark p-6 rounded-xl border border-white/10">
            <WardrobeGrid 
              items={sortedItems} 
              onToggleFavorite={handleToggleFavorite} 
              compactView={showCompactView}
            />
          </motion.div>
        </motion.div>
      </main>
      
      {showUploadTip && (
        <OliviaBloomAssistant
          message={getOliviaTip()}
          type="celebration"
          timing="medium"
          actionText="Got it!"
          onAction={() => setShowUploadTip(false)}
          position="bottom-right"
        />
      )}
      
      <OliviaBloomAdvisor 
        items={sampleClothingItems}
        userPreferences={{
          favoriteColors: sampleUserPreferences.favoriteColors,
          favoriteStyles: sampleUserPreferences.favoriteStyles
        }}
        showChatButton={false}
      />
    </div>
  );
};

export default Wardrobe;
