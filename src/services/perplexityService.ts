// Perplexity AI Service - Fallback for team/match data when TheSportsDB doesn't have info
const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const API_URL = 'https://api.perplexity.ai/chat/completions';

// Cache to avoid repeated API calls
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cache: Record<string, { data: any; timestamp: number }> = {};

const getCached = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Try localStorage
  try {
    const stored = localStorage.getItem(`perplexity_${key}`);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < CACHE_DURATION) {
        cache[key] = { data, timestamp };
        return data;
      }
      localStorage.removeItem(`perplexity_${key}`);
    }
  } catch (e) {}

  return null;
};

const setCache = (key: string, data: any) => {
  const cacheData = { data, timestamp: Date.now() };
  cache[key] = cacheData;

  try {
    localStorage.setItem(`perplexity_${key}`, JSON.stringify(cacheData));
  } catch (e) {
    console.log('localStorage cache failed for Perplexity data');
  }
};

// Get team information using Perplexity AI
export const getTeamInfoFromAI = async (teamName: string, sport: string): Promise<AITeamInfo | null> => {
  const cacheKey = `team_${teamName.toLowerCase().replace(/\s+/g, '_')}_${sport}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`📦 Perplexity cache hit: ${teamName}`);
    return cached;
  }

  console.log(`🤖 Perplexity API: Fetching info for ${teamName}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON, no markdown, no explanation. Be concise.'
          },
          {
            role: 'user',
            content: `Get info about ${sport} team "${teamName}". Return JSON:
{
  "name": "full team name",
  "shortName": "abbreviation or short name",
  "description": "2-3 sentence team description with recent achievements",
  "league": "current league/competition",
  "country": "country",
  "stadium": "home stadium/arena name",
  "founded": "year founded",
  "recentForm": "brief description of recent form/performance in 2024-2025 season",
  "keyPlayers": ["player1", "player2", "player3"],
  "coach": "current coach/manager name"
}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      // Parse JSON from response (handle potential markdown wrapping)
      let jsonStr = content;
      if (content.includes('```')) {
        jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const teamInfo: AITeamInfo = JSON.parse(jsonStr);
      setCache(cacheKey, teamInfo);
      return teamInfo;
    }

    return null;
  } catch (error) {
    console.error('Error fetching team info from Perplexity:', error);
    return null;
  }
};

// Get match preview context using Perplexity AI
export const getMatchContextFromAI = async (
  homeTeam: string,
  awayTeam: string,
  sport: string,
  competition?: string
): Promise<AIMatchContext | null> => {
  const cacheKey = `match_${homeTeam}_vs_${awayTeam}_${sport}`.toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`📦 Perplexity cache hit: ${homeTeam} vs ${awayTeam}`);
    return cached;
  }

  console.log(`🤖 Perplexity API: Fetching match context for ${homeTeam} vs ${awayTeam}`);

  try {
    const competitionContext = competition ? ` in ${competition}` : '';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a sports data API. Return ONLY valid JSON, no markdown, no explanation. Be concise and factual.'
          },
          {
            role: 'user',
            content: `Get match preview data for ${sport} match: "${homeTeam}" vs "${awayTeam}"${competitionContext}. Return JSON:
{
  "homeTeam": {
    "recentForm": "W/L/D pattern from last 5 games, e.g. WWDLW",
    "recentResults": [
      {"opponent": "team", "score": "2-1", "result": "W", "competition": "league"},
      {"opponent": "team", "score": "0-0", "result": "D", "competition": "league"}
    ],
    "injuries": ["injured player 1"],
    "keyStats": "brief key stats"
  },
  "awayTeam": {
    "recentForm": "W/L/D pattern",
    "recentResults": [
      {"opponent": "team", "score": "1-2", "result": "L", "competition": "league"}
    ],
    "injuries": ["injured player"],
    "keyStats": "brief key stats"
  },
  "h2h": {
    "summary": "head to head summary, e.g. Home team leads 5-3 in last 10 meetings",
    "lastMeetings": [
      {"date": "2024-01-15", "score": "2-1", "winner": "home team name"}
    ]
  },
  "matchContext": "2-3 sentences about what makes this match interesting, stakes, rivalry, etc."
}`
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      let jsonStr = content;
      if (content.includes('```')) {
        jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const matchContext: AIMatchContext = JSON.parse(jsonStr);
      setCache(cacheKey, matchContext);
      return matchContext;
    }

    return null;
  } catch (error) {
    console.error('Error fetching match context from Perplexity:', error);
    return null;
  }
};

// Types
export interface AITeamInfo {
  name: string;
  shortName?: string;
  description: string;
  league?: string;
  country?: string;
  stadium?: string;
  founded?: string;
  recentForm?: string;
  keyPlayers?: string[];
  coach?: string;
}

export interface AIMatchContext {
  homeTeam: {
    recentForm: string;
    recentResults: Array<{
      opponent: string;
      score: string;
      result: string;
      competition: string;
    }>;
    injuries?: string[];
    keyStats?: string;
  };
  awayTeam: {
    recentForm: string;
    recentResults: Array<{
      opponent: string;
      score: string;
      result: string;
      competition: string;
    }>;
    injuries?: string[];
    keyStats?: string;
  };
  h2h: {
    summary: string;
    lastMeetings: Array<{
      date: string;
      score: string;
      winner: string;
    }>;
  };
  matchContext: string;
}
