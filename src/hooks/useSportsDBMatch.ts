import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchMatchDataFromPerplexity,
  fetchH2HFromPerplexity,
  fetchLineupsFromPerplexity,
  fetchStandingsFromPerplexity,
  fetchMatchExtrasFromPerplexity,
  PerplexityMatchData,
  MatchExtras,
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

export interface StandingsEntry {
  rank: number;
  teamId: string;
  team: string;
  teamBadge: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface UseSportsDBMatchOptions {
  eventId?: string | null;
  searchTeams?: { homeTeam: string; awayTeam: string } | null;
  autoRefreshInterval?: number;
  category?: string;
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
    'afl': ['australian_football'],
    'motor-sports': ['motorsport'],
    'fight': ['boxing'],
    'billiards': [],
    'darts': ['darts'],
    'golf': ['golf'],
  };
  const cat = category?.toLowerCase() || '';
  if (cat && mapping[cat]) return mapping[cat];
  // No category — check the most popular sports
  return ['soccer', 'basketball', 'ice_hockey', 'baseball', 'american_football', 'cricket', 'rugby', 'tennis'];
};

export const useSportsDBMatch = (options: UseSportsDBMatchOptions) => {
  const { searchTeams, autoRefreshInterval = 60000, category } = options;

  const [match, setMatch] = useState<SportsDBMatch | null>(null);
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [statistics, setStatistics] = useState<MatchStatistic[] | null>(null);
  const [h2h, setH2h] = useState<H2HMatch[] | null>(null);
  const [standings, setStandings] = useState<StandingsEntry[] | null>(null);
  const [extras, setExtras] = useState<MatchExtras | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [foundEventId, setFoundEventId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'thesportsdb' | 'perplexity' | null>(null);

  // Use refs for stable values in callbacks — prevents stale closures & re-creation
  const searchTeamsRef = useRef(searchTeams);
  searchTeamsRef.current = searchTeams;
  const categoryRef = useRef(category);
  categoryRef.current = category;
  const abortRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);

  // ─── Pure helper functions (no hooks, no deps) ───

  const parseProgress = (progress: string | null | undefined): string | null => {
    if (!progress) return null;
    const p = progress.trim();
    if (/^(HT|FT|AET|PEN)$/i.test(p)) return p.toUpperCase();
    const stoppageMatch = p.match(/^(\d+)\+(\d+)$/);
    if (stoppageMatch) return String(parseInt(stoppageMatch[1]) + parseInt(stoppageMatch[2]));
    if (/^\d+$/.test(p)) return p;
    return p;
  };

  const parseMatchData = (event: any, isLive: boolean): SportsDBMatch => ({
    id: event.idEvent || '',
    homeTeam: event.strHomeTeam || '',
    awayTeam: event.strAwayTeam || '',
    homeScore: event.intHomeScore !== null && event.intHomeScore !== undefined ? parseInt(event.intHomeScore) : null,
    awayScore: event.intAwayScore !== null && event.intAwayScore !== undefined ? parseInt(event.intAwayScore) : null,
    status: event.strStatus || (isLive ? 'In Progress' : 'Scheduled'),
    progress: parseProgress(event.strProgress),
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
  });

  const convertPerplexityData = (pData: PerplexityMatchData, homeTeam: string, awayTeam: string): SportsDBMatch => ({
    id: `perplexity-${homeTeam}-${awayTeam}`,
    homeTeam,
    awayTeam,
    homeScore: pData.score.home,
    awayScore: pData.score.away,
    status: pData.status,
    progress: pData.matchTime,
    isLive: pData.status === 'live',
    venue: pData.venue || '',
    date: '', time: '', league: '', leagueBadge: '', season: '', round: '',
    homeTeamBadge: '', awayTeamBadge: '',
    homeFormation: pData.lineups?.homeFormation || '',
    awayFormation: pData.lineups?.awayFormation || '',
    homeGoalDetails: '', awayGoalDetails: '',
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
    thumbnail: '', video: '',
  });

  const convertPerplexityLineups = (pLineups: NonNullable<PerplexityMatchData['lineups']>): MatchLineups => ({
    home: pLineups.home.map((p) => ({
      name: p.name, position: p.position,
      positionShort: p.position.substring(0, 3).toUpperCase(),
      number: p.number, isSub: false, formation: pLineups.homeFormation || '', cutout: '',
    })),
    away: pLineups.away.map((p) => ({
      name: p.name, position: p.position,
      positionShort: p.position.substring(0, 3).toUpperCase(),
      number: p.number, isSub: false, formation: pLineups.awayFormation || '', cutout: '',
    })),
  });

  const convertPerplexityEvents = (events: PerplexityMatchData['events'], homeTeam: string, awayTeam: string): TimelineEvent[] =>
    events.map((event, index) => ({
      id: `perplexity-event-${index}`,
      time: event.time,
      type: event.type === 'goal' ? 'Goal' : event.type === 'yellow_card' ? 'Yellow Card' : event.type === 'red_card' ? 'Red Card' : 'Substitution',
      player: event.player,
      team: event.team === 'home' ? homeTeam : awayTeam,
      isHome: event.team === 'home',
      assist: event.assist || '', comment: '',
    }));

  const convertPerplexityH2H = (h2hData: PerplexityMatchData['h2h']): H2HMatch[] =>
    h2hData.map((m, index) => ({
      id: `perplexity-h2h-${index}`,
      date: m.date, homeTeam: m.homeTeam, awayTeam: m.awayTeam,
      homeScore: m.homeScore, awayScore: m.awayScore, league: m.competition,
    }));

  // ─── API fetch functions ───

  const findLiveEvent = async (home: string, away: string, cat?: string): Promise<any> => {
    const sports = getSportSlugs(cat);
    for (const sport of sports) {
      try {
        const response = await fetch(
          `${BASE_URL}/v2/json/livescore/${sport}`,
          { headers: { 'X_API_KEY': API_KEY } }
        );
        if (!response.ok) continue;
        const data = await response.json();
        if (!data.livescore) continue;

        const found = data.livescore.find((event: any) => {
          return teamsMatch(event.strHomeTeam, home) && teamsMatch(event.strAwayTeam, away);
        });
        if (found) {
          console.log(`✅ Found live match: ${found.strHomeTeam} vs ${found.strAwayTeam} [${sport}]`);
          return found;
        }
      } catch (e) {
        console.warn(`Error fetching ${sport} live scores:`, e);
      }
    }
    return null;
  };

  const fetchLineups = async (eventId: string): Promise<MatchLineups | null> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/json/${API_KEY}/lookuplineup.php?id=${eventId}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.lineup) return null;
      const homeLineup: LineupPlayer[] = [];
      const awayLineup: LineupPlayer[] = [];
      data.lineup.forEach((player: any) => {
        const lp: LineupPlayer = {
          name: player.strPlayer || '', position: player.strPosition || '',
          positionShort: player.strPositionShort || '', number: player.intSquadNumber || '',
          isSub: player.strSubstitute === 'Yes', formation: player.strFormation || '', cutout: player.strCutout || '',
        };
        if (player.strHome === 'Yes') homeLineup.push(lp); else awayLineup.push(lp);
      });
      return { home: homeLineup, away: awayLineup };
    } catch (e) { console.warn('Error fetching lineups:', e); return null; }
  };

  const fetchTimeline = async (eventId: string): Promise<TimelineEvent[] | null> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/json/${API_KEY}/lookupeventtimeline.php?id=${eventId}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.timeline) return null;
      return data.timeline.map((event: any, index: number) => ({
        id: `${eventId}-${index}`, time: event.strTimeline || '', type: event.strTimelineDetail || '',
        player: event.strPlayer || '', team: event.strTeam || '', isHome: event.strHome === 'Yes',
        assist: event.strAssist || '', comment: event.strComment || '',
      }));
    } catch (e) { console.warn('Error fetching timeline:', e); return null; }
  };

  const fetchStatistics = async (eventId: string): Promise<MatchStatistic[] | null> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/json/${API_KEY}/lookupeventstats.php?id=${eventId}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.eventstats) return null;
      return data.eventstats.map((stat: any) => ({
        name: stat.strStat || '', homeValue: stat.intHome || 0, awayValue: stat.intAway || 0,
      }));
    } catch (e) { console.warn('Error fetching statistics:', e); return null; }
  };

  const fetchH2H = async (homeTeam: string, awayTeam: string): Promise<H2HMatch[] | null> => {
    try {
      const [searchHome, searchAway] = await Promise.all([
        fetch(`${BASE_URL}/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(homeTeam)}`).then(r => r.json()),
        fetch(`${BASE_URL}/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(awayTeam)}`).then(r => r.json()),
      ]);
      const homeId = searchHome.teams?.[0]?.idTeam;
      const awayId = searchAway.teams?.[0]?.idTeam;
      if (!homeId || !awayId) return null;

      const response = await fetch(
        `${BASE_URL}/v1/json/${API_KEY}/searchfilename.php?e=${encodeURIComponent(homeTeam)}_vs_${encodeURIComponent(awayTeam)}`
      );
      if (!response.ok) return null;
      const data = await response.json();

      const events = data.event || null;
      if (!events) {
        const altResponse = await fetch(`${BASE_URL}/v1/json/${API_KEY}/eventspastteam.php?id=${homeId}`);
        const altData = await altResponse.json();
        if (altData.results) {
          const h2hMatches = altData.results
            .filter((e: any) => (teamsMatch(e.strHomeTeam, awayTeam) || teamsMatch(e.strAwayTeam, awayTeam)) && e.intHomeScore !== null)
            .slice(0, 10)
            .map((e: any) => ({
              id: e.idEvent, date: e.dateEvent || '', homeTeam: e.strHomeTeam || '',
              awayTeam: e.strAwayTeam || '', homeScore: parseInt(e.intHomeScore) || 0,
              awayScore: parseInt(e.intAwayScore) || 0, league: e.strLeague || '',
            }));
          return h2hMatches.length > 0 ? h2hMatches : null;
        }
        return null;
      }

      return events
        .filter((e: any) => e.intHomeScore !== null).slice(0, 10)
        .map((e: any) => ({
          id: e.idEvent, date: e.dateEvent || '', homeTeam: e.strHomeTeam || '',
          awayTeam: e.strAwayTeam || '', homeScore: parseInt(e.intHomeScore) || 0,
          awayScore: parseInt(e.intAwayScore) || 0, league: e.strLeague || '',
        }));
    } catch (e) { console.warn('Error fetching H2H:', e); return null; }
  };

  const fetchTeamBadge = async (teamName: string): Promise<string> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`);
      if (!response.ok) return '';
      const data = await response.json();
      return data.teams?.[0]?.strBadge || data.teams?.[0]?.strTeamBadge || '';
    } catch { return ''; }
  };

  const fetchStandingsFromDB = async (leagueId: string, season: string): Promise<StandingsEntry[] | null> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/json/${API_KEY}/lookuptable.php?l=${leagueId}&s=${season}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.table) return null;
      return data.table.map((entry: any) => ({
        rank: parseInt(entry.intRank) || 0, teamId: entry.idTeam || '', team: entry.strTeam || '',
        teamBadge: entry.strTeamBadge || '', played: parseInt(entry.intPlayed) || 0,
        wins: parseInt(entry.intWin) || 0, draws: parseInt(entry.intDraw) || 0,
        losses: parseInt(entry.intLoss) || 0, goalsFor: parseInt(entry.intGoalsFor) || 0,
        goalsAgainst: parseInt(entry.intGoalsAgainst) || 0, goalDifference: parseInt(entry.intGoalDifference) || 0,
        points: parseInt(entry.intPoints) || 0,
      }));
    } catch (e) { console.warn('Error fetching standings:', e); return null; }
  };

  // ─── Main fetch: single stable function using refs ───

  const refetch = useCallback(async () => {
    const teams = searchTeamsRef.current;
    if (!teams) return;

    // Cancel any in-flight fetch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const fetchId = ++fetchCountRef.current;

    setIsLoading(true);
    setError(null);

    // Helper to check if this fetch is still current
    const isCancelled = () => fetchCountRef.current !== fetchId;

    try {
      const home = teams.homeTeam;
      const away = teams.awayTeam;
      const cat = categoryRef.current;

      // ── Step 1: Try TheSportsDB live scores ──
      const liveEvent = await findLiveEvent(home, away, cat);
      if (isCancelled()) return;

      if (liveEvent) {
        const matchData = parseMatchData(liveEvent, true);
        setMatch(matchData);
        setFoundEventId(liveEvent.idEvent);
        setDataSource('thesportsdb');

        // Fetch additional data in parallel
        const needHomeBadge = !matchData.homeTeamBadge;
        const needAwayBadge = !matchData.awayTeamBadge;

        const [lineupsData, timelineData, statsData, h2hData, homeBadge, awayBadge] = await Promise.all([
          fetchLineups(liveEvent.idEvent),
          fetchTimeline(liveEvent.idEvent),
          fetchStatistics(liveEvent.idEvent),
          fetchH2H(liveEvent.strHomeTeam, liveEvent.strAwayTeam),
          needHomeBadge ? fetchTeamBadge(liveEvent.strHomeTeam) : Promise.resolve(''),
          needAwayBadge ? fetchTeamBadge(liveEvent.strAwayTeam) : Promise.resolve(''),
        ]);

        if (isCancelled()) return;

        // Update match with badges if they were fetched
        if (homeBadge || awayBadge) {
          setMatch(prev => prev ? {
            ...prev,
            homeTeamBadge: homeBadge || prev.homeTeamBadge,
            awayTeamBadge: awayBadge || prev.awayTeamBadge,
          } : prev);
        }

        if (lineupsData) setLineups(lineupsData);
        if (timelineData) setTimeline(timelineData);
        if (statsData) setStatistics(statsData);
        if (h2hData) setH2h(h2hData);
        setLastUpdated(new Date());

        // Standings
        if (liveEvent.idLeague && liveEvent.strSeason) {
          const standingsData = await fetchStandingsFromDB(liveEvent.idLeague, liveEvent.strSeason);
          if (!isCancelled() && standingsData) setStandings(standingsData);
        }

        // Also fetch extras from Perplexity (form, prediction) to enrich TheSportsDB data
        try {
          const extrasData = await fetchMatchExtrasFromPerplexity(home, away);
          if (!isCancelled() && extrasData) setExtras(extrasData);
        } catch { /* non-critical */ }

        console.log('✅ Match data loaded from TheSportsDB');
        return;
      }

      // ── Step 2: Fallback to Perplexity AI ──
      console.log('🔄 TheSportsDB has no live data, trying Perplexity AI...');
      setDataSource('perplexity');

      const withRetry = async <T,>(fn: () => Promise<T | null>, label: string): Promise<T | null> => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const result = await fn();
            if (result) return result;
          } catch (e) {
            console.warn(`⚠️ ${label} attempt ${attempt + 1} failed:`, e);
          }
        }
        return null;
      };

      const [perplexityData, pLineupsData, pH2hData, pStandingsData, extrasData] = await Promise.all([
        withRetry(() => fetchMatchDataFromPerplexity(home, away), 'matchData'),
        withRetry(() => fetchLineupsFromPerplexity(home, away), 'lineups'),
        withRetry(() => fetchH2HFromPerplexity(home, away), 'h2h'),
        withRetry(() => fetchStandingsFromPerplexity('', home, away), 'standings'),
        withRetry(() => fetchMatchExtrasFromPerplexity(home, away), 'extras'),
      ]);

      if (isCancelled()) return;

      if (perplexityData) {
        setMatch(convertPerplexityData(perplexityData, home, away));
        if (perplexityData.lineups) setLineups(convertPerplexityLineups(perplexityData.lineups));
        else if (pLineupsData) setLineups(convertPerplexityLineups(pLineupsData));
        if (perplexityData.events?.length > 0) setTimeline(convertPerplexityEvents(perplexityData.events, home, away));
        if (perplexityData.h2h?.length > 0) setH2h(convertPerplexityH2H(perplexityData.h2h));
        else if (pH2hData) setH2h(convertPerplexityH2H(pH2hData));
      } else {
        if (pLineupsData) setLineups(convertPerplexityLineups(pLineupsData));
        if (pH2hData) setH2h(convertPerplexityH2H(pH2hData));
      }

      if (extrasData) setExtras(extrasData);
      if (pStandingsData) {
        setStandings(pStandingsData.map((entry, idx) => ({
          rank: entry.rank || idx + 1, teamId: `perplexity-${idx}`, team: entry.team,
          teamBadge: '', played: entry.played, wins: entry.wins, draws: entry.draws,
          losses: entry.losses, goalsFor: entry.goalsFor, goalsAgainst: entry.goalsAgainst,
          goalDifference: entry.goalDifference, points: entry.points,
        })));
      }

      setLastUpdated(new Date());
    } catch (e: any) {
      if (!isCancelled()) {
        console.error('Error fetching match data:', e);
        setError(e.message || 'Failed to fetch match data');
      }
    } finally {
      if (!isCancelled()) {
        setIsLoading(false);
      }
    }
  }, []); // No deps — uses refs for all mutable values

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!searchTeams) return;

    // Reset all state when teams change
    setMatch(null);
    setLineups(null);
    setTimeline(null);
    setStatistics(null);
    setH2h(null);
    setStandings(null);
    setExtras(null);
    setDataSource(null);
    setError(null);
    setFoundEventId(null);

    refetch();

    const interval = setInterval(refetch, autoRefreshInterval);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [searchTeams?.homeTeam, searchTeams?.awayTeam, autoRefreshInterval, refetch]);

  return {
    match,
    lineups,
    timeline,
    statistics,
    h2h,
    standings,
    extras,
    isLoading,
    error,
    lastUpdated,
    foundEventId,
    dataSource,
    refetch,
  };
};
