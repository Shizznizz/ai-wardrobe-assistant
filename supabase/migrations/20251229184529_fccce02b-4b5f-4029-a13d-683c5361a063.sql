-- Create instant_outfits_saved table for saving generated instant outfits
CREATE TABLE public.instant_outfits_saved (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  style_vibe TEXT NOT NULL,
  occasion TEXT NOT NULL,
  weather TEXT NOT NULL,
  title TEXT NOT NULL,
  items TEXT[] NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.instant_outfits_saved ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved instant outfits" 
ON public.instant_outfits_saved 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved instant outfits" 
ON public.instant_outfits_saved 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved instant outfits" 
ON public.instant_outfits_saved 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instant_outfits_saved_updated_at
BEFORE UPDATE ON public.instant_outfits_saved
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();