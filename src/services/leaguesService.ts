import { supabase } from "@/integrations/supabase/client";

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const leaguesService = {
  async fetchLeagues() {
    try {
      const cacheKey = 'all-leagues';
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      console.log('Fetching all sports leagues');
      
      const { data, error } = await supabase.functions.invoke('fetch-leagues', {
        body: {}
      });

      if (error) throw error;
      
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      return null;
    }
  },

  async getLeagues(sport?: string) {
    try {
      let query = supabase
        .from('leagues')
        .select('*')
        .order('league_name');
      
      if (sport) {
        query = query.ilike('sport', `%${sport.toLowerCase().replace(/\s+/g, '_')}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting leagues:', error);
      return [];
    }
  },

  async getLeagueById(leagueId: string) {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_id', leagueId)
        .maybeSingle();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting league:', error);
      return null;
    }
  },

  async fetchLeagueTeams(sportKey: string) {
    try {
      const cacheKey = `league-teams-${sportKey}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      console.log(`Fetching teams for sport key: ${sportKey}`);
      
      const { data, error } = await supabase.functions.invoke('fetch-league-teams', {
        body: { sportKey }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching league teams:', error);
      // Return empty success result instead of null
      return { success: false, message: error.message || 'Failed to fetch teams', teams: [] };
    }
  },

  async getLeagueTeams(sportKey: string) {
    try {
      const { data, error } = await supabase
        .from('league_teams')
        .select('*')
        .eq('league_name', sportKey)
        .order('team_name');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting league teams:', error);
      return [];
    }
  }
};
