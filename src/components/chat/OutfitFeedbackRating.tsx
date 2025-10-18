import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OutfitFeedbackRatingProps {
  messageId: string;
  onFeedbackSubmitted: () => void;
}

const OutfitFeedbackRating = ({ messageId, onFeedbackSubmitted }: OutfitFeedbackRatingProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const handleRatingSubmit = async (selectedRating: number) => {
    if (isSubmitting || hasSubmitted) return;
    
    setRating(selectedRating);
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save feedback to database via edge function
      const { error } = await supabase.functions.invoke('save-outfit-feedback', {
        body: {
          userId: user.id,
          interactionType: 'outfit_rating',
          rating: selectedRating,
          outfitData: { messageId },
          context: {
            timestamp: new Date().toISOString(),
            source: 'chat'
          },
          wasSuccessful: selectedRating >= 4
        }
      });

      if (error) throw error;

      setHasSubmitted(true);
      onFeedbackSubmitted();
      
      toast({
        title: "Thanks for your feedback!",
        description: "Olivia is learning your style preferences.",
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Couldn't save feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
      setRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
        <ThumbsUp className="h-4 w-4" />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      <p className="text-xs text-muted-foreground font-medium">How's this suggestion?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingSubmit(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={isSubmitting}
            className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                (hoveredRating !== null && star <= hoveredRating) ||
                (rating !== null && star <= rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/40'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default OutfitFeedbackRating;