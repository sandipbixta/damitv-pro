import React, { useMemo } from 'react';
import { Match } from '@/types/sports';
import { Loader2, RefreshCw, MapPin, Calendar, User, Clock } from 'lucide-react';
import { useSportsDBMatch } from '@/hooks/useSportsDBMatch';
import LiveMatchData from './LiveMatchData';
import MatchEventsTimeline from './MatchEventsTimeline';
import TeamLineups from './TeamLineups';
import MatchStats from './MatchStats';
import HeadToHead from './HeadToHead';
import { format } from 'date-fns';

interface MatchAnalysisProps {
  match: Match;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ match }) => {
  const homeTeam = match.teams?.home?.name || '';
  const awayTeam = match.teams?.away?.name || '';
  const displayHomeTeam = homeTeam || 'Home Team';
  const displayAwayTeam = awayTeam || 'Away Team';

  // Memoize search teams to prevent infinite re-renders
  const searchTeams = useMemo(() => {
    if (homeTeam && awayTeam) {
      return { homeTeam, awayTeam };
    }
    return null;
  }, [homeTeam, awayTeam]);

  // Fetch match data from TheSportsDB
  const {
    match: sportsDBMatch,
    lineups,
    timeline,
    statistics,
    h2h,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useSportsDBMatch({
    searchTeams,
    autoRefreshInterval: 60000, // Auto-refresh every 60 seconds
  });

  // Format match date
  const formatMatchDate = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'EEEE, MMMM do yyyy');
    } catch {
      return '';
    }
  };

  const formatMatchTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Loading Indicator */}
      {isLoading && !sportsDBMatch && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading match data...</span>
        </div>
      )}

      {/* Match Info Card - Always Show */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Match Info</h3>
          </div>
          {lastUpdated && (
            <button
              onClick={refetch}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Updated {format(lastUpdated, 'HH:mm')}</span>
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Date */}
            {match.date && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Date</span>
                <span className="text-sm font-medium text-foreground">
                  {formatMatchDate(match.date)}
                </span>
              </div>
            )}

            {/* Time */}
            {match.date && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Kick-off</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMatchTime(match.date)}
                </span>
              </div>
            )}

            {/* Venue */}
            {sportsDBMatch?.venue && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Venue</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {sportsDBMatch.venue}
                </span>
              </div>
            )}

            {/* Referee */}
            {sportsDBMatch?.referee && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Referee</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {sportsDBMatch.referee}
                </span>
              </div>
            )}

            {/* League */}
            {(sportsDBMatch?.league || match.category) && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Competition</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {sportsDBMatch?.league || match.category}
                </span>
              </div>
            )}

            {/* Round */}
            {sportsDBMatch?.round && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Round</span>
                <span className="text-sm font-medium text-foreground">
                  Matchday {sportsDBMatch.round}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Match Data Display */}
      {sportsDBMatch && (
        <LiveMatchData
          match={sportsDBMatch}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Match Statistics */}
      {sportsDBMatch && (
        <MatchStats
          match={sportsDBMatch}
          statistics={statistics}
          homeTeam={displayHomeTeam}
          awayTeam={displayAwayTeam}
        />
      )}

      {/* Match Events Timeline */}
      {timeline && timeline.length > 0 && (
        <MatchEventsTimeline
          timeline={timeline}
          homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
          awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
        />
      )}

      {/* Team Lineups */}
      {lineups && (lineups.home.length > 0 || lineups.away.length > 0) && (
        <TeamLineups
          lineups={lineups}
          homeTeam={sportsDBMatch?.homeTeam || displayHomeTeam}
          awayTeam={sportsDBMatch?.awayTeam || displayAwayTeam}
          homeFormation={sportsDBMatch?.homeFormation}
          awayFormation={sportsDBMatch?.awayFormation}
        />
      )}

      {/* Head to Head */}
      {h2h && h2h.length > 0 && (
        <HeadToHead
          h2h={h2h}
          homeTeam={displayHomeTeam}
          awayTeam={displayAwayTeam}
        />
      )}

      {/* No Data Message */}
      {!isLoading && !sportsDBMatch && !h2h && (
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Match statistics will be available when the match starts.
          </p>
          <button
            onClick={refetch}
            className="mt-3 text-primary text-sm hover:underline flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Check for updates
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchAnalysis;
