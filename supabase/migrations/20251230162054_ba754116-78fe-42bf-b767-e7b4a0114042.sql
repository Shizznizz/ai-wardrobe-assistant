-- =============================================
-- SECURITY FIX: Add authorization checks to SECURITY DEFINER functions
-- =============================================

-- Fix 1: clean_old_reminders() - Add service role check
CREATE OR REPLACE FUNCTION public.clean_old_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role (cron jobs) to call this function
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  DELETE FROM public.smart_reminders
  WHERE dismissed = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Fix 2: increment_message_count() - Add ownership check
CREATE OR REPLACE FUNCTION public.increment_message_count(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to increment their own count
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: Can only update own message count';
  END IF;
  
  INSERT INTO public.user_preferences (user_id, message_count)
  VALUES (user_id_param, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET message_count = public.user_preferences.message_count + 1;
END;
$$;