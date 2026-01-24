// TheSportsDB API Service - Premium Key
const API_KEY = '751945';
const API_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Cache for team data to avoid repeated API calls
const teamCache = new Map<string, TeamData | null>();
const pendingRequests = new Map<string, Promise<TeamData | null>>();

// Rate limiting - max 80 requests per minute to stay under limit
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 80;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

interface TeamData {
  logo: string | null;
  badge: string | null;
  fanart: string | null;
  banner: string | null;
}

interface TeamSearchResult {
  teams: Array<{
    idTeam: string;
    strTeam: string;
    strTeamBadge: string;
    strTeamLogo: string;
    strSport: string;
    strFanart1: string | null;
    strFanart2: string | null;
    strFanart3: string | null;
    strFanart4: string | null;
    strBanner: string | null;
  }> | null;
}

// Check if we can make a request (rate limiting)
const canMakeRequest = (): boolean => {
  const now = Date.now();
  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length < MAX_REQUESTS_PER_MINUTE;
};

// Record a request timestamp
const recordRequest = () => {
  requestTimestamps.push(Date.now());
};

// Normalize team name for searching
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+fc$/i, '')
    .replace(/^fc\s+/i, '')
    .replace(/\s+cf$/i, '')
    .replace(/\s+sc$/i, '')
    .replace(/\s+afc$/i, '')
    .replace(/\s+united$/i, ' united')
    .replace(/\s+city$/i, ' city');
};

// Search for team and get all data (logo, badge, fanart)
export const fetchTeamData = async (teamName: string): Promise<TeamData | null> => {
  if (!teamName) return null;

  const cacheKey = normalizeTeamName(teamName);

  // Check cache first
  if (teamCache.has(cacheKey)) {
    return teamCache.get(cacheKey) || null;
  }

  // Check if there's already a pending request for this team
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) || null;
  }

  // Check rate limit before making request
  if (!canMakeRequest()) {
    console.warn(`⏳ Rate limit reached, skipping fetch for "${teamName}"`);
    return null; // Don't cache null here - might want to retry later
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      recordRequest();
      const searchUrl = `${API_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`;
      const response = await fetch(searchUrl);

      // Handle rate limit error
      if (response.status === 429) {
        console.warn(`⏳ TheSportsDB rate limit hit for "${teamName}"`);
        return null; // Don't cache - will retry
      }

      if (!response.ok) {
        console.warn(`TheSportsDB API error for "${teamName}":`, response.status);
        teamCache.set(cacheKey, null);
        return null;
      }

      const data: TeamSearchResult = await response.json();

      // Check for rate limit error in response
      if ((data as any).error === 429) {
        console.warn(`⏳ TheSportsDB rate limit in response for "${teamName}"`);
        return null;
      }

      if (data.teams && data.teams.length > 0) {
        const team = data.teams[0];
        const teamData: TeamData = {
          logo: team.strTeamLogo || null,
          badge: team.strTeamBadge || null,
          fanart: team.strFanart1 || team.strFanart2 || team.strFanart3 || null,
          banner: team.strBanner || null
        };

        if (teamData.badge || teamData.logo) {
          console.log(`✅ TheSportsDB data found for "${teamName}"`);
          teamCache.set(cacheKey, teamData);
          return teamData;
        }
      }

      console.log(`❌ No TheSportsDB data found for "${teamName}"`);
      teamCache.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error(`Error fetching data for "${teamName}":`, error);
      return null; // Don't cache on error - might want to retry
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// Legacy function - get just the logo
export const fetchTeamLogo = async (teamName: string): Promise<string | null> => {
  const data = await fetchTeamData(teamName);
  return data?.badge || data?.logo || null;
};

// Get team fanart/banner for background images
export const fetchTeamFanart = async (teamName: string): Promise<string | null> => {
  const data = await fetchTeamData(teamName);
  return data?.fanart || data?.banner || null;
};

// Batch fetch team data for multiple teams
export const fetchTeamDataBatch = async (
  teamNames: string[]
): Promise<Map<string, TeamData | null>> => {
  const results = new Map<string, TeamData | null>();

  // Filter out teams we already have cached
  const teamsToFetch = teamNames.filter(name => {
    const cacheKey = normalizeTeamName(name);
    if (teamCache.has(cacheKey)) {
      results.set(name, teamCache.get(cacheKey) || null);
      return false;
    }
    return true;
  });

  // Fetch remaining teams in parallel (with limit)
  const BATCH_SIZE = 5;
  for (let i = 0; i < teamsToFetch.length; i += BATCH_SIZE) {
    const batch = teamsToFetch.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async name => {
      const data = await fetchTeamData(name);
      results.set(name, data);
    });
    await Promise.all(promises);
  }

  return results;
};

// Clear the cache (useful for testing)
export const clearTeamCache = () => {
  teamCache.clear();
  pendingRequests.clear();
};

// Pre-warm cache with common teams
export const preloadCommonTeams = async () => {
  const commonTeams = [
    'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal',
    'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG',
    'Juventus', 'AC Milan', 'Inter Milan', 'Atletico Madrid', 'Borussia Dortmund'
  ];

  console.log('🔄 Preloading common team data...');
  await fetchTeamDataBatch(commonTeams);
  console.log('✅ Common team data preloaded');
};

// Export TeamData type
export type { TeamData };
