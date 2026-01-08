// CDN Channels API Service
// Fetches live TV channels via Supabase Edge Function to avoid CORS
// Now also fetches 24/7 channels from SportSRC (time === 0)

import { supabase } from '@/integrations/supabase/client';

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

interface SportSRCApiResponse {
  total_channels: number;
  channels: SportSRCChannel[];
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
      viewers: apiChannel.viewers,
      source: 'cdn'
    };
  }

  private transformSportSRCChannel(channel: SportSRCChannel): CDNChannel {
    return {
      id: channel.id,
      title: channel.title || channel.name,
      country: channel.country || channel.category,
      embedUrl: channel.embedUrl,
      logo: channel.logo || channel.image || undefined,
      viewers: channel.viewers || 0,
      isLive247: true,
      source: 'sportsrc'
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
      console.log('📺 Fetching channels from both CDN and SportSRC...');
      
      // Fetch from both sources in parallel
      const [cdnResult, sportsrcResult] = await Promise.allSettled([
        supabase.functions.invoke('cdn-channels'),
        supabase.functions.invoke('sportsrc-channels')
      ]);

      let allChannels: CDNChannel[] = [];

      // Process CDN channels
      if (cdnResult.status === 'fulfilled' && !cdnResult.value.error) {
        const apiData: CDNApiResponse = cdnResult.value.data;
        if (apiData?.channels && Array.isArray(apiData.channels)) {
          const cdnChannels = apiData.channels.map(ch => this.transformChannel(ch));
          const validCdnChannels = cdnChannels.filter(ch => ch.embedUrl && ch.embedUrl.length > 0);
          allChannels.push(...validCdnChannels);
          console.log(`📺 CDN API returned ${validCdnChannels.length} channels`);
        }
      } else {
        console.warn('📺 CDN API failed or returned error');
      }

      // Process SportSRC 24/7 channels
      if (sportsrcResult.status === 'fulfilled' && !sportsrcResult.value.error) {
        const sportsrcData: SportSRCApiResponse = sportsrcResult.value.data;
        if (sportsrcData?.channels && Array.isArray(sportsrcData.channels)) {
          const sportsrcChannels = sportsrcData.channels.map(ch => this.transformSportSRCChannel(ch));
          const validSportsrcChannels = sportsrcChannels.filter(ch => ch.embedUrl && ch.embedUrl.length > 0);
          allChannels.push(...validSportsrcChannels);
          console.log(`📺 SportSRC API returned ${validSportsrcChannels.length} 24/7 channels`);
        }
      } else {
        console.warn('📺 SportSRC API failed or returned error');
      }

      // Update cache
      this.cache = {
        data: allChannels,
        timestamp: Date.now()
      };

      console.log(`📺 Total channels loaded: ${allChannels.length}`);
      return allChannels;
    } catch (error) {
      console.error('📺 Error fetching channels:', error);
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
