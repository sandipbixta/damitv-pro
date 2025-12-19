import { QueryClient } from "@tanstack/react-query";

// Check if user is online
const isOnline = () => typeof navigator !== 'undefined' ? navigator.onLine : true;

// Optimized query client with aggressive caching for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus - reduces unnecessary API calls
      refetchOnWindowFocus: false,
      // Retry with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!isOnline()) return false;
        // Retry up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes (increased from 15)
      cacheTime: 30 * 60 * 1000,
      // Don't refetch on mount if data exists and is fresh
      refetchOnMount: false,
      // Refetch when coming back online
      refetchOnReconnect: true,
      // Network mode for better offline handling
      networkMode: 'offlineFirst',
    },
  },
});

// Query keys for consistent caching
export const QUERY_KEYS = {
  POPULAR_MATCHES: ['popular-matches'] as const,
  LIVE_MATCHES: ['live-matches'] as const,
  LIVE_SCORES: (sport: string) => ['live-scores', sport] as const,
  SPORTS: ['sports'] as const,
  CHANNELS: ['channels'] as const,
  CHANNEL_STREAM: (name: string, code: string) => ['channel-stream', name, code] as const,
  HIGHLIGHTS: ['highlights'] as const,
  LEAGUES: ['leagues'] as const,
  LEAGUE_DETAIL: (id: string) => ['league-detail', id] as const,
  MATCH_DETAIL: (sportId: string, matchId: string) => ['match-detail', sportId, matchId] as const,
  TEAM_STATS: (team: string, sport: string) => ['team-stats', team, sport] as const,
  ALL_MATCHES: ['all-matches'] as const,
} as const;

// Prefetch data for faster navigation
export const prefetchQueries = async () => {
  console.log('🚀 Prefetching critical data...');
  
  // Import and run prefetch
  try {
    const { prefetchCriticalData } = await import('@/hooks/usePrefetch');
    await prefetchCriticalData();
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Back online - refetching stale data');
    queryClient.refetchQueries({ stale: true });
  });
  
  window.addEventListener('offline', () => {
    console.log('📴 Offline - using cached data');
  });
}
