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
        model: 'llama-3.1-sonar-small-128k-online',
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
      const matchData: PerplexityMatchData = JSON.parse(jsonStr);

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
        model: 'llama-3.1-sonar-small-128k-online',
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
        model: 'llama-3.1-sonar-small-128k-online',
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

export default {
  fetchMatchDataFromPerplexity,
  fetchH2HFromPerplexity,
  fetchLineupsFromPerplexity,
};
