import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { teamLogoService } from '@/services/teamLogoService';

interface TeamLogoCache {
  [key: string]: string | null;
}

// In-memory cache to prevent redundant API calls
const logoCache: TeamLogoCache = {};

export const useTeamLogo = (teamName: string | undefined, existingLogo?: string, badge?: string) => {
  const [logo, setLogo] = useState<string | null>(existingLogo || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamName) {
      setLogo(null);
      return;
    }

    // If we already have a logo from the match data, use it
    if (existingLogo) {
      setLogo(existingLogo);
      return;
    }

    // Check local service first (for badges from streamed API)
    const localLogo = teamLogoService.getTeamLogo(teamName, badge);
    if (localLogo) {
      setLogo(localLogo);
      return;
    }

    // Normalize team name for cache key
    const cacheKey = teamName.toLowerCase().trim();

    // Check cache
    if (cacheKey in logoCache) {
      setLogo(logoCache[cacheKey]);
      return;
    }

    // Fetch from TheSportsDB via edge function
    const fetchLogo = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-team-logo', {
          body: { teamName }
        });

        if (error) {
          console.error('Error fetching team logo:', error);
          logoCache[cacheKey] = null;
          setLogo(null);
          return;
        }

        if (data?.success && data?.logo_url) {
          logoCache[cacheKey] = data.logo_url;
          setLogo(data.logo_url);
        } else {
          logoCache[cacheKey] = null;
          setLogo(null);
        }
      } catch (err) {
        console.error('Failed to fetch team logo:', err);
        logoCache[cacheKey] = null;
        setLogo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [teamName, existingLogo, badge]);

  return { logo, isLoading };
};

// Hook to get both team logos for a match
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
  
  const { logo: homeLogo, isLoading: homeLoading } = useTeamLogo(
    homeName,
    getTeamLogo(homeTeam),
    getTeamBadge(homeTeam)
  );
  
  const { logo: awayLogo, isLoading: awayLoading } = useTeamLogo(
    awayName,
    getTeamLogo(awayTeam),
    getTeamBadge(awayTeam)
  );

  return {
    homeLogo,
    awayLogo,
    isLoading: homeLoading || awayLoading
  };
};
