import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Camera, 
  ChevronDown,
  GalleryVertical,
  Lock,
  Unlock,
  Star,
  Upload as UploadIcon,
  ShoppingBag,
  Heart,
  User,
} from 'lucide-react';
import OliviaTips from '@/components/OliviaTips';
import OutfitSelector from '@/components/OutfitSelector';
import VirtualFittingRoom from '@/components/VirtualFittingRoom';
import ImageUploader from '@/components/wardrobe/ImageUploader';
import { sampleClothingItems, sampleOutfits } from '@/lib/wardrobeData';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useOutfitState } from '@/hooks/useOutfitState';
import SubscriptionPopup from '@/components/SubscriptionPopup';
import OliviaImageGallery from '@/components/outfits/OliviaImageGallery';

const fashionCollections = [
  {
    id: 'recommended',
    name: 'Olivia\'s Picks',
    description: 'Personalized recommendations based on your style profile',
    outfits: sampleOutfits.slice(0, 4),
  },
  {
    id: 'wardrobe',
    name: 'Your Outfits',
    description: 'Outfits you\'ve created and saved',
    outfits: sampleOutfits.slice(0, 3),
  },
  {
    id: 'business',
    name: 'Business Casual',
    description: 'Professional looks that maintain comfort and style',
    outfits: sampleOutfits.slice(2, 6),
    premium: true,
  },
  {
    id: 'summer',
    name: 'Summer Breeze',
    description: 'Light and airy ensembles for warm weather',
    outfits: sampleOutfits.slice(1, 5),
    premium: true,
  },
  {
    id: 'winter',
    name: 'Winter Formal',
    description: 'Elegant outfits for colder months and special occasions',
    outfits: sampleOutfits.slice(3, 7),
    premium: true,
  },
];

const Showroom = () => {
  const [isPremiumUser] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [activeTab, setActiveTab] = useState<'olivia-pick' | 'your-outfits'>('olivia-pick');
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [showOliviaImageGallery, setShowOliviaImageGallery] = useState(false);
  const [isUsingOliviaImage, setIsUsingOliviaImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const {
    outfits,
    clothingItems, 
    selectedOutfit,
    userPhoto,
    finalImage,
    isProcessingTryOn,
    handleUserPhotoChange,
    handleClearUserPhoto,
    handleTryOnOutfit,
    handleSaveOutfit
  } = useOutfitState(sampleOutfits, sampleClothingItems);

  useEffect(() => {
    if (userPhoto && finalImage && !isPremiumUser) {
      const hasSeenPopup = sessionStorage.getItem('hasSeenSubscriptionPopup');
      if (!hasSeenPopup) {
        const timer = setTimeout(() => {
          setShowSubscriptionPopup(true);
          sessionStorage.setItem('hasSeenSubscriptionPopup', 'true');
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [userPhoto, finalImage, isPremiumUser]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          handleUserPhotoChange(e.target.result as string);
          setIsUsingOliviaImage(false);
          toast.success('Photo uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectOliviaImage = (imageSrc: string) => {
    handleUserPhotoChange(imageSrc);
    setIsUsingOliviaImage(true);
    toast.success('Selected Olivia\'s image successfully!');
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    toast('Camera functionality would open here', {
      description: 'This feature would access your device camera in a real implementation.'
    });
  };

  const handleSelectOutfit = (outfit: any) => {
    handleTryOnOutfit(outfit);
  };

  const handleSaveLook = () => {
    if (!finalImage) {
      toast.error('Create a look first!');
      return;
    }
    
    toast.success('Look saved to your wardrobe!');
  };

  const handleTabChange = (value: 'olivia-pick' | 'your-outfits') => {
    setActiveTab(value);
    const collection = value === 'olivia-pick' 
      ? fashionCollections.find(c => c.id === 'recommended') 
      : fashionCollections.find(c => c.id === 'wardrobe');
      
    if (collection && collection.outfits.length > 0) {
    }
  };

  const handleUpgradeToPremium = () => {
    toast('This would navigate to the premium subscription page', {
      description: 'Unlock unlimited outfit swaps, priority styling, and more!'
    });
  };

  const handleCloseSubscriptionPopup = () => {
    setShowSubscriptionPopup(false);
  };

  const oliviasRecommendedOutfits = fashionCollections.find(c => c.id === 'recommended')?.outfits || [];
  const yourOutfits = fashionCollections.find(c => c.id === 'wardrobe')?.outfits || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-32 max-w-full">
        <div className="w-full mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Virtual Try-On Studio
            </h1>
            <p className="text-base md:text-lg text-white/80 mx-auto">
              Upload your photo and discover how outfits look on you with our virtual try-on experience.
            </p>
          </motion.div>
          
          {/* 1. Your Photo Section - Now First */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="glass-dark border-white/10 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Photo</h2>
                
                {!userPhoto ? (
                  <div className="flex flex-col items-center justify-center py-8 flex-grow bg-black/20 rounded-lg border border-white/10">
                    <div className="mb-6 bg-slate-800/50 p-6 rounded-full">
                      <Camera className="h-12 w-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Upload Your Photo</h3>
                    <p className="text-white/70 mb-6 text-center max-w-sm px-2">
                      See how outfits look on you with our virtual try-on feature
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs px-4">
                      <Button 
                        onClick={triggerFileUpload}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90"
                      >
                        <Upload className="mr-2 h-5 w-5" /> Choose Photo
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full border-purple-400/30 text-white hover:bg-white/10"
                        onClick={handleTakePhoto}
                      >
                        <Camera className="mr-2 h-5 w-5" /> Take a Photo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowOliviaImageGallery(true)}
                        className="w-full text-sm border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-100 hover:border-purple-500/50 transition-colors"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Choose an Image of Olivia Bloom
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="relative flex-grow bg-black/20 rounded-lg border border-white/10 overflow-hidden">
                      <img 
                        src={userPhoto} 
                        alt="Your uploaded photo" 
                        className="w-full h-full object-contain"
                      />
                      {isUsingOliviaImage && (
                        <div className="absolute top-2 left-2 bg-purple-600/80 rounded-full py-0.5 px-2 text-xs text-white flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Olivia's Image
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center mt-4 gap-3">
                      <Button 
                        variant="outline"
                        onClick={triggerFileUpload}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Change Photo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* 2. Choose an Outfit Section - Now Second */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="glass-dark border-white/10 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Choose an Outfit</h2>
                
                <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as any)}>
                  <TabsList className="grid grid-cols-2 w-full max-w-md mb-6 bg-slate-800/50">
                    <TabsTrigger 
                      value="olivia-pick" 
                      className="data-[state=active]:bg-gradient-to-r from-purple-600 to-pink-500"
                    >
                      Olivia's Picks
                    </TabsTrigger>
                    <TabsTrigger 
                      value="your-outfits" 
                      className="data-[state=active]:bg-gradient-to-r from-purple-600 to-pink-500"
                    >
                      Your Outfits
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="olivia-pick" className="mt-0 space-y-4">
                    <p className="text-white/80">
                      Olivia has selected these outfits based on your style preferences and the current weather.
                    </p>
                    
                    <OutfitSelector
                      outfits={oliviasRecommendedOutfits}
                      clothingItems={clothingItems}
                      onSelect={handleSelectOutfit}
                      selectedOutfitId={selectedOutfit?.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="your-outfits" className="mt-0 space-y-4">
                    <p className="text-white/80">
                      Try on outfits you've created in your personal wardrobe.
                    </p>
                    
                    {yourOutfits.length > 0 ? (
                      <OutfitSelector
                        outfits={yourOutfits}
                        clothingItems={clothingItems}
                        onSelect={handleSelectOutfit}
                        selectedOutfitId={selectedOutfit?.id}
                      />
                    ) : (
                      <div className="text-center py-10 bg-slate-800/30 rounded-lg border border-white/10">
                        <p className="text-white/70 mb-4">You haven't created any outfits yet</p>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90">
                          Create Your First Outfit
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Premium Collections
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fashionCollections.filter(c => c.premium).map((collection) => (
                      <div 
                        key={collection.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80"></div>
                        <div className="relative z-10">
                          <h4 className="font-medium mb-1">{collection.name}</h4>
                          <p className="text-sm text-white/70 mb-3">{collection.description}</p>
                          
                          {!isPremiumUser && (
                            <div className="absolute bottom-3 right-3">
                              <Lock className="h-5 w-5 text-yellow-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* 3. Outfit Preview Section - Now Third */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="glass-dark border-white/10 overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Outfit Preview</h2>
                
                <VirtualFittingRoom 
                  finalImage={finalImage}
                  outfit={selectedOutfit}
                  clothingItems={clothingItems}
                  isProcessing={isProcessingTryOn}
                  userPhoto={userPhoto}
                  onSaveLook={handleSaveLook}
                  isOliviaImage={isUsingOliviaImage}
                  className="flex-grow"
                />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Premium Features Section - Kept at the bottom */}
          {!isPremiumUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-dark border-white/10 overflow-hidden bg-gradient-to-r from-slate-900/90 to-purple-950/90">
                <CardContent className="p-4 md:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold">Unlock Premium Features</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <div className="glass-dark rounded-lg p-3 md:p-5 border border-white/5">
                      <UploadIcon className="h-5 w-5 mb-3 text-purple-400" />
                      <h3 className="text-lg font-medium mb-2">Multiple Photos</h3>
                      <p className="text-white/70 text-sm">
                        Upload multiple photos and try on different outfits for various occasions.
                      </p>
                    </div>
                    <div className="glass-dark rounded-lg p-3 md:p-5 border border-white/5">
                      <ShoppingBag className="h-5 w-5 mb-3 text-purple-400" />
                      <h3 className="text-lg font-medium mb-2">Exclusive Collections</h3>
                      <p className="text-white/70 text-sm">
                        Access to premium outfit collections created by expert stylists.
                      </p>
                    </div>
                    <div className="glass-dark rounded-lg p-3 md:p-5 border border-white/5">
                      <Heart className="h-5 w-5 mb-3 text-purple-400" />
                      <h3 className="text-lg font-medium mb-2">Advanced Styling</h3>
                      <p className="text-white/70 text-sm">
                        Resize, reposition, and customize outfits for a perfect virtual try-on.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      size="lg"
                      onClick={handleUpgradeToPremium}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-90 shadow-lg"
                    >
                      <Unlock className="mr-2 h-5 w-5" /> Upgrade to Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      
      <OliviaImageGallery 
        isOpen={showOliviaImageGallery}
        onClose={() => setShowOliviaImageGallery(false)}
        onSelectImage={handleSelectOliviaImage}
      />
      
      <SubscriptionPopup 
        isOpen={showSubscriptionPopup}
        onClose={handleCloseSubscriptionPopup}
        onUpgrade={handleUpgradeToPremium}
      />
      
      {showTips && (
        <OliviaTips position="bottom-right" />
      )}
    </div>
  );
};

export default Showroom;
