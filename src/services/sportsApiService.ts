import { supabase } from '@/integrations/supabase/client';

// API endpoints for BOHOSport
const ENDPOINTS = {
  sports: '/sports',
  matches: (category: string) => `/matches/${category}`,
  matchDetail: (id: string) => `/matches/${id}/detail`,
  leagues: '/results/leagues',
  scores: (league: string) => `/results/scores/${league}`,
  tables: (league: string) => `/results/tables/${league}`,
};

// Fetch from edge function
const fetchApi = async (endpoint: string) => {
  const { data, error } = await supabase.functions.invoke('sports-api', {
    body: { endpoint },
  });
  
  if (error) throw error;
  return data;
};

// Get all sport categories
export const getSportCategories = async () => {
  const result = await fetchApi(ENDPOINTS.sports);
  return result?.data || [];
};

// Get matches by sport category
export const getMatchesByCategory = async (category: string = 'football') => {
  const result = await fetchApi(ENDPOINTS.matches(category));
  const matches = result?.data || [];
  
  const now = Date.now();
  
  return {
    live: matches.filter((m: any) => m.date && m.date <= now),
    scheduled: matches.filter((m: any) => m.date && m.date > now),
    channels: matches.filter((m: any) => !m.date || m.date === 0),
  };
};

// Get match details with stream
export const getMatchDetail = async (matchId: string) => {
  const result = await fetchApi(ENDPOINTS.matchDetail(matchId));
  return result?.data || null;
};

// Get all leagues
export const getLeagues = async () => {
  const result = await fetchApi(ENDPOINTS.leagues);
  return result?.data || [];
};

// Get live scores for a league
export const getLiveScores = async (league: string) => {
  const result = await fetchApi(ENDPOINTS.scores(league));
  return {
    live: result?.data?.live || [],
    finished: result?.data?.finished || [],
    lastUpdated: result?.data?.last_updated || null,
  };
};

// Get standings for a league
export const getStandings = async (league: string) => {
  const result = await fetchApi(ENDPOINTS.tables(league));
  return result?.data?.standings?.[0]?.table || [];
};

// Parse match data for our components
export interface ParsedMatch {
  id: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge: string | null;
  awayBadge: string | null;
  league: string;
  category: string;
  date: number;
  isLive: boolean;
  poster: string | null;
  sources: any[];
}

export const parseMatch = (match: any, category: string = 'football'): ParsedMatch => {
  const now = Date.now();
  const isLive = match.date && match.date <= now;
  
  let homeTeam = match.teams?.home?.name || '';
  let awayTeam = match.teams?.away?.name || '';
  
  // Parse from title if teams not provided
  if (!homeTeam && !awayTeam && match.title) {
    if (match.title.toLowerCase().includes(' vs ')) {
      const parts = match.title.split(/ vs /i);
      homeTeam = parts[0]?.trim() || match.title;
      awayTeam = parts[1]?.trim() || '';
    } else {
      homeTeam = match.title;
    }
  }
  
  return {
    id: match.id,
    title: match.title,
    homeTeam,
    awayTeam,
    homeBadge: match.teams?.home?.badge || null,
    awayBadge: match.teams?.away?.badge || null,
    league: match.league || '',
    category: match.category || category,
    date: match.date || 0,
    isLive,
    poster: match.poster || null,
    sources: match.sources || [],
  };
};
