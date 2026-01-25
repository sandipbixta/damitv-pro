// Sports API Service - fetches from streamed.pk/su API
import { Sport, Match, Stream, Source } from '../types/sports';
import { getEmbedDomainSync, buildEmbedUrl } from '../utils/embedDomains';

// API endpoints to try (direct calls)
const API_BASES = [
  'https://streamed.pk/api',
  'https://streamed.su/api'
];

// CORS proxy fallbacks (used if direct calls fail)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Legacy stream base URL
const STREAM_BASE = 'https://streamed.pk';

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for match data
const STREAM_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for stream data

// Track working endpoints for faster subsequent requests
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
  const timeout = 3000; // 3 second timeout

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

// Parse WatchFooty match data to our Match format
const parseMatchData = (item: any): Match | null => {
  try {
    if (!item || !item.id) return null;

    // Parse teams from title if not provided separately
    let homeTeam = '';
    let awayTeam = '';
    const title = item.title || item.name || '';

    // Check for team objects first
    if (item.teams?.home?.name) {
      homeTeam = item.teams.home.name;
    }
    if (item.teams?.away?.name) {
      awayTeam = item.teams.away.name;
    }

    // Fall back to parsing from title
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

    // Parse date - WatchFooty might use different formats
    let matchDate = 0;
    if (item.date) {
      if (typeof item.date === 'number') {
        // Could be seconds or milliseconds
        matchDate = item.date > 9999999999 ? item.date : item.date * 1000;
      } else if (typeof item.date === 'string') {
        matchDate = new Date(item.date).getTime();
      }
    } else if (item.time) {
      if (typeof item.time === 'number') {
        matchDate = item.time > 9999999999 ? item.time : item.time * 1000;
      } else {
        matchDate = new Date(item.time).getTime();
      }
    }

    // Source priority order - charlie and bravo have more reliable IDs
    const SOURCE_PRIORITY: Record<string, number> = {
      'charlie': 1,
      'bravo': 2,
      'delta': 3,
      'echo': 4,
      'alpha': 5  // alpha last - often has incomplete IDs
    };

    // Build sources array
    const sources: Source[] = [];
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((src: any) => {
        if (src.source && src.id) {
          sources.push({ source: src.source, id: src.id });
        } else if (typeof src === 'string') {
          sources.push({ source: src, id: String(item.id) });
        }
      });
      // Sort sources by priority (charlie first, alpha last)
      sources.sort((a, b) => {
        const priorityA = SOURCE_PRIORITY[a.source] || 99;
        const priorityB = SOURCE_PRIORITY[b.source] || 99;
        return priorityA - priorityB;
      });
    }

    // If no sources but match has id, create a default source (charlie preferred)
    if (sources.length === 0 && item.id) {
      sources.push({ source: 'charlie', id: String(item.id) });
    }

    const sportId = mapCategoryToSportId(item.category || item.sport || '');

    // Build poster URL
    const posterUrl = item.poster
      ? (item.poster.startsWith('http') ? item.poster : `${STREAM_BASE}${item.poster.startsWith('/') ? '' : '/'}${item.poster}`)
      : '';

    // Build team badge URLs - use /api/images/proxy/ path with .webp extension
    const homeBadgeRaw = item.teams?.home?.badge || '';
    const homeBadge = homeBadgeRaw
      ? (homeBadgeRaw.startsWith('http') ? homeBadgeRaw : `${STREAM_BASE}/api/images/proxy/${homeBadgeRaw}.webp`)
      : '';

    const awayBadgeRaw = item.teams?.away?.badge || '';
    const awayBadge = awayBadgeRaw
      ? (awayBadgeRaw.startsWith('http') ? awayBadgeRaw : `${STREAM_BASE}/api/images/proxy/${awayBadgeRaw}.webp`)
      : '';

    return {
      id: String(item.id),
      title: title || `${homeTeam} vs ${awayTeam}`,
      category: sportId,
      sportId: sportId,
      date: matchDate,
      poster: posterUrl,
      popular: item.popular === true || item.featured === true,
      teams: {
        home: {
          name: homeTeam || item.teams?.home?.name || '',
          badge: homeBadge
        },
        away: {
          name: awayTeam || item.teams?.away?.name || '',
          badge: awayBadge
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
  const cacheKey = 'streamed-sports';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi('sports');

    let sports: Sport[] = [];

    if (Array.isArray(data)) {
      sports = data.map((item: any) => ({
        id: mapCategoryToSportId(item.id || item.name || item.slug || ''),
        name: item.name || item.title || item.id || ''
      })).filter(s => s.id && s.name);
    } else if (data.sports && Array.isArray(data.sports)) {
      sports = data.sports.map((item: any) => ({
        id: mapCategoryToSportId(item.id || item.name || item.slug || ''),
        name: item.name || item.title || item.id || ''
      })).filter(s => s.id && s.name);
    }

    // If API doesn't return sports, use predefined list
    if (sports.length === 0) {
      sports = [
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
    }

    setCachedData(cacheKey, sports);
    console.log(`✅ Loaded ${sports.length} sports categories`);
    return sports;
  } catch (error) {
    console.error('❌ Error fetching sports:', error);
    // Return fallback sports on error
    return [
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
  }
};

// Fetch all matches
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching matches from Sports API...');

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
    console.log(`✅ Loaded - Fetched ${matches.length} matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    return [];
  }
};

// Fetch matches by sport category
export const fetchMatches = async (sportId: string): Promise<Match[]> => {
  const cacheKey = `streamed-matches-${sportId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🔄 Fetching ${sportId} matches from Sports API...`);

    // Try sport-specific endpoint first
    try {
      const data = await fetchFromApi(`matches/${sportId}`);

      let matches: Match[] = [];
      if (Array.isArray(data)) {
        matches = data.map(parseMatchData).filter((m): m is Match => m !== null);
      } else if (data.matches && Array.isArray(data.matches)) {
        matches = data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
      } else if (data.data && Array.isArray(data.data)) {
        matches = data.data.map(parseMatchData).filter((m): m is Match => m !== null);
      }

      if (matches.length > 0) {
        setCachedData(cacheKey, matches);
        console.log(`✅ Loaded - ${matches.length} ${sportId} matches`);
        return matches;
      }
    } catch {
      // Fall through to filter from all matches
    }

    // Fallback: fetch all matches and filter by sport
    const allMatches = await fetchAllMatches();
    const sportMatches = allMatches.filter(match =>
      match.sportId === sportId ||
      match.category === sportId ||
      mapCategoryToSportId(match.category) === sportId
    );

    setCachedData(cacheKey, sportMatches);
    console.log(`✅ Filtered ${sportMatches.length} ${sportId} matches from all`);
    return sportMatches;
  } catch (error) {
    console.error(`❌ Error fetching ${sportId} matches:`, error);
    throw error;
  }
};

// Fetch live matches
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-live';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching live matches from Sports API...');

    // Try live endpoint first
    try {
      const data = await fetchFromApi('matches/live');

      let matches: Match[] = [];
      if (Array.isArray(data)) {
        matches = data.map(parseMatchData).filter((m): m is Match => m !== null);
      } else if (data.matches && Array.isArray(data.matches)) {
        matches = data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
      } else if (data.data && Array.isArray(data.data)) {
        matches = data.data.map(parseMatchData).filter((m): m is Match => m !== null);
      }

      if (matches.length > 0) {
        setCachedData(cacheKey, matches);
        console.log(`✅ Loaded - ${matches.length} live matches`);
        return matches;
      }
    } catch {
      // Fall through to filter from all matches
    }

    // Fallback: filter from all matches based on time
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

// Fetch popular matches
export const fetchPopularMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-popular';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching popular matches from Sports API...');

    const data = await fetchFromApi('matches/popular');

    let matches: Match[] = [];
    if (Array.isArray(data)) {
      matches = data.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.matches && Array.isArray(data.matches)) {
      matches = data.matches.map(parseMatchData).filter((m): m is Match => m !== null);
    } else if (data.data && Array.isArray(data.data)) {
      matches = data.data.map(parseMatchData).filter((m): m is Match => m !== null);
    }

    setCachedData(cacheKey, matches);
    console.log(`✅ Loaded - ${matches.length} popular matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching popular matches:', error);
    // Fallback: return all matches marked as popular
    const allMatches = await fetchAllMatches();
    return allMatches.filter(m => m.popular);
  }
};

// Fetch a specific match by ID
export const fetchMatch = async (sportId: string, matchId: string): Promise<Match> => {
  const cacheKey = `streamed-match-${matchId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🔄 Fetching match ${matchId} from Sports API...`);

    // Try match detail endpoint first
    try {
      const data = await fetchFromApi(`match/${matchId}`);

      if (data) {
        const match = parseMatchData(data.match || data.data || data);
        if (match) {
          setCachedData(cacheKey, match);
          console.log(`✅ Found match: ${match.title}`);
          return match;
        }
      }
    } catch {
      // Fall through to search in all matches
    }

    // Fallback: search in all matches
    const allMatches = await fetchAllMatches();

    const match = allMatches.find(m => {
      if (m.id === matchId) return true;
      // Check if the matchId is just the numeric part
      const numericMatch = m.id.match(/-(\d+)$/);
      if (numericMatch && numericMatch[1] === matchId) return true;
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

// Build ad-free embed URL
const buildAdFreeEmbedUrl = (
  matchId: string,
  source: string,
  streamNo: number = 1
): string => {
  const domain = getEmbedDomainSync();
  return buildEmbedUrl(domain, source, matchId, streamNo);
};

// Fetch stream for a match - uses ad-free embed player
export const fetchSimpleStream = async (source: string, id: string, category?: string): Promise<Stream[]> => {
  const cacheKey = `streamed-stream-${source}-${id}`;
  const cached = getCachedData(cacheKey, STREAM_CACHE_DURATION);
  if (cached) return cached;

  try {
    console.log(`🎬 Building embed URL for source: ${source}, id: ${id}`);

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

    console.log(`✅ Embed URL: ${adFreeUrl}`);
    setCachedData(cacheKey, [primaryStream]);
    return [primaryStream];
  } catch (error) {
    console.error(`❌ Error building URL for ${source}/${id}:`, error);
    return [];
  }
};

// Generate fallback embed URL - uses embed.damitv.pro
const generateFallbackEmbedUrl = (source: string, id: string, streamNo: number): string => {
  const domain = getEmbedDomainSync();
  return buildEmbedUrl(domain, source, id, streamNo);
};

// Fetch streams from API for a specific source
const fetchStreamsFromApi = async (source: string, id: string): Promise<Stream[]> => {
  try {
    const data = await fetchFromApi(`stream/${source}/${id}`);

    if (!data) return [];

    // API returns array of stream objects
    const streamsArray = Array.isArray(data) ? data : [data];

    return streamsArray.map((s: any, index: number) => ({
      id: s.id || id,
      streamNo: s.streamNo || index + 1,
      language: s.language || 'English',
      hd: s.hd !== false,
      embedUrl: s.embedUrl || generateFallbackEmbedUrl(source, id, s.streamNo || index + 1),
      source: s.source || source,
      timestamp: Date.now(),
      name: s.language ? `${s.language} ${s.streamNo || index + 1}` : undefined,
      viewers: s.viewers || 0
    }));
  } catch (error) {
    console.error(`❌ Error fetching streams for ${source}/${id}:`, error);
    return [];
  }
};

// Fetch all streams for a match from API
export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();

  console.log(`🎬 Fetching streams for: ${match.title}`);
  console.log(`📡 Match sources:`, match.sources);

  if (match.sources && match.sources.length > 0) {
    // Fetch streams from API for each source in parallel
    const streamPromises = match.sources.map(async (src) => {
      if (src.source && src.id) {
        const streams = await fetchStreamsFromApi(src.source, src.id);

        if (streams.length > 0) {
          sourcesWithStreams.add(src.source);
          return streams;
        }

        // Fallback: generate URL if API returns nothing
        console.log(`⚠️ No API streams for ${src.source}/${src.id}, using fallback`);
        sourcesWithStreams.add(src.source);
        return [{
          id: src.id,
          streamNo: 1,
          language: 'English',
          hd: true,
          embedUrl: generateFallbackEmbedUrl(src.source, src.id, 1),
          source: src.source,
          timestamp: Date.now(),
          name: `${src.source.toUpperCase()} 1`
        }];
      }
      return [];
    });

    const results = await Promise.all(streamPromises);
    results.forEach(streams => allStreams.push(...streams));
  }

  // If no streams found, create fallback using match ID
  if (allStreams.length === 0 && match.id) {
    console.warn(`⚠️ No streams from sources, using match ID fallback: ${match.id}`);

    // Try common sources
    const fallbackSources = ['alpha', 'bravo', 'charlie'];
    for (const source of fallbackSources) {
      allStreams.push({
        id: match.id,
        streamNo: 1,
        language: 'English',
        hd: true,
        embedUrl: generateFallbackEmbedUrl(source, match.id, 1),
        source: source,
        timestamp: Date.now(),
        name: `${source.toUpperCase()} 1`
      });
      sourcesWithStreams.add(source);
    }
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
  // Add .webp extension if not present
  const ext = badge.includes('.') ? '' : '.webp';
  return `${STREAM_BASE}/api/images/proxy/${badge}${ext}`;
};

// Get league logo URL
export const getLeagueLogoUrl = (leagueId: string): string => {
  if (!leagueId) return '';
  if (leagueId.startsWith('http')) return leagueId;
  // Add .webp extension if not present
  const ext = leagueId.includes('.') ? '' : '.webp';
  return `${STREAM_BASE}/api/images/proxy/${leagueId}${ext}`;
};

// Export API base for reference
export const STREAMED_API_BASE = STREAM_BASE;
