-- 1a. Add source tracking + external URL columns to clothing_items
ALTER TABLE clothing_items
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS external_image_url TEXT;

-- 1b. Add columns to wishlist for external item tracking
ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS external_image_url TEXT,
  ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '';

-- 1c. Prevent duplicate wishlist entries per user + URL (only when URL is non-null).
-- Use a partial unique index so rows with NULL external_url are not constrained.
ALTER TABLE wishlist
  DROP CONSTRAINT IF EXISTS wishlist_user_url_unique;

DROP INDEX IF EXISTS wishlist_user_url_unique_idx;
CREATE UNIQUE INDEX wishlist_user_url_unique_idx
  ON wishlist (user_id, external_url)
  WHERE external_url IS NOT NULL;

-- Prevent duplicate wishlist entries per user + item_name when there is no URL.
DROP INDEX IF EXISTS wishlist_user_name_unique_idx;
CREATE UNIQUE INDEX wishlist_user_name_unique_idx
  ON wishlist (user_id, item_name)
  WHERE external_url IS NULL AND item_name <> '';

-- 1d. Verify/add RLS policies for wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishlist' AND policyname = 'Users can view own wishlist'
  ) THEN
    CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishlist' AND policyname = 'Users can insert own wishlist'
  ) THEN
    CREATE POLICY "Users can insert own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishlist' AND policyname = 'Users can delete own wishlist'
  ) THEN
    CREATE POLICY "Users can delete own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 1e. Verify RLS on clothing_items (already has policies, just confirm ENABLE)
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
