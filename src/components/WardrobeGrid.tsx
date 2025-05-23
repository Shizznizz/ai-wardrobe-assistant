
import React from 'react';
import WardrobeItemCard from '@/components/WardrobeItemCard';
import { ClothingItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WardrobeGridProps {
  items: ClothingItem[];
  onToggleFavorite: (id: string) => void;
  onMatchItem: (item: ClothingItem) => void;
  onDeleteItem?: (id: string) => void;
  onEditItem?: (item: ClothingItem) => void;
  compactView?: boolean;
  selectable?: boolean;
  selectedItems?: string[];
  onToggleSelect?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

const WardrobeGrid = ({
  items,
  onToggleFavorite,
  onMatchItem,
  onDeleteItem,
  onEditItem,
  compactView = false,
  selectable = false,
  selectedItems = [],
  onToggleSelect,
  viewMode = 'grid'
}: WardrobeGridProps) => {
  const safeItems = Array.isArray(items) ? items : [];
  
  return (
    <div className={cn(
      "transition-all duration-300",
      viewMode === 'grid' && !compactView && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
      viewMode === 'grid' && compactView && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2",
      viewMode === 'list' && "flex flex-col space-y-4"
    )}>
      {safeItems.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          onToggleFavorite={onToggleFavorite}
          onMatchItem={onMatchItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          compactView={compactView}
          selectable={selectable}
          isSelected={selectable && selectedItems.includes(item.id)}
          onToggleSelect={onToggleSelect}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};

export default WardrobeGrid;
