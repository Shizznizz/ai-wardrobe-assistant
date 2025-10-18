-- Create fashion_trends table for seasonal fashion intelligence
CREATE TABLE public.fashion_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season TEXT NOT NULL CHECK (season IN ('spring_2025', 'summer_2025', 'fall_2025', 'winter_2025', 'spring_2026', 'summer_2026', 'fall_2026', 'winter_2026')),
  trend_name TEXT NOT NULL,
  description TEXT NOT NULL,
  colors TEXT[] DEFAULT '{}',
  key_pieces TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  popularity_score INTEGER DEFAULT 50 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season, trend_name)
);

-- Enable RLS
ALTER TABLE public.fashion_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies - trends are public, only admins can modify
CREATE POLICY "Anyone can view fashion trends"
ON public.fashion_trends
FOR SELECT
USING (true);

-- Create index for performance
CREATE INDEX idx_fashion_trends_season ON public.fashion_trends(season);
CREATE INDEX idx_fashion_trends_popularity ON public.fashion_trends(popularity_score DESC);

-- Trigger for updated_at
CREATE TRIGGER update_fashion_trends_updated_at
BEFORE UPDATE ON public.fashion_trends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some current fashion trends for Fall/Winter 2025
INSERT INTO public.fashion_trends (season, trend_name, description, colors, key_pieces, style_tags, popularity_score) VALUES
('fall_2025', 'Quiet Luxury', 'Understated elegance with premium fabrics and timeless silhouettes. Focus on quality over logos, neutral palettes, and impeccable tailoring.', 
  ARRAY['camel', 'cream', 'charcoal', 'navy', 'black'], 
  ARRAY['cashmere sweater', 'tailored trousers', 'leather loafers', 'structured coat', 'silk blouse'], 
  ARRAY['minimalist', 'sophisticated', 'timeless', 'elegant'], 
  95),

('fall_2025', 'Dopamine Dressing', 'Bold, joyful colors that boost mood and make a statement. Embrace bright hues, playful patterns, and cheerful combinations.',
  ARRAY['fuchsia', 'electric blue', 'sunshine yellow', 'lime green', 'hot pink'],
  ARRAY['colorful knit', 'bright blazer', 'printed dress', 'bold accessories'],
  ARRAY['bold', 'playful', 'colorful', 'fun'],
  88),

('fall_2025', 'Modern Western', 'Contemporary take on Western wear with denim, leather, fringe, and cowboy-inspired details. Urban meets ranch style.',
  ARRAY['denim blue', 'tan', 'brown', 'burgundy', 'black'],
  ARRAY['denim jacket', 'cowboy boots', 'leather belt', 'western shirt', 'suede jacket'],
  ARRAY['western', 'bohemian', 'rugged', 'casual'],
  82),

('fall_2025', 'Oversized Everything', 'Relaxed, comfortable silhouettes with intentionally oversized fits. Focus on layering and effortless style.',
  ARRAY['neutral', 'grey', 'beige', 'black', 'white'],
  ARRAY['oversized blazer', 'baggy jeans', 'chunky sweater', 'long coat', 'wide trousers'],
  ARRAY['relaxed', 'comfortable', 'modern', 'casual'],
  90),

('winter_2025', 'Luxe Layering', 'Sophisticated layering with rich textures and warming fabrics. Mix materials like knit, leather, and wool for depth.',
  ARRAY['burgundy', 'forest green', 'chocolate brown', 'navy', 'cream'],
  ARRAY['turtleneck', 'long coat', 'leather jacket', 'knit vest', 'wool scarf'],
  ARRAY['layered', 'sophisticated', 'cozy', 'elegant'],
  87),

('winter_2025', 'Monochrome Magic', 'Head-to-toe single color dressing for sleek, elongating effect. Experiment with different textures in same color family.',
  ARRAY['all black', 'all white', 'all grey', 'all camel', 'all navy'],
  ARRAY['matching set', 'tonal coat', 'monochrome accessories'],
  ARRAY['minimalist', 'sleek', 'modern', 'sophisticated'],
  85),

('spring_2026', 'Blooming Neutrals', 'Soft, nature-inspired neutrals with organic shapes. Think earthy tones meeting feminine silhouettes.',
  ARRAY['sage green', 'terracotta', 'sand', 'dusty rose', 'cream'],
  ARRAY['linen dress', 'flowing pants', 'natural fiber bag', 'soft cardigan'],
  ARRAY['natural', 'feminine', 'soft', 'organic'],
  78);

-- Insert style education content
COMMENT ON TABLE public.fashion_trends IS 'Current fashion trends database for Olivia to reference when providing style advice and education';