import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { ClothingItem, ClothingSeason } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useWardrobeData } from '@/hooks/useWardrobeData';

import WardrobeHeader from '@/components/wardrobe/WardrobeHeader';
import WardrobeSearch from '@/components/wardrobe/WardrobeSearch';
import WardrobeControls from '@/components/wardrobe/WardrobeControls';
import WardrobeFilterBar from '@/components/wardrobe/WardrobeFilterBar';
import WardrobeEmptyState from '@/components/wardrobe/WardrobeEmptyState';
import WardrobeMainContent from '@/components/wardrobe/WardrobeMainContent';

const MyWardrobe = () => {
  const { isAuthenticated } = useAuth();
  const { clothingItems, isLoadingItems, addClothingItem, deleteClothingItem, updateClothingItem } = useWardrobeData();
  
  const [showFilters, setShowFilters] = useState(false);
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCompactView, setShowCompactView] = useState(false);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<ClothingSeason | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>(null);
  
  // State to prevent unnecessary refreshes
  const [cachedItems, setCachedItems] = useState<ClothingItem[]>([]);
  const [cachedFilteredItems, setCachedFilteredItems] = useState<ClothingItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Cache clothing items whenever they change
  useEffect(() => {
    if (clothingItems.length > 0 && isInitialLoad) {
      setCachedItems(clothingItems);
      setIsInitialLoad(false);
    } else if (!isLoadingItems && !isInitialLoad) {
      setCachedItems(clothingItems);
    }
  }, [clothingItems, isLoadingItems, isInitialLoad]);

  const handleUploadNew = () => {
    // Upload modal handles its own visibility
  };

  const handleAddItem = (newItem: ClothingItem) => {
    addClothingItem(newItem);
    toast.success("New item added to your wardrobe!");
  };
  
  const handleDeleteItem = (itemId: string) => {
    deleteClothingItem(itemId);
  };
  
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  const handleToggleFavorite = (id: string) => {
    const item = clothingItems.find(item => item.id === id);
    if (item) {
      updateClothingItem(id, { favorite: !item.favorite });
      toast.success("Favorite status updated");
    }
  };

  const handleMatchItem = (item: ClothingItem) => {
    toast.success(`Finding matches for ${item.name}...`);
    // Match logic would be implemented here
  };
  
  // Get unique values for filters
  const getUniqueCategories = () => {
    const categories = cachedItems.map(item => item.type || item.category || '').filter(Boolean);
    return [...new Set(categories)];
  };
  
  const getUniqueColors = () => {
    const colors = cachedItems.map(item => item.color || '').filter(Boolean);
    return [...new Set(colors)];
  };
  
  // Handle search query changes
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Apply filters and search to the clothing items
  const applyFilters = useCallback(() => {
    let filtered = [...cachedItems];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(query);
        const typeMatch = item.type?.toLowerCase().includes(query);
        const colorMatch = item.color?.toLowerCase().includes(query);
        const seasonMatch = item.season?.some(s => s.toLowerCase().includes(query));
        
        return nameMatch || typeMatch || colorMatch || seasonMatch;
      });
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.type === categoryFilter || item.category === categoryFilter);
    }
    
    // Apply color filter
    if (colorFilter) {
      filtered = filtered.filter(item => item.color === colorFilter);
    }
    
    // Apply season filter
    if (seasonFilter) {
      filtered = filtered.filter(item => {
        if (Array.isArray(item.season)) {
          return item.season.includes(seasonFilter);
        }
        return false;
      });
    }
    
    // Apply sort order
    if (sortOrder) {
      switch(sortOrder) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime());
          break;
        case 'most-worn':
          filtered.sort((a, b) => (b.timesWorn || 0) - (a.timesWorn || 0));
          break;
        case 'name-asc':
          filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'name-desc':
          filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        default:
          break;
      }
    }
    
    setFilterApplied(!!searchQuery || !!categoryFilter || !!colorFilter || !!seasonFilter || !!sortOrder);
    setCachedFilteredItems(filtered);
    setFilteredItems(filtered);
  }, [cachedItems, searchQuery, categoryFilter, colorFilter, seasonFilter, sortOrder]);
  
  // Apply filters when any filter option changes or search query changes
  useEffect(() => {
    if (cachedItems.length > 0) {
      applyFilters();
    }
  }, [applyFilters, cachedItems, searchQuery, categoryFilter, colorFilter, seasonFilter, sortOrder]);
  
  // Reset all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setColorFilter(null);
    setSeasonFilter(null);
    setSortOrder(null);
    setFilterApplied(false);
    setFilteredItems(cachedItems);
  };

  // Define the seasons array
  const seasons: ClothingSeason[] = ['summer', 'winter', 'autumn', 'spring', 'all'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white pb-20">
      <WardrobeHeader 
        onUpload={handleAddItem} 
        clothingItems={cachedItems} 
        isAuthenticated={isAuthenticated}
      />
      
      <div className="container mx-auto px-4 pt-6">
        {/* Only show controls and search if we have items or loading */}
        {(cachedItems.length > 0 || isLoadingItems) && (
          <div className="space-y-4">
            <WardrobeSearch onSearch={handleSearch} />
            
            <WardrobeControls 
              viewMode={viewMode}
              showCompactView={showCompactView}
              onViewModeChange={setViewMode}
              onCompactViewChange={setShowCompactView}
            />
          </div>
        )}
        
        {/* Filter Bar - Only show if we have items */}
        {cachedItems.length > 0 && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WardrobeFilterBar 
              uniqueCategories={getUniqueCategories()}
              uniqueColors={getUniqueColors()}
              seasons={seasons}
              categoryFilter={categoryFilter}
              colorFilter={colorFilter}
              seasonFilter={seasonFilter}
              sortOrder={sortOrder}
              setCategoryFilter={setCategoryFilter}
              setColorFilter={setColorFilter}
              setSeasonFilter={setSeasonFilter}
              setSortOrder={setSortOrder}
              clearAllFilters={clearAllFilters}
              filterApplied={filterApplied}
              filteredItemsCount={filteredItems.length}
              totalItemsCount={cachedItems.length}
            />
          </motion.div>
        )}
        
        {/* Empty State - Updated to pass itemCount */}
        <WardrobeEmptyState 
          onUpload={handleAddItem}
          isAuthenticated={isAuthenticated}
          isLoadingItems={isLoadingItems}
          itemCount={cachedItems.length}
        />
        
        {/* Main Content */}
        <WardrobeMainContent 
          isLoadingItems={isLoadingItems}
          filterApplied={filterApplied}
          filteredItems={filteredItems}
          allItems={cachedItems}
          isAuthenticated={isAuthenticated}
          handleDeleteItem={handleDeleteItem}
          handleToggleFavorite={handleToggleFavorite}
          handleMatchItem={handleMatchItem}
          onUpload={handleAddItem}
          viewMode={viewMode}
          showCompactView={showCompactView}
        />
      </div>
    </div>
  );
};

export default MyWardrobe;
