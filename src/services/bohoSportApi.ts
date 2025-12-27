// BOHOSport API Service - fetches from sportsrc.org API
import { Sport, Match, Stream, Source } from '../types/sports';
import { supabase } from '@/integrations/supabase/client';

// Ad-free embed player (preferred)
const DAMITV_EMBED_BASE = 'https://embed.damitv.pro';

// Legacy stream base URL (fallback only)

// Legacy stream base URL (fallback only)
const STREAM_BASE = 'https://streamed.su';

// Build ad-free embed URL
const buildAdFreeEmbedUrl = (matchId: string, source: string): string => {
  return `${DAMITV_EMBED_BASE}/?id=${matchId}&source=${source}`;
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

// Extended source interface with embedUrl
interface FullSource extends Source {
  embedUrl?: string;
  streamNo?: number;
  language?: string;
  hd?: boolean;
  viewers?: number;
  name?: string;
}

// All known stream source endpoints to check
const STREAM_SOURCES = ['admin', 'charlie', 'delta', 'echo', 'golf'];

// Fetch streams from a specific source endpoint
const fetchStreamsFromSource = async (
  sourceName: string, 
  matchSlug: string
): Promise<FullSource[]> => {
  try {
    const endpoint = `stream/${sourceName}/${matchSlug}`;
    console.log(`🔍 Checking source: ${sourceName} with slug: ${matchSlug}`);
    
    const { data, error } = await supabase.functions.invoke('boho-sport', {
      body: { endpoint }
    });
    
    if (error || !data) {
      console.log(`⚠️ No data from ${sourceName}`);
      return [];
    }
    
    const streams = Array.isArray(data) ? data : [data];
    
    return streams
      .filter((s: any) => s && (s.embedUrl || s.embed))
      .map((s: any, index: number) => ({
        source: sourceName,
        id: s.id || matchSlug,
        embedUrl: s.embedUrl || s.embed,
        streamNo: s.streamNo || index + 1,
        language: s.language || 'EN',
        hd: s.hd !== false,
        viewers: s.viewers || 0,
        name: s.name || `${sourceName.toUpperCase()} ${s.streamNo || index + 1}`
      }));
  } catch (error) {
    console.error(`❌ Error fetching from ${sourceName}:`, error);
    return [];
  }
};

// Build match slug from match data for API requests
const buildMatchSlug = (match: Match): string => {
  // Try to build slug from match title: "Team A vs Team B" -> "team-a-vs-team-b"
  const title = match.title || '';
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Add category and match ID for uniqueness
  const category = match.category || match.sportId || 'football';
  return `${cleanTitle}-${category}-${match.id}`;
};

// Fetch all streams for a match from ALL source endpoints
export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();
  const matchSlug = buildMatchSlug(match);
  
  console.log(`🔍 Fetching streams for: ${match.title} (slug: ${matchSlug})`);
  
  // Method 1: Try fetching from all known sources in parallel
  const sourcePromises = STREAM_SOURCES.map(source => 
    fetchStreamsFromSource(source, matchSlug)
  );
  
  // Also try with match.sources if available
  const matchSourcePromises = (match.sources || []).map(async (src) => {
    try {
      const endpoint = `stream/${src.source}/${src.id}`;
      const { data, error } = await supabase.functions.invoke('boho-sport', {
        body: { endpoint }
      });
      
      if (error || !data) return [];
      
      const streams = Array.isArray(data) ? data : [data];
      return streams
        .filter((s: any) => s && (s.embedUrl || s.embed))
        .map((s: any, index: number) => ({
          source: s.source || src.source,
          id: s.id || src.id,
          embedUrl: s.embedUrl || s.embed,
          streamNo: s.streamNo || index + 1,
          language: s.language || 'EN',
          hd: s.hd !== false,
          viewers: s.viewers || 0,
          name: s.name || `${(s.source || src.source).toUpperCase()} ${s.streamNo || index + 1}`
        }));
    } catch {
      return [];
    }
  });
  
  // Also try PPV-style endpoints for popular matches
  const ppvPromises = ['admin'].map(async (source) => {
    try {
      // Try PPV format: ppv-team-a-vs-team-b
      const teams = match.title.split(/\s+vs\s+/i);
      if (teams.length !== 2) return [];
      
      const ppvSlug = `ppv-${teams[0].trim().toLowerCase().replace(/\s+/g, '-')}-vs-${teams[1].trim().toLowerCase().replace(/\s+/g, '-')}`;
      const endpoint = `stream/${source}/${ppvSlug}`;
      
      const { data, error } = await supabase.functions.invoke('boho-sport', {
        body: { endpoint }
      });
      
      if (error || !data) return [];
      
      const streams = Array.isArray(data) ? data : [data];
      return streams
        .filter((s: any) => s && (s.embedUrl || s.embed))
        .map((s: any, index: number) => ({
          source: s.source || source,
          id: s.id || ppvSlug,
          embedUrl: s.embedUrl || s.embed,
          streamNo: s.streamNo || index + 1,
          language: s.language || 'EN',
          hd: s.hd !== false,
          viewers: s.viewers || 0,
          name: s.name || `PPV ${s.streamNo || index + 1}`
        }));
    } catch {
      return [];
    }
  });
  
  // Wait for all parallel requests
  const [sourceResults, matchSourceResults, ppvResults] = await Promise.all([
    Promise.all(sourcePromises),
    Promise.all(matchSourcePromises),
    Promise.all(ppvPromises)
  ]);
  
  // Combine all results
  const allResults = [...sourceResults.flat(), ...matchSourceResults.flat(), ...ppvResults.flat()];
  
  // Deduplicate by embedUrl
  const seen = new Set<string>();
  for (const stream of allResults) {
    const key = stream.embedUrl || `${stream.source}/${stream.id}/${stream.streamNo}`;
    if (!seen.has(key) && stream.embedUrl) {
      seen.add(key);
      
      // Normalize embed URL to HTTPS
      let embedUrl = stream.embedUrl;
      if (embedUrl.startsWith('//')) {
        embedUrl = 'https:' + embedUrl;
      } else if (embedUrl.startsWith('http://')) {
        embedUrl = embedUrl.replace('http://', 'https://');
      }
      
      allStreams.push({
        id: stream.id,
        streamNo: allStreams.length + 1,
        language: stream.language || 'EN',
        hd: stream.hd !== false,
        embedUrl: embedUrl,
        source: stream.source,
        timestamp: Date.now(),
        viewers: stream.viewers,
        name: stream.name
      } as Stream);
      
      sourcesWithStreams.add(stream.source);
    }
  }
  
  // Fallback: If no streams found, create ad-free embed URLs from match.sources
  if (allStreams.length === 0 && match.sources && match.sources.length > 0) {
    console.log('⚠️ No API streams found, using ad-free fallback');
    for (const source of match.sources) {
      const adFreeUrl = buildAdFreeEmbedUrl(source.id, source.source);
      allStreams.push({
        id: source.id,
        streamNo: allStreams.length + 1,
        language: 'EN',
        hd: true,
        embedUrl: adFreeUrl,
        source: source.source,
        timestamp: Date.now()
      });
      sourcesWithStreams.add(source.source);
    }
  }
  
  // Last resort: echo source
  if (allStreams.length === 0) {
    const adFreeUrl = buildAdFreeEmbedUrl(match.id, 'echo');
    allStreams.push({
      id: match.id,
      streamNo: 1,
      language: 'EN',
      hd: true,
      embedUrl: adFreeUrl,
      source: 'echo',
      timestamp: Date.now()
    });
    sourcesWithStreams.add('echo');
  }

  const sourceNames = Array.from(sourcesWithStreams);
  console.log(`✅ Found ${allStreams.length} streams from sources: ${sourceNames.join(', ')}`);

  return {
    streams: allStreams,
    sourcesChecked: STREAM_SOURCES.length + (match.sources?.length || 0),
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
