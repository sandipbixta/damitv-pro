import { Match, Source } from '@/types/sports';
import { getEmbedDomainSync, buildEmbedUrl } from '@/utils/embedDomains';

// API endpoints - use damitv proxy to avoid CORS issues
const API_BASES = [
  'https://embed.damitv.pro/api'
];

// CORS proxy fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

// Direct API fetch with CORS proxy fallback
const fetchFromApi = async (endpoint: string): Promise<any> => {
  // First try direct calls
  for (const baseUrl of API_BASES) {
    try {
      const url = `${baseUrl}/${endpoint}`;
      console.log(`🔄 Trying direct: ${url}`);
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Direct success: ${baseUrl}`);
        return data;
      }
    } catch (error) {
      console.warn(`⚠️ Direct failed: ${baseUrl}/${endpoint}`);
    }
  }

  // Fallback to CORS proxies
  for (const proxy of CORS_PROXIES) {
    for (const baseUrl of API_BASES) {
      try {
        const targetUrl = `${baseUrl}/${endpoint}`;
        const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
        console.log(`🔄 Trying CORS proxy: ${proxy.split('?')[0]}`);
        
        const response = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ CORS proxy success`);
          return data;
        }
      } catch (error) {
        console.warn(`⚠️ CORS proxy failed`);
      }
    }
  }

  throw new Error(`All API endpoints failed for: ${endpoint}`);
};

// Fetch matches directly (no edge function)
export const fetchBohoMatchesViaProxy = async (): Promise<Match[]> => {
  try {
    console.log('🔄 Fetching matches directly from API...');
    
    const data = await fetchFromApi('matches/all');

    // If we got valid data, parse and return it
    if (data) {
      const matches = parseBohoResponse(data);
      console.log(`✅ Found ${matches.length} matches from direct API`);
      return matches;
    }

    console.log('⚠️ Direct API returned no valid data');
    return [];
  } catch (err) {
    console.error('❌ Direct API failed:', err);
    return [];
  }
};

// Parse BOHOSport API response to our Match format
const parseBohoResponse = (data: any): Match[] => {
  // Handle different possible response formats
  let items: any[] = [];
  
  if (Array.isArray(data)) {
    items = data;
  } else if (data.matches && Array.isArray(data.matches)) {
    items = data.matches;
  } else if (data.events && Array.isArray(data.events)) {
    items = data.events;
  } else if (data.data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data.live && Array.isArray(data.live)) {
    items = data.live;
  } else if (typeof data === 'object') {
    // If it's an object with match-like properties, wrap it
    if (data.id || data.title || data.home_team) {
      items = [data];
    }
  }

  console.log(`📊 Parsing ${items.length} items from API response`);

  return items.map((item: any, index: number): Match | null => {
    try {
      // Parse teams from title if available
      let homeTeam = item.home_team || item.homeTeam || item.home || item.team1 || '';
      let awayTeam = item.away_team || item.awayTeam || item.away || item.team2 || '';
      const title = item.title || item.name || item.match_name || '';
      
      // Try to extract teams from title
      if (!homeTeam && !awayTeam && title) {
        if (title.includes(' vs ')) {
          const parts = title.split(' vs ');
          homeTeam = parts[0]?.trim() || '';
          awayTeam = parts[1]?.trim() || '';
        } else if (title.includes(' v ')) {
          const parts = title.split(' v ');
          homeTeam = parts[0]?.trim() || '';
          awayTeam = parts[1]?.trim() || '';
        }
      }

      // Parse date
      let matchDate = 0;
      if (item.date) {
        if (typeof item.date === 'number') {
          matchDate = item.date;
        } else if (typeof item.date === 'string') {
          matchDate = new Date(item.date).getTime();
        }
      } else if (item.time) {
        matchDate = new Date(item.time).getTime();
      } else if (item.start_time) {
        matchDate = new Date(item.start_time).getTime();
      }

      // Build sources array
      const sources: Source[] = [];
      if (item.sources && Array.isArray(item.sources)) {
        item.sources.forEach((src: any) => {
          if (src.source && src.id) {
            sources.push({ source: src.source, id: src.id });
          }
        });
      }
      if (item.channels && Array.isArray(item.channels)) {
        item.channels.forEach((ch: any, idx: number) => {
          sources.push({ source: ch.name || `channel-${idx}`, id: ch.url || ch.id || String(idx) });
        });
      }
      
      // Default source if none found
      if (sources.length === 0 && (item.stream_url || item.streamUrl || item.iframe || item.embed)) {
        sources.push({ source: 'boho', id: item.id || String(index) });
      }
      if (sources.length === 0 && item.id) {
        sources.push({ source: 'main', id: String(item.id) });
      }

      // Map category
      const category = mapCategory(item.category || item.sport || item.league || 'other');

      return {
        id: String(item.id || item.match_id || `boho-${index}`),
        title: title || `${homeTeam} vs ${awayTeam}` || 'Match',
        category: category,
        sportId: category,
        date: matchDate || Date.now(),
        poster: item.poster || item.image || item.thumbnail || '',
        popular: item.popular === true || item.featured === true || item.is_live === true,
        teams: {
          home: {
            name: homeTeam,
            badge: item.home_logo || item.homeLogo || item.home_badge || ''
          },
          away: {
            name: awayTeam,
            badge: item.away_logo || item.awayLogo || item.away_badge || ''
          }
        },
        sources: sources,
        viewerCount: item.viewers || item.viewerCount || 0
      };
    } catch (error) {
      console.error('Error parsing match:', error, item);
      return null;
    }
  }).filter((m): m is Match => m !== null);
};

// Map category to our sport IDs
const mapCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'soccer': 'football',
    'football': 'football',
    'basketball': 'basketball',
    'tennis': 'tennis',
    'cricket': 'cricket',
    'hockey': 'hockey',
    'ice-hockey': 'hockey',
    'fight': 'fight',
    'mma': 'fight',
    'boxing': 'fight',
    'ufc': 'fight',
    'baseball': 'baseball',
    'rugby': 'rugby',
    'american-football': 'american-football',
    'nfl': 'american-football',
    'motorsport': 'motorsport',
    'f1': 'motorsport',
  };
  return categoryMap[category?.toLowerCase()] || category?.toLowerCase() || 'other';
};

// Fetch specific sport directly (no edge function)
export const fetchBohoSportViaProxy = async (sport: string): Promise<Match[]> => {
  try {
    console.log(`🔄 Fetching sport directly: ${sport}`);
    
    const data = await fetchFromApi(`matches/${sport}`);
    return parseBohoResponse(data);
  } catch (err) {
    console.error(`❌ Direct API ${sport} failed:`, err);
    return [];
  }
};

// Fetch stream directly - returns ad-free embed URL (no edge function)
export const fetchBohoStreamViaProxy = async (matchId: string): Promise<string | null> => {
  try {
    // Build ad-free embed URL using domain manager
    const domain = getEmbedDomainSync();
    const adFreeUrl = buildEmbedUrl(domain, 'main', matchId, 1);
    console.log(`✅ Built ad-free embed URL: ${adFreeUrl}`);
    return adFreeUrl;
  } catch (err) {
    console.error(`❌ Stream URL build failed:`, err);
    return null;
  }
};
