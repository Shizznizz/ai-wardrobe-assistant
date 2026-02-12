
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import ActivityFeedbackPanel from './ActivityFeedbackPanel';
import { useAuth } from '@/hooks/useAuth';
import { getScopedItem, setScopedItem } from '@/utils/scopedStorage';

interface StyleQuizProps {
  onComplete?: (answers: Record<string, string>) => void;
  onSituationChange?: (situation: string) => void;
  activityIcons?: Record<string, React.ReactNode>;
  gradientButtonStyle?: boolean;
}

const StyleQuiz: React.FC<StyleQuizProps> = ({
  onComplete,
  activityIcons = {},
  gradientButtonStyle = false,
}) => {
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<string | null>(() => {
    const saved = getScopedItem('selectedActivity', user?.id);
    return saved ? saved : null;
  });
  const [showFeedback, setShowFeedback] = useState(false);

  // Initialize feedback visibility based on saved activity
  useEffect(() => {
    if (selectedActivity) {
      setShowFeedback(true);
    }
  }, []);

  // Handle activity selection
  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    
    // Save selected activity to user-scoped localStorage
    setScopedItem('selectedActivity', activity, user?.id);
    
    // Show feedback panel
    setShowFeedback(true);
    
    // Call the complete callback
    if (onComplete) {
      onComplete({ activity });
    }
  };

  // Handle scroll to outfit recommendation
  const handleScrollToOutfit = () => {
    document.getElementById('olivia-recommendation-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  
  // Define activity options
  const activities = [
    { id: 'work', label: 'Work', icon: activityIcons.work },
    { id: 'casual', label: 'Casual', icon: activityIcons.casual },
    { id: 'sport', label: 'Active', icon: activityIcons.sport },
    { id: 'formal', label: 'Formal', icon: activityIcons.formal },
    { id: 'party', label: 'Party', icon: activityIcons.party },
  ];
  
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key="activity-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Label className="text-sm text-white/70 mb-2 block">What's your activity for today?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activities.map((activity) => (
                <Button 
                  key={activity.id}
                  onClick={() => handleActivitySelect(activity.id)}
                  className={`h-auto py-4 px-2 flex flex-col items-center justify-center space-y-2 ${
                    gradientButtonStyle
                      ? 'border border-white/10 bg-gradient-to-br from-purple-900/60 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/40'
                      : 'bg-white/10 hover:bg-white/20 border border-white/10'
                  }`}
                  variant="ghost"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {activity.icon || null}
                  </div>
                  <span>{activity.label}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="activity-feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {selectedActivity && (
                <ActivityFeedbackPanel 
                  activity={selectedActivity} 
                  onScroll={handleScrollToOutfit}
                />
              )}
            </AnimatePresence>
            
            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowFeedback(false);
                  // Don't clear the selected activity from localStorage, just hide the feedback
                }}
                className="text-white/70 hover:text-white border border-white/10"
              >
                Choose a Different Activity
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StyleQuiz;
