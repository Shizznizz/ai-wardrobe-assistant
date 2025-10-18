-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily suggestions to run every morning at 7 AM
SELECT cron.schedule(
  'generate-daily-suggestions',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://aaiyxtbovepseasghtth.supabase.co/functions/v1/generate-daily-suggestions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaXl4dGJvdmVwc2Vhc2dodHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzcxNDMsImV4cCI6MjA1ODA1MzE0M30.Pq66ZdBT_ZEBnPbXkDe-SVMnMvqoNjcuTo05GcPabL0"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to clean up old dismissed reminders (older than 30 days)
CREATE OR REPLACE FUNCTION clean_old_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.smart_reminders
  WHERE dismissed = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Schedule cleanup to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-old-reminders',
  '0 3 * * *',
  $$SELECT clean_old_reminders();$$
);