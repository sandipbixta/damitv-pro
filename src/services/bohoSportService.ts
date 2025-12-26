import { supabase } from '@/integrations/supabase/client';
import { Match, Source } from '@/types/sports';

// BOHOSport API endpoints to try
const ENDPOINTS_TO_TRY = [
  '', // Root endpoint
  'live',
  'today',
  'matches',
  'football',
  'all',
  'events',
];

// Fetch matches through Supabase Edge Function proxy
export const fetchBohoMatchesViaProxy = async (): Promise<Match[]> => {
  for (const endpoint of ENDPOINTS_TO_TRY) {
    try {
      console.log(`🔄 Trying BOHOSport endpoint: ${endpoint || 'root'}`);
      
      const { data, error } = await supabase.functions.invoke('boho-sport', {
        body: { endpoint },
      });

      if (error) {
        console.error(`❌ Endpoint ${endpoint} error:`, error);
        continue;
      }

      console.log(`📦 Endpoint ${endpoint} response:`, data);

      // If we got valid data, parse and return it
      if (data && !data.error && data.success !== false) {
        const matches = parseBohoResponse(data);
        if (matches.length > 0) {
          console.log(`✅ Found ${matches.length} matches from endpoint: ${endpoint || 'root'}`);
          return matches;
        }
      }
    } catch (err) {
      console.error(`❌ Endpoint ${endpoint} failed:`, err);
    }
  }

  console.log('⚠️ All BOHOSport endpoints failed, returning empty array');
  return [];
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

  console.log(`📊 Parsing ${items.length} items from BOHOSport response`);

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

// Fetch specific sport through proxy
export const fetchBohoSportViaProxy = async (sport: string): Promise<Match[]> => {
  try {
    console.log(`🔄 Fetching BOHOSport: ${sport}`);
    
    const { data, error } = await supabase.functions.invoke('boho-sport', {
      body: { endpoint: sport },
    });

    if (error) {
      console.error(`❌ BOHOSport ${sport} error:`, error);
      return [];
    }

    return parseBohoResponse(data);
  } catch (err) {
    console.error(`❌ BOHOSport ${sport} failed:`, err);
    return [];
  }
};

// Fetch stream through proxy
export const fetchBohoStreamViaProxy = async (matchId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('boho-sport', {
      body: { endpoint: `stream/${matchId}` },
    });

    if (error) {
      console.error(`❌ BOHOSport stream error:`, error);
      return null;
    }

    // Extract embed URL from response
    if (data.embedUrl) return data.embedUrl;
    if (data.embed) return data.embed;
    if (data.iframe) return data.iframe;
    if (data.url) return data.url;
    if (Array.isArray(data) && data[0]?.embedUrl) return data[0].embedUrl;
    
    return null;
  } catch (err) {
    console.error(`❌ BOHOSport stream failed:`, err);
    return null;
  }
};
