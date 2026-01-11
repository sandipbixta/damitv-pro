// BOHOSport API Service - fetches directly from API (no edge function)
import { Sport, Match, Stream, Source } from '../types/sports';
import { getEmbedDomainSync, buildEmbedUrl } from '../utils/embedDomains';

// API endpoints to try (direct calls)
const API_BASES = [
  'https://streamed.pk/api',
  'https://streamed.su/api',
  'https://sportsrc.org/api'
];

// CORS proxy fallbacks (used if direct calls fail)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Legacy stream base URL (fallback only)
const STREAM_BASE = 'https://streamed.pk';

// Build ad-free embed URL using domain manager
const buildAdFreeEmbedUrl = (matchId: string, source: string, streamNo: number = 1): string => {
  const domain = getEmbedDomainSync();
  return buildEmbedUrl(domain, source, matchId, streamNo);
};

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for match data (increased from 1 min)
const STREAM_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for stream data

// Track working endpoints for faster future requests
let workingApiBase: string | null = null;
let workingProxy: string | null = null;

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
const getCachedData = (key: string, customTtl?: number) => {
  const cached = cache.get(key);
  const ttl = customTtl || CACHE_DURATION;
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`📦 Cache HIT: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Clean expired
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Cache SET: ${key}`);
};

// Direct API fetch with CORS proxy fallback + request timeout + smart endpoint caching
const fetchFromApi = async (endpoint: string): Promise<any> => {
  const timeout = 5000; // 5 second timeout

  const fetchWithTimeout = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  // Try last working endpoint first
  if (workingApiBase) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const url = `${workingApiBase}/${endpoint}`;
      
      const data = await fetchWithTimeout(url, controller.signal);
      clearTimeout(timeoutId);
      console.log(`⚡ Fast path: ${workingApiBase}`);
      return data;
    } catch {
      workingApiBase = null; // Reset if failed
    }
  }

  // Try last working proxy first
  if (workingProxy && workingApiBase === null) {
    for (const baseUrl of API_BASES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const targetUrl = `${baseUrl}/${endpoint}`;
        const proxyUrl = `${workingProxy}${encodeURIComponent(targetUrl)}`;
        
        const data = await fetchWithTimeout(proxyUrl, controller.signal);
        clearTimeout(timeoutId);
        workingApiBase = baseUrl;
        console.log(`⚡ Fast proxy path: ${workingProxy.split('?')[0]}`);
        return data;
      } catch {
        // Continue to next
      }
    }
    workingProxy = null; // Reset if all failed
  }

  // Try direct calls
  for (const baseUrl of API_BASES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const url = `${baseUrl}/${endpoint}`;
      
      const data = await fetchWithTimeout(url, controller.signal);
      clearTimeout(timeoutId);
      workingApiBase = baseUrl; // Remember working endpoint
      console.log(`✅ Direct success: ${baseUrl}`);
      return data;
    } catch (error) {
      console.warn(`⚠️ Direct failed: ${baseUrl}/${endpoint}`);
    }
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    for (const baseUrl of API_BASES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const targetUrl = `${baseUrl}/${endpoint}`;
        const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
        
        const data = await fetchWithTimeout(proxyUrl, controller.signal);
        clearTimeout(timeoutId);
        workingApiBase = baseUrl;
        workingProxy = proxy; // Remember working proxy
        console.log(`✅ CORS proxy success`);
        return data;
      } catch (error) {
        console.warn(`⚠️ CORS proxy failed`);
      }
    }
  }

  throw new Error(`All API endpoints failed for: ${endpoint}`);
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

// Parse stream data from /api/streams endpoint to our Match format
const parseStreamData = (stream: any, categoryName: string): Match | null => {
  try {
    if (!stream || !stream.id) return null;

    // Parse teams from name if available
    let homeTeam = '';
    let awayTeam = '';
    const title = stream.name || '';
    
    if (title.includes(' vs ')) {
      const parts = title.split(' vs ');
      homeTeam = parts[0]?.trim() || '';
      awayTeam = parts[1]?.trim() || '';
    } else if (title.includes(' v ')) {
      const parts = title.split(' v ');
      homeTeam = parts[0]?.trim() || '';
      awayTeam = parts[1]?.trim() || '';
    } else if (title.includes(' at ')) {
      const parts = title.split(' at ');
      awayTeam = parts[0]?.trim() || ''; // "Team at Team" = away at home
      homeTeam = parts[1]?.trim() || '';
    }

    // Parse date from starts_at (Unix timestamp in seconds)
    const matchDate = stream.starts_at ? stream.starts_at * 1000 : Date.now();

    // Build sources array from uri_name
    const sources: Source[] = [];
    if (stream.uri_name) {
      sources.push({ source: 'alpha', id: stream.uri_name });
      sources.push({ source: 'bravo', id: stream.uri_name });
      sources.push({ source: 'charlie', id: stream.uri_name });
    }

    const sportId = mapCategoryToSportId(categoryName || stream.category_name || '');

    return {
      id: String(stream.id),
      title: title,
      category: sportId,
      sportId: sportId,
      date: matchDate,
      poster: stream.poster || '',
      popular: stream.always_live === 1,
      teams: {
        home: { name: homeTeam, badge: '' },
        away: { name: awayTeam, badge: '' }
      },
      sources: sources,
      viewerCount: 0,
      // Store iframe URL if provided directly
      embedUrl: stream.iframe || undefined
    } as Match;
  } catch (error) {
    console.error('Error parsing stream data:', error, stream);
    return null;
  }
};

// Legacy parser for backward compatibility with old API format
const parseMatchData = (item: any): Match | null => {
  try {
    if (!item || !item.id) return null;

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

    let matchDate = 0;
    if (item.date) {
      matchDate = typeof item.date === 'number' ? item.date : new Date(item.date).getTime();
    } else if (item.starts_at) {
      matchDate = item.starts_at * 1000;
    } else if (item.time) {
      matchDate = new Date(item.time).getTime();
    }

    const sources: Source[] = [];
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((src: any) => {
        if (src.source && src.id) {
          sources.push({ source: src.source, id: src.id });
        }
      });
    }
    
    if (sources.length === 0 && item.uri_name) {
      sources.push({ source: 'alpha', id: item.uri_name });
    }

    if (sources.length === 0 && item.id) {
      sources.push({ source: 'main', id: String(item.id) });
    }

    const sportId = mapCategoryToSportId(item.category || item.category_name || item.sport || '');

    return {
      id: String(item.id),
      title: title,
      category: sportId,
      sportId: sportId,
      date: matchDate,
      poster: item.poster || item.image || item.thumbnail || '',
      popular: item.popular === true || item.featured === true || item.always_live === 1,
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
      viewerCount: item.viewers || item.viewerCount || 0,
      embedUrl: item.iframe || undefined
    } as Match;
  } catch (error) {
    console.error('Error parsing match data:', error, item);
    return null;
  }
};

// Fetch all sports categories
export const fetchSports = async (): Promise<Sport[]> => {
  const cacheKey = 'boho-sports';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // BOHOSport may not have a dedicated sports endpoint
    // Return predefined sports list
    const sports: Sport[] = [
      { id: 'football', name: 'Football' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'american-football', name: 'American Football' },
      { id: 'cricket', name: 'Cricket' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'fight', name: 'Fight' },
      { id: 'hockey', name: 'Hockey' },
      { id: 'baseball', name: 'Baseball' },
      { id: 'rugby', name: 'Rugby' },
      { id: 'motorsport', name: 'Motorsport' }
    ];
    
    setCachedData(cacheKey, sports);
    console.log(`✅ Returned ${sports.length} sports categories`);
    return sports;
  } catch (error) {
    console.error('❌ Error fetching sports:', error);
    throw error;
  }
};

// Fetch all matches from API directly using /api/streams endpoint
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching streams from /api/streams...');
    
    const data = await fetchFromApi('streams');

    let matches: Match[] = [];

    // Handle new /api/streams response format
    if (data.success && data.streams && Array.isArray(data.streams)) {
      // Iterate through category objects
      data.streams.forEach((category: any) => {
        if (category.streams && Array.isArray(category.streams)) {
          const categoryName = category.category || '';
          category.streams.forEach((stream: any) => {
            const match = parseStreamData(stream, categoryName);
            if (match) matches.push(match);
          });
        }
      });
    } 
    // Fallback to old format handlers
    else if (Array.isArray(data)) {
      matches = data.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.matches && Array.isArray(data.matches)) {
      matches = data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.data && Array.isArray(data.data)) {
      matches = data.data.map(parseMatchData).filter((m): m is Match => m !== null);
    }

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} streams/matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching streams:', error);
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

    setCachedData(cacheKey, sportMatches);
    console.log(`✅ Filtered ${sportMatches.length} ${sportId} matches`);
    return sportMatches;
  } catch (error) {
    console.error(`❌ Error fetching ${sportId} matches:`, error);
    throw error;
  }
};

// Fetch live matches
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-live';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const allMatches = await fetchAllMatches();
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;

    const liveMatches = allMatches.filter(match => {
      const matchTime = match.date;
      return match.sources && 
             match.sources.length > 0 && 
             matchTime - now < oneHourInMs && 
             now - matchTime < sixHoursInMs;
    }).sort((a, b) => b.date - a.date);

    setCachedData(cacheKey, liveMatches);
    console.log(`✅ Found ${liveMatches.length} live matches`);
    return liveMatches;
  } catch (error) {
    console.error('❌ Error fetching live matches:', error);
    throw error;
  }
};

// Fetch a specific match by ID
export const fetchMatch = async (sportId: string, matchId: string): Promise<Match> => {
  const cacheKey = `boho-match-${matchId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const allMatches = await fetchAllMatches();
    
    // Match by exact ID or by numeric ID suffix
    const match = allMatches.find(m => {
      if (m.id === matchId) return true;
      // Check if the matchId is just the numeric part
      const numericMatch = m.id.match(/-(\d+)$/);
      if (numericMatch && numericMatch[1] === matchId) return true;
      // Also check for any numeric sequence match
      const anyNumeric = m.id.match(/(\d+)/);
      if (anyNumeric && anyNumeric[1] === matchId) return true;
      return false;
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    setCachedData(cacheKey, match);
    console.log(`✅ Found match: ${match.title}`);
    return match;
  } catch (error) {
    console.error(`❌ Error fetching match ${matchId}:`, error);
    throw error;
  }
};

// Fetch stream for a match - uses ad-free embed player
export const fetchSimpleStream = async (source: string, id: string, category?: string): Promise<Stream[]> => {
  const cacheKey = `boho-stream-${source}-${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🎬 Building ad-free embed URL for source: ${source}, id: ${id}`);

    // Use ad-free embed URL
    const adFreeUrl = buildAdFreeEmbedUrl(id, source);
    
    const primaryStream: Stream = {
      id: id,
      streamNo: 1,
      language: 'EN',
      hd: true,
      embedUrl: adFreeUrl,
      source: source,
      timestamp: Date.now()
    };

    console.log(`✅ Ad-free embed URL: ${adFreeUrl}`);
    setCachedData(cacheKey, [primaryStream]);
    return [primaryStream];
  } catch (error) {
    console.error(`❌ Error building ad-free URL for ${source}/${id}:`, error);
    return [];
  }
};

// Fetch streams from dedicated API endpoint for a source
const fetchStreamsFromApi = async (source: string, id: string): Promise<Stream[]> => {
  const cacheKey = `boho-streams-${source}-${id}`;
  const cached = getCachedData(cacheKey, STREAM_CACHE_DURATION);
  if (cached) return cached;

  try {
    console.log(`🔄 Fetching streams from API: /stream/${source}/${id}`);
    const data = await fetchFromApi(`stream/${source}/${id}`);
    
    if (!data || !Array.isArray(data)) {
      console.warn(`⚠️ No streams returned for ${source}/${id}`);
      return [];
    }

    const streams: Stream[] = data.map((item: any, index: number) => {
      const streamNo = item.streamNo || item.stream_no || index + 1;
      const adFreeUrl = buildAdFreeEmbedUrl(id, source, streamNo);
      
      return {
        id: id,
        streamNo: streamNo,
        language: item.language || item.lang || 'EN',
        hd: item.hd !== false,
        embedUrl: adFreeUrl,
        source: source,
        timestamp: Date.now(),
        name: item.name || `Stream ${streamNo}`,
        viewers: item.viewers || item.viewerCount || 0
      } as Stream;
    });

    console.log(`✅ Fetched ${streams.length} streams from API for ${source}/${id}`);
    setCachedData(cacheKey, streams);
    return streams;
  } catch (error) {
    console.error(`❌ Error fetching streams for ${source}/${id}:`, error);
    // Fallback: generate 3 default streams
    return [1, 2, 3].map(streamNo => ({
      id: id,
      streamNo: streamNo,
      language: 'EN',
      hd: true,
      embedUrl: buildAdFreeEmbedUrl(id, source, streamNo),
      source: source,
      timestamp: Date.now(),
      name: `Stream ${streamNo}`
    } as Stream));
  }
};

// Fetch all streams for a match - fetches from API for each source
export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();
  
  console.log(`🎬 Fetching all streams for: ${match.title}`);
  console.log(`📡 Match sources from API:`, match.sources);
  
  if (match.sources && match.sources.length > 0) {
    // Fetch streams for all sources in parallel
    const streamPromises = match.sources.map(async (src) => {
      if (src.source && src.id) {
        const streams = await fetchStreamsFromApi(src.source, src.id);
        if (streams.length > 0) {
          sourcesWithStreams.add(src.source);
        }
        return streams;
      }
      return [];
    });

    const results = await Promise.all(streamPromises);
    
    // Flatten and renumber streams
    let globalIndex = 1;
    results.forEach(streams => {
      streams.forEach(stream => {
        allStreams.push({
          ...stream,
          name: `Stream ${globalIndex}`
        });
        globalIndex++;
      });
    });
  } else {
    console.warn(`⚠️ No sources available for match: ${match.title}`);
  }

  const sourceNames = Array.from(sourcesWithStreams);
  console.log(`✅ Total ${allStreams.length} streams from ${sourceNames.length} sources`);

  return {
    streams: allStreams,
    sourcesChecked: match.sources?.length || 0,
    sourcesWithStreams: sourceNames.length,
    sourceNames
  };
};

// Fetch all streams (legacy compatibility)
export const fetchAllStreams = async (match: Match): Promise<Record<string, Stream[]>> => {
  const result = await fetchAllMatchStreams(match);
  const streamsRecord: Record<string, Stream[]> = {};

  result.streams.forEach(stream => {
    const key = `${stream.source}/${stream.id}`;
    if (!streamsRecord[key]) {
      streamsRecord[key] = [];
    }
    streamsRecord[key].push(stream);
  });

  return streamsRecord;
};

// Get image URL
export const getBohoImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${STREAM_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Get team badge URL
export const getTeamBadgeUrl = (badge: string): string => {
  if (!badge) return '';
  if (badge.startsWith('http')) return badge;
  return `${STREAM_BASE}/images/badge/${badge}`;
};

// Export API base for reference
export const BOHO_API_BASE = STREAM_BASE;
