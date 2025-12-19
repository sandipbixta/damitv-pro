-- Drop unused tables
DROP TABLE IF EXISTS public.ad_performance CASCADE;
DROP TABLE IF EXISTS public.app_downloads CASCADE;

-- Truncate cached/temporary data tables to free up space
TRUNCATE TABLE public.team_stats;
TRUNCATE TABLE public.head_to_head_stats;
TRUNCATE TABLE public.page_views;
TRUNCATE TABLE public.watch_history;
TRUNCATE TABLE public.viewer_sessions;

-- Drop unused functions related to ad tracking
DROP FUNCTION IF EXISTS public.get_ad_stats(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_download_stats();