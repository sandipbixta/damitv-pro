// IPTV-Org Sports Playlist Service
// Fetches and parses M3U playlist for direct HLS streams

interface IptvChannel {
  name: string;
  url: string;
  group: string;
  logo?: string;
  language?: string;
  country?: string;
}

// Cache for parsed IPTV channels
let iptvChannelCache: {
  channels: IptvChannel[];
  timestamp: number;
} | null = null;

const IPTV_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const IPTV_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/categories/sports.m3u';

// CORS proxies to bypass restrictions
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

/**
 * Parse M3U playlist content into channel array
 */
function parseM3uPlaylist(content: string): IptvChannel[] {
  const channels: IptvChannel[] = [];
  const lines = content.split('\n');
  
  let currentChannel: Partial<IptvChannel> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse channel info line
      // Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
      
      const nameMatch = line.match(/,([^,]+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const languageMatch = line.match(/tvg-language="([^"]+)"/);
      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      
      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : 'Sports',
        language: languageMatch ? languageMatch[1] : undefined,
        country: countryMatch ? countryMatch[1] : undefined,
      };
    } else if (line.startsWith('http') || line.startsWith('https')) {
      // This is the stream URL
      if (currentChannel.name) {
        channels.push({
          ...currentChannel,
          url: line,
        } as IptvChannel);
      }
      currentChannel = {};
    }
  }
  
  console.log(`📺 Parsed ${channels.length} IPTV sports channels`);
  return channels;
}

/**
 * Fetch IPTV sports playlist with caching
 */
export async function fetchIptvSportsChannels(): Promise<IptvChannel[]> {
  // Check cache first
  if (iptvChannelCache && Date.now() - iptvChannelCache.timestamp < IPTV_CACHE_DURATION) {
    console.log('📺 Using cached IPTV channels');
    return iptvChannelCache.channels;
  }
  
  console.log('📺 Fetching IPTV sports playlist...');
  
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(
        `${proxy}${encodeURIComponent(IPTV_PLAYLIST_URL)}`,
        { 
          signal: AbortSignal.timeout(10000),
          headers: { 'Accept': 'text/plain' }
        }
      );
      
      if (!response.ok) continue;
      
      const content = await response.text();
      
      if (!content.includes('#EXTM3U')) {
        console.warn('Invalid M3U content');
        continue;
      }
      
      const channels = parseM3uPlaylist(content);
      
      // Cache the result
      iptvChannelCache = {
        channels,
        timestamp: Date.now(),
      };
      
      return channels;
    } catch (error) {
      console.warn(`IPTV fetch failed with proxy ${proxy}:`, error);
    }
  }
  
  console.error('❌ All IPTV fetch attempts failed');
  return [];
}

/**
 * Find IPTV channel matching a sports event
 */
export async function findMatchingIptvChannel(
  matchTitle: string,
  sport?: string,
  league?: string
): Promise<IptvChannel | null> {
  const channels = await fetchIptvSportsChannels();
  
  if (channels.length === 0) return null;
  
  const normalizedTitle = matchTitle.toLowerCase();
  const normalizedSport = sport?.toLowerCase() || '';
  const normalizedLeague = league?.toLowerCase() || '';
  
  // Extract team names from title (e.g., "Team A vs Team B")
  const teamMatch = normalizedTitle.match(/(.+?)\s+(?:vs?\.?|versus|-)\s+(.+)/i);
  const teams = teamMatch ? [teamMatch[1].trim(), teamMatch[2].trim()] : [];
  
  // Score channels by relevance
  const scoredChannels = channels.map(channel => {
    let score = 0;
    const channelName = channel.name.toLowerCase();
    const channelGroup = channel.group?.toLowerCase() || '';
    
    // Exact team name match (highest priority)
    teams.forEach(team => {
      if (channelName.includes(team)) {
        score += 100;
      }
    });
    
    // Sport match
    if (normalizedSport) {
      if (channelName.includes(normalizedSport) || channelGroup.includes(normalizedSport)) {
        score += 50;
      }
      // Common sport keywords
      const sportKeywords: Record<string, string[]> = {
        'football': ['soccer', 'football', 'premier', 'epl', 'laliga', 'bundesliga', 'serie a', 'champions'],
        'american-football': ['nfl', 'american football', 'ncaa', 'college football'],
        'basketball': ['nba', 'basketball', 'ncaa basketball'],
        'tennis': ['tennis', 'atp', 'wta', 'grand slam'],
        'mma': ['ufc', 'mma', 'bellator', 'pfl'],
        'boxing': ['boxing', 'dazn boxing'],
        'hockey': ['nhl', 'hockey', 'ice hockey'],
        'baseball': ['mlb', 'baseball'],
        'motorsport': ['f1', 'formula 1', 'motogp', 'nascar', 'racing'],
      };
      
      const keywords = sportKeywords[normalizedSport] || [];
      keywords.forEach(keyword => {
        if (channelName.includes(keyword)) {
          score += 30;
        }
      });
    }
    
    // League match
    if (normalizedLeague && channelName.includes(normalizedLeague)) {
      score += 40;
    }
    
    // Prefer English language channels
    if (channel.language?.toLowerCase().includes('english')) {
      score += 10;
    }
    
    // Prefer popular sports networks
    const popularNetworks = ['espn', 'sky sports', 'bt sport', 'fox sports', 'nbc sports', 'bein', 'dazn'];
    popularNetworks.forEach(network => {
      if (channelName.includes(network)) {
        score += 20;
      }
    });
    
    return { channel, score };
  });
  
  // Sort by score and return best match
  scoredChannels.sort((a, b) => b.score - a.score);
  
  const bestMatch = scoredChannels[0];
  
  if (bestMatch && bestMatch.score > 0) {
    console.log(`📺 Found IPTV match: "${bestMatch.channel.name}" (score: ${bestMatch.score}) for "${matchTitle}"`);
    return bestMatch.channel;
  }
  
  return null;
}

/**
 * Get multiple matching IPTV channels for a sport
 */
export async function getIptvChannelsForSport(sport: string): Promise<IptvChannel[]> {
  const channels = await fetchIptvSportsChannels();
  const normalizedSport = sport.toLowerCase();
  
  return channels.filter(channel => {
    const channelName = channel.name.toLowerCase();
    const channelGroup = channel.group?.toLowerCase() || '';
    
    // Match by sport name or related keywords
    const sportKeywords: Record<string, string[]> = {
      'football': ['soccer', 'football', 'premier', 'epl', 'laliga'],
      'american-football': ['nfl', 'american', 'espn', 'fox sports'],
      'basketball': ['nba', 'basketball'],
      'tennis': ['tennis', 'atp', 'wta'],
      'mma': ['ufc', 'mma', 'fight'],
      'boxing': ['boxing', 'dazn'],
    };
    
    const keywords = sportKeywords[normalizedSport] || [normalizedSport];
    return keywords.some(kw => channelName.includes(kw) || channelGroup.includes(kw));
  }).slice(0, 5); // Return top 5 matches
}

/**
 * Validate if an HLS URL is accessible
 */
export async function validateHlsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type { IptvChannel };
