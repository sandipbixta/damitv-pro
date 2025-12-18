// ============================================
// THESPORTSDB API SERVICE (via Edge Function)
// ============================================

import { supabase } from '@/integrations/supabase/client';

// In-memory cache
const logoCache = new Map<string, string | null>();
const eventCache = new Map<string, any>();

// LocalStorage cache duration: 7 days
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// ============================================
// CACHE HELPERS
// ============================================

const getFromLocalStorage = (key: string): string | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { value, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
};

const setToLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
  } catch {
    // Storage full, ignore
  }
};

// ============================================
// NORMALIZE TEAM NAME
// ============================================

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/fc$/i, '')
    .replace(/^fc /i, '')
    .replace(/ fc$/i, '')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .trim();
};

// ============================================
// EDGE FUNCTION CALLER
// ============================================

const callSportsDbProxy = async (body: Record<string, any>): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('sportsdb-proxy', {
      body
    });
    
    if (error) {
      console.error('SportsDB proxy error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to call sportsdb-proxy:', error);
    return null;
  }
};

// ============================================
// SEARCH TEAM - Get logo/badge
// ============================================

export const searchTeam = async (teamName: string): Promise<{
  badge: string | null;
  logo: string | null;
  banner: string | null;
  jersey: string | null;
} | null> => {
  if (!teamName || teamName.trim() === '') return null;

  const cacheKey = `team_${normalizeTeamName(teamName)}`;
  
  // Check memory cache
  if (logoCache.has(cacheKey)) {
    const cached = logoCache.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Check localStorage
  const stored = getFromLocalStorage(cacheKey);
  if (stored) {
    logoCache.set(cacheKey, stored);
    return stored === 'null' ? null : JSON.parse(stored);
  }

  try {
    const data = await callSportsDbProxy({ action: 'searchTeam', teamName });

    if (data?.teams && data.teams.length > 0) {
      const team = data.teams[0];
      const result = {
        badge: team.strBadge || null,
        logo: team.strLogo || null,
        banner: team.strBanner || null,
        jersey: team.strJersey || null,
      };
      
      const resultStr = JSON.stringify(result);
      logoCache.set(cacheKey, resultStr);
      setToLocalStorage(cacheKey, resultStr);
      return result;
    }

    // Cache empty result
    logoCache.set(cacheKey, 'null');
    setToLocalStorage(cacheKey, 'null');
    return null;
  } catch (error) {
    console.error('Failed to search team:', teamName, error);
    return null;
  }
};

// ============================================
// GET TEAM LOGO (Simple helper)
// ============================================

export const getTeamLogo = async (teamName: string, _sport?: string): Promise<string | null> => {
  const result = await searchTeam(teamName);
  return result?.badge || result?.logo || null;
};

// Sync version - only returns cached
export const getTeamLogoSync = (teamName: string, _sport?: string): string | null => {
  const cacheKey = `team_${normalizeTeamName(teamName)}`;
  
  // Check memory cache
  const cached = logoCache.get(cacheKey);
  if (cached && cached !== 'null') {
    try {
      const result = JSON.parse(cached);
      return result?.badge || result?.logo || null;
    } catch {
      return null;
    }
  }
  
  // Check localStorage
  const stored = getFromLocalStorage(cacheKey);
  if (stored && stored !== 'null') {
    logoCache.set(cacheKey, stored);
    try {
      const result = JSON.parse(stored);
      return result?.badge || result?.logo || null;
    } catch {
      return null;
    }
  }
  
  return null;
};

// ============================================
// SEARCH EVENT - Get poster/thumb
// ============================================

export const searchEvent = async (
  homeTeam: string,
  awayTeam: string
): Promise<{
  thumb: string | null;
  banner: string | null;
  poster: string | null;
} | null> => {
  if (!homeTeam?.trim() || !awayTeam?.trim()) return null;
  
  const eventName = `${homeTeam}_vs_${awayTeam}`.replace(/ /g, '_');
  const cacheKey = `event_${normalizeTeamName(eventName)}`;

  // Check cache
  const stored = getFromLocalStorage(cacheKey);
  if (stored) {
    return stored === 'null' ? null : JSON.parse(stored);
  }

  try {
    const data = await callSportsDbProxy({ action: 'searchEvent', eventName });

    if (data?.event && data.event.length > 0) {
      const event = data.event[0];
      const result = {
        thumb: event.strThumb || null,
        banner: event.strBanner || null,
        poster: event.strPoster || null,
      };
      
      setToLocalStorage(cacheKey, JSON.stringify(result));
      return result;
    }

    setToLocalStorage(cacheKey, 'null');
    return null;
  } catch (error) {
    console.error('Failed to search event:', eventName, error);
    return null;
  }
};

// ============================================
// GET LEAGUE INFO
// ============================================

export const getLeagueInfo = async (leagueId: number): Promise<{
  badge: string | null;
  logo: string | null;
  banner: string | null;
  trophy: string | null;
} | null> => {
  const cacheKey = `league_${leagueId}`;
  
  const stored = getFromLocalStorage(cacheKey);
  if (stored) {
    return stored === 'null' ? null : JSON.parse(stored);
  }

  try {
    const data = await callSportsDbProxy({ action: 'lookupLeague', leagueId });

    if (data?.leagues && data.leagues.length > 0) {
      const league = data.leagues[0];
      const result = {
        badge: league.strBadge || null,
        logo: league.strLogo || null,
        banner: league.strBanner || null,
        trophy: league.strTrophy || null,
      };
      
      setToLocalStorage(cacheKey, JSON.stringify(result));
      return result;
    }

    return null;
  } catch (error) {
    console.error('Failed to get league:', leagueId, error);
    return null;
  }
};

// ============================================
// SEARCH PLAYER (for UFC/MMA/Boxing/Wrestling)
// ============================================

export const searchPlayer = async (playerName: string): Promise<{
  thumb: string | null;
  cutout: string | null;
  render: string | null;
  banner: string | null;
} | null> => {
  const cacheKey = `player_${normalizeTeamName(playerName)}`;
  
  const stored = getFromLocalStorage(cacheKey);
  if (stored) {
    return stored === 'null' ? null : JSON.parse(stored);
  }

  try {
    const data = await callSportsDbProxy({ action: 'searchPlayer', playerName });

    if (data?.player && data.player.length > 0) {
      const player = data.player[0];
      const result = {
        thumb: player.strThumb || null,
        cutout: player.strCutout || null,
        render: player.strRender || null,
        banner: player.strBanner || null,
      };
      
      setToLocalStorage(cacheKey, JSON.stringify(result));
      return result;
    }

    return null;
  } catch (error) {
    console.error('Failed to search player:', playerName, error);
    return null;
  }
};

// ============================================
// GET LIVESCORES (via Edge Function)
// ============================================

export const getLivescores = async (sport: string = 'soccer'): Promise<any[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-livescores', {
      body: { sport }
    });

    if (error) {
      console.error('Livescores API error:', error);
      return [];
    }

    console.log(`✅ Fetched ${data?.livescores?.length || 0} live scores for ${sport}`);
    return data?.livescores || [];
  } catch (error) {
    console.error('Failed to get livescores:', error);
    return [];
  }
};

// ============================================
// GET VIDEO HIGHLIGHTS (Premium)
// ============================================

export const getHighlights = async (date?: string): Promise<any[]> => {
  const d = date || new Date().toISOString().split('T')[0];
  
  try {
    const data = await callSportsDbProxy({ action: 'getHighlights', date: d });
    return data?.tvhighlights || [];
  } catch (error) {
    console.error('Failed to get highlights:', error);
    return [];
  }
};

// ============================================
// SPORT IMAGES FROM THESPORTSDB
// ============================================

// TheSportsDB sport images (official sport thumbnails)
const SPORT_IMAGES: Record<string, string> = {
  'soccer': 'https://www.thesportsdb.com/images/sports/soccer.jpg',
  'football': 'https://www.thesportsdb.com/images/sports/soccer.jpg',
  'basketball': 'https://www.thesportsdb.com/images/sports/basketball.jpg',
  'nba': 'https://www.thesportsdb.com/images/sports/basketball.jpg',
  'american football': 'https://www.thesportsdb.com/images/sports/american_football.jpg',
  'nfl': 'https://www.thesportsdb.com/images/sports/american_football.jpg',
  'afl': 'https://www.thesportsdb.com/images/sports/aussie_rules.jpg',
  'australian football': 'https://www.thesportsdb.com/images/sports/aussie_rules.jpg',
  'baseball': 'https://www.thesportsdb.com/images/sports/baseball.jpg',
  'mlb': 'https://www.thesportsdb.com/images/sports/baseball.jpg',
  'billiards': 'https://www.thesportsdb.com/images/sports/snooker.jpg',
  'snooker': 'https://www.thesportsdb.com/images/sports/snooker.jpg',
  'pool': 'https://www.thesportsdb.com/images/sports/snooker.jpg',
  'cricket': 'https://www.thesportsdb.com/images/sports/cricket.jpg',
  'darts': 'https://www.thesportsdb.com/images/sports/darts.jpg',
  'boxing': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'mma': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'ufc': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'wwe': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'wrestling': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'fighting': 'https://www.thesportsdb.com/images/sports/fighting.jpg',
  'golf': 'https://www.thesportsdb.com/images/sports/golf.jpg',
  'hockey': 'https://www.thesportsdb.com/images/sports/ice_hockey.jpg',
  'nhl': 'https://www.thesportsdb.com/images/sports/ice_hockey.jpg',
  'ice hockey': 'https://www.thesportsdb.com/images/sports/ice_hockey.jpg',
  'motorsport': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'f1': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'formula': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'racing': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'motogp': 'https://www.thesportsdb.com/images/sports/motorsport.jpg',
  'rugby': 'https://www.thesportsdb.com/images/sports/rugby.jpg',
  'tennis': 'https://www.thesportsdb.com/images/sports/tennis.jpg',
  'volleyball': 'https://www.thesportsdb.com/images/sports/volleyball.jpg',
  'handball': 'https://www.thesportsdb.com/images/sports/handball.jpg',
  'cycling': 'https://www.thesportsdb.com/images/sports/cycling.jpg',
  'esports': 'https://www.thesportsdb.com/images/sports/esports.jpg',
  'gaming': 'https://www.thesportsdb.com/images/sports/esports.jpg',
};

// Get sport image URL from TheSportsDB
export const getSportImage = (sport: string): string | null => {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return null;
};

// Fallback emoji icons
const SPORT_ICONS: Record<string, string> = {
  'football': '⚽', 'soccer': '⚽',
  'basketball': '🏀', 'nba': '🏀',
  'nfl': '🏈', 'american football': '🏈',
  'hockey': '🏒', 'nhl': '🏒', 'ice hockey': '🏒',
  'baseball': '⚾', 'mlb': '⚾',
  'tennis': '🎾',
  'golf': '⛳',
  'cricket': '🏏',
  'rugby': '🏉',
  'mma': '🥊', 'ufc': '🥊', 'boxing': '🥊', 'fighting': '🥊',
  'wrestling': '🤼', 'wwe': '🤼',
  'f1': '🏎️', 'motorsport': '🏎️', 'formula': '🏎️', 'racing': '🏎️',
  'motogp': '🏍️',
  'cycling': '🚴',
  'afl': '🏈', 'australian football': '🏈',
  'volleyball': '🏐',
  'handball': '🤾',
  'darts': '🎯',
  'snooker': '🎱', 'pool': '🎱', 'billiards': '🎱',
  'esports': '🎮', 'gaming': '🎮',
  'swimming': '🏊',
  'athletics': '🏃',
  'skiing': '⛷️',
  'badminton': '🏸',
  'table tennis': '🏓',
};

export const getSportIcon = (sport: string): string => {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '🏆';
};

// ============================================
// ENHANCE MATCH WITH LOGOS
// ============================================

export const enhanceMatchWithLogos = async (match: any): Promise<any> => {
  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';

  // Fetch both team logos in parallel
  const [homeData, awayData, eventData] = await Promise.all([
    homeTeam ? searchTeam(homeTeam) : Promise.resolve(null),
    awayTeam ? searchTeam(awayTeam) : Promise.resolve(null),
    homeTeam && awayTeam ? searchEvent(homeTeam, awayTeam) : Promise.resolve(null)
  ]);

  return {
    ...match,
    poster: eventData?.thumb || eventData?.banner || eventData?.poster || match.poster,
    teams: {
      home: {
        ...match.teams?.home,
        badge: homeData?.badge || homeData?.logo || match.teams?.home?.badge,
        banner: homeData?.banner
      },
      away: {
        ...match.teams?.away,
        badge: awayData?.badge || awayData?.logo || match.teams?.away?.badge,
        banner: awayData?.banner
      }
    }
  };
};

// ============================================
// BATCH ENHANCE MATCHES
// ============================================

export const enhanceMatchesWithLogos = async (matches: any[]): Promise<any[]> => {
  // Process in batches of 5 to respect rate limits
  const results: any[] = [];
  const batchSize = 5;

  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    const enhanced = await Promise.all(batch.map(enhanceMatchWithLogos));
    results.push(...enhanced);
  }

  return results;
};

// ============================================
// LOGO URL HELPERS (for components)
// ============================================

// Get logo URL from cache or return placeholder
export const getLogoUrl = (teamName: string, _sport?: string): string | null => {
  if (!teamName) return null;
  return getTeamLogoSync(teamName);
};

// Async version that fetches if not cached
export const getLogoAsync = async (teamName: string, _sport?: string): Promise<string | null> => {
  if (!teamName) return null;
  
  // Try cache first
  const cached = getTeamLogoSync(teamName);
  if (cached) return cached;
  
  // Fetch and cache
  return await getTeamLogo(teamName);
};

// ============================================
// PRELOAD POPULAR TEAMS
// ============================================

const POPULAR_TEAMS = [
  'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal',
  'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Juventus',
  'PSG', 'Inter Milan', 'AC Milan', 'Borussia Dortmund', 'Atletico Madrid',
  'Los Angeles Lakers', 'Golden State Warriors', 'Boston Celtics',
  'New England Patriots', 'Dallas Cowboys', 'Green Bay Packers'
];

export const preloadPopularTeams = async (): Promise<void> => {
  console.log('Preloading popular team logos...');
  
  // Check which teams need to be fetched
  const teamsToFetch = POPULAR_TEAMS.filter(team => {
    const cacheKey = `team_${normalizeTeamName(team)}`;
    return !logoCache.has(cacheKey) && !getFromLocalStorage(cacheKey);
  });

  if (teamsToFetch.length === 0) {
    console.log('All popular teams already cached');
    return;
  }

  // Fetch in batches of 5
  for (let i = 0; i < teamsToFetch.length; i += 5) {
    const batch = teamsToFetch.slice(i, i + 5);
    await Promise.all(batch.map(team => searchTeam(team)));
    
    // Small delay between batches
    if (i + 5 < teamsToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`Preloaded ${teamsToFetch.length} team logos`);
};
