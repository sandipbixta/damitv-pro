-- Drop prediction_leaderboard view first (depends on match_predictions)
DROP VIEW IF EXISTS public.prediction_leaderboard CASCADE;

-- Drop match_predictions table and all its policies
DROP TABLE IF EXISTS public.match_predictions CASCADE;