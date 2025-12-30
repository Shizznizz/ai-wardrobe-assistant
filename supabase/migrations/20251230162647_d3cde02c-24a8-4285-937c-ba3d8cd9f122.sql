-- First drop the dependent policy that uses is_admin
DROP POLICY IF EXISTS "Only admins can call admin functions" ON public.profiles;

-- Now remove the deprecated is_admin column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;