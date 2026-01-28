import { useState, useEffect, useCallback } from 'react';
import {
  fetchMatchDataFromPerplexity,
  fetchH2HFromPerplexity,
  fetchLineupsFromPerplexity,
  PerplexityMatchData,
} from '@/services/perplexityMatchService';

const API_KEY = '751945';
const BASE_URL = 'https://www.thesportsdb.com/api';

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
  leagueBadge: string;
  season: string;
  round: string;
  homeTeamBadge: string;
  awayTeamBadge: string;
  homeFormation: string;
  awayFormation: string;
  homeGoalDetails: string;
  awayGoalDetails: string;
  homeRedCards: number;
  awayRedCards: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossession: number;
  awayPossession: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeOffsides: number;
  awayOffsides: number;
  referee: string;
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
  cutout: string;
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

export interface MatchStatistic {
  name: string;
  homeValue: number | string;
  awayValue: number | string;
}

export interface H2HMatch {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
}

interface UseSportsDBMatchOptions {
  eventId?: string | null;
  searchTeams?: { homeTeam: string; awayTeam: string } | null;
  autoRefreshInterval?: number;
}

// Normalize team names for comparison
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+fc$/i, '')
    .replace(/^fc\s+/i, '')
    .replace(/\s+cf$/i, '')
    .replace(/\s+sc$/i, '')
    .replace(/\s+afc$/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

const teamsMatch = (name1: string, name2: string): boolean => {
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);
  if (n1 === n2) return true;
  if (n1.length >= 4 && n2.length >= 4) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  const words1 = n1.split(' ').filter(w => w.length > 3);
  const words2 = n2.split(' ').filter(w => w.length > 3);
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2) return true;
    }
  }
  return false;
};

// Map sport to TheSportsDB sport slug
const getSportSlugs = (category?: string): string[] => {
  const mapping: Record<string, string[]> = {
    'football': ['soccer'],
    'soccer': ['soccer'],
    'basketball': ['basketball'],
    'tennis': ['tennis'],
    'cricket': ['cricket'],
    'hockey': ['ice_hockey'],
    'baseball': ['baseball'],
    'rugby': ['rugby'],
    'american-football': ['american_football'],
  };
  return mapping[category?.toLowerCase() || ''] || ['soccer', 'basketball', 'cricket', 'tennis'];
};

export const useSportsDBMatch = (options: UseSportsDBMatchOptions) => {
  const { searchTeams, autoRefreshInterval = 60000 } = options;

  const [match, setMatch] = useState<SportsDBMatch | null>(null);
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [statistics, setStatistics] = useState<MatchStatistic[] | null>(null);
  const [h2h, setH2h] = useState<H2HMatch[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [foundEventId, setFoundEventId] = useState<string | null>(null);

  // Fetch live scores and find matching event
  const findLiveEvent = useCallback(async () => {
    if (!searchTeams) return null;

    const sports = getSportSlugs();

    for (const sport of sports) {
      try {
        const response = await fetch(
          `${BASE_URL}/v2/json/livescore/${sport}`,
          { headers: { 'X-API-KEY': API_KEY } }
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (!data.livescore) continue;

        const found = data.livescore.find((event: any) => {
          const homeMatch = teamsMatch(event.strHomeTeam, searchTeams.homeTeam);
          const awayMatch = teamsMatch(event.strAwayTeam, searchTeams.awayTeam);
          return homeMatch && awayMatch;
        });

        if (found) {
          console.log(`✅ Found live match: ${found.strHomeTeam} vs ${found.strAwayTeam}`);
          return found;
        }
      } catch (e) {
        console.warn(`Error fetching ${sport} live scores:`, e);
      }
    }
    return null;
  }, [searchTeams]);

  // Fetch event details by ID
  const fetchEventDetails = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/lookupevent.php?id=${eventId}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.events?.[0] || null;
    } catch (e) {
      console.warn('Error fetching event details:', e);
      return null;
    }
  }, []);

  // Fetch lineups
  const fetchLineups = useCallback(async (eventId: string): Promise<MatchLineups | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/lookuplineup.php?id=${eventId}`
      );
      if (!response.ok) return null;
      const data = await response.json();

      if (!data.lineup) return null;

      const homeLineup: LineupPlayer[] = [];
      const awayLineup: LineupPlayer[] = [];

      data.lineup.forEach((player: any) => {
        const lineupPlayer: LineupPlayer = {
          name: player.strPlayer || '',
          position: player.strPosition || '',
          positionShort: player.strPositionShort || '',
          number: player.intSquadNumber || '',
          isSub: player.strSubstitute === 'Yes',
          formation: player.strFormation || '',
          cutout: player.strCutout || '',
        };

        if (player.strHome === 'Yes') {
          homeLineup.push(lineupPlayer);
        } else {
          awayLineup.push(lineupPlayer);
        }
      });

      return { home: homeLineup, away: awayLineup };
    } catch (e) {
      console.warn('Error fetching lineups:', e);
      return null;
    }
  }, []);

  // Fetch timeline
  const fetchTimeline = useCallback(async (eventId: string): Promise<TimelineEvent[] | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/lookupeventtimeline.php?id=${eventId}`
      );
      if (!response.ok) return null;
      const data = await response.json();

      if (!data.timeline) return null;

      return data.timeline.map((event: any, index: number) => ({
        id: `${eventId}-${index}`,
        time: event.strTimeline || '',
        type: event.strTimelineDetail || '',
        player: event.strPlayer || '',
        team: event.strTeam || '',
        isHome: event.strHome === 'Yes',
        assist: event.strAssist || '',
        comment: event.strComment || '',
      }));
    } catch (e) {
      console.warn('Error fetching timeline:', e);
      return null;
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async (eventId: string): Promise<MatchStatistic[] | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/lookupeventstats.php?id=${eventId}`
      );
      if (!response.ok) return null;
      const data = await response.json();

      if (!data.eventstats) return null;

      return data.eventstats.map((stat: any) => ({
        name: stat.strStat || '',
        homeValue: stat.intHome || 0,
        awayValue: stat.intAway || 0,
      }));
    } catch (e) {
      console.warn('Error fetching statistics:', e);
      return null;
    }
  }, []);

  // Fetch H2H
  const fetchH2H = useCallback(async (homeTeam: string, awayTeam: string): Promise<H2HMatch[] | null> => {
    try {
      // Search for team IDs first
      const searchHome = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(homeTeam)}`
      );
      const homeData = await searchHome.json();
      const homeId = homeData.teams?.[0]?.idTeam;

      const searchAway = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(awayTeam)}`
      );
      const awayData = await searchAway.json();
      const awayId = awayData.teams?.[0]?.idTeam;

      if (!homeId || !awayId) return null;

      // Fetch past events between teams
      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/searchfilename.php?e=${encodeURIComponent(homeTeam)}_vs_${encodeURIComponent(awayTeam)}`
      );

      if (!response.ok) return null;
      const data = await response.json();

      if (!data.event) {
        // Try alternative search
        const altResponse = await fetch(
          `${BASE_URL}/v1/json/${API_KEY}/eventspastteam.php?id=${homeId}`
        );
        const altData = await altResponse.json();

        if (altData.results) {
          const h2hMatches = altData.results
            .filter((e: any) =>
              (teamsMatch(e.strHomeTeam, awayTeam) || teamsMatch(e.strAwayTeam, awayTeam)) &&
              e.intHomeScore !== null
            )
            .slice(0, 10)
            .map((e: any) => ({
              id: e.idEvent,
              date: e.dateEvent || '',
              homeTeam: e.strHomeTeam || '',
              awayTeam: e.strAwayTeam || '',
              homeScore: parseInt(e.intHomeScore) || 0,
              awayScore: parseInt(e.intAwayScore) || 0,
              league: e.strLeague || '',
            }));

          return h2hMatches.length > 0 ? h2hMatches : null;
        }
        return null;
      }

      return data.event
        .filter((e: any) => e.intHomeScore !== null)
        .slice(0, 10)
        .map((e: any) => ({
          id: e.idEvent,
          date: e.dateEvent || '',
          homeTeam: e.strHomeTeam || '',
          awayTeam: e.strAwayTeam || '',
          homeScore: parseInt(e.intHomeScore) || 0,
          awayScore: parseInt(e.intAwayScore) || 0,
          league: e.strLeague || '',
        }));
    } catch (e) {
      console.warn('Error fetching H2H:', e);
      return null;
    }
  }, []);

  // Parse match data from live event or event details
  const parseMatchData = useCallback((event: any, isLive: boolean): SportsDBMatch => {
    return {
      id: event.idEvent || '',
      homeTeam: event.strHomeTeam || '',
      awayTeam: event.strAwayTeam || '',
      homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
      status: event.strStatus || (isLive ? 'In Progress' : 'Scheduled'),
      progress: event.strProgress || null,
      isLive,
      venue: event.strVenue || '',
      date: event.dateEvent || '',
      time: event.strTime || event.strTimeLocal || '',
      league: event.strLeague || '',
      leagueBadge: event.strLeagueBadge || '',
      season: event.strSeason || '',
      round: event.intRound || '',
      homeTeamBadge: event.strHomeTeamBadge || '',
      awayTeamBadge: event.strAwayTeamBadge || '',
      homeFormation: event.strHomeFormation || '',
      awayFormation: event.strAwayFormation || '',
      homeGoalDetails: event.strHomeGoalDetails || '',
      awayGoalDetails: event.strAwayGoalDetails || '',
      homeRedCards: parseInt(event.intHomeRedCards) || 0,
      awayRedCards: parseInt(event.intAwayRedCards) || 0,
      homeYellowCards: parseInt(event.intHomeYellowCards) || 0,
      awayYellowCards: parseInt(event.intAwayYellowCards) || 0,
      homeShots: parseInt(event.intHomeShots) || 0,
      awayShots: parseInt(event.intAwayShots) || 0,
      homeShotsOnTarget: parseInt(event.intHomeShotsOnTarget) || 0,
      awayShotsOnTarget: parseInt(event.intAwayShotsOnTarget) || 0,
      homePossession: parseInt(event.strHomePossession) || 0,
      awayPossession: parseInt(event.strAwayPossession) || 0,
      homeCorners: parseInt(event.intHomeCorners) || 0,
      awayCorners: parseInt(event.intAwayCorners) || 0,
      homeFouls: parseInt(event.intHomeFouls) || 0,
      awayFouls: parseInt(event.intAwayFouls) || 0,
      homeOffsides: parseInt(event.intHomeOffsides) || 0,
      awayOffsides: parseInt(event.intAwayOffsides) || 0,
      referee: event.strReferee || '',
      thumbnail: event.strThumb || '',
      video: event.strVideo || '',
    };
  }, []);

  // Convert Perplexity data to our format
  const convertPerplexityData = useCallback((pData: PerplexityMatchData, homeTeam: string, awayTeam: string): SportsDBMatch => {
    return {
      id: `perplexity-${homeTeam}-${awayTeam}`,
      homeTeam,
      awayTeam,
      homeScore: pData.score.home,
      awayScore: pData.score.away,
      status: pData.status,
      progress: pData.matchTime,
      isLive: pData.status === 'live',
      venue: pData.venue || '',
      date: '',
      time: '',
      league: '',
      leagueBadge: '',
      season: '',
      round: '',
      homeTeamBadge: '',
      awayTeamBadge: '',
      homeFormation: pData.lineups?.homeFormation || '',
      awayFormation: pData.lineups?.awayFormation || '',
      homeGoalDetails: '',
      awayGoalDetails: '',
      homeRedCards: pData.statistics.redCards?.home || 0,
      awayRedCards: pData.statistics.redCards?.away || 0,
      homeYellowCards: pData.statistics.yellowCards?.home || 0,
      awayYellowCards: pData.statistics.yellowCards?.away || 0,
      homeShots: pData.statistics.shots?.home || 0,
      awayShots: pData.statistics.shots?.away || 0,
      homeShotsOnTarget: pData.statistics.shotsOnTarget?.home || 0,
      awayShotsOnTarget: pData.statistics.shotsOnTarget?.away || 0,
      homePossession: pData.statistics.possession?.home || 0,
      awayPossession: pData.statistics.possession?.away || 0,
      homeCorners: pData.statistics.corners?.home || 0,
      awayCorners: pData.statistics.corners?.away || 0,
      homeFouls: pData.statistics.fouls?.home || 0,
      awayFouls: pData.statistics.fouls?.away || 0,
      homeOffsides: pData.statistics.offsides?.home || 0,
      awayOffsides: pData.statistics.offsides?.away || 0,
      referee: pData.referee || '',
      thumbnail: '',
      video: '',
    };
  }, []);

  // Convert Perplexity lineups to our format
  const convertPerplexityLineups = useCallback((pLineups: NonNullable<PerplexityMatchData['lineups']>): MatchLineups => {
    return {
      home: pLineups.home.map((p) => ({
        name: p.name,
        position: p.position,
        positionShort: p.position.substring(0, 3).toUpperCase(),
        number: p.number,
        isSub: false,
        formation: pLineups.homeFormation || '',
        cutout: '',
      })),
      away: pLineups.away.map((p) => ({
        name: p.name,
        position: p.position,
        positionShort: p.position.substring(0, 3).toUpperCase(),
        number: p.number,
        isSub: false,
        formation: pLineups.awayFormation || '',
        cutout: '',
      })),
    };
  }, []);

  // Convert Perplexity events to timeline
  const convertPerplexityEvents = useCallback((events: PerplexityMatchData['events'], homeTeam: string, awayTeam: string): TimelineEvent[] => {
    return events.map((event, index) => ({
      id: `perplexity-event-${index}`,
      time: event.time,
      type: event.type === 'goal' ? 'Goal' : event.type === 'yellow_card' ? 'Yellow Card' : event.type === 'red_card' ? 'Red Card' : 'Substitution',
      player: event.player,
      team: event.team === 'home' ? homeTeam : awayTeam,
      isHome: event.team === 'home',
      assist: event.assist || '',
      comment: '',
    }));
  }, []);

  // Convert Perplexity H2H to our format
  const convertPerplexityH2H = useCallback((h2hData: PerplexityMatchData['h2h']): H2HMatch[] => {
    return h2hData.map((match, index) => ({
      id: `perplexity-h2h-${index}`,
      date: match.date,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      league: match.competition,
    }));
  }, []);

  // Main fetch function
  const refetch = useCallback(async () => {
    if (!searchTeams) return;

    setIsLoading(true);
    setError(null);

    try {
      // First try TheSportsDB live scores
      const liveEvent = await findLiveEvent();

      if (liveEvent) {
        const matchData = parseMatchData(liveEvent, true);
        setMatch(matchData);
        setFoundEventId(liveEvent.idEvent);

        // Fetch additional data in parallel
        const [lineupsData, timelineData, statsData, h2hData] = await Promise.all([
          fetchLineups(liveEvent.idEvent),
          fetchTimeline(liveEvent.idEvent),
          fetchStatistics(liveEvent.idEvent),
          fetchH2H(liveEvent.strHomeTeam, liveEvent.strAwayTeam),
        ]);

        setLineups(lineupsData);
        setTimeline(timelineData);
        setStatistics(statsData);
        setH2h(h2hData);
        setLastUpdated(new Date());

        console.log('✅ Match data loaded from TheSportsDB');
      } else {
        // TheSportsDB doesn't have the match - use Perplexity AI
        console.log('🔄 TheSportsDB has no data, trying Perplexity AI...');

        const perplexityData = await fetchMatchDataFromPerplexity(
          searchTeams.homeTeam,
          searchTeams.awayTeam
        );

        if (perplexityData) {
          // Convert and set match data
          const matchData = convertPerplexityData(perplexityData, searchTeams.homeTeam, searchTeams.awayTeam);
          setMatch(matchData);

          // Set lineups if available
          if (perplexityData.lineups) {
            setLineups(convertPerplexityLineups(perplexityData.lineups));
          }

          // Set timeline events if available
          if (perplexityData.events && perplexityData.events.length > 0) {
            setTimeline(convertPerplexityEvents(perplexityData.events, searchTeams.homeTeam, searchTeams.awayTeam));
          }

          // Set H2H if available
          if (perplexityData.h2h && perplexityData.h2h.length > 0) {
            setH2h(convertPerplexityH2H(perplexityData.h2h));
          } else {
            // Try to fetch H2H separately
            const h2hData = await fetchH2HFromPerplexity(searchTeams.homeTeam, searchTeams.awayTeam);
            if (h2hData) {
              setH2h(convertPerplexityH2H(h2hData));
            }
          }

          console.log('✅ Match data loaded from Perplexity AI');
        } else {
          // Try to at least get H2H from Perplexity
          const h2hData = await fetchH2HFromPerplexity(searchTeams.homeTeam, searchTeams.awayTeam);
          if (h2hData) {
            setH2h(convertPerplexityH2H(h2hData));
          } else {
            // Last resort - try TheSportsDB H2H
            const sportsDbH2h = await fetchH2H(searchTeams.homeTeam, searchTeams.awayTeam);
            setH2h(sportsDbH2h);
          }
        }

        setLastUpdated(new Date());
      }
    } catch (e: any) {
      console.error('Error fetching match data:', e);
      setError(e.message || 'Failed to fetch match data');
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTeams,
    findLiveEvent,
    parseMatchData,
    fetchLineups,
    fetchTimeline,
    fetchStatistics,
    fetchH2H,
    convertPerplexityData,
    convertPerplexityLineups,
    convertPerplexityEvents,
    convertPerplexityH2H,
  ]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!searchTeams) return;

    refetch();

    const interval = setInterval(refetch, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [searchTeams?.homeTeam, searchTeams?.awayTeam, autoRefreshInterval]);

  return {
    match,
    lineups,
    timeline,
    statistics,
    h2h,
    isLoading,
    error,
    lastUpdated,
    foundEventId,
    refetch,
  };
};
