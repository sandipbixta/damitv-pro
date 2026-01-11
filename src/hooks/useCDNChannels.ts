import { useState, useEffect, useCallback } from 'react';
import { 
  CDNChannel, 
  fetchCDNChannels, 
  getCDNChannelsByCountry,
  searchCDNChannels,
  cdnChannelsApi,
  getFeaturedCDNChannels
} from '../services/cdnChannelsApi';
import { fetchAllMatches, getTeamBadgeUrl } from '@/api/sportsApi';
import { buildEmbedUrl, getEmbedDomainSync } from '@/utils/embedDomains';

// Helper to build full embed URL
const buildFullEmbedUrl = (source: string, id: string, streamNo: number = 1): string => {
  const domain = getEmbedDomainSync();
  return buildEmbedUrl(domain, source, id, streamNo);
};

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

// Hook for getting a single channel - also checks live matches
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
        // First try CDN channels
        const channelsByCountry = await getCDNChannelsByCountry();
        const countryChannels = channelsByCountry[country];

        if (!countryChannels || countryChannels.length === 0) {
          // Try to find channel in all channels
          const allChannels = await fetchCDNChannels();
          const foundChannel = allChannels.find(ch => ch.id === channelId);
          
          if (foundChannel) {
            setChannel(foundChannel);
            const sameCountry = allChannels.filter(ch => ch.country === foundChannel.country && ch.id !== channelId);
            setOtherChannels(sameCountry.length > 0 ? sameCountry : allChannels.filter(ch => ch.id !== channelId).slice(0, 20));
          } else {
            // Not found in channels - try live matches
            const matches = await fetchAllMatches();
            const foundMatch = matches.find(m => m.id === channelId);
            
            if (foundMatch && foundMatch.sources && foundMatch.sources.length > 0) {
              // Convert match to channel format
              const firstSource = foundMatch.sources[0];
              const embedUrl = buildFullEmbedUrl(firstSource.source, firstSource.id, 1);
              
              const matchAsChannel: CDNChannel = {
                id: foundMatch.id,
                title: foundMatch.title,
                country: foundMatch.sportId || foundMatch.category || 'Sports',
                embedUrl: embedUrl,
                logo: foundMatch.teams?.home?.badge ? getTeamBadgeUrl(foundMatch.teams.home.badge) : foundMatch.poster,
                source: 'cdn'
              };
              
              setChannel(matchAsChannel);
              
              // Get other live matches as "other channels"
              const otherMatches = matches
                .filter(m => m.id !== channelId && m.sources && m.sources.length > 0)
                .slice(0, 20)
                .map(m => {
                  const src = m.sources![0];
                  return {
                    id: m.id,
                    title: m.title,
                    country: m.sportId || m.category || 'Sports',
                    embedUrl: buildFullEmbedUrl(src.source, src.id, 1),
                    logo: m.teams?.home?.badge ? getTeamBadgeUrl(m.teams.home.badge) : m.poster,
                    source: 'cdn' as const
                  };
                });
              
              setOtherChannels(otherMatches);
            } else {
              setError('Channel not found');
            }
          }
        } else {
          const foundChannel = countryChannels.find(ch => ch.id === channelId);
          
          if (foundChannel) {
            setChannel(foundChannel);
            setOtherChannels(countryChannels.filter(ch => ch.id !== channelId));
          } else {
            // Check in live matches as fallback
            const matches = await fetchAllMatches();
            const foundMatch = matches.find(m => m.id === channelId);
            
            if (foundMatch && foundMatch.sources && foundMatch.sources.length > 0) {
              const firstSource = foundMatch.sources[0];
              const embedUrl = buildFullEmbedUrl(firstSource.source, firstSource.id, 1);
              
              const matchAsChannel: CDNChannel = {
                id: foundMatch.id,
                title: foundMatch.title,
                country: foundMatch.sportId || foundMatch.category || 'Sports',
                embedUrl: embedUrl,
                logo: foundMatch.teams?.home?.badge ? getTeamBadgeUrl(foundMatch.teams.home.badge) : foundMatch.poster,
                source: 'cdn'
              };
              
              setChannel(matchAsChannel);
              setOtherChannels(countryChannels.filter(ch => ch.id !== channelId));
            } else {
              setError('Channel not found');
            }
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

// Hook for featured channels
export const useFeaturedChannels = (limit: number = 12) => {
  const [channels, setChannels] = useState<CDNChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      setIsLoading(true);
      try {
        const featured = await getFeaturedCDNChannels(limit);
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
