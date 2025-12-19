import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WESTREAM_API = 'https://westream.top';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Sport priority for sorting
const SPORT_PRIORITY: Record<string, number> = {
  'Football': 1, 'Soccer': 1,
  'Basketball': 2, 'NBA': 2,
  'Cricket': 3, 'IPL': 3,
  'Tennis': 4,
  'Hockey': 5, 'Ice Hockey': 5, 'NHL': 5,
  'Baseball': 6, 'MLB': 6,
  'American Football': 7, 'NFL': 7,
  'Boxing': 8,
  'MMA': 9, 'UFC': 9,
  'Rugby': 10,
  'Volleyball': 11,
  'Golf': 12,
  'F1': 13, 'Formula 1': 13, 'Motorsport': 13,
  'Darts': 14,
  'Snooker': 15,
  'Table Tennis': 16,
  'Badminton': 17,
  'Handball': 18,
  'Cycling': 19,
  'Wrestling': 20,
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'Football': '⚽', 'Soccer': '⚽',
  'Basketball': '🏀', 'NBA': '🏀',
  'Tennis': '🎾',
  'Cricket': '🏏', 'IPL': '🏏',
  'Hockey': '🏒', 'Ice Hockey': '🏒', 'NHL': '🏒',
  'Baseball': '⚾', 'MLB': '⚾',
  'American Football': '🏈', 'NFL': '🏈',
  'Rugby': '🏉',
  'Volleyball': '🏐',
  'Golf': '⛳',
  'Boxing': '🥊',
  'MMA': '🥋', 'UFC': '🥋',
  'Wrestling': '🤼',
  'Cycling': '🚴',
  'Motorsport': '🏎️', 'F1': '🏎️', 'Formula 1': '🏎️',
  'Darts': '🎯',
  'Snooker': '🎱',
  'Table Tennis': '🏓',
  'Badminton': '🏸',
  'Handball': '🤾',
  'Swimming': '🏊',
  'Athletics': '🏃',
  'Esports': '🎮',
  'Other': '🏆',
};

interface WeStreamMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources: { source: string; id: string }[];
}

interface ApiMatch {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  timestamp: number;
  date: string;
  time: string;
  isLive: boolean;
  isPopular: boolean;
  teams: {
    home: { name: string; logo: string | null };
    away: { name: string; logo: string | null };
  } | null;
  streams: {
    source: string;
    streamId: string;
    embedUrl: string;
    streamNumber: number;
  }[];
}

interface ApiSport {
  name: string;
  emoji: string;
  matchCount: number;
  liveCount: number;
}

function isMatchLive(match: WeStreamMatch): boolean {
  const now = Date.now();
  const matchTime = match.date * 1000;
  const threeHoursMs = 3 * 60 * 60 * 1000;
  return matchTime <= now && matchTime > now - threeHoursMs;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[1].substring(0, 5);
}

function transformMatch(match: WeStreamMatch): ApiMatch {
  const streams = match.sources?.map((source, index) => ({
    source: source.source,
    streamId: source.id,
    embedUrl: `${WESTREAM_API}/embed/${source.source}/${source.id}/1`,
    streamNumber: index + 1,
  })) || [];

  return {
    id: match.id,
    title: match.title,
    category: match.category,
    categoryEmoji: CATEGORY_EMOJIS[match.category] || '🏆',
    timestamp: match.date,
    date: formatDate(match.date),
    time: formatTime(match.date),
    isLive: isMatchLive(match),
    isPopular: match.popular || false,
    teams: match.teams ? {
      home: { name: match.teams.home?.name || 'TBD', logo: match.teams.home?.badge || null },
      away: { name: match.teams.away?.name || 'TBD', logo: match.teams.away?.badge || null },
    } : null,
    streams,
  };
}

async function fetchAllMatches(): Promise<WeStreamMatch[]> {
  try {
    const response = await fetch(`${WESTREAM_API}/matches`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

async function fetchStreamInfo(source: string, id: string): Promise<any[]> {
  try {
    const response = await fetch(`${WESTREAM_API}/streams/${source}/${id}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-matches', '');
  
  console.log(`API Request: ${path}`);

  try {
    // GET /api-matches - API Documentation
    if (path === '' || path === '/') {
      const docs = {
        name: "Sports Streaming API",
        version: "1.0.0",
        description: "Public API for accessing live sports matches and streams",
        baseUrl: `${url.origin}/functions/v1/api-matches`,
        endpoints: {
          "/matches": {
            method: "GET",
            description: "Get all matches",
            params: {
              limit: "Number of matches to return (default: 100)",
              offset: "Pagination offset (default: 0)",
            },
          },
          "/matches/live": {
            method: "GET",
            description: "Get only live matches",
          },
          "/matches/popular": {
            method: "GET",
            description: "Get popular/featured matches",
          },
          "/matches/upcoming": {
            method: "GET",
            description: "Get upcoming matches (not yet started)",
          },
          "/matches/:id": {
            method: "GET",
            description: "Get single match by ID with full stream details",
          },
          "/sports": {
            method: "GET",
            description: "Get list of all sports categories with match counts",
          },
          "/sports/:category": {
            method: "GET",
            description: "Get matches for a specific sport category",
          },
          "/streams/:source/:id": {
            method: "GET",
            description: "Get stream URLs for a specific source",
          },
        },
        example: {
          curl: `curl "${url.origin}/functions/v1/api-matches/matches/live"`,
        },
      };
      return new Response(JSON.stringify(docs, null, 2), { headers: corsHeaders });
    }

    const matches = await fetchAllMatches();

    // GET /matches - All matches
    if (path === '/matches') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      const sorted = matches
        .sort((a, b) => {
          const aLive = isMatchLive(a) ? 1 : 0;
          const bLive = isMatchLive(b) ? 1 : 0;
          if (bLive !== aLive) return bLive - aLive;
          if (b.popular !== a.popular) return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          return a.date - b.date;
        })
        .slice(offset, offset + limit);

      return new Response(JSON.stringify({
        total: matches.length,
        limit,
        offset,
        matches: sorted.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // GET /matches/live - Live matches only
    if (path === '/matches/live') {
      const liveMatches = matches
        .filter(isMatchLive)
        .sort((a, b) => {
          const aPriority = SPORT_PRIORITY[a.category] || 99;
          const bPriority = SPORT_PRIORITY[b.category] || 99;
          if (aPriority !== bPriority) return aPriority - bPriority;
          if (b.popular !== a.popular) return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          return a.date - b.date;
        });

      return new Response(JSON.stringify({
        total: liveMatches.length,
        matches: liveMatches.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // GET /matches/popular - Popular matches
    if (path === '/matches/popular') {
      const popularMatches = matches
        .filter(m => m.popular || isMatchLive(m))
        .sort((a, b) => {
          const aLive = isMatchLive(a) ? 1 : 0;
          const bLive = isMatchLive(b) ? 1 : 0;
          if (bLive !== aLive) return bLive - aLive;
          return a.date - b.date;
        })
        .slice(0, 50);

      return new Response(JSON.stringify({
        total: popularMatches.length,
        matches: popularMatches.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // GET /matches/upcoming - Upcoming matches
    if (path === '/matches/upcoming') {
      const now = Date.now();
      const upcomingMatches = matches
        .filter(m => m.date * 1000 > now)
        .sort((a, b) => a.date - b.date)
        .slice(0, 100);

      return new Response(JSON.stringify({
        total: upcomingMatches.length,
        matches: upcomingMatches.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // GET /matches/:id - Single match
    const matchIdMatch = path.match(/^\/matches\/([^/]+)$/);
    if (matchIdMatch) {
      const matchId = matchIdMatch[1];
      const match = matches.find(m => m.id === matchId);
      
      if (!match) {
        return new Response(JSON.stringify({ error: 'Match not found' }), { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      // Get detailed stream info for each source
      const detailedStreams = await Promise.all(
        match.sources.map(async (source, index) => {
          const streams = await fetchStreamInfo(source.source, source.id);
          return {
            source: source.source,
            streamId: source.id,
            streamNumber: index + 1,
            embedUrl: `${WESTREAM_API}/embed/${source.source}/${source.id}/1`,
            alternateStreams: streams.map((s: any, i: number) => ({
              quality: s.quality || `Stream ${i + 1}`,
              embedUrl: `${WESTREAM_API}/embed/${source.source}/${source.id}/${i + 1}`,
            })),
          };
        })
      );

      return new Response(JSON.stringify({
        ...transformMatch(match),
        detailedStreams,
      }), { headers: corsHeaders });
    }

    // GET /sports - List all sports
    if (path === '/sports') {
      const sportCounts = new Map<string, { total: number; live: number }>();
      
      for (const match of matches) {
        const current = sportCounts.get(match.category) || { total: 0, live: 0 };
        current.total++;
        if (isMatchLive(match)) current.live++;
        sportCounts.set(match.category, current);
      }

      const sports: ApiSport[] = Array.from(sportCounts.entries())
        .map(([name, counts]) => ({
          name,
          emoji: CATEGORY_EMOJIS[name] || '🏆',
          matchCount: counts.total,
          liveCount: counts.live,
        }))
        .sort((a, b) => {
          const aPriority = SPORT_PRIORITY[a.name] || 99;
          const bPriority = SPORT_PRIORITY[b.name] || 99;
          return aPriority - bPriority;
        });

      return new Response(JSON.stringify({
        total: sports.length,
        sports,
      }), { headers: corsHeaders });
    }

    // GET /sports/:category - Matches by sport
    const sportMatch = path.match(/^\/sports\/([^/]+)$/);
    if (sportMatch) {
      const category = decodeURIComponent(sportMatch[1]);
      const sportMatches = matches
        .filter(m => m.category.toLowerCase() === category.toLowerCase())
        .sort((a, b) => {
          const aLive = isMatchLive(a) ? 1 : 0;
          const bLive = isMatchLive(b) ? 1 : 0;
          if (bLive !== aLive) return bLive - aLive;
          return a.date - b.date;
        });

      return new Response(JSON.stringify({
        category,
        emoji: CATEGORY_EMOJIS[category] || '🏆',
        total: sportMatches.length,
        liveCount: sportMatches.filter(isMatchLive).length,
        matches: sportMatches.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // GET /streams/:source/:id - Get stream details
    const streamMatch = path.match(/^\/streams\/([^/]+)\/([^/]+)$/);
    if (streamMatch) {
      const [, source, id] = streamMatch;
      const streams = await fetchStreamInfo(source, id);
      
      return new Response(JSON.stringify({
        source,
        id,
        embedUrl: `${WESTREAM_API}/embed/${source}/${id}/1`,
        streams: streams.map((s: any, i: number) => ({
          number: i + 1,
          quality: s.quality || `Stream ${i + 1}`,
          embedUrl: `${WESTREAM_API}/embed/${source}/${id}/${i + 1}`,
        })),
      }), { headers: corsHeaders });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      availableEndpoints: ['/matches', '/matches/live', '/matches/popular', '/sports', '/sports/:category', '/streams/:source/:id'],
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
