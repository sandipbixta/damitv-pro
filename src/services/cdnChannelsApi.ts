// CDN Channels API Service - Direct API calls (no Supabase edge functions)

export interface CDNChannel {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo?: string;
  viewers?: number;
  isLive247?: boolean;
  source?: 'cdn' | 'sportsrc';
}

// Actual API response format for CDN
interface CDNApiChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
  viewers: number;
}

// SportSRC channel format
interface SportSRCChannel {
  id: string;
  name: string;
  title: string;
  code: string;
  country: string;
  category: string;
  image: string | null;
  logo: string | null;
  embedUrl: string;
  isLive247: boolean;
  active: boolean;
  viewers: number;
}

interface CDNApiResponse {
  total_channels: number;
  channels: CDNApiChannel[];
}

// Map country codes to full names
const countryCodeMap: Record<string, string> = {
  'us': 'United States',
  'uk': 'United Kingdom',
  'ca': 'Canada',
  'au': 'Australia',
  'in': 'India',
  'de': 'Germany',
  'fr': 'France',
  'es': 'Spain',
  'it': 'Italy',
  'br': 'Brazil',
  'mx': 'Mexico',
  'ar': 'Argentina',
  'pt': 'Portugal',
  'nl': 'Netherlands',
  'be': 'Belgium',
  'ch': 'Switzerland',
  'at': 'Austria',
  'pl': 'Poland',
  'tr': 'Turkey',
  'sa': 'Saudi Arabia',
  'ae': 'UAE',
  'pk': 'Pakistan',
  'bd': 'Bangladesh',
  'my': 'Malaysia',
  'sg': 'Singapore',
  'ph': 'Philippines',
  'id': 'Indonesia',
  'th': 'Thailand',
  'vn': 'Vietnam',
  'jp': 'Japan',
  'kr': 'South Korea',
  'cn': 'China',
  'za': 'South Africa',
  'ng': 'Nigeria',
  'ke': 'Kenya',
  'eg': 'Egypt',
  'nz': 'New Zealand',
  'ie': 'Ireland',
  'se': 'Sweden',
  'no': 'Norway',
  'dk': 'Denmark',
  'fi': 'Finland',
  'ru': 'Russia',
  'ua': 'Ukraine',
  'gr': 'Greece',
  'ro': 'Romania',
  'cz': 'Czech Republic',
  'hu': 'Hungary',
};

class CDNChannelsApiService {
  private cache: { data: CDNChannel[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes
  private isFetching = false;
  private fetchPromise: Promise<CDNChannel[]> | null = null;

  private getCountryName(code: string): string {
    return countryCodeMap[code.toLowerCase()] || code.toUpperCase();
  }

  private transformChannel(apiChannel: CDNApiChannel): CDNChannel {
    const id = apiChannel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    return {
      id,
      title: apiChannel.name,
      country: this.getCountryName(apiChannel.code),
      embedUrl: apiChannel.url,
      logo: apiChannel.image || undefined,
      viewers: apiChannel.viewers || 0,
      isLive247: true,
      source: 'cdn',
    };
  }

  async fetchChannels(): Promise<CDNChannel[]> {
    // Return cached data if valid
    if (this.cache.data && (Date.now() - this.cache.timestamp) < this.cacheExpiry) {
      console.log(`📺 Returning ${this.cache.data.length} cached channels`);
      return this.cache.data;
    }

    // Prevent duplicate fetches
    if (this.isFetching && this.fetchPromise) {
      return this.fetchPromise;
    }

    this.isFetching = true;
    this.fetchPromise = this.doFetch();
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }

  private async doFetch(): Promise<CDNChannel[]> {
    try {
      console.log('📺 Fetching channels from CDN API directly...');
      
      const CDN_API_URL = 'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(CDN_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CDN API returned ${response.status}`);
      }

      const data: CDNApiResponse = await response.json();
      const channels = (data.channels || []).map(ch => this.transformChannel(ch));
      
      // Update cache
      this.cache = { data: channels, timestamp: Date.now() };
      console.log(`📺 Fetched ${channels.length} channels successfully`);
      
      return channels;
    } catch (error) {
      console.error('📺 Error fetching CDN channels:', error);
      
      // Return cached data on error if available
      if (this.cache.data) {
        return this.cache.data;
      }
      
      return [];
    }
  }

  async getChannelsByCountry(): Promise<Record<string, CDNChannel[]>> {
    const channels = await this.fetchChannels();
    const grouped: Record<string, CDNChannel[]> = {};
    
    channels.forEach(channel => {
      const country = channel.country;
      if (!grouped[country]) {
        grouped[country] = [];
      }
      grouped[country].push(channel);
    });
    
    return grouped;
  }

  async getChannelById(country: string, channelId: string): Promise<CDNChannel | null> {
    const channels = await this.fetchChannels();
    return channels.find(ch => 
      ch.id === channelId || 
      ch.id === `${channelId}-${country.toLowerCase()}` ||
      ch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === channelId
    ) || null;
  }

  async searchChannels(query: string): Promise<CDNChannel[]> {
    const channels = await this.fetchChannels();
    const lowerQuery = query.toLowerCase();
    return channels.filter(ch => 
      ch.title.toLowerCase().includes(lowerQuery) ||
      ch.country.toLowerCase().includes(lowerQuery)
    );
  }

  async getCountries(): Promise<string[]> {
    const channelsByCountry = await this.getChannelsByCountry();
    return Object.keys(channelsByCountry).sort();
  }

  async getFeaturedChannels(limit: number = 10): Promise<CDNChannel[]> {
    const channels = await this.fetchChannels();
    return channels
      .sort((a, b) => (b.viewers || 0) - (a.viewers || 0))
      .slice(0, limit);
  }

  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }
}

// Export singleton instance
export const cdnChannelsApi = new CDNChannelsApiService();

// Hook-friendly function exports
export const fetchChannels = () => cdnChannelsApi.fetchChannels();
export const getChannelsByCountry = () => cdnChannelsApi.getChannelsByCountry();
export const getChannelById = (country: string, channelId: string) => 
  cdnChannelsApi.getChannelById(country, channelId);
export const searchChannels = (query: string) => cdnChannelsApi.searchChannels(query);
export const getCountries = () => cdnChannelsApi.getCountries();
export const getFeaturedChannels = (limit?: number) => cdnChannelsApi.getFeaturedChannels(limit);
