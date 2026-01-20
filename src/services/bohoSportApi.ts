// BOHOSport API Service - fetches directly from API (no edge function)
import { Sport, Match, Stream, Source } from '../types/sports';
import { getEmbedDomainSync, buildEmbedUrl } from '../utils/embedDomains';

// API endpoints to try (direct calls)
const API_BASES = [
  'https://streamed.su/api',
  'https://sportsrc.org/api'
];

// CORS proxy fallbacks (used if direct calls fail)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Legacy stream base URL (fallback only)
const STREAM_BASE = 'https://streamed.su';

// Generate match slug for topembed format (e.g., "new-york-rangers_seattle-kraken")
const generateMatchSlug = (title: string): string => {
  // Split by " vs " or " - " to get team names
  const parts = title.split(/\s+(?:vs\.?|v\.?|-)\s+/i);
  if (parts.length >= 2) {
    const team1 = parts[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const team2 = parts[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${team1}_${team2}`;
  }
  // Fallback: just convert title to slug
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// Build ad-free embed URL using domain manager
const buildAdFreeEmbedUrl = (
  matchId: string, 
  source: string, 
  streamNo: number = 1,
  matchTitle?: string,
  matchDate?: number | string
): string => {
  const domain = getEmbedDomainSync();
  
  // Generate slug and timestamp for topembed format
  const matchSlug = matchTitle ? generateMatchSlug(matchTitle) : undefined;
  const matchTimestamp = matchDate 
    ? Math.floor((typeof matchDate === 'number' ? matchDate : new Date(matchDate).getTime()) / 1000)
    : undefined;
  
  return buildEmbedUrl(domain, source, matchId, streamNo, matchSlug, matchTimestamp);
};

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for match data
const STREAM_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for stream data

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
  const timeout = 3000; // 3 second timeout (reduced for faster fallback)

  const fetchWithTimeout = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal,
      cache: 'default' // Use browser cache
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
      viewerCount: item.viewers || item.viewerCount || 0
    };
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

// Fetch all matches from API directly (no edge function)
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching matches directly from API...');
    
    const data = await fetchFromApi('matches/all');

    let matches: Match[] = [];

    // Handle different response formats
    if (Array.isArray(data)) {
      matches = data.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.matches && Array.isArray(data.matches)) {
      matches = data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.data && Array.isArray(data.data)) {
      matches = data.data.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.events && Array.isArray(data.events)) {
      matches = data.events.map(parseMatchData).filter((m): m is Match => m !== null);
    }

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} matches`);
    return matches;
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

// Default number of stream mirrors to generate when API doesn't provide sources
const DEFAULT_STREAM_COUNT = 4;

// Extract HLS URL from various API response fields
const extractStreamUrl = (item: any): { url: string; isHls: boolean } => {
  // Priority order: direct HLS > streamUrl > hlsUrl > url > embedUrl
  const possibleFields = ['streamUrl', 'hlsUrl', 'url', 'stream', 'file', 'embedUrl'];
  
  for (const field of possibleFields) {
    const value = item[field];
    if (value && typeof value === 'string') {
      const isHls = /\.m3u8(\?|$)/i.test(value);
      if (isHls) {
        console.log(`🎯 Found HLS URL in field "${field}": ${value}`);
        return { url: value, isHls: true };
      }
    }
  }
  
  // Fallback to embedUrl if no HLS found
  if (item.embedUrl) {
    return { url: item.embedUrl, isHls: false };
  }
  
  return { url: '', isHls: false };
};

// Fetch stream details from API endpoint with CORS proxy
const fetchStreamFromApi = async (source: string, id: string): Promise<Stream[]> => {
  const cacheKey = `stream_${source}_${id}`;
  const cached = getCachedData(cacheKey, STREAM_CACHE_DURATION);
  if (cached) return cached;

  try {
    // Force use of CORS proxy for stream endpoint
    const endpoint = `/stream/${source}/${id}`;
    console.log(`📡 Fetching stream data: ${endpoint}`);
    const data = await fetchFromApi(endpoint);
    
    console.log(`📦 Stream API response for ${source}/${id}:`, data);
    
    if (Array.isArray(data) && data.length > 0) {
      const streams = data.map((item: any, index: number) => {
        const { url, isHls } = extractStreamUrl(item);
        const streamNo = item.streamNo || index + 1;
        const streamId = item.id || id;
        const streamSource = item.source || source;
        
        // ALWAYS use embed.damitv.pro - override any URL from API
        const embedUrl = isHls ? url : `https://embed.damitv.pro/embed/${streamSource}/${streamId}/${streamNo}`;
        
        return {
          id: streamId,
          streamNo: streamNo,
          language: item.language || 'EN',
          hd: item.hd !== false,
          embedUrl: embedUrl,
          source: streamSource,
          timestamp: Date.now(),
          name: `Stream ${streamNo}`,
          isHls: isHls
        } as Stream;
      });
      
      setCachedData(cacheKey, streams);
      return streams;
    }
    return [];
  } catch (error) {
    console.warn(`Failed to fetch stream ${source}/${id}:`, error);
    return [];
  }
};

// Generate fallback embed URL when API fails - uses proper embed format
const generateFallbackEmbedUrl = (source: string, id: string, streamNo: number): string => {
  // Use embed.damitv.pro embed format
  return `https://embed.damitv.pro/embed/${source}/${id}/${streamNo}`;
};

// Fetch all streams for a match - fetches real embed URLs from API with fallback
export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();
  
  console.log(`🎬 Fetching streams for: ${match.title}`);
  console.log(`📡 Match sources from API:`, match.sources);
  
  // Fetch real embed URLs from the stream API
  if (match.sources && match.sources.length > 0) {
    let streamNumber = 1;
    
    // Fetch all sources in parallel
    const streamPromises = match.sources.map(src => 
      src.source && src.id ? fetchStreamFromApi(src.source, src.id) : Promise.resolve([])
    );
    
    const results = await Promise.all(streamPromises);
    
    for (let i = 0; i < results.length; i++) {
      const streams = results[i];
      const src = match.sources[i];
      
      if (streams.length > 0) {
        // API returned stream data
        for (const stream of streams) {
          if (stream.embedUrl) {
            allStreams.push({
              ...stream,
              streamNo: streamNumber,
              name: stream.isHls ? `HD Stream ${streamNumber}` : `Stream ${streamNumber}`
            });
            sourcesWithStreams.add(src.source);
            console.log(`✅ Stream ${streamNumber}: ${src.source}/${src.id} → ${stream.embedUrl} (HLS: ${stream.isHls || false})`);
            streamNumber++;
          }
        }
      } else if (src.source && src.id) {
        // API failed - generate fallback embed URL
        const fallbackUrl = generateFallbackEmbedUrl(src.source, src.id, streamNumber);
        console.log(`⚠️ Using fallback for ${src.source}/${src.id}: ${fallbackUrl}`);
        
        allStreams.push({
          id: src.id,
          streamNo: streamNumber,
          language: 'EN',
          hd: true,
          embedUrl: fallbackUrl,
          source: src.source,
          timestamp: Date.now(),
          name: `Stream ${streamNumber}`,
          isHls: false
        } as Stream);
        
        sourcesWithStreams.add(src.source);
        streamNumber++;
      }
    }
  }
  
  // If still no streams, create fallback using match ID with proper embed format
  if (allStreams.length === 0 && match.id) {
    console.warn(`⚠️ No streams from API, using match ID fallback: ${match.id}`);
    // Use embed.damitv.pro embed format
    const fallbackUrl = `https://embed.damitv.pro/embed/alpha/${match.id}/1`;
    
    allStreams.push({
      id: match.id,
      streamNo: 1,
      language: 'EN',
      hd: true,
      embedUrl: fallbackUrl,
      source: 'alpha',
      timestamp: Date.now(),
      name: 'Stream 1',
      isHls: false
    } as Stream);
    
    sourcesWithStreams.add('alpha');
  }

  const sourceNames = Array.from(sourcesWithStreams);
  const hlsCount = allStreams.filter(s => s.isHls).length;
  console.log(`✅ Fetched ${allStreams.length} streams (${hlsCount} HLS direct streams)`);

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
