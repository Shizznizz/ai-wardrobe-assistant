
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, RefreshCcw, Edit, Trash2 } from 'lucide-react';
import { ClothingItem, Outfit } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import OutfitFeedbackSection from './OutfitFeedbackSection';
import OutfitItemReplacement from './OutfitItemReplacement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OutfitTabSectionProps {
  outfits: Outfit[];
  clothingItems: ClothingItem[];
  isRefreshing?: boolean;
  onRefresh: () => void;
  onReplaceItem?: (outfitId: string, oldItemId: string, newItemId: string) => void;
  onEditOutfit?: (outfit: Outfit) => void;
  onDeleteOutfit?: (outfitId: string) => void;
}

const OutfitTabSection = ({ 
  outfits, 
  clothingItems, 
  isRefreshing = false, 
  onRefresh, 
  onReplaceItem,
  onEditOutfit,
  onDeleteOutfit
}: OutfitTabSectionProps) => {
  const [activeTab, setActiveTab] = useState('my-outfits');
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(
    outfits.length > 0 ? outfits[0].id : null
  );
  const [outfitThumbnails, setOutfitThumbnails] = useState<Record<string, string[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  // Filter outfits that have valid items from user's wardrobe
  const validOutfits = outfits.filter(outfit => {
    if (!outfit || !Array.isArray(outfit.items) || outfit.items.length === 0) {
      return false;
    }
    
    // Check if at least one item in the outfit exists in the user's clothing items
    return outfit.items.some(itemId => 
      clothingItems.some(item => item && item.id === itemId)
    );
  });

  const myOutfits = validOutfits.filter(outfit => outfit.favorite);
  const recentOutfits = [...validOutfits].sort((a, b) => {
    const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
    const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 6);
  
  const selectedOutfit = validOutfits.find(outfit => outfit.id === selectedOutfitId);
  
  // Get clothing items for the selected outfit
  const selectedOutfitItems = selectedOutfit?.items?.map(itemId => 
    clothingItems.find(item => item.id === itemId)
  ).filter((item): item is ClothingItem => !!item) || [];

  // Generate thumbnails for outfits based on all clothing items in each outfit
  useEffect(() => {
    const thumbnails: Record<string, string[]> = {};
    
    validOutfits.forEach(outfit => {
      // Find all valid clothing items with images for this outfit
      if (Array.isArray(outfit.items) && outfit.items.length > 0) {
        const outfitImages: string[] = [];
        
        for (const itemId of outfit.items) {
          const item = clothingItems.find(item => item.id === itemId);
          if (item && (item.image || item.imageUrl)) {
            outfitImages.push(item.image || item.imageUrl || '');
          }
        }
        
        // Store all item images for this outfit
        if (outfitImages.length > 0) {
          thumbnails[outfit.id] = outfitImages;
        }
      }
    });
    
    setOutfitThumbnails(thumbnails);
  }, [validOutfits, clothingItems]);
  
  const handleToggleFavorite = (outfitId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    toast.success("Added to favorites!");
  };
  
  const handleShare = (outfitId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    toast.success("Link copied to clipboard!");
  };
  
  const handleMakeWarmer = () => {
    toast.info("Generating warmer alternatives...");
  };
  
  const handleChangeTop = () => {
    toast.info("Generating alternative tops...");
  };
  
  const handleSaveOutfit = () => {
    toast.success("Outfit saved to collection!");
  };
  
  // Handler for replacing an item in the selected outfit
  const handleReplaceItem = (oldItemId: string, newItemId: string) => {
    if (selectedOutfitId && onReplaceItem) {
      onReplaceItem(selectedOutfitId, oldItemId, newItemId);
    }
  };

  // Handler for editing an outfit
  const handleEditOutfit = (outfit: Outfit, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onEditOutfit) {
      onEditOutfit(outfit);
    }
  };

  // Handler for deleting an outfit
  const handleDeleteOutfit = (outfitId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setOutfitToDelete(outfitId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOutfit = async () => {
    if (!outfitToDelete) {
      setDeleteDialogOpen(false);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Soft-delete: set deleted_at instead of removing the row.
      if (user?.id) {
        const { error } = await supabase
          .from('outfits')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', outfitToDelete);
          
        if (error) {
          console.error("Error deleting outfit from database:", error);
          toast.error("Failed to delete outfit from database");
          setIsDeleting(false);
          setDeleteDialogOpen(false);
          return;
        }
      }
      
      // Update local UI state - call the onDeleteOutfit prop AFTER successful DB deletion
      if (onDeleteOutfit) {
        onDeleteOutfit(outfitToDelete);
        
        // If the deleted outfit was the selected one, select another outfit
        if (outfitToDelete === selectedOutfitId) {
          const remainingOutfits = validOutfits.filter(outfit => outfit.id !== outfitToDelete);
          setSelectedOutfitId(remainingOutfits.length > 0 ? remainingOutfits[0].id : null);
        }
        
        toast.success("Outfit deleted successfully");
      }
    } catch (err) {
      console.error("Error during outfit deletion:", err);
      toast.error("An unexpected error occurred while deleting the outfit");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    }
  };

  // Helper function to render outfit items grid
  const renderOutfitItemsGrid = (outfitId: string, maxItems: number = 4) => {
    const outfitImages = outfitThumbnails[outfitId] || [];
    const displayCount = Math.min(outfitImages.length, maxItems);
    const hasMore = outfitImages.length > maxItems;
    
    // Empty state if no images
    if (outfitImages.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center p-4">
          No Preview
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <div className={cn(
          "grid gap-1 h-full w-full",
          displayCount === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {outfitImages.slice(0, displayCount).map((imageUrl, index) => (
            <div 
              key={`${outfitId}-item-${index}`} 
              className={cn(
                "relative bg-slate-800 overflow-hidden",
                displayCount === 1 ? "aspect-square" : 
                  displayCount <= 2 ? "aspect-square" : 
                    "aspect-square"
              )}
            >
              <img
                src={imageUrl}
                alt={`Outfit item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {hasMore && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            +{outfitImages.length - maxItems} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-white">My Collection</h3>
        
        <Button 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="text-white/70 border-white/10 hover:bg-white/10"
        >
          <RefreshCcw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="my-outfits" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4 bg-slate-800/50">
          <TabsTrigger value="my-outfits">My Outfits</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-outfits" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {validOutfits.map((outfit) => (
              <Card 
                key={outfit.id} 
                className={cn(
                  "cursor-pointer overflow-hidden border border-white/10 transition-all duration-300",
                  selectedOutfitId === outfit.id ? "ring-2 ring-purple-500 border-purple-500/50" : "hover:border-white/30"
                )}
                onClick={() => setSelectedOutfitId(outfit.id)}
              >
                <div className="aspect-square bg-slate-800/50 relative">
                  {renderOutfitItemsGrid(outfit.id, 4)}
                  
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white rounded-full"
                      onClick={(e) => handleToggleFavorite(outfit.id, e)}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4", 
                          outfit.favorite ? "fill-red-500 text-red-500" : "fill-transparent"
                        )} 
                      />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white rounded-full"
                      onClick={(e) => handleShare(outfit.id, e)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-800/80">
                  <p className="text-white text-sm font-medium truncate">{outfit.name}</p>
                  <p className="text-white/50 text-xs truncate">{outfit.occasion}</p>
                  
                  <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={(e) => handleEditOutfit(outfit, e)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-white/70 hover:text-red-400 hover:bg-white/10"
                      onClick={(e) => handleDeleteOutfit(outfit.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {selectedOutfit && (
            <div className="mt-6 space-y-4">
              <Card className="border border-white/10 bg-slate-900/70 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{selectedOutfit.name}</h4>
                      <p className="text-white/70 text-sm">{selectedOutfit.occasion}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {selectedOutfit.season && Array.isArray(selectedOutfit.season) 
                          ? selectedOutfit.season.join(', ') 
                          : selectedOutfit.season || 'All Seasons'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-white/90 mb-2">Items in this outfit:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {selectedOutfitItems.map(item => (
                        <OutfitItemReplacement
                          key={item.id}
                          item={item}
                          onReplaceItem={handleReplaceItem}
                          category={item.type}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h5 className="text-sm font-medium text-white/90 mb-2">Why this works:</h5>
                    <p className="text-white/70 text-sm">
                      {selectedOutfit.notes || 'This combination works well together because of the complementary colors and balanced proportions. The outfit suits the selected occasion and weather conditions.'}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => handleEditOutfit(selectedOutfit)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Outfit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                      onClick={() => handleDeleteOutfit(selectedOutfit.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Outfit
                    </Button>
                  </div>
                </CardContent>
                
                <OutfitFeedbackSection
                  outfit={selectedOutfit}
                  onMakeWarmer={handleMakeWarmer}
                  onChangeTop={handleChangeTop}
                  onSaveOutfit={handleSaveOutfit}
                />
              </Card>
            </div>
          )}
          
          {validOutfits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50 mb-4">You haven't created any outfits yet</p>
              <Button variant="outline" className="border-purple-500/30 text-white hover:bg-white/10">
                Create Your First Outfit
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {recentOutfits.map((outfit) => (
              <Card 
                key={outfit.id} 
                className="cursor-pointer overflow-hidden border border-white/10 hover:border-white/30"
                onClick={() => {
                  setSelectedOutfitId(outfit.id);
                  setActiveTab('my-outfits');
                }}
              >
                <div className="aspect-square bg-slate-800/50 relative">
                  {renderOutfitItemsGrid(outfit.id, 4)}
                </div>
                <div className="p-2 bg-slate-800/80">
                  <p className="text-white text-sm font-medium truncate">{outfit.name}</p>
                  <p className="text-white/50 text-xs truncate">{outfit.dateAdded 
                    ? new Date(outfit.dateAdded).toLocaleDateString() 
                    : 'Recently added'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          
          {recentOutfits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50">No recent outfits</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {myOutfits.map((outfit) => (
              <Card 
                key={outfit.id} 
                className="cursor-pointer overflow-hidden border border-white/10 hover:border-white/30"
                onClick={() => {
                  setSelectedOutfitId(outfit.id);
                  setActiveTab('my-outfits');
                }}
              >
                <div className="aspect-square bg-slate-800/50 relative">
                  {renderOutfitItemsGrid(outfit.id, 4)}
                  <div className="absolute top-2 right-2">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </div>
                </div>
                <div className="p-2 bg-slate-800/80">
                  <p className="text-white text-sm font-medium truncate">{outfit.name}</p>
                  <p className="text-white/50 text-xs truncate">{outfit.occasion}</p>
                </div>
              </Card>
            ))}
          </div>
          
          {myOutfits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50 mb-4">No favorite outfits yet</p>
              <p className="text-white/30 text-sm">Click the heart icon on any outfit to add it to favorites</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this outfit?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this outfit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-red-600 text-white hover:bg-red-700",
                isDeleting && "opacity-70 cursor-not-allowed"
              )}
              onClick={(e) => {
                // Prevent the default action (which would close the dialog)
                e.preventDefault();
                // Call our custom action
                confirmDeleteOutfit();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OutfitTabSection;
