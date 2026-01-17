import { supabase } from '@/integrations/supabase/client';

export interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  progress: string | null;
  isLive: boolean;
}

// Cache for live scores to reduce API calls
const scoreCache = new Map<string, { score: LiveScore; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

// Normalize team name for matching
const normalizeTeamName = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Generate cache key from team names
const getCacheKey = (homeTeam: string, awayTeam: string): string => {
  return `${normalizeTeamName(homeTeam)}|${normalizeTeamName(awayTeam)}`;
};

// Check if cache is valid
const isCacheValid = (cacheEntry: { score: LiveScore; timestamp: number } | undefined): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// Fetch live score for a single match
export async function fetchLiveScore(homeTeam: string, awayTeam: string): Promise<LiveScore | null> {
  const cacheKey = getCacheKey(homeTeam, awayTeam);
  
  // Check cache first
  const cached = scoreCache.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached!.score;
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-match-details', {
      body: {
        searchTeams: {
          homeTeam,
          awayTeam,
        },
        includeLineups: false,
        includeTimeline: false,
      },
    });

    if (error || !data?.success || !data?.match) {
      return null;
    }

    const match = data.match;
    const liveScore: LiveScore = {
      homeTeam: match.homeTeam || homeTeam,
      awayTeam: match.awayTeam || awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      progress: match.progress || match.status,
      isLive: match.isLive || false,
    };

    // Cache the result
    scoreCache.set(cacheKey, { score: liveScore, timestamp: Date.now() });
    
    return liveScore;
  } catch (e) {
    console.error('Error fetching live score:', e);
    return null;
  }
}

// Batch fetch live scores for multiple matches (with rate limiting)
export async function fetchLiveScoresForMatches(
  matches: Array<{ homeTeam: string; awayTeam: string }>
): Promise<Map<string, LiveScore>> {
  const results = new Map<string, LiveScore>();
  
  // Process in parallel with a limit of 3 concurrent requests
  const batchSize = 3;
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    const promises = batch.map(async ({ homeTeam, awayTeam }) => {
      const score = await fetchLiveScore(homeTeam, awayTeam);
      if (score) {
        results.set(getCacheKey(homeTeam, awayTeam), score);
      }
    });
    
    await Promise.all(promises);
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < matches.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

// Get cached score if available (no API call)
export function getCachedScore(homeTeam: string, awayTeam: string): LiveScore | null {
  const cacheKey = getCacheKey(homeTeam, awayTeam);
  const cached = scoreCache.get(cacheKey);
  return isCacheValid(cached) ? cached!.score : null;
}

// Clear score cache
export function clearScoreCache(): void {
  scoreCache.clear();
}
