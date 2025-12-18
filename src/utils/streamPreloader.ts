import { Match, Stream } from '../types/sports';
import { fetchAllMatchStreams } from '../api/sportsApi';

const PRELOAD_CACHE_KEY = 'damitv_preload_cache';
const PRELOAD_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track which matches are currently being preloaded
const preloadingMatches = new Set<string>();

// Get cached preloaded streams
export const getPreloadedStreams = (matchId: string): Stream[] | null => {
  try {
    const cached = localStorage.getItem(`${PRELOAD_CACHE_KEY}_${matchId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < PRELOAD_CACHE_DURATION) {
        return parsed.streams;
      }
    }
  } catch {
    // Silent fail
  }
  return null;
};

// Cache preloaded streams
const cachePreloadedStreams = (matchId: string, streams: Stream[]) => {
  try {
    localStorage.setItem(`${PRELOAD_CACHE_KEY}_${matchId}`, JSON.stringify({
      streams,
      timestamp: Date.now()
    }));
  } catch {
    // Storage might be full, clean old entries
    cleanOldPreloadCache();
  }
};

// Clean old preload cache entries
const cleanOldPreloadCache = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PRELOAD_CACHE_KEY));
    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp > PRELOAD_CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Silent fail
  }
};

// Preload streams for a match (called on hover)
export const preloadMatchStreams = async (match: Match): Promise<void> => {
  // Skip if already preloaded or currently preloading
  if (preloadingMatches.has(match.id)) return;
  if (getPreloadedStreams(match.id)) return;
  
  // Skip if match has no sources
  if (!match.sources || match.sources.length === 0) return;
  
  preloadingMatches.add(match.id);
  
  try {
    console.log(`🔮 Preloading streams for: ${match.title}`);
    const result = await fetchAllMatchStreams(match);
    
    if (result.streams.length > 0) {
      cachePreloadedStreams(match.id, result.streams);
      console.log(`✅ Preloaded ${result.streams.length} streams for: ${match.title}`);
    }
  } catch (error) {
    console.log(`⚠️ Preload failed for: ${match.title}`);
  } finally {
    preloadingMatches.delete(match.id);
  }
};

// Debounced preloader - waits 200ms before preloading
let preloadTimeout: ReturnType<typeof setTimeout> | null = null;

export const preloadOnHover = (match: Match) => {
  if (preloadTimeout) {
    clearTimeout(preloadTimeout);
  }
  
  preloadTimeout = setTimeout(() => {
    preloadMatchStreams(match);
  }, 200);
};

export const cancelPreload = () => {
  if (preloadTimeout) {
    clearTimeout(preloadTimeout);
    preloadTimeout = null;
  }
};
