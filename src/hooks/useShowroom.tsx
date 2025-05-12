
import { useState } from 'react';
import { toast } from 'sonner';
import { Outfit, ClothingItem } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// Import mock data for initial demonstration
import { mockClothingItems } from '@/data/mockClothingItems';
import { mockFashionCollections } from '@/data/mockFashionCollections';

export const useShowroom = () => {
  const { user, isAuthenticated } = useAuth();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [showOliviaImageGallery, setShowOliviaImageGallery] = useState(false);
  const [isUsingOliviaImage, setIsUsingOliviaImage] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const [oliviaSuggestion, setOliviaSuggestion] = useState<string>("");
  
  // Set to true if the user has a premium subscription
  // For demo purposes, we're considering all authenticated users as premium
  const isPremiumUser = isAuthenticated;

  // For demonstration purposes, using mock data
  const clothingItems: ClothingItem[] = mockClothingItems;
  const fashionCollections = mockFashionCollections;

  // Handle user photo upload
  const handleUserPhotoUpload = (photo: string) => {
    setIsUploadLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setUserPhoto(photo);
      setIsUploadLoading(false);
      setFinalImage(null); // Clear any previous final image
      setIsUsingOliviaImage(false); // Reset Olivia flag if user uploads their own photo
      toast.success("Photo uploaded successfully!");
    }, 1000);
  };

  // Handle selecting an Olivia image
  const handleSelectOliviaImage = (imageSrc: string) => {
    setIsUploadLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setUserPhoto(imageSrc);
      setIsUsingOliviaImage(true);
      setIsUploadLoading(false);
      setFinalImage(null); // Clear any previous final image
      toast.success("Using Olivia as your model!");
    }, 1000);
  };

  // Handle trying on an outfit
  const handleSelectOutfit = (outfit: Outfit) => {
    if (!userPhoto) {
      toast.error("Please upload a photo first");
      return;
    }
    
    setSelectedOutfit(outfit);
    setIsProcessingTryOn(true);
    setFinalImage(null);
    
    // In a real app, this would call the API to generate the try-on image
    // For now, we'll simulate a delay and just use the user's photo
    setTimeout(() => {
      setFinalImage(userPhoto); // In a real app, this would be the generated image
      setIsProcessingTryOn(false);
      
      // Generate suggestion based on the outfit
      let suggestion = "This style suits you perfectly!";
      
      if (outfit.occasions?.includes('casual')) {
        suggestion = "This casual look is perfect for weekend outings!";
      } else if (outfit.occasions?.includes('formal')) {
        suggestion = "This formal outfit makes a sophisticated statement!";
      } else if (outfit.seasons?.includes('summer')) {
        suggestion = "This summer outfit will keep you cool and stylish!";
      }
      
      setOliviaSuggestion(suggestion);
    }, 2000);
  };

  // Clear photos and reset state
  const clearPhotos = () => {
    setUserPhoto(null);
    setFinalImage(null);
    setSelectedOutfit(null);
    setIsUsingOliviaImage(false);
    toast.success("Reset completed");
  };

  // Handle saving a look to user's collection
  const handleSaveLook = () => {
    if (!finalImage || !selectedOutfit) {
      toast.error("No completed look to save");
      return;
    }
    
    // In a real app, this would save the look to the user's account
    toast.success("Look saved to your collection!");
  };

  // Handle AI suggesting another outfit
  const handleSuggestAnotherOutfit = () => {
    if (!userPhoto) {
      toast.error("Please upload a photo first");
      return;
    }
    
    toast.info("Finding the perfect outfit for you...");
    
    // In a real app, this would call an AI to suggest a new outfit
    // For now, just select a random outfit from our mock data
    const randomIndex = Math.floor(Math.random() * fashionCollections[0].outfits.length);
    const suggestedOutfit = fashionCollections[0].outfits[randomIndex];
    
    handleSelectOutfit(suggestedOutfit);
  };
  
  // Simulating upgrade to premium
  const handleUpgradeToPremium = () => {
    toast.success("Redirecting to premium subscription page...");
  };

  return {
    userPhoto,
    isUploadLoading,
    showOliviaImageGallery,
    setShowOliviaImageGallery,
    isUsingOliviaImage,
    selectedOutfit,
    finalImage,
    isProcessingTryOn,
    oliviaSuggestion,
    clothingItems,
    fashionCollections,
    isPremiumUser,
    handleUserPhotoUpload,
    handleSelectOliviaImage,
    handleSelectOutfit,
    setSelectedOutfit,
    clearPhotos,
    handleSaveLook,
    handleSuggestAnotherOutfit,
    handleUpgradeToPremium
  };
};
