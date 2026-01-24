// SportsDB match hook - disabled (frontend only)
import { useState } from 'react';

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

interface UseSportsDBMatchOptions {
  eventId?: string | null;
  searchTeams?: { homeTeam: string; awayTeam: string } | null;
  autoRefreshInterval?: number;
}

export const useSportsDBMatch = (options: UseSportsDBMatchOptions) => {
  return {
    match: null as SportsDBMatch | null,
    lineups: null as MatchLineups | null,
    timeline: null as TimelineEvent[] | null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    foundEventId: null,
    refetch: async () => {},
  };
};
