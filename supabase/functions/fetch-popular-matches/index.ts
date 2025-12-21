import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTS_DB_API_KEY = '751945';
const SPORTS_DB_V2_BASE = 'https://www.thesportsdb.com/api/v2/json';
const WESTREAM_API = 'https://westream.top';
const CDN_LIVE_API = 'https://cdn-live.tv/api/v1/vip/damitv';

// PRIORITY SPORTS (in order of importance)
const PRIORITY_SPORTS = [
  'football', 'soccer',
  'cricket',
  'basketball', 'nba',
  'american-football', 'nfl',
  'mma', 'ufc', 'fighting', 'boxing',
  'motorsport', 'f1', 'motogp', 'racing'
];

// Sport-specific LIVE duration in hours (how long a match can be considered "live")
const SPORT_LIVE_DURATION: Record<string, number> = {
  'football': 2.5,
  'soccer': 2.5,
  'cricket': 6,
  'basketball': 3,
  'nba': 3,
  'american-football': 4,
  'nfl': 4,
  'mma': 5,
  'ufc': 5,
  'fighting': 5,
  'boxing': 4,
  'motorsport': 3,
  'f1': 2.5,
  'motogp': 2,
  'racing': 3,
  'baseball': 4,
  'mlb': 4,
  'rugby': 2,
  'default': 3,
};

// TOP-TIER LEAGUES for priority ranking
const TOP_LEAGUES = [
  "english premier league", "spanish la liga", "german bundesliga", "italian serie a",
  "french ligue 1", "uefa champions league", "uefa europa league", "fa cup",
  "copa del rey", "mls", "major league soccer", "nba", "nfl", "nhl",
  "ipl", "bbl", "psl", "t20", "test", "odi", // Cricket
  "ufc", "bellator", "pfl", // MMA
  "formula 1", "f1", "motogp", "nascar", "indycar", // Motorsport
  "bundesliga", "premier league", "la liga", "serie a", "ligue 1"
];

// Sports to EXCLUDE from results
const EXCLUDED_SPORTS = ['tennis', 'golf', 'hockey', 'ice hockey', 'nhl', 'darts', 'billiards', 'snooker', 'pool', 'other'];

// Sport category normalization
function normalizeSportCategory(category: string): string {
  const cat = category?.toLowerCase().replace(/[^a-z]/g, '') || '';
  
  if (cat.includes('football') || cat.includes('soccer')) return 'football';
  if (cat.includes('cricket')) return 'cricket';
  if (cat.includes('basketball') || cat.includes('nba')) return 'basketball';
  if (cat.includes('american') || cat.includes('nfl')) return 'nfl';
  if (cat.includes('mma') || cat.includes('ufc') || cat.includes('fight') || cat.includes('boxing')) return 'fighting';
  if (cat.includes('motor') || cat.includes('f1') || cat.includes('racing') || cat.includes('motogp')) return 'motorsport';
  if (cat.includes('baseball') || cat.includes('mlb')) return 'baseball';
  if (cat.includes('rugby')) return 'rugby';
  
  return cat;
}

// Check if sport should be excluded
function isExcludedSport(category: string): boolean {
  const cat = category?.toLowerCase() || '';
  return EXCLUDED_SPORTS.some(excluded => cat.includes(excluded));
}

// Check if sport is in priority list
function isPrioritySport(category: string): boolean {
  const normalized = normalizeSportCategory(category);
  return ['football', 'cricket', 'basketball', 'nfl', 'fighting', 'motorsport'].includes(normalized);
}

// Get live duration for a sport in milliseconds
function getLiveDuration(category: string): number {
  const normalized = normalizeSportCategory(category);
  const hours = SPORT_LIVE_DURATION[normalized] || SPORT_LIVE_DURATION['default'];
  return hours * 60 * 60 * 1000;
}

// WeStream types
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
  poster?: string;
}

interface SportsDbLiveMatch {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  strLeague: string;
  strThumb: string | null;
  strPoster: string | null;
  strProgress: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTVStation: string | null; // Broadcaster info
}

// CDN Channel type
interface CDNChannel {
  name: string;
  code: string;
  url: string;
  image: string | null;
  viewers: number;
}

// Extended source with name and image for CDN channels
interface MatchSource {
  source: string;
  id: string;
  name?: string;
  image?: string;
  isCdn?: boolean; // Flag to identify CDN sources
}

interface EnrichedMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  popular: boolean;
  teams: {
    home: { name: string; badge?: string };
    away: { name: string; badge?: string };
  };
  sources: MatchSource[];
  poster?: string;
  tournament?: string;
  isLive: boolean;
  score?: { home?: string; away?: string };
  progress?: string;
  priority: number;
  broadcaster?: string; // From SportsDB strTVStation
}

// Convert CDN channels to MatchSource format
function cdnChannelsToSources(channels: CDNChannel[]): MatchSource[] {
  return channels.map((ch, idx) => ({
    source: 'cdn',
    id: ch.url, // URL is the stream ID for CDN channels
    name: ch.name,
    image: ch.image || undefined,
    isCdn: true,
  }));
}

// Cache for WeStream and SportsDB data
let weStreamCache: { data: WeStreamMatch[]; timestamp: number } | null = null;
let sportsDbCache: { data: SportsDbLiveMatch[]; timestamp: number } | null = null;
let cdnChannelsCache: { data: CDNChannel[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache for faster responses
const CDN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for channels

// Broadcaster to CDN channel keyword mapping
const BROADCASTER_CHANNEL_MAP: Record<string, string[]> = {
  'espn': ['espn'],
  'sky sports': ['sky sport'],
  'bt sport': ['bt sport'],
  'bein sports': ['bein'],
  'dazn': ['dazn'],
  'nbc': ['nbc', 'peacock'],
  'cbs': ['cbs sport', 'paramount'],
  'fox': ['fox sport', 'fox'],
  'tnt': ['tnt'],
  'abc': ['abc'],
  'star sports': ['star sport'],
  'sony sports': ['sony sport'],
  'willow': ['willow'],
  'supersport': ['super sport'],
  'peacock': ['peacock'],
  'amazon prime': ['prime'],
  'paramount+': ['paramount', 'cbs'],
  'optus sport': ['optus'],
  'tsn': ['tsn'],
  'sportsnet': ['sportsnet'],
  'canal+': ['canal'],
  'movistar': ['movistar'],
  'eleven sports': ['eleven'],
};

// Common sports channels (fallback static list when API unavailable)
const COMMON_SPORTS_CHANNELS: CDNChannel[] = [
  { name: 'ESPN', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=espn&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/espn.svg', viewers: 50 },
  { name: 'ESPN 2', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=espn+2&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/espn-2.svg', viewers: 10 },
  { name: 'Sky Sports Main Event', code: 'gb', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=sky+sports+main+event&code=gb', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-kingdom/sky-sports-main.svg', viewers: 30 },
  { name: 'Sky Sports Premier League', code: 'gb', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=sky+sports+premier+league&code=gb', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-kingdom/sky-sports-pl.svg', viewers: 40 },
  { name: 'BT Sport 1', code: 'gb', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=bt+sport+1&code=gb', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-kingdom/bt-sport-1.svg', viewers: 20 },
  { name: 'BT Sport 2', code: 'gb', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=bt+sport+2&code=gb', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-kingdom/bt-sport-2.svg', viewers: 15 },
  { name: 'TNT', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=tnt&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/tnt.png', viewers: 25 },
  { name: 'NBC', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=nbc&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/nbc.png', viewers: 20 },
  { name: 'FOX Sports 1', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=fox+sports+1&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/fox-sport-1.svg', viewers: 15 },
  { name: 'CBS Sports Network', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=cbs+sports+network&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/cbs-sports-network.svg', viewers: 10 },
  { name: 'beIN SPORTS', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=bein+sports&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/bein-sports.webp', viewers: 20 },
  { name: 'DAZN 1', code: 'gb', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=dazn+1&code=gb', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-kingdom/dazn-1.png', viewers: 25 },
  { name: 'Star Sports 1', code: 'in', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=star+sports+1&code=in', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/india/star-sports-1.svg', viewers: 30 },
  { name: 'Willow Cricket', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=willow+cricket&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/willow-cricket-1.svg', viewers: 15 },
  { name: 'Peacock Event 1', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=peacock+event+1&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/peacock.png', viewers: 10 },
  { name: 'NBA TV', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=nba+tv&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/nba-tv.svg', viewers: 20 },
  { name: 'NFL Network', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=nfl+network&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/nfl-network.svg', viewers: 25 },
  { name: 'ABC', code: 'us', url: 'https://cdn-live.tv/api/v1/vip/damitv/channels/player/?name=abc&code=us', image: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/abc.png', viewers: 15 },
];

// Fetch CDN channels - try API first, fallback to static list
async function fetchCDNChannels(): Promise<CDNChannel[]> {
  if (cdnChannelsCache && Date.now() - cdnChannelsCache.timestamp < CDN_CACHE_DURATION) {
    console.log('Using cached CDN channels');
    return cdnChannelsCache.data;
  }

  try {
    const response = await fetch(`${CDN_LIVE_API}/channels/`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      const channels: CDNChannel[] = Array.isArray(data) ? data : data.channels || [];
      if (channels.length > 0) {
        cdnChannelsCache = { data: channels, timestamp: Date.now() };
        console.log(`Fetched ${channels.length} CDN channels from API`);
        return channels;
      }
    }
  } catch (error) {
    console.log('CDN API unavailable, using static list');
  }
  
  // Fallback to static list
  cdnChannelsCache = { data: COMMON_SPORTS_CHANNELS, timestamp: Date.now() };
  console.log(`Using ${COMMON_SPORTS_CHANNELS.length} static CDN channels`);
  return COMMON_SPORTS_CHANNELS;
}

// Match broadcaster to CDN channels
function matchBroadcasterToChannels(broadcaster: string | null, allChannels: CDNChannel[], category: string): CDNChannel[] {
  if (!broadcaster || allChannels.length === 0) return [];
  
  const broadcasterLower = broadcaster.toLowerCase();
  const matchedChannels: CDNChannel[] = [];
  
  // Find matching keywords for this broadcaster
  for (const [broadcasterKey, keywords] of Object.entries(BROADCASTER_CHANNEL_MAP)) {
    if (broadcasterLower.includes(broadcasterKey)) {
      // Find channels matching these keywords
      for (const channel of allChannels) {
        const channelName = channel.name.toLowerCase();
        if (keywords.some(kw => channelName.includes(kw))) {
          if (!matchedChannels.find(c => c.name === channel.name)) {
            matchedChannels.push(channel);
          }
        }
      }
    }
  }
  
  // Also try direct name match
  for (const channel of allChannels) {
    const channelName = channel.name.toLowerCase();
    if (broadcasterLower.includes(channelName) || channelName.includes(broadcasterLower.split(' ')[0])) {
      if (!matchedChannels.find(c => c.name === channel.name)) {
        matchedChannels.push(channel);
      }
    }
  }
  
  // Sort by viewers (most popular first) and limit to 3
  return matchedChannels
    .sort((a, b) => (b.viewers || 0) - (a.viewers || 0))
    .slice(0, 3);
}

// Fetch all matches from WeStream API (PRIMARY SOURCE)
async function fetchWeStreamMatches(): Promise<WeStreamMatch[]> {
  if (weStreamCache && Date.now() - weStreamCache.timestamp < CACHE_DURATION) {
    console.log('Using cached WeStream matches');
    return weStreamCache.data;
  }

  try {
    const response = await fetch(`${WESTREAM_API}/matches`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      const matches: WeStreamMatch[] = Array.isArray(data) ? data : [];
      weStreamCache = { data: matches, timestamp: Date.now() };
      console.log(`Fetched ${matches.length} matches from WeStream`);
      return matches;
    }
  } catch (error) {
    console.error('Error fetching WeStream matches:', error);
  }
  return weStreamCache?.data || [];
}

// Fetch live matches from SportsDB for enrichment
async function fetchSportsDbLiveMatches(): Promise<SportsDbLiveMatch[]> {
  if (sportsDbCache && Date.now() - sportsDbCache.timestamp < CACHE_DURATION) {
    console.log('Using cached SportsDB live matches');
    return sportsDbCache.data;
  }

  // Focus on priority sports
  const endpoints = ['soccer', 'basketball', 'nfl', 'cricket', 'mma'];
  const allLiveMatches: SportsDbLiveMatch[] = [];

  try {
    const promises = endpoints.map(async (sport) => {
      try {
        const response = await fetch(`${SPORTS_DB_V2_BASE}/livescore/${sport}`, {
          headers: { 'X-API-KEY': SPORTS_DB_API_KEY },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data?.livescore || data?.events || [];
        }
      } catch (e) {
        console.log(`Failed to fetch ${sport} from SportsDB`);
      }
      return [];
    });

    const results = await Promise.all(promises);
    results.forEach(matches => allLiveMatches.push(...matches));
    
    sportsDbCache = { data: allLiveMatches, timestamp: Date.now() };
    console.log(`Fetched ${allLiveMatches.length} live matches from SportsDB`);
  } catch (error) {
    console.error('Error fetching SportsDB matches:', error);
  }

  return sportsDbCache?.data || [];
}

// Normalize team name for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(fc|sc|cf|afc|united|city|club|the|de|la|los|las|el|real|sporting|athletic|atletico|inter|ac|as|ss|us|fk|sk|bk|if|gk)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get keywords from team name
function getTeamKeywords(name: string): string[] {
  return normalizeTeamName(name).split(' ').filter(w => w.length >= 3);
}

// Find SportsDB match for enrichment
function findSportsDbMatch(weStreamMatch: WeStreamMatch, sportsDbMatches: SportsDbLiveMatch[]): SportsDbLiveMatch | null {
  const homeTeam = weStreamMatch.teams?.home?.name || '';
  const awayTeam = weStreamMatch.teams?.away?.name || '';
  
  if (!homeTeam || !awayTeam) return null;
  
  const homeKeywords = getTeamKeywords(homeTeam);
  const awayKeywords = getTeamKeywords(awayTeam);
  
  let bestMatch: SportsDbLiveMatch | null = null;
  let bestScore = 0;
  
  for (const match of sportsDbMatches) {
    const sdbHomeKeywords = getTeamKeywords(match.strHomeTeam || '');
    const sdbAwayKeywords = getTeamKeywords(match.strAwayTeam || '');
    
    let score = 0;
    
    for (const keyword of homeKeywords) {
      if (sdbHomeKeywords.some(k => k.includes(keyword) || keyword.includes(k))) score += 2;
      if (sdbAwayKeywords.some(k => k.includes(keyword) || keyword.includes(k))) score += 1;
    }
    for (const keyword of awayKeywords) {
      if (sdbAwayKeywords.some(k => k.includes(keyword) || keyword.includes(k))) score += 2;
      if (sdbHomeKeywords.some(k => k.includes(keyword) || keyword.includes(k))) score += 1;
    }
    
    if (score > bestScore && score >= 4) {
      bestScore = score;
      bestMatch = match;
    }
  }
  
  return bestMatch;
}

// Check if match is currently live based on sport-specific duration
function isMatchLive(match: WeStreamMatch): boolean {
  const now = Date.now();
  const matchStart = match.date;
  const liveDuration = getLiveDuration(match.category);
  const matchEnd = matchStart + liveDuration;
  
  return now >= matchStart && now <= matchEnd;
}

// Check if match has valid team names
function hasValidTeamNames(match: WeStreamMatch): boolean {
  const homeTeam = match.teams?.home?.name?.trim() || '';
  const awayTeam = match.teams?.away?.name?.trim() || '';
  
  // Must have both team names with at least 2 characters each
  if (homeTeam.length < 2 || awayTeam.length < 2) return false;
  
  // Filter out placeholder names
  const invalidNames = ['tbd', 'tba', 'unknown', 'n/a', 'winner', 'loser', 'team 1', 'team 2', 'player 1', 'player 2'];
  const homeLower = homeTeam.toLowerCase();
  const awayLower = awayTeam.toLowerCase();
  
  if (invalidNames.some(inv => homeLower === inv || awayLower === inv)) return false;
  
  return true;
}

// Calculate match priority
function calculatePriority(match: WeStreamMatch, sportsDbMatch: SportsDbLiveMatch | null, isLive: boolean): number {
  let priority = 0;
  
  // Live matches get highest priority
  if (isLive) priority += 25;
  
  // Priority sports bonus
  if (isPrioritySport(match.category)) priority += 15;
  
  // WeStream popular flag
  if (match.popular) priority += 10;
  
  // Has SportsDB match (recognized event)
  if (sportsDbMatch) priority += 8;
  
  // Top league bonus
  const league = sportsDbMatch?.strLeague?.toLowerCase() || '';
  if (TOP_LEAGUES.some(tl => league.includes(tl))) priority += 5;
  
  // Has poster
  if (sportsDbMatch?.strThumb || sportsDbMatch?.strPoster || match.poster) priority += 3;
  
  // Multiple stream sources
  if (match.sources.length >= 3) priority += 2;
  
  return priority;
}

// Main cache
let responseCache: { data: EnrichedMatch[]; timestamp: number } | null = null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check response cache
    if (responseCache && Date.now() - responseCache.timestamp < CACHE_DURATION) {
      console.log('Returning cached response');
      return new Response(
        JSON.stringify({ 
          matches: responseCache.data,
          total: responseCache.data.length,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching popular matches (priority sports focus)...');
    
    // Fetch all sources in parallel (including CDN channels)
    const [weStreamMatches, sportsDbMatches, cdnChannels] = await Promise.all([
      fetchWeStreamMatches(),
      fetchSportsDbLiveMatches(),
      fetchCDNChannels(),
    ]);

    console.log(`CDN channels available: ${cdnChannels.length}`);

    console.log(`Processing ${weStreamMatches.length} WeStream matches`);

    const now = Date.now();
    const enrichedMatches: EnrichedMatch[] = [];
    
    for (const wsMatch of weStreamMatches) {
      // FILTER 1: Must have stream sources
      if (!wsMatch.sources || wsMatch.sources.length === 0) {
        continue;
      }
      
      // FILTER 2: Must have valid team names
      if (!hasValidTeamNames(wsMatch)) {
        console.log(`Skipping match without valid team names: ${wsMatch.title}`);
        continue;
      }
      
      // FILTER 2.5: Skip excluded sports (tennis, golf, hockey, darts, billiards, other)
      if (isExcludedSport(wsMatch.category)) {
        continue;
      }
      
      // FILTER 3: Check if match is within valid time window
      const liveDuration = getLiveDuration(wsMatch.category);
      const matchEnd = wsMatch.date + liveDuration;
      
      // Skip if match ended more than 1 hour ago
      if (now > matchEnd + (60 * 60 * 1000)) {
        continue;
      }
      
      // Skip if match is more than 24 hours in the future
      if (wsMatch.date > now + (24 * 60 * 60 * 1000)) {
        continue;
      }
      
      // Find matching SportsDB event for enrichment
      const sdbMatch = findSportsDbMatch(wsMatch, sportsDbMatches);
      
      // A match is live ONLY if:
      // 1. It's within the live window based on start time + sport duration
      // 2. OR if SportsDB explicitly has live progress (not finished)
      const sdbProgress = sdbMatch?.strProgress?.toLowerCase() || '';
      const isSdbLive = sdbProgress && 
        !sdbProgress.includes('ft') && 
        !sdbProgress.includes('finished') && 
        !sdbProgress.includes('ended') &&
        !sdbProgress.includes('postponed') &&
        sdbProgress !== '';
      const isLive = isMatchLive(wsMatch) && (isSdbLive || !sdbMatch);
      
      // Merge WeStream sources (priority 1) with CDN channel sources (backup)
      const matchedCdnChannels = matchBroadcasterToChannels(sdbMatch?.strTVStation || null, cdnChannels, wsMatch.category);
      const cdnSources = cdnChannelsToSources(matchedCdnChannels);
      const allSources: MatchSource[] = [
        ...wsMatch.sources.map(s => ({ ...s, isCdn: false })), // WeStream first (priority)
        ...cdnSources, // CDN channels as backup
      ];
      
      // Build enriched match
      const enrichedMatch: EnrichedMatch = {
        id: wsMatch.id,
        title: wsMatch.title,
        category: wsMatch.category,
        date: wsMatch.date,
        popular: wsMatch.popular || !!sdbMatch,
        teams: {
          home: {
            name: wsMatch.teams?.home?.name || 'TBD',
            badge: sdbMatch?.strHomeTeamBadge || wsMatch.teams?.home?.badge,
          },
          away: {
            name: wsMatch.teams?.away?.name || 'TBD',
            badge: sdbMatch?.strAwayTeamBadge || wsMatch.teams?.away?.badge,
          },
        },
        sources: allSources,
        poster: sdbMatch?.strThumb || sdbMatch?.strPoster || wsMatch.poster,
        tournament: sdbMatch?.strLeague,
        isLive,
        progress: sdbMatch?.strProgress || undefined,
        priority: calculatePriority(wsMatch, sdbMatch, isLive),
        broadcaster: sdbMatch?.strTVStation || undefined,
      };
      
      // Add live score if available
      if (sdbMatch?.intHomeScore != null && sdbMatch?.intAwayScore != null) {
        enrichedMatch.score = {
          home: sdbMatch.intHomeScore,
          away: sdbMatch.intAwayScore,
        };
      }
      
      enrichedMatches.push(enrichedMatch);
    }

    // Sort by priority (highest first), then by date (soonest first)
    enrichedMatches.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.date - b.date;
    });

    // Return more matches for a complete experience
    const topMatches = enrichedMatches.slice(0, 50);
    
    // Cache result
    responseCache = { data: topMatches, timestamp: Date.now() };
    
    const liveCount = topMatches.filter(m => m.isLive).length;
    const prioritySportCount = topMatches.filter(m => isPrioritySport(m.category)).length;
    
    console.log(`Returning ${topMatches.length} matches (${liveCount} live, ${prioritySportCount} priority sports)`);
    
    return new Response(
      JSON.stringify({ 
        matches: topMatches,
        liveCount,
        prioritySportCount,
        total: topMatches.length,
        fetchedAt: new Date().toISOString(),
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching popular matches:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch matches', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
