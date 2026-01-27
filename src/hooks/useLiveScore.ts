import { useState, useEffect } from 'react';

const API_KEY = '751945';
const CACHE_DURATION = 30 * 1000; // 30 seconds cache for live scores

interface LiveScore {
  homeScore: string | null;
  awayScore: string | null;
  matchTime: string | null;
  status: string | null;
}

interface LiveScoreEvent {
  idEvent: string;
  strSport: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strProgress: string | null;
  strStatus: string | null;
}

// Global cache for live scores - store all sports
const liveScoresCache: Map<string, {
  data: LiveScoreEvent[];
  timestamp: number;
}> = new Map();

// All sports to fetch
const SPORTS_TO_FETCH = ['soccer', 'basketball', 'tennis', 'cricket', 'ice_hockey', 'baseball', 'rugby', 'american_football', 'fighting'];

// Normalize team names for matching
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+fc$/i, '')
    .replace(/^fc\s+/i, '')
    .replace(/\s+cf$/i, '')
    .replace(/\s+sc$/i, '')
    .replace(/\s+afc$/i, '')
    .replace(/\s+bc$/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

// Check if two team names match
const teamsMatch = (name1: string, name2: string): boolean => {
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);

  // Exact match
  if (n1 === n2) return true;

  // One contains the other (min 4 chars to avoid false positives)
  if (n1.length >= 4 && n2.length >= 4) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }

  // Check if main words match
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);

  // If any significant word matches
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 && w1.length >= 4) return true;
      // Partial match for longer words (e.g., "cavaliers" vs "cavs")
      if (w1.length >= 6 && w2.length >= 3 && w1.startsWith(w2)) return true;
      if (w2.length >= 6 && w1.length >= 3 && w2.startsWith(w1)) return true;
    }
  }

  return false;
};

// Map sport category to TheSportsDB sport slug
const getSportSlug = (category: string): string => {
  const mapping: Record<string, string> = {
    'football': 'soccer',
    'soccer': 'soccer',
    'basketball': 'basketball',
    'nba': 'basketball',
    'tennis': 'tennis',
    'cricket': 'cricket',
    'hockey': 'ice_hockey',
    'ice-hockey': 'ice_hockey',
    'baseball': 'baseball',
    'mlb': 'baseball',
    'rugby': 'rugby',
    'american-football': 'american_football',
    'nfl': 'american_football',
    'mma': 'fighting',
    'ufc': 'fighting',
    'boxing': 'fighting',
    'motorsport': 'motorsport',
    'golf': 'golf'
  };

  return mapping[category?.toLowerCase()] || 'soccer';
};

// Fetch live scores for a specific sport
const fetchLiveScoresForSport = async (sport: string): Promise<LiveScoreEvent[]> => {
  const now = Date.now();
  const cached = liveScoresCache.get(sport);

  // Check cache
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v2/json/livescore/${sport}`,
      {
        headers: {
          'X-API-KEY': API_KEY
        }
      }
    );

    if (!response.ok) {
      return cached?.data || [];
    }

    const data = await response.json();

    if (data.livescore && Array.isArray(data.livescore)) {
      // Filter only matches with actual scores (not NS = Not Started)
      const liveMatches = data.livescore.filter((m: LiveScoreEvent) =>
        m.strStatus !== 'NS' && m.strStatus !== 'POST' && m.strStatus !== 'CANC'
      );

      liveScoresCache.set(sport, {
        data: liveMatches,
        timestamp: now
      });

      console.log(`📊 ${sport}: ${liveMatches.length} live matches`);
      return liveMatches;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${sport} live scores:`, error);
    return cached?.data || [];
  }
};

// Fetch all sports live scores
const fetchAllLiveScores = async (): Promise<LiveScoreEvent[]> => {
  const allScores: LiveScoreEvent[] = [];

  // Fetch all sports in parallel
  const results = await Promise.all(
    SPORTS_TO_FETCH.map(sport => fetchLiveScoresForSport(sport))
  );

  for (const scores of results) {
    allScores.push(...scores);
  }

  return allScores;
};

export const useLiveScore = (
  homeTeam: string,
  awayTeam: string,
  category?: string,
  isLive?: boolean
): LiveScore => {
  const [score, setScore] = useState<LiveScore>({
    homeScore: null,
    awayScore: null,
    matchTime: null,
    status: null
  });

  useEffect(() => {
    // Only fetch if match is live
    if (!isLive || !homeTeam || !awayTeam) {
      return;
    }

    let isMounted = true;

    const fetchScore = async () => {
      // First try the specific sport
      const sport = getSportSlug(category || 'football');
      let events = await fetchLiveScoresForSport(sport);

      // Find matching event
      let matchingEvent = events.find(event => {
        const homeMatch = teamsMatch(event.strHomeTeam, homeTeam);
        const awayMatch = teamsMatch(event.strAwayTeam, awayTeam);
        return homeMatch && awayMatch;
      });

      // If not found, try all sports
      if (!matchingEvent) {
        const allEvents = await fetchAllLiveScores();
        matchingEvent = allEvents.find(event => {
          const homeMatch = teamsMatch(event.strHomeTeam, homeTeam);
          const awayMatch = teamsMatch(event.strAwayTeam, awayTeam);
          return homeMatch && awayMatch;
        });
      }

      if (!isMounted) return;

      if (matchingEvent && matchingEvent.intHomeScore !== null) {
        console.log(`✅ Live score: ${homeTeam} ${matchingEvent.intHomeScore} - ${matchingEvent.intAwayScore} ${awayTeam}`);
        setScore({
          homeScore: matchingEvent.intHomeScore,
          awayScore: matchingEvent.intAwayScore,
          matchTime: matchingEvent.strProgress,
          status: matchingEvent.strStatus
        });
      }
    };

    // Initial fetch
    fetchScore();

    // Refresh every 30 seconds for live matches
    const interval = setInterval(fetchScore, 30 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [homeTeam, awayTeam, category, isLive]);

  return score;
};

export default useLiveScore;
