import { Match } from '@/types/sports';

// Fetch viewer counts directly from streamed.pk stream API
const STREAM_API_BASE = 'https://streamed.pk/api';

// CORS proxies (streamed.pk has CORS enabled, but fallback just in case)
const CORS_PROXIES = [
  '', // Direct first
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Cache for viewer counts (3 minute cache)
interface ViewerCountCache {
  count: number;
  timestamp: number;
}

const viewerCountCache = new Map<string, ViewerCountCache>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

const FETCH_TIMEOUT = 4000;

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

// Fetch viewer count from streamed.pk stream API
const fetchViewersFromStreamAPI = async (source: string, id: string): Promise<number | null> => {
  const apiUrl = `${STREAM_API_BASE}/stream/${source}/${id}`;

  for (const proxy of CORS_PROXIES) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(apiUrl)}` : apiUrl;
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

      if (response.ok) {
        const data = await response.json();
        // Stream API returns array of streams, each with viewers
        if (Array.isArray(data) && data.length > 0) {
          // Sum up viewers from all streams, or take the max
          const maxViewers = Math.max(...data.map((s: any) => s.viewers || 0));
          return maxViewers > 0 ? maxViewers : null;
        }
      }
      return null;
    } catch {
      continue; // Try next proxy
    }
  }
  return null;
};

/**
 * Check if a match is currently live
 */
export const isMatchLive = (match: Match): boolean => {
  if (!match.date) return false;

  const matchTime = new Date(match.date).getTime();
  const now = Date.now();

  const hasStarted = matchTime <= now;
  const maxDuration = 3 * 60 * 60 * 1000;
  const hasEnded = now > matchTime + maxDuration;

  return hasStarted && !hasEnded;
};

const validateViewerCount = (viewers: any): number | null => {
  if (typeof viewers !== 'number' || viewers < 0 || !isFinite(viewers)) {
    return null;
  }
  return Math.floor(viewers);
};

// Preferred sources for viewer counts (these have accurate data)
const PREFERRED_SOURCES = ['admin', 'alpha', 'charlie'];

/**
 * Fetch viewer count for a match from streamed.pk
 */
export const fetchMatchViewerCount = async (match: Match): Promise<number | null> => {
  if (!isMatchLive(match)) return null;

  // Check cache
  const cacheKey = match.id;
  const cached = viewerCountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }

  if (!match.sources || match.sources.length === 0) return null;

  try {
    // Try preferred sources first
    const preferredSource = match.sources.find(s => PREFERRED_SOURCES.includes(s.source));
    const sourceToUse = preferredSource || match.sources[0];

    const viewerCount = await fetchViewersFromStreamAPI(sourceToUse.source, sourceToUse.id);
    const validated = validateViewerCount(viewerCount);

    if (validated !== null && validated > 0) {
      viewerCountCache.set(cacheKey, { count: validated, timestamp: Date.now() });
      return validated;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Fetch viewer count from a specific source
 */
export const fetchViewerCountFromSource = async (
  source: string,
  id: string
): Promise<number | null> => {
  try {
    const viewers = await fetchViewersFromStreamAPI(source, id);
    return validateViewerCount(viewers);
  } catch {
    return null;
  }
};

/**
 * Fetch viewer counts for multiple matches - batch with limited concurrency
 */
export const fetchBatchViewerCounts = async (
  matches: Match[]
): Promise<Map<string, number>> => {
  const viewerCounts = new Map<string, number>();
  const liveMatches = matches.filter(isMatchLive);

  if (liveMatches.length === 0) return viewerCounts;

  console.log(`🔄 Fetching viewer counts for ${liveMatches.length} live matches`);

  // Check cache first
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

  const concurrentLimit = 6;
  const limitedMatches = uncachedMatches.slice(0, 20);

  for (let i = 0; i < limitedMatches.length; i += concurrentLimit) {
    const batch = limitedMatches.slice(i, i + concurrentLimit);

    const promises = batch.map(async (match) => {
      const count = await fetchMatchViewerCount(match);
      if (count !== null && count > 0) {
        viewerCounts.set(match.id, count);
      }
    });

    await Promise.allSettled(promises);
  }

  console.log(`✅ Found ${viewerCounts.size} matches with viewer data`);
  return viewerCounts;
};

/**
 * Enrich matches with viewer counts
 */
export const enrichMatchesWithViewers = async (matches: Match[]): Promise<Match[]> => {
  const viewerCounts = await fetchBatchViewerCounts(matches);

  return matches.map(match => {
    const viewerCount = viewerCounts.get(match.id);
    return {
      ...match,
      viewerCount: viewerCount ?? undefined,
      popular: viewerCount !== undefined ? true : match.popular
    };
  });
};

/**
 * Format viewer count with K/M suffixes
 */
export const formatViewerCount = (count: number, rounded: boolean = false): string => {
  if (rounded) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

/**
 * Clear cache
 */
export const clearViewerCountCache = (matchId?: string) => {
  if (matchId) {
    viewerCountCache.delete(matchId);
  } else {
    viewerCountCache.clear();
  }
};
