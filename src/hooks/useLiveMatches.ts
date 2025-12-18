import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { Match, Stream, Source, Sport } from '../types/sports';
import { fetchMatches, fetchStream, fetchSports, fetchLiveMatches, fetchAllMatches } from '../api/sportsApi';
import { consolidateMatches, filterCleanMatches, isMatchLive } from '../utils/matchUtils';
import { useLiveScoreUpdates } from './useLiveScoreUpdates';

// LocalStorage cache keys
const CACHE_KEY_MATCHES = 'damitv_matches_cache_v2';
const CACHE_KEY_SPORTS = 'damitv_sports_cache_v2';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const getCachedMatches = (): { all: Match[]; live: Match[]; upcoming: Match[] } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_MATCHES);
    if (!cached) return null;
    
    const parsed: CachedData<{ all: Match[]; live: Match[]; upcoming: Match[] }> = JSON.parse(cached);
    // Return cached data even if expired - we'll refresh in background
    return parsed.data;
  } catch {
    return null;
  }
};

const getCachedSports = (): Sport[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_SPORTS);
    if (!cached) return null;
    
    const parsed: CachedData<Sport[]> = JSON.parse(cached);
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedMatches = (all: Match[], live: Match[], upcoming: Match[]) => {
  try {
    const cacheData: CachedData<{ all: Match[]; live: Match[]; upcoming: Match[] }> = {
      data: { all, live, upcoming },
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_MATCHES, JSON.stringify(cacheData));
  } catch (e) {
    // Storage full, try to clear old caches
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_') || key.includes('_cache')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(CACHE_KEY_MATCHES, JSON.stringify({
        data: { all, live, upcoming },
        timestamp: Date.now()
      }));
    } catch {
      console.warn('Failed to cache matches');
    }
  }
};

const setCachedSports = (sports: Sport[]) => {
  try {
    const cacheData: CachedData<Sport[]> = {
      data: sports,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_SPORTS, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Failed to cache sports:', e);
  }
};

const processMatches = (matches: Match[]) => {
  const matchesWithSources = matches.filter(m => m.sources && m.sources.length > 0);
  const cleanMatches = filterCleanMatches(matchesWithSources);
  const consolidatedMatches = consolidateMatches(cleanMatches);
  
  const live = consolidatedMatches.filter(match => {
    const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;
    
    return match.sources && 
           match.sources.length > 0 && 
           matchTime - now < oneHourInMs && 
           now - matchTime < sixHoursInMs;
  }).sort((a, b) => {
    const aTime = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
    const bTime = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
    return bTime - aTime;
  });
  
  const upcoming = consolidatedMatches.filter(match => 
    !live.some(liveMatch => liveMatch.id === match.id)
  );
  
  return { all: consolidatedMatches, live, upcoming };
};

export const useLiveMatches = () => {
  const { toast } = useToast();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const initialLoadDone = useRef(false);
  
  // Initialize live score updates from TheSportsDB
  useLiveScoreUpdates(30000); // Update every 30 seconds

  // Load cached data immediately on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const cachedMatches = getCachedMatches();
    const cachedSports = getCachedSports();
    
    if (cachedMatches && cachedMatches.all.length > 0) {
      console.log('⚡ Instant load from cache:', cachedMatches.all.length, 'matches');
      setAllMatches(cachedMatches.all);
      setLiveMatches(cachedMatches.live);
      setUpcomingMatches(cachedMatches.upcoming);
      setLoading(false); // Show cached data immediately
    }
    
    if (cachedSports && cachedSports.length > 0) {
      setSports(cachedSports);
    }
  }, []);

  const fetchLiveContent = useCallback(async () => {
    try {
      console.log('🔄 Fetching fresh matches in background...');
      
      // Fetch sports and football data in parallel
      const [sportsData, initialFootballMatches] = await Promise.all([
        fetchSports(),
        fetchMatches('football')
      ]);
      
      setSports(sportsData);
      setCachedSports(sportsData);
      
      // Process and display football matches
      const footballWithSport = initialFootballMatches.map(m => ({ ...m, sportId: 'football' }));
      const initialProcessed = processMatches(footballWithSport);
      
      // Update state with football data
      setAllMatches(initialProcessed.all);
      setLiveMatches(initialProcessed.live);
      setUpcomingMatches(initialProcessed.upcoming);
      setLoading(false);
      setCachedMatches(initialProcessed.all, initialProcessed.live, initialProcessed.upcoming);
      console.log('✅ Football matches loaded:', initialProcessed.live.length, 'live');
      
      // Fetch remaining sports in background
      const otherSports = ['basketball', 'cricket', 'fight', 'baseball', 'rugby'];
      
      const allSportPromises = otherSports.map(async (sportId) => {
        try {
          const matches = await fetchMatches(sportId);
          return matches.map(match => ({ ...match, sportId }));
        } catch (error) {
          console.error(`Error fetching matches for sport ${sportId}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(allSportPromises);
      const allOtherMatches = results.flat();
      
      // Merge all matches
      const allFetchedMatches = [...footballWithSport, ...allOtherMatches];
      const finalProcessed = processMatches(allFetchedMatches);
      
      console.log('✅ All matches loaded - Live:', finalProcessed.live.length, 'Upcoming:', finalProcessed.upcoming.length);
      
      // Update with complete data
      setAllMatches(finalProcessed.all);
      setLiveMatches(finalProcessed.live);
      setUpcomingMatches(finalProcessed.upcoming);
      setCachedMatches(finalProcessed.all, finalProcessed.live, finalProcessed.upcoming);
      
    } catch (error) {
      console.error('Error fetching live content:', error);
      setLoading(false);
      // Only show error if we have no cached data
      if (allMatches.length === 0) {
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [toast, retryCount, allMatches.length]);

  useEffect(() => {
    fetchLiveContent();
  }, [fetchLiveContent]);

  const handleRetryLoading = useCallback(() => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
    toast({
      title: "Refreshing",
      description: "Loading latest matches...",
    });
  }, [toast]);

  return {
    allMatches,
    liveMatches,
    upcomingMatches,
    sports,
    loading,
    handleRetryLoading
  };
};
