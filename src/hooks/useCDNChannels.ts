import { useState, useEffect, useCallback } from 'react';
import { 
  CDNChannel, 
  fetchChannels, 
  getChannelsByCountry,
  searchChannels,
  cdnChannelsApi,
  getFeaturedChannels
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
        fetchChannels(),
        getChannelsByCountry()
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
        const channelsByCountryData = await getChannelsByCountry();
        const countryChannels = channelsByCountryData[country];

        if (!countryChannels || countryChannels.length === 0) {
          // Try to find channel in all channels
          const allChannels = await fetchChannels();
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
        const searchResults = await searchChannels(query);
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

// Hook for featured channels
export const useFeaturedChannels = (limit: number = 12) => {
  const [channels, setChannels] = useState<CDNChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      setIsLoading(true);
      try {
        const featured = await getFeaturedChannels(limit);
        setChannels(featured);
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
