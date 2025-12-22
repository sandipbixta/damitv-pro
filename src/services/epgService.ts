
import { XMLParser } from 'fast-xml-parser';

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
