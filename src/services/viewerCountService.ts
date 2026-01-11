import { Match } from '@/types/sports';

// Track which endpoints work (smart selection)
// We keep a structured config (not string templates) to avoid invalid cached URLs.
type WorkingEndpoint =
  | { kind: 'direct'; baseUrl: string }
  | { kind: 'proxy'; proxyBase: string; baseUrl: string }
  | null;

let workingEndpoint: WorkingEndpoint = null;
let lastEndpointCheck = 0;
const ENDPOINT_CHECK_INTERVAL = 60 * 1000; // Re-check every 60 seconds

// API endpoints to try (direct calls - no edge function)
const API_BASES = [
  'https://streamed.pk/api',
  'https://streamed.su/api',
  'https://sportsrc.org/api'
];

// CORS proxy fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Cache for viewer counts to minimize API calls (5 minute cache)
interface ViewerCountCache {
  count: number;
  timestamp: number;
}

const viewerCountCache = new Map<string, ViewerCountCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fast timeout for API calls (2 seconds instead of browser default ~30s)
const FETCH_TIMEOUT = 2000;

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

const buildWorkingUrl = (endpoint: string, cfg: Exclude<WorkingEndpoint, null>) => {
  if (cfg.kind === 'direct') {
    return `${cfg.baseUrl}/${endpoint}`;
  }
  const targetUrl = `${cfg.baseUrl}/${endpoint}`;
  return `${cfg.proxyBase}${encodeURIComponent(targetUrl)}`;
};

// Direct API fetch with smart endpoint selection and fast timeout
const fetchFromApi = async (endpoint: string): Promise<any> => {
  const now = Date.now();

  // If we have a working endpoint and it's recent, use it directly
  if (workingEndpoint && now - lastEndpointCheck < ENDPOINT_CHECK_INTERVAL) {
    try {
      const url = buildWorkingUrl(endpoint, workingEndpoint);
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Working endpoint failed, reset and try all
      workingEndpoint = null;
    }
  }

  // Try direct calls first (fast timeout)
  for (const baseUrl of API_BASES) {
    try {
      const url = `${baseUrl}/${endpoint}`;
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

      if (response.ok) {
        // Remember this endpoint works
        workingEndpoint = { kind: 'direct', baseUrl };
        lastEndpointCheck = now;
        return await response.json();
      }
    } catch {
      // Silent fail, try next
    }
  }

  // Try ONE CORS proxy only (fastest one)
  const proxyBase = CORS_PROXIES[0];
  for (const baseUrl of API_BASES) {
    try {
      const targetUrl = `${baseUrl}/${endpoint}`;
      const proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;

      const response = await fetchWithTimeout(proxyUrl, FETCH_TIMEOUT);

      if (response.ok) {
        workingEndpoint = { kind: 'proxy', proxyBase, baseUrl };
        lastEndpointCheck = now;
        return await response.json();
      }
    } catch {
      // Silent fail
    }
  }

  return null;
};

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
 * Fetch viewer count from stream API for a specific source (fast, with timeout)
 */
export const fetchViewerCountFromSource = async (
  source: string,
  id: string
): Promise<number | null> => {
  try {
    const data = await fetchFromApi(`stream/${source}/${id}`);

    if (!data) {
      return null;
    }
    
    // Check if viewers field exists and is valid
    if (data && typeof data.viewers === 'number') {
      return validateViewerCount(data.viewers);
    }
    
    // If it's an array, check the first stream
    if (Array.isArray(data) && data.length > 0 && typeof data[0].viewers === 'number') {
      return validateViewerCount(data[0].viewers);
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Fetch viewer count for a match (tries first source only for speed)
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

  // Only try FIRST source for speed (not all sources)
  if (!match.sources || match.sources.length === 0) {
    return null;
  }

  try {
    // Just fetch from the first source (fastest approach)
    const firstSource = match.sources[0];
    const viewerCount = await fetchViewerCountFromSource(firstSource.source, firstSource.id);
    
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
  const limitedMatches = uncachedMatches.slice(0, Math.min(uncachedMatches.length, 12));
  
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
