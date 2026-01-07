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
    // Remove common suffixes/prefixes
    .replace(/\b(fc|sc|cf|afc|united|city|real|club|athletic|atletico|ac|as|ss|us|sporting|inter|fk|sk|bk|femenil)\b/gi, '')
    // Remove special characters
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Get all words from a team name for matching
 */
const getTeamWords = (name: string): string[] => {
  return normalizeTeamName(name)
    .split(' ')
    .filter(word => word.length >= 3); // Only meaningful words
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
  
  // One contains the other (important for abbreviations)
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Word-based matching - if any significant word matches
  const words1 = getTeamWords(name1);
  const words2 = getTeamWords(name2);
  
  for (const w1 of words1) {
    for (const w2 of words2) {
      // Exact word match
      if (w1 === w2) return true;
      // One word contains the other
      if (w1.length >= 4 && w2.length >= 4) {
        if (w1.includes(w2) || w2.includes(w1)) return true;
      }
    }
  }
  
  // Check if first significant word matches (city names often match)
  if (words1.length > 0 && words2.length > 0) {
    if (words1[0] === words2[0] && words1[0].length >= 4) return true;
  }
  
  return false;
};

/**
 * Enrich matches with live score data
 */
export const enrichMatchesWithLiveScores = (matches: Match[], liveScores: LiveScore[]): Match[] => {
  if (!liveScores.length) {
    console.log('📊 No live scores available for enrichment');
    return matches;
  }

  let matchedCount = 0;
  
  const enriched = matches.map(match => {
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';

    if (!homeTeam || !awayTeam) return match;

    // Find matching live score - try both home/away combinations
    let liveScore = liveScores.find(score => 
      teamsMatch(score.homeTeam, homeTeam) && teamsMatch(score.awayTeam, awayTeam)
    );

    // Try reverse match (in case teams are swapped)
    if (!liveScore) {
      liveScore = liveScores.find(score => 
        teamsMatch(score.homeTeam, awayTeam) && teamsMatch(score.awayTeam, homeTeam)
      );
      if (liveScore) {
        // Swap scores if teams were reversed
        return {
          ...match,
          home_score: liveScore.awayScore,
          away_score: liveScore.homeScore,
          status: liveScore.status,
          progress: liveScore.progress || undefined,
        };
      }
    }

    if (liveScore) {
      matchedCount++;
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

  console.log(`📊 Enriched ${matchedCount}/${matches.length} matches with live scores`);
  return enriched;
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
