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
 * Calculate similarity score between two team names (0-100)
 */
const getTeamSimilarity = (name1: string, name2: string): number => {
  if (!name1 || !name2) return 0;
  
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);
  
  // Exact match
  if (n1 === n2) return 100;
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return 90;
  
  // Word-based matching
  const words1 = getTeamWords(name1);
  const words2 = getTeamWords(name2);
  
  let matchedWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2) {
        matchedWords++;
        break;
      }
      if (w1.length >= 4 && w2.length >= 4 && (w1.includes(w2) || w2.includes(w1))) {
        matchedWords += 0.8;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  if (maxWords === 0) return 0;
  
  return Math.round((matchedWords / maxWords) * 80);
};

/**
 * Check if two team names match (fuzzy matching)
 */
const teamsMatch = (name1: string, name2: string): boolean => {
  return getTeamSimilarity(name1, name2) >= 50;
};

/**
 * Find the best matching live score for a match
 */
const findBestMatch = (
  homeTeam: string, 
  awayTeam: string, 
  matchTitle: string,
  liveScores: LiveScore[]
): { score: LiveScore; swapped: boolean } | null => {
  let bestMatch: { score: LiveScore; swapped: boolean; similarity: number } | null = null;
  
  for (const score of liveScores) {
    // Try normal order
    const homeSim = getTeamSimilarity(score.homeTeam, homeTeam);
    const awaySim = getTeamSimilarity(score.awayTeam, awayTeam);
    const normalScore = (homeSim + awaySim) / 2;
    
    if (normalScore >= 50 && (!bestMatch || normalScore > bestMatch.similarity)) {
      bestMatch = { score, swapped: false, similarity: normalScore };
    }
    
    // Try swapped order
    const homeSwappedSim = getTeamSimilarity(score.homeTeam, awayTeam);
    const awaySwappedSim = getTeamSimilarity(score.awayTeam, homeTeam);
    const swappedScore = (homeSwappedSim + awaySwappedSim) / 2;
    
    if (swappedScore >= 50 && (!bestMatch || swappedScore > bestMatch.similarity)) {
      bestMatch = { score, swapped: true, similarity: swappedScore };
    }
    
    // Also try matching against the match title
    if (matchTitle) {
      const titleLower = matchTitle.toLowerCase();
      const scoreTeams = `${score.homeTeam} ${score.awayTeam}`.toLowerCase();
      
      // Check if both teams from the score appear in the title
      const homeInTitle = titleLower.includes(normalizeTeamName(score.homeTeam).split(' ')[0]);
      const awayInTitle = titleLower.includes(normalizeTeamName(score.awayTeam).split(' ')[0]);
      
      if (homeInTitle && awayInTitle) {
        const titleSimilarity = 75;
        if (!bestMatch || titleSimilarity > bestMatch.similarity) {
          bestMatch = { score, swapped: false, similarity: titleSimilarity };
        }
      }
    }
  }
  
  return bestMatch ? { score: bestMatch.score, swapped: bestMatch.swapped } : null;
};

/**
 * Enrich matches with live score data
 */
export const enrichMatchesWithLiveScores = (matches: Match[], liveScores: LiveScore[]): Match[] => {
  if (!liveScores.length) {
    console.log('📊 No live scores available for enrichment');
    return matches;
  }

  console.log(`📊 Attempting to enrich ${matches.length} matches with ${liveScores.length} live scores`);
  let matchedCount = 0;
  
  const enriched = matches.map(match => {
    const homeTeam = match.teams?.home?.name || '';
    const awayTeam = match.teams?.away?.name || '';

    // Find best matching live score
    const bestMatch = findBestMatch(homeTeam, awayTeam, match.title, liveScores);

    if (bestMatch) {
      matchedCount++;
      const { score, swapped } = bestMatch;
      
      console.log(`✅ Matched: "${homeTeam}" vs "${awayTeam}" → "${score.homeTeam}" vs "${score.awayTeam}" (${score.homeScore}-${score.awayScore})`);
      
      return {
        ...match,
        home_score: swapped ? score.awayScore : score.homeScore,
        away_score: swapped ? score.homeScore : score.awayScore,
        status: score.status,
        progress: score.progress || undefined,
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
