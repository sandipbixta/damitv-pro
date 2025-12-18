import { useState, useEffect, useCallback } from 'react';
import { getLivescores } from '../services/sportsLogoService';

interface LiveScore {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | string;
  awayScore: number | string;
  progress: string;
  status: string;
}

// Global store for live scores
const liveScoresStore = new Map<string, LiveScore>();
let lastFetchTime = 0;
const FETCH_COOLDOWN = 30000; // 30 seconds

// Sport mapping for TheSportsDB API
const sportApiMap: Record<string, string> = {
  'football': 'soccer',
  'soccer': 'soccer',
  'basketball': 'basketball',
  'nba': 'basketball',
  'nfl': 'nfl',
  'american football': 'nfl',
  'baseball': 'baseball',
  'mlb': 'baseball',
  'rugby': 'rugby',
  'mma': 'fighting',
  'ufc': 'fighting',
  'boxing': 'fighting',
  'cricket': 'cricket',
};

// Normalize team name for matching
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/fc$/i, '')
    .replace(/^fc /i, '')
    .replace(/ fc$/i, '')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const useLiveScoreUpdates = (refreshInterval: number = 30000) => {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllScores = useCallback(async () => {
    // Prevent too frequent fetches
    if (Date.now() - lastFetchTime < FETCH_COOLDOWN) {
      return;
    }
    
    setIsLoading(true);
    lastFetchTime = Date.now();
    
    // Fetch scores for all major sports from TheSportsDB
    const sports = ['soccer', 'basketball', 'nfl', 'baseball', 'rugby', 'fighting', 'cricket'];
    
    try {
      const results = await Promise.all(
        sports.map(sport => getLivescores(sport).catch(() => []))
      );
      
      const allScores = results.flat();
      
      allScores.forEach(score => {
        if (score.idEvent || score.strEvent) {
          const key = score.idEvent || `${score.strHomeTeam}_${score.strAwayTeam}`;
          liveScoresStore.set(key, {
            eventId: score.idEvent || '',
            homeTeam: score.strHomeTeam || '',
            awayTeam: score.strAwayTeam || '',
            homeScore: score.intHomeScore ?? '-',
            awayScore: score.intAwayScore ?? '-',
            progress: score.strProgress || score.strStatus || '',
            status: score.strStatus || ''
          });
          
          // Also store by normalized team names for fuzzy matching
          if (score.strHomeTeam && score.strAwayTeam) {
            const teamKey = `${normalizeTeamName(score.strHomeTeam)}_${normalizeTeamName(score.strAwayTeam)}`;
            liveScoresStore.set(teamKey, {
              eventId: score.idEvent || '',
              homeTeam: score.strHomeTeam || '',
              awayTeam: score.strAwayTeam || '',
              homeScore: score.intHomeScore ?? '-',
              awayScore: score.intAwayScore ?? '-',
              progress: score.strProgress || score.strStatus || '',
              status: score.strStatus || ''
            });
          }
        }
      });
      
      console.log(`✅ Live scores updated: ${liveScoresStore.size} matches`);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to fetch live scores:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAllScores();
    
    // Set up interval
    const intervalId = setInterval(fetchAllScores, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchAllScores, refreshInterval]);

  return { lastUpdate, isLoading, refresh: fetchAllScores };
};

// Get live score by event ID
export const getLiveScoreById = (eventId: string): LiveScore | null => {
  return liveScoresStore.get(eventId) || null;
};

// Get live score by matching team names (fuzzy matching)
export const getLiveScoreByTeams = (homeTeam: string, awayTeam: string): LiveScore | null => {
  if (!homeTeam || !awayTeam) return null;
  
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  // Try direct match first
  const directKey = `${normalizedHome}_${normalizedAway}`;
  if (liveScoresStore.has(directKey)) {
    return liveScoresStore.get(directKey)!;
  }
  
  // Try fuzzy matching
  for (const score of liveScoresStore.values()) {
    const scoreHome = normalizeTeamName(score.homeTeam || '');
    const scoreAway = normalizeTeamName(score.awayTeam || '');
    
    // Check for partial match (team name contains or is contained)
    const homeMatch = scoreHome.includes(normalizedHome) || 
                      normalizedHome.includes(scoreHome) ||
                      scoreHome.split(' ').some(word => normalizedHome.includes(word) && word.length > 3);
    
    const awayMatch = scoreAway.includes(normalizedAway) || 
                      normalizedAway.includes(scoreAway) ||
                      scoreAway.split(' ').some(word => normalizedAway.includes(word) && word.length > 3);
    
    if (homeMatch && awayMatch) {
      return score;
    }
  }
  
  return null;
};

// Hook for individual match score
export const useMatchScore = (homeTeam: string, awayTeam: string, isLive: boolean) => {
  const [score, setScore] = useState<{ home: number | string; away: number | string; progress: string } | null>(null);
  
  useEffect(() => {
    if (!isLive || !homeTeam || !awayTeam) {
      setScore(null);
      return;
    }
    
    const checkScore = () => {
      const liveScore = getLiveScoreByTeams(homeTeam, awayTeam);
      if (liveScore) {
        setScore({
          home: liveScore.homeScore,
          away: liveScore.awayScore,
          progress: liveScore.progress
        });
      }
    };
    
    checkScore();
    
    // Check every 15 seconds for updates from the global store
    const intervalId = setInterval(checkScore, 15000);
    
    return () => clearInterval(intervalId);
  }, [homeTeam, awayTeam, isLive]);
  
  return score;
};

// Get API sport name for TheSportsDB
export const getApiSportName = (sport: string): string => {
  const key = sport?.toLowerCase() || 'soccer';
  return sportApiMap[key] || 'soccer';
};

// Get all cached live scores
export const getAllLiveScores = (): LiveScore[] => {
  return Array.from(liveScoresStore.values());
};

// Clear live scores cache
export const clearLiveScoresCache = () => {
  liveScoresStore.clear();
  lastFetchTime = 0;
};
