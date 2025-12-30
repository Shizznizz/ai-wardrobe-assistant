-- =============================================
-- SECURITY FIX 1: Remove public profiles policy
-- This prevents exposing all user profile data publicly
-- =============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- =============================================
-- SECURITY FIX 2: Remove public outfit_usage aggregation policy
-- This prevents exposing user behavior/tracking data publicly
-- =============================================
DROP POLICY IF EXISTS "Users can view aggregated outfit usage" ON public.outfit_usage;

-- =============================================
-- SECURITY FIX 3: Add showroom storage policies
-- Public bucket but with controlled write access
-- =============================================

-- Allow public read access (bucket is already public)
CREATE POLICY "showroom_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'showroom');

-- Allow authenticated users to upload to showroom
CREATE POLICY "showroom_authenticated_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'showroom');

-- Allow users to update their own files (by folder structure: user_id/filename)
CREATE POLICY "showroom_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'showroom'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'showroom'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Allow users to delete their own files
CREATE POLICY "showroom_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'showroom'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);