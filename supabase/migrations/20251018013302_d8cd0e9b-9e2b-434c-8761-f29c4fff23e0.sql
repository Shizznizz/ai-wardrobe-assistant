-- Create daily_suggestions table
CREATE TABLE public.daily_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_date DATE NOT NULL,
  outfit_ids TEXT[] NOT NULL DEFAULT '{}',
  weather_context JSONB,
  activity_context TEXT,
  reasoning TEXT,
  was_viewed BOOLEAN DEFAULT false,
  was_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily suggestions"
ON public.daily_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily suggestions"
ON public.daily_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily suggestions"
ON public.daily_suggestions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_daily_suggestions_user_date ON public.daily_suggestions(user_id, suggestion_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_suggestions_updated_at
BEFORE UPDATE ON public.daily_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create smart_reminders table for unworn items
CREATE TABLE public.smart_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'unworn_item', 'needs_cleaning', 'seasonal_rotation'
  item_id UUID,
  outfit_id UUID,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10 scale
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.smart_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders"
ON public.smart_reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON public.smart_reminders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.smart_reminders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.smart_reminders
FOR DELETE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_smart_reminders_user_active ON public.smart_reminders(user_id, dismissed, expires_at);