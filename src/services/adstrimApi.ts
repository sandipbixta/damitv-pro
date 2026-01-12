// Adstrim API Service - fetches events from beta.adstrim.ru
// Uses direct HLS streams for playback
import { Sport, Match, Stream } from '../types/sports';

const API_BASE = 'https://beta.adstrim.ru/api';

// HLS CDN patterns for different channel sources
// Format: { source_prefix: 'hls_cdn_url_pattern' }
const HLS_CDN_PATTERNS: Record<string, string> = {
  'eplayer': 'https://rfrm.me/eplayer/{channel}/mono.m3u8',
  'alpha': 'https://rfrm.me/alpha/{channel}/mono.m3u8',
  'ftk': 'https://rfrm.me/ftk/{channel}/mono.m3u8',
  'premium': 'https://rfrm.me/premium/{channel}/mono.m3u8',
  'dazn': 'https://rfrm.me/dazn/{channel}/mono.m3u8',
  'default': 'https://rfrm.me/live/{channel}/mono.m3u8'
};

// CORS proxies for API fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached data
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Adstrim cache HIT: ${key}`);
    return cached.data;
  }
  if (cached) cache.delete(key);
  return null;
};

// Set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Adstrim cache SET: ${key}`);
};

// Fetch from API with CORS fallback
const fetchFromApi = async (endpoint: string): Promise<any> => {
  const timeout = 8000;
  const url = `${API_BASE}/${endpoint}`;

  const fetchWithTimeout = async (fetchUrl: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(fetchUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Try direct first
  try {
    const data = await fetchWithTimeout(url);
    console.log(`✅ Adstrim direct success: ${endpoint}`);
    return data;
  } catch (error) {
    console.warn(`⚠️ Adstrim direct failed: ${endpoint}`);
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const data = await fetchWithTimeout(proxyUrl);
      console.log(`✅ Adstrim proxy success: ${endpoint}`);
      return data;
    } catch (error) {
      console.warn(`⚠️ Adstrim proxy failed`);
    }
  }

  throw new Error(`All Adstrim API endpoints failed for: ${endpoint}`);
};

// Map Adstrim sport to our sport ID
const mapSportToId = (sport: string): string => {
  const sportMap: Record<string, string> = {
    'Football': 'football',
    'Basketball': 'basketball',
    'Tennis': 'tennis',
    'Ice Hockey': 'hockey',
    'Hockey': 'hockey',
    'NFL': 'american-football',
    'Rugby': 'rugby',
    'Cricket': 'cricket',
    'UFC': 'fight',
    'MMA': 'fight',
    'Boxing': 'fight',
    'Formula 1': 'motorsport',
    'F1': 'motorsport',
    'Motorsport': 'motorsport',
    'Baseball': 'baseball',
    'Handball': 'handball',
    'Volleyball': 'volleyball',
    'Darts': 'darts'
  };
  return sportMap[sport] || sport?.toLowerCase().replace(/\s+/g, '-') || 'other';
};

// Parse channel link to get HLS stream info
// e.g., "eplayerSPORTTV1" -> { source: "eplayer", channel: "SPORTTV1" }
export const parseChannelLink = (link: string): { source: string; channel: string; id: string } => {
  // Common prefixes that map to HLS CDN patterns
  const prefixes = [
    { prefix: 'eplayer', source: 'eplayer' },
    { prefix: 'alpha', source: 'alpha' },
    { prefix: 'ftk', source: 'ftk' },
    { prefix: 'premium', source: 'premium' },
    { prefix: 'dazn', source: 'dazn' },
    { prefix: 'arg', source: 'default' },
    { prefix: 'mex', source: 'default' },
    { prefix: 'prima', source: 'default' },
  ];

  for (const { prefix, source } of prefixes) {
    if (link.toLowerCase().startsWith(prefix)) {
      const channel = link.substring(prefix.length) || link;
      return { source, channel, id: link };
    }
  }

  // Default: use the full link as channel name
  return { source: 'default', channel: link, id: link };
};

// Build HLS m3u8 URL for a channel
export const buildHLSUrl = (channelLink: string): string => {
  const { source, channel } = parseChannelLink(channelLink);
  const pattern = HLS_CDN_PATTERNS[source] || HLS_CDN_PATTERNS['default'];
  
  // Replace {channel} placeholder with actual channel name
  const hlsUrl = pattern.replace('{channel}', channel.toLowerCase());
  console.log(`🎬 Built HLS URL for ${channelLink}: ${hlsUrl}`);
  return hlsUrl;
};

// Legacy function for backwards compatibility (now returns HLS URL)
export const buildChannelEmbedUrl = (channelLink: string): string => {
  return buildHLSUrl(channelLink);
};

// Interface for Adstrim event
interface AdstrimEvent {
  id: string;
  timestamp: number;
  match_time: string;
  home_team: string;
  away_team: string;
  sport: string;
  league: string;
  channels: Array<{ name: string; link: string }>;
  channel_count: number;
  home_team_image?: string;
  away_team_image?: string;
  league_image?: string;
  duration?: number;
}

// Parse Adstrim event to Match format
const parseEventToMatch = (event: AdstrimEvent): Match | null => {
  try {
    if (!event || !event.id) return null;

    const sportId = mapSportToId(event.sport);

    // Build sources from channels
    const sources = event.channels?.slice(0, 5).map((ch, index) => ({
      source: ch.link,
      id: event.id
    })) || [];

    // Fallback source if no channels
    if (sources.length === 0) {
      sources.push({ source: 'main', id: event.id });
    }

    return {
      id: event.id,
      title: `${event.home_team} vs ${event.away_team}`,
      category: sportId,
      sportId: sportId,
      date: event.timestamp * 1000, // Convert to milliseconds
      poster: event.league_image || '',
      popular: event.channel_count >= 3,
      teams: {
        home: {
          name: event.home_team,
          badge: event.home_team_image || ''
        },
        away: {
          name: event.away_team,
          badge: event.away_team_image || ''
        }
      },
      sources: sources,
      viewerCount: 0
    };
  } catch (error) {
    console.error('Error parsing Adstrim event:', error);
    return null;
  }
};

// Fetch all events from Adstrim
export const fetchAdstrimEvents = async (): Promise<Match[]> => {
  const cacheKey = 'adstrim-events';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching events from Adstrim API...');
    const response = await fetchFromApi('events');

    if (response.status !== 'success' || !response.data) {
      console.warn('⚠️ Adstrim API returned non-success status');
      return [];
    }

    const matches = response.data
      .map(parseEventToMatch)
      .filter((m: Match | null): m is Match => m !== null);

    setCachedData(cacheKey, matches);
    console.log(`✅ Fetched ${matches.length} events from Adstrim`);
    return matches;
  } catch (error) {
    console.error('❌ Error fetching Adstrim events:', error);
    return [];
  }
};

// Fetch single event by ID
export const fetchAdstrimEvent = async (eventId: string): Promise<Match | null> => {
  const cacheKey = `adstrim-event-${eventId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`🔄 Fetching event ${eventId} from Adstrim...`);
    const response = await fetchFromApi(`event-single?id=${encodeURIComponent(eventId)}`);

    if (response.status !== 'success' || !response.data) {
      console.warn(`⚠️ Adstrim event ${eventId} not found`);
      return null;
    }

    const match = parseEventToMatch(response.data);
    if (match) {
      setCachedData(cacheKey, match);
      console.log(`✅ Fetched event: ${match.title}`);
    }
    return match;
  } catch (error) {
    console.error(`❌ Error fetching Adstrim event ${eventId}:`, error);
    return null;
  }
};

// Fetch sports list from Adstrim
export const fetchAdstrimSports = async (): Promise<Sport[]> => {
  const cacheKey = 'adstrim-sports';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching sports from Adstrim...');
    const response = await fetchFromApi('sports');

    const sports: Sport[] = Object.entries(response).map(([id, data]: [string, any]) => ({
      id: mapSportToId(data.name),
      name: data.name,
      emoji: data.emoji
    }));

    setCachedData(cacheKey, sports);
    console.log(`✅ Fetched ${sports.length} sports from Adstrim`);
    return sports;
  } catch (error) {
    console.error('❌ Error fetching Adstrim sports:', error);
    return [];
  }
};

// Get streams for an event (channels converted to streams)
export const getAdstrimStreams = async (eventId: string): Promise<Stream[]> => {
  const match = await fetchAdstrimEvent(eventId);
  if (!match) return [];

  // Get the original event data for channel info
  try {
    const response = await fetchFromApi(`event-single?id=${encodeURIComponent(eventId)}`);
    if (response.status !== 'success' || !response.data?.channels) {
      return [];
    }

    const streams: Stream[] = response.data.channels.map((channel: any, index: number) => ({
      id: eventId,
      streamNo: index + 1,
      language: channel.name?.match(/\[([^\]]+)\]/)?.[1] || 'EN',
      hd: true,
      embedUrl: buildChannelEmbedUrl(channel.link),
      source: channel.link,
      name: channel.name?.replace(/\[[^\]]+\]/, '').trim() || `Stream ${index + 1}`,
      timestamp: Date.now()
    }));

    console.log(`✅ Generated ${streams.length} streams for event ${eventId}`);
    return streams;
  } catch (error) {
    console.error(`❌ Error getting Adstrim streams for ${eventId}:`, error);
    return [];
  }
};

// Fetch TV channels
export const fetchAdstrimChannels = async () => {
  const cacheKey = 'adstrim-channels';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Fetching channels from Adstrim...');
    const response = await fetchFromApi('channels');
    setCachedData(cacheKey, response);
    return response;
  } catch (error) {
    console.error('❌ Error fetching Adstrim channels:', error);
    return null;
  }
};

// Search teams for logos
export const searchAdstrimTeams = async (query: string) => {
  try {
    const response = await fetchFromApi(`teams?q=${encodeURIComponent(query)}`);
    return response;
  } catch (error) {
    console.error('❌ Error searching Adstrim teams:', error);
    return null;
  }
};
