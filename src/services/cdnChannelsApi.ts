// CDN Channels API Service
// Fetches live TV channels from api.cdn-live.tv API

export interface CDNChannel {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo?: string;
  viewers?: number;
}

// Actual API response format
interface CDNApiChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
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
  private baseUrl = 'https://api.cdn-live.tv/api/v1/vip/damitv/channels/';
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
      viewers: apiChannel.viewers
    };
  }

  async fetchChannels(): Promise<CDNChannel[]> {
    // Return cached data if valid
    if (this.cache.data && Date.now() - this.cache.timestamp < this.cacheExpiry) {
      console.log('📺 Using cached CDN channels data');
      return this.cache.data;
    }

    // If already fetching, return the existing promise
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
      console.log('📺 Fetching channels from CDN API:', this.baseUrl);
      
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CDN API returned ${response.status}`);
      }

      const data: CDNApiResponse = await response.json();
      
      if (!data.channels || !Array.isArray(data.channels)) {
        console.warn('📺 Invalid API response format');
        return this.cache.data || [];
      }

      console.log(`📺 API returned ${data.total_channels} total channels`);

      const channels = data.channels.map(ch => this.transformChannel(ch));
      
      // Filter out channels without embed URLs
      const validChannels = channels.filter(ch => ch.embedUrl && ch.embedUrl.length > 0);

      // Update cache
      this.cache = {
        data: validChannels,
        timestamp: Date.now()
      };

      console.log(`📺 Loaded ${validChannels.length} valid channels from CDN API`);
      return validChannels;
    } catch (error) {
      console.error('📺 Error fetching CDN channels:', error);
      // Return cached data if available, otherwise empty array
      return this.cache.data || [];
    }
  }

  async getChannelsByCountry(): Promise<Record<string, CDNChannel[]>> {
    const channels = await this.fetchChannels();
    
    return channels.reduce((acc, channel) => {
      const country = channel.country || 'International';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(channel);
      return acc;
    }, {} as Record<string, CDNChannel[]>);
  }

  async getChannelById(country: string, channelId: string): Promise<CDNChannel | null> {
    const channels = await this.fetchChannels();
    
    // First try to find by country and id
    const channelsByCountry = await this.getChannelsByCountry();
    const countryChannels = channelsByCountry[country];
    
    if (countryChannels) {
      const found = countryChannels.find(ch => ch.id === channelId);
      if (found) return found;
    }
    
    // Fallback: search all channels
    return channels.find(ch => ch.id === channelId) || null;
  }

  async searchChannels(query: string): Promise<CDNChannel[]> {
    const channels = await this.fetchChannels();
    const lowerQuery = query.toLowerCase();
    
    return channels.filter(ch => 
      ch.title.toLowerCase().includes(lowerQuery) ||
      ch.country.toLowerCase().includes(lowerQuery)
    );
  }

  // Get all unique countries
  async getCountries(): Promise<string[]> {
    const channels = await this.fetchChannels();
    const countries = new Set(channels.map(ch => ch.country));
    return Array.from(countries).sort();
  }

  // Get featured channels (first few popular ones, sorted by viewers)
  async getFeaturedChannels(limit: number = 12): Promise<CDNChannel[]> {
    const channels = await this.fetchChannels();
    // Sort by viewers descending and take top channels
    return [...channels]
      .sort((a, b) => (b.viewers || 0) - (a.viewers || 0))
      .slice(0, limit);
  }

  // Clear cache (useful for force refresh)
  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }
}

// Export singleton instance
export const cdnChannelsApi = new CDNChannelsApiService();

// Hook-friendly function exports
export const fetchCDNChannels = () => cdnChannelsApi.fetchChannels();
export const getCDNChannelsByCountry = () => cdnChannelsApi.getChannelsByCountry();
export const getCDNChannelById = (country: string, id: string) => cdnChannelsApi.getChannelById(country, id);
export const searchCDNChannels = (query: string) => cdnChannelsApi.searchChannels(query);
export const getCDNCountries = () => cdnChannelsApi.getCountries();
export const getFeaturedCDNChannels = (limit?: number) => cdnChannelsApi.getFeaturedChannels(limit);
