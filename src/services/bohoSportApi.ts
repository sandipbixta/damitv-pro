// BOHOSport API Service - Direct API calls with CORS proxy
import { Sport, Match, Stream, Source } from '../types/sports';

// Embed player - strictly path-based: https://embed.damitv.pro/{source}/{id}
const DAMITV_EMBED_BASE = 'https://embed.damitv.pro';

// Legacy stream base URL (for images)
const STREAM_BASE = 'https://streamed.su';

// CORS proxy to bypass browser restrictions
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// API bases to try (will be proxied)
const API_BASES = [
  'https://streamed.su/api',
  'https://embedme.top/api',
  'https://rfrsh.me/api',
];

// Build embed URL using path-based format: /{source}/{id}
const buildEmbedUrl = (matchId: string, source: string): string => {
  return `${DAMITV_EMBED_BASE}/${source}/${matchId}`;
};

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to clear cache
export const clearStreamCache = (matchId?: string) => {
  if (matchId) {
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
      if (key.includes(matchId) || key.includes('stream')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries for match: ${matchId}`);
  } else {
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
      if (key.includes('stream')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} stream cache entries`);
  }
};

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Map category to our sport IDs
const mapCategoryToSportId = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'soccer': 'football',
    'football': 'football',
    'basketball': 'basketball',
    'tennis': 'tennis',
    'cricket': 'cricket',
    'hockey': 'hockey',
    'ice-hockey': 'hockey',
    'fight': 'fight',
    'mma': 'fight',
    'boxing': 'fight',
    'ufc': 'fight',
    'baseball': 'baseball',
    'rugby': 'rugby',
    'american-football': 'american-football',
    'nfl': 'american-football',
    'motorsport': 'motorsport',
    'f1': 'motorsport',
    'golf': 'golf',
    'darts': 'darts',
    'other': 'other'
  };
  return categoryMap[category?.toLowerCase()] || category?.toLowerCase() || 'other';
};

// Parse BOHOSport match data to our Match format
const parseMatchData = (item: any): Match | null => {
  try {
    if (!item || !item.id) return null;

    // Parse teams from title if available
    let homeTeam = '';
    let awayTeam = '';
    const title = item.title || item.name || '';
    
    if (title.includes(' vs ')) {
      const parts = title.split(' vs ');
      homeTeam = parts[0]?.trim() || '';
      awayTeam = parts[1]?.trim() || '';
    } else if (title.includes(' v ')) {
      const parts = title.split(' v ');
      homeTeam = parts[0]?.trim() || '';
      awayTeam = parts[1]?.trim() || '';
    }

    // Parse date - BOHOSport might use different formats
    let matchDate = 0;
    if (item.date) {
      if (typeof item.date === 'number') {
        matchDate = item.date;
      } else if (typeof item.date === 'string') {
        matchDate = new Date(item.date).getTime();
      }
    } else if (item.time) {
      matchDate = new Date(item.time).getTime();
    }

    // Build sources array
    const sources: Source[] = [];
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((src: any) => {
        if (src.source && src.id) {
          sources.push({ source: src.source, id: src.id });
        }
      });
    }
    
    // If no sources but has stream URL, create a default source
    if (sources.length === 0 && (item.stream || item.embed || item.iframe)) {
      sources.push({ source: 'boho', id: item.id });
    }

    // If still no sources but has id, create source from id
    if (sources.length === 0 && item.id) {
      sources.push({ source: 'main', id: item.id });
    }

    const sportId = mapCategoryToSportId(item.category || item.sport || '');

    return {
      id: String(item.id),
      title: title,
      category: sportId,
      sportId: sportId,
      date: matchDate,
      poster: item.poster || item.image || item.thumbnail || '',
      popular: item.popular === true || item.featured === true,
      teams: {
        home: {
          name: homeTeam || item.teams?.home?.name || item.home_team || item.homeTeam || '',
          badge: item.teams?.home?.badge || item.home_badge || item.homeBadge || item.home_logo || ''
        },
        away: {
          name: awayTeam || item.teams?.away?.name || item.away_team || item.awayTeam || '',
          badge: item.teams?.away?.badge || item.away_badge || item.awayBadge || item.away_logo || ''
        }
      },
      sources: sources,
    };
  } catch (e) {
    console.warn('Failed to parse match data:', e);
    return null;
  }
};

// Try fetching from an API base using CORS proxy
async function tryFetch(baseUrl: string, endpoint: string): Promise<{ success: boolean; data: any }> {
  const apiUrl = endpoint ? `${baseUrl}/${endpoint}` : `${baseUrl}/matches/all`;
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
  console.log(`🔄 Trying: ${apiUrl} (via proxy)`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(proxiedUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, data: null };
    }

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, data: null };
    }

    // Check if response has valid data
    const hasData = Array.isArray(data) || 
                    (data && (data.matches || data.events || data.data || data.live));
    
    if (hasData) {
      const count = Array.isArray(data) ? data.length : 'object';
      console.log(`✅ Success from ${apiUrl}: ${count} items`);
      return { success: true, data };
    }

    return { success: false, data: null };
  } catch (error) {
    console.log(`❌ Failed ${apiUrl}`);
    return { success: false, data: null };
  }
}

// Predefined sports list
export const fetchSports = async (): Promise<Sport[]> => {
  return [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'tennis', name: 'Tennis' },
    { id: 'cricket', name: 'Cricket' },
    { id: 'hockey', name: 'Hockey' },
    { id: 'american-football', name: 'American Football' },
    { id: 'baseball', name: 'Baseball' },
    { id: 'fight', name: 'Fighting' },
    { id: 'motorsport', name: 'Motorsport' },
    { id: 'rugby', name: 'Rugby' },
  ];
};

// Fetch all matches from API directly
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching matches directly from API...');
    
    // Try each API base with different endpoints
    const endpointsToTry = ['matches/all', 'matches/live', 'matches', 'events'];
    
    for (const baseUrl of API_BASES) {
      for (const endpoint of endpointsToTry) {
        const result = await tryFetch(baseUrl, endpoint);
        
        if (result.success && result.data) {
          let matches: Match[] = [];
          
          // Handle different response formats
          if (Array.isArray(result.data)) {
            matches = result.data.map(parseMatchData).filter((m): m is Match => m !== null);
          } else if (result.data.matches && Array.isArray(result.data.matches)) {
            matches = result.data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
          } else if (result.data.data && Array.isArray(result.data.data)) {
            matches = result.data.data.map(parseMatchData).filter((m): m is Match => m !== null);
          } else if (result.data.events && Array.isArray(result.data.events)) {
            matches = result.data.events.map(parseMatchData).filter((m): m is Match => m !== null);
          }
          
          if (matches.length > 0) {
            setCachedData(cacheKey, matches);
            console.log(`✅ Fetched ${matches.length} matches from ${baseUrl}/${endpoint}`);
            return matches;
          }
        }
      }
    }

    console.log('❌ All API endpoints failed');
    return [];
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    return [];
  }
};

// Fetch matches by sport category
export const fetchMatches = async (sportId: string): Promise<Match[]> => {
  const cacheKey = `boho-matches-${sportId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // First try to fetch all matches and filter by sport
    const allMatches = await fetchAllMatches();
    const sportMatches = allMatches.filter(match => 
      match.sportId === sportId || 
      match.category === sportId ||
      mapCategoryToSportId(match.category) === sportId
    );

    if (sportMatches.length > 0) {
      setCachedData(cacheKey, sportMatches);
      return sportMatches;
    }

    return allMatches;
  } catch (error) {
    console.error(`Error fetching ${sportId} matches:`, error);
    return [];
  }
};

// Fetch live matches
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const allMatches = await fetchAllMatches();
  const now = Date.now();
  
  // Filter for live matches (started within last 3 hours or starting in next 30 mins)
  return allMatches.filter(match => {
    if (!match.date) return true; // Include matches without date
    const matchTime = match.date;
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);
    const thirtyMinsFromNow = now + (30 * 60 * 1000);
    return matchTime >= threeHoursAgo && matchTime <= thirtyMinsFromNow;
  });
};

// Fetch a single match by ID
export const fetchMatch = async (matchId: string): Promise<Match | null> => {
  try {
    const allMatches = await fetchAllMatches();
    return allMatches.find(m => m.id === matchId) || null;
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
};

// Build simple embed URL
export const fetchSimpleStream = (source: string, id: string): string => {
  return `${DAMITV_EMBED_BASE}/${source}/${id}`;
};

// Fetch all stream sources for a match
export const fetchAllMatchStreams = async (matchId: string, sources: Source[]): Promise<Stream[]> => {
  const cacheKey = `streams-${matchId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const streams: Stream[] = [];
  
  if (!sources || sources.length === 0) {
    return streams;
  }

  sources.forEach((src, index) => {
    if (src.source && src.id) {
      streams.push({
        source: src.source,
        id: src.id,
        streamNo: index + 1,
        embedUrl: fetchSimpleStream(src.source, src.id),
        language: 'EN',
        hd: true,
      });
    }
  });

  if (streams.length > 0) {
    setCachedData(cacheKey, streams);
    console.log(`✅ Generated ${streams.length} stream URLs for match ${matchId}`);
  }

  return streams;
};

// Get BOHOSport image URL
export const getBohoImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${STREAM_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Get team badge URL
export const getTeamBadgeUrl = (badge: string): string => {
  if (!badge) return '';
  if (badge.startsWith('http')) return badge;
  return getBohoImageUrl(badge);
};

// Export base URL for external use
export const BOHO_API_BASE = STREAM_BASE;
