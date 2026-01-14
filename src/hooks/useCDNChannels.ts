import { useState, useEffect, useCallback } from 'react';
import { 
  CDNChannel, 
  fetchCDNChannels, 
  getCDNChannelsByCountry,
  searchCDNChannels,
  cdnChannelsApi,
  getFeaturedCDNChannels
} from '../services/cdnChannelsApi';

export interface UseChannelsResult {
  channels: CDNChannel[];
  channelsByCountry: Record<string, CDNChannel[]>;
  countries: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCDNChannels = (): UseChannelsResult => {
  const [channels, setChannels] = useState<CDNChannel[]>([]);
  const [channelsByCountry, setChannelsByCountry] = useState<Record<string, CDNChannel[]>>({});
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allChannels, grouped] = await Promise.all([
        fetchCDNChannels(),
        getCDNChannelsByCountry()
      ]);

      if (allChannels.length === 0) {
        setError('No channels available');
      }
      
      setChannels(allChannels);
      setChannelsByCountry(grouped);
      setCountries(Object.keys(grouped).sort());
    } catch (err) {
      console.error('📺 Error loading channels:', err);
      setError('Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    cdnChannelsApi.clearCache();
    await fetchData();
  }, [fetchData]);

  return {
    channels,
    channelsByCountry,
    countries,
    isLoading,
    error,
    refetch
  };
};

// Hook for getting a single channel
export const useCDNChannel = (country: string | undefined, channelId: string | undefined) => {
  const [channel, setChannel] = useState<CDNChannel | null>(null);
  const [otherChannels, setOtherChannels] = useState<CDNChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChannel = async () => {
      if (!country || !channelId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const channelsByCountry = await getCDNChannelsByCountry();
        const countryChannels = channelsByCountry[country];

        if (!countryChannels || countryChannels.length === 0) {
          // Try to find channel in all channels
          const allChannels = await fetchCDNChannels();
          const foundChannel = allChannels.find(ch => ch.id === channelId);
          
          if (foundChannel) {
            setChannel(foundChannel);
            // Get other channels from same country or all channels
            const sameCountry = allChannels.filter(ch => ch.country === foundChannel.country && ch.id !== channelId);
            setOtherChannels(sameCountry.length > 0 ? sameCountry : allChannels.filter(ch => ch.id !== channelId).slice(0, 20));
          } else {
            setError('Channel not found');
          }
        } else {
          const foundChannel = countryChannels.find(ch => ch.id === channelId);
          
          if (foundChannel) {
            setChannel(foundChannel);
            setOtherChannels(countryChannels.filter(ch => ch.id !== channelId));
          } else {
            setError('Channel not found');
          }
        }
      } catch (err) {
        console.error('📺 Error loading channel:', err);
        setError('Failed to load channel');
      } finally {
        setIsLoading(false);
      }
    };

    loadChannel();
  }, [country, channelId]);

  return { channel, otherChannels, isLoading, error };
};

// Hook for searching channels
export const useChannelSearch = (query: string) => {
  const [results, setResults] = useState<CDNChannel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchCDNChannels(query);
        setResults(searchResults);
      } catch (err) {
        console.error('📺 Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, isSearching };
};

// Cache key for featured channels localStorage
const FEATURED_CACHE_KEY = 'damitv_featured_channels_v1';
const FEATURED_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

// Load featured channels from localStorage
const loadFeaturedFromCache = (): CDNChannel[] | null => {
  try {
    const cached = localStorage.getItem(FEATURED_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < FEATURED_CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.log('Featured cache read error:', e);
  }
  return null;
};

// Save featured channels to localStorage
const saveFeaturedToCache = (channels: CDNChannel[]) => {
  try {
    localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify({ data: channels, timestamp: Date.now() }));
  } catch (e) {
    console.log('Featured cache write error:', e);
  }
};

// Hook for featured channels
export const useFeaturedChannels = (limit: number = 12) => {
  // Load from cache immediately (synchronous)
  const cachedChannels = loadFeaturedFromCache();
  const [channels, setChannels] = useState<CDNChannel[]>(cachedChannels || []);
  const [isLoading, setIsLoading] = useState(!cachedChannels);

  useEffect(() => {
    // If we already have cached data, refresh in background
    if (cachedChannels && cachedChannels.length > 0) {
      // Use requestIdleCallback for non-blocking background refresh
      const refreshInBackground = async () => {
        try {
          const featured = await getFeaturedCDNChannels(limit);
          if (featured.length > 0) {
            setChannels(featured);
            saveFeaturedToCache(featured);
          }
        } catch (err) {
          console.error('📺 Background refresh error:', err);
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => refreshInBackground(), { timeout: 5000 });
      } else {
        setTimeout(refreshInBackground, 1000);
      }
      return;
    }

    // No cached data, fetch immediately
    const loadFeatured = async () => {
      setIsLoading(true);
      try {
        const featured = await getFeaturedCDNChannels(limit);
        setChannels(featured);
        saveFeaturedToCache(featured);
      } catch (err) {
        console.error('📺 Error loading featured channels:', err);
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatured();
  }, [limit]);

  return { channels, isLoading };
};
