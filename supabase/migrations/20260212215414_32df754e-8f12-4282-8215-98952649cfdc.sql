
-- ============================================================
-- FIXPACK 5: Schema fixes for reliability & persistence
-- ============================================================

-- 1. Add deleted_at columns for soft-delete on clothing_items and outfits
ALTER TABLE public.clothing_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Add richer wishlist columns so ShopAndTry can persist item metadata
ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS external_image_url text;

-- Make item_id nullable & default empty since new inserts may use external_url instead
ALTER TABLE public.wishlist ALTER COLUMN item_id SET DEFAULT '';

-- Unique constraint: prevent duplicate wishlist items per user (by external URL)
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_external_url_unique
  ON public.wishlist (user_id, external_url)
  WHERE external_url IS NOT NULL;

-- 3. Add missing edge-function columns to user_chat_limits
--    (chat-with-olivia uses chat_count/last_chat_at;
--     generate-instant-outfits uses generation_count/last_generation_at)
ALTER TABLE public.user_chat_limits ADD COLUMN IF NOT EXISTS chat_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_chat_limits ADD COLUMN IF NOT EXISTS generation_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_chat_limits ADD COLUMN IF NOT EXISTS last_chat_at timestamptz;
ALTER TABLE public.user_chat_limits ADD COLUMN IF NOT EXISTS last_generation_at timestamptz;
