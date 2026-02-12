-- Fixpack 5: Guarantee every auth.user gets required provisioning rows.
--
-- Previously, user_chat_limits was lazily created by edge functions on first
-- chat or generation request.  This left a window where useAuth reads
-- is_premium before the row exists (returns null → defaults to false, which
-- is correct but fragile).  The handle_new_user() function existed but had
-- no trigger attached, and only provisioned profiles.
--
-- Fix: redefine handle_new_user() to provision BOTH profiles and
-- user_chat_limits (with all columns from Fixpack 2), attach the trigger
-- to auth.users, and backfill any existing users who lack rows.

-- 1. Redefine handle_new_user() to provision BOTH profiles and user_chat_limits.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Provision a profiles row (original behaviour).
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Provision a user_chat_limits row with safe defaults for all columns
  -- introduced in Fixpack 2 (split chat/generation counters).
  INSERT INTO public.user_chat_limits (
    user_id,
    is_premium,
    chat_count,
    generation_count,
    last_chat_at,
    last_generation_at
  )
  VALUES (
    new.id,
    false,  -- is_premium
    0,      -- chat_count
    0,      -- generation_count
    NULL,   -- last_chat_at  (no activity yet)
    NULL    -- last_generation_at
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 2. Attach the trigger (DROP first to be idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: create missing profiles for existing auth.users.
INSERT INTO public.profiles (id, first_name)
SELECT id, split_part(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill: create missing user_chat_limits rows for existing auth.users.
INSERT INTO public.user_chat_limits (
  user_id, is_premium, chat_count, generation_count,
  last_chat_at, last_generation_at
)
SELECT id, false, 0, 0, NULL, NULL
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_chat_limits)
ON CONFLICT (user_id) DO NOTHING;
