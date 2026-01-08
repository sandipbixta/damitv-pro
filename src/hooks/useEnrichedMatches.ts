import { useState, useEffect } from 'react';
import { Match } from '@/types/sports';

/**
 * Hook that returns matches sorted by date
 * Viewer counts are now lazy-loaded on the match page only (not on listing pages)
 * This dramatically reduces API calls to boho-sport
 */
export const useEnrichedMatches = (matches: Match[]) => {
  const [enrichedMatches, setEnrichedMatches] = useState<Match[]>(matches);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (matches.length === 0) {
      setEnrichedMatches([]);
      return;
    }

    setLoading(true);
    
    // Simply sort matches by date - no API calls for viewer counts
    // Viewer counts will be fetched only when user clicks play on match page
    const sorted = [...matches].sort((a, b) => {
      const aLive = a.date <= Date.now();
      const bLive = b.date <= Date.now();

      // Priority 1: Live matches first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Priority 2: Date
      return (a.date || 0) - (b.date || 0);
    });

    setEnrichedMatches(sorted);
    setLoading(false);
  }, [matches]);

  return { enrichedMatches, loading };
};
