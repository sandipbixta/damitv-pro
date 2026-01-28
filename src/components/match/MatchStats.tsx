import React from 'react';
import { SportsDBMatch, MatchStatistic } from '@/hooks/useSportsDBMatch';
import { BarChart3 } from 'lucide-react';

interface MatchStatsProps {
  match: SportsDBMatch;
  statistics?: MatchStatistic[] | null;
  homeTeam: string;
  awayTeam: string;
}

interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  isPercentage?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({ label, homeValue, awayValue, isPercentage }) => {
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-foreground">
          {homeValue}{isPercentage ? '%' : ''}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold text-foreground">
          {awayValue}{isPercentage ? '%' : ''}
        </span>
      </div>
      <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-muted/30">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-l-full"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-muted-foreground/50 transition-all duration-500 rounded-r-full"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
};

const MatchStats: React.FC<MatchStatsProps> = ({ match, statistics, homeTeam, awayTeam }) => {
  // Build stats from match data or statistics array
  const stats: { label: string; home: number; away: number; isPercentage?: boolean }[] = [];

  // Add possession if available
  if (match.homePossession > 0 || match.awayPossession > 0) {
    stats.push({
      label: 'Possession',
      home: match.homePossession,
      away: match.awayPossession,
      isPercentage: true,
    });
  }

  // Add shots
  if (match.homeShots > 0 || match.awayShots > 0) {
    stats.push({
      label: 'Total Shots',
      home: match.homeShots,
      away: match.awayShots,
    });
  }

  // Add shots on target
  if (match.homeShotsOnTarget > 0 || match.awayShotsOnTarget > 0) {
    stats.push({
      label: 'Shots on Target',
      home: match.homeShotsOnTarget,
      away: match.awayShotsOnTarget,
    });
  }

  // Add corners
  if (match.homeCorners > 0 || match.awayCorners > 0) {
    stats.push({
      label: 'Corners',
      home: match.homeCorners,
      away: match.awayCorners,
    });
  }

  // Add fouls
  if (match.homeFouls > 0 || match.awayFouls > 0) {
    stats.push({
      label: 'Fouls',
      home: match.homeFouls,
      away: match.awayFouls,
    });
  }

  // Add offsides
  if (match.homeOffsides > 0 || match.awayOffsides > 0) {
    stats.push({
      label: 'Offsides',
      home: match.homeOffsides,
      away: match.awayOffsides,
    });
  }

  // Add yellow cards
  if (match.homeYellowCards > 0 || match.awayYellowCards > 0) {
    stats.push({
      label: 'Yellow Cards',
      home: match.homeYellowCards,
      away: match.awayYellowCards,
    });
  }

  // Add red cards
  if (match.homeRedCards > 0 || match.awayRedCards > 0) {
    stats.push({
      label: 'Red Cards',
      home: match.homeRedCards,
      away: match.awayRedCards,
    });
  }

  // Add any additional stats from the statistics array
  if (statistics && statistics.length > 0) {
    statistics.forEach((stat) => {
      const existingIndex = stats.findIndex(
        (s) => s.label.toLowerCase() === stat.name.toLowerCase()
      );
      if (existingIndex === -1) {
        stats.push({
          label: stat.name,
          home: typeof stat.homeValue === 'number' ? stat.homeValue : parseInt(stat.homeValue as string) || 0,
          away: typeof stat.awayValue === 'number' ? stat.awayValue : parseInt(stat.awayValue as string) || 0,
          isPercentage: stat.name.toLowerCase().includes('possession') || stat.name.toLowerCase().includes('%'),
        });
      }
    });
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Match Statistics</h3>
          </div>
        </div>
      </div>

      {/* Team Headers */}
      <div className="flex justify-between items-center px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          {match.homeTeamBadge && (
            <img
              src={match.homeTeamBadge}
              alt={homeTeam}
              className="w-6 h-6 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="text-sm font-semibold text-foreground truncate max-w-[100px] sm:max-w-none">
            {homeTeam}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate max-w-[100px] sm:max-w-none text-right">
            {awayTeam}
          </span>
          {match.awayTeamBadge && (
            <img
              src={match.awayTeamBadge}
              alt={awayTeam}
              className="w-6 h-6 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      </div>

      {/* Stats Bars */}
      <div className="p-4">
        {stats.map((stat, index) => (
          <StatBar
            key={index}
            label={stat.label}
            homeValue={stat.home}
            awayValue={stat.away}
            isPercentage={stat.isPercentage}
          />
        ))}
      </div>
    </div>
  );
};

export default MatchStats;
