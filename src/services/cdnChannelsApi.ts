// CDN Channels API Service
// Fetches live TV channels directly (no edge function)
// Also fetches 24/7 channels from SportSRC (time === 0)

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

// SportSRC match format (channels are matches with time === 0)
interface SportSRCMatch {
  id: string;
  title: string;
  time: number | string;
  category: string;
  poster?: string;
  sources?: any[];
}

interface CDNApiResponse {
  total_channels: number;
  channels: CDNApiChannel[];
}

// API URLs
const CDN_API_URL = 'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip';
const SPORTSRC_API = 'https://embed.damitv.pro/api';

// CORS proxy fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

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

// Direct fetch with CORS proxy fallback
const fetchWithCorsProxy = async (url: string): Promise<any> => {
  // First try direct
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`⚠️ Direct fetch failed: ${url}`);
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        console.log(`✅ CORS proxy success for channels`);
        return await response.json();
      }
    } catch (error) {
      // Silent fail, try next
    }
  }

  return null;
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

  private transformSportSRCChannel(match: SportSRCMatch, category: string): CDNChannel {
    return {
      id: `sportsrc-${match.id}`,
      title: match.title,
      country: category.charAt(0).toUpperCase() + category.slice(1),
      embedUrl: `https://embed.damitv.pro/embed/${match.id}`,
      logo: match.poster || undefined,
      viewers: 0,
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
      console.log('📺 Fetching channels directly from APIs...');
      
      let allChannels: CDNChannel[] = [];

      // Fetch CDN channels directly
      try {
        const cdnData = await fetchWithCorsProxy(CDN_API_URL);
        if (cdnData?.channels && Array.isArray(cdnData.channels)) {
          const cdnChannels = cdnData.channels.map((ch: CDNApiChannel) => this.transformChannel(ch));
          const validCdnChannels = cdnChannels.filter((ch: CDNChannel) => ch.embedUrl && ch.embedUrl.length > 0);
          allChannels.push(...validCdnChannels);
          console.log(`📺 CDN API returned ${validCdnChannels.length} channels`);
        }
      } catch (error) {
        console.warn('📺 CDN API failed');
      }

      // Fetch SportSRC 24/7 channels directly
      try {
        const sportsrcChannels = await this.fetchSportSRCChannels();
        allChannels.push(...sportsrcChannels);
        console.log(`📺 SportSRC returned ${sportsrcChannels.length} 24/7 channels`);
      } catch (error) {
        console.warn('📺 SportSRC API failed');
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

  private async fetchSportSRCChannels(): Promise<CDNChannel[]> {
    const categories = ['football', 'basketball', 'cricket', 'tennis', 'fight', 'hockey', 'motorsport'];
    const allChannels: CDNChannel[] = [];

    for (const category of categories) {
      try {
        const matchesUrl = `${SPORTSRC_API}/?data=matches&category=${category}`;
        const matchesData = await fetchWithCorsProxy(matchesUrl);

        if (!matchesData) continue;

        let matches: SportSRCMatch[] = [];
        if (Array.isArray(matchesData)) {
          matches = matchesData;
        } else if (matchesData.matches && Array.isArray(matchesData.matches)) {
          matches = matchesData.matches;
        } else if (matchesData.data && Array.isArray(matchesData.data)) {
          matches = matchesData.data;
        }

        // Filter for 24/7 channels (time === 0)
        const channels = matches.filter((m: SportSRCMatch) => {
          const time = typeof m.time === 'string' ? parseInt(m.time, 10) : m.time;
          return time === 0;
        });

        for (const channel of channels) {
          allChannels.push(this.transformSportSRCChannel(channel, category));
        }
      } catch (error) {
        // Silent fail for individual category
      }
    }

    return allChannels;
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
