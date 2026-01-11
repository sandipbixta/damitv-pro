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

// API response format based on BOHOSport-style structure
interface CDNEventApiResponse {
  id?: string;
  title?: string;
  time?: number | string;
  poster?: string;
  category?: string;
  league?: string;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources?: Array<{ source: string; id: string }>;
}

// API Endpoints
const CDN_EVENTS_BASE = 'https://api.cdn-live.tv/api/v1/vip/damitv/events';

// CORS proxy fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

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
        console.log(`✅ CORS proxy success for events`);
        return await response.json();
      }
    } catch (error) {
      // Silent fail, try next
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
  
  // Get first source for embed URL
  const firstSource = event.sources?.[0];
  const embedUrl = firstSource 
    ? `https://embed.damitv.pro/${firstSource.source}/${firstSource.id}`
    : '';

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
      
      // Fetch from all sports endpoint
      const sportsUrl = `${CDN_EVENTS_BASE}/sports/`;
      const data = await fetchWithCorsProxy(sportsUrl);
      
      if (!data) {
        console.warn('🎮 No data from CDN events API');
        return this.cache.data || [];
      }

      let events: CDNEvent[] = [];

      // Handle different response structures
      if (Array.isArray(data)) {
        events = data.map((e: CDNEventApiResponse) => transformEvent(e, e.category || 'sports'));
      } else if (data.matches && Array.isArray(data.matches)) {
        events = data.matches.map((e: CDNEventApiResponse) => transformEvent(e, e.category || 'sports'));
      } else if (data.data && Array.isArray(data.data)) {
        events = data.data.map((e: CDNEventApiResponse) => transformEvent(e, e.category || 'sports'));
      } else if (typeof data === 'object') {
        // Response might be organized by sport
        for (const [sport, sportData] of Object.entries(data)) {
          if (Array.isArray(sportData)) {
            const sportEvents = (sportData as CDNEventApiResponse[]).map(e => transformEvent(e, sport));
            events.push(...sportEvents);
          }
        }
      }

      // Sort by date (live first, then upcoming)
      events.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return a.date - b.date;
      });

      // Update cache
      this.cache = {
        data: events,
        timestamp: Date.now()
      };

      console.log(`🎮 CDN Events loaded: ${events.length}`);
      return events;
    } catch (error) {
      console.error('🎮 Error fetching CDN events:', error);
      return this.cache.data || [];
    }
  }

  async fetchEventsBySport(sport: string): Promise<CDNEvent[]> {
    const sportEndpoints: Record<string, string> = {
      'football': 'football',
      'soccer': 'football',
      'nba': 'nba',
      'basketball': 'nba',
      'nfl': 'nfl',
      'american-football': 'nfl',
      'nhl': 'nhl',
      'hockey': 'nhl'
    };

    const endpoint = sportEndpoints[sport.toLowerCase()] || sport;
    const url = `${CDN_EVENTS_BASE}/${endpoint}/`;
    
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
