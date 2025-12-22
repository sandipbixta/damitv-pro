import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Highlight {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  date: string;
  league: string;
  sport: string;
  leagueBadge: string | null;
  homeTeamBadge: string | null;
  awayTeamBadge: string | null;
  thumbnail: string | null;
  video: string;
  embedUrl: string;
  venue: string | null;
}

export const useHighlights = () => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke('fetch-highlights');

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.success && data?.highlights) {
          setHighlights(data.highlights);
          setSports(data.sports || []);
        } else {
          setError('No highlights available');
        }
      } catch (err: any) {
        console.error('Error fetching highlights:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  return { highlights, sports, loading, error };
};
