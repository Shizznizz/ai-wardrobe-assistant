-- Create olivia_learning_data table for tracking user interactions and feedback
CREATE TABLE public.olivia_learning_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('outfit_rating', 'style_preference', 'feedback', 'outfit_worn', 'outfit_rejected')),
  context JSONB DEFAULT '{}'::jsonb,
  outfit_data JSONB DEFAULT '{}'::jsonb,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  was_successful BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.olivia_learning_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own learning data"
ON public.olivia_learning_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning data"
ON public.olivia_learning_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning data"
ON public.olivia_learning_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_olivia_learning_user_id ON public.olivia_learning_data(user_id);
CREATE INDEX idx_olivia_learning_created_at ON public.olivia_learning_data(created_at DESC);
CREATE INDEX idx_olivia_learning_interaction_type ON public.olivia_learning_data(interaction_type);

-- Trigger for updated_at
CREATE TRIGGER update_olivia_learning_data_updated_at
BEFORE UPDATE ON public.olivia_learning_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();