// CDN Channels API Service
// Fetches live TV channels from api.cdn-live.tv API

export interface CDNChannel {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo?: string;
  category?: string;
}

interface CDNApiChannel {
  id?: string | number;
  name?: string;
  title?: string;
  country?: string;
  region?: string;
  url?: string;
  embed_url?: string;
  embedUrl?: string;
  logo?: string;
  image?: string;
  category?: string;
  type?: string;
}

class CDNChannelsApiService {
  private baseUrl = 'https://api.cdn-live.tv/api/v1/vip/damitv/channels/';
  private cache: { data: CDNChannel[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes
  private isFetching = false;
  private fetchPromise: Promise<CDNChannel[]> | null = null;

  private transformChannel(apiChannel: CDNApiChannel, index: number): CDNChannel {
    // Handle various possible API response formats
    const name = apiChannel.name || apiChannel.title || `Channel ${index + 1}`;
    const id = apiChannel.id?.toString() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const country = apiChannel.country || apiChannel.region || 'International';
    const embedUrl = apiChannel.url || apiChannel.embed_url || apiChannel.embedUrl || '';
    const logo = apiChannel.logo || apiChannel.image;
    const category = apiChannel.category || apiChannel.type;

    return {
      id,
      title: name,
      country,
      embedUrl,
      logo,
      category
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

      const data = await response.json();
      
      // Handle different possible response formats
      let channelsArray: CDNApiChannel[] = [];
      
      if (Array.isArray(data)) {
        channelsArray = data;
      } else if (data.channels && Array.isArray(data.channels)) {
        channelsArray = data.channels;
      } else if (data.data && Array.isArray(data.data)) {
        channelsArray = data.data;
      } else if (typeof data === 'object') {
        // If it's an object with country keys containing arrays
        Object.values(data).forEach(value => {
          if (Array.isArray(value)) {
            channelsArray.push(...(value as CDNApiChannel[]));
          }
        });
      }

      if (channelsArray.length === 0) {
        console.warn('📺 No channels found in API response');
        return this.cache.data || [];
      }

      const channels = channelsArray.map((ch, index) => this.transformChannel(ch, index));
      
      // Filter out channels without embed URLs
      const validChannels = channels.filter(ch => ch.embedUrl && ch.embedUrl.length > 0);

      // Update cache
      this.cache = {
        data: validChannels,
        timestamp: Date.now()
      };

      console.log(`📺 Loaded ${validChannels.length} channels from CDN API`);
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
    const channelsByCountry = await this.getChannelsByCountry();
    const countryChannels = channelsByCountry[country];
    
    if (!countryChannels) {
      // Try to find in all channels
      const allChannels = await this.fetchChannels();
      return allChannels.find(ch => ch.id === channelId) || null;
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

  // Get featured channels (first few popular ones)
  async getFeaturedChannels(limit: number = 12): Promise<CDNChannel[]> {
    const channels = await this.fetchChannels();
    return channels.slice(0, limit);
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
