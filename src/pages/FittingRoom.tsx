import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedHeroSection from '@/components/shared/EnhancedHeroSection';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PremiumFeaturesSection from '@/components/showroom/PremiumFeaturesSection';
import { useAuth } from '@/hooks/useAuth';
import { useShowroom } from '@/hooks/useShowroom';
import ModelSelectionSection from '@/components/fitting-room/ModelSelectionSection';
import OutfitSelectionSection from '@/components/fitting-room/OutfitSelectionSection';
import ResultPreviewSection from '@/components/fitting-room/ResultPreviewSection';
import OutfitCustomizationSection from '@/components/fitting-room/OutfitCustomizationSection';
import OutfitCarousel from '@/components/fitting-room/OutfitCarousel';
import { toast } from 'sonner';
import { Outfit } from '@/lib/types';
import ActionButton from '@/components/fitting-room/ActionButton';
import BlurredSectionOverlay from '@/components/fitting-room/BlurredSectionOverlay';
import ModelPreview from '@/components/fitting-room/ModelPreview';
import NoPhotoMessage from '@/components/fitting-room/NoPhotoMessage';
import CollapsibleHowItWorksSection from '@/components/fitting-room/CollapsibleHowItWorksSection';
import OliviaStylesSection from '@/components/fitting-room/OliviaStylesSection';
import TrendingLooksSection from '@/components/fitting-room/TrendingLooksSection';
import { trackOutfitUsage } from '@/utils/outfitTracking';

const FittingRoom = () => {
  const { isAuthenticated, isPremiumUser } = useAuth();
  const effectivePremiumUser = isPremiumUser || isAuthenticated;
  
  const {
    userPhoto,
    isUploadLoading,
    isUsingOliviaImage,
    selectedOutfit,
    finalImage,
    clothingItems,
    fashionCollections,
    isProcessingTryOn,
    oliviaSuggestion,
    handleUserPhotoUpload,
    setShowOliviaImageGallery,
    handleSelectOutfit,
    handleSaveLook,
    handleSuggestAnotherOutfit,
    handleUpgradeToPremium,
    setSelectedOutfit,
    clearPhotos
  } = useShowroom();

  const modelSelectionRef = useRef<HTMLDivElement>(null);
  const outfitSelectionRef = useRef<HTMLDivElement>(null);
  const resultPreviewRef = useRef<HTMLDivElement>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [previousUserPhoto, setPreviousUserPhoto] = useState<string | null>(null);
  const [previousSelectedOutfit, setPreviousSelectedOutfit] = useState<Outfit | null>(null);

  // Helper function to get clothing item by ID
  const getClothingItemById = (id: string) => {
    return clothingItems.find(item => item.id === id);
  };

  // Handle replacing an item in the current outfit
  const handleReplaceItem = (oldItemId: string, newItemId: string) => {
    if (!selectedOutfit) return;
    
    // Create a new outfit with the replaced item
    const updatedOutfit = {
      ...selectedOutfit,
      items: selectedOutfit.items.map(itemId => 
        itemId === oldItemId ? newItemId : itemId
      )
    };
    
    // Update the selected outfit
    setSelectedOutfit(updatedOutfit);
    
    // This will trigger a new try-on with the updated outfit
    handleSelectOutfit(updatedOutfit);
  };

  const handleStartOver = () => {
    // Clear photo and outfit selection
    clearPhotos();
    setSelectedOutfit(null);
  };

  const handleTryDifferentOutfit = () => {
    // Keep photo but clear outfit selection
    setSelectedOutfit(null);
    
    // Scroll to outfit selection section
    outfitSelectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToModelSection = () => {
    modelSelectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Automatic scrolling to outfit selection when a photo is uploaded
  useEffect(() => {
    if (userPhoto && !previousUserPhoto && outfitSelectionRef.current) {
      setTimeout(() => {
        outfitSelectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    setPreviousUserPhoto(userPhoto);
  }, [userPhoto, previousUserPhoto]);

  // Automatic scrolling to results when an outfit is selected
  useEffect(() => {
    if (selectedOutfit && !previousSelectedOutfit && resultPreviewRef.current) {
      setTimeout(() => {
        resultPreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    setPreviousSelectedOutfit(selectedOutfit);
  }, [selectedOutfit, previousSelectedOutfit]);

  // Enhanced photo upload handler with automatic scrolling
  const handleEnhancedPhotoUpload = (photo: string) => {
    handleUserPhotoUpload(photo);
  }

  // Enhanced outfit selection handler with automatic scrolling and tracking
  const handleEnhancedOutfitSelection = async (outfit: Outfit) => {
    // Track outfit usage
    if (outfit.id) {
      await trackOutfitUsage(outfit.id, 'tried');
    }
    handleSelectOutfit(outfit);
  }

  const handleTryOutfit = async (outfit: Outfit) => {
    if (!userPhoto) {
      toast.error("Please upload a photo first");
      
      // Scroll to model selection section to prompt the user
      modelSelectionRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
      return;
    }

    // Track outfit usage
    if (outfit.id) {
      await trackOutfitUsage(outfit.id, 'tried');
    }
    
    handleSelectOutfit(outfit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white pb-20">
      <EnhancedHeroSection
        title="Fit Preview Studio"
        subtitle="Prep your photo for styling & try-on—clean background, perfect framing."
        image={{
          src: "/lovable-uploads/0e9ba14f-845b-4c56-a82c-5a616b0a3efb.png",
          alt: "Olivia in pink blouse and white pants",
          variant: "standing"
        }}
        children={
          !userPhoto && (
            <ActionButton 
              text="Start Now – Upload Your Photo" 
              onClick={scrollToModelSection} 
            />
          )
        }
      />
      
      <Container className="space-y-12 px-4">
        {/* Collapsible How It Works Section - always shown but collapsed by default */}
        <CollapsibleHowItWorksSection 
          isOpen={showHowItWorks}
          onToggle={() => setShowHowItWorks(!showHowItWorks)}
        />
        
        {/* Model Selection Section */}
        <div id="model-selection-section" ref={modelSelectionRef}>
          <Card className="glass-dark border-white/10 overflow-hidden shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                Upload your photo for a studio-ready preview.
              </h2>
              
              <ModelSelectionSection 
                userPhoto={userPhoto}
                isUploading={isUploadLoading}
                isUsingOliviaImage={isUsingOliviaImage}
                onUserPhotoChange={handleEnhancedPhotoUpload}
                onShowOliviaImageGallery={() => setShowOliviaImageGallery(true)}
              />
            </div>
          </Card>
        </div>
        
        {/* Divider only shown when photo is selected */}
        {userPhoto && (
          <div className="flex items-center justify-center my-6">
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent w-full max-w-2xl"></div>
          </div>
        )}
        
        {/* Step 3: Outfit Selection Section - only shown after photo is selected */}
        {userPhoto && (
          <div id="outfit-selection-section" ref={outfitSelectionRef}>
            <OutfitSelectionSection 
              isPremiumUser={effectivePremiumUser}
              onSelectOutfit={handleEnhancedOutfitSelection}
            />
          </div>
        )}
        
        {/* Divider only shown when both photo and outfit are selected */}
        {userPhoto && selectedOutfit && (
          <div className="flex items-center justify-center my-6">
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent w-full max-w-2xl"></div>
          </div>
        )}
        
        {/* Step 4: Result Preview Section - only shown after both photo and outfit are selected */}
        {userPhoto && selectedOutfit && (
          <div id="result-preview-section" ref={resultPreviewRef}>
            <ResultPreviewSection 
              finalImage={finalImage}
              userPhoto={userPhoto}
              selectedOutfit={selectedOutfit}
              isProcessingTryOn={isProcessingTryOn}
              isUsingOliviaImage={isUsingOliviaImage}
              onSaveLook={handleSaveLook}
              onTryDifferentOutfit={handleTryDifferentOutfit}
              onStartOver={handleStartOver}
              oliviaSuggestion={oliviaSuggestion}
            />
          </div>
        )}
        
        {/* Step 5: Outfit Customization Section - only shown after result is visible */}
        {finalImage && selectedOutfit && (
          <div id="outfit-customization-section">
            <OutfitCustomizationSection
              selectedOutfit={selectedOutfit}
              onReplaceItem={handleReplaceItem}
            />
          </div>
        )}
        
        {/* Olivia's Styles Section - with consistent card height and button alignment */}
        <OliviaStylesSection 
          onPreviewOutfit={handleTryOutfit}
          userPhoto={userPhoto}
          onClickChooseModel={scrollToModelSection}
        />
        
        {/* NEW: Trending Now Section - with usage tracking */}
        <TrendingLooksSection
          onPreviewOutfit={handleTryOutfit}
          userPhoto={userPhoto}
          onClickChooseModel={scrollToModelSection}
        />
        
        {/* Divider before Premium Features */}
        <div className="flex items-center justify-center my-8">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent w-full max-w-3xl"></div>
        </div>
        
        {!effectivePremiumUser && (
          <PremiumFeaturesSection 
            onUpgradeToPremium={handleUpgradeToPremium} 
          />
        )}
      </Container>

      {/* Sticky model preview */}
      <AnimatePresence>
        {userPhoto && (
          <ModelPreview
            userPhoto={userPhoto}
            isUsingOliviaImage={isUsingOliviaImage}
            onChangeModel={scrollToModelSection}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FittingRoom;
