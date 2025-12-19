import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WESTREAM_API = 'https://westream.top';
const SPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/751945';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Initialize Supabase client for viewer counts
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// SPORT CONFIGURATIONS
// ============================================

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

const SPORT_IMAGES: Record<string, string> = {
  'soccer': 'https://www.thesportsdb.com/images/sports/soccer.jpg',
  'football': 'https://www.thesportsdb.com/images/sports/soccer.jpg',
  'basketball': 'https://www.thesportsdb.com/images/sports/basketball.jpg',
  'nba': 'https://www.thesportsdb.com/images/sports/basketball.jpg',
  'american football': 'https://www.thesportsdb.com/images/sports/american_football.jpg',
  'nfl': 'https://www.thesportsdb.com/images/sports/american_football.jpg',
  'baseball': 'https://www.thesportsdb.com/images/sports/baseball.jpg',
  'mlb': 'https://www.thesportsdb.com/images/sports/baseball.jpg',
  'cricket': 'https://www.thesportsdb.com/images/sports/cricket.jpg',
  'tennis': 'https://www.thesportsdb.com/images/sports/tennis.jpg',
  'hockey': 'https://www.thesportsdb.com/images/sports/ice_hockey.jpg',
  'nhl': 'https://www.thesportsdb.com/images/sports/ice_hockey.jpg',
  'rugby': 'https://www.thesportsdb.com/images/sports/rugby.jpg',
  'golf': 'https://www.thesportsdb.com/images/sports/golf.jpg',
  'boxing': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'mma': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'ufc': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'motorsport': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'f1': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'darts': 'https://www.thesportsdb.com/images/sports/darts.jpg',
  'snooker': 'https://www.thesportsdb.com/images/sports/snooker.jpg',
  'volleyball': 'https://www.thesportsdb.com/images/sports/volleyball.jpg',
  'handball': 'https://www.thesportsdb.com/images/sports/handball.jpg',
  'cycling': 'https://www.thesportsdb.com/images/sports/cycling.jpg',
  'esports': 'https://www.thesportsdb.com/images/sports/esports.jpg',
};

// Sport mapping for TheSportsDB livescores
const sportApiMap: Record<string, string> = {
  'football': 'Soccer', 'soccer': 'Soccer',
  'basketball': 'Basketball', 'nba': 'Basketball',
  'hockey': 'Ice Hockey', 'ice hockey': 'Ice Hockey', 'nhl': 'Ice Hockey',
  'nfl': 'American Football', 'american football': 'American Football',
  'baseball': 'Baseball', 'mlb': 'Baseball',
  'rugby': 'Rugby',
  'mma': 'Fighting', 'ufc': 'Fighting', 'boxing': 'Fighting',
  'cricket': 'Cricket',
  'tennis': 'Tennis',
};

// ============================================
// INTERFACES
// ============================================

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
  categoryImage: string | null;
  timestamp: number;
  date: string;
  time: string;
  isLive: boolean;
  isPopular: boolean;
  viewerCount: number;
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
  image: string | null;
  matchCount: number;
  liveCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function getSportImage(sport: string): string | null {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function generateViewerCount(matchId: string, isLive: boolean, isPopular: boolean): number {
  if (!isLive) return 0;
  const hash = matchId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const base = isPopular ? 5000 : 1000;
  const variation = Math.abs(hash % 3000);
  return base + variation;
}

function transformMatch(match: WeStreamMatch): ApiMatch {
  const isLive = isMatchLive(match);
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
    categoryImage: getSportImage(match.category),
    timestamp: match.date,
    date: formatDate(match.date),
    time: formatTime(match.date),
    isLive,
    isPopular: match.popular || false,
    viewerCount: generateViewerCount(match.id, isLive, match.popular),
    teams: match.teams ? {
      home: { name: match.teams.home?.name || 'TBD', logo: match.teams.home?.badge || null },
      away: { name: match.teams.away?.name || 'TBD', logo: match.teams.away?.badge || null },
    } : null,
    streams,
  };
}

// ============================================
// API FETCH FUNCTIONS
// ============================================

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

async function fetchTeamLogo(teamName: string): Promise<any> {
  try {
    const response = await fetch(
      `${SPORTSDB_API}/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.teams?.[0]) {
      const team = data.teams[0];
      return {
        name: team.strTeam,
        badge: team.strBadge || null,
        logo: team.strLogo || null,
        banner: team.strBanner || null,
        jersey: team.strJersey || null,
        stadium: team.strStadium || null,
        stadiumThumb: team.strStadiumThumb || null,
        country: team.strCountry || null,
        league: team.strLeague || null,
        description: team.strDescriptionEN || null,
        website: team.strWebsite || null,
        facebook: team.strFacebook || null,
        twitter: team.strTwitter || null,
        instagram: team.strInstagram || null,
        youtube: team.strYoutube || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchPlayerInfo(playerName: string): Promise<any> {
  try {
    const response = await fetch(
      `${SPORTSDB_API}/searchplayers.php?p=${encodeURIComponent(playerName)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.player?.[0]) {
      const player = data.player[0];
      return {
        name: player.strPlayer,
        team: player.strTeam,
        sport: player.strSport,
        nationality: player.strNationality,
        position: player.strPosition,
        height: player.strHeight,
        weight: player.strWeight,
        birthDate: player.dateBorn,
        thumb: player.strThumb || null,
        cutout: player.strCutout || null,
        render: player.strRender || null,
        banner: player.strBanner || null,
        description: player.strDescriptionEN || null,
        facebook: player.strFacebook || null,
        twitter: player.strTwitter || null,
        instagram: player.strInstagram || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLiveScores(sport: string): Promise<any[]> {
  try {
    const sportsDbSport = sportApiMap[sport.toLowerCase()] || 'Soccer';
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${SPORTSDB_API}/eventsday.php?d=${today}&s=${encodeURIComponent(sportsDbSport)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const events = data.events || [];
    
    return events.map((event: any) => ({
      id: event.idEvent,
      event: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      progress: event.strProgress || event.strStatus,
      timestamp: event.strTimestamp,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
      league: event.strLeague,
      season: event.strSeason,
      homeBadge: event.strHomeTeamBadge || null,
      awayBadge: event.strAwayTeamBadge || null,
      thumb: event.strThumb || null,
      video: event.strVideo || null,
    })).filter((event: any) => {
      const status = (event.status || '').toLowerCase();
      return status.includes('live') || 
             status.includes('progress') || 
             status.includes('1h') || 
             status.includes('2h') ||
             status.includes('ht') ||
             event.homeScore !== null ||
             event.awayScore !== null;
    });
  } catch (error) {
    console.error('Error fetching live scores:', error);
    return [];
  }
}

async function fetchHighlights(date?: string): Promise<any[]> {
  try {
    const d = date || new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${SPORTSDB_API}/eventshighlights.php?d=${d}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.tvhighlights || []).map((h: any) => ({
      id: h.idEvent,
      event: h.strEvent,
      sport: h.strSport,
      league: h.strLeague,
      homeTeam: h.strHomeTeam,
      awayTeam: h.strAwayTeam,
      homeScore: h.intHomeScore,
      awayScore: h.intAwayScore,
      date: h.dateEvent,
      videoUrl: h.strVideo,
      thumb: h.strThumb,
    }));
  } catch {
    return [];
  }
}

async function fetchLeagueInfo(leagueId: number): Promise<any> {
  try {
    const response = await fetch(
      `${SPORTSDB_API}/lookupleague.php?id=${leagueId}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.leagues?.[0]) {
      const league = data.leagues[0];
      return {
        id: league.idLeague,
        name: league.strLeague,
        sport: league.strSport,
        country: league.strCountry,
        badge: league.strBadge || null,
        logo: league.strLogo || null,
        banner: league.strBanner || null,
        trophy: league.strTrophy || null,
        description: league.strDescriptionEN || null,
        website: league.strWebsite || null,
        facebook: league.strFacebook || null,
        twitter: league.strTwitter || null,
        youtube: league.strYoutube || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getViewerCount(matchId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_viewer_count', {
      match_id_param: matchId
    });
    if (error) throw error;
    return data || 0;
  } catch {
    return 0;
  }
}

async function heartbeatViewer(matchId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('heartbeat_viewer', {
      match_id_param: matchId,
      session_id_param: sessionId
    });
    return !error;
  } catch {
    return false;
  }
}

// ============================================
// MAIN SERVER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-matches', '');
  
  console.log(`API Request: ${req.method} ${path}`);

  try {
    // ==========================================
    // API DOCUMENTATION
    // ==========================================
    if (path === '' || path === '/') {
      const baseUrl = `${url.origin}/functions/v1/api-matches`;
      const docs = {
        name: "DamiTV Sports Streaming API",
        version: "2.0.0",
        description: "Complete public API for live sports matches, streams, scores, logos, and more",
        baseUrl,
        endpoints: {
          matches: {
            "/matches": { method: "GET", description: "Get all matches with pagination", params: { limit: "number (default: 100)", offset: "number (default: 0)" }},
            "/matches/live": { method: "GET", description: "Get currently live matches" },
            "/matches/popular": { method: "GET", description: "Get popular/featured matches" },
            "/matches/upcoming": { method: "GET", description: "Get upcoming matches" },
            "/matches/:id": { method: "GET", description: "Get single match with full details and streams" },
          },
          sports: {
            "/sports": { method: "GET", description: "Get all sports categories with counts and images" },
            "/sports/:category": { method: "GET", description: "Get matches for a specific sport" },
          },
          streams: {
            "/streams/:source/:id": { method: "GET", description: "Get all stream URLs for a source" },
            "/embed/:source/:id/:stream": { method: "GET", description: "Get embed URL info" },
          },
          livescores: {
            "/livescores": { method: "GET", description: "Get live scores for all sports" },
            "/livescores/:sport": { method: "GET", description: "Get live scores for specific sport" },
          },
          images: {
            "/team/:name": { method: "GET", description: "Get team logo, badge, banner, jersey" },
            "/player/:name": { method: "GET", description: "Get player photo, cutout, banner" },
            "/league/:id": { method: "GET", description: "Get league badge, logo, trophy" },
          },
          highlights: {
            "/highlights": { method: "GET", description: "Get video highlights", params: { date: "YYYY-MM-DD (optional)" }},
          },
          viewers: {
            "/viewers/:matchId": { method: "GET", description: "Get live viewer count for a match" },
            "/viewers/:matchId/heartbeat": { method: "POST", description: "Send viewer heartbeat", body: { sessionId: "string" }},
          },
          stats: {
            "/stats/team/:name": { method: "GET", description: "Get team statistics from database" },
            "/stats/h2h/:teamA/:teamB": { method: "GET", description: "Get head-to-head stats" },
          },
        },
        examples: {
          getAllMatches: `curl "${baseUrl}/matches"`,
          getLiveMatches: `curl "${baseUrl}/matches/live"`,
          getFootballScores: `curl "${baseUrl}/livescores/football"`,
          getTeamLogo: `curl "${baseUrl}/team/Manchester%20United"`,
          getPlayerInfo: `curl "${baseUrl}/player/Lionel%20Messi"`,
        },
      };
      return new Response(JSON.stringify(docs, null, 2), { headers: corsHeaders });
    }

    // ==========================================
    // MATCHES ENDPOINTS
    // ==========================================
    
    if (path === '/matches') {
      const matches = await fetchAllMatches();
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

    if (path === '/matches/live') {
      const matches = await fetchAllMatches();
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

    if (path === '/matches/popular') {
      const matches = await fetchAllMatches();
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

    if (path === '/matches/upcoming') {
      const matches = await fetchAllMatches();
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

    // Single match by ID
    const matchIdMatch = path.match(/^\/matches\/([^/]+)$/);
    if (matchIdMatch) {
      const matches = await fetchAllMatches();
      const matchId = matchIdMatch[1];
      const match = matches.find(m => m.id === matchId);
      
      if (!match) {
        return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404, headers: corsHeaders });
      }

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

      const viewerCount = await getViewerCount(matchId);

      return new Response(JSON.stringify({
        ...transformMatch(match),
        viewerCount,
        detailedStreams,
      }), { headers: corsHeaders });
    }

    // ==========================================
    // SPORTS ENDPOINTS
    // ==========================================

    if (path === '/sports') {
      const matches = await fetchAllMatches();
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
          image: getSportImage(name),
          matchCount: counts.total,
          liveCount: counts.live,
        }))
        .sort((a, b) => (SPORT_PRIORITY[a.name] || 99) - (SPORT_PRIORITY[b.name] || 99));

      return new Response(JSON.stringify({ total: sports.length, sports }), { headers: corsHeaders });
    }

    const sportMatch = path.match(/^\/sports\/([^/]+)$/);
    if (sportMatch) {
      const matches = await fetchAllMatches();
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
        image: getSportImage(category),
        total: sportMatches.length,
        liveCount: sportMatches.filter(isMatchLive).length,
        matches: sportMatches.map(transformMatch),
      }), { headers: corsHeaders });
    }

    // ==========================================
    // STREAMS ENDPOINTS
    // ==========================================

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

    const embedMatch = path.match(/^\/embed\/([^/]+)\/([^/]+)\/(\d+)$/);
    if (embedMatch) {
      const [, source, id, stream] = embedMatch;
      return new Response(JSON.stringify({
        source,
        id,
        streamNumber: parseInt(stream),
        embedUrl: `${WESTREAM_API}/embed/${source}/${id}/${stream}`,
        iframeSrc: `${WESTREAM_API}/embed/${source}/${id}/${stream}`,
      }), { headers: corsHeaders });
    }

    // ==========================================
    // LIVESCORES ENDPOINTS
    // ==========================================

    if (path === '/livescores') {
      const [football, basketball, tennis, cricket] = await Promise.all([
        fetchLiveScores('football'),
        fetchLiveScores('basketball'),
        fetchLiveScores('tennis'),
        fetchLiveScores('cricket'),
      ]);

      return new Response(JSON.stringify({
        football: { count: football.length, scores: football },
        basketball: { count: basketball.length, scores: basketball },
        tennis: { count: tennis.length, scores: tennis },
        cricket: { count: cricket.length, scores: cricket },
      }), { headers: corsHeaders });
    }

    const livescoresSportMatch = path.match(/^\/livescores\/([^/]+)$/);
    if (livescoresSportMatch) {
      const sport = livescoresSportMatch[1];
      const scores = await fetchLiveScores(sport);
      return new Response(JSON.stringify({
        sport,
        count: scores.length,
        scores,
      }), { headers: corsHeaders });
    }

    // ==========================================
    // IMAGES/LOGOS ENDPOINTS
    // ==========================================

    const teamMatch = path.match(/^\/team\/([^/]+)$/);
    if (teamMatch) {
      const teamName = decodeURIComponent(teamMatch[1]);
      const team = await fetchTeamLogo(teamName);
      if (!team) {
        return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(team), { headers: corsHeaders });
    }

    const playerMatch = path.match(/^\/player\/([^/]+)$/);
    if (playerMatch) {
      const playerName = decodeURIComponent(playerMatch[1]);
      const player = await fetchPlayerInfo(playerName);
      if (!player) {
        return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(player), { headers: corsHeaders });
    }

    const leagueMatch = path.match(/^\/league\/(\d+)$/);
    if (leagueMatch) {
      const leagueId = parseInt(leagueMatch[1]);
      const league = await fetchLeagueInfo(leagueId);
      if (!league) {
        return new Response(JSON.stringify({ error: 'League not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(league), { headers: corsHeaders });
    }

    // ==========================================
    // HIGHLIGHTS ENDPOINT
    // ==========================================

    if (path === '/highlights') {
      const date = url.searchParams.get('date') || undefined;
      const highlights = await fetchHighlights(date);
      return new Response(JSON.stringify({
        date: date || new Date().toISOString().split('T')[0],
        count: highlights.length,
        highlights,
      }), { headers: corsHeaders });
    }

    // ==========================================
    // VIEWERS ENDPOINTS
    // ==========================================

    const viewerMatch = path.match(/^\/viewers\/([^/]+)$/);
    if (viewerMatch && req.method === 'GET') {
      const matchId = viewerMatch[1];
      const count = await getViewerCount(matchId);
      return new Response(JSON.stringify({ matchId, viewerCount: count }), { headers: corsHeaders });
    }

    const heartbeatMatch = path.match(/^\/viewers\/([^/]+)\/heartbeat$/);
    if (heartbeatMatch && req.method === 'POST') {
      const matchId = heartbeatMatch[1];
      const body = await req.json();
      const sessionId = body.sessionId;
      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400, headers: corsHeaders });
      }
      const success = await heartbeatViewer(matchId, sessionId);
      return new Response(JSON.stringify({ success }), { headers: corsHeaders });
    }

    // ==========================================
    // STATS ENDPOINTS
    // ==========================================

    const statsTeamMatch = path.match(/^\/stats\/team\/([^/]+)$/);
    if (statsTeamMatch) {
      const teamName = decodeURIComponent(statsTeamMatch[1]);
      const { data, error } = await supabase
        .from('team_stats')
        .select('*')
        .ilike('team_name', `%${teamName}%`)
        .limit(1)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Team stats not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    const h2hMatch = path.match(/^\/stats\/h2h\/([^/]+)\/([^/]+)$/);
    if (h2hMatch) {
      const teamA = decodeURIComponent(h2hMatch[1]);
      const teamB = decodeURIComponent(h2hMatch[2]);
      const { data, error } = await supabase
        .from('head_to_head_stats')
        .select('*')
        .or(`and(team_a_name.ilike.%${teamA}%,team_b_name.ilike.%${teamB}%),and(team_a_name.ilike.%${teamB}%,team_b_name.ilike.%${teamA}%)`)
        .limit(1)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Head-to-head stats not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    // ==========================================
    // 404 FOR UNKNOWN ROUTES
    // ==========================================

    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      hint: 'Visit / for API documentation',
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
