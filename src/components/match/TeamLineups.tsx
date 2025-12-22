import React, { useState } from 'react';
import { MatchLineups, LineupPlayer } from '@/hooks/useSportsDBMatch';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamLineupsProps {
  lineups: MatchLineups;
  homeTeam: string;
  awayTeam: string;
  homeFormation?: string;
  awayFormation?: string;
}

const TeamLineups: React.FC<TeamLineupsProps> = ({
  lineups,
  homeTeam,
  awayTeam,
  homeFormation,
  awayFormation,
}) => {
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');

  const homeStarters = lineups.home.filter((p) => !p.isSub);
  const homeSubs = lineups.home.filter((p) => p.isSub);
  const awayStarters = lineups.away.filter((p) => !p.isSub);
  const awaySubs = lineups.away.filter((p) => p.isSub);

  const getPositionRow = (position: string): number => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('goal') || pos === 'gk') return 0;
    if (pos.includes('def') || pos === 'cb' || pos === 'rb' || pos === 'lb') return 1;
    if (pos.includes('mid') || pos === 'cm' || pos === 'dm' || pos === 'am') return 2;
    if (pos.includes('for') || pos.includes('wing') || pos === 'st' || pos === 'cf' || pos === 'lw' || pos === 'rw') return 3;
    return 2;
  };

  const PlayerBadge: React.FC<{ player: LineupPlayer; isHome: boolean }> = ({ player, isHome }) => (
    <div className={`flex flex-col items-center ${isHome ? 'text-green-300' : 'text-blue-300'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isHome ? 'bg-green-600' : 'bg-blue-600'
      }`}>
        {player.number || '?'}
      </div>
      <span className="text-[10px] mt-1 text-center max-w-[60px] truncate text-white">
        {player.name.split(' ').pop()}
      </span>
    </div>
  );

  const renderPitchView = () => {
    const rows = [
      { label: 'GK', homeRow: 0, awayRow: 3 },
      { label: 'DEF', homeRow: 1, awayRow: 2 },
      { label: 'MID', homeRow: 2, awayRow: 1 },
      { label: 'FWD', homeRow: 3, awayRow: 0 },
    ];

    return (
      <div className="relative w-full aspect-[3/4] max-w-xl mx-auto rounded-lg overflow-hidden bg-gradient-to-b from-green-800 via-green-700 to-green-800">
        {/* Pitch markings */}
        <div className="absolute inset-0 border-2 border-white/30 m-2">
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          {/* Penalty areas */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-b-2 border-l-2 border-r-2 border-white/30" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-t-2 border-l-2 border-r-2 border-white/30" />
        </div>

        {/* Home team (top half) */}
        <div className="absolute top-2 left-0 right-0 h-[48%] flex flex-col justify-between p-2">
          {rows.map((row) => {
            const players = homeStarters.filter((p) => getPositionRow(p.position) === row.homeRow);
            if (players.length === 0) return null;
            return (
              <div key={`home-${row.homeRow}`} className="flex justify-around items-center">
                {players.map((player, i) => (
                  <PlayerBadge key={i} player={player} isHome />
                ))}
              </div>
            );
          })}
        </div>

        {/* Away team (bottom half) */}
        <div className="absolute bottom-2 left-0 right-0 h-[48%] flex flex-col justify-between p-2">
          {rows.map((row) => {
            const players = awayStarters.filter((p) => getPositionRow(p.position) === row.awayRow);
            if (players.length === 0) return null;
            return (
              <div key={`away-${row.awayRow}`} className="flex justify-around items-center">
                {players.map((player, i) => (
                  <PlayerBadge key={i} player={player} isHome={false} />
                ))}
              </div>
            );
          })}
        </div>

        {/* Team labels */}
        <div className="absolute top-1 left-2 text-xs text-white/70 font-medium">
          {homeTeam} {homeFormation && `(${homeFormation})`}
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-white/70 font-medium">
          {awayTeam} {awayFormation && `(${awayFormation})`}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Home Team */}
      <div>
        <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
          {homeTeam}
          {homeFormation && (
            <span className="text-xs font-normal text-muted-foreground">({homeFormation})</span>
          )}
        </h4>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Starting XI</p>
          {homeStarters.map((player, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {player.number || '-'}
                </span>
                <span className="text-sm text-foreground">{player.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{player.positionShort || player.position}</span>
            </div>
          ))}
          {homeSubs.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-4 mb-2">Substitutes</p>
              {homeSubs.map((player, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {player.number || '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">{player.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{player.positionShort || player.position}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Away Team */}
      <div>
        <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
          {awayTeam}
          {awayFormation && (
            <span className="text-xs font-normal text-muted-foreground">({awayFormation})</span>
          )}
        </h4>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Starting XI</p>
          {awayStarters.map((player, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {player.number || '-'}
                </span>
                <span className="text-sm text-foreground">{player.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{player.positionShort || player.position}</span>
            </div>
          ))}
          {awaySubs.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-4 mb-2">Substitutes</p>
              {awaySubs.map((player, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {player.number || '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">{player.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{player.positionShort || player.position}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!lineups.home.length && !lineups.away.length) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Lineups
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Lineups not yet available. They will appear here once announced.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Lineups
        </h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'pitch' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pitch')}
            className="text-xs h-7"
          >
            Pitch View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="text-xs h-7"
          >
            List View
          </Button>
        </div>
      </div>

      {viewMode === 'pitch' ? renderPitchView() : renderListView()}
    </div>
  );
};

export default TeamLineups;
