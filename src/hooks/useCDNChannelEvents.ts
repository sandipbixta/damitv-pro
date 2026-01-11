import { useState, useEffect } from 'react';

export interface CDNChannelEvent {
  id: string;
  title: string;
  country: string;
  embedUrl: string;
  logo: string | null;
  viewers: number;
  isLive: boolean;
  sport: string;
}

interface UseCDNChannelEventsResult {
  channels: CDNChannelEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const SUPABASE_URL = 'https://wxvsteaayxgygihpshoz.supabase.co';

export const useCDNChannelEvents = (limit: number = 20): UseCDNChannelEventsResult => {
  const [channels, setChannels] = useState<CDNChannelEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/cdn-events?limit=${limit}`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.channels) {
        setChannels(data.channels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      console.error('Error fetching CDN channels:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { channels, isLoading, error, refetch: fetchData };
};

export const useCDNChannelsByCountry = (country: string) => {
  const [channels, setChannels] = useState<CDNChannelEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/cdn-events?country=${country}`,
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await response.json();
        setChannels(data.success ? data.channels : []);
      } catch {
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (country) fetchData();
  }, [country]);

  return { channels, isLoading };
};
