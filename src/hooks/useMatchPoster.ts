import { useState, useEffect } from 'react';

// In-memory cache for poster images
const posterCache = new Map<string, string | null>();

export const useMatchPoster = (
  homeTeam: string | undefined,
  awayTeam: string | undefined
): { poster: string | null; isLoading: boolean } => {
  const [poster, setPoster] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!homeTeam || !awayTeam) {
      setPoster(null);
      return;
    }

    const cacheKey = `${homeTeam}-${awayTeam}`.toLowerCase();
    
    // Check cache first
    if (posterCache.has(cacheKey)) {
      setPoster(posterCache.get(cacheKey) || null);
      return;
    }

    const fetchPoster = async () => {
      setIsLoading(true);
      
      try {
        // Try searching for the event by team names
        const searchQuery = encodeURIComponent(`${homeTeam} vs ${awayTeam}`);
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${searchQuery}`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok) {
          const data = await response.json();
          const event = data?.event?.[0];
          
          // TheSportsDB provides strThumb (portrait) and strPoster
          const posterUrl = event?.strThumb || event?.strPoster || null;
          
          if (posterUrl) {
            posterCache.set(cacheKey, posterUrl);
            setPoster(posterUrl);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: Try searching by home team name to get team badge
        const teamResponse = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(homeTeam)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const team = teamData?.teams?.[0];
          // strTeamBadge is the team logo/badge
          const teamBadge = team?.strTeamBadge || null;
          posterCache.set(cacheKey, teamBadge);
          setPoster(teamBadge);
        } else {
          posterCache.set(cacheKey, null);
          setPoster(null);
        }
      } catch (error) {
        console.warn('Failed to fetch poster from TheSportsDB:', error);
        posterCache.set(cacheKey, null);
        setPoster(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoster();
  }, [homeTeam, awayTeam]);

  return { poster, isLoading };
};
