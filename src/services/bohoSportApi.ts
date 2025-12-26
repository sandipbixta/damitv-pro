// BOHOSport API Service - fetches from sportsrc.org API
import { Sport, Match, Stream, Source } from '../types/sports';
import { supabase } from '@/integrations/supabase/client';

// BOHOSport embed base URL (ad-free iframe player)
const BOHOSPORT_EMBED_BASE = 'https://embed.damitv.pro';

// SportsRC API base URL for match details
const SPORTSRC_API_BASE = 'https://api.sportsrc.org';

// Legacy stream base URL (fallback only)
const STREAM_BASE = 'https://streamed.su';

// Build BOHOSport embed URL with query parameters
const buildBohoSportEmbedUrl = (matchId: string, source: string): string => {
  return `${BOHOSPORT_EMBED_BASE}/?id=${matchId}&source=${source}`;
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

// Fetch all matches from API via proxy
export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'boho-matches-all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching matches via proxy...');
    
    const { data, error } = await supabase.functions.invoke('boho-sport', {
      body: { endpoint: '' },
    });

    if (error) {
      console.error('❌ Proxy error:', error);
      return [];
    }

    console.log('📦 Proxy response received');

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

// Fetch stream for a match - uses DAMITV ad-free embed player
export const fetchSimpleStream = async (source: string, id: string, category?: string): Promise<Stream[]> => {
  const cacheKey = `boho-stream-${source}-${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🎬 Building DAMITV embed URL for source: ${source}, id: ${id}`);

    // Primary: DAMITV embed format (ad-free, same as bohosoccer.blogspot.com)
    const damitvEmbedUrl = `${BOHOSPORT_EMBED_BASE}/?id=${id}&source=${source}`;
    
    const streams: Stream[] = [
      {
        id: id,
        streamNo: 1,
        language: 'EN',
        hd: true,
        embedUrl: damitvEmbedUrl,
        source: source,
        timestamp: Date.now()
      }
    ];
    
    // Add additional sources for fallback
    const additionalSources = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
    additionalSources.forEach((altSource, index) => {
      if (altSource !== source) {
        streams.push({
          id: id,
          streamNo: index + 2,
          language: 'EN',
          hd: true,
          embedUrl: `${BOHOSPORT_EMBED_BASE}/?id=${id}&source=${altSource}`,
          source: altSource,
          timestamp: Date.now()
        });
      }
    });

    console.log(`✅ DAMITV embed URLs created: ${streams.length} streams`);
    setCachedData(cacheKey, streams);
    return streams;
  } catch (error) {
    console.error(`❌ Error building DAMITV URL for ${source}/${id}:`, error);
    
    // Fallback with echo source
    const fallbackUrl = `${BOHOSPORT_EMBED_BASE}/?id=${id}&source=echo`;
    const fallbackStream: Stream = {
      id: id,
      streamNo: 1,
      language: 'EN',
      hd: true,
      embedUrl: fallbackUrl,
      source: 'echo',
      timestamp: Date.now()
    };
    return [fallbackStream];
  }
};

// Fetch match details from SportsRC API to get correct stream sources
const fetchMatchSourcesFromAPI = async (matchId: string, category: string = 'football'): Promise<Source[]> => {
  try {
    const url = `${SPORTSRC_API_BASE}/?data=detail&category=${category}&id=${matchId}`;
    console.log(`🔍 Fetching match sources from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data?.sources && Array.isArray(result.data.sources)) {
      console.log(`✅ Found ${result.data.sources.length} sources from SportsRC API`);
      return result.data.sources.map((s: any) => ({
        source: s.source,
        id: s.id
      }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching match sources from API:', error);
    return [];
  }
};

// Fetch all streams for a match - uses DAMITV embed directly
export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();
  
  // Extract match slug from URL-friendly title or use the ID
  // Format: match-title-matchId (e.g., manchester-united-vs-newcastle-united-2267249)
  const matchSlug = match.title
    ? match.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + match.id
    : match.id;
  
  console.log(`🎬 Building DAMITV streams for: ${matchSlug}`);

  // Primary sources to try - these work with DAMITV embed
  const primarySources = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'];
  
  // Create streams for each source
  primarySources.forEach((source, index) => {
    const embedUrl = `${BOHOSPORT_EMBED_BASE}/?id=${matchSlug}&source=${source}`;
    const stream: Stream = {
      id: matchSlug,
      streamNo: index + 1,
      language: 'EN',
      hd: index < 3, // First 3 are HD
      embedUrl: embedUrl,
      source: source.charAt(0).toUpperCase() + source.slice(1), // Capitalize for display
      timestamp: Date.now()
    };
    allStreams.push(stream);
    sourcesWithStreams.add(source);
    console.log(`✅ Added DAMITV stream: ${source} - ${embedUrl}`);
  });

  // Also add match sources if available (for variety)
  if (match.sources && match.sources.length > 0) {
    match.sources.forEach((source, index) => {
      const embedUrl = `${BOHOSPORT_EMBED_BASE}/?id=${source.id}&source=${source.source}`;
      const stream: Stream = {
        id: source.id,
        streamNo: allStreams.length + 1,
        language: 'EN',
        hd: true,
        embedUrl: embedUrl,
        source: source.source.charAt(0).toUpperCase() + source.source.slice(1),
        timestamp: Date.now()
      };
      allStreams.push(stream);
      sourcesWithStreams.add(source.source);
    });
  }

  const sourceNames = Array.from(sourcesWithStreams);
  console.log(`🎬 DAMITV streams ready for ${match.title}: ${allStreams.length} streams`);

  return {
    streams: allStreams,
    sourcesChecked: primarySources.length,
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
