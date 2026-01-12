// StreamedPK API Service - fetches from streamed.pk API
import { Sport, Match, Stream, Source } from '../types/sports';

// API Base URL
export const STREAMED_PK_BASE = 'https://streamed.pk';
const API_BASE = `${STREAMED_PK_BASE}/api`;

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STREAM_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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
    cache.delete(key);
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Cache SET: ${key}`);
};

// Fetch from StreamedPK API
const fetchFromApi = async (endpoint: string): Promise<any> => {
  const timeout = 8000; // 8 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `${API_BASE}/${endpoint}`;
    console.log(`🔄 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ API fetch failed: ${endpoint}`, error);
    throw error;
  }
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

// Get team badge URL from StreamedPK
export const getTeamBadgeUrl = (badge: string): string => {
  if (!badge) return '';
  if (badge.startsWith('http')) return badge;
  return `${STREAMED_PK_BASE}/api/images/badge/${badge}.webp`;
};

// Get poster/image URL from StreamedPK
export const getBohoImageUrl = (poster: string): string => {
  if (!poster) return '';
  if (poster.startsWith('http')) return poster;
  return `${STREAMED_PK_BASE}/api/images/proxy/${poster}.webp`;
};

// Parse StreamedPK match data to our Match format
const parseMatchData = (item: any): Match | null => {
  try {
    if (!item || !item.id) return null;

    // Parse teams from title if not in teams object
    let homeTeam = item.teams?.home?.name || '';
    let awayTeam = item.teams?.away?.name || '';
    const title = item.title || '';
    
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

    // Parse date (already in milliseconds from API)
    const matchDate = typeof item.date === 'number' ? item.date : 0;

    // Build sources array
    const sources: Source[] = [];
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((src: any) => {
        if (src.source && src.id) {
          sources.push({ source: src.source, id: src.id });
        }
      });
    }

    const sportId = mapCategoryToSportId(item.category || '');

    return {
      id: String(item.id),
      title: title,
      category: sportId,
      sportId: sportId,
      date: matchDate,
      poster: item.poster || '',
      popular: item.popular === true,
      teams: {
        home: {
          name: homeTeam,
          badge: item.teams?.home?.badge || ''
        },
        away: {
          name: awayTeam,
          badge: item.teams?.away?.badge || ''
        }
      },
      sources: sources,
      viewerCount: 0
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
    
    const sports: Sport[] = Array.isArray(data) 
      ? data.map((s: any) => ({ id: s.id, name: s.name }))
      : [];
    
    setCachedData(cacheKey, sports);
    console.log(`✅ Fetched ${sports.length} sports from StreamedPK`);
    return sports;
  } catch (error) {
    console.error('❌ Error fetching sports:', error);
    // Return fallback sports
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
    console.log('🔄 Fetching all matches from StreamedPK...');
    const data = await fetchFromApi('matches/all');

    const matches: Match[] = Array.isArray(data) 
      ? data.map(parseMatchData).filter((m): m is Match => m !== null)
      : [];

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} matches from StreamedPK`);
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
    console.log(`🔄 Fetching ${sportId} matches from StreamedPK...`);
    const data = await fetchFromApi(`matches/${sportId}`);

    const matches: Match[] = Array.isArray(data) 
      ? data.map(parseMatchData).filter((m): m is Match => m !== null)
      : [];

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} ${sportId} matches`);
    return matches;
  } catch (error) {
    console.error(`❌ Error fetching ${sportId} matches:`, error);
    // Fallback to filtering all matches
    const allMatches = await fetchAllMatches();
    return allMatches.filter(m => m.category === sportId || m.sportId === sportId);
  }
};

// Fetch live matches
export const fetchLiveMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-live';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching live matches from StreamedPK...');
    const data = await fetchFromApi('matches/live');

    const matches: Match[] = Array.isArray(data) 
      ? data.map(parseMatchData).filter((m): m is Match => m !== null)
      : [];

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching live matches:', error);
    return [];
  }
};

// Fetch today's matches
export const fetchTodayMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-today';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching today matches from StreamedPK...');
    const data = await fetchFromApi('matches/all-today');

    const matches: Match[] = Array.isArray(data) 
      ? data.map(parseMatchData).filter((m): m is Match => m !== null)
      : [];

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} today matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching today matches:', error);
    return fetchAllMatches();
  }
};

// Fetch popular matches
export const fetchPopularMatches = async (): Promise<Match[]> => {
  const cacheKey = 'streamed-matches-popular';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching popular matches from StreamedPK...');
    const data = await fetchFromApi('matches/all/popular');

    const matches: Match[] = Array.isArray(data) 
      ? data.map(parseMatchData).filter((m): m is Match => m !== null)
      : [];

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} popular matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching popular matches:', error);
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
    const allMatches = await fetchAllMatches();
    
    const match = allMatches.find(m => m.id === matchId);

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

// Fetch streams for a source - uses StreamedPK Streams API
export const fetchSimpleStream = async (source: string, id: string): Promise<Stream[]> => {
  const cacheKey = `streamed-stream-${source}-${id}`;
  const cached = getCachedData(cacheKey, STREAM_CACHE_DURATION);
  if (cached) return cached;

  try {
    console.log(`🎬 Fetching streams from StreamedPK: ${source}/${id}`);
    
    const data = await fetchFromApi(`stream/${source}/${id}`);
    
    const streams: Stream[] = Array.isArray(data) 
      ? data.map((s: any) => ({
          id: s.id || id,
          streamNo: s.streamNo || 1,
          language: s.language || 'EN',
          hd: s.hd !== false,
          embedUrl: s.embedUrl || '',
          source: s.source || source,
          timestamp: Date.now()
        }))
      : [];

    if (streams.length > 0) {
      console.log(`✅ Found ${streams.length} streams for ${source}/${id}`);
      setCachedData(cacheKey, streams);
      return streams;
    }

    // Fallback: build default streams if API returns empty
    console.warn(`⚠️ No streams from API, generating fallback for ${source}/${id}`);
    const fallbackStreams: Stream[] = [1, 2, 3].map(num => ({
      id: id,
      streamNo: num,
      language: 'EN',
      hd: true,
      embedUrl: `${STREAMED_PK_BASE}/embed/${source}/${id}/${num}`,
      source: source,
      timestamp: Date.now()
    }));
    
    setCachedData(cacheKey, fallbackStreams);
    return fallbackStreams;
  } catch (error) {
    console.error(`❌ Error fetching streams for ${source}/${id}:`, error);
    
    // Return fallback streams on error
    return [1, 2, 3].map(num => ({
      id: id,
      streamNo: num,
      language: 'EN',
      hd: true,
      embedUrl: `${STREAMED_PK_BASE}/embed/${source}/${id}/${num}`,
      source: source,
      timestamp: Date.now()
    }));
  }
};

// Fetch all streams for a match from all sources
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
    // Fetch streams from all sources in parallel
    const streamPromises = match.sources.map(async (src, index) => {
      try {
        const streams = await fetchSimpleStream(src.source, src.id);
        return { source: src.source, streams, index };
      } catch {
        return { source: src.source, streams: [], index };
      }
    });

    const results = await Promise.all(streamPromises);
    
    let globalStreamNo = 1;
    for (const result of results.sort((a, b) => a.index - b.index)) {
      if (result.streams.length > 0) {
        sourcesWithStreams.add(result.source);
        for (const stream of result.streams) {
          allStreams.push({
            ...stream,
            streamNo: globalStreamNo++
          });
        }
      }
    }
  }

  const sourceNames = Array.from(sourcesWithStreams);
  
  console.log(`📊 Streams result: ${allStreams.length} streams from ${sourceNames.length} sources`);
  
  return {
    streams: allStreams,
    sourcesChecked: match.sources?.length || 0,
    sourcesWithStreams: sourcesWithStreams.size,
    sourceNames
  };
};

// Alias for backward compatibility
export const fetchAllStreams = fetchAllMatchStreams;

// Export API base for image URLs
export const BOHO_API_BASE = STREAMED_PK_BASE;
