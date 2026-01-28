import React from 'react';
import { H2HMatch } from '@/hooks/useSportsDBMatch';
import { Trophy, History } from 'lucide-react';
import { format } from 'date-fns';

interface HeadToHeadProps {
  h2h: H2HMatch[];
  homeTeam: string;
  awayTeam: string;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ h2h, homeTeam, awayTeam }) => {
  if (!h2h || h2h.length === 0) {
    return null;
  }

  // Calculate H2H summary
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  h2h.forEach((match) => {
    if (match.homeScore > match.awayScore) {
      // Check if home team in this match is our home team
      if (match.homeTeam.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) ||
          homeTeam.toLowerCase().includes(match.homeTeam.toLowerCase().split(' ')[0])) {
        homeWins++;
      } else {
        awayWins++;
      }
    } else if (match.awayScore > match.homeScore) {
      if (match.awayTeam.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) ||
          homeTeam.toLowerCase().includes(match.awayTeam.toLowerCase().split(' ')[0])) {
        homeWins++;
      } else {
        awayWins++;
      }
    } else {
      draws++;
    }
  });

  const formatMatchDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Head to Head</h3>
        </div>
      </div>

      {/* H2H Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-border bg-muted/30">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{homeWins}</div>
          <div className="text-xs text-muted-foreground truncate">{homeTeam}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">{draws}</div>
          <div className="text-xs text-muted-foreground">Draws</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{awayWins}</div>
          <div className="text-xs text-muted-foreground truncate">{awayTeam}</div>
        </div>
      </div>

      {/* Match List */}
      <div className="divide-y divide-border">
        {h2h.slice(0, 5).map((match, index) => {
          const isHomeWin = match.homeScore > match.awayScore;
          const isAwayWin = match.awayScore > match.homeScore;
          const isDraw = match.homeScore === match.awayScore;

          return (
            <div key={match.id || index} className="p-3 hover:bg-muted/30 transition-colors">
              {/* Date and League */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-muted-foreground">{formatMatchDate(match.date)}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{match.league}</span>
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 text-right ${isHomeWin ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                  <span className="text-sm truncate block">{match.homeTeam}</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 rounded bg-muted/50 min-w-[60px] justify-center">
                  <span className={`text-sm font-bold ${isHomeWin ? 'text-primary' : 'text-foreground'}`}>
                    {match.homeScore}
                  </span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className={`text-sm font-bold ${isAwayWin ? 'text-primary' : 'text-foreground'}`}>
                    {match.awayScore}
                  </span>
                </div>

                <div className={`flex-1 text-left ${isAwayWin ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                  <span className="text-sm truncate block">{match.awayTeam}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {h2h.length > 5 && (
        <div className="p-3 text-center border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing last 5 of {h2h.length} matches
          </span>
        </div>
      )}
    </div>
  );
};

export default HeadToHead;
