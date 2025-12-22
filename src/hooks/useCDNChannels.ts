import { useState, useEffect, useCallback } from 'react';
import { 
  CDNChannel, 
  fetchCDNChannels, 
  getCDNChannelsByCountry,
  getCDNChannelById,
  searchCDNChannels,
  cdnChannelsApi
} from '../services/cdnChannelsApi';
import { getChannelsByCountry as getStaticChannelsByCountry, tvChannels } from '../data/tvChannels';

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

      // If CDN API returns no data, fall back to static data
      if (allChannels.length === 0) {
        console.log('📺 CDN API returned no data, using static channels');
        const staticByCountry = getStaticChannelsByCountry();
        setChannelsByCountry(staticByCountry);
        setChannels(tvChannels);
        setCountries(Object.keys(staticByCountry).sort());
      } else {
        setChannels(allChannels);
        setChannelsByCountry(grouped);
        setCountries(Object.keys(grouped).sort());
      }
    } catch (err) {
      console.error('📺 Error loading channels:', err);
      setError('Failed to load channels');
      
      // Fall back to static data on error
      const staticByCountry = getStaticChannelsByCountry();
      setChannelsByCountry(staticByCountry);
      setChannels(tvChannels);
      setCountries(Object.keys(staticByCountry).sort());
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
          // Fall back to static data
          const staticByCountry = getStaticChannelsByCountry();
          const staticCountryChannels = staticByCountry[country];
          
          if (staticCountryChannels) {
            const foundChannel = staticCountryChannels.find(ch => ch.id === channelId);
            if (foundChannel) {
              setChannel(foundChannel);
              setOtherChannels(staticCountryChannels.filter(ch => ch.id !== channelId));
            } else {
              setError('Channel not found');
            }
          } else {
            setError('Country not found');
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
        
        // Try static data as fallback
        const staticByCountry = getStaticChannelsByCountry();
        const staticCountryChannels = staticByCountry[country];
        if (staticCountryChannels) {
          const foundChannel = staticCountryChannels.find(ch => ch.id === channelId);
          if (foundChannel) {
            setChannel(foundChannel);
            setOtherChannels(staticCountryChannels.filter(ch => ch.id !== channelId));
            setError(null);
          }
        }
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
        
        // If no CDN results, search static data
        if (searchResults.length === 0) {
          const lowerQuery = query.toLowerCase();
          const staticResults = tvChannels.filter(ch => 
            ch.title.toLowerCase().includes(lowerQuery)
          );
          setResults(staticResults);
        } else {
          setResults(searchResults);
        }
      } catch (err) {
        console.error('📺 Search error:', err);
        // Fall back to static search
        const lowerQuery = query.toLowerCase();
        const staticResults = tvChannels.filter(ch => 
          ch.title.toLowerCase().includes(lowerQuery)
        );
        setResults(staticResults);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { results, isSearching };
};
