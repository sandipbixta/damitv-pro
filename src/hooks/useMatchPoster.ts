import { useState, useEffect } from 'react';

// In-memory cache for poster images
const posterCache = new Map<string, { url: string | null; isPoster: boolean }>();

export const useMatchPoster = (
  homeTeam: string | undefined,
  awayTeam: string | undefined
): { poster: string | null; isPoster: boolean; isLoading: boolean } => {
  const [poster, setPoster] = useState<string | null>(null);
  const [isPoster, setIsPoster] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!homeTeam || !awayTeam) {
      setPoster(null);
      return;
    }

    const cacheKey = `${homeTeam}-${awayTeam}`.toLowerCase();
    
    // Check cache first
    if (posterCache.has(cacheKey)) {
      const cached = posterCache.get(cacheKey)!;
      setPoster(cached.url);
      setIsPoster(cached.isPoster);
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
          
          // Prioritize strPoster (portrait) over strThumb (thumbnail/landscape)
          const hasPosterImage = !!event?.strPoster;
          const imageUrl = event?.strPoster || event?.strThumb || null;
          
          if (imageUrl) {
            posterCache.set(cacheKey, { url: imageUrl, isPoster: hasPosterImage });
            setPoster(imageUrl);
            setIsPoster(hasPosterImage);
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
          const teamBadge = team?.strTeamBadge || null;
          posterCache.set(cacheKey, { url: teamBadge, isPoster: false });
          setPoster(teamBadge);
          setIsPoster(false);
        } else {
          posterCache.set(cacheKey, { url: null, isPoster: false });
          setPoster(null);
          setIsPoster(false);
        }
      } catch (error) {
        console.warn('Failed to fetch poster from TheSportsDB:', error);
        posterCache.set(cacheKey, { url: null, isPoster: false });
        setPoster(null);
        setIsPoster(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoster();
  }, [homeTeam, awayTeam]);

  return { poster, isPoster, isLoading };
};
