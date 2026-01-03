-- Create matches table for automated sports content
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_badge TEXT,
  away_team_badge TEXT,
  match_time TIMESTAMP WITH TIME ZONE NOT NULL,
  league TEXT,
  venue TEXT,
  status TEXT DEFAULT 'upcoming',
  home_score INTEGER,
  away_score INTEGER,
  seo_preview TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  sport TEXT DEFAULT 'Football',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view matches" 
ON public.matches 
FOR SELECT 
USING (true);

-- Service role can manage matches
CREATE POLICY "Service role can insert matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update matches" 
ON public.matches 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_matches_match_id ON public.matches(match_id);
CREATE INDEX idx_matches_match_time ON public.matches(match_time);

-- Create trigger for updated_at
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;