
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getScopedItem, setScopedItem, removeScopedItem } from '@/utils/scopedStorage';

export function useOnboardingState() {
  const { user } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return getScopedItem('olivia-onboarding-completed', user?.id) === 'true';
  });

  const completeOnboarding = () => {
    setScopedItem('olivia-onboarding-completed', 'true', user?.id);
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    removeScopedItem('olivia-onboarding-completed', user?.id);
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding
  };
}
