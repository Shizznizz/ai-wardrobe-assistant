
import { useState, useEffect } from 'react';
import { Outfit, ClothingItem, WeatherInfo } from '@/lib/types';

export function useOutfitState(initialOutfits: Outfit[], initialClothingItems: ClothingItem[]) {
  const [outfits, setOutfits] = useState<Outfit[]>(initialOutfits);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>(initialClothingItems);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherInfo | null>(null);
  const [showRotatingView, setShowRotatingView] = useState(false);
  const [weatherBackground, setWeatherBackground] = useState("from-slate-950 to-purple-950");

  useEffect(() => {
    // Update background based on weather
    if (currentWeather) {
      const condition = currentWeather.condition.toLowerCase();
      if (condition.includes('rain')) {
        setWeatherBackground("from-slate-900 to-blue-950");
      } else if (condition.includes('cloud')) {
        setWeatherBackground("from-slate-800 to-indigo-950");
      } else if (condition.includes('clear') || condition.includes('sun')) {
        setWeatherBackground("from-indigo-900 to-purple-900");
      } else if (condition.includes('snow')) {
        setWeatherBackground("from-slate-800 to-sky-950");
      }
    }
  }, [currentWeather]);

  const handleCreateOutfit = () => {
    setSelectedOutfit(null);
    setIsBuilderOpen(!isBuilderOpen);
  };

  const handleEditOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setIsBuilderOpen(true);
  };

  const handleSaveOutfit = (newOutfit: Outfit) => {
    if (selectedOutfit) {
      setOutfits(outfits.map(outfit => outfit.id === selectedOutfit.id ? newOutfit : outfit));
    } else {
      setOutfits([...outfits, { ...newOutfit, id: String(Date.now()) }]);
    }
    setIsBuilderOpen(false);
    setSelectedOutfit(null);
  };

  const handleDeleteOutfit = (id: string) => {
    setOutfits(outfits.filter(outfit => outfit.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setOutfits(prev =>
      prev.map(outfit =>
        outfit.id === id ? { ...outfit, favorite: !outfit.favorite } : outfit
      )
    );
  };

  const handleWeatherChange = (weather: WeatherInfo) => {
    setCurrentWeather(weather);
  };

  const handleShowTips = () => {
    setShowAssistant(true);
  };

  const handleAssistantAction = () => {
    setShowAssistant(false);
  };

  const handleRefreshOutfit = () => {
    // Animation effect for refreshing
    setShowRotatingView(true);
    setTimeout(() => setShowRotatingView(false), 1000);
  };

  return {
    outfits,
    clothingItems,
    isBuilderOpen,
    selectedOutfit,
    showAssistant,
    weatherBackground,
    showRotatingView,
    handleCreateOutfit,
    handleEditOutfit,
    handleSaveOutfit,
    handleDeleteOutfit,
    handleToggleFavorite,
    handleWeatherChange,
    handleShowTips,
    handleAssistantAction,
    handleRefreshOutfit,
    setShowAssistant,
    setIsBuilderOpen // Export this setter to allow direct control of the builder state
  };
}
