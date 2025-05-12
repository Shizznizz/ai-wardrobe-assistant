
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import UserPhotoDisplay from '@/components/fitting-room/UserPhotoDisplay';
import OliviaImageSelector from './OliviaImageSelector';

interface ModelSelectionSectionProps {
  userPhoto: string | null;
  isUploading: boolean;
  isUsingOliviaImage: boolean;
  onUserPhotoChange: (photo: string) => void;
  onShowOliviaImageGallery: () => void;
}

const ModelSelectionSection = ({
  userPhoto,
  isUploading,
  isUsingOliviaImage,
  onUserPhotoChange,
  onShowOliviaImageGallery
}: ModelSelectionSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showOliviaSelector, setShowOliviaSelector] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const outfitSelectionRef = useRef<HTMLDivElement | null>(null);

  // Find the outfit selection section reference on mount
  useEffect(() => {
    outfitSelectionRef.current = document.getElementById('outfit-selection-section') as HTMLDivElement;
  }, []);

  // Scroll to outfit selection after photo is uploaded
  useEffect(() => {
    if (userPhoto && outfitSelectionRef.current) {
      setTimeout(() => {
        outfitSelectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [userPhoto]);

  // Function to save user photo to Supabase
  const savePhotoToSupabase = async (photoDataUrl: string, isOlivia: boolean = false) => {
    if (!isAuthenticated || !user) {
      // If user is not authenticated, just use the photo without storing
      onUserPhotoChange(photoDataUrl);
      return;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      
      // Generate a unique filename
      const fileExt = 'png';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `user-photos/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-models')
        .upload(filePath, blob);
        
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        toast.error('Failed to save your photo. Using it temporarily.');
        onUserPhotoChange(photoDataUrl);
        return;
      }
      
      // Get public URL for the uploaded image
      const { data } = supabase.storage.from('user-models').getPublicUrl(filePath);
      
      if (data && data.publicUrl) {
        // Update user profile with the photo reference
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            model_photo_url: data.publicUrl,
            is_using_olivia: isOlivia
          });
          
        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
        
        // Use the photo in the UI
        onUserPhotoChange(data.publicUrl);
        toast.success('Your photo has been saved!');
      }
    } catch (error) {
      console.error('Error in save photo process:', error);
      // Fallback: use the photo directly without storage
      onUserPhotoChange(photoDataUrl);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const photoDataUrl = e.target.result as string;
            await savePhotoToSupabase(photoDataUrl);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Could not process your photo. Please try again.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    // Check if the browser supports the camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Your browser does not support camera access.');
      setPermissionError('Camera access is not supported on this browser. Please try uploading a photo instead.');
      return;
    }

    try {
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If supported, trigger the camera input
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', 'user');
        cameraInputRef.current.click();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setPermissionError('Camera access was denied. Please check your browser settings and try again, or upload a photo instead.');
      toast.error('Camera access denied. Please check your browser settings.');
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const photoDataUrl = e.target.result as string;
            await savePhotoToSupabase(photoDataUrl);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing camera photo:', error);
        toast.error('Could not process your photo. Please try again.');
      }
    }
  };

  const handleSelectOliviaImage = async (imageSrc: string) => {
    try {
      await savePhotoToSupabase(imageSrc, true);
    } catch (error) {
      console.error('Error setting Olivia image:', error);
      onUserPhotoChange(imageSrc);
    }
  };

  // If already uploaded, show the photo instead
  if (userPhoto) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <UserPhotoDisplay 
          userPhoto={userPhoto} 
          isUsingOliviaImage={isUsingOliviaImage} 
          onResetPhoto={() => onUserPhotoChange('')} 
        />
        
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline"
            onClick={triggerFileInput}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Upload className="mr-2 h-4 w-4" /> Change Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </motion.div>
    );
  }

  if (isUploading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-300/30 rounded-full"></div>
          </motion.div>
          
          <h3 className="text-xl font-medium mb-2 text-white">Getting everything ready...</h3>
          <p className="text-white/70 text-center max-w-md">
            We're preparing your virtual try-on experience. This will just take a moment.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Button 1: Choose a Photo */}
        <motion.div 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}
          transition={{ duration: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-lg"
        >
          <h3 className="text-lg font-medium mb-3 text-blue-200">Choose a Photo</h3>
          <p className="text-white/70 mb-5 text-sm">
            Upload a full-body photo of yourself to see how outfits fit you.
          </p>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={triggerFileInput}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 shadow-lg shadow-blue-900/20 transition-all duration-300"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose Photo
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Button 2: Take a Photo */}
        <motion.div 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(74, 222, 128, 0.2)" }}
          transition={{ duration: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-lg"
        >
          <h3 className="text-lg font-medium mb-3 text-green-200">Take a Photo</h3>
          <p className="text-white/70 mb-5 text-sm">
            Use your device's camera to take a picture now for the try-on.
          </p>
          
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleCameraCapture}
          />
          
          {permissionError ? (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-md mb-3">
              <p className="text-white/90 text-xs">
                {permissionError}
              </p>
            </div>
          ) : null}
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleTakePhoto}
              variant="outline"
              className="w-full border-green-400/30 text-white hover:bg-green-500/10 transition-all duration-300"
            >
              <Camera className="h-5 w-5 mr-2" />
              Take a Photo
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Button 3: Use Olivia Bloom */}
        <motion.div 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(147, 51, 234, 0.2)" }}
          transition={{ duration: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-lg"
        >
          <h3 className="text-lg font-medium mb-3 text-purple-200">Use Olivia Bloom</h3>
          <p className="text-white/70 mb-5 text-sm">
            Try outfits on our virtual AI model — Olivia — for a quick preview.
          </p>
          
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border border-purple-400/20">
              <User className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowOliviaSelector(true)}
              className="w-full text-sm border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-100 hover:border-purple-500/50 transition-all duration-300"
              variant="outline"
            >
              <User className="h-5 w-5 mr-2" />
              Choose Olivia
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <OliviaImageSelector 
        isOpen={showOliviaSelector} 
        onClose={() => setShowOliviaSelector(false)}
        onSelectImage={handleSelectOliviaImage}
      />
    </motion.div>
  );
};

export default ModelSelectionSection;
