
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ClothingType, ClothingColor, ClothingMaterial, ClothingSeason } from '@/lib/types';
import ImageUploader from './wardrobe/ImageUploader';
import ClothingDetailsForm from './wardrobe/ClothingDetailsForm';
import ImagePreviewSection from './wardrobe/ImagePreviewSection';
import BackgroundRemovalControls from './wardrobe/BackgroundRemovalControls';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { convertFileToBase64, isValidImageType, formatFileSize } from '@/utils/imageProcessing';
import { removeBackground, BackgroundRemovalResult } from '@/utils/backgroundRemoval';

interface UploadModalProps {
  onUpload: (item: any) => void;
  buttonText?: string;
  children?: React.ReactNode;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadModal = ({ onUpload, buttonText = "Add Item", children }: UploadModalProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [type, setType] = useState<ClothingType | ''>('');
  const [color, setColor] = useState<ClothingColor | ''>('');
  const [material, setMaterial] = useState<ClothingMaterial | ''>('');
  const [seasons, setSeasons] = useState<ClothingSeason[]>([]);
  const [favorite, setFavorite] = useState(false);

  // Image processing state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const [backgroundRemovalFailed, setBackgroundRemovalFailed] = useState(false);
  const [lastUsedModel, setLastUsedModel] = useState<string>('');

  // Settings
  const [skipBackgroundRemoval, setSkipBackgroundRemoval] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Reset validation errors when form fields change
  useEffect(() => {
    if (attemptedSubmit) {
      const errors = validateForm();
      setValidationErrors(errors);
    }
  }, [name, type, color, material, seasons, imagePreview, attemptedSubmit]);

  const handleImageChange = async (file: File) => {
    // Validate file type
    if (!isValidImageType(file)) {
      toast.error('Invalid file type. Please upload a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size too large. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}.`);
      return;
    }

    // Set the original image immediately
    try {
      const originalBase64 = await convertFileToBase64(file);
      setImagePreview(originalBase64);
      setImageFile(file);
      setBackgroundRemovalFailed(false);
      setLastUsedModel('');

      // Skip background removal if user opted out
      if (skipBackgroundRemoval) {
        toast.info('Background removal skipped');
        return;
      }

      // Process background removal
      await processBackgroundRemoval(originalBase64);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Error processing image. Please try again.');
    }
  };

  const processBackgroundRemoval = async (imageBase64: string) => {
    setIsProcessingBackground(true);
    setBackgroundRemovalFailed(false);

    const result: BackgroundRemovalResult = await removeBackground(imageBase64, {
      debugMode,
      onProgress: (message) => {
        if (debugMode) {
          console.log('Background removal progress:', message);
        }
      }
    });

    setIsProcessingBackground(false);

    if (result.success && result.resultBase64) {
      setImagePreview(result.resultBase64);
      setLastUsedModel('briaai/RMBG-1.4');
      toast.success('Background removed successfully!');
      
      // Update the file reference for consistency
      try {
        const response = await fetch(result.resultBase64);
        const blob = await response.blob();
        const processedFile = new File([blob], `${imageFile?.name.split('.')[0] || 'image'}_nobg.png`, { 
          type: 'image/png' 
        });
        setImageFile(processedFile);
      } catch (error) {
        console.error('Error creating processed file:', error);
      }
    } else {
      setBackgroundRemovalFailed(true);
      toast.info("Couldn't remove background. The original image has been added instead.");
    }
  };

  const handleRetryBackgroundRemoval = async () => {
    if (!imagePreview) return;
    await processBackgroundRemoval(imagePreview);
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

    if (!isAuthenticated) {
      errors.push("You need to be logged in to add items");
      return errors;
    }

    if (name && !/^[a-zA-Z0-9\s.,'-]*$/.test(name)) {
      errors.push("Name contains invalid characters. Please use only letters, numbers, and basic punctuation.");
    }

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
      navigate("/login");
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
    
    setAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);
    
    try {
      const newItem = {
        id: Date.now().toString(),
        name,
        type,
        color,
        material,
        season: seasons,
        seasons: seasons,
        image: imagePreview,
        imageUrl: imagePreview,
        favorite,
        timesWorn: 0,
        occasions: ['casual'],
        dateAdded: new Date()
      };
      
      onUpload(newItem);
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Error adding item. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    setIsProcessingBackground(false);
  };

  const isFormDisabled = isSubmitting || isProcessingBackground;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <form onSubmit={handleSubmit} className="space-y-6 py-2 px-1">
            <BackgroundRemovalControls
              skipBackgroundRemoval={skipBackgroundRemoval}
              onSkipChange={setSkipBackgroundRemoval}
              debugMode={debugMode}
              onDebugChange={setDebugMode}
              lastUsedModel={lastUsedModel}
            />

            {!imagePreview ? (
              <ImageUploader 
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                onClearImage={clearImage}
                label="Upload an image (PNG, JPG, JPEG, or WEBP, max 10MB)"
              />
            ) : (
              <ImagePreviewSection
                imagePreview={imagePreview}
                isProcessing={isProcessingBackground}
                backgroundRemovalFailed={backgroundRemovalFailed}
                onClearImage={clearImage}
                onRetryBackgroundRemoval={handleRetryBackgroundRemoval}
              />
            )}

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
            disabled={isFormDisabled}
            className="bg-transparent border-slate-600 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isFormDisabled}
            className="relative bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isFormDisabled ? (
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
