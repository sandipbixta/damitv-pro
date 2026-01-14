import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveMatch {
  comp: string;
  match: string;
  score: string;
  time: string;
  status: string;
  venue: string;
}

export interface Fixture {
  comp: string;
  teams: string;
  kickoff: string;
  status: string;
}

export interface Standing {
  pos: number;
  team: string;
  pld: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
}

interface DashboardState {
  liveMatches: LiveMatch[];
  fixtures: Fixture[];
  standings: Standing[];
  news: NewsArticle[];
  loading: {
    live: boolean;
    fixtures: boolean;
    standings: boolean;
    news: boolean;
  };
  error: {
    live: string | null;
    fixtures: string | null;
    standings: string | null;
    news: string | null;
  };
  lastUpdated: Date | null;
}

const CACHE_KEY = 'sports_dashboard_cache';
const CACHE_DURATION = 60 * 1000; // 1 minute

function getCache(): { data: Partial<DashboardState>; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

function setCache(data: Partial<DashboardState>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export function useSportsDashboard() {
  const [state, setState] = useState<DashboardState>(() => {
    const cached = getCache();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) {
      return {
        liveMatches: cached.data.liveMatches || [],
        fixtures: cached.data.fixtures || [],
        standings: cached.data.standings || [],
        news: cached.data.news || [],
        loading: { live: true, fixtures: true, standings: true, news: true },
        error: { live: null, fixtures: null, standings: null, news: null },
        lastUpdated: cached.timestamp ? new Date(cached.timestamp) : null
      };
    }
    return {
      liveMatches: [],
      fixtures: [],
      standings: [],
      news: [],
      loading: { live: true, fixtures: true, standings: true, news: true },
      error: { live: null, fixtures: null, standings: null, news: null },
      lastUpdated: null
    };
  });

  const fetchData = useCallback(async (type: 'live' | 'fixtures' | 'standings' | 'news') => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [type]: true },
      error: { ...prev.error, [type]: null }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('sports-dashboard', {
        body: { type }
      });

      if (error) throw error;

      const responseData = data?.data;
      
      setState(prev => {
        const newState = { ...prev };
        newState.loading = { ...prev.loading, [type]: false };
        newState.lastUpdated = new Date();
        
        switch (type) {
          case 'live':
            newState.liveMatches = responseData?.matches || [];
            break;
          case 'fixtures':
            newState.fixtures = responseData?.fixtures || [];
            break;
          case 'standings':
            newState.standings = responseData?.standings || [];
            break;
          case 'news':
            newState.news = responseData?.articles || [];
            break;
        }
        
        setCache({
          liveMatches: newState.liveMatches,
          fixtures: newState.fixtures,
          standings: newState.standings,
          news: newState.news
        });
        
        return newState;
      });
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [type]: false },
        error: { ...prev.error, [type]: err instanceof Error ? err.message : 'Failed to fetch data' }
      }));
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchData('live');
    fetchData('fixtures');
    fetchData('standings');
    fetchData('news');
  }, [fetchData]);

  useEffect(() => {
    refreshAll();
    
    const interval = setInterval(refreshAll, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  return {
    ...state,
    refreshAll,
    isAnyLoading: Object.values(state.loading).some(Boolean)
  };
}
