import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Match, Sport } from '../../types/sports';
import { CircleDot, Dribbble, Trophy, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

interface SportFilterPillsProps {
  allMatches: Match[];
  sports: Sport[];
  activeSportFilter: string;
  onSportFilterChange: (sportId: string) => void;
  activeTournamentFilter?: string;
  onTournamentFilterChange?: (tournament: string) => void;
}

const SportFilterPills: React.FC<SportFilterPillsProps> = ({
  allMatches,
  sports,
  activeSportFilter,
  onSportFilterChange,
  activeTournamentFilter = 'all',
  onTournamentFilterChange
}) => {
  const [showTournaments, setShowTournaments] = useState(false);

  // Get all sport IDs from the sports list
  const getAllSportIds = (): string[] => {
    return sports.map(sport => sport.id);
  };

  // Get unique tournaments from matches
  const tournaments = useMemo(() => {
    const tournamentSet = new Set<string>();
    allMatches.forEach(match => {
      if (match.tournament) {
        tournamentSet.add(match.tournament);
      }
    });
    return Array.from(tournamentSet).sort();
  }, [allMatches]);

  // Get sport name by ID
  const getSportName = (sportId: string): string => {
    const sport = sports.find(s => s.id === sportId);
    if (sport) return sport.name;
    
    // Default mappings for common sport IDs
    const sportMappings: Record<string, string> = {
      '1': 'Football',
      '2': 'Basketball',
      'football': 'Football',
      'basketball': 'Basketball'
    };
    
    return sportMappings[sportId] || 'Other Sports';
  };

  // Get sport icon by ID
  const getSportIcon = (sportId: string) => {
    switch(sportId) {
      case '1':
      case 'football':
        return <CircleDot size={16} />;
      case '2':
      case 'basketball':
        return <Dribbble size={16} />;
      default:
        return null;
    }
  };

  // Get match count for a sport
  const getMatchCount = (sportId: string): number => {
    if (sportId === 'all') return allMatches.length;
    return allMatches.filter(m => m.sportId === sportId).length;
  };

  // Get match count for a tournament
  const getTournamentMatchCount = (tournament: string): number => {
    if (tournament === 'all') return allMatches.length;
    return allMatches.filter(m => m.tournament === tournament).length;
  };

  if (allMatches.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {/* Sport Filter Pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className={`${
              activeSportFilter === 'all' 
                ? 'bg-sports-primary/20 border-sports-primary text-sports-primary' 
                : 'bg-muted border-border text-foreground hover:border-sports-primary/50'
            } whitespace-nowrap`}
            onClick={() => onSportFilterChange('all')}
          >
            All Sports
            <span className="ml-1.5 text-[10px] opacity-70">({getMatchCount('all')})</span>
          </Button>
          {getAllSportIds().map(sportId => {
            const count = getMatchCount(sportId);
            if (count === 0) return null;
            return (
              <Button
                key={`filter-${sportId}`}
                variant="outline"
                size="sm"
                className={`${
                  activeSportFilter === sportId 
                    ? 'bg-sports-primary/20 border-sports-primary text-sports-primary' 
                    : 'bg-muted border-border text-foreground hover:border-sports-primary/50'
                } whitespace-nowrap flex items-center gap-1`}
                onClick={() => onSportFilterChange(sportId)}
              >
                {getSportIcon(sportId)}
                {getSportName(sportId)}
                <span className="ml-1 text-[10px] opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Tournament Filter Toggle */}
      {tournaments.length > 0 && onTournamentFilterChange && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTournaments(!showTournaments)}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <Trophy size={14} />
            Filter by Tournament
            {showTournaments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {activeTournamentFilter !== 'all' && (
              <span className="bg-sports-primary text-white text-[10px] px-1.5 py-0.5 rounded">
                1 active
              </span>
            )}
          </Button>

          {showTournaments && (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${
                    activeTournamentFilter === 'all'
                      ? 'bg-sports-primary/20 border-sports-primary text-sports-primary'
                      : 'bg-muted border-border text-foreground hover:border-sports-primary/50'
                  } whitespace-nowrap text-xs`}
                  onClick={() => onTournamentFilterChange('all')}
                >
                  All Tournaments
                </Button>
                {tournaments.slice(0, 15).map(tournament => (
                  <Button
                    key={tournament}
                    variant="outline"
                    size="sm"
                    className={`${
                      activeTournamentFilter === tournament
                        ? 'bg-sports-primary/20 border-sports-primary text-sports-primary'
                        : 'bg-muted border-border text-foreground hover:border-sports-primary/50'
                    } whitespace-nowrap text-xs flex items-center gap-1`}
                    onClick={() => onTournamentFilterChange(tournament)}
                  >
                    <Trophy size={12} />
                    {tournament}
                    <span className="text-[10px] opacity-70">({getTournamentMatchCount(tournament)})</span>
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default SportFilterPills;
