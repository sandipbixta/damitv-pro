-- Fix viewer_sessions privacy: restrict SELECT to admins only
-- Public viewer counts are already handled by get_viewer_count() function

DROP POLICY IF EXISTS "Anyone can view viewer sessions" ON public.viewer_sessions;

CREATE POLICY "Admins can view viewer sessions" 
ON public.viewer_sessions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add a cleanup policy to delete old sessions (data retention)
-- Sessions older than 24 hours are automatically cleaned by cleanup_stale_viewer_sessions()