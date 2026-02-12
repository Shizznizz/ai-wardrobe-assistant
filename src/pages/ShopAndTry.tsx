import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Outfit, ClothingItem, MoodClothingItem } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import OutfitSubscriptionPopup from '@/components/OutfitSubscriptionPopup';
import OliviaImageGallery from '@/components/outfits/OliviaImageGallery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWardrobeData } from '@/hooks/useWardrobeData';
import EnhancedHeroSection from '@/components/shared/EnhancedHeroSection';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Import components for our shop and try page
import StyleItYourWay from '@/components/shop-try/StyleItYourWay';
import StyleAlchemy from '@/components/shop-try/StyleAlchemy';
import VirtualTryOn from '@/components/shop-try/VirtualTryOn';
import ShopByMood from '@/components/shop-try/ShopByMood';
import EditorsPicks from '@/components/shop-try/EditorsPicks';
import OliviaDailyDrop from '@/components/shop-try/OliviaDailyDrop';
import ShopTryFooter from '@/components/shop-try/ShopTryFooter';
import FloatingOliviaWidget from '@/components/shop-try/FloatingOliviaWidget';

const ShopAndTry = () => {
  const { isAuthenticated, user } = useAuth();
  const { addClothingItem, addOutfit } = useWardrobeData();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [showOliviaImageGallery, setShowOliviaImageGallery] = useState(false);
  const [isUsingOliviaImage, setIsUsingOliviaImage] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [oliviaMood, setOliviaMood] = useState<'happy' | 'thinking' | 'neutral'>('neutral');
  const [stylingTip, setStylingTip] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ city: string; country: string } | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [earlyTester, setEarlyTester] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [mockOutfit, setMockOutfit] = useState<Outfit | null>(null);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [isSavingWardrobe, setIsSavingWardrobe] = useState(false);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const [isSavingLook, setIsSavingLook] = useState(false);

  // Maps mock item IDs → real clothing_items UUIDs after wardrobe save
  const savedItemIds = useRef<Map<string, string>>(new Map());

  const isMobile = useIsMobile();

  const createMockItem = (overrides: any) => {
    return {
      id: overrides.id,
      name: overrides.name,
      type: overrides.type,
      color: overrides.color,
      dateAdded: new Date(),
      timesWorn: 0,
      favorite: false,
      season: overrides.season || ['all'],
      image: overrides.image,
      ...overrides
    };
  };

  useEffect(() => {
    setIsPremiumUser(isAuthenticated);
    
    const detectUserCountry = async () => {
      try {
        setUserCountry('United States');
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };
    
    detectUserCountry();
  }, [isAuthenticated]);

  const handleScrollToTryOn = () => {
    document.getElementById('virtual-try-on')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleShowStylingOptions = () => {
    toast.info("Opening styling options...");
  };
  
  const handleUserPhotoUpload = (file: File) => {
    const photoUrl = URL.createObjectURL(file);
    setUserPhoto(photoUrl);
    setFinalImage(null);
    toast.success("Photo uploaded successfully!");
  };

  const handleClothingPhotoUpload = (file: File) => {
    const photoUrl = URL.createObjectURL(file);
    setClothingPhoto(photoUrl);
    setFinalImage(null);
    toast.success("Clothing item uploaded!");
  };

  const clearPhotos = () => {
    setUserPhoto(null);
    setClothingPhoto(null);
    setFinalImage(null);
    setSelectedItems([]);
    setStylingTip(null);
    toast.success('Photos cleared');
  };

  const handleTryOn = () => {
    if (!userPhoto) {
      toast.error("Please upload a photo first");
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setFinalImage(userPhoto);
      setIsProcessing(false);
      setOliviaMood('happy');
      setStylingTip("This style looks great on you!");
      toast.success("Try-on complete!");
    }, 1500);
  };

  const handleSaveLook = async () => {
    if (!finalImage) {
      toast.error("Create a look first!");
      return;
    }
    if (!user) {
      toast.error("Please sign in to save looks");
      return;
    }
    if (isSavingLook) return;
    setIsSavingLook(true);
    try {
      // Only include items that have been persisted to wardrobe (real DB UUIDs)
      const realIds = selectedItems
        .map(i => savedItemIds.current.get(i.id) || null)
        .filter((id): id is string => id !== null);

      if (selectedItems.length > 0 && realIds.length === 0) {
        toast.error("Save items to your wardrobe first before saving the look");
        return;
      }

      const result = await addOutfit({
        name: `Shop & Try Look – ${new Date().toLocaleDateString()}`,
        items: realIds,
        occasion: 'casual',
        seasons: ['all'],
        favorite: false,
        timesWorn: 0
      });
      if (result) {
        toast.success("Look saved to your collection!");
      }
    } catch (err) {
      console.error('Error saving look:', err);
      toast.error("Failed to save look");
    } finally {
      setIsSavingLook(false);
    }
  };

  const handleAddItem = (item: ClothingItem) => {
    setSelectedItems(prev => [...prev, item]);
    toast.success(`${item.name} added to your selection!`);
  };

  const handleShowPremiumPopup = () => {
    setShowSubscriptionPopup(true);
  };

  const handleAddToEarlyTesters = () => {
    setEarlyTester(true);
    toast.success("You've been added to our early testers group!");
  };

  const handleTryOnTrendingItem = (item: ClothingItem) => {
    if (item) {
      setClothingPhoto(`/path/to/${item.imageUrl || ''}`);
      toast.info(`Selected ${item.name} for try-on!`);
    } else {
      toast.info("Selected item for try-on!");
    }
  };

  const handleSetActiveMood = (mood: string) => {
    setActiveMood(mood);
    toast.info(`Showing styles for ${mood} mood`);
  };

  const handleStylistSuggestion = (item: ClothingItem) => {
    if (item && item.id) {
      const matchedItem = selectedItems.find(i => i.id === item.id);
      if (matchedItem) {
        toast.info(`Olivia suggests pairing with ${matchedItem.name}`);
      } else {
        toast.info("Olivia has a styling suggestion for you");
      }
    } else {
      toast.info("Olivia has a styling suggestion for you");
    }
  };

  // Core wishlist persistence. `showToast` allows callers that already show
  // their own toast (e.g. ShopByMood) to suppress ours.
  const persistWishlistItem = async (item: ClothingItem, showToast = true) => {
    if (!item) return;
    if (!user) {
      toast.error("Please sign in to save to wishlist");
      return;
    }
    if (isSavingWishlist) return;
    setIsSavingWishlist(true);
    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        item_name: item.name || '',
        // Use the product/affiliate URL when available, otherwise null
        external_url: item.affiliateUrl || null,
        external_image_url: item.imageUrl || item.image || null
      });
      if (error) {
        if (error.code === '23505') {
          toast.info("Already in your wishlist");
        } else {
          throw error;
        }
      } else if (showToast) {
        toast.success(`${item.name} added to wishlist!`);
      }
    } catch (err) {
      console.error('Error saving to wishlist:', err);
      toast.error("Failed to save to wishlist");
    } finally {
      setIsSavingWishlist(false);
    }
  };

  const handleSaveToWishlist = (item: ClothingItem) => {
    persistWishlistItem(item, true);
  };

  const handleSaveToWardrobe = async (item: ClothingItem) => {
    if (!user) {
      toast.error("Please sign in to save to wardrobe");
      return;
    }
    if (isSavingWardrobe) return;
    setIsSavingWardrobe(true);
    try {
      const result = await addClothingItem({
        name: item.name,
        type: item.type || 'clothing',
        color: item.color || 'unknown',
        season: item.season || ['all'],
        occasions: item.occasions || ['casual'],
        image: item.imageUrl || item.image,
        imageUrl: item.imageUrl || item.image,
        favorite: false,
        timesWorn: 0
      });
      if (result) {
        // Track mock ID → real DB ID so Save Look can reference it
        savedItemIds.current.set(item.id, result.id);
        toast.success(`${item.name} added to wardrobe!`);
      }
    } catch (err) {
      console.error('Error saving to wardrobe:', err);
      toast.error("Failed to save to wardrobe");
    } finally {
      setIsSavingWardrobe(false);
    }
  };

  const trackDailyDropClick = (itemId: string) => {
    console.log(`Clicked on daily drop item ${itemId}`);
  };

  const handleSeeHowToWear = (item: ClothingItem) => {
    if (item && item.id) {
      trackDailyDropClick(item.id);
      if (isPremiumUser || isAuthenticated) {
        toast.success("Let me show you how to style this...");
        setTimeout(() => {
          toast.info("This pairs perfectly with items in your wardrobe!");
        }, 1000);
      } else {
        setShowSubscriptionPopup(true);
      }
    }
  };
  
  const handleSaveToWardrobeAdapter = (itemId: string) => {
    const mockItem: ClothingItem = createMockItem({
      id: itemId,
      name: "Item " + itemId,
      type: "top",
      color: "black",
      season: ["all"],
      image: ""
    });
    handleSaveToWardrobe(mockItem);
  };
  
  const handleSeeHowToWearAdapter = (itemId: string) => {
    const mockItem: ClothingItem = createMockItem({
      id: itemId,
      name: "Item " + itemId,
      type: "top",
      color: "black",
      season: ["all"],
      image: ""
    });
    handleSeeHowToWear(mockItem);
  };
  
  const handleOpenChat = () => {
    setShowFloatingChat(true);
    toast.info("Olivia is ready to chat about your style!");
  };

  const handleTryOnTrendingItemAdapter = (itemId: string) => {
    const mockItem: ClothingItem = createMockItem({
      id: itemId,
      name: "Item " + itemId,
      type: "top",
      color: "black"
    });
    handleTryOnTrendingItem(mockItem);
  };

  const handleStylistSuggestionAdapter = (itemId: string) => {
    const mockItem: ClothingItem = createMockItem({
      id: itemId,
      name: "Item " + itemId,
      type: "top",
      color: "black"
    });
    handleStylistSuggestion(mockItem);
  };

  const handleSaveToWishlistAdapter = (item: ClothingItem) => {
    if (item && item.id) {
      handleSaveToWishlist(item);
    } else {
      toast.error("Invalid item");
    }
  };
  
  const handleTryOnItemAdapter = (item: ClothingItem) => {
    if (item && item.id) {
      handleTryOnTrendingItemAdapter(item.id);
    } else {
      toast.error("Invalid item for try-on");
    }
  };
  
  const handleSeeHowToWearFromItemAdapter = (item: ClothingItem) => {
    if (item && item.id) {
      handleSeeHowToWearAdapter(item.id);
    } else {
      toast.error("Invalid item");
    }
  };
  
  const handleSaveToWardrobeItemAdapter = (item: ClothingItem) => {
    if (item && item.id) {
      handleSaveToWardrobe(item);
    } else {
      toast.error("Invalid item");
    }
  };
  
  const handleSeeHowToWearAdapter2 = (itemId: string) => {
    const mockItem: ClothingItem = createMockItem({
      id: itemId,
      name: "Item " + itemId,
      type: "top",
      color: "black"
    });
    handleSeeHowToWear(mockItem);
  };
  
  // ShopByMood passes full MoodClothingItem via onAddToWishlist.
  // Suppress our toast because ShopByMood shows its own.
  const handleShopByMoodWishlist = (item: MoodClothingItem) => {
    persistWishlistItem(item, false);
  };
  
  const handleTryOnTrendingItemForShopByMood = (item: ClothingItem) => {
    if (item && item.id) {
      handleTryOnTrendingItemAdapter(item.id);
    } else {
      toast.error("Invalid item for try-on");
    }
  };
  
  const handleStylistSuggestionForShopByMood = (item: ClothingItem) => {
    if (item && item.id) {
      handleStylistSuggestionAdapter(item.id);
    } else {
      toast.error("Invalid item for styling suggestion");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white overflow-x-hidden">
      
      <EnhancedHeroSection
        title="Shop & Try Fashion"
        subtitle="Preview new trends, mix with your wardrobe, and get smart fashion recommendations."
        image={{
          src: "/lovable-uploads/f4be744c-31b5-4099-93e8-67f51af83dae.png",
          alt: "Olivia in pink crop top and skirt outfit",
          variant: "standing"
        }}
        buttons={[
          {
            label: "Explore Styles with Olivia",
            onClick: handleScrollToTryOn,
            variant: "primary",
            icon: <ArrowRight className="h-5 w-5" />
          }
        ]}
      />
      
      <main className="pt-6 pb-20">
        <StyleItYourWay 
          onTryBeforeBuy={handleScrollToTryOn}
          onAIStyling={() => document.getElementById('shop-by-mood')?.scrollIntoView({ behavior: 'smooth' })}
          onYourStyle={() => !userPhoto ? setShowOliviaImageGallery(true) : handleScrollToTryOn()}
        />
        
        <StyleAlchemy 
          userPhoto={userPhoto}
          isUsingOliviaImage={isUsingOliviaImage}
          customLocation={customLocation}
          onShowStyleOptions={handleShowStylingOptions}
          isPremiumUser={isPremiumUser || isAuthenticated}
          onCombineWithWardrobe={() => {
            if (!isPremiumUser && !isAuthenticated) {
              setShowSubscriptionPopup(true);
            } else {
              toast.info("Opening wardrobe selector...");
            }
          }}
        />
        
        <VirtualTryOn 
          id="virtual-try-on"
          userPhoto={userPhoto}
          clothingPhoto={clothingPhoto}
          isProcessing={isProcessing}
          isUsingOliviaImage={isUsingOliviaImage}
          finalImage={finalImage}
          mockOutfit={mockOutfit}
          selectedItems={selectedItems}
          generationError={generationError}
          isPremiumUser={isPremiumUser || isAuthenticated}
          oliviaMood={oliviaMood}
          stylingTip={stylingTip}
          onUserPhotoUpload={handleUserPhotoUpload}
          onClothingPhotoUpload={handleClothingPhotoUpload}
          onClearUserPhoto={() => {
            setUserPhoto(null);
            setIsUsingOliviaImage(false);
          }}
          onClearPhotos={clearPhotos}
          onTryOn={handleTryOn}
          onShowOliviaImageGallery={() => setShowOliviaImageGallery(true)}
          onSaveLook={handleSaveLook}
          onAddItem={handleAddItem}
          onShowPremiumPopup={handleShowPremiumPopup}
          onAddToEarlyTesters={handleAddToEarlyTesters}
          earlyTester={earlyTester}
          setShowFeedback={setShowFeedback}
          showFeedback={showFeedback}
        />
        
        <ShopByMood
          onTryItem={handleTryOnTrendingItemForShopByMood}
          onStylistSuggestion={handleStylistSuggestionForShopByMood}
          onUpgradeToPremium={handleShowPremiumPopup}
          activeMood={activeMood}
          onMoodSelect={handleSetActiveMood}
          onAddToWishlist={handleShopByMoodWishlist}
        />
        
        <EditorsPicks
          isPremiumUser={isPremiumUser || isAuthenticated}
          onTryItem={handleTryOnItemAdapter}
          onUpgradeToPremium={handleShowPremiumPopup}
          userCountry={userCountry}
          onSaveToWardrobe={handleSaveToWardrobeItemAdapter}
        />
        
        <OliviaDailyDrop
          isPremiumUser={isPremiumUser || isAuthenticated}
          onSeeHowToWear={handleSeeHowToWearAdapter2}
        />
        
        <ShopTryFooter 
          userCountry={userCountry || 'United States'} 
          onCountryChange={(country) => {
            setUserCountry(country);
            toast.success(`Now showing products available in ${country}`);
          }}
        />
        
        <FloatingOliviaWidget
          isPremiumUser={isPremiumUser || isAuthenticated}
          onUpgradeToPremium={handleShowPremiumPopup}
          onOpenChat={handleOpenChat}
        />
      </main>
      
      <OliviaImageGallery 
        isOpen={showOliviaImageGallery} 
        onClose={() => setShowOliviaImageGallery(false)}
        onSelectImage={(imageSrc) => {
          setUserPhoto(imageSrc);
          setFinalImage(null);
          setIsUsingOliviaImage(true);
          setShowFeedback(false);
          
          setCustomLocation({
            city: "New York",
            country: "USA"
          });
        }}
      />
      
      <OutfitSubscriptionPopup 
        isOpen={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        onUpgrade={() => {
          toast.success('Redirecting to premium subscription');
          setShowSubscriptionPopup(false);
        }}
      />
    </div>
  );
};

export default ShopAndTry;
