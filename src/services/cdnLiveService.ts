// ============================================
// CDN-LIVE.TV SPORTS & CHANNELS API SERVICE
// API: https://cdn-live.tv/api/v1/vip/damitv
// ============================================

import { getLivescores } from './sportsLogoService';

const CDN_LIVE_API = 'https://api.cdn-live.tv/api/v1';
const DAMITV_API = 'https://cdn-live.tv/api/v1/vip/damitv';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for live data

// ============================================
// TYPES
// ============================================

export interface CDNChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
  viewers: number;
}

export interface CDNEvent {
  id: string;
  title: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  date: number;
  status: 'live' | 'upcoming' | 'finished';
  channels: CDNChannel[];
  homeScore?: number | string;
  awayScore?: number | string;
  progress?: string;
  poster?: string;
  popular?: boolean;
}

// ============================================
// CACHE HELPERS
// ============================================

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ============================================
// FETCH CHANNELS
// ============================================

export const fetchCDNChannels = async (): Promise<CDNChannel[]> => {
  const cacheKey = 'cdn-channels-all';
  const cached = getCached<CDNChannel[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${DAMITV_API}/channels/`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('CDN-Live API error:', response.status);
      return [];
    }

    const data = await response.json();
    const channels: CDNChannel[] = Array.isArray(data) 
      ? data 
      : data.channels || [];

    setCache(cacheKey, channels);
    console.log(`✅ Fetched ${channels.length} channels from CDN-Live`);
    return channels;
  } catch (error) {
    console.error('Failed to fetch CDN channels:', error);
    return [];
  }
};

// ============================================
// FETCH SPORTS EVENTS (with Live Scores)
// ============================================

export const fetchCDNEvents = async (): Promise<CDNEvent[]> => {
  const cacheKey = 'cdn-events-all';
  const cached = getCached<CDNEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${DAMITV_API}/events/`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('CDN-Live Events API error:', response.status);
      return [];
    }

    const data = await response.json();
    let events: CDNEvent[] = [];

    if (Array.isArray(data)) {
      events = data.map(transformCDNEvent);
    } else if (data.events) {
      events = data.events.map(transformCDNEvent);
    }

    setCache(cacheKey, events);
    console.log(`✅ Fetched ${events.length} events from CDN-Live`);
    return events;
  } catch (error) {
    console.error('Failed to fetch CDN events:', error);
    return [];
  }
};

// Transform API response to our event format
const transformCDNEvent = (event: any): CDNEvent => {
  const now = Date.now();
  const eventTime = event.date || event.timestamp || now;
  const threeHoursAgo = now - (3 * 60 * 60 * 1000);
  
  let status: 'live' | 'upcoming' | 'finished' = 'upcoming';
  if (eventTime <= now && eventTime > threeHoursAgo) {
    status = 'live';
  } else if (eventTime <= threeHoursAgo) {
    status = 'finished';
  }

  return {
    id: event.id || `cdn-${event.title?.replace(/\s+/g, '-') || Date.now()}`,
    title: event.title || `${event.homeTeam || 'Team A'} vs ${event.awayTeam || 'Team B'}`,
    sport: event.sport || event.category || 'Sports',
    homeTeam: event.homeTeam || event.teams?.home?.name || '',
    awayTeam: event.awayTeam || event.teams?.away?.name || '',
    date: eventTime,
    status,
    channels: event.channels || [],
    poster: event.poster || event.image || undefined,
    popular: event.popular || event.featured || false
  };
};

// ============================================
// FETCH LIVE SCORES FROM THESPORTSDB
// ============================================

export const fetchLiveScoresForEvents = async (events: CDNEvent[]): Promise<CDNEvent[]> => {
  if (events.length === 0) return events;

  // Get the sport types from events
  const sportTypes = new Set(events.map(e => mapSportToAPI(e.sport)));

  // Fetch live scores for each sport type
  const scorePromises = Array.from(sportTypes).map(async (sport) => {
    try {
      const scores = await getLivescores(sport);
      return { sport, scores };
    } catch {
      return { sport, scores: [] };
    }
  });

  const allScores = await Promise.all(scorePromises);
  const scoresMap = new Map<string, any>();

  // Build a map of team names to scores
  allScores.forEach(({ scores }) => {
    scores.forEach((score: any) => {
      if (score.strHomeTeam && score.strAwayTeam) {
        const key = normalizeTeamKey(score.strHomeTeam, score.strAwayTeam);
        scoresMap.set(key, {
          homeScore: score.intHomeScore ?? '-',
          awayScore: score.intAwayScore ?? '-',
          progress: score.strProgress || score.strStatus || ''
        });
      }
    });
  });

  // Match scores to events
  return events.map(event => {
    if (event.status !== 'live') return event;

    const key = normalizeTeamKey(event.homeTeam, event.awayTeam);
    const score = scoresMap.get(key);

    if (score) {
      return {
        ...event,
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        progress: score.progress
      };
    }

    // Try partial match
    for (const [scoreKey, scoreData] of scoresMap.entries()) {
      if (fuzzyMatchTeams(key, scoreKey)) {
        return {
          ...event,
          homeScore: scoreData.homeScore,
          awayScore: scoreData.awayScore,
          progress: scoreData.progress
        };
      }
    }

    return event;
  });
};

// ============================================
// SPORT CHANNEL MAPPING
// ============================================

// Get sports-specific channels
export const getSportsChannels = async (): Promise<CDNChannel[]> => {
  const channels = await fetchCDNChannels();
  
  // Filter for sports channels
  const sportsKeywords = [
    'espn', 'fox sport', 'bein', 'sky sport', 'bt sport', 'dazn',
    'nba', 'nfl', 'nhl', 'mlb', 'tnt', 'cbs sport', 'astro',
    'euro sport', 'sport tv', 'arena sport', 'super sport', 'premier league',
    'cricket', 'willow', 'star sport', 'sony sport', 'ten sport'
  ];

  return channels.filter(channel => {
    const name = channel.name.toLowerCase();
    return sportsKeywords.some(keyword => name.includes(keyword));
  });
};

// Get channel by sport type
export const getChannelsBySport = async (sport: string): Promise<CDNChannel[]> => {
  const channels = await fetchCDNChannels();
  const sportLower = sport.toLowerCase();

  const sportChannelMap: Record<string, string[]> = {
    football: ['espn', 'fox sport', 'bein', 'sky sport', 'bt sport', 'premier league', 'cbs sport', 'peacock', 'nbc'],
    soccer: ['espn', 'fox sport', 'bein', 'sky sport', 'bt sport', 'premier league', 'cbs sport', 'peacock', 'nbc'],
    basketball: ['espn', 'nba', 'tnt', 'tbs', 'abc', 'fox sport'],
    nba: ['espn', 'nba', 'tnt', 'tbs', 'abc', 'fox sport'],
    nfl: ['espn', 'nfl', 'fox', 'cbs', 'nbc', 'abc', 'fox sport'],
    baseball: ['espn', 'mlb', 'fox sport', 'tbs'],
    mlb: ['espn', 'mlb', 'fox sport', 'tbs'],
    cricket: ['willow', 'cricket', 'star sport', 'sky sport', 'astro cricket'],
    mma: ['espn', 'fox sport', 'bt sport'],
    ufc: ['espn', 'fox sport', 'bt sport'],
    boxing: ['espn', 'dazn', 'showtime', 'hbo', 'sky sport'],
    f1: ['espn', 'sky sport f1', 'fox sport'],
    motorsport: ['espn', 'fox sport', 'nbc'],
    rugby: ['sky sport', 'espn', 'bt sport', 'super sport']
  };

  const keywords = sportChannelMap[sportLower] || ['espn', 'fox sport', 'bein'];

  return channels.filter(channel => {
    const name = channel.name.toLowerCase();
    return keywords.some(keyword => name.includes(keyword));
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const normalizeTeamKey = (home: string, away: string): string => {
  const normalize = (name: string) => name.toLowerCase().trim()
    .replace(/fc$/i, '')
    .replace(/^fc /i, '')
    .replace(/ fc$/i, '')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .trim();
  
  return `${normalize(home)}_${normalize(away)}`;
};

const fuzzyMatchTeams = (key1: string, key2: string): boolean => {
  const [home1, away1] = key1.split('_');
  const [home2, away2] = key2.split('_');
  
  return (
    (home1.includes(home2) || home2.includes(home1)) &&
    (away1.includes(away2) || away2.includes(away1))
  );
};

const mapSportToAPI = (sport: string): string => {
  const sportMap: Record<string, string> = {
    football: 'soccer',
    soccer: 'soccer',
    basketball: 'basketball',
    nba: 'basketball',
    hockey: 'hockey',
    nhl: 'hockey',
    'ice hockey': 'hockey',
    nfl: 'nfl',
    'american football': 'nfl',
    baseball: 'baseball',
    mlb: 'baseball',
    rugby: 'rugby',
    mma: 'fighting',
    ufc: 'fighting',
    boxing: 'fighting',
    cricket: 'cricket',
    tennis: 'tennis'
  };

  return sportMap[sport.toLowerCase()] || 'soccer';
};

// ============================================
// COMBINED DATA WITH LIVE SCORES
// ============================================

export const fetchEventsWithLiveScores = async (): Promise<CDNEvent[]> => {
  const events = await fetchCDNEvents();
  const eventsWithScores = await fetchLiveScoresForEvents(events);
  return eventsWithScores;
};

// Clear cache
export const clearCDNCache = () => {
  cache.clear();
  console.log('🗑️ CDN-Live cache cleared');
};
