// CDN Live TV Sports API Service
// Uses the Damitv VIP API endpoints for live sports events

import { Match, Source, Stream } from '../types/sports';
import { getEmbedDomainSync, buildEmbedUrl } from '../utils/embedDomains';

// API Base URL with Damitv VIP credentials
const API_BASE = 'https://api.cdn-live.tv/api/v1';
const API_USER = 'damitv';
const API_PLAN = 'vip';

// Build API URL with credentials
const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE}/${endpoint}?user=${API_USER}&plan=${API_PLAN}`;
};

// CORS proxies for fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helpers
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 CDN Cache HIT: ${key}`);
    return cached.data;
  }
  if (cached) cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 CDN Cache SET: ${key}`);
};

// Fetch with CORS proxy fallback
const fetchWithCorsProxy = async (url: string): Promise<any> => {
  const timeout = 5000;

  const fetchWithTimeout = async (fetchUrl: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(fetchUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Try direct fetch first
  try {
    const data = await fetchWithTimeout(url);
    console.log(`✅ CDN Direct fetch success`);
    return data;
  } catch (error) {
    console.warn(`⚠️ CDN Direct fetch failed: ${url}`);
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const data = await fetchWithTimeout(proxyUrl);
      console.log(`✅ CDN CORS proxy success`);
      return data;
    } catch (error) {
      continue;
    }
  }

  throw new Error(`CDN API fetch failed: ${url}`);
};

// CDN API Response types
interface CDNEvent {
  id: string | number;
  title: string;
  date?: string;
  time?: number | string;
  category?: string;
  sport?: string;
  league?: string;
  poster?: string;
  thumbnail?: string;
  home_team?: string;
  away_team?: string;
  home_badge?: string;
  away_badge?: string;
  sources?: Array<{
    source: string;
    id: string;
    streamNo?: number;
  }>;
  streams?: Array<{
    name?: string;
    url?: string;
    quality?: string;
  }>;
  popular?: boolean;
  featured?: boolean;
  viewers?: number;
}

// Map sport category to our format
const mapSportCategory = (category?: string): string => {
  if (!category) return 'other';
  const map: Record<string, string> = {
    'soccer': 'football',
    'football': 'football',
    'nfl': 'american-football',
    'nba': 'basketball',
    'basketball': 'basketball',
    'nhl': 'hockey',
    'hockey': 'hockey',
    'mlb': 'baseball',
    'baseball': 'baseball',
    'tennis': 'tennis',
    'cricket': 'cricket',
    'rugby': 'rugby',
    'mma': 'fight',
    'boxing': 'fight',
    'ufc': 'fight',
    'fight': 'fight',
    'motorsport': 'motorsport',
    'f1': 'motorsport',
    'golf': 'golf'
  };
  return map[category.toLowerCase()] || category.toLowerCase();
};

// Parse CDN event to our Match format
const parseCDNEvent = (event: CDNEvent, sportCategory?: string): Match | null => {
  try {
    if (!event || !event.id) return null;

    // Parse title for teams
    let homeTeam = event.home_team || '';
    let awayTeam = event.away_team || '';
    const title = event.title || '';

    if (!homeTeam && !awayTeam && title) {
      if (title.includes(' vs ')) {
        const parts = title.split(' vs ');
        homeTeam = parts[0]?.trim() || '';
        awayTeam = parts[1]?.trim() || '';
      } else if (title.includes(' v ')) {
        const parts = title.split(' v ');
        homeTeam = parts[0]?.trim() || '';
        awayTeam = parts[1]?.trim() || '';
      }
    }

    // Parse date
    let matchDate = 0;
    if (event.date) {
      matchDate = new Date(event.date).getTime();
    } else if (event.time) {
      matchDate = typeof event.time === 'number' 
        ? event.time * 1000 // Unix timestamp
        : new Date(event.time).getTime();
    }

    // Build sources
    const sources: Source[] = [];
    if (event.sources && Array.isArray(event.sources)) {
      event.sources.forEach(src => {
        if (src.source && src.id) {
          sources.push({ source: src.source, id: src.id });
        }
      });
    }

    // If no sources, create default
    if (sources.length === 0) {
      sources.push({ source: 'cdn', id: String(event.id) });
    }

    const category = mapSportCategory(sportCategory || event.category || event.sport);

    return {
      id: String(event.id),
      title: title || `${homeTeam} vs ${awayTeam}`,
      category: category,
      sportId: category,
      date: matchDate || Date.now(),
      poster: event.poster || event.thumbnail || '',
      popular: event.popular || event.featured || false,
      teams: {
        home: {
          name: homeTeam,
          badge: event.home_badge || ''
        },
        away: {
          name: awayTeam,
          badge: event.away_badge || ''
        }
      },
      sources: sources,
      viewerCount: event.viewers || 0
    };
  } catch (error) {
    console.error('Error parsing CDN event:', error);
    return null;
  }
};

// Fetch all sports events
export const fetchCDNAllSports = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-all-sports';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🏆 Fetching all sports from CDN API...');
    const url = buildApiUrl('events/sports');
    const data = await fetchWithCorsProxy(url);

    let matches: Match[] = [];
    const events = Array.isArray(data) ? data : data?.events || data?.data || [];
    
    matches = events
      .map((e: CDNEvent) => parseCDNEvent(e))
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Fetched ${matches.length} sports events`);
    return matches;
  } catch (error) {
    console.error('❌ CDN All Sports API failed:', error);
    return [];
  }
};

// Fetch soccer/football events
export const fetchCDNSoccer = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-soccer';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('⚽ Fetching soccer from CDN API...');
    const url = buildApiUrl('events/sports/soccer');
    const data = await fetchWithCorsProxy(url);

    let matches: Match[] = [];
    const events = Array.isArray(data) ? data : data?.events || data?.data || [];
    
    matches = events
      .map((e: CDNEvent) => parseCDNEvent(e, 'soccer'))
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Fetched ${matches.length} soccer events`);
    return matches;
  } catch (error) {
    console.error('❌ CDN Soccer API failed:', error);
    return [];
  }
};

// Fetch NFL events
export const fetchCDNNFL = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-nfl';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🏈 Fetching NFL from CDN API...');
    const url = buildApiUrl('events/sports/nfl');
    const data = await fetchWithCorsProxy(url);

    let matches: Match[] = [];
    const events = Array.isArray(data) ? data : data?.events || data?.data || [];
    
    matches = events
      .map((e: CDNEvent) => parseCDNEvent(e, 'nfl'))
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Fetched ${matches.length} NFL events`);
    return matches;
  } catch (error) {
    console.error('❌ CDN NFL API failed:', error);
    return [];
  }
};

// Fetch NBA events
export const fetchCDNNBA = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-nba';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🏀 Fetching NBA from CDN API...');
    const url = buildApiUrl('events/sports/nba');
    const data = await fetchWithCorsProxy(url);

    let matches: Match[] = [];
    const events = Array.isArray(data) ? data : data?.events || data?.data || [];
    
    matches = events
      .map((e: CDNEvent) => parseCDNEvent(e, 'nba'))
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Fetched ${matches.length} NBA events`);
    return matches;
  } catch (error) {
    console.error('❌ CDN NBA API failed:', error);
    return [];
  }
};

// Fetch NHL events
export const fetchCDNNHL = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-nhl';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🏒 Fetching NHL from CDN API...');
    const url = buildApiUrl('events/sports/nhl');
    const data = await fetchWithCorsProxy(url);

    let matches: Match[] = [];
    const events = Array.isArray(data) ? data : data?.events || data?.data || [];
    
    matches = events
      .map((e: CDNEvent) => parseCDNEvent(e, 'nhl'))
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Fetched ${matches.length} NHL events`);
    return matches;
  } catch (error) {
    console.error('❌ CDN NHL API failed:', error);
    return [];
  }
};

// Fetch all matches from CDN API (combines all sports)
export const fetchCDNMatches = async (): Promise<Match[]> => {
  const cacheKey = 'cdn-all-matches';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🎯 Fetching all CDN matches...');
    
    // Fetch from all endpoints in parallel
    const [allSports, soccer, nfl, nba, nhl] = await Promise.all([
      fetchCDNAllSports(),
      fetchCDNSoccer(),
      fetchCDNNFL(),
      fetchCDNNBA(),
      fetchCDNNHL()
    ]);

    // Combine and dedupe by ID
    const matchMap = new Map<string, Match>();
    
    // Priority: specific sport endpoints > all sports endpoint
    [...allSports, ...soccer, ...nfl, ...nba, ...nhl].forEach(match => {
      if (!matchMap.has(match.id)) {
        matchMap.set(match.id, match);
      }
    });

    const matches = Array.from(matchMap.values());
    setCachedData(cacheKey, matches);
    console.log(`✅ CDN: Total ${matches.length} unique matches`);
    return matches;
  } catch (error) {
    console.error('❌ CDN fetch all matches failed:', error);
    return [];
  }
};

// Fetch matches by sport category
export const fetchCDNMatchesBySport = async (sport: string): Promise<Match[]> => {
  const sportLower = sport.toLowerCase();
  
  switch (sportLower) {
    case 'soccer':
    case 'football':
      return fetchCDNSoccer();
    case 'nfl':
    case 'american-football':
      return fetchCDNNFL();
    case 'nba':
    case 'basketball':
      return fetchCDNNBA();
    case 'nhl':
    case 'hockey':
      return fetchCDNNHL();
    default:
      // Filter from all sports
      const allMatches = await fetchCDNAllSports();
      return allMatches.filter(m => 
        m.sportId === sportLower || m.category === sportLower
      );
  }
};

// Get live matches (happening now or within 1 hour)
export const fetchCDNLiveMatches = async (): Promise<Match[]> => {
  const allMatches = await fetchCDNMatches();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const sixHours = 6 * 60 * 60 * 1000;

  return allMatches.filter(match => {
    const matchTime = match.date;
    return matchTime - now < oneHour && now - matchTime < sixHours;
  }).sort((a, b) => a.date - b.date);
};

// Clear CDN cache
export const clearCDNCache = () => {
  cache.clear();
  console.log('🗑️ CDN cache cleared');
};

// Export API URLs for reference
export const CDN_API_URLS = {
  channels: buildApiUrl('channels'),
  allSports: buildApiUrl('events/sports'),
  soccer: buildApiUrl('events/sports/soccer'),
  nfl: buildApiUrl('events/sports/nfl'),
  nba: buildApiUrl('events/sports/nba'),
  nhl: buildApiUrl('events/sports/nhl')
};
