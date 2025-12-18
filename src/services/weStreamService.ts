import { cachedFetch, getCachedData } from './cachedFetch';
import { getLiveScoreByTeams } from '../hooks/useLiveScoreUpdates';

const WESTREAM_API = 'https://westream.top';

// ============================================
// TYPES
// ============================================

export interface WeStreamTeam {
  name: string;
  badge?: string;
}

export interface WeStreamSource {
  source: string;
  id: string;
}

export interface WeStreamMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams?: {
    home?: WeStreamTeam;
    away?: WeStreamTeam;
  };
  sources: WeStreamSource[];
  // Live score fields
  score?: {
    home?: number | string;
    away?: number | string;
  };
  progress?: string;
  isLive?: boolean;
}

export interface WeStreamStream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  source: string;
  embedUrl: string;
}

export interface Sport {
  id: string;
  name: string;
}

// ============================================
// LIVE SCORE ENHANCEMENT
// ============================================

// Check if match is currently live based on time
const isMatchCurrentlyLive = (match: WeStreamMatch): boolean => {
  const now = Date.now();
  const threeHoursAgo = now - (3 * 60 * 60 * 1000);
  const oneHourFromNow = now + (60 * 60 * 1000);
  
  return match.date <= oneHourFromNow && match.date > threeHoursAgo;
};

// Enhance match with live score from TheSportsDB
const enhanceWithLiveScore = (match: WeStreamMatch): WeStreamMatch => {
  const isLive = isMatchCurrentlyLive(match);
  if (!isLive) return { ...match, isLive: false };
  
  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  
  if (!homeTeam || !awayTeam) return { ...match, isLive };
  
  const liveScore = getLiveScoreByTeams(homeTeam, awayTeam);
  
  if (liveScore) {
    return {
      ...match,
      score: {
        home: liveScore.homeScore,
        away: liveScore.awayScore
      },
      progress: liveScore.progress,
      isLive: true
    };
  }
  
  return { ...match, isLive };
};

// ============================================
// API FUNCTIONS WITH CACHING
// ============================================

const fetchApi = async <T>(endpoint: string): Promise<T | null> => {
  const url = `${WESTREAM_API}${endpoint}`;
  
  try {
    // Use cachedFetch with localStorage for persistence
    const data = await cachedFetch<T>(url, {
      signal: AbortSignal.timeout(8000), // 8 second timeout
    }, true);
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
};

// Get cached data instantly (for initial render)
const getInstantData = <T>(endpoint: string): T | null => {
  const url = `${WESTREAM_API}${endpoint}`;
  return getCachedData<T>(url);
};

// Get all matches (with instant cache fallback) - enhanced with live scores
export const getAllMatches = async (): Promise<WeStreamMatch[]> => {
  const data = await fetchApi<WeStreamMatch[]>('/matches');
  const matches = data || [];
  // Enhance all matches with live scores
  return matches.map(enhanceWithLiveScore);
};

// Get instant cached matches (for initial render) - enhanced with live scores
export const getInstantMatches = (): WeStreamMatch[] => {
  const matches = getInstantData<WeStreamMatch[]>('/matches') || [];
  return matches.map(enhanceWithLiveScore);
};

// Get live matches - enhanced with live scores
export const getLiveMatches = async (): Promise<WeStreamMatch[]> => {
  const data = await fetchApi<WeStreamMatch[]>('/matches/live');
  const matches = Array.isArray(data) ? data : data ? [data] : [];
  return matches.map(enhanceWithLiveScore);
};

// Get matches by sport - enhanced with live scores
export const getMatchesBySport = async (sport: string): Promise<WeStreamMatch[]> => {
  const data = await fetchApi<WeStreamMatch[]>(`/matches/${sport}`);
  const matches = data || [];
  return matches.map(enhanceWithLiveScore);
};

// Get all sports categories (filtered)
const EXCLUDED_SPORTS = ['tennis', 'golf', 'hockey', 'ice hockey', 'nhl', 'darts', 'billiards', 'snooker', 'pool', 'other'];

export const getSports = async (): Promise<Sport[]> => {
  const data = await fetchApi<Sport[]>('/sports');
  if (!data) return [];
  // Filter out excluded sports
  return data.filter(sport => 
    !EXCLUDED_SPORTS.some(excluded => 
      sport.id.toLowerCase().includes(excluded) || 
      sport.name.toLowerCase().includes(excluded)
    )
  );
};

// Get stream info
export const getStreamInfo = async (source: string, id: string): Promise<WeStreamStream[]> => {
  const data = await fetchApi<WeStreamStream[]>(`/stream/${source}/${id}`);
  return data || [];
};

// ============================================
// POPULAR MATCHES
// ============================================

// Get popular matches (filtered by popular: true)
export const getPopularMatches = async (): Promise<WeStreamMatch[]> => {
  const allMatches = await getAllMatches();
  return allMatches.filter(match => match.popular === true);
};

// Get popular live matches
export const getPopularLiveMatches = async (): Promise<WeStreamMatch[]> => {
  const liveMatches = await getLiveMatches();
  return liveMatches.filter(match => match.popular === true);
};

// Get featured matches for carousel/popular section
export const getFeaturedMatches = async (limit: number = 12): Promise<WeStreamMatch[]> => {
  const allMatches = await getAllMatches();
  
  // Separate live and upcoming
  const now = Date.now();
  const liveMatches: WeStreamMatch[] = [];
  const upcomingMatches: WeStreamMatch[] = [];
  
  allMatches.forEach(match => {
    // Match is "live" if started within last 3 hours
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);
    if (match.date <= now && match.date > threeHoursAgo) {
      liveMatches.push(match);
    } else if (match.date > now) {
      upcomingMatches.push(match);
    }
  });
  
  // Sort: Popular first, then by date
  const sortByPopularAndDate = (a: WeStreamMatch, b: WeStreamMatch) => {
    // Popular matches first
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    // Then by date (sooner first)
    return a.date - b.date;
  };
  
  liveMatches.sort(sortByPopularAndDate);
  upcomingMatches.sort(sortByPopularAndDate);
  
  // Combine: Live popular first, then upcoming popular
  const featured = [
    ...liveMatches.filter(m => m.popular),
    ...liveMatches.filter(m => !m.popular),
    ...upcomingMatches.filter(m => m.popular),
    ...upcomingMatches.filter(m => !m.popular),
  ];
  
  return featured.slice(0, limit);
};

// ============================================
// HELPERS
// ============================================

// Check if match is currently live
export const isMatchLive = (match: WeStreamMatch): boolean => {
  const now = Date.now();
  const threeHoursAgo = now - (3 * 60 * 60 * 1000);
  return match.date <= now && match.date > threeHoursAgo;
};

// Get embed URL for a stream
export const getEmbedUrl = (source: string, id: string, streamNo: number = 1): string => {
  return `${WESTREAM_API}/embed/${source}/${id}/${streamNo}`;
};

// Format match date/time
export const formatMatchTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise show date
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
