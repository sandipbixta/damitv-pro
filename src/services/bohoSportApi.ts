// SportsRC API Service - fetches directly from api.sportsrc.org
import { Sport, Match, Stream, Source } from '../types/sports';
import { getEmbedDomainSync, buildEmbedUrl, EMBED_DOMAIN } from '../utils/embedDomains';

// Primary API base URL (new sportsrc.org API)
const API_BASE = 'https://api.sportsrc.org';

// Fallback API endpoints (legacy)
const FALLBACK_API_BASES = [
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

// Fetch from sportsrc.org API with query params
const fetchFromSportsrcApi = async (params: Record<string, string>): Promise<any> => {
  const timeout = 5000; // 5 second timeout

  const fetchWithTimeout = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal,
      cache: 'default'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/?${queryString}`;

  // Try direct call first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.log(`📡 Fetching: ${url}`);
    const data = await fetchWithTimeout(url, controller.signal);
    clearTimeout(timeoutId);
    console.log(`✅ API success: ${url}`);
    return data;
  } catch (error) {
    console.warn(`⚠️ Direct API failed: ${url}`);
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      
      const data = await fetchWithTimeout(proxyUrl, controller.signal);
      clearTimeout(timeoutId);
      console.log(`✅ CORS proxy success for sportsrc API`);
      return data;
    } catch (error) {
      console.warn(`⚠️ CORS proxy failed`);
    }
  }

  throw new Error(`SportsRC API failed for params: ${queryString}`);
};

// Legacy fetch for fallback endpoints (used for streams)
const fetchFromLegacyApi = async (endpoint: string): Promise<any> => {
  const timeout = 3000;

  const fetchWithTimeout = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal,
      cache: 'default'
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
      return data;
    } catch {
      workingApiBase = null;
    }
  }

  // Try direct calls
  for (const baseUrl of FALLBACK_API_BASES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const url = `${baseUrl}/${endpoint}`;
      
      const data = await fetchWithTimeout(url, controller.signal);
      clearTimeout(timeoutId);
      workingApiBase = baseUrl;
      return data;
    } catch (error) {
      console.warn(`⚠️ Legacy API failed: ${baseUrl}/${endpoint}`);
    }
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    for (const baseUrl of FALLBACK_API_BASES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const targetUrl = `${baseUrl}/${endpoint}`;
        const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
        
        const data = await fetchWithTimeout(proxyUrl, controller.signal);
        clearTimeout(timeoutId);
        workingApiBase = baseUrl;
        workingProxy = proxy;
        return data;
      } catch (error) {
        // Continue
      }
    }
  }

  throw new Error(`All legacy API endpoints failed for: ${endpoint}`);
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
// Now also includes CDN Live TV API as additional source
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching matches from SportsRC API...');
    
    // Import CDN API dynamically to avoid circular dependencies
    const { fetchCDNMatches } = await import('./cdnSportsApi');
    
    // Fetch from sportsrc.org API and CDN in parallel
    // Try multiple sport categories from sportsrc
    const sportCategories = ['football', 'basketball', 'tennis', 'cricket', 'hockey', 'baseball', 'rugby'];
    
    const [sportsrcResults, cdnMatches] = await Promise.all([
      Promise.all(
        sportCategories.map(category => 
          fetchFromSportsrcApi({ data: 'matches', category }).catch(() => null)
        )
      ),
      fetchCDNMatches().catch(() => [])
    ]);

    let matches: Match[] = [];

    // Parse SportsRC API data from all categories
    for (const sportsrcData of sportsrcResults) {
      if (sportsrcData) {
        let categoryMatches: Match[] = [];
        if (Array.isArray(sportsrcData)) {
          categoryMatches = sportsrcData.map(parseMatchData).filter((m): m is Match => m !== null);
        } else if (sportsrcData.matches && Array.isArray(sportsrcData.matches)) {
          categoryMatches = sportsrcData.matches.map(parseMatchData).filter((m): m is Match => m !== null);
        } else if (sportsrcData.data && Array.isArray(sportsrcData.data)) {
          categoryMatches = sportsrcData.data.map(parseMatchData).filter((m): m is Match => m !== null);
        } else if (sportsrcData.events && Array.isArray(sportsrcData.events)) {
          categoryMatches = sportsrcData.events.map(parseMatchData).filter((m): m is Match => m !== null);
        }
        matches = [...matches, ...categoryMatches];
      }
    }

    // Merge CDN matches (dedupe by ID, prefer BOHO data if duplicate)
    const matchMap = new Map<string, Match>();
    matches.forEach(m => matchMap.set(m.id, m));
    cdnMatches.forEach(m => {
      if (!matchMap.has(m.id)) {
        matchMap.set(m.id, m);
      }
    });
    
    matches = Array.from(matchMap.values());

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} total matches (BOHO + CDN)`);
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
    // Use sportsrc.org detail endpoint for stream data
    console.log(`📡 Fetching stream data for source: ${source}, id: ${id}`);
    const data = await fetchFromSportsrcApi({ data: 'detail', category: source, id: id }).catch(() => null);
    
    // If sportsrc fails, try legacy endpoint
    const streamData = data || await fetchFromLegacyApi(`stream/${source}/${id}`).catch(() => null);
    
    console.log(`📦 Stream API response for ${source}/${id}:`, streamData);
    
    // Handle different response formats
    let streamArray: any[] = [];
    if (Array.isArray(streamData)) {
      streamArray = streamData;
    } else if (streamData?.streams && Array.isArray(streamData.streams)) {
      streamArray = streamData.streams;
    } else if (streamData?.data && Array.isArray(streamData.data)) {
      streamArray = streamData.data;
    } else if (streamData?.embed || streamData?.embedUrl || streamData?.url) {
      // Single stream object
      streamArray = [streamData];
    }
    
    if (streamArray.length > 0) {
      const streams = streamArray.map((item: any, index: number) => {
        const { url, isHls } = extractStreamUrl(item);
        const streamNo = item.streamNo || index + 1;
        const streamId = item.id || id;
        const streamSource = item.source || source;
        
        // Use embedsports.top API format for streamed.pk sources
        const embedUrl = isHls ? url : `${EMBED_DOMAIN}/api/getstream?source=${streamSource}&match=${streamId}&stream=${streamNo}`;
        
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

// Generate fallback embed URL when API fails - uses embedsports.top format
const generateFallbackEmbedUrl = (source: string, id: string, streamNo: number): string => {
  // Use embedsports.top API format
  return `${EMBED_DOMAIN}/api/getstream?source=${source}&match=${id}&stream=${streamNo}`;
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
