// CDN Events API Service
// Fetches live sports events from the damitv CDN API

export interface CDNEvent {
  id: string;
  title: string;
  sport: string;
  date: number;
  time: string;
  poster?: string;
  league?: string;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  isLive: boolean;
  embedUrl: string;
  source: string;
}

// API response format based on CDN API structure
interface CDNEventApiResponse {
  id?: string;
  title?: string;
  time?: number | string;
  poster?: string;
  category?: string;
  league?: string;
  url?: string; // Direct embed URL from API
  embed_url?: string; // Alternative embed URL field
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources?: Array<{ source: string; id: string; url?: string }>;
}

// API Endpoints - Using the correct VIP path structure with trailing slashes
const CDN_EVENTS_ENDPOINTS = [
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/sports/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/football/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/nba/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/nfl/',
  'https://api.cdn-live.tv/api/v1/vip/damitv/events/nhl/',
];

// CORS proxy fallbacks - try more options
const CORS_PROXIES = [
  '', // Try direct first
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
];

// Direct fetch with CORS proxy fallback
const fetchWithCorsProxy = async (url: string): Promise<any> => {
  for (const proxy of CORS_PROXIES) {
    try {
      const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
      const response = await fetch(fetchUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ CDN Events fetch success${proxy ? ' via proxy' : ''}`);
        return data;
      }
    } catch (error) {
      // Silent fail, try next proxy
    }
  }
  return null;
};

// Parse event time to timestamp
const parseEventTime = (time: number | string | undefined): number => {
  if (!time) return Date.now();
  if (typeof time === 'number') {
    // If it's a Unix timestamp in seconds, convert to milliseconds
    return time < 10000000000 ? time * 1000 : time;
  }
  // Try parsing as date string
  const parsed = Date.parse(time);
  return isNaN(parsed) ? Date.now() : parsed;
};

// Transform API event to CDNEvent
const transformEvent = (event: CDNEventApiResponse, sport: string): CDNEvent => {
  const timestamp = parseEventTime(event.time);
  const isLive = timestamp <= Date.now() && timestamp > Date.now() - (3 * 60 * 60 * 1000); // Within last 3 hours
  
  // Use direct embed URL from API if available, otherwise check sources
  const firstSource = event.sources?.[0];
  const embedUrl = event.url 
    || event.embed_url 
    || firstSource?.url 
    || '';

  // Parse title to extract team names if not provided
  let teams = event.teams;
  if (!teams && event.title) {
    const vsMatch = event.title.match(/(.+?)\s+(?:vs?\.?|[-–])\s+(.+)/i);
    if (vsMatch) {
      teams = {
        home: { name: vsMatch[1].trim() },
        away: { name: vsMatch[2].trim() }
      };
    }
  }

  return {
    id: event.id || `${sport}-${timestamp}`,
    title: event.title || 'Unknown Event',
    sport,
    date: timestamp,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    poster: event.poster,
    league: event.league || event.category,
    teams,
    isLive,
    embedUrl,
    source: firstSource?.source || 'cdn'
  };
};

class CDNEventsApiService {
  private cache: { data: CDNEvent[] | null; timestamp: number } = { data: null, timestamp: 0 };
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private isFetching = false;
  private fetchPromise: Promise<CDNEvent[]> | null = null;

  async fetchAllEvents(): Promise<CDNEvent[]> {
    // Return cached data if valid
    if (this.cache.data && Date.now() - this.cache.timestamp < this.cacheExpiry) {
      console.log('🎮 Using cached CDN events data');
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

  private async doFetch(): Promise<CDNEvent[]> {
    try {
      console.log('🎮 Fetching events from CDN API...');
      
      let allEvents: CDNEvent[] = [];

      // Fetch from all endpoints in parallel
      const fetchPromises = CDN_EVENTS_ENDPOINTS.map(async (endpoint) => {
        try {
          const data = await fetchWithCorsProxy(endpoint);
          if (!data) return [];

          let events: CDNEvent[] = [];
          const sport = endpoint.split('/').pop() || 'sports';

          // Handle different response structures
          if (Array.isArray(data)) {
            events = data.map((e: CDNEventApiResponse) => transformEvent(e, e.category || sport));
          } else if (data.matches && Array.isArray(data.matches)) {
            events = data.matches.map((e: CDNEventApiResponse) => transformEvent(e, e.category || sport));
          } else if (data.data && Array.isArray(data.data)) {
            events = data.data.map((e: CDNEventApiResponse) => transformEvent(e, e.category || sport));
          } else if (data.events && Array.isArray(data.events)) {
            events = data.events.map((e: CDNEventApiResponse) => transformEvent(e, e.category || sport));
          } else if (typeof data === 'object' && !Array.isArray(data)) {
            // Response might be organized by category
            for (const [category, categoryData] of Object.entries(data)) {
              if (Array.isArray(categoryData)) {
                const categoryEvents = (categoryData as CDNEventApiResponse[]).map(e => transformEvent(e, category));
                events.push(...categoryEvents);
              }
            }
          }

          return events;
        } catch (error) {
          console.warn(`🎮 Failed to fetch from ${endpoint}`);
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allEvents.push(...result.value);
        }
      }

      // Remove duplicates by ID
      const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());

      // Sort by date (live first, then upcoming)
      uniqueEvents.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return a.date - b.date;
      });

      // Update cache
      this.cache = {
        data: uniqueEvents,
        timestamp: Date.now()
      };

      console.log(`🎮 CDN Events loaded: ${uniqueEvents.length}`);
      return uniqueEvents;
    } catch (error) {
      console.error('🎮 Error fetching CDN events:', error);
      return this.cache.data || [];
    }
  }

  async fetchEventsBySport(sport: string): Promise<CDNEvent[]> {
    const sportEndpoints: Record<string, string> = {
      'football': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/football/',
      'soccer': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/football/',
      'nba': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nba/',
      'basketball': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nba/',
      'nfl': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nfl/',
      'american-football': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nfl/',
      'nhl': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nhl/',
      'hockey': 'https://api.cdn-live.tv/api/v1/vip/damitv/events/nhl/'
    };

    const url = sportEndpoints[sport.toLowerCase()] || `https://api.cdn-live.tv/api/v1/vip/damitv/events/${sport}/`;
    
    try {
      const data = await fetchWithCorsProxy(url);
      if (!data) return [];

      let events: CDNEvent[] = [];
      
      if (Array.isArray(data)) {
        events = data.map((e: CDNEventApiResponse) => transformEvent(e, sport));
      } else if (data.matches) {
        events = data.matches.map((e: CDNEventApiResponse) => transformEvent(e, sport));
      } else if (data.data) {
        events = data.data.map((e: CDNEventApiResponse) => transformEvent(e, sport));
      }

      return events.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return a.date - b.date;
      });
    } catch (error) {
      console.error(`🎮 Error fetching ${sport} events:`, error);
      return [];
    }
  }

  async getFeaturedEvents(limit: number = 10): Promise<CDNEvent[]> {
    const events = await this.fetchAllEvents();
    // Return live events first, then upcoming
    return events
      .filter(e => e.embedUrl) // Only events with valid embed URLs
      .slice(0, limit);
  }

  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }
}

// Export singleton instance
export const cdnEventsApi = new CDNEventsApiService();

// Hook-friendly function exports
export const fetchCDNEvents = () => cdnEventsApi.fetchAllEvents();
export const fetchCDNEventsBySport = (sport: string) => cdnEventsApi.fetchEventsBySport(sport);
export const getFeaturedCDNEvents = (limit?: number) => cdnEventsApi.getFeaturedEvents(limit);
