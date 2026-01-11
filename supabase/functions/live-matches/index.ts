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

// Sport to channel keyword mapping for intelligent matching
const SPORT_CHANNEL_KEYWORDS: Record<string, string[]> = {
  'soccer': ['sport', 'football', 'espn', 'sky', 'bein', 'dazn', 'premier', 'la liga', 'serie', 'bundesliga', 'fox', 'bt sport', 'supersport'],
  'football': ['sport', 'football', 'espn', 'sky', 'bein', 'dazn', 'premier', 'la liga', 'serie', 'bundesliga', 'fox', 'bt sport', 'supersport'],
  'basketball': ['sport', 'espn', 'nba', 'tnt', 'sky', 'bein', 'fox'],
  'american football': ['espn', 'nfl', 'fox', 'cbs', 'nbc', 'abc'],
  'baseball': ['espn', 'mlb', 'fox', 'tbs'],
  'ice hockey': ['espn', 'nhl', 'tnt', 'nbc'],
  'tennis': ['sport', 'tennis', 'espn', 'eurosport', 'sky'],
  'cricket': ['sport', 'cricket', 'sky', 'star', 'willow', 'supersport'],
  'rugby': ['sport', 'rugby', 'sky', 'bt sport', 'supersport'],
  'motorsport': ['sport', 'f1', 'sky', 'espn', 'fox'],
  'boxing': ['sport', 'espn', 'showtime', 'dazn', 'sky', 'bt sport'],
  'mma': ['sport', 'espn', 'bt sport', 'ufc'],
};

// Country to channel country code mapping
const LEAGUE_COUNTRY_HINTS: Record<string, string[]> = {
  'english premier league': ['gb', 'uk', 'us'],
  'la liga': ['es', 'us'],
  'serie a': ['it', 'us'],
  'bundesliga': ['de', 'us'],
  'ligue 1': ['fr', 'us'],
  'champions league': ['gb', 'uk', 'us', 'es', 'de', 'fr', 'it'],
  'europa league': ['gb', 'uk', 'us', 'es', 'de', 'fr', 'it'],
  'nba': ['us'],
  'nfl': ['us'],
  'mlb': ['us'],
  'nhl': ['us', 'ca'],
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

// Match live events to appropriate channels
function matchChannelsToEvent(
  event: any,
  channels: CDNChannel[]
): MatchChannel[] {
  const sport = event.sport?.toLowerCase() || 'soccer';
  const league = event.league?.toLowerCase() || '';
  const tvChannel = event.tvChannel?.toLowerCase() || '';
  
  // Get keywords for this sport
  const sportKeywords = SPORT_CHANNEL_KEYWORDS[sport] || SPORT_CHANNEL_KEYWORDS['soccer'];
  
  // Get country hints for this league
  let countryHints: string[] = [];
  for (const [leagueKey, countries] of Object.entries(LEAGUE_COUNTRY_HINTS)) {
    if (league.includes(leagueKey)) {
      countryHints = countries;
      break;
    }
  }

  // Score channels based on relevance
  const scoredChannels = channels.map(channel => {
    let score = 0;
    const channelName = channel.name.toLowerCase();
    const channelCode = channel.code.toLowerCase();
    
    // Exact TV channel match (highest priority)
    if (tvChannel && channelName.includes(tvChannel)) {
      score += 100;
    }
    
    // Sport keyword matches
    for (const keyword of sportKeywords) {
      if (channelName.includes(keyword)) {
        score += 10;
      }
    }
    
    // Country code match
    if (countryHints.includes(channelCode)) {
      score += 5;
    }
    
    // Boost for "sport" channels
    if (channelName.includes('sport')) {
      score += 3;
    }
    
    return { channel, score };
  });

  // Sort by score and take top matches
  const topChannels = scoredChannels
    .filter(sc => sc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(sc => ({
      id: `cdn-${sc.channel.code}-${sc.channel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: sc.channel.name,
      country: sc.channel.code.toUpperCase(),
      embedUrl: sc.channel.url,
      logo: sc.channel.image,
    }));

  // If no matches found, return popular sports channels
  if (topChannels.length === 0) {
    const fallbackKeywords = ['sport', 'espn', 'sky', 'bein', 'fox'];
    const fallbackChannels = channels
      .filter(ch => fallbackKeywords.some(kw => ch.name.toLowerCase().includes(kw)))
      .slice(0, 4)
      .map(ch => ({
        id: `cdn-${ch.code}-${ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: ch.name,
        country: ch.code.toUpperCase(),
        embedUrl: ch.url,
        logo: ch.image,
      }));
    
    return fallbackChannels;
  }

  return topChannels;
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
