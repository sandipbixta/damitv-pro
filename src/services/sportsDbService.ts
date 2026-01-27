// TheSportsDB API Service for enriching match previews with real data
// Falls back to Perplexity AI when TheSportsDB doesn't have data
import { getTeamInfoFromAI, getMatchContextFromAI, AITeamInfo, AIMatchContext } from './perplexityService';

const API_KEY = '751945';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

// Cache durations
const CACHE_DURATION_TEAM = 24 * 60 * 60 * 1000; // 24 hours for team info (rarely changes)
const CACHE_DURATION_MATCHES = 2 * 60 * 60 * 1000; // 2 hours for recent matches
const CACHE_DURATION_STANDINGS = 4 * 60 * 60 * 1000; // 4 hours for standings

// Memory cache for current session
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

// Get from localStorage with expiry check
const getLocalCache = (key: string, maxAge: number) => {
  try {
    const stored = localStorage.getItem(`sportsdb_${key}`);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < maxAge) {
        // Also store in memory for faster access
        memoryCache[key] = { data, timestamp };
        return data;
      }
      // Expired, remove it
      localStorage.removeItem(`sportsdb_${key}`);
    }
  } catch (e) {
    // localStorage not available or parse error
  }
  return null;
};

// Set to both memory and localStorage
const setCache = (key: string, data: any) => {
  const cacheData = { data, timestamp: Date.now() };
  memoryCache[key] = cacheData;

  try {
    localStorage.setItem(`sportsdb_${key}`, JSON.stringify(cacheData));
  } catch (e) {
    // localStorage full or not available - memory cache still works
    console.log('localStorage cache failed, using memory only');
  }
};

// Get cached data (memory first, then localStorage)
const getCached = (key: string, maxAge: number) => {
  // Check memory cache first (fastest)
  const memCached = memoryCache[key];
  if (memCached && Date.now() - memCached.timestamp < maxAge) {
    return memCached.data;
  }

  // Fall back to localStorage
  return getLocalCache(key, maxAge);
};

// Sport name mappings for TheSportsDB
const sportMappings: Record<string, string> = {
  'cricket': 'Cricket',
  'football': 'Soccer',
  'soccer': 'Soccer',
  'basketball': 'Basketball',
  'tennis': 'Tennis',
  'hockey': 'Ice Hockey',
  'baseball': 'Baseball',
  'rugby': 'Rugby',
  'mma': 'Fighting',
  'boxing': 'Fighting'
};

// Search for a team by name and sport
export const searchTeam = async (teamName: string, sport?: string): Promise<TeamInfo | null> => {
  const sportKey = sport?.toLowerCase() || '';
  const cacheKey = `team_${teamName.toLowerCase().replace(/\s+/g, '_')}_${sportKey}`;
  const cached = getCached(cacheKey, CACHE_DURATION_TEAM);
  if (cached) {
    console.log(`📦 Cache hit: ${teamName} (${sport || 'any sport'})`);
    return cached;
  }
  console.log(`🌐 API call: searching team ${teamName} (${sport || 'any sport'})`);

  try {
    // For cricket, append "Cricket" to get the right team
    let searchQuery = teamName;
    if (sportKey === 'cricket' && !teamName.toLowerCase().includes('cricket')) {
      // Try searching with sport suffix first for national teams
      searchQuery = `${teamName} Cricket`;
    }

    const response = await fetch(`${BASE_URL}/${API_KEY}/searchteams.php?t=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();

    if (data.teams && data.teams.length > 0) {
      // Filter by sport if specified
      const targetSport = sportMappings[sportKey] || '';
      let matchingTeam = data.teams[0];

      if (targetSport) {
        // Try to find a team matching the sport
        const sportMatch = data.teams.find((t: any) =>
          t.strSport?.toLowerCase() === targetSport.toLowerCase()
        );
        if (sportMatch) {
          matchingTeam = sportMatch;
        }
      }

      const result: TeamInfo = {
        id: matchingTeam.idTeam,
        name: matchingTeam.strTeam,
        shortName: matchingTeam.strTeamShort,
        description: matchingTeam.strDescriptionEN,
        stadium: matchingTeam.strStadium,
        stadiumCapacity: matchingTeam.intStadiumCapacity,
        formedYear: matchingTeam.intFormedYear,
        league: matchingTeam.strLeague,
        country: matchingTeam.strCountry,
        badge: matchingTeam.strBadge,
        fanart: matchingTeam.strTeamFanart1,
        website: matchingTeam.strWebsite,
        facebook: matchingTeam.strFacebook,
        twitter: matchingTeam.strTwitter,
        instagram: matchingTeam.strInstagram
      };
      setCache(cacheKey, result);
      return result;
    }

    // If cricket search with suffix failed, try original name
    if (searchQuery !== teamName) {
      console.log(`🌐 Retrying search with original name: ${teamName}`);
      const response2 = await fetch(`${BASE_URL}/${API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`);
      const data2 = await response2.json();

      if (data2.teams && data2.teams.length > 0) {
        const targetSport = sportMappings[sportKey] || '';
        let matchingTeam = data2.teams.find((t: any) =>
          t.strSport?.toLowerCase() === targetSport.toLowerCase()
        ) || data2.teams[0];

        const result: TeamInfo = {
          id: matchingTeam.idTeam,
          name: matchingTeam.strTeam,
          shortName: matchingTeam.strTeamShort,
          description: matchingTeam.strDescriptionEN,
          stadium: matchingTeam.strStadium,
          stadiumCapacity: matchingTeam.intStadiumCapacity,
          formedYear: matchingTeam.intFormedYear,
          league: matchingTeam.strLeague,
          country: matchingTeam.strCountry,
          badge: matchingTeam.strBadge,
          fanart: matchingTeam.strTeamFanart1,
          website: matchingTeam.strWebsite,
          facebook: matchingTeam.strFacebook,
          twitter: matchingTeam.strTwitter,
          instagram: matchingTeam.strInstagram
        };
        setCache(cacheKey, result);
        return result;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
};

// Get last 5 matches for a team
export const getTeamLastMatches = async (teamId: string): Promise<MatchResult[]> => {
  const cacheKey = `lastmatches_${teamId}`;
  const cached = getCached(cacheKey, CACHE_DURATION_MATCHES);
  if (cached) {
    console.log(`📦 Cache hit: last matches for team ${teamId}`);
    return cached;
  }
  console.log(`🌐 API call: fetching last matches for team ${teamId}`);

  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/eventslast.php?id=${teamId}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const results: MatchResult[] = data.results.slice(0, 5).map((event: any) => ({
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeScore: parseInt(event.intHomeScore) || 0,
        awayScore: parseInt(event.intAwayScore) || 0,
        date: event.dateEvent,
        competition: event.strLeague,
        venue: event.strVenue
      }));
      setCache(cacheKey, results);
      return results;
    }
    return [];
  } catch (error) {
    console.error('Error fetching last matches:', error);
    return [];
  }
};

// Get league standings
export const getLeagueStandings = async (leagueId: string, season: string = '2024-2025'): Promise<Standing[]> => {
  const cacheKey = `standings_${leagueId}_${season}`;
  const cached = getCached(cacheKey, CACHE_DURATION_STANDINGS);
  if (cached) {
    console.log(`📦 Cache hit: standings for league ${leagueId}`);
    return cached;
  }
  console.log(`🌐 API call: fetching standings for league ${leagueId}`);

  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/lookuptable.php?l=${leagueId}&s=${season}`);
    const data = await response.json();

    if (data.table && data.table.length > 0) {
      const standings: Standing[] = data.table.map((team: any) => ({
        position: parseInt(team.intRank),
        teamName: team.strTeam,
        teamId: team.idTeam,
        played: parseInt(team.intPlayed) || 0,
        wins: parseInt(team.intWin) || 0,
        draws: parseInt(team.intDraw) || 0,
        losses: parseInt(team.intLoss) || 0,
        goalsFor: parseInt(team.intGoalsFor) || 0,
        goalsAgainst: parseInt(team.intGoalsAgainst) || 0,
        goalDifference: parseInt(team.intGoalDifference) || 0,
        points: parseInt(team.intPoints) || 0,
        form: team.strForm || ''
      }));
      setCache(cacheKey, standings);
      return standings;
    }
    return [];
  } catch (error) {
    console.error('Error fetching standings:', error);
    return [];
  }
};

// Get enriched data for a match preview
// Uses TheSportsDB first, falls back to Perplexity AI for missing data
export const getMatchPreviewData = async (
  homeTeamName: string,
  awayTeamName: string,
  sport: string = 'football',
  competition?: string
): Promise<MatchPreviewData> => {
  // Check cache for the full preview data first (include sport in key)
  const previewCacheKey = `preview_${sport}_${homeTeamName.toLowerCase()}_vs_${awayTeamName.toLowerCase()}`.replace(/\s+/g, '_');
  const cachedPreview = getCached(previewCacheKey, CACHE_DURATION_MATCHES);
  if (cachedPreview) {
    console.log(`📦 Cache hit: full preview for ${homeTeamName} vs ${awayTeamName}`);
    return cachedPreview;
  }

  console.log(`🔄 Building preview data for ${homeTeamName} vs ${awayTeamName} (${sport})`);

  // Step 1: Try TheSportsDB first (pass sport to get correct team type)
  const [homeTeam, awayTeam] = await Promise.all([
    searchTeam(homeTeamName, sport),
    searchTeam(awayTeamName, sport)
  ]);

  let homeLastMatches: MatchResult[] = [];
  let awayLastMatches: MatchResult[] = [];
  let homeStanding: Standing | null = null;
  let awayStanding: Standing | null = null;

  // Get last matches if teams found in TheSportsDB
  if (homeTeam?.id) {
    homeLastMatches = await getTeamLastMatches(homeTeam.id);
  }
  if (awayTeam?.id) {
    awayLastMatches = await getTeamLastMatches(awayTeam.id);
  }

  // Step 2: Check if we need AI fallback (no data from TheSportsDB)
  const needsAIFallback = !homeTeam && !awayTeam;
  const homeNeedsAI = !homeTeam || homeLastMatches.length === 0;
  const awayNeedsAI = !awayTeam || awayLastMatches.length === 0;

  let aiMatchContext: AIMatchContext | null = null;
  let homeAIInfo: AITeamInfo | null = null;
  let awayAIInfo: AITeamInfo | null = null;

  // Use Perplexity AI for missing data
  if (needsAIFallback || (homeNeedsAI && awayNeedsAI)) {
    console.log(`🤖 Using Perplexity AI fallback for ${homeTeamName} vs ${awayTeamName}`);

    // Get full match context from AI (includes both teams + h2h)
    aiMatchContext = await getMatchContextFromAI(homeTeamName, awayTeamName, sport, competition);
  } else {
    // Get individual team info from AI only for teams not found
    const aiPromises: Promise<any>[] = [];

    if (homeNeedsAI) {
      aiPromises.push(getTeamInfoFromAI(homeTeamName, sport).then(info => { homeAIInfo = info; }));
    }
    if (awayNeedsAI) {
      aiPromises.push(getTeamInfoFromAI(awayTeamName, sport).then(info => { awayAIInfo = info; }));
    }

    if (aiPromises.length > 0) {
      await Promise.all(aiPromises);
    }
  }

  // Calculate head-to-head from TheSportsDB matches
  const h2hMatches = [...homeLastMatches, ...awayLastMatches].filter(m =>
    (m.homeTeam.toLowerCase().includes(homeTeamName.toLowerCase().split(' ')[0]) &&
     m.awayTeam.toLowerCase().includes(awayTeamName.toLowerCase().split(' ')[0])) ||
    (m.homeTeam.toLowerCase().includes(awayTeamName.toLowerCase().split(' ')[0]) &&
     m.awayTeam.toLowerCase().includes(homeTeamName.toLowerCase().split(' ')[0]))
  );

  // Calculate form (W/D/L from last 5)
  const calculateForm = (matches: MatchResult[], teamName: string) => {
    return matches.slice(0, 5).map(m => {
      const isHome = m.homeTeam.toLowerCase().includes(teamName.toLowerCase().split(' ')[0]);
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      if (teamScore > oppScore) return 'W';
      if (teamScore < oppScore) return 'L';
      return 'D';
    }).join('');
  };

  // Build result with combined data sources
  const result: MatchPreviewData = {
    homeTeam: {
      info: homeTeam,
      lastMatches: homeLastMatches,
      form: calculateForm(homeLastMatches, homeTeamName) || aiMatchContext?.homeTeam?.recentForm || '',
      standing: homeStanding,
      aiInfo: homeAIInfo || (aiMatchContext ? {
        name: homeTeamName,
        description: '',
        recentForm: aiMatchContext.homeTeam.recentForm,
        keyStats: aiMatchContext.homeTeam.keyStats
      } : null),
      aiResults: aiMatchContext?.homeTeam?.recentResults,
      injuries: aiMatchContext?.homeTeam?.injuries
    },
    awayTeam: {
      info: awayTeam,
      lastMatches: awayLastMatches,
      form: calculateForm(awayLastMatches, awayTeamName) || aiMatchContext?.awayTeam?.recentForm || '',
      standing: awayStanding,
      aiInfo: awayAIInfo || (aiMatchContext ? {
        name: awayTeamName,
        description: '',
        recentForm: aiMatchContext.awayTeam.recentForm,
        keyStats: aiMatchContext.awayTeam.keyStats
      } : null),
      aiResults: aiMatchContext?.awayTeam?.recentResults,
      injuries: aiMatchContext?.awayTeam?.injuries
    },
    h2hMatches,
    aiH2H: aiMatchContext?.h2h,
    matchContext: aiMatchContext?.matchContext
  };

  // Cache the full preview data
  setCache(previewCacheKey, result);
  console.log(`💾 Cached preview data for ${homeTeamName} vs ${awayTeamName}`);

  return result;
};

// Types
export interface TeamInfo {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  stadium?: string;
  stadiumCapacity?: string;
  formedYear?: string;
  league?: string;
  country?: string;
  badge?: string;
  fanart?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  competition: string;
  venue?: string;
}

export interface Standing {
  position: number;
  teamName: string;
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
}

export interface MatchPreviewData {
  homeTeam: {
    info: TeamInfo | null;
    lastMatches: MatchResult[];
    form: string;
    standing: Standing | null;
    // AI-enriched data (when TheSportsDB doesn't have info)
    aiInfo?: AITeamInfo | null;
    aiResults?: Array<{ opponent: string; score: string; result: string; competition: string }>;
    injuries?: string[];
  };
  awayTeam: {
    info: TeamInfo | null;
    lastMatches: MatchResult[];
    form: string;
    standing: Standing | null;
    // AI-enriched data
    aiInfo?: AITeamInfo | null;
    aiResults?: Array<{ opponent: string; score: string; result: string; competition: string }>;
    injuries?: string[];
  };
  h2hMatches: MatchResult[];
  // AI-enriched head-to-head and context
  aiH2H?: {
    summary: string;
    lastMeetings: Array<{ date: string; score: string; winner: string }>;
  };
  matchContext?: string;
}
