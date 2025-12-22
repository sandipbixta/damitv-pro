import React from 'react';
import { RefreshCw, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SportsDBMatch } from '@/hooks/useSportsDBMatch';

interface LiveMatchDataProps {
  match: SportsDBMatch;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const LiveMatchData: React.FC<LiveMatchDataProps> = ({
  match,
  lastUpdated,
  isLoading,
  onRefresh,
}) => {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header with Live Badge */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{match.league}</span>
          {match.round && (
            <span className="text-xs text-muted-foreground">Round {match.round}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {match.isLive && (
            <span className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-bold uppercase">
              <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
              Live
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Score Display */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            {match.homeTeamBadge && (
              <img
                src={match.homeTeamBadge}
                alt={match.homeTeam}
                className="w-16 h-16 mx-auto mb-2 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <h3 className="font-bold text-foreground text-lg">{match.homeTeam}</h3>
            {match.homeFormation && (
              <span className="text-xs text-muted-foreground">{match.homeFormation}</span>
            )}
          </div>

          {/* Score */}
          <div className="text-center px-6">
            {hasScore ? (
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-foreground">{match.homeScore}</span>
                <span className="text-2xl text-muted-foreground">-</span>
                <span className="text-5xl font-bold text-foreground">{match.awayScore}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">vs</div>
            )}
            {match.progress && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-primary">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-bold">{match.progress}</span>
              </div>
            )}
            {!match.isLive && match.status && (
              <span className="text-sm text-muted-foreground mt-2 block">{match.status}</span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            {match.awayTeamBadge && (
              <img
                src={match.awayTeamBadge}
                alt={match.awayTeam}
                className="w-16 h-16 mx-auto mb-2 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <h3 className="font-bold text-foreground text-lg">{match.awayTeam}</h3>
            {match.awayFormation && (
              <span className="text-xs text-muted-foreground">{match.awayFormation}</span>
            )}
          </div>
        </div>

        {/* Venue and Last Updated */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          {match.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{match.venue}</span>
            </div>
          )}
          {lastUpdated && (
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchData;
