import { useCallback, useRef } from 'react';
import { queryClient, QUERY_KEYS } from '@/lib/queryClient';
import { Match } from '@/types/sports';
import { fetchMatch, fetchAllMatchStreams } from '@/api/sportsApi';

// Debounce delay before prefetching
const PREFETCH_DELAY = 150;

// Track what's already being prefetched
const prefetchingSet = new Set<string>();

/**
 * Hook for prefetching match data on hover
 * Improves perceived performance by loading data before navigation
 */
export function usePrefetchMatch() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetchMatch = useCallback((match: Match) => {
    // Clear any pending prefetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const cacheKey = `match-${match.id}`;
    
    // Skip if already prefetching or cached
    if (prefetchingSet.has(cacheKey)) return;
    
    // Check if already in React Query cache
    const existingData = queryClient.getQueryData(
      QUERY_KEYS.MATCH_DETAIL(match.category || 'sports', match.id)
    );
    if (existingData) return;

    timeoutRef.current = setTimeout(async () => {
      prefetchingSet.add(cacheKey);
      
      try {
        // Prefetch match details
        await queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.MATCH_DETAIL(match.category || 'sports', match.id),
          queryFn: () => fetchMatch(match.category || 'sports', match.id),
          staleTime: 5 * 60 * 1000,
        });

        // Also prefetch streams if match has sources
        if (match.sources && match.sources.length > 0) {
          try {
            await fetchAllMatchStreams(match);
            console.log(`🔮 Prefetched: ${match.title}`);
          } catch {
            // Stream prefetch is optional, don't fail
          }
        }
      } catch (error) {
        console.log(`⚠️ Prefetch failed for: ${match.title}`);
      } finally {
        prefetchingSet.delete(cacheKey);
      }
    }, PREFETCH_DELAY);
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { prefetchMatch, cancelPrefetch };
}

/**
 * Prefetch critical data on app load
 */
export async function prefetchCriticalData() {
  console.log('🚀 Prefetching critical data...');
  
  try {
    // Prefetch popular matches first (most important)
    const popularMatchesPromise = import('@/hooks/usePopularMatches').then(
      module => module.preloadPopularMatches()
    );

    // Wait for critical data
    await Promise.race([
      popularMatchesPromise,
      new Promise(resolve => setTimeout(resolve, 3000)), // 3s timeout
    ]);

    console.log('✅ Critical data prefetched');
  } catch (error) {
    console.warn('⚠️ Failed to prefetch some data:', error);
  }
}

export default usePrefetchMatch;
