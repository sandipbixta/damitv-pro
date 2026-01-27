// Team logo hook - uses TheSportsDB API for high-quality logos and images
import { useState, useEffect } from 'react';
import { fetchTeamData, TeamData } from '@/services/theSportsDbApi';

// Local cache to avoid re-fetching during component re-renders
const localCache = new Map<string, TeamData | null>();

// Helper to get badge URL from streamed.pk
const getBadgeUrl = (badge: string | undefined): string | null => {
  if (!badge) return null;

  // If it's already a full URL, return as-is
  if (badge.startsWith('http://') || badge.startsWith('https://')) {
    return badge;
  }

  // If it's a relative path starting with /, prepend the base URL
  if (badge.startsWith('/')) {
    return `https://streamed.pk${badge}`;
  }

  // Otherwise, it's a badge ID - use the badge image endpoint
  return `https://streamed.pk/api/images/badge/${badge}.webp`;
};

export const useTeamLogo = (
  teamName: string | undefined,
  existingLogo?: string,
  badge?: string
) => {
  // Get fallback badge URL immediately
  const fallbackBadge = getBadgeUrl(badge);

  // Initialize with existing logo or fallback badge
  const [logo, setLogo] = useState<string | null>(existingLogo || fallbackBadge);
  const [fanart, setFanart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamName) {
      setLogo(fallbackBadge);
      setFanart(null);
      return;
    }

    // If we already have a valid logo URL from existing data, use it
    if (existingLogo && existingLogo.startsWith('http')) {
      setLogo(existingLogo);
      return;
    }

    // Set fallback badge immediately while we fetch from TheSportsDB
    if (fallbackBadge && !logo) {
      setLogo(fallbackBadge);
    }

    // Check local cache
    const cacheKey = teamName.toLowerCase().trim();
    if (localCache.has(cacheKey)) {
      const cached = localCache.get(cacheKey);
      if (cached) {
        setLogo(cached.badge || cached.logo || fallbackBadge);
        setFanart(cached.fanart || cached.banner || null);
      }
      return;
    }

    // Fetch from TheSportsDB API in background
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const teamData = await fetchTeamData(teamName);

        if (teamData && (teamData.badge || teamData.logo)) {
          localCache.set(cacheKey, teamData);
          setLogo(teamData.badge || teamData.logo);
          setFanart(teamData.fanart || teamData.banner || null);
        } else {
          // TheSportsDB failed or no data - keep using fallback badge
          if (fallbackBadge) {
            localCache.set(cacheKey, { logo: fallbackBadge, badge: fallbackBadge, fanart: null, banner: null });
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        // Keep fallback badge on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamName, existingLogo, badge, fallbackBadge]);

  return { logo: logo || fallbackBadge, fanart, isLoading };
};

// Hook to get both team logos and fanart for a match
export const useMatchTeamLogos = (
  homeTeam?: string | { name: string; logo?: string; badge?: string },
  awayTeam?: string | { name: string; logo?: string; badge?: string }
) => {
  const getTeamName = (team: string | { name: string } | undefined): string | undefined => {
    if (!team) return undefined;
    return typeof team === 'string' ? team : team.name;
  };

  const getTeamLogo = (team: string | { name: string; logo?: string } | undefined): string | undefined => {
    if (!team || typeof team === 'string') return undefined;
    return team.logo;
  };

  const getTeamBadge = (team: string | { name: string; badge?: string } | undefined): string | undefined => {
    if (!team || typeof team === 'string') return undefined;
    return (team as { badge?: string }).badge;
  };

  const homeName = getTeamName(homeTeam);
  const awayName = getTeamName(awayTeam);

  const { logo: homeLogo, fanart: homeFanart, isLoading: homeLoading } = useTeamLogo(
    homeName,
    getTeamLogo(homeTeam),
    getTeamBadge(homeTeam)
  );

  const { logo: awayLogo, fanart: awayFanart, isLoading: awayLoading } = useTeamLogo(
    awayName,
    getTeamLogo(awayTeam),
    getTeamBadge(awayTeam)
  );

  return {
    homeLogo,
    awayLogo,
    homeFanart,
    awayFanart,
    isLoading: homeLoading || awayLoading
  };
};
