
import React from 'react';
import { motion } from 'framer-motion';
import { ClothingItem } from '@/lib/types';
import WardrobeGrid from '@/components/WardrobeGrid';
import EnhancedWardrobeGaps from '@/components/wardrobe/EnhancedWardrobeGaps';
import WardrobeAddMore from '@/components/wardrobe/WardrobeAddMore';
import OliviaSuggests from '@/components/wardrobe/OliviaSuggests';

interface WardrobeMainContentProps {
  isLoadingItems: boolean;
  filterApplied: boolean;
  filteredItems: ClothingItem[];
  allItems: ClothingItem[];
  isAuthenticated: boolean;
  handleDeleteItem: (id: string) => void;
  handleToggleFavorite: (id: string) => void;
  handleMatchItem: (item: ClothingItem) => void;
  onUpload: (item: ClothingItem) => void;
  viewMode: 'grid' | 'list';
  showCompactView: boolean;
}

const WardrobeMainContent = ({ 
  isLoadingItems,
  filterApplied,
  filteredItems,
  allItems,
  isAuthenticated,
  handleDeleteItem,
  handleToggleFavorite,
  handleMatchItem,
  onUpload,
  viewMode,
  showCompactView
}: WardrobeMainContentProps) => {
  if (isLoadingItems && allItems.length === 0) {
    return <div className="text-center text-gray-400 mt-10">Loading your wardrobe...</div>;
  }

  const displayItems = filterApplied ? filteredItems : allItems;

  return (
    <>
      {/* Olivia Suggests Section - Only shows if there's a relevant suggestion */}
      {isAuthenticated && !isLoadingItems && allItems.length > 0 && (
        <OliviaSuggests items={allItems} />
      )}

      <div>
        <WardrobeGrid 
          items={displayItems} 
          onDeleteItem={handleDeleteItem}
          onToggleFavorite={handleToggleFavorite}
          onMatchItem={handleMatchItem}
          viewMode={viewMode}
          compactView={showCompactView}
        />
        
        {/* Enhanced Wardrobe Gaps Section - Only shows if relevant and user has items */}
        {isAuthenticated && !isLoadingItems && allItems.length > 0 && (
          <EnhancedWardrobeGaps 
            items={allItems} 
            onAddItem={onUpload}
          />
        )}
        
        {/* Add More section at bottom of grid */}
        <WardrobeAddMore 
          onUpload={onUpload}
          isAuthenticated={isAuthenticated}
          isLoadingItems={isLoadingItems}
          hasItems={allItems.length > 0}
        />
      </div>
    </>
  );
};

export default WardrobeMainContent;
