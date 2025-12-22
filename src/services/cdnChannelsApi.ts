// CDN Channels API Service
// Fetches live TV channels from cdn-live.tv API

export interface CDNChannel {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo?: string;
  category?: string;
}

interface CDNApiChannel {
  id: string;
  name: string;
  country: string;
  url: string;
  logo?: string;
  category?: string;
}

interface CDNApiResponse {
  channels: CDNApiChannel[];
  total?: number;
}

class CDNChannelsApiService {
  private baseUrl = 'https://cdn-live.tv/api';
  private cache: { data: CDNChannel[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes
  private isFetching = false;
  private fetchPromise: Promise<CDNChannel[]> | null = null;

  private transformChannel(apiChannel: CDNApiChannel): CDNChannel {
    return {
      id: apiChannel.id || apiChannel.name.toLowerCase().replace(/\s+/g, '-'),
      title: apiChannel.name,
      country: apiChannel.country || 'Unknown',
      embedUrl: apiChannel.url,
      logo: apiChannel.logo,
      category: apiChannel.category
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
      console.log('📺 Fetching channels from CDN API...');
      
      const response = await fetch(`${this.baseUrl}/channels`, {
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
        console.warn('📺 Invalid CDN API response format');
        return this.cache.data || [];
      }

      const channels = data.channels.map(ch => this.transformChannel(ch));
      
      // Update cache
      this.cache = {
        data: channels,
        timestamp: Date.now()
      };

      console.log(`📺 Loaded ${channels.length} channels from CDN API`);
      return channels;
    } catch (error) {
      console.error('📺 Error fetching CDN channels:', error);
      // Return cached data if available, otherwise empty array
      return this.cache.data || [];
    }
  }

  async getChannelsByCountry(): Promise<Record<string, CDNChannel[]>> {
    const channels = await this.fetchChannels();
    
    return channels.reduce((acc, channel) => {
      const country = channel.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(channel);
      return acc;
    }, {} as Record<string, CDNChannel[]>);
  }

  async getChannelById(country: string, channelId: string): Promise<CDNChannel | null> {
    const channelsByCountry = await this.getChannelsByCountry();
    const countryChannels = channelsByCountry[country];
    
    if (!countryChannels) {
      return null;
    }

    return countryChannels.find(ch => ch.id === channelId) || null;
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
