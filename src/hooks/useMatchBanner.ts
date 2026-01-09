import { useState, useEffect } from 'react';

interface BannerCache {
  [key: string]: string | null;
}

// In-memory cache to prevent redundant API calls
const bannerCache: BannerCache = {};

// TheSportsDB API key (free tier)
const SPORTSDB_API_KEY = '3';

export const useMatchBanner = (
  matchTitle: string | undefined,
  homeTeam?: string,
  awayTeam?: string,
  existingBanner?: string
) => {
  const [banner, setBanner] = useState<string | null>(existingBanner || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If we already have a banner, use it
    if (existingBanner) {
      setBanner(existingBanner);
      return;
    }

    if (!homeTeam && !awayTeam && !matchTitle) {
      setBanner(null);
      return;
    }

    // Create cache key from teams or title
    const cacheKey = `${homeTeam || ''}_${awayTeam || ''}_${matchTitle || ''}`.toLowerCase().trim();

    // Check cache
    if (cacheKey in bannerCache) {
      setBanner(bannerCache[cacheKey]);
      return;
    }

    const fetchBanner = async () => {
      setIsLoading(true);
      try {
        // Try to search for the event using team names
        const searchQuery = homeTeam && awayTeam 
          ? `${homeTeam}_vs_${awayTeam}`.replace(/\s+/g, '_')
          : matchTitle?.replace(/\s+vs\s+/i, '_vs_').replace(/\s+/g, '_') || '';

        if (!searchQuery) {
          bannerCache[cacheKey] = null;
          setBanner(null);
          return;
        }

        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchevents.php?e=${encodeURIComponent(searchQuery)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch from TheSportsDB');
        }

        const data = await response.json();

        if (data.event && data.event.length > 0) {
          // Look for banner first, then thumb, then fanart
          const event = data.event[0];
          const bannerUrl = event.strBanner || event.strThumb || event.strFanart1 || null;
          
          bannerCache[cacheKey] = bannerUrl;
          setBanner(bannerUrl);
        } else {
          // No event found, try searching by team name for team banner
          if (homeTeam) {
            const teamResponse = await fetch(
              `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(homeTeam)}`
            );

            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              if (teamData.teams && teamData.teams.length > 0) {
                const team = teamData.teams[0];
                const teamBanner = team.strBanner || team.strFanart1 || team.strStadiumThumb || null;
                bannerCache[cacheKey] = teamBanner;
                setBanner(teamBanner);
                return;
              }
            }
          }
          
          bannerCache[cacheKey] = null;
          setBanner(null);
        }
      } catch (err) {
        console.error('Failed to fetch match banner:', err);
        bannerCache[cacheKey] = null;
        setBanner(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
  }, [matchTitle, homeTeam, awayTeam, existingBanner]);

  return { banner, isLoading };
};
