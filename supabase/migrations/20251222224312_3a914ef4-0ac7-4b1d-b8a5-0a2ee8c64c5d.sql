-- Create table to track notified matches (prevents duplicate Telegram messages)
CREATE TABLE public.notified_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  match_title TEXT,
  notification_type TEXT DEFAULT 'match_live'
);

-- Enable RLS
ALTER TABLE public.notified_matches ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to read/write
CREATE POLICY "Allow all operations on notified_matches"
ON public.notified_matches
FOR ALL
USING (true)
WITH CHECK (true);

-- Auto-cleanup old entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notified_matches
  WHERE notified_at < now() - interval '24 hours';
END;
$$;