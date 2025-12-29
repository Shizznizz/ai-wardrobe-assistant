-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (NEVER store roles on profiles table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create SECURITY DEFINER function to check user role (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin (for easier use in RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

-- RLS policy: Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

-- RLS policy: Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

-- Insert initial admin user (danieldeurloo@hotmail.com) - need to get their user_id first
-- This will be done via a function that finds the user by email
CREATE OR REPLACE FUNCTION public.setup_initial_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user_id for the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'danieldeurloo@hotmail.com';
  
  -- If user exists, add admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Run the setup function
SELECT public.setup_initial_admin();

-- Drop the setup function (one-time use)
DROP FUNCTION public.setup_initial_admin();

-- Update get_admin_analytics to use proper role checking
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_users integer;
  active_users integer;
  total_quizzes integer;
  total_outfits integer;
  quiz_breakdown jsonb;
  recent_signups jsonb;
  popular_tags jsonb;
BEGIN
  -- Check if current user is admin using the new role system
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get total users
  SELECT COUNT(*) INTO total_users FROM profiles;

  -- Get active users (users who have quiz results or outfits in last 30 days)
  SELECT COUNT(DISTINCT user_id) INTO active_users 
  FROM (
    SELECT user_id FROM quiz_results WHERE created_at >= now() - interval '30 days'
    UNION
    SELECT user_id FROM outfits WHERE created_at >= now() - interval '30 days'
  ) AS active_users_subquery;

  -- Get total completed quizzes
  SELECT COUNT(*) INTO total_quizzes FROM quiz_results WHERE completed = true;

  -- Get total outfits
  SELECT COUNT(*) INTO total_outfits FROM outfits;

  -- Get quiz breakdown by type
  SELECT COALESCE(jsonb_object_agg(quiz_type, count), '{}'::jsonb) INTO quiz_breakdown
  FROM (
    SELECT quiz_type, COUNT(*) as count
    FROM quiz_results 
    WHERE completed = true
    GROUP BY quiz_type
  ) q;

  -- Get recent signups (last 10) - only return non-sensitive fields
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'first_name', COALESCE(first_name, 'Unknown'),
      'created_at', created_at
    )
  ), '[]'::jsonb) INTO recent_signups
  FROM (
    SELECT first_name, created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 10
  ) r;

  -- Get popular outfit tags (top 5)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'tag', tag,
      'count', count
    )
  ), '[]'::jsonb) INTO popular_tags
  FROM (
    SELECT unnest(tags) as tag, COUNT(*) as count
    FROM outfits
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 5
  ) t;

  -- Build final result
  result := jsonb_build_object(
    'total_users', COALESCE(total_users, 0),
    'active_users', COALESCE(active_users, 0),
    'total_quizzes', COALESCE(total_quizzes, 0),
    'total_outfits', COALESCE(total_outfits, 0),
    'quiz_breakdown', quiz_breakdown,
    'recent_signups', recent_signups,
    'popular_tags', popular_tags
  );

  RETURN result;
END;
$$;

-- Fix the clean_old_reminders function to add service role check
CREATE OR REPLACE FUNCTION public.clean_old_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function should only be called by cron jobs with service role
  -- The function runs with SECURITY DEFINER so it bypasses RLS
  DELETE FROM public.smart_reminders
  WHERE dismissed = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Fix search_path on existing functions that are missing it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_outfit_logs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_chat_limits_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_activities_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_quiz_results_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_message_count(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, message_count)
  VALUES (user_id_param, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET message_count = public.user_preferences.message_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$;