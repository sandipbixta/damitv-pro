import { useState, useEffect } from 'react';
import { CDNEvent, fetchCDNEvents, fetchCDNEventsBySport, getFeaturedCDNEvents } from '@/services/cdnEventsApi';

interface UseCDNEventsResult {
  events: CDNEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCDNEvents = (): UseCDNEventsResult => {
  const [events, setEvents] = useState<CDNEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCDNEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error('CDN Events error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    events,
    isLoading,
    error,
    refetch: fetchData
  };
};

export const useCDNEventsBySport = (sport: string) => {
  const [events, setEvents] = useState<CDNEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sport) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCDNEventsBySport(sport);
        setEvents(data);
      } catch (err) {
        setError('Failed to load events');
        console.error('CDN Events error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sport]);

  return { events, isLoading, error };
};

export const useFeaturedCDNEvents = (limit: number = 10) => {
  const [events, setEvents] = useState<CDNEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getFeaturedCDNEvents(limit);
        setEvents(data);
      } catch (err) {
        console.error('Featured CDN Events error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { events, isLoading };
};
