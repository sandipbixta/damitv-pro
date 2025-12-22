import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SportsDBMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  progress: string | null;
  isLive: boolean;
  venue: string;
  date: string;
  time: string;
  league: string;
  season: string;
  round: number;
  homeTeamBadge: string;
  awayTeamBadge: string;
  homeFormation: string;
  awayFormation: string;
  homeGoalDetails: string;
  awayGoalDetails: string;
  homeRedCards: string;
  awayRedCards: string;
  homeYellowCards: string;
  awayYellowCards: string;
  thumbnail: string;
  video: string;
}

export interface LineupPlayer {
  name: string;
  position: string;
  positionShort: string;
  number: string;
  isSub: boolean;
  formation: string;
}

export interface MatchLineups {
  home: LineupPlayer[];
  away: LineupPlayer[];
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: string;
  player: string;
  team: string;
  isHome: boolean;
  assist: string;
  comment: string;
}

interface UseSportsDBMatchResult {
  match: SportsDBMatch | null;
  lineups: MatchLineups | null;
  timeline: TimelineEvent[] | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  foundEventId: string | null;
  refetch: () => Promise<void>;
}

interface UseSportsDBMatchOptions {
  eventId?: string | null;
  searchTeams?: {
    homeTeam: string;
    awayTeam: string;
  } | null;
  autoRefreshInterval?: number;
}

export const useSportsDBMatch = (
  options: UseSportsDBMatchOptions
): UseSportsDBMatchResult => {
  const { eventId, searchTeams, autoRefreshInterval = 60000 } = options;
  
  const [match, setMatch] = useState<SportsDBMatch | null>(null);
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [foundEventId, setFoundEventId] = useState<string | null>(null);

  const fetchMatchDetails = useCallback(async () => {
    if (!eventId && !searchTeams) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestBody: any = {
        includeLineups: true,
        includeTimeline: true,
      };

      if (eventId) {
        requestBody.eventId = eventId;
      } else if (searchTeams) {
        requestBody.searchTeams = searchTeams;
      }

      const { data, error: fnError } = await supabase.functions.invoke('fetch-match-details', {
        body: requestBody,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success) {
        setMatch(data.match);
        setLineups(data.lineups);
        setTimeline(data.timeline);
        setFoundEventId(data.eventId || eventId);
        setLastUpdated(new Date());
      } else {
        throw new Error(data?.error || 'Failed to fetch match details');
      }
    } catch (err) {
      console.error('Error fetching SportsDB match:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, searchTeams]);

  // Initial fetch
  useEffect(() => {
    if (eventId || searchTeams) {
      fetchMatchDetails();
    }
  }, [eventId, searchTeams?.homeTeam, searchTeams?.awayTeam, fetchMatchDetails]);

  // Auto-refresh for live matches
  useEffect(() => {
    if ((!eventId && !searchTeams) || !match?.isLive) return;

    const interval = setInterval(() => {
      fetchMatchDetails();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [eventId, searchTeams, match?.isLive, autoRefreshInterval, fetchMatchDetails]);

  return {
    match,
    lineups,
    timeline,
    isLoading,
    error,
    lastUpdated,
    foundEventId,
    refetch: fetchMatchDetails,
  };
};
