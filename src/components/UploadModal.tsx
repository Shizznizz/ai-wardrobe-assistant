
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, Wand2, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ClothingType, ClothingColor, ClothingMaterial, ClothingSeason, ClothingOccasion } from '@/lib/types';
import ImageUploader from './wardrobe/ImageUploader';
import ClothingDetailsForm from './wardrobe/ClothingDetailsForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface UploadModalProps {
  onUpload: (item: any) => void;
  buttonText?: string;
  children?: React.ReactNode;
}

const UploadModal = ({ onUpload, buttonText = "Add Item", children }: UploadModalProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ClothingType | ''>('');
  const [color, setColor] = useState<ClothingColor | ''>('');
  const [material, setMaterial] = useState<ClothingMaterial | ''>('');
  const [seasons, setSeasons] = useState<ClothingSeason[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [skipBackgroundRemoval, setSkipBackgroundRemoval] = useState(false);
  const [backgroundRemovalFailed, setBackgroundRemovalFailed] = useState(false);
  const [lastUsedModel, setLastUsedModel] = useState<string>('');
  const [debugMode, setDebugMode] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  // Reset validation errors when form fields change
  useEffect(() => {
    if (attemptedSubmit) {
      // Only validate again if user has attempted to submit once
      const errors = validateForm();
      setValidationErrors(errors);
    }
  }, [name, type, color, material, seasons, imagePreview, attemptedSubmit]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processBackgroundRemoval = async (file: File, isRetry = false) => {
    try {
      setIsRemovingBackground(true);
      setBackgroundRemovalFailed(false);
      
      if (!isRetry) {
        toast.info('Removing background...');
      } else {
        toast.info('Retrying background removal...');
      }
      
      // Convert file to base64
      const imageBase64 = await convertFileToBase64(file);
      
      if (debugMode) {
        console.log('🔍 Debug: Sending image to background removal, size:', imageBase64.length);
      }

      const response = await supabase.functions.invoke('remove-background', {
        body: JSON.stringify({ imageBase64 }),
      });

      if (debugMode) {
        console.log('🔍 Debug: Background removal response:', response);
      }

      if (response.error) {
        console.error('Background removal failed:', response.error);
        setBackgroundRemovalFailed(true);
        toast.info("Couldn't remove background. The original image has been added instead.");
        return;
      }

      // Handle successful response
      if (response.data && response.data.resultBase64) {
        const resultBase64 = response.data.resultBase64;
        
        if (debugMode) {
          console.log('🔍 Debug: Received processed image, size:', resultBase64.length);
        }

        setImagePreview(resultBase64);
        setBackgroundRemovalFailed(false);
        setLastUsedModel('briaai/RMBG-1.4');
        toast.success('Background removed successfully!');
        
        // Convert base64 back to File for consistency
        const response_blob = await fetch(resultBase64).then(r => r.blob());
        const processedFile = new File([response_blob], `${file.name.split('.')[0]}_nobg.png`, { type: 'image/png' });
        setImageFile(processedFile);
      } else {
        console.error('Invalid response format from background removal');
        setBackgroundRemovalFailed(true);
        toast.info("Couldn't remove background. The original image has been added instead.");
      }
    } catch (error) {
      console.error('Background removal error:', error);
      setBackgroundRemovalFailed(true);
      toast.info("Couldn't remove background. The original image has been added instead.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleImageChange = async (file: File) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PNG, JPG, JPEG, WEBP, or GIF image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // First set the original image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);

    // Skip background removal if user opted out
    if (skipBackgroundRemoval) {
      toast.info('Background removal skipped');
      return;
    }

    // Then try to remove background
    await processBackgroundRemoval(file);
  };

  const handleRetryBackgroundRemoval = async () => {
    if (imageFile) {
      await processBackgroundRemoval(imageFile, true);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setBackgroundRemovalFailed(false);
    setLastUsedModel('');
  };

  const toggleSeason = (season: ClothingSeason) => {
    setSeasons(prev => 
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    );
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Check if user is authenticated
    if (!isAuthenticated) {
      errors.push("You need to be logged in to add items");
      return errors;
    }

    // Check for special characters in name (alphanumeric, spaces, and basic punctuation allowed)
    if (name && !/^[a-zA-Z0-9\s.,'-]*$/.test(name)) {
      errors.push("Name contains invalid characters. Please use only letters, numbers, and basic punctuation.");
    }

    // Required fields check
    if (!name) errors.push("Name is required");
    if (!type) errors.push("Category is required");
    if (!imagePreview) errors.push("Image is required");
    if (!color) errors.push("Color is required");
    if (!material) errors.push("Material is required");
    if (seasons.length === 0) errors.push("At least one season is required");

    return errors;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isAuthenticated && newOpen) {
      toast.error("Please log in to add items to your wardrobe");
      navigate("/login"); // Redirect to login page
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your wardrobe");
      setOpen(false);
      navigate("/login");
      return;
    }
    
    // Set flag to show validations as user edits
    setAttemptedSubmit(true);
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }

    // Clear previous errors
    setValidationErrors([]);
    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
      // Default occasions
      const defaultOccasions: ClothingOccasion[] = ['casual'];
      
      // Create new item
      const newItem = {
        id: Date.now().toString(), // This ID will be overridden by Supabase
        name,
        type,
        color,
        material,
        season: seasons,
        seasons: seasons, // For compatibility
        image: imagePreview,
        imageUrl: imagePreview,
        favorite,
        timesWorn: 0,
        occasions: defaultOccasions,
        dateAdded: new Date()
      };
      
      onUpload(newItem);
      
      // Reset form
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Error adding item. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setColor('');
    setMaterial('');
    setSeasons([]);
    setFavorite(false);
    setImagePreview(null);
    setImageFile(null);
    setValidationErrors([]);
    setAttemptedSubmit(false);
    setBackgroundRemovalFailed(false);
    setLastUsedModel('');
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        {children || (
          <Button className="space-x-2 group">
            <span>{buttonText}</span>
            <Camera className="h-4 w-4 transition-transform group-hover:scale-110" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Add Clothing Item</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new item to your wardrobe
          </DialogDescription>
        </DialogHeader>
        
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Please fix the following errors:</p>
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-4 py-2 px-1">
            {/* Background Removal Controls */}
            <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="skip-bg-removal" className="text-sm text-white">
                    Skip background removal
                  </Label>
                </div>
                <Switch
                  id="skip-bg-removal"
                  checked={skipBackgroundRemoval}
                  onCheckedChange={setSkipBackgroundRemoval}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="debug-mode" className="text-sm text-white">
                    Debug mode
                  </Label>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                />
              </div>

              {lastUsedModel && (
                <div className="text-xs text-green-400">
                  ✅ Background removed with: {lastUsedModel}
                </div>
              )}

              {backgroundRemovalFailed && imageFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetryBackgroundRemoval}
                  disabled={isRemovingBackground}
                  className="w-full bg-transparent border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRemovingBackground ? 'animate-spin' : ''}`} />
                  Retry Background Removal
                </Button>
              )}
            </div>

            <div className="relative">
              <ImageUploader 
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                onClearImage={clearImage}
                label="Upload an image (PNG, JPG, JPEG, WEBP, or GIF, max 10MB)"
              />
              {isRemovingBackground && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Wand2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Removing background...</span>
                  </div>
                </div>
              )}
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
          </form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            className="bg-transparent border-slate-600 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || isRemovingBackground}
            className="relative bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting || isLoading || isRemovingBackground ? (
              <>
                <span className="opacity-0">Adding...</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </>
            ) : 'Add to Wardrobe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
