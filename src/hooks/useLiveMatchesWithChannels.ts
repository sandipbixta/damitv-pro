import { useState, useEffect, useCallback } from 'react';

export interface MatchChannel {
  id: string;
  name: string;
  country: string;
  embedUrl: string;
  logo: string | null;
}

export interface LiveMatchWithChannels {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
  league: string;
  sport: string;
  status: string;
  progress: string;
  startTime: string | null;
  channels: MatchChannel[];
  isLive: boolean;
}

interface UseLiveMatchesResult {
  matches: LiveMatchWithChannels[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const SUPABASE_URL = 'https://wxvsteaayxgygihpshoz.supabase.co';

export const useLiveMatchesWithChannels = (
  sport?: string,
  limit: number = 30
): UseLiveMatchesResult => {
  const [matches, setMatches] = useState<LiveMatchWithChannels[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (sport) params.set('sport', sport);
      params.set('limit', limit.toString());

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/live-matches?${params.toString()}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.matches) {
        setMatches(data.matches);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error('Error fetching live matches:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [sport, limit]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 2 minutes for live scores
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { matches, isLoading, error, refetch: fetchData };
};
