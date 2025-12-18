
import { Sport, Match, Stream, Source } from '../types/sports';
import { enhanceMatchesWithLogos, enhanceMatchWithLogos } from '../services/teamLogoService';
import { getLiveScoreByTeams } from '../hooks/useLiveScoreUpdates';

// API Base URLs
const WESTREAM_API = 'https://westream.su';
const CHANNELS_API = 'https://api.cdn-live.tv/api/v1/vip/damitv';
const CDN_LIVE_API = 'https://cdn-live.tv/api/v1/vip/damitv';

// Cache for API responses to avoid repeated calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to clear cache (used for refresh)
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
      if (key.includes('stream') || key.includes('match')) {
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

// Enhance match with live scores from TheSportsDB
const enhanceMatchWithLiveScore = (match: Match): Match => {
  if (!match.isLive && !isMatchCurrentlyLive(match)) return match;
  
  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  
  if (!homeTeam || !awayTeam) return match;
  
  const liveScore = getLiveScoreByTeams(homeTeam, awayTeam);
  
  if (liveScore) {
    return {
      ...match,
      score: {
        home: liveScore.homeScore,
        away: liveScore.awayScore
      },
      progress: liveScore.progress,
      isLive: true
    };
  }
  
  return match;
};

// Check if match is currently live based on time
const isMatchCurrentlyLive = (match: Match): boolean => {
  const matchTime = typeof match.date === 'number' ? match.date : new Date(match.date).getTime();
  const now = Date.now();
  const threeHoursAgo = now - (3 * 60 * 60 * 1000);
  const oneHourFromNow = now + (60 * 60 * 1000);
  
  return matchTime <= oneHourFromNow && matchTime > threeHoursAgo;
};

// Transform WeStream match to our Match format
const transformWeStreamMatch = (match: any): Match => ({
  id: match.id || String(match._id || ''),
  title: match.title || (match.teams ? `${match.teams.home?.name || ''} vs ${match.teams.away?.name || ''}` : ''),
  category: match.category || 'Unknown',
  date: match.date ? new Date(match.date).getTime() : Date.now(),
  poster: match.poster || match.image || undefined,
  popular: match.popular || false,
  teams: match.teams ? {
    home: { 
      name: match.teams.home?.name || '', 
      badge: match.teams.home?.badge || match.teams.home?.logo || '' 
    },
    away: { 
      name: match.teams.away?.name || '', 
      badge: match.teams.away?.badge || match.teams.away?.logo || '' 
    }
  } : undefined,
  sources: match.sources?.map((s: any) => ({
    source: s.source,
    id: s.id,
    name: s.name || s.source
  })) || [],
  sportId: match.category?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
  isLive: match.isLive || match.status === 'live',
  viewerCount: match.viewerCount || match.viewers || 0,
  tournament: match.tournament || match.league || undefined,
  country: match.country || undefined,
  countryFlag: match.countryFlag || undefined
});

// ==================== WESTREAM API (Sports Matches) ====================

export const fetchSports = async (): Promise<Sport[]> => {
  const cacheKey = 'westream-sports';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${WESTREAM_API}/sports`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    let sports: Sport[] = [];
    
    if (Array.isArray(data)) {
      sports = data.map((sport: any) => ({
        id: sport.id || sport.name?.toLowerCase().replace(/\s+/g, '-'),
        name: sport.name || sport.id
      }));
    }
    
    // Sort alphabetically but keep Football first
    sports.sort((a, b) => {
      if (a.id === 'football' || a.id === 'soccer') return -1;
      if (b.id === 'football' || b.id === 'soccer') return 1;
      return a.name.localeCompare(b.name);
    });

    setCachedData(cacheKey, sports);
    console.log(`✅ Loaded ${sports.length} sports from WeStream API:`, sports.map(s => s.name).join(', '));
    return sports;
  } catch (error) {
    console.error('❌ Error fetching sports from WeStream:', error);
    // Fallback to basic sports list
    const fallbackSports: Sport[] = [
      { id: 'football', name: 'Football' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'cricket', name: 'Cricket' }
    ];
    return fallbackSports;
  }
};

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const cacheKey = 'westream-live-matches';
  const cached = getCachedData(cacheKey);
  if (cached) {
    // Still enhance with live scores even if cached
    return cached.map(enhanceMatchWithLiveScore);
  }

  try {
    const response = await fetch(`${WESTREAM_API}/matches/live`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    let matches = Array.isArray(data) ? data.map(transformWeStreamMatch) : [];
    
    // Enhance matches with team logos from TheSportsDB
    matches = await enhanceMatchesWithLogos(matches);
    
    // Enhance with live scores
    matches = matches.map(enhanceMatchWithLiveScore);
    
    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} live matches from WeStream API`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching live matches from WeStream:', error);
    return [];
  }
};

export const fetchAllMatches = async (): Promise<Match[]> => {
  const cacheKey = 'westream-all-matches';
  const cached = getCachedData(cacheKey);
  if (cached) {
    // Still enhance with live scores even if cached
    return cached.map(enhanceMatchWithLiveScore);
  }

  try {
    const response = await fetch(`${WESTREAM_API}/matches`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    let matches = Array.isArray(data) ? data.map(transformWeStreamMatch) : [];
    
    // Sort by date (most recent first) and filter out old finished matches
    matches = matches
      .filter(m => m.isLive || new Date(m.date) > new Date(Date.now() - 3 * 60 * 60 * 1000))
      .sort((a, b) => {
        // Live matches first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        // Then by date
        return a.date - b.date;
      });
    
    // Enhance matches with team logos from TheSportsDB
    matches = await enhanceMatchesWithLogos(matches);
    
    // Enhance with live scores
    matches = matches.map(enhanceMatchWithLiveScore);
    
    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} matches from WeStream API`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching all matches from WeStream:', error);
    return [];
  }
};

export const fetchMatches = async (sportId: string): Promise<Match[]> => {
  const cacheKey = `westream-matches-${sportId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // Still enhance with live scores even if cached
    return cached.map(enhanceMatchWithLiveScore);
  }

  try {
    const response = await fetch(`${WESTREAM_API}/matches/${sportId}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    let matches = Array.isArray(data) ? data.map(transformWeStreamMatch) : [];
    
    // Enhance matches with team logos from TheSportsDB
    matches = await enhanceMatchesWithLogos(matches);
    
    // Enhance with live scores
    matches = matches.map(enhanceMatchWithLiveScore);
    
    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} matches for sport ${sportId} from WeStream API`);
    return matches;
  } catch (error) {
    console.error(`❌ Error fetching matches for sport ${sportId} from WeStream:`, error);
    return [];
  }
};

export const fetchMatch = async (sportId: string, matchId: string): Promise<Match> => {
  const cacheKey = `westream-match-${sportId}-${matchId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // First try to get from cached matches
    const cachedMatches = getCachedData(`westream-matches-${sportId}`) || getCachedData('westream-all-matches');
    if (cachedMatches) {
      const match = cachedMatches.find((m: Match) => m.id === matchId);
      if (match) {
        // Enhance with logos if not already present
        const enhancedMatch = await enhanceMatchWithLogos(match);
        setCachedData(cacheKey, enhancedMatch);
        console.log(`✅ Found match ${matchId} in cache`);
        return enhancedMatch;
      }
    }

    // If not in cache, fetch all matches and find the specific match
    const allMatches = await fetchAllMatches();
    const match = allMatches.find(m => m.id === matchId);
    
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }
    
    // Match already enhanced by fetchAllMatches
    setCachedData(cacheKey, match);
    console.log(`✅ Found match ${matchId} for sport ${sportId}`);
    return match;
  } catch (error) {
    console.error(`❌ Error fetching match ${matchId}:`, error);
    throw error;
  }
};

// Fetch streams for a specific match from WeStream API
export const fetchStream = async (source: string, id: string): Promise<Stream[]> => {
  const cacheKey = `westream-stream-${source}-${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🎬 Fetching streams from WeStream: ${source}/${id}`);
    
    const response = await fetch(`${WESTREAM_API}/stream/${source}/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    const streams: Stream[] = Array.isArray(data) ? data.map((stream: any, index: number) => ({
      id: stream.id || `${source}-${id}-${index}`,
      streamNo: stream.streamNo || index + 1,
      language: stream.language || 'EN',
      hd: stream.hd !== false,
      embedUrl: stream.embedUrl || stream.url || '',
      source: stream.source || source,
      name: stream.name || `Stream ${index + 1}`,
      timestamp: Date.now()
    })) : [];
    
    setCachedData(cacheKey, streams);
    console.log(`✅ Found ${streams.length} streams from WeStream for ${source}/${id}`);
    return streams;
  } catch (error) {
    console.error(`❌ Error fetching streams from WeStream for ${source}/${id}:`, error);
    return [];
  }
};

// Alias for backward compatibility
export const fetchSimpleStream = fetchStream;

export const fetchAllMatchStreams = async (match: Match): Promise<{
  streams: Stream[];
  sourcesChecked: number;
  sourcesWithStreams: number;
  sourceNames: string[];
}> => {
  const allStreams: Stream[] = [];
  const sourcesWithStreams = new Set<string>();
  
  if (match.sources && match.sources.length > 0) {
    // Fetch streams from each source in parallel
    const streamPromises = match.sources.map(async (source) => {
      try {
        const streams = await fetchStream(source.source, source.id);
        if (streams.length > 0) {
          sourcesWithStreams.add(source.source);
          return streams;
        }
      } catch (err) {
        console.error(`Failed to fetch stream from ${source.source}:`, err);
      }
      return [];
    });
    
    const results = await Promise.all(streamPromises);
    results.forEach(streams => allStreams.push(...streams));
  }

  const sourceNames = Array.from(sourcesWithStreams);
  console.log(`🎬 Total streams found: ${allStreams.length} from ${sourceNames.length} sources`);
  
  return {
    streams: allStreams,
    sourcesChecked: match.sources?.length || 0,
    sourcesWithStreams: sourceNames.length,
    sourceNames
  };
};

// Fetch all streams from all available sources for a match
export const fetchAllStreams = async (match: Match): Promise<Record<string, Stream[]>> => {
  if (!match.sources || match.sources.length === 0) {
    throw new Error('No sources available for this match');
  }

  const allStreams: Record<string, Stream[]> = {};
  
  // Fetch streams from each source in parallel
  const streamPromises = match.sources.map(async (source) => {
    try {
      const streams = await fetchStream(source.source, source.id);
      const sourceKey = `${source.source}/${source.id}`;
      if (streams.length > 0) {
        allStreams[sourceKey] = streams;
      }
    } catch (err) {
      console.error(`Failed to fetch stream from ${source.source}:`, err);
    }
  });
  
  await Promise.all(streamPromises);

  console.log(`🎯 Total streams from ${Object.keys(allStreams).length} sources for match: ${match.title}`);
  return allStreams;
};

// ==================== CDN-LIVE.TV API (TV Channels Only) ====================

// Fetch TV channels from cdn-live.tv
export const fetchChannels = async (): Promise<any[]> => {
  const cacheKey = 'cdn-channels';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${CHANNELS_API}/channels/`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    // Handle different response formats
    let channels: any[] = [];
    if (Array.isArray(data)) {
      channels = data;
    } else if (data.channels && Array.isArray(data.channels)) {
      channels = data.channels;
    } else if (data.data && Array.isArray(data.data)) {
      channels = data.data;
    }
    
    setCachedData(cacheKey, channels);
    console.log(`✅ Fetched ${channels.length} channels from cdn-live.tv API`);
    return channels;
  } catch (error) {
    console.error('❌ Error fetching channels from cdn-live.tv:', error);
    return [];
  }
};

// Fetch channel stream URL from cdn-live.tv
export const fetchChannelStream = async (channelName: string, countryCode: string): Promise<string> => {
  const cacheKey = `cdn-channel-stream-${channelName}-${countryCode}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const streamUrl = `${CHANNELS_API}/channels/player/?name=${encodeURIComponent(channelName)}&code=${countryCode}`;
    setCachedData(cacheKey, streamUrl);
    return streamUrl;
  } catch (error) {
    console.error('❌ Error fetching channel stream:', error);
    throw error;
  }
};
