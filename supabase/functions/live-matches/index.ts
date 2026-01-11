import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THESPORTSDB_API_KEY = Deno.env.get('THESPORTSDB_API_KEY') || '3';
const CDN_CHANNELS_API = 'https://api.cdn-live.tv/api/v1/channels/?user=damitv&plan=vip';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string | null;
  awayScore: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
  league: string;
  sport: string;
  status: string;
  progress: string;
  startTime: string | null;
  channels: MatchChannel[];
  isLive: boolean;
}

interface MatchChannel {
  id: string;
  name: string;
  country: string;
  embedUrl: string;
  logo: string | null;
}

interface CDNChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
}

// Common broadcaster name variations to help matching
const BROADCASTER_ALIASES: Record<string, string[]> = {
  'sky sports': ['sky sport', 'skysports', 'sky'],
  'bt sport': ['btsport', 'bt sports', 'tnt sports'],
  'bein sports': ['bein sport', 'beinsports', 'bein'],
  'espn': ['espn+', 'espn2', 'espn3'],
  'fox sports': ['fox sport', 'foxsports', 'fs1', 'fs2'],
  'dazn': ['dazn1', 'dazn2'],
  'paramount+': ['paramount', 'cbs sports'],
  'peacock': ['nbc sports', 'nbcsn'],
  'tnt sports': ['tnt', 'tbs'],
  'supersport': ['super sport'],
  'star sports': ['star sport', 'hotstar'],
  'sony': ['sony ten', 'sony six', 'sony liv'],
  'eurosport': ['euro sport'],
};

// League to typical broadcasters mapping (for when API doesn't provide broadcaster data)
const LEAGUE_BROADCASTERS: Record<string, string[]> = {
  'english premier league': ['sky sports', 'tnt sports', 'peacock', 'usa network'],
  'premier league': ['sky sports', 'tnt sports', 'peacock', 'usa network'],
  'la liga': ['espn', 'espn+', 'movistar'],
  'serie a': ['paramount+', 'cbs sports', 'sky sport'],
  'bundesliga': ['espn+', 'sky sport', 'dazn'],
  'ligue 1': ['bein sports', 'canal+'],
  'champions league': ['paramount+', 'tnt sports', 'movistar'],
  'europa league': ['paramount+', 'tnt sports'],
  'nba': ['espn', 'tnt', 'nba tv'],
  'nfl': ['espn', 'fox', 'cbs', 'nbc', 'nfl network'],
  'mlb': ['espn', 'fox', 'tbs', 'mlb network'],
  'nhl': ['espn', 'tnt', 'nhl network'],
  'mls': ['apple tv', 'espn', 'fox'],
  'saudi pro league': ['ssc', 'shahid'],
  'turkish super lig': ['bein sports', 'trt spor'],
  'eredivisie': ['espn', 'ziggo sport'],
  'primeira liga': ['sport tv', 'eleven sports'],
  'scottish premiership': ['sky sports', 'paramount+'],
  'fa cup': ['espn', 'espn+'],
  'copa del rey': ['espn', 'espn+'],
  'coppa italia': ['paramount+', 'cbs sports'],
  'dfb pokal': ['espn+'],
  'afc champions league': ['paramount+'],
  'copa libertadores': ['bein sports', 'paramount+'],
  'afcon': ['bein sports', 'supersport', 'canal+'],
  'africa cup': ['bein sports', 'supersport', 'canal+'],
};

// Fetch live scores from TheSportsDB
async function fetchLiveScores(): Promise<any[]> {
  const sports = ['Soccer', 'Basketball', 'American_Football', 'Ice_Hockey', 'Baseball', 'Tennis', 'Cricket', 'Rugby', 'Motorsport'];
  const allScores: any[] = [];

  const fetchPromises = sports.map(async (sport) => {
    try {
      // Try v2 API first (requires paid key)
      const response = await fetch(
        `https://www.thesportsdb.com/api/v2/json/livescore/${sport}`,
        {
          headers: { 'X-API-KEY': THESPORTSDB_API_KEY },
          signal: AbortSignal.timeout(5000),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data?.livescore && Array.isArray(data.livescore)) {
          return data.livescore.map((s: any) => ({
            id: s.idEvent || `${sport}-${Date.now()}-${Math.random()}`,
            homeTeam: s.strHomeTeam || 'Home Team',
            awayTeam: s.strAwayTeam || 'Away Team',
            homeScore: s.intHomeScore,
            awayScore: s.intAwayScore,
            homeBadge: s.strHomeTeamBadge || null,
            awayBadge: s.strAwayTeamBadge || null,
            league: s.strLeague || 'Unknown League',
            sport: sport.toLowerCase().replace('_', ' '),
            status: s.strStatus || 'Live',
            progress: s.strProgress || '',
            startTime: s.strTimestamp || null,
            tvChannel: s.strTVStation || null,
          }));
        }
      }
      
      // Fallback to v1 free API
      const v1Response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/livescore.php?s=${sport}`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (v1Response.ok) {
        const v1Data = await v1Response.json();
        if (v1Data?.events && Array.isArray(v1Data.events)) {
          return v1Data.events.map((s: any) => ({
            id: s.idEvent || `${sport}-${Date.now()}-${Math.random()}`,
            homeTeam: s.strHomeTeam || 'Home Team',
            awayTeam: s.strAwayTeam || 'Away Team',
            homeScore: s.intHomeScore,
            awayScore: s.intAwayScore,
            homeBadge: s.strHomeTeamBadge || null,
            awayBadge: s.strAwayTeamBadge || null,
            league: s.strLeague || 'Unknown League',
            sport: sport.toLowerCase().replace('_', ' '),
            status: s.strStatus || 'Live',
            progress: s.strProgress || '',
            startTime: s.strTimestamp || null,
            tvChannel: s.strTVStation || null,
          }));
        }
      }
      
      return [];
    } catch (e) {
      console.log(`Failed to fetch ${sport} scores:`, e.message);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach(scores => allScores.push(...scores));

  return allScores;
}

// Fetch CDN channels
async function fetchCDNChannels(): Promise<CDNChannel[]> {
  try {
    const response = await fetch(CDN_CHANNELS_API, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) {
      console.error('CDN API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.channels || [];
  } catch (e) {
    console.error('Failed to fetch CDN channels:', e.message);
    return [];
  }
}

// Parse TV broadcasters string into individual channels
function parseBroadcasters(tvStation: string | null): string[] {
  if (!tvStation) return [];
  
  // Split by common delimiters: comma, slash, pipe, "and", parentheses
  const broadcasters = tvStation
    .split(/[,\/\|]|\s+and\s+|\s*\(\s*|\s*\)\s*/i)
    .map(b => b.trim().toLowerCase())
    .filter(b => b.length > 2);
  
  return broadcasters;
}

// Find matching CDN channels for a broadcaster name
function findChannelsForBroadcaster(
  broadcaster: string,
  channels: CDNChannel[]
): CDNChannel[] {
  const broadcasterLower = broadcaster.toLowerCase();
  const matchedChannels: CDNChannel[] = [];
  
  // Get aliases for this broadcaster
  let searchTerms = [broadcasterLower];
  for (const [main, aliases] of Object.entries(BROADCASTER_ALIASES)) {
    if (broadcasterLower.includes(main) || aliases.some(a => broadcasterLower.includes(a))) {
      searchTerms = [main, ...aliases, broadcasterLower];
      break;
    }
  }
  
  // Find channels matching any search term
  for (const channel of channels) {
    const channelName = channel.name.toLowerCase();
    
    for (const term of searchTerms) {
      if (channelName.includes(term) || term.includes(channelName.split(' ')[0])) {
        matchedChannels.push(channel);
        break;
      }
    }
  }
  
  return matchedChannels;
}

// Match live events to appropriate channels based on actual broadcaster data
function matchChannelsToEvent(
  event: any,
  channels: CDNChannel[]
): MatchChannel[] {
  const tvStation = event.tvChannel || '';
  const league = (event.league || '').toLowerCase();
  let broadcasters = parseBroadcasters(tvStation);
  
  // If no broadcaster data from API, use league-based mapping
  if (broadcasters.length === 0) {
    for (const [leagueKey, leagueBroadcasters] of Object.entries(LEAGUE_BROADCASTERS)) {
      if (league.includes(leagueKey)) {
        broadcasters = leagueBroadcasters;
        break;
      }
    }
  }
  
  const matchedChannels: Map<string, MatchChannel> = new Map();
  
  // Find channels for each broadcaster
  for (const broadcaster of broadcasters) {
    const foundChannels = findChannelsForBroadcaster(broadcaster, channels);
    
    for (const ch of foundChannels.slice(0, 2)) { // Max 2 per broadcaster
      const id = `cdn-${ch.code}-${ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      if (!matchedChannels.has(id)) {
        matchedChannels.set(id, {
          id,
          name: ch.name,
          country: ch.code.toUpperCase(),
          embedUrl: ch.url,
          logo: ch.image,
        });
      }
    }
  }
  
  // If we found broadcaster-matched channels, return them
  if (matchedChannels.size > 0) {
    return Array.from(matchedChannels.values()).slice(0, 5);
  }
  
  // No matching channels found
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport');
    const limit = parseInt(url.searchParams.get('limit') || '30');

    console.log('Fetching live matches and CDN channels...');

    // Fetch both in parallel
    const [liveScores, cdnChannels] = await Promise.all([
      fetchLiveScores(),
      fetchCDNChannels(),
    ]);

    console.log(`Got ${liveScores.length} raw events and ${cdnChannels.length} CDN channels`);

    // Filter out finished matches - only show truly live ones
    const FINISHED_STATUSES = [
      'match finished', 'ft', 'finished', 'ended', 'full time', 
      'aet', 'after extra time', 'pen', 'penalties', 
      'postponed', 'cancelled', 'abandoned', 'suspended',
      'not started', 'ns', 'tbd', 'delayed'
    ];
    
    const trulyLiveScores = liveScores.filter(event => {
      const status = (event.status || '').toLowerCase().trim();
      const progress = (event.progress || '').toLowerCase().trim();
      
      // Check if status indicates finished
      if (FINISHED_STATUSES.some(fs => status.includes(fs) || progress.includes(fs))) {
        return false;
      }
      
      // Check for score patterns that indicate finished (like "FT 2-1")
      if (progress.startsWith('ft') || status.startsWith('ft')) {
        return false;
      }
      
      return true;
    });

    console.log(`Filtered to ${trulyLiveScores.length} truly live events`);

    // Filter by sport if specified
    let filteredScores = trulyLiveScores;
    if (sport) {
      filteredScores = trulyLiveScores.filter(s => 
        s.sport.toLowerCase().includes(sport.toLowerCase())
      );
    }

    // Match channels to each live event
    const liveMatches: LiveMatch[] = filteredScores
      .slice(0, limit)
      .map(event => ({
        id: event.id,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
        homeBadge: event.homeBadge,
        awayBadge: event.awayBadge,
        league: event.league,
        sport: event.sport,
        status: event.status,
        progress: event.progress,
        startTime: event.startTime,
        channels: matchChannelsToEvent(event, cdnChannels),
        isLive: true,
      }));

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      totalLive: liveScores.length,
      totalChannels: cdnChannels.length,
      count: liveMatches.length,
      matches: liveMatches,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
