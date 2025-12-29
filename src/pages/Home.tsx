
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import HeroSection from '@/components/home/HeroSection';
import CoreFeaturesSection from '@/components/home/CoreFeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FinalCta from '@/components/home/FinalCta';
import TrustBar from '@/components/home/TrustBar';
import GetOliviasLook from '@/components/home/GetOliviasLook';
import MeetOliviaDialog from '@/components/home/MeetOliviaDialog';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import VirtualTryOnSteps from '@/components/home/VirtualTryOnSteps';
import OliviasWeeklyTip from '@/components/home/OliviasWeeklyTip';
import OliviasLookOfTheWeek from '@/components/home/OliviasLookOfTheWeek';
import { CTAButton } from '@/components/ui/cta-button';
import PremiumTeaserSection from '@/components/home/PremiumTeaserSection';
import InstantOutfitMoment from '@/components/home/InstantOutfitMoment';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showOliviaDialog, setShowOliviaDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { hasSeenOnboarding } = useOnboardingState();
  const [hasWardrobeItems, setHasWardrobeItems] = useState(false);
  const [checkingWardrobe, setCheckingWardrobe] = useState(true);
  
  const handleStartJourney = () => {
    navigate('/my-wardrobe');
  };
  
  const handleTakeStyleQuiz = () => {
    navigate('/quizzes');
  };
  
  const handleMeetOlivia = () => {
    setShowOliviaDialog(true);
  };

  const handleStartOnboarding = () => {
    setShowOliviaDialog(false);
    setShowOnboarding(true);
  };

  // Check if user has wardrobe items
  useEffect(() => {
    const checkWardrobe = async () => {
      if (!isAuthenticated || !user?.id) {
        setCheckingWardrobe(false);
        setHasWardrobeItems(false);
        return;
      }

      try {
        // Try clothing_items first
        const { data: clothingData, error: clothingError } = await supabase
          .from('clothing_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);

        if (!clothingError && clothingData) {
          setHasWardrobeItems(true);
          setCheckingWardrobe(false);
          return;
        }

        // Fallback to wardrobe_items
        const { data: wardrobeData, error: wardrobeError } = await supabase
          .from('wardrobe_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);

        setHasWardrobeItems(!wardrobeError && !!wardrobeData);
      } catch (error) {
        console.error('Error checking wardrobe:', error);
        setHasWardrobeItems(false);
      } finally {
        setCheckingWardrobe(false);
      }
    };

    checkWardrobe();
  }, [isAuthenticated, user]);

  // Show Instant Outfit Moment for first-time users (logged out OR logged in with empty wardrobe)
  const showInstantOutfit = !checkingWardrobe && (!isAuthenticated || !hasWardrobeItems);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12002f] to-[#1b013c] text-white">
      {/* Removing the duplicate Header component */}
      
      <main className="pt-8 overflow-hidden">
        {/* 1. Hero Section with optimized mobile layout from home.tsx */}
        <HeroSection
          title="The Future of Fashion"
          subtitle="Trusted by 10,000+ style-conscious women"
          description={
            <div className="space-y-4">
              <p>Say goodbye to style stress. Olivia curates outfits that match your vibe, wardrobe, and the weather.</p>
              <p>With Olivia, your AI stylist, you'll get personalized outfit ideas that feel just right — every single day.</p>
            </div>
          }
          imageSrc="/lovable-uploads/e1aaa230-1623-42c4-ab9f-eb7c5f103ebe.png"
          imageAlt="Olivia Bloom, AI Fashion Stylist"
          layoutPosition="right"
          onStartJourney={handleStartJourney}
          onTakeStyleQuiz={handleTakeStyleQuiz}
          hasSparkleEffect={true}
        />
        
        {/* 2. Trust Bar from home.tsx */}
        <TrustBar />

        {/* 2.5 Instant Outfit Moment - for first-time users */}
        {showInstantOutfit && <InstantOutfitMoment hasWardrobeItems={hasWardrobeItems} />}

        {/* 3. Core Features Section with Meet Olivia button from home.tsx */}
        <CoreFeaturesSection onMeetOlivia={handleMeetOlivia} />
        
        {/* 4. Virtual Try-On Steps from index.tsx - Enhanced version */}
        <VirtualTryOnSteps />

        {/* 5. Olivia's Look of the Week from index.tsx */}
        <OliviasLookOfTheWeek />

        {/* 6. Olivia's Weekly Tip Section from index.tsx */}
        <OliviasWeeklyTip />

        {/* 7. Testimonials Section from index.tsx */}
        <TestimonialsSection />

        {/* 8. Final CTA Section from home.tsx */}
        <FinalCta onGetStarted={() => navigate('/auth')} />
        
        {/* Premium Teaser Section with enhanced golden button */}
        <PremiumTeaserSection />
      </main>
      
      {/* Olivia Introduction Dialog */}
      <MeetOliviaDialog
        open={showOliviaDialog}
        onOpenChange={setShowOliviaDialog}
        onStartOnboarding={handleStartOnboarding}
        onGetStarted={() => navigate('/my-wardrobe')}
      />

      {/* Olivia Onboarding Flow */}
      <OnboardingFlow 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
};

export default Home;
