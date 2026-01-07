import { useState, useEffect, useCallback } from 'react';
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
const CACHE_TTL = 60000; // 60 seconds cache (increased to reduce API calls)

/**
 * Fetch live scores - returns empty array since TheSportsDB API requires server-side key
 * Live scores will be disabled until Supabase quota resets or user upgrades
 */
export const fetchLiveScores = async (): Promise<LiveScore[]> => {
  // Return cached data if fresh
  if (scoreCache.length > 0 && Date.now() - lastFetchTime < CACHE_TTL) {
    return scoreCache;
  }

  // Live scores require API key which can't be exposed in frontend
  // Return empty array - live scores disabled
  console.log('⚠️ Live scores disabled (requires server-side API key)');
  return [];
};

/**
 * Normalize team name for matching
 */
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    // Remove common suffixes/prefixes
    .replace(/\b(fc|sc|cf|afc|united|city|real|club|athletic|atletico|ac|as|ss|us|sporting|inter|fk|sk|bk|femenil|women|mens|womens|u21|u23|u19|ii|b|reserves)\b/gi, '')
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
 * Check if two team names match
 */
const teamsMatch = (streamTeam: string, apiTeam: string): boolean => {
  const normalizedStream = normalizeTeamName(streamTeam);
  const normalizedApi = normalizeTeamName(apiTeam);
  
  // Direct match after normalization
  if (normalizedStream === normalizedApi) return true;
  
  // One contains the other
  if (normalizedStream.includes(normalizedApi) || normalizedApi.includes(normalizedStream)) return true;
  
  // Check word overlap
  const streamWords = getTeamWords(streamTeam);
  const apiWords = getTeamWords(apiTeam);
  
  // At least one meaningful word must match
  const matchingWords = streamWords.filter(word => apiWords.includes(word));
  
  return matchingWords.length >= 1;
};

/**
 * Find live score for a match
 */
export const findLiveScoreForMatch = (match: Match, liveScores: LiveScore[]): LiveScore | null => {
  if (!match.teams?.home?.name || !match.teams?.away?.name) return null;
  
  const homeTeam = match.teams.home.name;
  const awayTeam = match.teams.away.name;
  
  // Try exact match first
  for (const score of liveScores) {
    if (teamsMatch(homeTeam, score.homeTeam) && teamsMatch(awayTeam, score.awayTeam)) {
      return score;
    }
  }
  
  // Try swapped teams (in case API has teams in different order)
  for (const score of liveScores) {
    if (teamsMatch(homeTeam, score.awayTeam) && teamsMatch(awayTeam, score.homeTeam)) {
      return {
        ...score,
        // Swap the scores to match our team order
        homeTeam: score.awayTeam,
        awayTeam: score.homeTeam,
        homeScore: score.awayScore,
        awayScore: score.homeScore,
        homeBadge: score.awayBadge,
        awayBadge: score.homeBadge,
      };
    }
  }
  
  return null;
};

/**
 * Enrich matches with live scores (synchronous version)
 * Takes matches and live scores arrays and returns enriched matches
 */
export const enrichMatchesWithLiveScores = (matches: Match[], liveScores: LiveScore[]): Match[] => {
  if (liveScores.length === 0) {
    return matches;
  }
  
  return matches.map(match => {
    const liveScore = findLiveScoreForMatch(match, liveScores);
    
    if (liveScore) {
      return {
        ...match,
        home_score: liveScore.homeScore,
        away_score: liveScore.awayScore,
        status: liveScore.status,
        progress: liveScore.progress,
        teams: {
          ...match.teams,
          home: {
            ...match.teams?.home,
            name: match.teams?.home?.name || liveScore.homeTeam,
            badge: match.teams?.home?.badge || liveScore.homeBadge || '',
          },
          away: {
            ...match.teams?.away,
            name: match.teams?.away?.name || liveScore.awayTeam,
            badge: match.teams?.away?.badge || liveScore.awayBadge || '',
          },
        },
      };
    }
    
    return match;
  });
};

/**
 * Hook to use live scores in components
 */
export const useLiveScores = () => {
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const scores = await fetchLiveScores();
      setLiveScores(scores);
    } catch (err) {
      setError('Failed to fetch live scores');
      console.error('Error fetching live scores:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    // Refresh every 60 seconds
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    liveScores,
    isLoading,
    error,
    refresh,
    findScoreForMatch: (match: Match) => findLiveScoreForMatch(match, liveScores),
  };
};

export type { LiveScore };
