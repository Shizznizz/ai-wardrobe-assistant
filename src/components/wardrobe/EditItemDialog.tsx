
import { useState, useEffect } from 'react';
import { ClothingItem, ClothingType, ClothingColor, ClothingMaterial, ClothingSeason, ClothingOccasion } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/wardrobe/ImageUploader';
import ClothingDetailsForm from '@/components/wardrobe/ClothingDetailsForm';
import { toast } from 'sonner';

interface EditItemDialogProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ClothingItem) => void;
}

const EditItemDialog = ({ item, isOpen, onClose, onSave }: EditItemDialogProps) => {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<ClothingType | ''>(item?.type || '');
  const [color, setColor] = useState<ClothingColor | ''>(item?.color || '');
  const [material, setMaterial] = useState<ClothingMaterial | ''>(item?.material || '');
  const [seasons, setSeasons] = useState<ClothingSeason[]>([]);
  const [favorite, setFavorite] = useState(item?.favorite || false);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || item?.image || '');
  const [occasions, setOccasions] = useState<ClothingOccasion[]>([]);
  
  useEffect(() => {
    if (item) {
      setName(item.name);
      setType(item.type);
      setColor(item.color);
      setMaterial(item.material || '');
      
      // Handle seasons field - properly type the season array
      const itemSeasons = Array.isArray(item.season) 
        ? item.season.filter((s): s is ClothingSeason => 
            ['spring', 'summer', 'autumn', 'winter', 'all'].includes(s)
          )
        : [];
      setSeasons(itemSeasons);
      
      setFavorite(item.favorite || false);
      setImageUrl(item.imageUrl || item.image || '');
      
      // Handle occasions field - ensure we're using ClothingOccasion[]
      const itemOccasions = Array.isArray(item.occasions) 
        ? item.occasions.filter(occ => typeof occ === 'string') as ClothingOccasion[]
        : ['casual'] as ClothingOccasion[];
      setOccasions(itemOccasions);
      
      console.log("Item loaded in edit dialog:", item);
      console.log("Seasons loaded:", itemSeasons);
      console.log("Occasions loaded:", itemOccasions);
    }
  }, [item]);
  
  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setImageUrl(reader.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleClearImage = () => {
    setImageUrl('');
  };
  
  const toggleSeason = (season: ClothingSeason) => {
    setSeasons(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season) 
        : [...prev, season]
    );
  };
  
  const handleSave = () => {
    if (!item || !name || !type || !color || !imageUrl) return;
    
    const updatedItem: ClothingItem = {
      ...item,
      name,
      type,
      color,
      material: material as ClothingMaterial,
      season: seasons,
      favorite,
      imageUrl,
      image: imageUrl, // Set both for compatibility
      occasions: occasions.length > 0 ? occasions : ['casual'] as ClothingOccasion[]
    };
    
    console.log("Saving updated item:", updatedItem);
    onSave(updatedItem);
    toast.success(`${name} has been updated`);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Clothing Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex justify-center">
            <ImageUploader
              imagePreview={imageUrl}
              onImageChange={handleImageChange}
              onClearImage={handleClearImage}
              persistentDisplay={true}
              className="max-w-[200px] mx-auto"
            />
          </div>
          
          <ClothingDetailsForm
            name={name}
            setName={setName}
            type={type}
            setType={setType}
            color={color}
            setColor={setColor}
            material={material}
            setMaterial={setMaterial}
            seasons={seasons}
            toggleSeason={toggleSeason}
            favorite={favorite}
            setFavorite={setFavorite}
          />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave}
            disabled={!name || !type || !color || !imageUrl}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
