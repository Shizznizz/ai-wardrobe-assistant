-- Create instant_outfits_saved table for persisting saved instant outfit suggestions
-- This table stores instant outfits that users save from the Instant Outfit Moment feature

CREATE TABLE IF NOT EXISTS instant_outfits_saved (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style_vibe TEXT NOT NULL,
    occasion TEXT NOT NULL,
    weather TEXT NOT NULL,
    title TEXT NOT NULL,
    items JSONB NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_instant_outfits_saved_user_id ON instant_outfits_saved(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_instant_outfits_saved_created_at ON instant_outfits_saved(created_at DESC);

-- Enable Row Level Security
ALTER TABLE instant_outfits_saved ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own saved instant outfits
CREATE POLICY "Users can view their own saved instant outfits"
    ON instant_outfits_saved
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own saved instant outfits
CREATE POLICY "Users can insert their own saved instant outfits"
    ON instant_outfits_saved
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own saved instant outfits
CREATE POLICY "Users can delete their own saved instant outfits"
    ON instant_outfits_saved
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE instant_outfits_saved IS 'Stores instant outfit suggestions that users have saved from the Instant Outfit Moment feature';
