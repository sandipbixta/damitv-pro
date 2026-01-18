import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Sport, Match } from '@/types/sports';
import { fetchSports, fetchAllMatches, fetchMatches } from '@/api/sportsApi';
import { consolidateMatches, filterCleanMatches } from '@/utils/matchUtils';

interface SportsDataContextType {
  sports: Sport[];
  allMatches: Match[];
  liveMatches: Match[];
  popularMatches: Match[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

// Cache duration: 5 minutes for refresh, 2 hours for localStorage
const REFRESH_INTERVAL = 5 * 60 * 1000;
const CACHE_KEY = 'damitv_matches_cache_v2';
const SPORTS_CACHE_KEY = 'damitv_sports_cache_v2';
const CACHE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours localStorage cache
const STALE_WHILE_REVALIDATE = 30 * 60 * 1000; // Show stale data for 30 mins while fetching

// Default sports (instant render, no API call needed)
const DEFAULT_SPORTS: Sport[] = [
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'american-football', name: 'American Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'fight', name: 'Fight' },
  { id: 'hockey', name: 'Hockey' },
  { id: 'baseball', name: 'Baseball' },
  { id: 'rugby', name: 'Rugby' },
  { id: 'motorsport', name: 'Motorsport' }
];

// Load cached data from localStorage - returns data even if stale (for instant render)
const loadFromCache = (): { matches: Match[]; sports: Sport[]; isStale: boolean } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const sportsCached = localStorage.getItem(SPORTS_CACHE_KEY);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const sportsData = sportsCached ? JSON.parse(sportsCached).data : DEFAULT_SPORTS;
      const age = Date.now() - timestamp;
      
      // Return cached data even if stale (up to 2 hours) for instant render
      if (age < CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
        const isStale = age > STALE_WHILE_REVALIDATE;
        console.log(`📦 Loading from cache (${isStale ? 'stale' : 'fresh'}, ${Math.round(age / 60000)}min old)`);
        return { matches: data, sports: sportsData, isStale };
      }
    }
  } catch (e) {
    console.log('Cache read error:', e);
  }
  return null;
};

// Save to localStorage cache
const saveToCache = (matches: Match[], sports: Sport[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: matches, timestamp: Date.now() }));
    localStorage.setItem(SPORTS_CACHE_KEY, JSON.stringify({ data: sports, timestamp: Date.now() }));
    console.log(`💾 Saved ${matches.length} matches to cache`);
  } catch (e) {
    console.log('Cache write error:', e);
  }
};

export const SportsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load cached data immediately on mount (synchronous, no render delay)
  const cachedData = useMemo(() => loadFromCache(), []);
  const needsBackgroundRefresh = useMemo(() => cachedData?.isStale ?? true, []);

  // Initialize with cached data or defaults for INSTANT render
  const [sports, setSports] = useState<Sport[]>(cachedData?.sports || DEFAULT_SPORTS);
  const [allMatches, setAllMatches] = useState<Match[]>(cachedData?.matches || []);
  const [loading, setLoading] = useState(!cachedData?.matches?.length);
  const [lastFetch, setLastFetch] = useState(cachedData && !cachedData.isStale ? Date.now() : 0);

  // Fetch all data (progressive: football first, then full refresh)
  const fetchData = useCallback(
    async (force = false) => {
      // Skip if data was fetched recently (unless forced)
      if (!force && Date.now() - lastFetch < REFRESH_INTERVAL && allMatches.length > 0) {
        console.log('📦 Using cached context data');
        return;
      }

      const hasAnyData = allMatches.length > 0 || sports.length > 0;
      if (!hasAnyData) setLoading(true);

      try {
        console.log('🔄 SportsDataContext: Fetching sports + initial football...');

        const [sportsData, initialFootballMatches] = await Promise.all([
          fetchSports(),
          fetchMatches('football')
        ]);

        // Sort sports with football first
        const sortedSports = sportsData.sort((a, b) => {
          if (a.name.toLowerCase() === 'football') return -1;
          if (b.name.toLowerCase() === 'football') return 1;
          return a.name.localeCompare(b.name);
        });

        setSports(sortedSports);

        // Show football matches ASAP for perceived performance (only if we don't already have data)
        if (allMatches.length === 0 && Array.isArray(initialFootballMatches) && initialFootballMatches.length > 0) {
          const initialMatchesWithSources = initialFootballMatches.filter(m => m.sources && m.sources.length > 0);
          const initialCleanMatches = filterCleanMatches(initialMatchesWithSources);
          const initialConsolidatedMatches = consolidateMatches(initialCleanMatches);
          setAllMatches(initialConsolidatedMatches);
          saveToCache(initialConsolidatedMatches, sortedSports);
        }

        // We have something to render now
        setLoading(false);

        // Full refresh (all sports) - updates in the background
        console.log('🔄 SportsDataContext: Fetching all matches (background)...');
        const matchesData = await fetchAllMatches();

        const matchesWithSources = matchesData.filter(m => m.sources && m.sources.length > 0);
        const cleanMatches = filterCleanMatches(matchesWithSources);
        const consolidatedMatches = consolidateMatches(cleanMatches);

        setAllMatches(consolidatedMatches);
        setLastFetch(Date.now());

        // Save to localStorage for instant load next time
        saveToCache(consolidatedMatches, sortedSports);

        console.log(
          `✅ SportsDataContext: Loaded ${sortedSports.length} sports, ${consolidatedMatches.length} matches`
        );
      } catch (error) {
        console.error('❌ SportsDataContext fetch error:', error);
      } finally {
        setLoading(false);
      }
    },
    [lastFetch, allMatches.length, sports.length]
  );

  // Initial fetch - use requestIdleCallback for non-blocking fetch if we have cached data
  useEffect(() => {
    if (cachedData?.matches?.length && !needsBackgroundRefresh) {
      // We have fresh cached data, no need to fetch immediately
      console.log('📦 Using fresh cache, skipping initial fetch');
      return;
    }

    // If we have stale data, show it immediately and refresh in background
    if (cachedData?.matches?.length && needsBackgroundRefresh) {
      console.log('🔄 Stale cache detected, refreshing in background...');
      // Use requestIdleCallback for non-blocking background refresh
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => fetchData(true), { timeout: 2000 });
      } else {
        setTimeout(() => fetchData(true), 100);
      }
      return;
    }

    // No cached data, fetch immediately
    fetchData();
  }, []);

  // Background refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Use requestIdleCallback for non-blocking refresh
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => fetchData(true), { timeout: 5000 });
      } else {
        fetchData(true);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Compute live matches from allMatches
  const liveMatches = useMemo(() => {
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;

    return allMatches.filter(match => {
      const matchTime = match.date;
      return match.sources && 
             match.sources.length > 0 && 
             matchTime - now < oneHourInMs && 
             now - matchTime < sixHoursInMs;
    }).sort((a, b) => b.date - a.date);
  }, [allMatches]);

  // Compute popular matches (with viewer counts)
  const popularMatches = useMemo(() => {
    return liveMatches
      .filter(m => (m.viewerCount || 0) > 0)
      .sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
      .slice(0, 12);
  }, [liveMatches]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const value = useMemo(() => ({
    sports,
    allMatches,
    liveMatches,
    popularMatches,
    loading,
    refresh
  }), [sports, allMatches, liveMatches, popularMatches, loading, refresh]);

  return (
    <SportsDataContext.Provider value={value}>
      {children}
    </SportsDataContext.Provider>
  );
};

// Default fallback when context is unavailable (prevents crash during hot-reload)
const defaultContextValue: SportsDataContextType = {
  sports: [],
  allMatches: [],
  liveMatches: [],
  popularMatches: [],
  loading: true,
  refresh: async () => {}
};

export const useSportsData = (): SportsDataContextType => {
  const context = useContext(SportsDataContext);
  if (context === undefined) {
    console.warn('useSportsData called outside SportsDataProvider - using default values');
    return defaultContextValue;
  }
  return context;
};
