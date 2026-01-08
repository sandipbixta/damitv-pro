import { Match } from '@/types/sports';

// Cache for viewer counts to minimize API calls (5 minute cache)
interface ViewerCountCache {
  count: number;
  timestamp: number;
}

const viewerCountCache = new Map<string, ViewerCountCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a match is currently live
 */
export const isMatchLive = (match: Match): boolean => {
  if (!match.date) return false;
  return new Date(match.date).getTime() <= new Date().getTime();
};

/**
 * Validate viewer count from API response
 */
const validateViewerCount = (viewers: any): number | null => {
  if (typeof viewers !== 'number' || viewers < 0 || !isFinite(viewers)) {
    return null;
  }
  return Math.floor(viewers);
};

/**
 * Generate a simulated viewer count based on match/source info
 * This replaces Supabase edge function calls
 */
const generateSimulatedViewerCount = (source: string, id: string): number => {
  // Create a hash-like number from source and id for consistency
  const hash = (source + id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Generate viewer count between 500 and 15000
  const baseCount = (hash % 10000) + 500;
  // Add some time-based variation
  const timeVariation = Math.floor(Math.sin(Date.now() / 60000) * 200);
  return Math.max(100, baseCount + timeVariation);
};

/**
 * Fetch viewer count for a specific source (simulated - no Supabase)
 */
export const fetchViewerCountFromSource = async (
  source: string,
  id: string
): Promise<number | null> => {
  try {
    // Return simulated viewer count
    return generateSimulatedViewerCount(source, id);
  } catch (error) {
    console.warn(`Failed to get viewer count for ${source}/${id}:`, error);
    return null;
  }
};

/**
 * Fetch viewer count for a match (tries all sources)
 */
export const fetchMatchViewerCount = async (match: Match): Promise<number | null> => {
  // Only fetch for live matches
  if (!isMatchLive(match)) {
    return null;
  }

  // Check cache first
  const cacheKey = match.id;
  const cached = viewerCountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }

  // Try all sources and sum up viewer counts
  if (!match.sources || match.sources.length === 0) {
    return null;
  }

  try {
    const viewerPromises = match.sources.map(source =>
      fetchViewerCountFromSource(source.source, source.id)
    );

    const results = await Promise.all(viewerPromises);
    const validCounts = results.filter((count): count is number => count !== null);

    if (validCounts.length === 0) {
      return null;
    }

    // Sum up all valid viewer counts
    const totalViewers = validCounts.reduce((sum, count) => sum + count, 0);

    // Cache the result
    viewerCountCache.set(cacheKey, {
      count: totalViewers,
      timestamp: Date.now()
    });

    return totalViewers;
  } catch (error) {
    console.error(`Error fetching viewer count for match ${match.id}:`, error);
    return null;
  }
};

/**
 * Fetch viewer counts for multiple matches in batch
 */
export const fetchBatchViewerCounts = async (
  matches: Match[]
): Promise<Map<string, number>> => {
  const viewerCounts = new Map<string, number>();
  
  // Filter to only live matches
  const liveMatches = matches.filter(isMatchLive);
  
  console.log(`🔄 Refreshing viewer counts for ${liveMatches.length} matches`);
  
  // Fetch in batches of 10 to speed up (parallel requests)
  const batchSize = 10;
  for (let i = 0; i < liveMatches.length; i += batchSize) {
    const batch = liveMatches.slice(i, i + batchSize);
    
    const promises = batch.map(async (match) => {
      const count = await fetchMatchViewerCount(match);
      if (count !== null && count > 0) {
        viewerCounts.set(match.id, count);
      }
    });
    
    await Promise.all(promises);
  }
  
  console.log(`✅ Found ${viewerCounts.size} matches with viewer data`);
  
  return viewerCounts;
};

/**
 * Enrich matches with viewer counts and mark popular ones
 */
export const enrichMatchesWithViewers = async (matches: Match[]): Promise<Match[]> => {
  const viewerCounts = await fetchBatchViewerCounts(matches);
  
  return matches.map(match => {
    const viewerCount = viewerCounts.get(match.id);
    
    return {
      ...match,
      viewerCount: viewerCount ?? undefined,
      // Mark as popular if it has valid viewer count
      popular: viewerCount !== undefined ? true : match.popular
    };
  });
};

/**
 * Format viewer count with K/M suffixes
 */
export const formatViewerCount = (count: number, rounded: boolean = false): string => {
  if (rounded) {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
  }
  return count.toLocaleString();
};

/**
 * Clear cache for a specific match or all
 */
export const clearViewerCountCache = (matchId?: string) => {
  if (matchId) {
    viewerCountCache.delete(matchId);
  } else {
    viewerCountCache.clear();
  }
};
