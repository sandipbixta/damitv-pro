import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/types/sports';

interface LiveScore {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  progress: string | null;
  sport: string;
  league: string;
  homeBadge: string | null;
  awayBadge: string | null;
}

// Cache for live scores
let scoreCache: LiveScore[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache

/**
 * Fetch live scores from TheSportsDB via edge function
 */
export const fetchLiveScores = async (): Promise<LiveScore[]> => {
  // Return cached data if fresh
  if (scoreCache.length > 0 && Date.now() - lastFetchTime < CACHE_TTL) {
    return scoreCache;
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-live-scores', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (error) {
      console.error('Error fetching live scores:', error);
      return scoreCache; // Return stale cache on error
    }

    if (data?.success && data.liveScores?.length > 0) {
      scoreCache = data.liveScores;
      lastFetchTime = Date.now();
      console.log(`✅ Live scores cached: ${scoreCache.length} matches`);
      return scoreCache;
    }

    return [];
  } catch (error) {
    console.error('Error in fetchLiveScores:', error);
    return scoreCache;
  }
};

/**
 * Normalize team name for matching
 */
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/fc|sc|cf|afc|united|city|real|club|athletic|atletico|ac|as|ss|us/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Check if two team names match (fuzzy matching)
 */
const teamsMatch = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);
  
  // Exact match after normalization
  if (n1 === n2) return true;
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Check if significant part matches (first 5+ chars)
  if (n1.length >= 5 && n2.length >= 5) {
    if (n1.substring(0, 5) === n2.substring(0, 5)) return true;
  }
  
  return false;
};

/**
 * Enrich matches with live score data
 */
export const enrichMatchesWithLiveScores = (matches: Match[], liveScores: LiveScore[]): Match[] => {
  if (!liveScores.length) return matches;

  return matches.map(match => {
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';

    // Find matching live score
    const liveScore = liveScores.find(score => 
      teamsMatch(score.homeTeam, homeTeam) && teamsMatch(score.awayTeam, awayTeam)
    );

    if (liveScore) {
      return {
        ...match,
        home_score: liveScore.homeScore,
        away_score: liveScore.awayScore,
        status: liveScore.status,
        progress: liveScore.progress || undefined,
      };
    }

    return match;
  });
};

/**
 * Hook to manage live scores with automatic refresh
 */
export const useLiveScores = (matches: Match[], refreshInterval = 60000) => {
  const [enrichedMatches, setEnrichedMatches] = useState<Match[]>(matches);
  const [isLoading, setIsLoading] = useState(false);

  const enrichMatches = useCallback(async () => {
    if (matches.length === 0) {
      setEnrichedMatches([]);
      return;
    }

    setIsLoading(true);
    try {
      const liveScores = await fetchLiveScores();
      const enriched = enrichMatchesWithLiveScores(matches, liveScores);
      setEnrichedMatches(enriched);
    } catch (error) {
      console.error('Error enriching matches with live scores:', error);
      setEnrichedMatches(matches);
    } finally {
      setIsLoading(false);
    }
  }, [matches]);

  // Initial fetch and refresh interval
  useEffect(() => {
    enrichMatches();

    const interval = setInterval(enrichMatches, refreshInterval);
    return () => clearInterval(interval);
  }, [enrichMatches, refreshInterval]);

  // Update when matches change
  useEffect(() => {
    setEnrichedMatches(matches);
  }, [matches]);

  return { enrichedMatches, isLoading, refresh: enrichMatches };
};
