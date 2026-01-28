import { Match } from '@/types/sports';

// Use our own proxy server (hosted on VPS) - no CORS issues
const VIEWER_PROXY_URL = 'https://damitv.pro/api/viewers/streamed';

// Cache for viewer counts to minimize API calls (5 minute cache)
interface ViewerCountCache {
  count: number;
  timestamp: number;
}

const viewerCountCache = new Map<string, ViewerCountCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fast timeout for API calls (5 seconds)
const FETCH_TIMEOUT = 5000;

const fetchWithTimeout = async (url: string, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Fetch viewer count from our proxy server (no CORS issues)
const fetchViewersFromProxy = async (source: string, id: string): Promise<number | null> => {
  try {
    const url = `${VIEWER_PROXY_URL}?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.viewers === 'number') {
        return data.viewers;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if a match is currently live
 */
export const isMatchLive = (match: Match): boolean => {
  if (!match.date) return false;

  const matchTime = new Date(match.date).getTime();
  const now = Date.now();

  // Match has started
  const hasStarted = matchTime <= now;

  // Match hasn't ended (assume 3 hours max duration)
  const maxDuration = 3 * 60 * 60 * 1000; // 3 hours in ms
  const hasEnded = now > matchTime + maxDuration;

  return hasStarted && !hasEnded;
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
 * Fetch viewer count from stream API for a specific source
 * Uses our own proxy server to avoid CORS issues
 */
export const fetchViewerCountFromSource = async (
  source: string,
  id: string
): Promise<number | null> => {
  try {
    const viewers = await fetchViewersFromProxy(source, id);
    return validateViewerCount(viewers);
  } catch {
    return null;
  }
};

// Preferred sources for viewer counts (these have accurate data)
const PREFERRED_SOURCES = ['admin', 'alpha'];

/**
 * Fetch viewer count for a match (prioritizes admin/alpha sources)
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

  if (!match.sources || match.sources.length === 0) {
    return null;
  }

  try {
    // Prioritize admin/alpha sources (they have accurate viewer counts)
    const preferredSource = match.sources.find(s => PREFERRED_SOURCES.includes(s.source));
    const sourceToUse = preferredSource || match.sources[0];

    const viewerCount = await fetchViewerCountFromSource(sourceToUse.source, sourceToUse.id);
    
    if (viewerCount !== null && viewerCount > 0) {
      // Cache the result
      viewerCountCache.set(cacheKey, {
        count: viewerCount,
        timestamp: Date.now()
      });
      return viewerCount;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Fetch viewer counts for multiple matches - FAST batch with limited concurrency
 */
export const fetchBatchViewerCounts = async (
  matches: Match[]
): Promise<Map<string, number>> => {
  const viewerCounts = new Map<string, number>();
  
  // Filter to only live matches
  const liveMatches = matches.filter(isMatchLive);
  
  if (liveMatches.length === 0) {
    return viewerCounts;
  }
  
  console.log(`🔄 Refreshing viewer counts for ${liveMatches.length} matches`);
  
  // Check cache first and only fetch for uncached matches
  const uncachedMatches: Match[] = [];
  for (const match of liveMatches) {
    const cached = viewerCountCache.get(match.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      viewerCounts.set(match.id, cached.count);
    } else {
      uncachedMatches.push(match);
    }
  }
  
  if (uncachedMatches.length === 0) {
    console.log(`✅ All ${viewerCounts.size} matches served from cache`);
    return viewerCounts;
  }
  
  // Limit to 8 concurrent requests to avoid overwhelming APIs
  const concurrentLimit = 8;
  const limitedMatches = uncachedMatches.slice(0, Math.min(uncachedMatches.length, 20));
  
  // Process in small batches
  for (let i = 0; i < limitedMatches.length; i += concurrentLimit) {
    const batch = limitedMatches.slice(i, i + concurrentLimit);
    
    const promises = batch.map(async (match) => {
      const count = await fetchMatchViewerCount(match);
      if (count !== null && count > 0) {
        viewerCounts.set(match.id, count);
      }
    });
    
    // Use Promise.allSettled to not fail on individual errors
    await Promise.allSettled(promises);
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
