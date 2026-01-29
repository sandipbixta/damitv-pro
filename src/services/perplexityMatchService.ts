// Perplexity AI Match Data Service
// Uses Perplexity AI to fetch real-time match statistics, lineups, H2H when TheSportsDB lacks data

// API key from environment variable (set in .env or Netlify)
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityMatchData {
  score: {
    home: number | null;
    away: number | null;
  };
  matchTime: string | null;
  status: string;
  venue: string | null;
  referee: string | null;
  statistics: {
    possession: { home: number; away: number } | null;
    shots: { home: number; away: number } | null;
    shotsOnTarget: { home: number; away: number } | null;
    corners: { home: number; away: number } | null;
    fouls: { home: number; away: number } | null;
    yellowCards: { home: number; away: number } | null;
    redCards: { home: number; away: number } | null;
    offsides: { home: number; away: number } | null;
  };
  lineups: {
    home: { name: string; number: string; position: string }[];
    away: { name: string; number: string; position: string }[];
    homeFormation: string | null;
    awayFormation: string | null;
  } | null;
  h2h: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
  }[];
  events: {
    time: string;
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
    player: string;
    team: 'home' | 'away';
    assist?: string;
  }[];
}

// Cache for API responses (5 minute TTL)
const cache = new Map<string, { data: PerplexityMatchData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (homeTeam: string, awayTeam: string) =>
  `${homeTeam.toLowerCase()}_vs_${awayTeam.toLowerCase()}`;

export const fetchMatchDataFromPerplexity = async (
  homeTeam: string,
  awayTeam: string,
  sport: string = 'football'
): Promise<PerplexityMatchData | null> => {
  // Check if API key is configured
  if (!PERPLEXITY_API_KEY) {
    console.warn('Perplexity API key not configured');
    return null;
  }

  const cacheKey = getCacheKey(homeTeam, awayTeam);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached Perplexity data for', homeTeam, 'vs', awayTeam);
    return cached.data;
  }

  const prompt = `Get current live match data for ${homeTeam} vs ${awayTeam} (${sport}).

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "score": { "home": null, "away": null },
  "matchTime": null,
  "status": "scheduled",
  "venue": null,
  "referee": null,
  "statistics": {
    "possession": null,
    "shots": null,
    "shotsOnTarget": null,
    "corners": null,
    "fouls": null,
    "yellowCards": null,
    "redCards": null,
    "offsides": null
  },
  "lineups": null,
  "h2h": [],
  "events": []
}

For statistics, use format: { "home": number, "away": number }
For lineups, use: { "home": [{"name": "Player", "number": "10", "position": "Forward"}], "away": [...], "homeFormation": "4-3-3", "awayFormation": "4-4-2" }
For h2h (last 5 matches), use: [{"date": "2024-01-15", "homeTeam": "Team A", "awayTeam": "Team B", "homeScore": 2, "awayScore": 1, "competition": "Premier League"}]
For events, use: [{"time": "45'", "type": "goal", "player": "Player Name", "team": "home", "assist": "Assister Name"}]

If match is live, set status to "live" and include current score.
If match hasn't started, set status to "scheduled".
If match finished, set status to "finished".
Include any available real data. Use null for unavailable data.`;

  try {
    console.log('🔍 Fetching match data from Perplexity for', homeTeam, 'vs', awayTeam);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation. Just the raw JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in Perplexity response');
      return null;
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const raw = JSON.parse(jsonStr);

      // Normalize: Perplexity may wrap in a "match" key or return a different structure
      const src = raw.match || raw;

      // Parse score - handle "0-0" string or {home, away} object
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      if (src.score && typeof src.score === 'object') {
        homeScore = src.score.home ?? null;
        awayScore = src.score.away ?? null;
      } else if (typeof src.score === 'string' && src.score.includes('-')) {
        const parts = src.score.split('-').map((s: string) => parseInt(s.trim()));
        homeScore = isNaN(parts[0]) ? null : parts[0];
        awayScore = isNaN(parts[1]) ? null : parts[1];
      }

      // Parse stat helper
      const parseStat = (val: any): { home: number; away: number } | null => {
        if (!val) return null;
        if (typeof val === 'object' && 'home' in val) return { home: Number(val.home) || 0, away: Number(val.away) || 0 };
        return null;
      };

      const stats = src.statistics || src.stats || {};

      const matchData: PerplexityMatchData = {
        score: { home: homeScore, away: awayScore },
        matchTime: src.matchTime || src.minute?.toString() || src.match_time || null,
        status: src.status || 'scheduled',
        venue: src.venue || src.stadium || null,
        referee: src.referee || null,
        statistics: {
          possession: parseStat(stats.possession),
          shots: parseStat(stats.shots),
          shotsOnTarget: parseStat(stats.shotsOnTarget || stats.shots_on_target),
          corners: parseStat(stats.corners),
          fouls: parseStat(stats.fouls),
          yellowCards: parseStat(stats.yellowCards || stats.yellow_cards),
          redCards: parseStat(stats.redCards || stats.red_cards),
          offsides: parseStat(stats.offsides),
        },
        lineups: src.lineups || null,
        h2h: Array.isArray(src.h2h) ? src.h2h : [],
        events: Array.isArray(src.events) ? src.events : [],
      };

      // Cache the result
      cache.set(cacheKey, { data: matchData, timestamp: Date.now() });

      console.log('✅ Perplexity data received for', homeTeam, 'vs', awayTeam, '- Status:', matchData.status);
      return matchData;
    } catch (parseError) {
      console.error('Failed to parse Perplexity JSON:', parseError);
      console.error('Raw content:', content);
      return null;
    }
  } catch (error) {
    console.error('Error fetching from Perplexity:', error);
    return null;
  }
};

// Fetch H2H specifically
export const fetchH2HFromPerplexity = async (
  homeTeam: string,
  awayTeam: string
): Promise<PerplexityMatchData['h2h'] | null> => {
  if (!PERPLEXITY_API_KEY) return null;

  const prompt = `Get the last 5 head-to-head match results between ${homeTeam} and ${awayTeam}.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "date": "2024-01-15",
    "homeTeam": "Team A",
    "awayTeam": "Team B",
    "homeScore": 2,
    "awayScore": 1,
    "competition": "Premier League"
  }
]

Include matches from any competition. Order by date (most recent first).`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON array with no markdown, no code blocks, no explanation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error fetching H2H from Perplexity:', error);
    return null;
  }
};

// Fetch lineups specifically
export const fetchLineupsFromPerplexity = async (
  homeTeam: string,
  awayTeam: string
): Promise<PerplexityMatchData['lineups'] | null> => {
  if (!PERPLEXITY_API_KEY) return null;

  const prompt = `Get the starting lineups for today's match: ${homeTeam} vs ${awayTeam}.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "home": [
    {"name": "Player Name", "number": "1", "position": "Goalkeeper"},
    {"name": "Player Name", "number": "2", "position": "Defender"}
  ],
  "away": [
    {"name": "Player Name", "number": "1", "position": "Goalkeeper"}
  ],
  "homeFormation": "4-3-3",
  "awayFormation": "4-4-2"
}

Include starting 11 players for each team if available. Return null if lineups not announced yet.`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON with no markdown, no code blocks, no explanation. Return null if data unavailable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content || content.trim().toLowerCase() === 'null') return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error fetching lineups from Perplexity:', error);
    return null;
  }
};

// Fetch league standings
export const fetchStandingsFromPerplexity = async (
  league: string,
  homeTeam: string,
  awayTeam: string
): Promise<{
  rank: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}[] | null> => {
  if (!PERPLEXITY_API_KEY) return null;

  const leagueName = league || `the league that ${homeTeam} and ${awayTeam} play in`;

  const prompt = `Get the current league standings/table for ${leagueName}. Both ${homeTeam} and ${awayTeam} are in this league. Find the correct league and current season automatically.

Return ONLY a valid JSON array (no markdown, no explanation) of ALL teams in the league:
[
  {
    "rank": 1,
    "team": "Team Name",
    "played": 20,
    "wins": 15,
    "draws": 3,
    "losses": 2,
    "goalsFor": 45,
    "goalsAgainst": 15,
    "goalDifference": 30,
    "points": 48
  }
]

Order by rank (1st place first). Include all teams in the league.`;

  try {
    console.log('🔍 Fetching standings from Perplexity for', leagueName);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON array with no markdown, no code blocks, no explanation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error fetching standings from Perplexity:', error);
    return null;
  }
};

// Fetch match extras: form guide, prediction, top scorers — single API call
export interface MatchExtras {
  homeForm: string[]; // e.g. ["W","W","D","L","W"]
  awayForm: string[];
  prediction: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    predictedScore: string;
    reasoning: string;
  };
  homeTopScorers: { name: string; goals: number; assists: number }[];
  awayTopScorers: { name: string; goals: number; assists: number }[];
  homeManager: string;
  awayManager: string;
  league: string;
  season: string;
}

const extrasCache = new Map<string, { data: MatchExtras; timestamp: number }>();

export const fetchMatchExtrasFromPerplexity = async (
  homeTeam: string,
  awayTeam: string
): Promise<MatchExtras | null> => {
  if (!PERPLEXITY_API_KEY) return null;

  const cacheKey = `extras_${homeTeam.toLowerCase()}_${awayTeam.toLowerCase()}`;
  const cached = extrasCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  const prompt = `For the football match ${homeTeam} vs ${awayTeam}, provide the following data:

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "homeForm": ["W","W","D","L","W"],
  "awayForm": ["L","W","W","D","L"],
  "prediction": {
    "homeWinPct": 45,
    "drawPct": 25,
    "awayWinPct": 30,
    "predictedScore": "2-1",
    "reasoning": "Brief 1-sentence reasoning"
  },
  "homeTopScorers": [{"name": "Player", "goals": 10, "assists": 3}],
  "awayTopScorers": [{"name": "Player", "goals": 8, "assists": 5}],
  "homeManager": "Manager Name",
  "awayManager": "Manager Name",
  "league": "League Name",
  "season": "2025-2026"
}

homeForm/awayForm = last 5 match results (W/D/L), most recent first.
topScorers = top 3 scorers this season for each team.
prediction = AI prediction with win percentages that sum to 100.
Include real current data.`;

  try {
    console.log('🔍 Fetching match extras from Perplexity for', homeTeam, 'vs', awayTeam);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a sports data API. Return ONLY valid JSON with no markdown, no code blocks, no explanation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const raw = JSON.parse(jsonStr);
    const extras: MatchExtras = {
      homeForm: Array.isArray(raw.homeForm) ? raw.homeForm : [],
      awayForm: Array.isArray(raw.awayForm) ? raw.awayForm : [],
      prediction: raw.prediction || { homeWinPct: 33, drawPct: 34, awayWinPct: 33, predictedScore: '1-1', reasoning: '' },
      homeTopScorers: Array.isArray(raw.homeTopScorers) ? raw.homeTopScorers : [],
      awayTopScorers: Array.isArray(raw.awayTopScorers) ? raw.awayTopScorers : [],
      homeManager: raw.homeManager || '',
      awayManager: raw.awayManager || '',
      league: raw.league || '',
      season: raw.season || '',
    };

    extrasCache.set(cacheKey, { data: extras, timestamp: Date.now() });
    console.log('✅ Match extras received from Perplexity');
    return extras;
  } catch (error) {
    console.error('Error fetching match extras from Perplexity:', error);
    return null;
  }
};

export default {
  fetchMatchDataFromPerplexity,
  fetchH2HFromPerplexity,
  fetchLineupsFromPerplexity,
  fetchStandingsFromPerplexity,
  fetchMatchExtrasFromPerplexity,
};
