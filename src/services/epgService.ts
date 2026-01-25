import { XMLParser } from 'fast-xml-parser';

// Channel name to epg.pw channel ID mapping for "Now Playing" feature
const CHANNEL_EPG_ID_MAP: Record<string, string> = {
  // Sky Sports (UK)
  'sky sports main event': '7673',
  'sky sports premier league': '6320',
  'sky sports football': '6318',
  'sky sports f1': '6317',
  'sky sports arena': '6316',
  'sky sports action': '6315',
  'sky sports cricket': '6319',
  'sky sports golf': '6321',
  'sky sports mix': '10785',
  'sky sports news': '12337',
  'sky sports nfl': '6322',
  'sky sports tennis': '381885',
  'sky sports racing': '219098',

  // ESPN (US)
  'espn': '465198',
  'espn 2': '465373',
  'espn news': '465410',
  'espn u': '465108',
  'espn deportes': '464949',

  // Fox Sports (US)
  'fox sports': '465291',
  'fox sports 1': '465291',
  'fox sports 2': '465355',
  'fox soccer plus': '465214',
  'fox deportes': '465156',

  // beIN Sports
  'bein sports': '55773',
  'bein sports 1': '55773',
  'bein sports 2': '443147',
  'bein sports 3': '54963',
  'bein sports 4': '443239',
  'bein sports 5': '443103',
  'bein sports 6': '55982',
  'bein sports 7': '55920',
  'bein sports 8': '443213',
  'bein sports 9': '55983',
  'bein sports max 4': '443239',
  'bein sports max 5': '443103',
  'bein sports max 6': '55982',
  'bein sports max 7': '55920',
  'bein sports max 8': '443213',
  'bein sports max 9': '55983',
  'bein sports max 10': '443150',
  'bein sports xtra': '443151',
  'bein sports mena 1': '55773',
  'bein sports mena 2': '443147',

  // TNT Sports (UK) - formerly BT Sport
  'tnt sports': '12233',
  'tnt sports 1': '12233',
  'tnt sports 2': '12235',
  'tnt sports 3': '12268',
  'tnt sports 4': '12050',

  // CBS Sports
  'cbs sports network': '464937',
  'cbs sports golazo': '464937',

  // Other US Sports
  'nba tv': '465322',
  'nfl network': '465336',
  'nfl redzone': '465337',
  'acc network': '464879',
  'big ten network': '465073',
  'golf channel': '464783',

  // Eurosport
  'euro sport 1': '6326',
  'euro sport 2': '6327',
  'eurosport 1': '6326',
  'eurosport 2': '6327',

  // DAZN
  'dazn 1': '448572',
  'dazn 2': '448573',
  'dazn f1': '448574',
  'dazn laliga': '448575',

  // RMC Sport (France)
  'rmc sport 1': '54815',
  'rmc sport 2': '448570',

  // Canal+ Sport
  'canal sport': '459266',

  // SuperSport (South Africa)
  'supersport football': '7689',
  'supersport premier league': '7690',
  'supersport action': '7687',
  'supersport variety 1': '7691',
  'supersport cricket': '7688',
  'supersport rugby': '7692',
  'supersport golf': '7693',

  // Sport TV (Portugal)
  'sport tv 1': '7701',
  'sport tv 2': '7702',
  'sport tv 3': '7703',

  // Other International
  'eleven sports 1': '448575',
  'eleven sports 2': '448576',
  'premier sports 1': '219100',
  'premier sports 2': '219104',
  'viaplay sports 1': '448577',
  'viaplay sports 2': '448578',
  'sportsnet ontario': '465401',
  'sportsnet east': '465400',
  'sportsnet west': '465402',
  'nova sports 1': '448580',
  'nova sports premier league': '448581',
  'polsat sport': '448582',
  'arena sport 1': '448583',
};

// Now Playing data structure
export interface NowPlaying {
  title: string;
  startTime: Date;
  endTime: Date;
  progress: number; // 0-100 percentage
}

interface EPGProgram {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  category?: string;
}

interface EPGChannel {
  channelId: string;
  channelName: string;
  programs: EPGProgram[];
}

interface XMLTVProgram {
  '@_start': string;
  '@_stop': string;
  '@_channel': string;
  title: string | { '#text': string };
  desc?: string | { '#text': string };
  category?: string | { '#text': string };
}

interface XMLTVChannel {
  '@_id': string;
  'display-name': string | { '#text': string } | Array<string | { '#text': string }>;
}

interface XMLTVData {
  tv: {
    channel: XMLTVChannel[];
    programme: XMLTVProgram[];
  };
}

class EPGService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 60 * 60 * 1000; // 1 hour
  private baseUrl = 'https://epg.pw/xmltv';
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });

  private async fetchWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const data = await fetchFn();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  private getCountryCode(country: string): string {
    const countryMapping: Record<string, string> = {
      'UK': 'GB',
      'USA': 'US',
      'France': 'FR',
      'Germany': 'DE',
      'Italy': 'IT',
      'Spain': 'ES',
      'Argentina': 'AR',
      'Australia': 'AU',
      'India': 'IN',
      'Mexico': 'MX',
      'Netherlands': 'NL',
      'New Zealand': 'NZ',
      'Brazil': 'BR',
      'Canada': 'CA',
      'China': 'CN',
      'Hong Kong': 'HK',
      'Indonesia': 'ID',
      'Japan': 'JP',
      'Malaysia': 'MY',
      'Philippines': 'PH',
      'Russia': 'RU',
      'Singapore': 'SG',
      'Taiwan': 'TW',
      'Vietnam': 'VN',
      'South Africa': 'ZA'
    };

    return countryMapping[country] || country;
  }

  private async fetchXMLTVData(country: string): Promise<XMLTVData> {
    const countryCode = this.getCountryCode(country);
    
    if (!countryCode) {
      throw new Error(`No EPG data available for ${country}`);
    }

    const url = `${this.baseUrl}/epg_${countryCode}.xml.gz`;
    console.log(`Fetching XMLTV EPG data from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch EPG data: ${response.status}`);
    }
    
    const xmlText = await response.text();
    return this.parser.parse(xmlText) as XMLTVData;
  }

  private extractText(value: string | { '#text': string } | Array<string | { '#text': string }>): string {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === 'string' ? first : first['#text'];
    }
    return value['#text'];
  }

  private convertXMLTVToOurFormat(xmltvData: XMLTVData, channels: any[]): EPGChannel[] {
    const epgChannels: EPGChannel[] = [];
    
    if (!xmltvData.tv || !xmltvData.tv.channel || !xmltvData.tv.programme) {
      return epgChannels;
    }

    // Create a map of XMLTV channels
    const xmltvChannelMap = new Map<string, string>();
    xmltvData.tv.channel.forEach(channel => {
      const displayName = this.extractText(channel['display-name']).toLowerCase();
      xmltvChannelMap.set(channel['@_id'], displayName);
    });

    // Try to match our channels with XMLTV channels
    for (const channel of channels) {
      const channelNameLower = channel.title.toLowerCase();
      
      // Find matching XMLTV channel
      let matchingChannelId: string | null = null;
      
      for (const [xmltvId, displayName] of xmltvChannelMap.entries()) {
        if (
          displayName.includes(channelNameLower.replace(/\s+/g, '')) ||
          channelNameLower.includes(displayName.replace(/\s+/g, '')) ||
          displayName.replace(/\s+/g, '').includes(channelNameLower.replace(/\s+/g, ''))
        ) {
          matchingChannelId = xmltvId;
          break;
        }
      }

      if (matchingChannelId) {
        // Get programs for this channel
        const channelPrograms = xmltvData.tv.programme
          .filter(program => program['@_channel'] === matchingChannelId)
          .slice(0, 12) // Limit to 12 programs for performance
          .map((program, index) => ({
            id: `${matchingChannelId}-${index}`,
            title: this.extractText(program.title) || 'Unknown Program',
            startTime: this.parseXMLTVTime(program['@_start']),
            endTime: this.parseXMLTVTime(program['@_stop']),
            description: program.desc ? this.extractText(program.desc) : undefined,
            category: program.category ? this.extractText(program.category) : undefined
          }));

        if (channelPrograms.length > 0) {
          epgChannels.push({
            channelId: matchingChannelId,
            channelName: channel.title,
            programs: channelPrograms
          });
        }
      }
    }

    return epgChannels;
  }

  private parseXMLTVTime(xmltvTime: string): string {
    // XMLTV time format: YYYYMMDDHHmmss +HHMM
    const dateStr = xmltvTime.substring(0, 14);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    return new Date(isoString).toISOString();
  }

  async getEPGForCountry(countryName: string, channels: any[]): Promise<EPGChannel[]> {
    const cacheKey = `epg-xmltv-${countryName}`;
    
    return this.fetchWithCache(cacheKey, async () => {
      console.log(`Fetching XMLTV EPG data for ${countryName} with ${channels.length} channels`);
      
      try {
        const xmltvData = await this.fetchXMLTVData(countryName);
        const epgData = this.convertXMLTVToOurFormat(xmltvData, channels);
        
        console.log(`XMLTV EPG for ${countryName}: ${epgData.length} channels with real EPG data found`);
        return epgData;
      } catch (error) {
        console.error(`Error fetching XMLTV data for ${countryName}:`, error);
        return [];
      }
    });
  }

  async getAllEPGData(channelsByCountry: Record<string, any[]>): Promise<Record<string, EPGChannel[]>> {
    console.log('Fetching real XMLTV EPG data from epg.pw for all countries');
    
    const allEPGData: Record<string, EPGChannel[]> = {};
    
    // Generate EPG for each country
    for (const [country, channels] of Object.entries(channelsByCountry)) {
      try {
        allEPGData[country] = await this.getEPGForCountry(country, channels);
        console.log(`XMLTV EPG for ${country} loaded: ${allEPGData[country].length} channels with real data`);
      } catch (error) {
        console.error(`Error loading XMLTV EPG for ${country}:`, error);
        allEPGData[country] = [];
      }
    }
    
    return allEPGData;
  }
}

export const epgService = new EPGService();
export type { EPGProgram, EPGChannel };

// ============================================
// NOW PLAYING FEATURE - Uses epg.pw API
// ============================================

// Cache for Now Playing data
const nowPlayingCache: Map<string, { data: NowPlaying | null; timestamp: number }> = new Map();
const NOW_PLAYING_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get epg.pw channel ID from channel name
export function getEPGChannelId(channelName: string): string | null {
  const normalized = channelName.toLowerCase().trim();

  // Direct match
  if (CHANNEL_EPG_ID_MAP[normalized]) {
    return CHANNEL_EPG_ID_MAP[normalized];
  }

  // Partial match - try to find closest match
  for (const [key, value] of Object.entries(CHANNEL_EPG_ID_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

// Check if channel has EPG support
export function hasEPGSupport(channelName: string): boolean {
  return getEPGChannelId(channelName) !== null;
}

// Parse EPG timestamp format: "20260125000000 +0000"
function parseEPGTimestamp(timeStr: string): Date {
  const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return new Date();

  const [, year, month, day, hour, minute, second] = match;
  return new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));
}

// Fetch Now Playing for a specific channel
export async function getNowPlaying(channelName: string): Promise<NowPlaying | null> {
  const epgId = getEPGChannelId(channelName);

  if (!epgId) {
    return null;
  }

  // Check cache
  const cacheKey = epgId;
  const cached = nowPlayingCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < NOW_PLAYING_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Use CORS proxy for browser requests
    const apiUrl = `https://epg.pw/api/epg.xml?channel_id=${epgId}&date=${dateStr}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

    const response = await fetch(proxyUrl, {
      headers: { 'Accept': 'application/xml' }
    });

    if (!response.ok) {
      console.warn(`EPG fetch failed for channel ${channelName}`);
      nowPlayingCache.set(cacheKey, { data: null, timestamp: now });
      return null;
    }

    const xmlText = await response.text();

    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const programmes = xmlDoc.querySelectorAll('programme');
    const currentTime = new Date();

    // Find current program
    for (const prog of programmes) {
      const startStr = prog.getAttribute('start');
      const stopStr = prog.getAttribute('stop');
      const titleEl = prog.querySelector('title');

      if (startStr && stopStr && titleEl) {
        const startTime = parseEPGTimestamp(startStr);
        const endTime = parseEPGTimestamp(stopStr);

        if (startTime <= currentTime && endTime > currentTime) {
          const totalDuration = endTime.getTime() - startTime.getTime();
          const elapsed = currentTime.getTime() - startTime.getTime();
          const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

          const nowPlaying: NowPlaying = {
            title: (titleEl.textContent || 'Unknown Program').replace(/^[⋗►▶]\s*/, ''),
            startTime,
            endTime,
            progress
          };

          nowPlayingCache.set(cacheKey, { data: nowPlaying, timestamp: now });
          return nowPlaying;
        }
      }
    }

    // No current program found
    nowPlayingCache.set(cacheKey, { data: null, timestamp: now });
    return null;
  } catch (error) {
    console.error(`EPG fetch error for ${channelName}:`, error);
    nowPlayingCache.set(cacheKey, { data: null, timestamp: now });
    return null;
  }
}

// Batch fetch Now Playing for multiple channels
export async function getMultipleNowPlaying(channelNames: string[]): Promise<Map<string, NowPlaying | null>> {
  const results = new Map<string, NowPlaying | null>();

  // Filter channels that have EPG mapping
  const channelsWithEPG = channelNames.filter(name => hasEPGSupport(name));

  // Fetch in parallel with limited concurrency
  const batchSize = 5;
  for (let i = 0; i < channelsWithEPG.length; i += batchSize) {
    const batch = channelsWithEPG.slice(i, i + batchSize);

    const promises = batch.map(async (name) => {
      const nowPlaying = await getNowPlaying(name);
      results.set(name.toLowerCase(), nowPlaying);
    });

    await Promise.all(promises);
  }

  return results;
}

// Clear Now Playing cache
export function clearNowPlayingCache(): void {
  nowPlayingCache.clear();
}
